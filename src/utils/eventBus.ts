/**
 * EventBus - 事件总线 / 发布订阅模式
 * 
 * 面试考点：
 * 1. 发布订阅模式 vs 观察者模式
 * 2. 类型安全的事件系统
 * 3. 内存泄漏防护（自动取消订阅）
 * 4. 单例模式
 * 
 * @example
 * ```tsx
 * // 订阅事件
 * const unsubscribe = eventBus.on('component:add', (component) => {
 *   console.log('Component added:', component);
 * });
 * 
 * // 发布事件
 * eventBus.emit('component:add', newComponent);
 * 
 * // 取消订阅
 * unsubscribe();
 * ```
 */

import type { ComponentSchema, ComponentType } from '../types';

// 定义事件类型映射
export interface EventMap {
  // 组件生命周期事件
  'component:add': { component: ComponentSchema; parentId?: string };
  'component:delete': { ids: string[] };
  'component:update': { id: string; props: Partial<ComponentSchema['props']> };
  'component:move': { id: string; from: string | null; to: string | null };
  'component:select': { ids: string[] };
  
  // 拖拽事件
  'drag:start': { id: string; type?: ComponentType };
  'drag:end': { id: string; success: boolean };
  'drag:cancel': { id: string };
  
  // 历史记录事件
  'history:undo': { timestamp: number };
  'history:redo': { timestamp: number };
  'history:clear': void;
  
  // 表单事件
  'form:validate': { errors: Array<{ id: string; message: string }> };
  'form:submit': { values: Record<string, unknown> };
  'form:reset': void;
  
  // 插件事件
  'plugin:register': { name: string };
  'plugin:unregister': { name: string };
  
  // 性能事件
  'perf:longTask': { duration: number; name?: string };
  'perf:render': { component: string; duration: number };
}

type EventCallback<T> = T extends void ? () => void : (payload: T) => void;
type Unsubscribe = () => void;

class EventBusImpl {
  private events = new Map<keyof EventMap, Set<EventCallback<unknown>>>();
  private onceEvents = new Map<keyof EventMap, Set<EventCallback<unknown>>>();

  /**
   * 订阅事件
   * @param event 事件名称
   * @param callback 回调函数
   * @returns 取消订阅函数
   */
  on<K extends keyof EventMap>(event: K, callback: EventCallback<EventMap[K]>): Unsubscribe {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(callback as EventCallback<unknown>);

    // 返回取消订阅函数
    return () => this.off(event, callback);
  }

  /**
   * 订阅一次性事件（触发后自动取消订阅）
   */
  once<K extends keyof EventMap>(event: K, callback: EventCallback<EventMap[K]>): Unsubscribe {
    if (!this.onceEvents.has(event)) {
      this.onceEvents.set(event, new Set());
    }
    this.onceEvents.get(event)!.add(callback as EventCallback<unknown>);

    return () => {
      this.onceEvents.get(event)?.delete(callback as EventCallback<unknown>);
    };
  }

  /**
   * 取消订阅
   */
  off<K extends keyof EventMap>(event: K, callback: EventCallback<EventMap[K]>): void {
    this.events.get(event)?.delete(callback as EventCallback<unknown>);
    this.onceEvents.get(event)?.delete(callback as EventCallback<unknown>);
  }

  /**
   * 发布事件
   */
  emit<K extends keyof EventMap>(
    event: K,
    ...args: EventMap[K] extends void ? [] : [EventMap[K]]
  ): void {
    const payload = args[0];

    // 触发常规订阅
    this.events.get(event)?.forEach((callback) => {
      try {
        (callback as (p?: unknown) => void)(payload);
      } catch (error) {
        console.error(`[EventBus] Error in event handler for "${event}":`, error);
      }
    });

    // 触发一次性订阅并清除
    const onceCallbacks = this.onceEvents.get(event);
    if (onceCallbacks) {
      onceCallbacks.forEach((callback) => {
        try {
          (callback as (p?: unknown) => void)(payload);
        } catch (error) {
          console.error(`[EventBus] Error in once handler for "${event}":`, error);
        }
      });
      this.onceEvents.delete(event);
    }
  }

  /**
   * 清除指定事件的所有订阅
   */
  clear(event?: keyof EventMap): void {
    if (event) {
      this.events.delete(event);
      this.onceEvents.delete(event);
    } else {
      this.events.clear();
      this.onceEvents.clear();
    }
  }

  /**
   * 获取事件订阅者数量（调试用）
   */
  listenerCount(event: keyof EventMap): number {
    return (this.events.get(event)?.size ?? 0) + (this.onceEvents.get(event)?.size ?? 0);
  }

  /**
   * 获取所有已注册的事件名称（调试用）
   */
  eventNames(): Array<keyof EventMap> {
    const names = new Set<keyof EventMap>();
    this.events.forEach((_, key) => names.add(key));
    this.onceEvents.forEach((_, key) => names.add(key));
    return Array.from(names);
  }
}

// 单例导出
export const eventBus = new EventBusImpl();

// React Hook 用于组件中订阅事件
import { useEffect } from 'react';

/**
 * useEventBus - 在组件中订阅事件的 Hook
 * 自动在组件卸载时取消订阅，防止内存泄漏
 * 
 * @example
 * ```tsx
 * useEventBus('component:add', (payload) => {
 *   console.log('New component:', payload.component);
 * });
 * ```
 */
export function useEventBus<K extends keyof EventMap>(
  event: K,
  callback: EventCallback<EventMap[K]>,
  deps: React.DependencyList = []
): void {
  useEffect(() => {
    const unsubscribe = eventBus.on(event, callback);
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, ...deps]);
}
