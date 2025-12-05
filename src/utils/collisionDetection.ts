import {
  closestCenter,
  pointerWithin,
  rectIntersection,
  type CollisionDetection,
  type Collision,
  type DroppableContainer,
} from '@dnd-kit/core';

// ============ 常量定义 ============
/** 
 * 容器边缘区域比例
 * 与 App.tsx 中的 CONTAINER_EDGE_RATIO 保持一致
 * 上下各 25% 为边缘区域（用于排序），中间 50% 为放入区域
 */
const EDGE_ZONE_RATIO = 0.25;

/**
 * 最小边缘高度（像素）
 * 确保即使容器很小，边缘区域也有足够的高度
 */
const MIN_EDGE_HEIGHT = 20;

/**
 * 🆕 碰撞稳定性阈值（像素）
 * 当鼠标移动距离小于此值时，优先保持上一次的碰撞结果
 */
const STABILITY_THRESHOLD = 15;

// ============ 碰撞缓存 ============
let lastCollisionResult: Collision | null = null;
let lastPointerPosition: { x: number; y: number } | null = null;
let lastActiveId: string | null = null;

// ============ 辅助函数 ============

/** 获取深度信息 */
const getDepth = (containers: DroppableContainer[], collisionId: string): number => {
  const container = containers.find(c => String(c.id) === collisionId);
  if (!container?.data?.current) return 0;
  const data = container.data.current as { depth?: number };
  return data.depth ?? 0;
};

/** 获取容器的矩形区域 */
const getRect = (containers: DroppableContainer[], collisionId: string) => {
  const container = containers.find(c => String(c.id) === collisionId);
  return container?.rect?.current;
};

/** 按深度降序排序碰撞结果 */
const sortByDepthDesc = (containers: DroppableContainer[], collisions: Collision[]): Collision[] => {
  return [...collisions].sort((a, b) => {
    const depthA = getDepth(containers, String(a.id));
    const depthB = getDepth(containers, String(b.id));
    if (depthB !== depthA) return depthB - depthA;
    return (b.data?.value ?? 0) - (a.data?.value ?? 0);
  });
};

/**
 * 计算点到矩形中心的距离
 */
const getDistanceToCenter = (
  rect: { top: number; left: number; width: number; height: number },
  point: { x: number; y: number }
): number => {
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  return Math.sqrt(Math.pow(point.x - centerX, 2) + Math.pow(point.y - centerY, 2));
};

/**
 * 🆕 计算两点之间的距离
 */
const getDistance = (p1: { x: number; y: number }, p2: { x: number; y: number }): number => {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
};

/**
 * 🆕 检查上一次碰撞结果是否仍然有效
 */
const isLastCollisionStillValid = (
  containers: DroppableContainer[],
  pointerCoordinates: { x: number; y: number } | null,
  activeId: string
): boolean => {
  // 如果没有上次结果或者拖拽的是不同元素，则无效
  if (!lastCollisionResult || !lastPointerPosition || lastActiveId !== activeId) {
    return false;
  }
  
  // 如果没有当前指针坐标，则无效
  if (!pointerCoordinates) {
    return false;
  }
  
  // 检查上次碰撞的目标是否仍然存在
  const lastTargetId = String(lastCollisionResult.id);
  const targetStillExists = containers.some(c => String(c.id) === lastTargetId);
  if (!targetStillExists) {
    return false;
  }
  
  // 检查鼠标移动距离是否在阈值内
  const distance = getDistance(pointerCoordinates, lastPointerPosition);
  if (distance > STABILITY_THRESHOLD) {
    return false;
  }
  
  // 检查指针是否仍在上次目标的范围内
  const targetRect = getRect(containers, lastTargetId);
  if (!targetRect) {
    return false;
  }
  
  const { top, left, width, height } = targetRect;
  const isWithinBounds = 
    pointerCoordinates.x >= left && 
    pointerCoordinates.x <= left + width &&
    pointerCoordinates.y >= top && 
    pointerCoordinates.y <= top + height;
  
  return isWithinBounds;
};

/**
 * 🔧 改进的自定义碰撞检测
 * 
 * 核心策略：
 * 1. 稳定性优先：如果鼠标移动距离小且仍在目标范围内，保持上一次结果
 * 2. 优先使用 pointerWithin 进行精确检测
 * 3. 优先返回最近的非容器组件（精确插入）
 * 4. 对于容器组件，根据鼠标在容器中的位置决定返回哪个 droppable
 * 5. 深度优先 + 距离优先：优先返回层级更深且距离更近的容器
 */
export const customCollisionDetection: CollisionDetection = (args) => {
  const { droppableContainers, active, pointerCoordinates } = args;
  const activeId = String(active.id);

  // 🆕 重置拖拽时的缓存（当拖拽对象改变时）
  if (lastActiveId !== activeId) {
    lastCollisionResult = null;
    lastPointerPosition = null;
    lastActiveId = activeId;
  }

  // 过滤掉被拖拽的组件自身及其对应的容器 droppable
  const filteredContainers = droppableContainers.filter((container) => {
    const containerId = String(container.id);
    if (containerId === activeId) return false;
    if (containerId === `container-${activeId}`) return false;
    return true;
  });

  // 🆕 稳定性检查：如果上次结果仍有效，且鼠标移动距离小，保持上次结果
  if (
    pointerCoordinates &&
    lastCollisionResult &&
    lastPointerPosition &&
    isLastCollisionStillValid(filteredContainers, pointerCoordinates, activeId)
  ) {
    // 更新位置但保持结果
    lastPointerPosition = pointerCoordinates;
    return [lastCollisionResult];
  }

  const filteredArgs = { ...args, droppableContainers: filteredContainers };

  // 使用 pointerWithin 进行精确检测
  let collisions: Collision[] = pointerWithin(filteredArgs);
  
  // 如果没有 pointer 碰撞，尝试 rectIntersection
  if (collisions.length === 0) {
    collisions = rectIntersection(filteredArgs);
  }

  // 如果仍然没有结果，使用 closestCenter
  if (collisions.length === 0) {
    const result = closestCenter(filteredArgs);
    // 🆕 更新缓存
    if (result.length > 0 && pointerCoordinates) {
      lastCollisionResult = result[0];
      lastPointerPosition = pointerCoordinates;
    }
    return result;
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
    return filteredContainers.some(c => String(c.id) === `container-${itemId}`);
  };

  // 分离容器和非容器 items
  const nonContainerItems = itemCollisions.filter(c => !isContainerItem(String(c.id)));
  const containerItems = itemCollisions.filter(c => isContainerItem(String(c.id)));

  // 🆕 辅助函数：更新缓存并返回结果
  const returnWithCache = (result: Collision[]): Collision[] => {
    if (result.length > 0 && pointerCoordinates) {
      lastCollisionResult = result[0];
      lastPointerPosition = pointerCoordinates;
    }
    return result;
  };

  // === 1. 优先返回非容器组件（用于精确插入位置）===
  if (nonContainerItems.length > 0 && pointerCoordinates) {
    // 如果有多个非容器组件，返回距离最近的
    const sortedByDistance = [...nonContainerItems].sort((a, b) => {
      const rectA = getRect(filteredContainers, String(a.id));
      const rectB = getRect(filteredContainers, String(b.id));
      if (!rectA || !rectB) return 0;
      const distA = getDistanceToCenter(rectA, pointerCoordinates);
      const distB = getDistanceToCenter(rectB, pointerCoordinates);
      return distA - distB;
    });
    
    // 优先按深度排序，同深度按距离排序
    const sorted = sortByDepthDesc(filteredContainers, sortedByDistance);
    return returnWithCache([sorted[0]]);
  }

  // === 2. 处理容器组件的精确位置判断 ===
  if (containerItems.length > 0 && pointerCoordinates) {
    // 按深度排序，优先处理最深层的容器
    const sortedContainerItems = sortByDepthDesc(filteredContainers, containerItems);
    
    // 🔧 同时按距离排序，避免多个同深度容器时的抖动
    const sortedByDepthAndDistance = [...sortedContainerItems].sort((a, b) => {
      const depthA = getDepth(filteredContainers, String(a.id));
      const depthB = getDepth(filteredContainers, String(b.id));
      
      // 深度不同，深度大的优先
      if (depthB !== depthA) return depthB - depthA;
      
      // 深度相同，距离近的优先
      const rectA = getRect(filteredContainers, String(a.id));
      const rectB = getRect(filteredContainers, String(b.id));
      if (!rectA || !rectB) return 0;
      const distA = getDistanceToCenter(rectA, pointerCoordinates);
      const distB = getDistanceToCenter(rectB, pointerCoordinates);
      return distA - distB;
    });
    
    for (const targetContainerItem of sortedByDepthAndDistance) {
      const targetContainerId = String(targetContainerItem.id);
      const containerRect = getRect(filteredContainers, targetContainerId);
      
      if (!containerRect) continue;
      
      const { top, height } = containerRect;
      const pointerY = pointerCoordinates.y;
      
      // 🔧 动态计算边缘高度：取比例和最小值中的较大者
      const edgeHeight = Math.max(height * EDGE_ZONE_RATIO, MIN_EDGE_HEIGHT);
      const topEdge = top + edgeHeight;
      const bottomEdge = top + height - edgeHeight;
      
      // 检查是否有对应的 container-xxx droppable
      const correspondingDroppable = containerDroppables.find(
        c => String(c.id) === `container-${targetContainerId}`
      );
      
      // 判断是在边缘还是中心
      const isInEdgeZone = pointerY < topEdge || pointerY > bottomEdge;
      
      if (!isInEdgeZone && correspondingDroppable) {
        // 🎯 中心区域：返回 container-xxx 用于放入容器内
        return returnWithCache([correspondingDroppable]);
      }
      
      // 🎯 边缘区域：返回容器 sortable item 用于排序
      return returnWithCache([targetContainerItem]);
    }
  }

  // === 3. 只有 container-xxx droppable（可能是空容器或鼠标在内容区）===
  if (containerDroppables.length > 0) {
    return returnWithCache([sortByDepthDesc(filteredContainers, containerDroppables)[0]]);
  }

  // === 4. 只有容器 sortable items ===
  if (containerItems.length > 0) {
    return returnWithCache([sortByDepthDesc(filteredContainers, containerItems)[0]]);
  }

  // === 5. 返回画布 ===
  if (canvasCollision) {
    return returnWithCache([canvasCollision]);
  }

  return closestCenter(filteredArgs);
};
