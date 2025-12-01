/**
 * Store 辅助函数
 * 将 store.ts 中的辅助函数抽离，便于维护和测试
 */

import type { ComponentSchema } from '../types';
import { arrayMove } from '@dnd-kit/sortable';

/** 历史记录最大条数 */
export const MAX_HISTORY_LENGTH = 50;

/**
 * 递归查找父组件并插入子组件
 */
export const addComponentToParent = (
  components: ComponentSchema[], 
  parentId: string, 
  newComponent: ComponentSchema, 
  index?: number
): ComponentSchema[] => {
  return components.map((c) => {
    if (c.id === parentId) {
      if (c.type === 'Container') {
        const children = c.children || [];
        const newChildren = [...children];
        if (typeof index === 'number' && index >= 0) {
          newChildren.splice(index, 0, newComponent);
        } else {
          newChildren.push(newComponent);
        }
        return { ...c, children: newChildren };
      }
      return c;
    }
    if (c.children) {
      return { ...c, children: addComponentToParent(c.children, parentId, newComponent, index) };
    }
    return c;
  });
};

/**
 * 递归删除组件
 */
export const removeComponents = (
  components: ComponentSchema[], 
  idsToDelete: string[]
): ComponentSchema[] => {
  return components
    .filter(c => !idsToDelete.includes(c.id))
    .map(c => ({
      ...c,
      children: c.children ? removeComponents(c.children, idsToDelete) : undefined
    }));
};

/**
 * 递归更新组件属性
 */
export const updateComponentInTree = (
  components: ComponentSchema[], 
  id: string, 
  newProps: Partial<ComponentSchema['props']>
): ComponentSchema[] => {
  return components.map((c) => {
    if (c.id === id) {
      return { ...c, props: { ...c.props, ...newProps } } as ComponentSchema;
    }
    if (c.children) {
      return { ...c, children: updateComponentInTree(c.children, id, newProps) };
    }
    return c;
  });
};

/**
 * 在列表中重新排序组件
 */
export const reorderInList = (
  list: ComponentSchema[], 
  activeId: string, 
  overId: string
): ComponentSchema[] => {
  const oldIndex = list.findIndex((c) => c.id === activeId);
  const newIndex = list.findIndex((c) => c.id === overId);
  
  if (oldIndex !== -1 && newIndex !== -1) {
    return arrayMove(list, oldIndex, newIndex);
  }

  return list.map(c => {
    if (c.children) {
      return { ...c, children: reorderInList(c.children, activeId, overId) };
    }
    return c;
  });
};

/**
 * 创建新的历史记录（限制最大长度）
 */
export const createNewPast = (
  pastHistory: ComponentSchema[][], 
  currentState: ComponentSchema[]
): ComponentSchema[][] => {
  const newPast = [...pastHistory, currentState];
  if (newPast.length > MAX_HISTORY_LENGTH) {
    return newPast.slice(-MAX_HISTORY_LENGTH);
  }
  return newPast;
};

/**
 * 查找并移除组件（用于跨容器移动）
 */
export const findAndRemoveComponent = (
  list: ComponentSchema[], 
  id: string
): { removed: ComponentSchema | null; rest: ComponentSchema[] } => {
  let removed: ComponentSchema | null = null;
  const rest = list.filter(c => {
    if (c.id === id) {
      removed = c;
      return false;
    }
    return true;
  }).map(c => {
    if (c.children && !removed) {
      const result = findAndRemoveComponent(c.children, id);
      if (result.removed) {
        removed = result.removed;
        return { ...c, children: result.rest };
      }
    }
    return c;
  });
  return { removed, rest };
};

/**
 * 在列表内移动组件（上/下/顶/底）
 */
export const moveInList = (
  components: ComponentSchema[], 
  id: string, 
  direction: 'up' | 'down' | 'top' | 'bottom'
): ComponentSchema[] => {
  const index = components.findIndex(c => c.id === id);
  
  if (index !== -1) {
    const newList = [...components];
    const [item] = newList.splice(index, 1);
    
    switch (direction) {
      case 'up':
        newList.splice(Math.max(0, index - 1), 0, item);
        break;
      case 'down':
        newList.splice(Math.min(components.length - 1, index + 1), 0, item);
        break;
      case 'top':
        newList.unshift(item);
        break;
      case 'bottom':
        newList.push(item);
        break;
    }
    return newList;
  }
  
  // 递归处理子组件
  return components.map(c => ({
    ...c,
    children: c.children ? moveInList(c.children, id, direction) : undefined
  }));
};

/**
 * 递归更新组件锁定状态
 */
export const updateComponentLock = (
  components: ComponentSchema[], 
  id: string
): ComponentSchema[] => {
  return components.map(c => {
    if (c.id === id) {
      return { 
        ...c, 
        props: { ...c.props, locked: !c.props.locked } 
      } as typeof c;
    }
    if (c.children) {
      return { ...c, children: updateComponentLock(c.children, id) } as typeof c;
    }
    return c;
  });
};
