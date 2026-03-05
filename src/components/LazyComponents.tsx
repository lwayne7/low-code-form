import { lazy, Suspense } from 'react';
import { PropertyPanelSkeleton } from './common/Skeleton';

/**
 * 懒加载的 FormRenderer
 */
const LazyFormRendererComponent = lazy(() =>
  import('./FormRenderer').then((m) => ({ default: m.FormRenderer }))
);

export const LazyFormRenderer: React.FC<React.ComponentProps<typeof LazyFormRendererComponent>> = (
  props
) => (
  <Suspense fallback={null}>
    <LazyFormRendererComponent {...props} />
  </Suspense>
);

/**
 * 懒加载的历史面板（Drawer，默认关闭，fallback 用 null 避免占位符出现在布局中）
 */
const LazyHistoryPanelComponent = lazy(() =>
  import('./common/HistoryPanel').then((m) => ({ default: m.HistoryPanel }))
);

export const LazyHistoryPanel: React.FC<React.ComponentProps<typeof LazyHistoryPanelComponent>> = (
  props
) => (
  <Suspense fallback={null}>
    <LazyHistoryPanelComponent {...props} />
  </Suspense>
);

/**
 * 懒加载的快捷键面板（Drawer，默认关闭）
 */
const LazyKeyboardShortcutsPanelComponent = lazy(() =>
  import('./common/KeyboardShortcutsPanel').then((m) => ({ default: m.KeyboardShortcutsPanel }))
);

export const LazyKeyboardShortcutsPanel: React.FC<
  React.ComponentProps<typeof LazyKeyboardShortcutsPanelComponent>
> = (props) => (
  <Suspense fallback={null}>
    <LazyKeyboardShortcutsPanelComponent {...props} />
  </Suspense>
);

/**
 * 懒加载的性能面板（Drawer，默认关闭）
 */
const LazyPerformancePanelComponent = lazy(() =>
  import('./common/PerformancePanel').then((m) => ({ default: m.PerformancePanel }))
);

export const LazyPerformancePanel: React.FC<
  React.ComponentProps<typeof LazyPerformancePanelComponent>
> = (props) => (
  <Suspense fallback={null}>
    <LazyPerformancePanelComponent {...props} />
  </Suspense>
);

/**
 * 懒加载的属性面板（始终可见，用骨架屏占位）
 */
const LazyPropertyPanelComponent = lazy(() =>
  import('./PropertyPanel/index').then((m) => ({ default: m.PropertyPanel }))
);

export const LazyPropertyPanel: React.FC<
  React.ComponentProps<typeof LazyPropertyPanelComponent>
> = (props) => (
  <Suspense fallback={<PropertyPanelSkeleton />}>
    <LazyPropertyPanelComponent {...props} />
  </Suspense>
);
