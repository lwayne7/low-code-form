import {
  closestCenter,
  pointerWithin,
  rectIntersection,
  type CollisionDetection,
  type Collision,
  type DroppableContainer,
} from '@dnd-kit/core';

import { CONTAINER_EDGE_RATIO, MAX_EDGE_HEIGHT, MIN_EDGE_HEIGHT } from '../constants/dnd';

type Rect = { top: number; left: number; width: number; height: number };
type Point = { x: number; y: number };
type DndData = { depth?: number; parentId?: string | null };

// ============ 辅助函数 ============

const getDepthFromContainer = (container: DroppableContainer): number => {
  const data = container.data.current as DndData | undefined;
  return data?.depth ?? 0;
};

const getActiveDepth = (active: { data: { current?: unknown } }): number => {
  const data = active.data.current as DndData | undefined;
  return data?.depth ?? 0;
};

const getParentIdFromContainer = (container: DroppableContainer): string | null | undefined => {
  const data = container.data.current as DndData | undefined;
  return data?.parentId;
};

const getEdgeHeight = (height: number) => {
  if (!Number.isFinite(height) || height <= 0) return 0;
  const raw = Math.max(height * CONTAINER_EDGE_RATIO, MIN_EDGE_HEIGHT);
  return Math.min(raw, MAX_EDGE_HEIGHT, height / 2);
};

const buildLookups = (containers: DroppableContainer[]) => {
  const depthById = new Map<string, number>();
  const rectById = new Map<string, Rect | undefined>();
  const parentById = new Map<string, string | null | undefined>();
  const containerById = new Map<string, DroppableContainer>();

  for (const container of containers) {
    const id = String(container.id);
    containerById.set(id, container);
    depthById.set(id, getDepthFromContainer(container));
    rectById.set(id, (container.rect.current as Rect | null) ?? undefined);

    // 仅记录 sortable item 的 parentId（用于过滤“拖入自身后代”）
    if (!id.startsWith('container-') && id !== 'canvas-droppable') {
      parentById.set(id, getParentIdFromContainer(container));
    }
  }

  return { depthById, rectById, parentById, containerById };
};

/**
 * 计算点到矩形中心的距离（平方）
 */
const getDistanceSqToCenter = (rect: Rect, point: Point): number => {
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const dx = point.x - centerX;
  const dy = point.y - centerY;
  return dx * dx + dy * dy;
};

const sortCollisions = (
  collisions: Collision[],
  lookups: ReturnType<typeof buildLookups>,
  pointerCoordinates?: Point
): Collision[] => {
  const { depthById, rectById } = lookups;
  const distanceSqById = new Map<string, number>();

  if (pointerCoordinates) {
    for (const collision of collisions) {
      const id = String(collision.id);
      const rect = rectById.get(id);
      if (rect) distanceSqById.set(id, getDistanceSqToCenter(rect, pointerCoordinates));
    }
  }

  return [...collisions].sort((a, b) => {
    const idA = String(a.id);
    const idB = String(b.id);

    const depthA = depthById.get(idA) ?? 0;
    const depthB = depthById.get(idB) ?? 0;
    if (depthB !== depthA) return depthB - depthA;

    const distA = distanceSqById.get(idA);
    const distB = distanceSqById.get(idB);
    if (distA !== undefined && distB !== undefined && distA !== distB) {
      return distA - distB;
    }

    return (b.data?.value ?? 0) - (a.data?.value ?? 0);
  });
};

const getBaseItemId = (id: string) => {
  if (id.startsWith('container-')) return id.slice('container-'.length);
  return id;
};

const isDescendantByParentMap = (
  candidateId: string,
  ancestorId: string,
  parentById: Map<string, string | null | undefined>
): boolean => {
  let current = candidateId;
  for (let i = 0; i < 50; i++) {
    const parent = parentById.get(current);
    if (parent == null) return false;
    if (parent === ancestorId) return true;
    current = parent;
  }
  return false;
};

// DEV-only 碰撞检测命中率统计
const collisionStats = { total: 0, hits: 0, fallbacks: 0 };

if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).__collisionStats = collisionStats;
}

/**
 * 🔧 改进的自定义碰撞检测
 *
 * 核心策略：
 * 1. 过滤被拖动元素自身及其子元素
 * 2. 优先使用 pointerWithin 进行精确检测
 * 3. 优先返回最近的非容器组件（精确插入）
 * 4. 对于容器组件，根据鼠标在容器中的位置决定返回哪个 droppable:
 *    - 边缘区域（上下各25%）: 返回容器的 sortable item，用于排序
 *    - 中心区域（中间50%）: 返回 container-xxx，用于放入容器内
 * 5. 深度优先 + 距离优先：优先返回层级更深且距离更近的容器
 */
export const customCollisionDetection: CollisionDetection = (args) => {
  const { droppableContainers, active, pointerCoordinates } = args;
  const activeId = String(active.id);
  const activeDepth = getActiveDepth(active);

  if (import.meta.env.DEV) collisionStats.total++;

  const lookupsAll = buildLookups(droppableContainers);

  // 🔧 过滤掉被拖拽的组件自身、其容器 droppable，以及其后代（避免拖入自身内部）
  const filteredContainers = droppableContainers.filter((container) => {
    const containerId = String(container.id);

    // 排除被拖拽的组件自身（作为 sortable）
    if (containerId === activeId) return false;

    // 排除被拖拽组件对应的容器 droppable（如果它是容器的话）
    if (containerId === `container-${activeId}`) return false;

    // 🆕 排除被拖动元素的后代（基于 parentId 链，而不是 DOM rect 关系，避免拖拽过程中排序导致误判）
    const baseId = getBaseItemId(containerId);
    if (baseId !== containerId && baseId === activeId) return false;
    if (baseId !== 'canvas-droppable') {
      const containerDepth = getDepthFromContainer(container);
      if (
        containerDepth > activeDepth &&
        isDescendantByParentMap(baseId, activeId, lookupsAll.parentById)
      ) {
        return false;
      }
    }

    return true;
  });

  const filteredArgs = { ...args, droppableContainers: filteredContainers };
  const lookups = buildLookups(filteredContainers);
  const droppableIdSet = new Set(filteredContainers.map((c) => String(c.id)));

  // 使用 pointerWithin 进行精确检测
  let collisions: Collision[] = pointerWithin(filteredArgs);

  // 如果没有 pointer 碰撞，尝试 rectIntersection
  if (collisions.length === 0) {
    collisions = rectIntersection(filteredArgs);
  }

  // 如果仍然没有结果，使用 closestCenter
  if (collisions.length === 0) {
    if (import.meta.env.DEV) collisionStats.fallbacks++;
    return closestCenter(filteredArgs);
  }

  if (import.meta.env.DEV) collisionStats.hits++;

  // 分类碰撞结果
  const containerDroppables = collisions.filter((c) => String(c.id).startsWith('container-'));

  const itemCollisions = collisions.filter((c) => {
    const id = String(c.id);
    return !id.startsWith('container-') && id !== 'canvas-droppable';
  });

  const canvasCollision = collisions.find((c) => String(c.id) === 'canvas-droppable');

  // 判断一个 item 是否是容器组件
  const isContainerItem = (itemId: string): boolean => {
    return droppableIdSet.has(`container-${itemId}`);
  };

  // 分离容器和非容器 items
  const nonContainerItems = itemCollisions.filter((c) => !isContainerItem(String(c.id)));
  const containerItems = itemCollisions.filter((c) => isContainerItem(String(c.id)));

  // 构建 container-xxx 对应关系（基于当前 collisions，优先使用已有 collision descriptor）
  const containerDroppableMap = new Map<string, Collision>();
  for (const collision of containerDroppables) {
    containerDroppableMap.set(String(collision.id), collision);
  }

  // === 1. 容器边缘优先（即使鼠标在子元素上，也允许命中父层“插入/排序”）===
  if (pointerCoordinates && containerItems.length > 0) {
    const sortedContainerItems = sortCollisions(containerItems, lookups, pointerCoordinates);
    for (const targetContainerItem of sortedContainerItems) {
      const targetContainerId = String(targetContainerItem.id);
      const rect = lookups.rectById.get(targetContainerId);
      if (!rect) continue;

      const edgeHeight = getEdgeHeight(rect.height);
      const topEdge = rect.top + edgeHeight;
      const bottomEdge = rect.top + rect.height - edgeHeight;
      const pointerY = pointerCoordinates.y;

      const isInEdgeZone = pointerY < topEdge || pointerY > bottomEdge;
      if (isInEdgeZone) return [targetContainerItem];
    }
  }

  // === 2. 优先返回非容器组件（用于精确插入位置）===
  if (nonContainerItems.length > 0) {
    const sorted = sortCollisions(nonContainerItems, lookups, pointerCoordinates ?? undefined);
    return [sorted[0]];
  }

  // === 3. 容器中心优先命中 container-xxx（提升“放入容器”稳定性）===
  if (containerItems.length > 0) {
    const sortedContainerItems = sortCollisions(
      containerItems,
      lookups,
      pointerCoordinates ?? undefined
    );
    if (!pointerCoordinates) return [sortedContainerItems[0]];

    for (const targetContainerItem of sortedContainerItems) {
      const targetContainerId = String(targetContainerItem.id);
      const rect = lookups.rectById.get(targetContainerId);
      if (!rect) continue;

      const edgeHeight = getEdgeHeight(rect.height);
      const topEdge = rect.top + edgeHeight;
      const bottomEdge = rect.top + rect.height - edgeHeight;
      const pointerY = pointerCoordinates.y;
      const isInEdgeZone = pointerY < topEdge || pointerY > bottomEdge;

      if (!isInEdgeZone) {
        const droppableId = `container-${targetContainerId}`;
        const existing = containerDroppableMap.get(droppableId);
        if (existing) return [existing];

        const droppableContainer = lookups.containerById.get(droppableId);
        if (droppableContainer) {
          return [
            {
              id: droppableContainer.id,
              data: { droppableContainer, value: 0 },
            },
          ];
        }
      }

      return [targetContainerItem];
    }
  }

  // === 4. 只有 container-xxx droppable（可能是空容器或鼠标在内容区）===
  if (containerDroppables.length > 0) {
    return [sortCollisions(containerDroppables, lookups, pointerCoordinates ?? undefined)[0]];
  }

  // === 5. 只有容器 sortable items ===
  if (containerItems.length > 0) {
    return [sortCollisions(containerItems, lookups, pointerCoordinates ?? undefined)[0]];
  }

  // === 6. 返回画布 ===
  if (canvasCollision) {
    return [canvasCollision];
  }

  if (import.meta.env.DEV) collisionStats.fallbacks++;
  return closestCenter(filteredArgs);
};
