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
 * 🔧 增大边缘区域，让排序更容易触发
 */
const EDGE_ZONE_RATIO = 0.25;

/**
 * 最小边缘高度（像素）
 * 确保即使容器很小，边缘区域也有足够的高度
 */
const MIN_EDGE_HEIGHT = 20;

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
 * 🆕 检查一个矩形是否完全包含在另一个矩形内
 * 用于检测 droppable 是否是被拖动元素的子元素
 */
const isRectContainedIn = (
  inner: { top: number; left: number; width: number; height: number } | undefined,
  outer: { top: number; left: number; width: number; height: number } | undefined,
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
  const activeRect = active.rect.current?.initial;

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
      const containerRect = container.rect.current;
      if (containerRect && isRectContainedIn(containerRect, activeRect)) {
        // 进一步检查：确保不是意外排除（检查深度）
        const containerDepth = getDepth([container], containerId);
        const activeDepth = (active.data.current as { depth?: number })?.depth ?? 0;
        
        // 只有当目标深度大于被拖动元素时才排除（说明可能是子元素）
        if (containerDepth > activeDepth) {
          return false;
        }
      }
    }
    
    return true;
  });

  const filteredArgs = { ...args, droppableContainers: filteredContainers };

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
    return filteredContainers.some(c => String(c.id) === `container-${itemId}`);
  };

  // 分离容器和非容器 items
  const nonContainerItems = itemCollisions.filter(c => !isContainerItem(String(c.id)));
  const containerItems = itemCollisions.filter(c => isContainerItem(String(c.id)));

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
    return [sorted[0]];
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
        return [correspondingDroppable];
      }
      
      // 🎯 边缘区域：返回容器 sortable item 用于排序
      return [targetContainerItem];
    }
  }

  // === 3. 只有 container-xxx droppable（可能是空容器或鼠标在内容区）===
  if (containerDroppables.length > 0) {
    return [sortByDepthDesc(filteredContainers, containerDroppables)[0]];
  }

  // === 4. 只有容器 sortable items ===
  if (containerItems.length > 0) {
    return [sortByDepthDesc(filteredContainers, containerItems)[0]];
  }

  // === 5. 返回画布 ===
  if (canvasCollision) {
    return [canvasCollision];
  }

  return closestCenter(filteredArgs);
};
