/**
 * Store Selectors
 * 
 * 提供细粒度的状态选择器，避免不必要的重渲染
 * 使用 Zustand 的 shallow 比较或自定义比较函数
 */

import { useStore } from '../store';
import { useShallow } from 'zustand/shallow';
import { useMemo } from 'react';
import { findComponentById, countComponents } from './componentHelpers';

/**
 * 选择组件列表
 */
export const useComponents = () => useStore((state) => state.components);

/**
 * 选择选中的组件 IDs
 */
export const useSelectedIds = () => useStore((state) => state.selectedIds);

/**
 * 选择主要选中的组件（最后选中的）
 */
export const usePrimarySelectedComponent = () => {
  const components = useStore((state) => state.components);
  const selectedIds = useStore((state) => state.selectedIds);
  
  return useMemo(() => {
    const primaryId = selectedIds[selectedIds.length - 1];
    return primaryId ? findComponentById(components, primaryId) : undefined;
  }, [components, selectedIds]);
};

/**
 * 选择历史状态（用于撤销/重做按钮状态）
 */
export const useHistoryState = () => useStore(
  useShallow((state) => ({
    canUndo: state.history.past.length > 0,
    canRedo: state.history.future.length > 0,
    pastLength: state.history.past.length,
    futureLength: state.history.future.length,
  }))
);

/**
 * 选择剪贴板状态
 */
export const useClipboard = () => useStore((state) => state.clipboard);

/**
 * 选择是否可以粘贴
 */
export const useCanPaste = () => useStore((state) => state.clipboard.length > 0);

/**
 * 选择表单值
 */
export const useFormValue = (componentId: string) => 
  useStore((state) => state.formValues[componentId]);

/**
 * 选择校验错误
 */
export const useValidationError = (componentId: string) => 
  useStore((state) => state.validationErrors[componentId]);

/**
 * 选择所有校验错误
 */
export const useValidationErrors = () => useStore((state) => state.validationErrors);

/**
 * 选择自定义模板
 */
export const useCustomTemplates = () => useStore((state) => state.customTemplates);

/**
 * 选择组件统计信息
 */
export const useComponentStats = () => {
  const components = useStore((state) => state.components);
  
  return useMemo(() => ({
    total: countComponents(components),
    topLevel: components.length,
  }), [components]);
};

/**
 * 选择所有 actions（不会触发重渲染）
 */
export const useStoreActions = () => useStore(
  useShallow((state) => ({
    addComponent: state.addComponent,
    addComponents: state.addComponents,
    selectComponent: state.selectComponent,
    selectAll: state.selectAll,
    clearSelection: state.clearSelection,
    updateComponentProps: state.updateComponentProps,
    deleteComponent: state.deleteComponent,
    reorderComponents: state.reorderComponents,
    moveComponent: state.moveComponent,
    moveComponentInList: state.moveComponentInList,
    copyComponents: state.copyComponents,
    cutComponents: state.cutComponents,
    pasteComponents: state.pasteComponents,
    duplicateComponents: state.duplicateComponents,
    toggleLock: state.toggleLock,
    undo: state.undo,
    redo: state.redo,
    resetCanvas: state.resetCanvas,
    importComponents: state.importComponents,
    saveAsTemplate: state.saveAsTemplate,
    deleteTemplate: state.deleteTemplate,
    setFormValue: state.setFormValue,
    validateField: state.validateField,
    validateForm: state.validateForm,
    clearValidationError: state.clearValidationError,
    clearAllValidationErrors: state.clearAllValidationErrors,
  }))
);
