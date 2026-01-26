import {
  closestCenter,
  pointerWithin,
  rectIntersection,
  type CollisionDetection,
  type Collision,
  type DroppableContainer,
} from '@dnd-kit/core';

import { CONTAINER_EDGE_RATIO, MIN_EDGE_HEIGHT } from '../constants/dnd';

type Rect = { top: number; left: number; width: number; height: number };
type Point = { x: number; y: number };
type DepthData = { depth?: number };

// ============ 辅助函数 ============

const getDepthFromContainer = (container: DroppableContainer): number => {
  const data = container.data.current as DepthData | undefined;
  return data?.depth ?? 0;
};

const getActiveDepth = (active: { data: { current?: unknown } }): number => {
  const data = active.data.current as DepthData | undefined;
  return data?.depth ?? 0;
};

const buildLookups = (containers: DroppableContainer[]) => {
  const depthById = new Map<string, number>();
  const rectById = new Map<string, Rect | undefined>();

  for (const container of containers) {
    const id = String(container.id);
    depthById.set(id, getDepthFromContainer(container));
    rectById.set(id, (container.rect.current as Rect | null) ?? undefined);
  }

  return { depthById, rectById };
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

/**
 * 🆕 检查一个矩形是否完全包含在另一个矩形内
 * 用于检测 droppable 是否是被拖动元素的子元素
 */
const isRectContainedIn = (
  inner: Rect | undefined,
  outer: Rect | undefined,
  tolerance: number = 5 // 容差，处理边界情况
): boolean => {
  if (!inner || !outer) return false;
  
  const innerRight = inner.left + inner.width;
  const innerBottom = inner.top + inner.height;
  const outerRight = outer.left + outer.width;
  const outerBottom = outer.top + outer.height;
  
  return (
    inner.left >= outer.left - tolerance &&
    inner.top >= outer.top - tolerance &&
    innerRight <= outerRight + tolerance &&
    innerBottom <= outerBottom + tolerance
  );
};

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
  
  // 🆕 获取被拖动元素的原始矩形（用于检测子元素）
  const activeRect = active.rect.current?.initial as Rect | null | undefined;
  const activeDepth = getActiveDepth(active);

  // 🔧 过滤掉被拖拽的组件自身、其容器 droppable，以及其子元素
  const filteredContainers = droppableContainers.filter((container) => {
    const containerId = String(container.id);
    
    // 排除被拖拽的组件自身（作为 sortable）
    if (containerId === activeId) return false;
    
    // 排除被拖拽组件对应的容器 droppable（如果它是容器的话）
    if (containerId === `container-${activeId}`) return false;
    
    // 🆕 排除被拖动元素的子元素
    // 通过检查 droppable 的矩形是否完全在被拖动元素的原始矩形内来判断
    if (activeRect) {
      const containerRect = container.rect.current as Rect | null;
      if (containerRect && isRectContainedIn(containerRect, activeRect)) {
        const containerDepth = getDepthFromContainer(container);
        // 只有当目标深度大于被拖动元素时才排除（说明可能是子元素）
        if (containerDepth > activeDepth) {
          return false;
        }
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
    return closestCenter(filteredArgs);
  }

  // 分类碰撞结果
  const containerDroppables = collisions.filter((c) =>
    String(c.id).startsWith('container-')
  );

  const itemCollisions = collisions.filter((c) => {
    const id = String(c.id);
    return !id.startsWith('container-') && id !== 'canvas-droppable';
  });

  const canvasCollision = collisions.find(
    (c) => String(c.id) === 'canvas-droppable'
  );

  // 判断一个 item 是否是容器组件
  const isContainerItem = (itemId: string): boolean => {
    return droppableIdSet.has(`container-${itemId}`);
  };

  // 分离容器和非容器 items
  const nonContainerItems = itemCollisions.filter(c => !isContainerItem(String(c.id)));
  const containerItems = itemCollisions.filter(c => isContainerItem(String(c.id)));

  // === 1. 优先返回非容器组件（用于精确插入位置）===
  if (nonContainerItems.length > 0) {
    // 优先按深度排序，同深度按距离排序
    const sorted = sortCollisions(nonContainerItems, lookups, pointerCoordinates ?? undefined);
    return [sorted[0]];
  }

  // === 2. 处理容器组件的精确位置判断 ===
  if (containerItems.length > 0) {
    // 按深度排序，优先处理最深层的容器
    const sortedContainerItems = sortCollisions(containerItems, lookups, pointerCoordinates ?? undefined);

    // 没有指针坐标时，无法判断边缘/中心区域，直接返回最优容器
    if (!pointerCoordinates) return [sortedContainerItems[0]];

    // 预构建 container-xxx 对应关系（仅基于当前 collisions）
    const containerDroppableMap = new Map<string, Collision>();
    for (const c of containerDroppables) {
      containerDroppableMap.set(String(c.id), c);
    }

    for (const targetContainerItem of sortedContainerItems) {
      const targetContainerId = String(targetContainerItem.id);
      const containerRect = lookups.rectById.get(targetContainerId);
      
      if (!containerRect) continue;
      
      const { top, height } = containerRect;
      const pointerY = pointerCoordinates.y;
      
      // 🔧 动态计算边缘高度：取比例和最小值中的较大者
      const edgeHeight = Math.max(height * CONTAINER_EDGE_RATIO, MIN_EDGE_HEIGHT);
      const topEdge = top + edgeHeight;
      const bottomEdge = top + height - edgeHeight;
      
      // 检查是否有对应的 container-xxx droppable
      const correspondingDroppable = containerDroppableMap.get(`container-${targetContainerId}`);
      
      // 判断是在边缘还是中心
      const isInEdgeZone = pointerY < topEdge || pointerY > bottomEdge;
      
      if (!isInEdgeZone && correspondingDroppable) {
        // 🎯 中心区域：返回 container-xxx 用于放入容器内
        return [correspondingDroppable];
      }
      
      // 🎯 边缘区域：返回容器 sortable item 用于排序
      return [targetContainerItem];
    }
  }

  // === 3. 只有 container-xxx droppable（可能是空容器或鼠标在内容区）===
  if (containerDroppables.length > 0) {
    return [sortCollisions(containerDroppables, lookups, pointerCoordinates ?? undefined)[0]];
  }

  // === 4. 只有容器 sortable items ===
  if (containerItems.length > 0) {
    return [sortCollisions(containerItems, lookups, pointerCoordinates ?? undefined)[0]];
  }

  // === 5. 返回画布 ===
  if (canvasCollision) {
    return [canvasCollision];
  }

  return closestCenter(filteredArgs);
};
