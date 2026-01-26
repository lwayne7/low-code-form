export { useKeyboardShortcuts } from './useKeyboardShortcuts';
export { useSelectionBox } from './useSelectionBox';
export type { SelectionBox } from './useSelectionBox';
export { usePerformanceMonitor, useRenderCount, useWhyDidYouRender } from './usePerformanceMonitor';
export { useFocusTrap, useArrowNavigation, useAnnounce, useKeyboardNavigation } from './useAccessibility';

// 性能优化 Hooks
export {
  useDebounce,
  useDebouncedValue,
  useThrottle,
  useRAFThrottle,
  useCancelableDebounce
} from './useDebounceThrottle';

// Web Worker
export { useCodeWorker, useCodeGeneratorFallback } from './useCodeWorker';

// 主题切换
export { useTheme } from './useTheme';
export type { ThemeMode } from './useTheme';

// 拖拽处理
export { useDragHandlers } from './useDragHandlers';
export type { DropTarget, UseDragHandlersResult } from './useDragHandlers';
