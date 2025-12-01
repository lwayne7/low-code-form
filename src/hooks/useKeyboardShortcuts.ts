import { useEffect } from 'react';
import { message } from 'antd';
import { useStore } from '../store';
import { findComponentById } from '../utils/componentHelpers';

/**
 * 键盘快捷键 Hook
 * 支持：删除、撤销/重做、全选、复制/粘贴/复制组件、取消选择
 */
export function useKeyboardShortcuts() {
  const {
    selectedIds,
    clipboard,
    components,
    deleteComponent,
    undo,
    redo,
    selectAll,
    copyComponents,
    pasteComponents,
    duplicateComponents,
    clearSelection,
  } = useStore();

  // 检查是否有锁定的组件
  const hasLockedComponent = selectedIds.some(id => {
    const comp = findComponentById(components, id);
    return comp?.props.locked === true;
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      const isInputFocused = activeTag === 'input' || activeTag === 'textarea';

      // Delete/Backspace - 删除选中组件
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0) {
        if (!isInputFocused) {
          if (hasLockedComponent) {
            message.warning('无法删除锁定的组件');
          } else {
            deleteComponent(selectedIds);
          }
        }
      }

      // Cmd/Ctrl + Z - 撤销
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      // Cmd/Ctrl + Shift + Z - 重做
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'z') {
        e.preventDefault();
        redo();
      }

      // Cmd/Ctrl + A - 全选
      if ((e.metaKey || e.ctrlKey) && e.key === 'a' && !isInputFocused) {
        e.preventDefault();
        selectAll();
      }

      // Cmd/Ctrl + C - 复制
      if ((e.metaKey || e.ctrlKey) && e.key === 'c' && !isInputFocused) {
        if (selectedIds.length > 0) {
          copyComponents();
          message.success(`已复制 ${selectedIds.length} 个组件`);
        }
      }

      // Cmd/Ctrl + V - 粘贴
      if ((e.metaKey || e.ctrlKey) && e.key === 'v' && !isInputFocused) {
        if (clipboard.length > 0) {
          pasteComponents();
          message.success(`已粘贴 ${clipboard.length} 个组件`);
        }
      }

      // Cmd/Ctrl + D - 复制组件
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        if (selectedIds.length > 0 && !isInputFocused) {
          e.preventDefault();
          duplicateComponents();
          message.success('已复制组件');
        }
      }

      // Escape - 取消选择
      if (e.key === 'Escape') {
        clearSelection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedIds,
    components,
    hasLockedComponent,
    deleteComponent,
    undo,
    redo,
    selectAll,
    copyComponents,
    pasteComponents,
    duplicateComponents,
    clipboard,
    clearSelection,
  ]);
}
