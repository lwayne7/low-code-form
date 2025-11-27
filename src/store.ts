import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import type { ComponentSchema, ComponentType, ValidationRule } from './types';
import { arrayMove } from '@dnd-kit/sortable';

interface HistoryState {
  past: ComponentSchema[][];
  future: ComponentSchema[][];
}

// 🆕 校验错误类型
interface ValidationError {
  componentId: string;
  message: string;
}

interface State {
  components: ComponentSchema[];
  selectedIds: string[];
  formValues: Record<string, any>; // 表单值状态
  validationErrors: Record<string, string>; // 校验错误 { [componentId]: errorMessage }
  clipboard: ComponentSchema[]; // 🆕 剪贴板
  history: HistoryState;

  addComponent: (type: ComponentType, parentId?: string, index?: number) => void;
  addComponents: (components: ComponentSchema[]) => void; // 🆕 批量添加组件
  selectComponent: (id: string, multiSelect?: boolean) => void;
  selectAll: () => void; // 🆕 全选
  clearSelection: () => void;
  updateComponentProps: (id: string, newProps: Partial<ComponentSchema['props']>) => void;
  deleteComponent: (ids: string | string[]) => void;
  reorderComponents: (activeId: string, overId: string) => void;
  moveComponent: (activeId: string, targetContainerId: string | null, index?: number) => void;
  resetCanvas: () => void; // 🆕 重置画布
  setFormValue: (id: string, value: any) => void;
  getFormValues: () => Record<string, any>;
  
  // 🆕 复制/粘贴
  copyComponents: () => void; // 复制选中组件到剪贴板
  pasteComponents: () => void; // 粘贴剪贴板内容
  duplicateComponents: () => void; // 复制并粘贴（Cmd+D）
  
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

// 🆕 校验单个值
const validateValue = (value: any, rules: ValidationRule[] | undefined, label: string): string | null => {
  if (!rules || rules.length === 0) return null;

  for (const rule of rules) {
    switch (rule.type) {
      case 'required':
        if (value === undefined || value === null || value === '' || 
            (Array.isArray(value) && value.length === 0)) {
          return rule.message || `${label}不能为空`;
        }
        break;
      case 'minLength':
        if (typeof value === 'string' && value.length < (rule.value as number)) {
          return rule.message || `${label}至少需要${rule.value}个字符`;
        }
        break;
      case 'maxLength':
        if (typeof value === 'string' && value.length > (rule.value as number)) {
          return rule.message || `${label}最多${rule.value}个字符`;
        }
        break;
      case 'min':
        if (typeof value === 'number' && value < (rule.value as number)) {
          return rule.message || `${label}不能小于${rule.value}`;
        }
        break;
      case 'max':
        if (typeof value === 'number' && value > (rule.value as number)) {
          return rule.message || `${label}不能大于${rule.value}`;
        }
        break;
      case 'pattern':
        if (typeof value === 'string' && rule.value) {
          const regex = new RegExp(rule.value as string);
          if (!regex.test(value)) {
            return rule.message || `${label}格式不正确`;
          }
        }
        break;
      case 'email':
        if (typeof value === 'string' && value) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            return rule.message || '请输入有效的邮箱地址';
          }
        }
        break;
      case 'phone':
        if (typeof value === 'string' && value) {
          const phoneRegex = /^1[3-9]\d{9}$/;
          if (!phoneRegex.test(value)) {
            return rule.message || '请输入有效的手机号码';
          }
        }
        break;
    }
  }
  return null;
};

// 🆕 递归获取所有组件（扁平化）
const flattenComponents = (components: ComponentSchema[]): ComponentSchema[] => {
  const result: ComponentSchema[] = [];
  const traverse = (list: ComponentSchema[]) => {
    list.forEach((c) => {
      result.push(c);
      if (c.children) traverse(c.children);
    });
  };
  traverse(components);
  return result;
};

// 🆕 根据 ID 查找组件
const findComponentById = (components: ComponentSchema[], id: string): ComponentSchema | null => {
  for (const c of components) {
    if (c.id === id) return c;
    if (c.children) {
      const found = findComponentById(c.children, id);
      if (found) return found;
    }
  }
  return null;
};

// 🆕 深拷贝组件并重新生成 ID
const cloneComponentWithNewId = (component: ComponentSchema): ComponentSchema => {
  const newComponent = {
    ...component,
    id: nanoid(),
    props: { ...component.props },
    children: component.children?.map(cloneComponentWithNewId),
  };
  return newComponent as ComponentSchema;
};


export const useStore = create<State>()(
  persist(
    (set, get) => ({
      components: [] as ComponentSchema[],
      selectedIds: [] as string[],
      formValues: {} as Record<string, any>,
      validationErrors: {} as Record<string, string>,
      clipboard: [] as ComponentSchema[], // 🆕 剪贴板
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

      // 🆕 全选
      selectAll: () => set((state) => ({
        selectedIds: flattenComponents(state.components).map(c => c.id)
      })),

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

      // 🆕 批量添加组件
      addComponents: (newComponents: ComponentSchema[]) => set((state) => {
        const newPast = [...state.history.past, state.components];
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
        
        const newPast = [...state.history.past, state.components];
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
        
        const newPast = [...state.history.past, state.components];
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
      })
    }),
    {
      name: 'lowcode-storage', 
      partialize: (state) => ({ components: state.components }),
    }
  )
);
