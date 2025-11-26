import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import type { ComponentSchema, ComponentType } from './types';
import { arrayMove } from '@dnd-kit/sortable';

interface HistoryState {
  past: ComponentSchema[][];
  future: ComponentSchema[][];
}

interface State {
  components: ComponentSchema[];
  selectedIds: string[];
  formValues: Record<string, any>; // 表单值状态
  history: HistoryState;

  addComponent: (type: ComponentType, parentId?: string, index?: number) => void; // ⚠️ 支持指定 index 插入
  selectComponent: (id: string, multiSelect?: boolean) => void;
  clearSelection: () => void;
  updateComponentProps: (id: string, newProps: Partial<ComponentSchema['props']>) => void;
  deleteComponent: (ids: string | string[]) => void;
  reorderComponents: (activeId: string, overId: string) => void;
  moveComponent: (activeId: string, targetContainerId: string | null, index?: number) => void; // 移动到容器
  setFormValue: (id: string, value: any) => void; // 设置表单值
  getFormValues: () => Record<string, any>; // 获取所有表单值
  
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


export const useStore = create<State>()(
  persist(
    (set, get) => ({
      components: [] as ComponentSchema[],
      selectedIds: [] as string[],
      formValues: {} as Record<string, any>,
      history: {
        past: [] as ComponentSchema[][],
        future: [] as ComponentSchema[][],
      },

      // ⚠️ 修改签名：增加 index 参数
      addComponent: (type, parentId, index) => set((state) => {
        const newPast = [...state.history.past, state.components];
        
        let newComponent: ComponentSchema;
        
        switch (type) {
            case 'Input': newComponent = { id: nanoid(), type: 'Input', props: { label: '输入框', placeholder: '请输入...' } }; break;
            case 'TextArea': newComponent = { id: nanoid(), type: 'TextArea', props: { label: '多行文本', placeholder: '请输入...', rows: 4 } }; break;
            case 'InputNumber': newComponent = { id: nanoid(), type: 'InputNumber', props: { label: '数字输入', placeholder: '请输入数字' } }; break;
            case 'Select': newComponent = { id: nanoid(), type: 'Select', props: { label: '下拉选择', placeholder: '请选择', options: [{ label: 'A', value: 'A' }] } }; break;
            case 'Radio': newComponent = { id: nanoid(), type: 'Radio', props: { label: '单选框', options: [{ label: 'A', value: 'A' }] } }; break;
            case 'Checkbox': newComponent = { id: nanoid(), type: 'Checkbox', props: { label: '多选框', options: [{ label: 'A', value: 'A' }] } }; break;
            case 'Switch': newComponent = { id: nanoid(), type: 'Switch', props: { label: '开关' } }; break;
            case 'DatePicker': newComponent = { id: nanoid(), type: 'DatePicker', props: { label: '日期', placeholder: '请选择' } }; break;
            case 'TimePicker': newComponent = { id: nanoid(), type: 'TimePicker', props: { label: '时间', placeholder: '请选择' } }; break;
            case 'Button': newComponent = { id: nanoid(), type: 'Button', props: { content: '提交', type: 'primary' } }; break;
            case 'Container': newComponent = { id: nanoid(), type: 'Container', props: { label: '容器', direction: 'vertical' }, children: [] }; break;
            default: return state;
        }

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

      updateComponentProps: (id, newProps) => set((state) => {
        const newPast = [...state.history.past, state.components];
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

        const newPast = [...state.history.past, state.components];
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
        const newPast = [...state.history.past, state.components];
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
        const newPast = [...state.history.past, state.components];
        
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
      })
    }),
    {
      name: 'lowcode-storage', 
      partialize: (state) => ({ components: state.components }),
    }
  )
);
