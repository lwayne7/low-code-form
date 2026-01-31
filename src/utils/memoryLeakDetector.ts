/**
 * Memory Leak Detector - 内存泄漏检测工具
 *
 * 面试考点：
 * 1. WeakRef 和 FinalizationRegistry API
 * 2. 内存泄漏的常见场景
 * 3. 订阅/事件监听器的生命周期管理
 * 4. 开发环境调试工具设计
 *
 * @example
 * ```tsx
 * // 追踪对象
 * const component = new MyComponent();
 * memoryLeakDetector.track(component, 'MyComponent');
 *
 * // 追踪订阅
 * const subscription = eventBus.on('event', handler);
 * memoryLeakDetector.trackSubscription('my-subscription', subscription, 'event');
 *
 * // 检查泄漏
 * const leaks = memoryLeakDetector.checkLeaks();
 * console.log('Potential leaks:', leaks);
 * ```
 */

// ============ 类型定义 ============

export interface TrackedObject {
  label: string;
  trackedAt: number;
  expectedLifetime?: number; // 预期存活时间（毫秒）
  stack?: string; // 创建时的调用栈
}

export interface TrackedSubscription {
  id: string;
  eventName: string;
  unsubscribe: () => void;
  trackedAt: number;
  stack?: string;
}

export interface LeakReport {
  type: 'object' | 'subscription' | 'timer' | 'listener';
  label: string;
  age: number; // 存活时间（毫秒）
  stack?: string;
  details?: string;
}

export interface MemoryStats {
  trackedObjects: number;
  activeSubscriptions: number;
  activeTimers: number;
  activeListeners: number;
  collectedObjects: number;
  potentialLeaks: number;
}

// ============ 实现 ============

class MemoryLeakDetectorImpl {
  // 使用 WeakRef 追踪对象，不阻止 GC
  private trackedObjects = new Map<WeakRef<object>, TrackedObject>();

  // 使用 FinalizationRegistry 监听对象回收
  private registry: FinalizationRegistry<string>;

  // 追踪订阅
  private subscriptions = new Map<string, TrackedSubscription>();

  // 追踪定时器
  private timers = new Map<number, { label: string; trackedAt: number; stack?: string }>();

  // 追踪事件监听器
  private listeners = new Map<
    string,
    {
      target: WeakRef<EventTarget>;
      event: string;
      trackedAt: number;
      stack?: string;
    }
  >();

  // 统计
  private collectedCount = 0;

  // 是否启用（仅开发环境）
  private enabled: boolean;

  constructor() {
    this.enabled = import.meta.env.DEV;

    this.registry = new FinalizationRegistry((label) => {
      this.collectedCount++;
      if (this.enabled) {
        console.debug(`[MemoryLeakDetector] Object collected: ${label}`);
      }
    });
  }

  /**
   * 追踪对象
   * @param obj 要追踪的对象
   * @param label 对象标签
   * @param expectedLifetime 预期存活时间（毫秒）
   */
  track(obj: object, label: string, expectedLifetime?: number): void {
    if (!this.enabled) return;

    const ref = new WeakRef(obj);
    const tracked: TrackedObject = {
      label,
      trackedAt: Date.now(),
      expectedLifetime,
      stack: this.captureStack(),
    };

    this.trackedObjects.set(ref, tracked);
    this.registry.register(obj, label, ref);
  }

  /**
   * 取消追踪对象
   */
  untrack(obj: object): void {
    if (!this.enabled) return;

    for (const [ref] of this.trackedObjects) {
      if (ref.deref() === obj) {
        this.trackedObjects.delete(ref);
        this.registry.unregister(ref);
        break;
      }
    }
  }

  /**
   * 追踪订阅
   * @param id 订阅唯一标识
   * @param unsubscribe 取消订阅函数
   * @param eventName 事件名称
   */
  trackSubscription(id: string, unsubscribe: () => void, eventName: string): void {
    if (!this.enabled) return;

    this.subscriptions.set(id, {
      id,
      eventName,
      unsubscribe,
      trackedAt: Date.now(),
      stack: this.captureStack(),
    });
  }

  /**
   * 标记订阅已取消
   */
  untrackSubscription(id: string): void {
    this.subscriptions.delete(id);
  }

  /**
   * 追踪定时器
   */
  trackTimer(timerId: number, label: string): void {
    if (!this.enabled) return;

    this.timers.set(timerId, {
      label,
      trackedAt: Date.now(),
      stack: this.captureStack(),
    });
  }

  /**
   * 标记定时器已清除
   */
  untrackTimer(timerId: number): void {
    this.timers.delete(timerId);
  }

  /**
   * 追踪事件监听器
   */
  trackListener(id: string, target: EventTarget, event: string): void {
    if (!this.enabled) return;

    this.listeners.set(id, {
      target: new WeakRef(target),
      event,
      trackedAt: Date.now(),
      stack: this.captureStack(),
    });
  }

  /**
   * 标记监听器已移除
   */
  untrackListener(id: string): void {
    this.listeners.delete(id);
  }

  /**
   * 检查潜在泄漏
   * @param maxAge 最大存活时间（毫秒），超过此时间视为潜在泄漏
   */
  checkLeaks(maxAge: number = 5 * 60 * 1000): LeakReport[] {
    if (!this.enabled) return [];

    const now = Date.now();
    const leaks: LeakReport[] = [];

    // 清理已回收的对象
    for (const [ref, tracked] of this.trackedObjects) {
      if (!ref.deref()) {
        this.trackedObjects.delete(ref);
        continue;
      }

      const age = now - tracked.trackedAt;
      const threshold = tracked.expectedLifetime ?? maxAge;

      if (age > threshold) {
        leaks.push({
          type: 'object',
          label: tracked.label,
          age,
          stack: tracked.stack,
          details: `Expected lifetime: ${threshold}ms, Actual: ${age}ms`,
        });
      }
    }

    // 检查长期存在的订阅
    for (const [id, sub] of this.subscriptions) {
      const age = now - sub.trackedAt;
      if (age > maxAge) {
        leaks.push({
          type: 'subscription',
          label: `${id} (${sub.eventName})`,
          age,
          stack: sub.stack,
        });
      }
    }

    // 检查长期存在的定时器
    for (const [timerId, timer] of this.timers) {
      const age = now - timer.trackedAt;
      if (age > maxAge) {
        leaks.push({
          type: 'timer',
          label: `Timer ${timerId}: ${timer.label}`,
          age,
          stack: timer.stack,
        });
      }
    }

    // 检查长期存在的监听器
    for (const [id, listener] of this.listeners) {
      const target = listener.target.deref();
      if (!target) {
        // 目标已被回收，但监听器记录还在
        this.listeners.delete(id);
        continue;
      }

      const age = now - listener.trackedAt;
      if (age > maxAge) {
        leaks.push({
          type: 'listener',
          label: `${id} (${listener.event})`,
          age,
          stack: listener.stack,
        });
      }
    }

    return leaks;
  }

  /**
   * 获取内存统计
   */
  getStats(): MemoryStats {
    // 清理已回收的对象
    let activeObjects = 0;
    for (const [ref] of this.trackedObjects) {
      if (ref.deref()) {
        activeObjects++;
      } else {
        this.trackedObjects.delete(ref);
      }
    }

    // 清理已回收的监听器目标
    for (const [id, listener] of this.listeners) {
      if (!listener.target.deref()) {
        this.listeners.delete(id);
      }
    }

    const leaks = this.checkLeaks();

    return {
      trackedObjects: activeObjects,
      activeSubscriptions: this.subscriptions.size,
      activeTimers: this.timers.size,
      activeListeners: this.listeners.size,
      collectedObjects: this.collectedCount,
      potentialLeaks: leaks.length,
    };
  }

  /**
   * 强制清理所有订阅
   */
  forceCleanupSubscriptions(): number {
    let count = 0;
    for (const [id, sub] of this.subscriptions) {
      try {
        sub.unsubscribe();
        count++;
      } catch (error) {
        console.warn(`[MemoryLeakDetector] Failed to unsubscribe ${id}:`, error);
      }
    }
    this.subscriptions.clear();
    return count;
  }

  /**
   * 清除所有追踪数据
   */
  clear(): void {
    this.trackedObjects.clear();
    this.subscriptions.clear();
    this.timers.clear();
    this.listeners.clear();
    this.collectedCount = 0;
  }

  /**
   * 打印诊断报告
   */
  printDiagnostics(): void {
    if (!this.enabled) {
      console.log('[MemoryLeakDetector] Disabled in production');
      return;
    }

    const stats = this.getStats();
    const leaks = this.checkLeaks();

    console.group('🔍 Memory Leak Detector Report');
    console.log('Stats:', stats);

    if (leaks.length > 0) {
      console.warn(`⚠️ ${leaks.length} potential leak(s) detected:`);
      leaks.forEach((leak, index) => {
        console.group(`Leak #${index + 1}: ${leak.type}`);
        console.log('Label:', leak.label);
        console.log('Age:', `${Math.round(leak.age / 1000)}s`);
        if (leak.details) console.log('Details:', leak.details);
        if (leak.stack) console.log('Stack:', leak.stack);
        console.groupEnd();
      });
    } else {
      console.log('✅ No potential leaks detected');
    }

    console.groupEnd();
  }

  /**
   * 捕获调用栈
   */
  private captureStack(): string | undefined {
    if (!this.enabled) return undefined;

    try {
      const stack = new Error().stack;
      if (stack) {
        // 移除前几行（Error 和 captureStack 调用）
        return stack.split('\n').slice(3, 8).join('\n');
      }
    } catch {
      // 忽略错误
    }
    return undefined;
  }

  /**
   * 启用/禁用
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
}

// 导出单例
export const memoryLeakDetector = new MemoryLeakDetectorImpl();

// ============ React Hook ============

import { useEffect, useRef } from 'react';

/**
 * 追踪组件生命周期的 Hook
 */
export function useTrackComponent(componentName: string): void {
  const trackedRef = useRef(false);

  useEffect(() => {
    if (!trackedRef.current) {
      const marker = { component: componentName };
      memoryLeakDetector.track(marker, `Component: ${componentName}`);
      trackedRef.current = true;

      return () => {
        memoryLeakDetector.untrack(marker);
      };
    }
  }, [componentName]);
}

/**
 * 安全的 setInterval，自动追踪和清理
 */
export function useSafeInterval(
  callback: () => void,
  delay: number | null,
  label: string = 'interval'
): void {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;

    const id = window.setInterval(() => savedCallback.current(), delay);
    memoryLeakDetector.trackTimer(id, label);

    return () => {
      window.clearInterval(id);
      memoryLeakDetector.untrackTimer(id);
    };
  }, [delay, label]);
}

/**
 * 安全的 setTimeout，自动追踪和清理
 */
export function useSafeTimeout(
  callback: () => void,
  delay: number | null,
  label: string = 'timeout'
): void {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;

    const id = window.setTimeout(() => {
      savedCallback.current();
      memoryLeakDetector.untrackTimer(id);
    }, delay);
    memoryLeakDetector.trackTimer(id, label);

    return () => {
      window.clearTimeout(id);
      memoryLeakDetector.untrackTimer(id);
    };
  }, [delay, label]);
}

// ============ 开发工具 ============

// 在开发环境暴露到 window 对象
if (import.meta.env.DEV) {
  (window as unknown as { memoryLeakDetector: MemoryLeakDetectorImpl }).memoryLeakDetector =
    memoryLeakDetector;
}
