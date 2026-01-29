import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import type { ComponentSchema, ComponentType } from './types';
import { getI18nInstance } from './i18n';

// 导入辅助函数
import {
  findComponentById,
  flattenComponents,
  findParentInfo,
} from './utils/componentHelpers';
import { validateValue } from './utils/validation';
import { createComponent, cloneComponentWithNewId } from './utils/componentFactory';
import type { ComponentInsert, ComponentLocation } from './utils/componentTreeOps';
import {
  insertComponent,
  moveComponent as moveComponentInTree,
  removeComponentsByIds,
  replaceComponentProps,
  updateComponentProps as updateComponentPropsInTree,
} from './utils/componentTreeOps';

interface HistoryState {
  past: HistoryEntry[];
  future: HistoryEntry[];
}

/** 历史记录最大条数 */
const MAX_HISTORY_LENGTH = 50;

export type HistoryEntry =
  | {
      kind: 'insert';
      label: string;
      timestamp: number;
      inserts: ComponentInsert[];
    }
  | {
      kind: 'delete';
      label: string;
      timestamp: number;
      removes: ComponentInsert[];
    }
  | {
      kind: 'updateProps';
      label: string;
      timestamp: number;
      targetId: string;
      prevProps: ComponentSchema['props'];
      nextProps: ComponentSchema['props'];
    }
  | {
      kind: 'move';
      label: string;
      timestamp: number;
      targetId: string;
      from: ComponentLocation;
      to: ComponentLocation;
    }
  | {
      kind: 'replaceAll';
      label: string;
      timestamp: number;
      removes: ComponentInsert[];
      inserts: ComponentInsert[];
    };

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
  formValues: Record<string, unknown>; // 表单值状态
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
  setFormValue: (id: string, value: unknown) => void;
  getFormValues: () => Record<string, unknown>;
  
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

function pushHistory(past: HistoryEntry[], entry: HistoryEntry): HistoryEntry[] {
  const next = [...past, entry];
  if (next.length > MAX_HISTORY_LENGTH) return next.slice(-MAX_HISTORY_LENGTH);
  return next;
}

function buildReplaceRecords(components: ComponentSchema[]): ComponentInsert[] {
  return components.map((component, index) => ({
    component,
    location: { parentId: null, index },
  }));
}

function sortByLocation(a: ComponentInsert, b: ComponentInsert) {
  const parentA = a.location.parentId ?? '';
  const parentB = b.location.parentId ?? '';
  if (parentA !== parentB) return parentA.localeCompare(parentB);
  return a.location.index - b.location.index;
}

function applyInsertRecords(components: ComponentSchema[], inserts: ComponentInsert[]) {
  let next = components;
  for (const record of inserts.slice().sort(sortByLocation)) {
    next = insertComponent(next, record.component, record.location).components;
  }
  return next;
}

function applyHistoryEntry(components: ComponentSchema[], entry: HistoryEntry): ComponentSchema[] {
  switch (entry.kind) {
    case 'insert':
      return applyInsertRecords(components, entry.inserts);
    case 'delete': {
      const ids = new Set(entry.removes.map((r) => r.component.id));
      return removeComponentsByIds(components, ids).components;
    }
    case 'updateProps':
      return replaceComponentProps(components, entry.targetId, entry.nextProps).components;
    case 'move':
      return moveComponentInTree(components, entry.targetId, entry.to).components;
    case 'replaceAll':
      return entry.inserts
        .slice()
        .sort((a, b) => a.location.index - b.location.index)
        .map((r) => r.component);
  }
}

function invertHistoryEntry(components: ComponentSchema[], entry: HistoryEntry): ComponentSchema[] {
  switch (entry.kind) {
    case 'insert': {
      const ids = new Set(entry.inserts.map((r) => r.component.id));
      return removeComponentsByIds(components, ids).components;
    }
    case 'delete':
      return applyInsertRecords(components, entry.removes);
    case 'updateProps':
      return replaceComponentProps(components, entry.targetId, entry.prevProps).components;
    case 'move':
      return moveComponentInTree(components, entry.targetId, entry.from).components;
    case 'replaceAll':
      return entry.removes
        .slice()
        .sort((a, b) => a.location.index - b.location.index)
        .map((r) => r.component);
  }
}

// 🆕 使用工厂函数创建组件（从 componentFactory.ts 导入）
// createComponent 和 cloneComponentWithNewId 已从 utils/componentFactory.ts 导入

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      components: [] as ComponentSchema[],
      selectedIds: [] as string[],
      formValues: {} as Record<string, unknown>,
      validationErrors: {} as Record<string, string>,
      clipboard: [] as ComponentSchema[], // 🆕 剪贴板
      customTemplates: [] as CustomTemplate[], // 🆕 自定义模板
      history: {
        past: [] as HistoryEntry[],
        future: [] as HistoryEntry[],
      },

      // ⚠️ 修改签名：增加 index 参数
      addComponent: (type, parentId, index) => set((state) => {
        const newComponent = createComponent(type);
        if (!newComponent) return state;

        const targetParentId = parentId ?? null;
        const defaultIndex =
          targetParentId === null
            ? state.components.length
            : (findComponentById(state.components, targetParentId)?.children?.length ?? 0);
        const targetIndex = typeof index === 'number' && index >= 0 ? index : defaultIndex;

        let insertResult = insertComponent(state.components, newComponent, {
          parentId: targetParentId,
          index: targetIndex,
        });

        // If container insertion failed, fall back to appending at root.
        if (targetParentId !== null && insertResult.insertedIndex === -1) {
          insertResult = insertComponent(state.components, newComponent, {
            parentId: null,
            index: state.components.length,
          });
        }

        if (insertResult.insertedIndex === -1) return state;

        const entry: HistoryEntry = {
          kind: 'insert',
          label: getI18nInstance().t('history.add', { type }),
          timestamp: Date.now(),
          inserts: [
            {
              component: newComponent,
              location: { parentId: targetParentId, index: insertResult.insertedIndex },
            },
          ],
        };

        return { 
          components: insertResult.components,
          selectedIds: [newComponent.id],
          history: {
            past: pushHistory(state.history.past, entry),
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
        const current = findComponentById(state.components, id);
        if (!current) return {};

        const patchEntries = Object.entries(newProps as Record<string, unknown>);
        if (patchEntries.length === 0) return {};

        const hasActualChange = patchEntries.some(([key, value]) => {
          const currentProps = current.props as Record<string, unknown>;
          return currentProps[key] !== value;
        });
        if (!hasActualChange) return {};

        const result = updateComponentPropsInTree(state.components, id, newProps);
        if (!result.prevProps || !result.nextProps) return {};

        const entry: HistoryEntry = {
          kind: 'updateProps',
          label: getI18nInstance().t('history.update'),
          timestamp: Date.now(),
          targetId: id,
          prevProps: result.prevProps,
          nextProps: result.nextProps,
        };

        return {
          components: result.components,
          history: {
            past: pushHistory(state.history.past, entry),
            future: []
          }
        };
      }),

      deleteComponent: (ids) => set((state) => {
        const idsToDelete = Array.isArray(ids) ? ids : [ids];
        if (idsToDelete.length === 0) return {};

        const removeResult = removeComponentsByIds(state.components, new Set(idsToDelete));
        if (removeResult.removed.length === 0) return {};

        const entry: HistoryEntry = {
          kind: 'delete',
          label: idsToDelete.length > 1 ? getI18nInstance().t('history.deleteMultiple', { count: idsToDelete.length }) : getI18nInstance().t('history.delete'),
          timestamp: Date.now(),
          removes: removeResult.removed,
        };

        return {
          components: removeResult.components,
          selectedIds: state.selectedIds.filter(sid => !idsToDelete.includes(sid)),
          history: {
            past: pushHistory(state.history.past, entry),
            future: []
          }
        };
      }),

      reorderComponents: (activeId, overId) => set((state) => {
        const from = findParentInfo(state.components, activeId);
        const to = findParentInfo(state.components, overId);
        if (from.index === -1 || to.index === -1) return {};
        if (from.parentId !== to.parentId) return {};
        if (from.index === to.index) return {};

        const moved = moveComponentInTree(state.components, activeId, {
          parentId: to.parentId,
          index: to.index,
        });
        if (!moved.moved) return {};

        const entry: HistoryEntry = {
          kind: 'move',
          label: getI18nInstance().t('history.reorder'),
          timestamp: Date.now(),
          targetId: activeId,
          from: { parentId: from.parentId, index: from.index },
          to: moved.moved.to,
        };

        return {
          components: moved.components,
          history: { past: pushHistory(state.history.past, entry), future: [] },
        };
      }),

      // 移动组件到容器内（支持跨容器移动）
      moveComponent: (activeId, targetContainerId, index) => set((state) => {
        if (!findComponentById(state.components, activeId)) return {};

        const targetParentId = targetContainerId;
        const defaultIndex =
          targetParentId === null
            ? state.components.length
            : (findComponentById(state.components, targetParentId)?.children?.length ?? 0);
        const targetIndex = typeof index === 'number' && index >= 0 ? index : defaultIndex;

        const moved = moveComponentInTree(state.components, activeId, {
          parentId: targetParentId,
          index: targetIndex,
        });
        if (!moved.moved) return {};

        const entry: HistoryEntry = {
          kind: 'move',
          label: getI18nInstance().t('history.move'),
          timestamp: Date.now(),
          targetId: activeId,
          from: moved.moved.from,
          to: moved.moved.to,
        };

        return {
          components: moved.components,
          history: { past: pushHistory(state.history.past, entry), future: [] },
        };
      }),

      setFormValue: (id, value) => set((state) => ({
        formValues: { ...state.formValues, [id]: value }
      })),

      getFormValues: (): Record<string, unknown> => {
        return get().formValues;
      },

      // 🆕 批量添加组件
      addComponents: (newComponents: ComponentSchema[]) => set((state) => {
        if (newComponents.length === 0) return {};

        const baseIndex = state.components.length;
        const inserts: ComponentInsert[] = newComponents.map((component, offset) => ({
          component,
          location: { parentId: null, index: baseIndex + offset },
        }));

        const entry: HistoryEntry = {
          kind: 'insert',
          label: getI18nInstance().t('history.batchAdd', { count: newComponents.length }),
          timestamp: Date.now(),
          inserts,
        };

        return {
          components: [...state.components, ...newComponents],
          selectedIds: newComponents.map(c => c.id),
          history: { past: pushHistory(state.history.past, entry), future: [] }
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
        
        const clonedComponents = state.clipboard.map(cloneComponentWithNewId);

        const baseIndex = state.components.length;
        const entry: HistoryEntry = {
          kind: 'insert',
          label: getI18nInstance().t('history.paste', { count: clonedComponents.length }),
          timestamp: Date.now(),
          inserts: clonedComponents.map((component, offset) => ({
            component,
            location: { parentId: null, index: baseIndex + offset },
          })),
        };
        
        return {
          components: [...state.components, ...clonedComponents],
          selectedIds: clonedComponents.map(c => c.id),
          history: { past: pushHistory(state.history.past, entry), future: [] }
        };
      }),

      // 🆕 复制并粘贴（Cmd+D）
      duplicateComponents: () => set((state) => {
        if (state.selectedIds.length === 0) return {};
        
        const componentsToDuplicate = state.selectedIds
          .map(id => findComponentById(state.components, id))
          .filter((c): c is ComponentSchema => c !== null);
        
        const clonedComponents = componentsToDuplicate.map(cloneComponentWithNewId);

        const baseIndex = state.components.length;
        const entry: HistoryEntry = {
          kind: 'insert',
          label: getI18nInstance().t('history.duplicate', { count: clonedComponents.length }),
          timestamp: Date.now(),
          inserts: clonedComponents.map((component, offset) => ({
            component,
            location: { parentId: null, index: baseIndex + offset },
          })),
        };
        
        return {
          components: [...state.components, ...clonedComponents],
          selectedIds: clonedComponents.map(c => c.id),
          history: { past: pushHistory(state.history.past, entry), future: [] }
        };
      }),

      // 🆕 剪切组件
      cutComponents: () => set((state) => {
        if (state.selectedIds.length === 0) return {};
        
        const componentsToCut = state.selectedIds
          .map(id => findComponentById(state.components, id))
          .filter((c): c is ComponentSchema => c !== null);
        
        const clonedForClipboard = componentsToCut.map(cloneComponentWithNewId);
        const removeResult = removeComponentsByIds(state.components, new Set(state.selectedIds));
        if (removeResult.removed.length === 0) return {};

        const entry: HistoryEntry = {
          kind: 'delete',
          label: getI18nInstance().t('history.cut', { count: removeResult.removed.length }),
          timestamp: Date.now(),
          removes: removeResult.removed,
        };
        
        return {
          components: removeResult.components,
          clipboard: clonedForClipboard,
          selectedIds: [],
          history: { past: pushHistory(state.history.past, entry), future: [] }
        };
      }),

      // 🆕 在列表内移动组件（上/下/顶/底）
      moveComponentInList: (id: string, direction: 'up' | 'down' | 'top' | 'bottom') => set((state) => {
        const from = findParentInfo(state.components, id);
        if (from.index === -1) return {};

        const siblings =
          from.parentId === null
            ? state.components
            : (findComponentById(state.components, from.parentId)?.children ?? []);
        const lastIndex = Math.max(0, siblings.length - 1);

        let toIndex = from.index;
        switch (direction) {
          case 'up':
            toIndex = Math.max(0, from.index - 1);
            break;
          case 'down':
            toIndex = Math.min(lastIndex, from.index + 1);
            break;
          case 'top':
            toIndex = 0;
            break;
          case 'bottom':
            toIndex = lastIndex;
            break;
        }

        if (toIndex === from.index) return {};

        const moved = moveComponentInTree(state.components, id, {
          parentId: from.parentId,
          index: toIndex,
        });
        if (!moved.moved) return {};

        const entry: HistoryEntry = {
          kind: 'move',
          label: getI18nInstance().t('history.movePosition'),
          timestamp: Date.now(),
          targetId: id,
          from: moved.moved.from,
          to: moved.moved.to,
        };

        return {
          components: moved.components,
          history: { past: pushHistory(state.history.past, entry), future: [] },
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
        const label = ('label' in component.props) ? (component.props.label || getI18nInstance().t('validation.defaultLabel')) : getI18nInstance().t('validation.defaultLabel');
        
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
          const label = ('label' in component.props) ? (component.props.label || getI18nInstance().t('validation.defaultLabel')) : getI18nInstance().t('validation.defaultLabel');
          
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
        const entry = state.history.past[state.history.past.length - 1];
        const newPast = state.history.past.slice(0, -1);
        const newComponents = invertHistoryEntry(state.components, entry);

        return {
          components: newComponents,
          selectedIds: [],
          history: {
            past: newPast,
            future: [entry, ...state.history.future],
          },
        };
      }),

      redo: () => set((state) => {
        if (state.history.future.length === 0) return {};
        const [entry, ...restFuture] = state.history.future;
        const newComponents = applyHistoryEntry(state.components, entry);

        return {
          components: newComponents,
          selectedIds: [],
          history: {
            past: pushHistory(state.history.past, entry),
            future: restFuture,
          },
        };
      }),

      // 🆕 重置画布
      resetCanvas: () => set((state) => {
        if (state.components.length === 0) {
          return {
            components: [],
            selectedIds: [],
            formValues: {},
            validationErrors: {},
          };
        }

        const entry: HistoryEntry = {
          kind: 'replaceAll',
          label: getI18nInstance().t('history.clear'),
          timestamp: Date.now(),
          removes: buildReplaceRecords(state.components),
          inserts: [],
        };

        return {
          components: [],
          selectedIds: [],
          formValues: {},
          validationErrors: {},
          history: {
            past: pushHistory(state.history.past, entry),
            future: [],
          },
        };
      }),

      // 🆕 导入组件（替换当前画布）
      importComponents: (importedComponents: ComponentSchema[]) => set((state) => {
        const clonedComponents = importedComponents.map(cloneComponentWithNewId);

        const entry: HistoryEntry = {
          kind: 'replaceAll',
          label: getI18nInstance().t('history.import'),
          timestamp: Date.now(),
          removes: buildReplaceRecords(state.components),
          inserts: buildReplaceRecords(clonedComponents),
        };

        return {
          components: clonedComponents,
          selectedIds: [],
          formValues: {},
          validationErrors: {},
          history: {
            past: pushHistory(state.history.past, entry),
            future: [],
          },
        };
      }),

      // 🆕 切换组件锁定状态
      toggleLock: (id: string) => set((state) => {
        const current = findComponentById(state.components, id);
        if (!current) return {};

        const prevProps = current.props;
        const nextProps = { ...current.props, locked: !current.props.locked } as ComponentSchema['props'];
        const replaced = replaceComponentProps(state.components, id, nextProps);
        if (!replaced.replaced) return {};

        const entry: HistoryEntry = {
          kind: 'updateProps',
          label: getI18nInstance().t('history.toggleLock'),
          timestamp: Date.now(),
          targetId: id,
          prevProps,
          nextProps,
        };

        return {
          components: replaced.components,
          history: { past: pushHistory(state.history.past, entry), future: [] },
        };
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
