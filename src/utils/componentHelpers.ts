import type { ComponentSchema } from '../types';

/**
 * 递归查找组件
 */
export function findComponentById(
  list: ComponentSchema[],
  id: string
): ComponentSchema | undefined {
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
 * 查找组件的父容器信息
 */
export function findParentInfo(
  components: ComponentSchema[],
  targetId: string
): { parentId: string | null; index: number } {
  // 在顶层查找
  const topIndex = components.findIndex((c) => c.id === targetId);
  if (topIndex !== -1) {
    return { parentId: null, index: topIndex };
  }

  // 在容器内查找
  const findInChildren = (
    items: ComponentSchema[]
  ): { parentId: string; index: number } | null => {
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
 */
export function isDescendant(
  components: ComponentSchema[],
  parentId: string,
  childId: string
): boolean {
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
