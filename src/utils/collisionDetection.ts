import {
  closestCenter,
  pointerWithin,
  rectIntersection,
  type CollisionDetection,
  type Collision,
  type DroppableContainer,
} from '@dnd-kit/core';

// ============ 常量定义 ============
/** 容器边缘区域比例（上下各20%为边缘区域，中间60%为放入区域） */
const EDGE_ZONE_RATIO = 0.2;

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
 * 自定义碰撞检测：智能处理容器内外的拖拽
 * 
 * 核心策略：
 * 1. 非容器组件优先 - 用于精确插入位置
 * 2. 容器处理：根据鼠标位置判断是放入容器内还是排序
 * 3. 画布最低优先级
 */
export const customCollisionDetection: CollisionDetection = (args) => {
  const { droppableContainers, active, pointerCoordinates } = args;
  const activeId = String(active.id);

  // 过滤掉被拖拽的组件自身
  const filteredContainers = droppableContainers.filter((container) => {
    const containerId = String(container.id);
    // 排除被拖拽的组件自身（作为 sortable）
    if (containerId === activeId) return false;
    // 排除被拖拽组件对应的容器 droppable（如果它是容器的话）
    if (containerId === `container-${activeId}`) return false;
    return true;
  });

  // 使用过滤后的容器进行碰撞检测
  const filteredArgs = { ...args, droppableContainers: filteredContainers };

  // 使用 pointerWithin 进行精确检测
  const pointerCollisions = pointerWithin(filteredArgs);
  
  // 如果没有 pointer 碰撞，尝试 rectIntersection
  const collisions: Collision[] = pointerCollisions.length > 0 
    ? pointerCollisions 
    : rectIntersection(filteredArgs);

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

  // 判断一个 item 是否是容器（通过检查是否有对应的 container-xxx droppable）
  const isContainerItem = (itemId: string): boolean => {
    return filteredContainers.some(c => String(c.id) === `container-${itemId}`);
  };

  // 分离容器和非容器 items
  const nonContainerItems = itemCollisions.filter(c => !isContainerItem(String(c.id)));
  const containerItems = itemCollisions.filter(c => isContainerItem(String(c.id)));

  // 1. 优先返回非容器组件（用于精确插入）
  if (nonContainerItems.length > 0) {
    return [sortByDepthDesc(filteredContainers, nonContainerItems)[0]];
  }

  // 2. 处理容器：如果同时有容器 sortable 和 container-xxx droppable
  if (containerItems.length > 0 && containerDroppables.length > 0) {
    // 找到最深层的容器 sortable
    const targetContainerItem = sortByDepthDesc(filteredContainers, containerItems)[0];
    const targetContainerId = String(targetContainerItem.id);
    
    // 检查是否有对应的 container-xxx droppable
    const correspondingDroppable = containerDroppables.find(
      c => String(c.id) === `container-${targetContainerId}`
    );
    
    if (correspondingDroppable && pointerCoordinates) {
      // 获取容器 sortable 的矩形
      const containerRect = getRect(filteredContainers, targetContainerId);
      if (containerRect) {
        const { top, height } = containerRect;
        const pointerY = pointerCoordinates.y;
        
        // 边缘区域判断：上下各 EDGE_ZONE_RATIO 为边缘，中间为放入区域
        const topEdge = top + height * EDGE_ZONE_RATIO;
        const bottomEdge = top + height * (1 - EDGE_ZONE_RATIO);
        
        if (pointerY < topEdge || pointerY > bottomEdge) {
          // 边缘区域：返回容器 sortable 用于排序
          return [targetContainerItem];
        } else {
          // 中心区域：返回 container-xxx 用于放入容器
          return [correspondingDroppable];
        }
      }
    }
    
    // 默认返回 container-xxx droppable
    return [correspondingDroppable || targetContainerItem];
  }

  // 3. 如果只有 container-xxx droppable
  if (containerDroppables.length > 0) {
    return [sortByDepthDesc(filteredContainers, containerDroppables)[0]];
  }

  // 4. 如果只有容器 sortable items
  if (containerItems.length > 0) {
    return [sortByDepthDesc(filteredContainers, containerItems)[0]];
  }

  // 5. 返回画布
  if (canvasCollision) {
    return [canvasCollision];
  }

  return closestCenter(filteredArgs);
};
