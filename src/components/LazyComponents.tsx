import { lazy, Suspense } from 'react';
import { Spin } from 'antd';

/**
 * 默认的加载占位组件
 */
export const LoadingSpinner: React.FC<{ tip?: string }> = ({ tip = '加载中...' }) => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 40,
    minHeight: 200
  }}>
    <Spin tip={tip} />
  </div>
);

/**
 * 懒加载的 FormRenderer
 */
const LazyFormRendererComponent = lazy(() => 
  import('./FormRenderer').then(m => ({ default: m.FormRenderer }))
);

export const LazyFormRenderer: React.FC<React.ComponentProps<typeof LazyFormRendererComponent>> = (props) => (
  <Suspense fallback={<LoadingSpinner tip="加载表单渲染器..." />}>
    <LazyFormRendererComponent {...props} />
  </Suspense>
);

/**
 * 懒加载的历史面板
 */
const LazyHistoryPanelComponent = lazy(() => 
  import('./common/HistoryPanel').then(m => ({ default: m.HistoryPanel }))
);

export const LazyHistoryPanel: React.FC<React.ComponentProps<typeof LazyHistoryPanelComponent>> = (props) => (
  <Suspense fallback={<LoadingSpinner tip="加载历史记录..." />}>
    <LazyHistoryPanelComponent {...props} />
  </Suspense>
);

/**
 * 懒加载的快捷键面板
 */
const LazyKeyboardShortcutsPanelComponent = lazy(() => 
  import('./common/KeyboardShortcutsPanel').then(m => ({ default: m.KeyboardShortcutsPanel }))
);

export const LazyKeyboardShortcutsPanel: React.FC<React.ComponentProps<typeof LazyKeyboardShortcutsPanelComponent>> = (props) => (
  <Suspense fallback={<LoadingSpinner tip="加载快捷键..." />}>
    <LazyKeyboardShortcutsPanelComponent {...props} />
  </Suspense>
);

/**
 * 懒加载的性能面板
 */
const LazyPerformancePanelComponent = lazy(() =>
  import('./common/PerformancePanel').then((m) => ({ default: m.PerformancePanel }))
);

export const LazyPerformancePanel: React.FC<React.ComponentProps<typeof LazyPerformancePanelComponent>> = (props) => (
  <Suspense fallback={null}>
    <LazyPerformancePanelComponent {...props} />
  </Suspense>
);

/**
 * 懒加载的属性面板（属性配置模块较大，且不一定会在首屏就使用）
 */
const LazyPropertyPanelComponent = lazy(() =>
  import('./PropertyPanel/index').then((m) => ({ default: m.PropertyPanel }))
);

export const LazyPropertyPanel: React.FC<React.ComponentProps<typeof LazyPropertyPanelComponent>> = (props) => (
  <Suspense fallback={<LoadingSpinner tip="加载属性面板..." />}>
    <LazyPropertyPanelComponent {...props} />
  </Suspense>
);
