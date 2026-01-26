/**
 * 拖拽相关常量（多处模块共享）
 */

/** 容器边缘区域比例（用于判断 before/after/inside） */
export const CONTAINER_EDGE_RATIO = 0.25;

/** 最小边缘高度（像素），确保小容器也有足够的边缘区域 */
export const MIN_EDGE_HEIGHT = 20;

/** 最大边缘高度（像素），避免大容器边缘区过大导致难以放入/插入 */
export const MAX_EDGE_HEIGHT = 48;
