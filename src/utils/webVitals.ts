/**
 * Web Vitals - Core Web Vitals 性能指标收集
 *
 * 面试考点：
 * 1. Core Web Vitals 指标
 * 2. Performance API 使用
 * 3. 性能监控最佳实践
 */

// ============ 类型定义 ============

export interface WebVitalsMetric {
  name: 'FCP' | 'LCP' | 'FID' | 'CLS' | 'TTFB' | 'INP';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

export interface PerformanceEntry {
  name: string;
  type: string;
  startTime: number;
  duration: number;
  timestamp: number;
}

export interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  usedPercentage: number;
}

export interface PerformanceSnapshot {
  webVitals: WebVitalsMetric[];
  entries: PerformanceEntry[];
  memory?: MemoryInfo;
  fps: number;
  longTasks: number;
  timestamp: number;
}

// ============ 阈值定义 ============

const THRESHOLDS = {
  FCP: { good: 1800, poor: 3000 },
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
};

function getRating(name: keyof typeof THRESHOLDS, value: number): WebVitalsMetric['rating'] {
  const threshold = THRESHOLDS[name];
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

// ============ 性能收集器 ============

class WebVitalsCollector {
  private metrics: WebVitalsMetric[] = [];
  private entries: PerformanceEntry[] = [];
  private longTaskCount = 0;
  private fpsHistory: number[] = [];
  private lastFrameTime = 0;
  private frameCount = 0;
  private listeners = new Set<() => void>();
  private observers: PerformanceObserver[] = [];
  private rafId: number | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initObservers();
      this.startFPSMonitor();
    }
  }

  /**
   * 初始化 Performance Observers
   */
  private initObservers(): void {
    // 监控 LCP
    this.observe('largest-contentful-paint', (entries) => {
      const lastEntry = entries[entries.length - 1];
      this.addMetric('LCP', lastEntry.startTime);
    });

    // 监控 FID
    this.observe('first-input', (entries) => {
      const entry = entries[0] as PerformanceEventTiming;
      this.addMetric('FID', entry.processingStart - entry.startTime);
    });

    // 监控 CLS
    let clsValue = 0;
    this.observe('layout-shift', (entries) => {
      for (const entry of entries) {
        const layoutShiftEntry = entry as unknown as { hadRecentInput?: boolean; value: number };
        if (!layoutShiftEntry.hadRecentInput) {
          clsValue += layoutShiftEntry.value;
        }
      }
      this.addMetric('CLS', clsValue);
    });

    // 监控 Long Tasks
    this.observe('longtask', (entries) => {
      this.longTaskCount += entries.length;
      entries.forEach((entry) => {
        this.addEntry({
          name: 'Long Task',
          type: 'longtask',
          startTime: entry.startTime,
          duration: entry.duration,
        });
      });
    });

    // 监控导航时序
    this.observe('navigation', (entries) => {
      const nav = entries[0] as PerformanceNavigationTiming;
      this.addMetric('TTFB', nav.responseStart - nav.requestStart);
    });

    // 监控 Paint
    this.observe('paint', (entries) => {
      for (const entry of entries) {
        if (entry.name === 'first-contentful-paint') {
          this.addMetric('FCP', entry.startTime);
        }
      }
    });
  }

  /**
   * 创建 Performance Observer
   */
  private observe(type: string, callback: (entries: PerformanceEntryList) => void): void {
    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
        this.notify();
      });
      observer.observe({ type, buffered: true });
      this.observers.push(observer);
    } catch {
      // 某些浏览器可能不支持特定类型
      console.debug(`PerformanceObserver for ${type} not supported`);
    }
  }

  /**
   * 添加指标
   */
  private addMetric(name: WebVitalsMetric['name'], value: number): void {
    const existing = this.metrics.findIndex((m) => m.name === name);
    const metric: WebVitalsMetric = {
      name,
      value,
      rating: getRating(name, value),
      timestamp: Date.now(),
    };

    if (existing >= 0) {
      this.metrics[existing] = metric;
    } else {
      this.metrics.push(metric);
    }
  }

  /**
   * 添加性能条目
   */
  private addEntry(entry: Omit<PerformanceEntry, 'timestamp'>): void {
    this.entries.push({
      ...entry,
      timestamp: Date.now(),
    });

    // 保持最多 100 条
    if (this.entries.length > 100) {
      this.entries = this.entries.slice(-100);
    }
  }

  /**
   * 开始 FPS 监控
   */
  private startFPSMonitor(): void {
    const measureFPS = (timestamp: number) => {
      if (this.lastFrameTime) {
        this.frameCount++;
        const elapsed = timestamp - this.lastFrameTime;

        // 每秒计算一次
        if (elapsed >= 1000) {
          const fps = Math.round((this.frameCount * 1000) / elapsed);
          this.fpsHistory.push(fps);

          // 保持最近 60 秒的数据
          if (this.fpsHistory.length > 60) {
            this.fpsHistory.shift();
          }

          this.frameCount = 0;
          this.lastFrameTime = timestamp;
          this.notify();
        }
      } else {
        this.lastFrameTime = timestamp;
      }

      this.rafId = requestAnimationFrame(measureFPS);
    };

    this.rafId = requestAnimationFrame(measureFPS);
  }

  /**
   * 获取当前 FPS
   */
  getCurrentFPS(): number {
    if (this.fpsHistory.length === 0) return 60;
    return this.fpsHistory[this.fpsHistory.length - 1];
  }

  /**
   * 获取平均 FPS
   */
  getAverageFPS(): number {
    if (this.fpsHistory.length === 0) return 60;
    return Math.round(this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length);
  }

  /**
   * 获取内存信息
   */
  getMemoryInfo(): MemoryInfo | undefined {
    const memory = (
      performance as Performance & {
        memory?: {
          usedJSHeapSize: number;
          totalJSHeapSize: number;
          jsHeapSizeLimit: number;
        };
      }
    ).memory;

    if (!memory) return undefined;

    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      usedPercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
    };
  }

  /**
   * 获取性能快照
   */
  getSnapshot(): PerformanceSnapshot {
    return {
      webVitals: [...this.metrics],
      entries: [...this.entries],
      memory: this.getMemoryInfo(),
      fps: this.getCurrentFPS(),
      longTasks: this.longTaskCount,
      timestamp: Date.now(),
    };
  }

  /**
   * 获取所有指标
   */
  getMetrics(): WebVitalsMetric[] {
    return [...this.metrics];
  }

  /**
   * 订阅变更
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * 通知监听者
   */
  private notify(): void {
    this.listeners.forEach((listener) => listener());
  }

  /**
   * 清理
   */
  destroy(): void {
    this.observers.forEach((obs) => obs.disconnect());
    this.observers = [];

    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    this.listeners.clear();
  }

  /**
   * 重置
   */
  reset(): void {
    this.metrics = [];
    this.entries = [];
    this.longTaskCount = 0;
    this.fpsHistory = [];
    this.notify();
  }
}

// 导出单例
export const webVitals = new WebVitalsCollector();

// ============ React Hook ============

import { useState, useEffect } from 'react';

export function useWebVitals(): {
  metrics: WebVitalsMetric[];
  snapshot: PerformanceSnapshot;
  fps: number;
  memory?: MemoryInfo;
} {
  const [metrics, setMetrics] = useState<WebVitalsMetric[]>(() => webVitals.getMetrics());
  const [snapshot, setSnapshot] = useState<PerformanceSnapshot>(() => webVitals.getSnapshot());

  useEffect(() => {
    const unsubscribe = webVitals.subscribe(() => {
      setMetrics(webVitals.getMetrics());
      setSnapshot(webVitals.getSnapshot());
    });

    return unsubscribe;
  }, []);

  return {
    metrics,
    snapshot,
    fps: snapshot.fps,
    memory: snapshot.memory,
  };
}

// ============ 性能评分计算 ============

export function calculatePerformanceScore(metrics: WebVitalsMetric[]): {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
} {
  const weights: Record<WebVitalsMetric['name'], number> = {
    LCP: 25,
    FID: 25,
    CLS: 25,
    FCP: 10,
    TTFB: 10,
    INP: 5,
  };

  const ratingScores = {
    good: 100,
    'needs-improvement': 50,
    poor: 0,
  };

  let totalWeight = 0;
  let weightedScore = 0;

  for (const metric of metrics) {
    const weight = weights[metric.name] || 0;
    totalWeight += weight;
    weightedScore += ratingScores[metric.rating] * weight;
  }

  const score = totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 0;

  let grade: 'A' | 'B' | 'C' | 'D' | 'F';
  if (score >= 90) grade = 'A';
  else if (score >= 80) grade = 'B';
  else if (score >= 70) grade = 'C';
  else if (score >= 60) grade = 'D';
  else grade = 'F';

  return { score, grade };
}

// 开发环境暴露到 window
if (import.meta.env.DEV) {
  (window as unknown as { webVitals: WebVitalsCollector }).webVitals = webVitals;
}
