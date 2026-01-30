/**
 * Profiler - React 性能分析工具
 * 
 * 面试考点：
 * 1. React Profiler API 的使用
 * 2. 性能监控和分析
 * 3. Long Task API
 * 4. Performance Observer
 * 
 * @example
 * ```tsx
 * <ProfilerWrapper id="Canvas" onSlowRender={(duration) => console.warn('Slow render:', duration)}>
 *   <Canvas />
 * </ProfilerWrapper>
 * ```
 */

/* eslint-disable react-refresh/only-export-components */

import React, { Profiler, useEffect, useRef, useCallback } from 'react';
import type { ProfilerOnRenderCallback } from 'react';
import { eventBus } from './eventBus';

// ============ 类型定义 ============

export interface RenderMetrics {
  id: string;
  phase: 'mount' | 'update' | 'nested-update';
  actualDuration: number;
  baseDuration: number;
  startTime: number;
  commitTime: number;
}

export interface LongTaskEntry {
  name: string;
  duration: number;
  startTime: number;
  attribution: string[];
}

interface ProfilerConfig {
  /** 慢渲染阈值（毫秒），默认 16ms（一帧） */
  slowRenderThreshold: number;
  /** 是否启用 Long Task 监控 */
  enableLongTaskMonitor: boolean;
  /** 是否在控制台输出警告 */
  logWarnings: boolean;
  /** 是否启用（生产环境自动禁用） */
  enabled: boolean;
}

// ============ 配置 ============

// 安全地获取开发模式标志
// 使用 typeof window 检查避免 SSR 问题，使用 hostname 检测本地开发环境
const isDev = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || 
   window.location.hostname === '127.0.0.1');

const defaultConfig: ProfilerConfig = {
  slowRenderThreshold: 16,
  enableLongTaskMonitor: true,
  logWarnings: isDev,
  enabled: isDev,
};

let config = { ...defaultConfig };

export function configureProfiler(newConfig: Partial<ProfilerConfig>): void {
  config = { ...config, ...newConfig };
}

// ============ 性能数据存储 ============

const MAX_METRICS = 100;
let renderMetrics: RenderMetrics[] = [];
let longTasks: LongTaskEntry[] = [];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function getRenderMetrics(): RenderMetrics[] {
  return [...renderMetrics];
}

export function getLongTasks(): LongTaskEntry[] {
  return [...longTasks];
}

export function clearProfilerData(): void {
  renderMetrics = [];
  longTasks = [];
  emit();
}

export function subscribeProfiler(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// ============ Long Task 监控 ============

let longTaskObserver: PerformanceObserver | null = null;

export function startLongTaskMonitor(): void {
  if (!config.enabled || !config.enableLongTaskMonitor) return;
  if (typeof PerformanceObserver === 'undefined') return;
  if (longTaskObserver) return;

  try {
    longTaskObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) {
          const taskEntry: LongTaskEntry = {
            name: entry.name,
            duration: entry.duration,
            startTime: entry.startTime,
            attribution: (entry as PerformanceEntry & { attribution?: Array<{ name: string }> }).attribution?.map(a => a.name) ?? [],
          };

          longTasks = [...longTasks, taskEntry].slice(-MAX_METRICS);

          if (config.logWarnings) {
            console.warn(
              `[Profiler] Long task detected: ${entry.duration.toFixed(2)}ms`,
              taskEntry
            );
          }

          eventBus.emit('perf:longTask', { duration: entry.duration, name: entry.name });
          emit();
        }
      }
    });

    longTaskObserver.observe({ entryTypes: ['longtask'] });
    console.log('[Profiler] Long task monitoring started');
  } catch (error) {
    console.warn('[Profiler] Long task monitoring not supported:', error);
  }
}

export function stopLongTaskMonitor(): void {
  if (longTaskObserver) {
    longTaskObserver.disconnect();
    longTaskObserver = null;
  }
}

// ============ ProfilerWrapper 组件 ============

interface ProfilerWrapperProps {
  id: string;
  children: React.ReactNode;
  onSlowRender?: (duration: number, metrics: RenderMetrics) => void;
  threshold?: number;
}

/**
 * ProfilerWrapper - 包裹组件以监控渲染性能
 */
export const ProfilerWrapper: React.FC<ProfilerWrapperProps> = ({
  id,
  children,
  onSlowRender,
  threshold = config.slowRenderThreshold,
}) => {
  const handleRender: ProfilerOnRenderCallback = useCallback(
    (
      profilerId,
      phase,
      actualDuration,
      baseDuration,
      startTime,
      commitTime
    ) => {
      if (!config.enabled) return;

      const metrics: RenderMetrics = {
        id: profilerId,
        phase: phase as RenderMetrics['phase'],
        actualDuration,
        baseDuration,
        startTime,
        commitTime,
      };

      // 存储指标
      renderMetrics = [...renderMetrics, metrics].slice(-MAX_METRICS);
      emit();

      // 慢渲染警告
      if (actualDuration > threshold) {
        if (config.logWarnings) {
          console.warn(
            `[Profiler] Slow render in "${profilerId}" (${phase}): ${actualDuration.toFixed(2)}ms`,
            { baseDuration, threshold }
          );
        }

        onSlowRender?.(actualDuration, metrics);
        eventBus.emit('perf:render', { component: profilerId, duration: actualDuration });
      }
    },
    [threshold, onSlowRender]
  );

  if (!config.enabled) {
    return <>{children}</>;
  }

  return (
    <Profiler id={id} onRender={handleRender}>
      {children}
    </Profiler>
  );
};

// ============ useRenderCount Hook ============

// 渲染计数存储（组件级别的计数器）
const renderCounts = new Map<string, number>();

/**
 * useRenderCount - 跟踪组件渲染次数（仅用于开发调试）
 * 使用外部 Map 存储计数，避免 hook 规则限制
 */
export function useRenderCount(componentName: string): number {
  // 获取当前计数并递增
  const currentCount = (renderCounts.get(componentName) ?? 0) + 1;
  renderCounts.set(componentName, currentCount);

  // 在 effect 中记录警告日志
  useEffect(() => {
    if (config.logWarnings && currentCount > 10) {
      console.warn(
        `[Profiler] ${componentName} has rendered ${currentCount} times`
      );
    }
  }, [componentName, currentCount]);

  return currentCount;
}

/**
 * 重置渲染计数器（用于测试）
 */
export function resetRenderCounts(): void {
  renderCounts.clear();
}

// ============ useWhyDidYouUpdate Hook ============

/**
 * useWhyDidYouUpdate - 调试组件重渲染原因
 */
export function useWhyDidYouUpdate<T extends Record<string, unknown>>(
  componentName: string,
  props: T
): void {
  const previousProps = useRef<T | undefined>(undefined);

  useEffect(() => {
    if (previousProps.current && config.logWarnings) {
      const allKeys = new Set([
        ...Object.keys(previousProps.current),
        ...Object.keys(props),
      ]);

      const changedProps: Record<string, { from: unknown; to: unknown }> = {};

      allKeys.forEach((key) => {
        if (previousProps.current![key] !== props[key]) {
          changedProps[key] = {
            from: previousProps.current![key],
            to: props[key],
          };
        }
      });

      if (Object.keys(changedProps).length > 0) {
        console.log(`[WhyDidYouUpdate] ${componentName}:`, changedProps);
      }
    }

    previousProps.current = props;
  });
}

// ============ Performance Marks ============

/**
 * 创建性能标记
 */
export function mark(name: string): void {
  if (!config.enabled) return;
  try {
    performance.mark(name);
  } catch {
    // ignore
  }
}

/**
 * 测量两个标记之间的时间
 */
export function measure(name: string, startMark: string, endMark?: string): number {
  if (!config.enabled) return 0;
  try {
    const measureName = `${name}-measure`;
    performance.measure(measureName, startMark, endMark);
    const entries = performance.getEntriesByName(measureName, 'measure');
    const duration = entries[entries.length - 1]?.duration ?? 0;
    
    // 清理
    performance.clearMarks(startMark);
    if (endMark) performance.clearMarks(endMark);
    performance.clearMeasures(measureName);
    
    return duration;
  } catch {
    return 0;
  }
}

// ============ 自动启动 Long Task 监控 ============

if (config.enabled && config.enableLongTaskMonitor) {
  // 延迟启动，避免阻塞初始加载
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(() => startLongTaskMonitor());
  } else {
    setTimeout(startLongTaskMonitor, 1000);
  }
}
