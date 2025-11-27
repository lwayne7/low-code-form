import {
  closestCenter,
  pointerWithin,
  type CollisionDetection,
} from '@dnd-kit/core';

/**
 * 自定义碰撞检测：优先检测组件，然后是容器
 */
export const customCollisionDetection: CollisionDetection = (args) => {
  const { droppableContainers, active } = args;
  const activeId = String(active.id);

  // 获取鼠标指针碰撞的所有区域
  const pointerCollisions = pointerWithin(args);

  if (pointerCollisions.length === 0) {
    return closestCenter(args);
  }

  // 分类碰撞结果
  const containerCollisions = pointerCollisions.filter((collision) =>
    String(collision.id).startsWith('container-')
  );

  const itemCollisions = pointerCollisions.filter(
    (collision) =>
      !String(collision.id).startsWith('container-') &&
      String(collision.id) !== 'canvas-droppable'
  );

  // 辅助函数：从 droppableContainers 数组中获取容器的 depth
  const getContainerDepth = (containerId: string | number): number => {
    const container = droppableContainers.find((c) => c.id === containerId);
    return (container?.data?.current as any)?.depth ?? 0;
  };

  // 🔧 优先返回组件碰撞（用于精确位置判断）
  if (itemCollisions.length > 0) {
    // 如果有多个组件碰撞，选择最近的一个
    return [itemCollisions[0]];
  }

  // 然后检查容器碰撞
  if (containerCollisions.length > 0) {
    const sortedContainers = containerCollisions.sort((a, b) => {
      const depthA = getContainerDepth(a.id);
      const depthB = getContainerDepth(b.id);
      return depthB - depthA; // 优先最深层容器
    });

    // 检查是否拖入自己内部（防止容器拖入自身）
    const targetContainerId = String(sortedContainers[0].id).replace(
      'container-',
      ''
    );
    if (targetContainerId !== activeId) {
      return [sortedContainers[0]];
    }
    // 如果是拖入自身，尝试下一个容器
    if (sortedContainers.length > 1) {
      return [sortedContainers[1]];
    }
  }

  // 最后检查 canvas-droppable
  const canvasCollision = pointerCollisions.find(
    (c) => String(c.id) === 'canvas-droppable'
  );
  if (canvasCollision) {
    return [canvasCollision];
  }

  return closestCenter(args);
};
