import { useRef, useEffect, useCallback } from 'react';

// 使用 Vite 的环境变量方式
const isDevelopment = import.meta.env.DEV;

interface PerformanceMetrics {
  renderCount: number;
  lastRenderTime: number;
  averageRenderTime: number;
  totalRenderTime: number;
}

interface UsePerformanceMonitorOptions {
  name: string;
  enabled?: boolean;
  warnThreshold?: number; // 渲染时间超过此值时警告（毫秒）
}

/**
 * 性能监控 Hook
 * 
 * 用于监控组件渲染性能，在开发环境下提供有用的性能指标
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { metrics, markRenderStart, markRenderEnd } = usePerformanceMonitor({
 *     name: 'MyComponent',
 *     warnThreshold: 16, // 超过 16ms 警告
 *   });
 * 
 *   markRenderStart();
 *   // ... 渲染逻辑
 *   useEffect(() => {
 *     markRenderEnd();
 *   });
 * 
 *   return <div>...</div>;
 * }
 * ```
 */
export function usePerformanceMonitor(options: UsePerformanceMonitorOptions) {
  const { name, enabled = isDevelopment, warnThreshold = 16 } = options;
  
  const metricsRef = useRef<PerformanceMetrics>({
    renderCount: 0,
    lastRenderTime: 0,
    averageRenderTime: 0,
    totalRenderTime: 0,
  });
  
  const renderStartRef = useRef<number>(0);

  const markRenderStart = useCallback(() => {
    if (!enabled) return;
    renderStartRef.current = performance.now();
  }, [enabled]);

  const markRenderEnd = useCallback(() => {
    if (!enabled || renderStartRef.current === 0) return;
    
    const renderTime = performance.now() - renderStartRef.current;
    const metrics = metricsRef.current;
    
    metrics.renderCount += 1;
    metrics.lastRenderTime = renderTime;
    metrics.totalRenderTime += renderTime;
    metrics.averageRenderTime = metrics.totalRenderTime / metrics.renderCount;
    
    // 性能警告
    if (renderTime > warnThreshold) {
      console.warn(
        `[Performance] ${name} 渲染耗时 ${renderTime.toFixed(2)}ms，超过阈值 ${warnThreshold}ms`,
        {
          renderCount: metrics.renderCount,
          averageRenderTime: metrics.averageRenderTime.toFixed(2),
        }
      );
    }
    
    renderStartRef.current = 0;
  }, [enabled, name, warnThreshold]);

  const getMetrics = useCallback(() => metricsRef.current, []);

  const resetMetrics = useCallback(() => {
    metricsRef.current = {
      renderCount: 0,
      lastRenderTime: 0,
      averageRenderTime: 0,
      totalRenderTime: 0,
    };
  }, []);

  // 自动标记渲染开始
  useEffect(() => {
    markRenderStart();
  });

  // 自动标记渲染结束
  useEffect(() => {
    markRenderEnd();
  });

  return {
    metrics: metricsRef.current,
    getMetrics,
    resetMetrics,
    markRenderStart,
    markRenderEnd,
  };
}

/**
 * 简化的渲染计数器 Hook
 * 
 * 用于快速检测组件是否有不必要的重渲染
 */
export function useRenderCount(componentName: string) {
  const countRef = useRef(0);
  countRef.current += 1;

  useEffect(() => {
    if (isDevelopment) {
      console.log(`[Render] ${componentName} 渲染次数: ${countRef.current}`);
    }
  });

  return countRef.current;
}

/**
 * Why Did You Render 简化版
 * 
 * 用于检测导致组件重渲染的 props 变化
 */
export function useWhyDidYouRender<T extends Record<string, unknown>>(
  componentName: string,
  props: T
) {
  const previousPropsRef = useRef<T | null>(null);

  useEffect(() => {
    if (!isDevelopment) return;
    
    const previousProps = previousPropsRef.current;
    if (previousProps === null) {
      previousPropsRef.current = props;
      return;
    }

    const changedProps: string[] = [];
    const allKeys = new Set([...Object.keys(previousProps), ...Object.keys(props)]);

    allKeys.forEach((key) => {
      if (previousProps[key] !== props[key]) {
        changedProps.push(key);
      }
    });

    if (changedProps.length > 0) {
      console.log(`[WhyDidYouRender] ${componentName} 重渲染，变化的 props:`, changedProps);
      changedProps.forEach((key) => {
        console.log(`  - ${key}:`, {
          previous: previousProps[key],
          current: props[key],
        });
      });
    }

    previousPropsRef.current = props;
  });
}
