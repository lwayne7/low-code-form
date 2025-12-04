import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import type { ComponentSchema, ComponentType } from './types';
import { arrayMove } from '@dnd-kit/sortable';

// 导入辅助函数
import { 
  findComponentById, 
  flattenComponents 
} from './utils/componentHelpers';
import { validateValue } from './utils/validation';
import { createComponent, cloneComponentWithNewId } from './utils/componentFactory';

interface HistoryState {
  past: ComponentSchema[][];
  future: ComponentSchema[][];
}

/** 历史记录最大条数 */
const MAX_HISTORY_LENGTH = 50;

// 🆕 校验错误类型
interface ValidationError {
  componentId: string;
  message: string;
}

// 🆕 自定义模板类型
export interface CustomTemplate {
  id: string;
  name: string;
  description: string;
  components: ComponentSchema[];
  createdAt: number;
}

interface State {
  components: ComponentSchema[];
  selectedIds: string[];
  formValues: Record<string, any>; // 表单值状态
  validationErrors: Record<string, string>; // 校验错误 { [componentId]: errorMessage }
  clipboard: ComponentSchema[]; // 🆕 剪贴板
  history: HistoryState;
  customTemplates: CustomTemplate[]; // 🆕 自定义模板

  addComponent: (type: ComponentType, parentId?: string, index?: number) => void;
  addComponents: (components: ComponentSchema[]) => void; // 🆕 批量添加组件
  selectComponent: (id: string, multiSelect?: boolean) => void;
  selectAll: () => void; // 🆕 全选
  clearSelection: () => void;
  updateComponentProps: (id: string, newProps: Partial<ComponentSchema['props']>) => void;
  deleteComponent: (ids: string | string[]) => void;
  reorderComponents: (activeId: string, overId: string) => void;
  moveComponent: (activeId: string, targetContainerId: string | null, index?: number) => void;
  moveComponentInList: (id: string, direction: 'up' | 'down' | 'top' | 'bottom') => void; // 🆕 列表内移动
  cutComponents: () => void; // 🆕 剪切
  resetCanvas: () => void; // 🆕 重置画布
  importComponents: (components: ComponentSchema[]) => void; // 🆕 导入组件
  toggleLock: (id: string) => void; // 🆕 切换锁定状态
  setFormValue: (id: string, value: any) => void;
  getFormValues: () => Record<string, any>;
  
  // 🆕 复制/粘贴
  copyComponents: () => void; // 复制选中组件到剪贴板
  pasteComponents: () => void; // 粘贴剪贴板内容
  duplicateComponents: () => void; // 复制并粘贴（Cmd+D）
  
  // 🆕 自定义模板
  saveAsTemplate: (name: string, description?: string) => void;
  deleteTemplate: (id: string) => void;
  
  // 校验相关
  validateField: (id: string) => string | null;
  validateForm: () => ValidationError[];
  clearValidationError: (id: string) => void;
  clearAllValidationErrors: () => void;
  
  undo: () => void;
  redo: () => void;
}

// 辅助函数：递归查找父组件并插入子组件
const addComponentToParent = (components: ComponentSchema[], parentId: string, newComponent: ComponentSchema, index?: number): ComponentSchema[] => {
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

// ... (removeComponents, updateComponentInTree, reorderInList remain same)
const removeComponents = (components: ComponentSchema[], idsToDelete: string[]): ComponentSchema[] => {
  return components
    .filter(c => !idsToDelete.includes(c.id))
    .map(c => ({
      ...c,
      children: c.children ? removeComponents(c.children, idsToDelete) : undefined
    }));
};

const updateComponentInTree = (components: ComponentSchema[], id: string, newProps: any): ComponentSchema[] => {
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

const reorderInList = (list: ComponentSchema[], activeId: string, overId: string): ComponentSchema[] => {
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
 * @param pastHistory 现有历史记录
 * @param currentState 当前状态
 * @returns 新的历史记录
 */
const createNewPast = (pastHistory: ComponentSchema[][], currentState: ComponentSchema[]): ComponentSchema[][] => {
  const newPast = [...pastHistory, currentState];
  // 限制历史记录长度，防止内存溢出
  if (newPast.length > MAX_HISTORY_LENGTH) {
    return newPast.slice(-MAX_HISTORY_LENGTH);
  }
  return newPast;
};

// 🆕 使用工厂函数创建组件（从 componentFactory.ts 导入）
// createComponent 和 cloneComponentWithNewId 已从 utils/componentFactory.ts 导入

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      components: [] as ComponentSchema[],
      selectedIds: [] as string[],
      formValues: {} as Record<string, any>,
      validationErrors: {} as Record<string, string>,
      clipboard: [] as ComponentSchema[], // 🆕 剪贴板
      customTemplates: [] as CustomTemplate[], // 🆕 自定义模板
      history: {
        past: [] as ComponentSchema[][],
        future: [] as ComponentSchema[][],
      },

      // ⚠️ 修改签名：增加 index 参数
      addComponent: (type, parentId, index) => set((state) => {
        const newComponent = createComponent(type);
        if (!newComponent) return state;
        
        const newPast = createNewPast(state.history.past, state.components);

        let newComponents = [];
        if (parentId) {
          newComponents = addComponentToParent(state.components, parentId, newComponent, index);
        } else {
          // ⚠️ 顶层插入逻辑
          newComponents = [...state.components];
          if (typeof index === 'number' && index >= 0) {
            newComponents.splice(index, 0, newComponent);
          } else {
            newComponents.push(newComponent);
          }
        }

        return { 
          components: newComponents,
          selectedIds: [newComponent.id],
          history: {
            past: newPast,
            future: []
          }
        };
      }),

      selectComponent: (id, multiSelect = false) => set((state) => {
        if (multiSelect) {
          if (state.selectedIds.includes(id)) {
            return { selectedIds: state.selectedIds.filter(sid => sid !== id) };
          } else {
            return { selectedIds: [...state.selectedIds, id] };
          }
        } else {
          return { selectedIds: [id] };
        }
      }),

      clearSelection: () => set({ selectedIds: [] }),

      // 🆕 全选
      selectAll: () => set((state) => ({
        selectedIds: flattenComponents(state.components).map(c => c.id)
      })),

      updateComponentProps: (id, newProps) => set((state) => {
        const newPast = createNewPast(state.history.past, state.components);
        return {
          components: updateComponentInTree(state.components, id, newProps),
          history: {
            past: newPast,
            future: []
          }
        };
      }),

      deleteComponent: (ids) => set((state) => {
        const idsToDelete = Array.isArray(ids) ? ids : [ids];
        if (idsToDelete.length === 0) return {};

        const newPast = createNewPast(state.history.past, state.components);
        return {
          components: removeComponents(state.components, idsToDelete),
          selectedIds: state.selectedIds.filter(sid => !idsToDelete.includes(sid)),
          history: {
            past: newPast,
            future: []
          }
        };
      }),

      reorderComponents: (activeId, overId) => set((state) => {
        const newPast = createNewPast(state.history.past, state.components);
        return {
          components: reorderInList(state.components, activeId, overId),
          history: {
            past: newPast,
            future: []
          }
        };
      }),

      // 移动组件到容器内（支持跨容器移动）
      moveComponent: (activeId, targetContainerId, index) => set((state) => {
        const newPast = createNewPast(state.history.past, state.components);
        
        // 1. 找到要移动的组件
        const findAndRemove = (list: ComponentSchema[], id: string): { removed: ComponentSchema | null, rest: ComponentSchema[] } => {
          let removed: ComponentSchema | null = null;
          const rest = list.filter(c => {
            if (c.id === id) {
              removed = c;
              return false;
            }
            return true;
          }).map(c => {
            if (c.children && !removed) {
              const result = findAndRemove(c.children, id);
              if (result.removed) {
                removed = result.removed;
                return { ...c, children: result.rest };
              }
            }
            return c;
          });
          return { removed, rest };
        };

        const { removed, rest } = findAndRemove(state.components, activeId);
        if (!removed) return {};

        // 2. 插入到目标位置
        let newComponents: ComponentSchema[];
        if (targetContainerId === null) {
          // 插入到顶层
          newComponents = [...rest];
          if (typeof index === 'number') {
            newComponents.splice(index, 0, removed);
          } else {
            newComponents.push(removed);
          }
        } else {
          // 插入到容器内
          newComponents = addComponentToParent(rest, targetContainerId, removed, index);
        }

        return {
          components: newComponents,
          history: {
            past: newPast,
            future: []
          }
        };
      }),

      setFormValue: (id, value) => set((state) => ({
        formValues: { ...state.formValues, [id]: value }
      })),

      getFormValues: (): Record<string, any> => {
        return get().formValues;
      },

      // 🆕 批量添加组件
      addComponents: (newComponents: ComponentSchema[]) => set((state) => {
        const newPast = createNewPast(state.history.past, state.components);
        return {
          components: [...state.components, ...newComponents],
          selectedIds: newComponents.map(c => c.id),
          history: { past: newPast, future: [] }
        };
      }),

      // 🆕 复制选中组件到剪贴板
      copyComponents: () => set((state) => {
        const componentsToCopy = state.selectedIds
          .map(id => findComponentById(state.components, id))
          .filter((c): c is ComponentSchema => c !== null);
        return { clipboard: componentsToCopy };
      }),

      // 🆕 粘贴剪贴板内容
      pasteComponents: () => set((state) => {
        if (state.clipboard.length === 0) return {};
        
        const newPast = createNewPast(state.history.past, state.components);
        const clonedComponents = state.clipboard.map(cloneComponentWithNewId);
        
        return {
          components: [...state.components, ...clonedComponents],
          selectedIds: clonedComponents.map(c => c.id),
          history: { past: newPast, future: [] }
        };
      }),

      // 🆕 复制并粘贴（Cmd+D）
      duplicateComponents: () => set((state) => {
        if (state.selectedIds.length === 0) return {};
        
        const newPast = createNewPast(state.history.past, state.components);
        const componentsToDuplicate = state.selectedIds
          .map(id => findComponentById(state.components, id))
          .filter((c): c is ComponentSchema => c !== null);
        
        const clonedComponents = componentsToDuplicate.map(cloneComponentWithNewId);
        
        return {
          components: [...state.components, ...clonedComponents],
          selectedIds: clonedComponents.map(c => c.id),
          history: { past: newPast, future: [] }
        };
      }),

      // 🆕 剪切组件
      cutComponents: () => set((state) => {
        if (state.selectedIds.length === 0) return {};
        
        const newPast = createNewPast(state.history.past, state.components);
        const componentsToCut = state.selectedIds
          .map(id => findComponentById(state.components, id))
          .filter((c): c is ComponentSchema => c !== null);
        
        const clonedForClipboard = componentsToCut.map(cloneComponentWithNewId);
        const newComponents = removeComponents(state.components, state.selectedIds);
        
        return {
          components: newComponents,
          clipboard: clonedForClipboard,
          selectedIds: [],
          history: { past: newPast, future: [] }
        };
      }),

      // 🆕 在列表内移动组件（上/下/顶/底）
      moveComponentInList: (id: string, direction: 'up' | 'down' | 'top' | 'bottom') => set((state) => {
        const newPast = createNewPast(state.history.past, state.components);
        
        // 递归在组件树中移动
        const moveInList = (components: ComponentSchema[]): ComponentSchema[] => {
          const index = components.findIndex(c => c.id === id);
          
          if (index !== -1) {
            const newList = [...components];
            const [item] = newList.splice(index, 1);
            
            switch (direction) {
              case 'up':
                if (index > 0) newList.splice(index - 1, 0, item);
                else newList.splice(index, 0, item);
                break;
              case 'down':
                if (index < components.length - 1) newList.splice(index + 1, 0, item);
                else newList.splice(index, 0, item);
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
            children: c.children ? moveInList(c.children) : undefined
          }));
        };
        
        return {
          components: moveInList(state.components),
          history: { past: newPast, future: [] }
        };
      }),

      // 校验单个字段
      validateField: (id: string): string | null => {
        const state = get();
        const component = findComponentById(state.components, id);
        if (!component) return null;
        
        // 忽略不需要校验的组件类型
        if (['Container', 'Button'].includes(component.type)) return null;
        
        const value = state.formValues[id];
        const rules = component.props.rules;
        const label = ('label' in component.props) ? (component.props.label || '此项') : '此项';
        
        const error = validateValue(value, rules, label);
        
        set((s) => ({
          validationErrors: error 
            ? { ...s.validationErrors, [id]: error }
            : Object.fromEntries(Object.entries(s.validationErrors).filter(([key]) => key !== id))
        }));
        
        return error;
      },

      // 🆕 校验整个表单
      validateForm: (): ValidationError[] => {
        const state = get();
        const allComponents = flattenComponents(state.components);
        const errors: ValidationError[] = [];
        const newValidationErrors: Record<string, string> = {};
        
        allComponents.forEach((component) => {
          // 忽略不需要校验的组件类型
          if (['Container', 'Button'].includes(component.type)) return;
          
          const value = state.formValues[component.id];
          const rules = component.props.rules;
          const label = ('label' in component.props) ? (component.props.label || '此项') : '此项';
          
          const error = validateValue(value, rules, label);
          if (error) {
            errors.push({ componentId: component.id, message: error });
            newValidationErrors[component.id] = error;
          }
        });
        
        set({ validationErrors: newValidationErrors });
        return errors;
      },

      // 🆕 清除单个字段的校验错误
      clearValidationError: (id: string) => set((state) => ({
        validationErrors: Object.fromEntries(
          Object.entries(state.validationErrors).filter(([key]) => key !== id)
        )
      })),

      // 🆕 清除所有校验错误
      clearAllValidationErrors: () => set({ validationErrors: {} }),

      undo: () => set((state) => {
        if (state.history.past.length === 0) return {};
        const previous = state.history.past[state.history.past.length - 1];
        const newPast = state.history.past.slice(0, -1);
        return {
          components: previous,
          selectedIds: [], 
          history: {
            past: newPast,
            future: [state.components, ...state.history.future]
          }
        };
      }),

      redo: () => set((state) => {
        if (state.history.future.length === 0) return {};
        const next = state.history.future[0];
        const newFuture = state.history.future.slice(1);
        return {
          components: next,
          selectedIds: [],
          history: {
            past: [...state.history.past, state.components],
            future: newFuture
          }
        };
      }),

      // 🆕 重置画布
      resetCanvas: () => set((state) => {
        const newPast = state.components.length > 0 
          ? [...state.history.past, state.components] 
          : state.history.past;
        return {
          components: [],
          selectedIds: [],
          formValues: {},
          validationErrors: {},
          history: {
            past: newPast,
            future: []
          }
        };
      }),

      // 🆕 导入组件（替换当前画布）
      importComponents: (importedComponents: ComponentSchema[]) => set((state) => {
        const newPast = state.components.length > 0 
          ? [...state.history.past, state.components] 
          : state.history.past;
        
        // 为导入的组件生成新 ID，避免冲突
        const clonedComponents = importedComponents.map(cloneComponentWithNewId);
        
        return {
          components: clonedComponents,
          selectedIds: [],
          formValues: {},
          validationErrors: {},
          history: {
            past: newPast,
            future: []
          }
        };
      }),

      // 🆕 切换组件锁定状态
      toggleLock: (id: string) => set((state) => {
        const updateLock = (components: ComponentSchema[]): ComponentSchema[] => {
          return components.map(c => {
            if (c.id === id) {
              return { 
                ...c, 
                props: { ...c.props, locked: !c.props.locked } 
              } as typeof c;
            }
            if (c.children) {
              return { ...c, children: updateLock(c.children) } as typeof c;
            }
            return c;
          });
        };
        return { components: updateLock(state.components) };
      }),

      // 🆕 保存为自定义模板
      saveAsTemplate: (name: string, description?: string) => set((state) => {
        if (state.components.length === 0) return {};
        
        const newTemplate: CustomTemplate = {
          id: nanoid(),
          name,
          description: description || '',
          components: state.components.map(cloneComponentWithNewId),
          createdAt: Date.now(),
        };
        
        return {
          customTemplates: [...state.customTemplates, newTemplate]
        };
      }),

      // 🆕 删除自定义模板
      deleteTemplate: (id: string) => set((state) => ({
        customTemplates: state.customTemplates.filter(t => t.id !== id)
      }))
    }),
    {
      name: 'lowcode-storage', 
      partialize: (state) => ({ 
        components: state.components,
        customTemplates: state.customTemplates, // 🆕 持久化自定义模板
      }),
    }
  )
);
