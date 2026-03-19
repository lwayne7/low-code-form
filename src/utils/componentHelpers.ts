import type { ComponentSchema } from '../types';

// ============ 扁平索引（O(1) 查找） ============

export interface ComponentIndex {
  /** id → ComponentSchema 引用 */
  byId: Map<string, ComponentSchema>;
  /** id → parentId（null 表示顶层） */
  parentById: Map<string, string | null>;
  /** id → 嵌套深度（0 = 顶层） */
  depthById: Map<string, number>;
}

/**
 * 从组件树构建扁平索引
 * 每次组件树 mutation 后应重建
 */
export function buildComponentIndex(components: ComponentSchema[]): ComponentIndex {
  const byId = new Map<string, ComponentSchema>();
  const parentById = new Map<string, string | null>();
  const depthById = new Map<string, number>();

  const traverse = (items: ComponentSchema[], parentId: string | null, depth: number) => {
    for (const item of items) {
      byId.set(item.id, item);
      parentById.set(item.id, parentId);
      depthById.set(item.id, depth);
      if (item.children) {
        traverse(item.children, item.id, depth + 1);
      }
    }
  };

  traverse(components, null, 0);
  return { byId, parentById, depthById };
}

// ============ 基于索引的 O(1) 查找 ============

/**
 * O(1) 按 ID 查找组件（使用索引）
 * 降级：当未提供索引时退回 O(n) 递归
 */
export function findComponentById(
  list: ComponentSchema[],
  id: string,
  index?: ComponentIndex
): ComponentSchema | undefined {
  if (index) return index.byId.get(id);
  // 降级：递归遍历
  for (const item of list) {
    if (item.id === id) return item;
    if (item.children) {
      const found = findComponentById(item.children, id);
      if (found) return found;
    }
  }
  return undefined;
}

/**
 * O(1) 查找组件的父容器信息（使用索引）
 * 降级：当未提供索引时退回 O(n) 递归
 */
export function findParentInfo(
  components: ComponentSchema[],
  targetId: string,
  index?: ComponentIndex
): { parentId: string | null; index: number } {
  if (index) {
    const parentId = index.parentById.get(targetId);
    if (parentId === undefined) return { parentId: null, index: -1 };

    // 从 parentId 找到兄弟列表，定位 index
    const siblings = parentId === null ? components : (index.byId.get(parentId)?.children ?? []);
    const idx = siblings.findIndex((c) => c.id === targetId);
    return { parentId, index: idx };
  }

  // 降级：递归遍历
  const topIndex = components.findIndex((c) => c.id === targetId);
  if (topIndex !== -1) {
    return { parentId: null, index: topIndex };
  }

  const findInChildren = (items: ComponentSchema[]): { parentId: string; index: number } | null => {
    for (const item of items) {
      if (item.children) {
        const childIndex = item.children.findIndex((c) => c.id === targetId);
        if (childIndex !== -1) {
          return { parentId: item.id, index: childIndex };
        }
        const found = findInChildren(item.children);
        if (found) return found;
      }
    }
    return null;
  };

  const result = findInChildren(components);
  return result || { parentId: null, index: -1 };
}

/**
 * 判断 parentId 是否是 childId 的祖先（防止容器拖入自身内部）
 * 使用索引时为 O(depth) ≈ O(1)
 */
export function isDescendant(
  components: ComponentSchema[],
  parentId: string,
  childId: string,
  index?: ComponentIndex
): boolean {
  if (index) {
    // 沿 parentById 链向上查找，O(depth)
    let current = childId;
    for (let i = 0; i < 50; i++) {
      const pid = index.parentById.get(current);
      if (pid == null) return false;
      if (pid === parentId) return true;
      current = pid;
    }
    return false;
  }

  // 降级：递归遍历
  const parent = findComponentById(components, parentId);
  if (!parent?.children) return false;
  for (const child of parent.children) {
    if (child.id === childId) return true;
    if (isDescendant(components, child.id, childId)) return true;
  }
  return false;
}

/**
 * 获取所有组件的 ID 列表（包括嵌套组件）
 */
export function getAllComponentIds(components: ComponentSchema[]): string[] {
  const ids: string[] = [];
  const collect = (items: ComponentSchema[]) => {
    for (const item of items) {
      ids.push(item.id);
      if (item.children) {
        collect(item.children);
      }
    }
  };
  collect(components);
  return ids;
}

/**
 * 计算组件总数（包括嵌套组件）
 */
export function countComponents(components: ComponentSchema[]): number {
  return getAllComponentIds(components).length;
}

/**
 * 扁平化组件树（包括嵌套组件）
 */
export function flattenComponents(components: ComponentSchema[]): ComponentSchema[] {
  const result: ComponentSchema[] = [];
  const flatten = (items: ComponentSchema[]) => {
    for (const item of items) {
      result.push(item);
      if (item.children) {
        flatten(item.children);
      }
    }
  };
  flatten(components);
  return result;
}
