/**
 * SWR 风格的请求缓存 Hook
 * 
 * 面试考点：
 * 1. stale-while-revalidate 缓存策略
 * 2. 请求去重（多个组件同时请求同一资源）
 * 3. 自动重新验证（焦点切换、网络恢复）
 * 4. 乐观更新
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// 缓存存储
interface CacheEntry<T> {
    data: T;
    timestamp: number;
    isValidating: boolean;
}

const cache = new Map<string, CacheEntry<unknown>>();
const subscribers = new Map<string, Set<() => void>>();

// 正在进行的请求（用于去重）
const inflight = new Map<string, Promise<unknown>>();

export interface SWROptions<T> {
    /** 缓存过期时间（毫秒），默认 5 分钟 */
    staleTime?: number;
    /** 是否在窗口获得焦点时重新验证 */
    revalidateOnFocus?: boolean;
    /** 是否在网络恢复时重新验证 */
    revalidateOnReconnect?: boolean;
    /** 轮询间隔（毫秒），0 表示不轮询 */
    refreshInterval?: number;
    /** 初始数据 */
    fallbackData?: T;
    /** 请求失败时是否使用缓存数据 */
    keepPreviousData?: boolean;
    /** 是否禁用自动请求 */
    isPaused?: boolean;
}

export interface SWRResponse<T> {
    data: T | undefined;
    error: Error | undefined;
    isLoading: boolean;
    isValidating: boolean;
    mutate: (data?: T | ((prev: T | undefined) => T), shouldRevalidate?: boolean) => Promise<void>;
    revalidate: () => Promise<void>;
}

/**
 * SWR Hook - 数据请求与缓存
 * 
 * @example
 * ```tsx
 * function FormList() {
 *   const { data, error, isLoading, mutate } = useSWR(
 *     'forms',
 *     () => formsApi.list()
 *   );
 * 
 *   if (isLoading) return <Spin />;
 *   if (error) return <Error message={error.message} />;
 *   
 *   return <List dataSource={data.forms} />;
 * }
 * ```
 */
export function useSWR<T>(
    key: string | null,
    fetcher: () => Promise<T>,
    options: SWROptions<T> = {}
): SWRResponse<T> {
    const {
        staleTime = 5 * 60 * 1000, // 5 分钟
        revalidateOnFocus = true,
        revalidateOnReconnect = true,
        refreshInterval = 0,
        fallbackData,
        keepPreviousData = true,
        isPaused = false,
    } = options;

    const [state, setState] = useState<{
        data: T | undefined;
        error: Error | undefined;
        isLoading: boolean;
        isValidating: boolean;
    }>(() => {
        // 初始化时尝试从缓存读取
        if (key) {
            const cached = cache.get(key) as CacheEntry<T> | undefined;
            if (cached) {
                return {
                    data: cached.data,
                    error: undefined,
                    isLoading: false,
                    isValidating: false,
                };
            }
        }
        return {
            data: fallbackData,
            error: undefined,
            isLoading: !fallbackData && !!key,
            isValidating: false,
        };
    });

    const fetcherRef = useRef(fetcher);
    fetcherRef.current = fetcher;

    // 订阅缓存更新
    useEffect(() => {
        if (!key) return;

        const subscriber = () => {
            const cached = cache.get(key) as CacheEntry<T> | undefined;
            if (cached) {
                setState(prev => ({
                    ...prev,
                    data: cached.data,
                    isValidating: cached.isValidating,
                }));
            }
        };

        if (!subscribers.has(key)) {
            subscribers.set(key, new Set());
        }
        subscribers.get(key)!.add(subscriber);

        return () => {
            subscribers.get(key)?.delete(subscriber);
        };
    }, [key]);

    // 通知所有订阅者
    const notifySubscribers = useCallback((cacheKey: string) => {
        subscribers.get(cacheKey)?.forEach(fn => fn());
    }, []);

    // 核心请求逻辑
    const revalidate = useCallback(async () => {
        if (!key || isPaused) return;

        // 检查是否有正在进行的请求（去重）
        if (inflight.has(key)) {
            await inflight.get(key);
            return;
        }

        // 标记正在验证
        const cached = cache.get(key) as CacheEntry<T> | undefined;
        if (cached) {
            cached.isValidating = true;
            notifySubscribers(key);
        }

        setState(prev => ({ ...prev, isValidating: true }));

        const promise = fetcherRef.current();
        inflight.set(key, promise);

        try {
            const data = await promise;
            
            // 更新缓存
            cache.set(key, {
                data,
                timestamp: Date.now(),
                isValidating: false,
            });

            setState({
                data,
                error: undefined,
                isLoading: false,
                isValidating: false,
            });

            notifySubscribers(key);
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            
            setState(prev => ({
                ...prev,
                error,
                isLoading: false,
                isValidating: false,
                // 保留之前的数据
                data: keepPreviousData ? prev.data : undefined,
            }));

            // 更新缓存状态
            if (cached) {
                cached.isValidating = false;
                notifySubscribers(key);
            }
        } finally {
            inflight.delete(key);
        }
    }, [key, isPaused, keepPreviousData, notifySubscribers]);

    // 乐观更新
    const mutate = useCallback(async (
        newData?: T | ((prev: T | undefined) => T),
        shouldRevalidate = true
    ) => {
        if (!key) return;

        if (newData !== undefined) {
            const resolvedData = typeof newData === 'function'
                ? (newData as (prev: T | undefined) => T)(state.data)
                : newData;

            // 乐观更新缓存
            cache.set(key, {
                data: resolvedData,
                timestamp: Date.now(),
                isValidating: false,
            });

            setState(prev => ({
                ...prev,
                data: resolvedData,
            }));

            notifySubscribers(key);
        }

        if (shouldRevalidate) {
            await revalidate();
        }
    }, [key, state.data, revalidate, notifySubscribers]);

    // 初始请求和缓存过期检查
    useEffect(() => {
        if (!key || isPaused) return;

        const cached = cache.get(key) as CacheEntry<T> | undefined;
        const isStale = !cached || Date.now() - cached.timestamp > staleTime;

        if (isStale) {
            revalidate();
        } else if (cached) {
            setState({
                data: cached.data,
                error: undefined,
                isLoading: false,
                isValidating: false,
            });
        }
    }, [key, staleTime, isPaused, revalidate]);

    // 焦点切换时重新验证
    useEffect(() => {
        if (!revalidateOnFocus || !key) return;

        const handleFocus = () => {
            const cached = cache.get(key) as CacheEntry<T> | undefined;
            const isStale = !cached || Date.now() - cached.timestamp > staleTime;
            if (isStale) {
                revalidate();
            }
        };

        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [key, revalidateOnFocus, staleTime, revalidate]);

    // 网络恢复时重新验证
    useEffect(() => {
        if (!revalidateOnReconnect || !key) return;

        const handleOnline = () => revalidate();

        window.addEventListener('online', handleOnline);
        return () => window.removeEventListener('online', handleOnline);
    }, [key, revalidateOnReconnect, revalidate]);

    // 轮询
    useEffect(() => {
        if (!refreshInterval || refreshInterval <= 0 || !key || isPaused) return;

        const interval = setInterval(revalidate, refreshInterval);
        return () => clearInterval(interval);
    }, [key, refreshInterval, isPaused, revalidate]);

    return {
        data: state.data,
        error: state.error,
        isLoading: state.isLoading,
        isValidating: state.isValidating,
        mutate,
        revalidate,
    };
}

/**
 * 清除指定 key 的缓存
 */
export function clearCache(key?: string) {
    if (key) {
        cache.delete(key);
    } else {
        cache.clear();
    }
}

/**
 * 预加载数据到缓存
 */
export async function prefetch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const data = await fetcher();
    cache.set(key, {
        data,
        timestamp: Date.now(),
        isValidating: false,
    });
    return data;
}

/**
 * 获取缓存数据（不触发请求）
 */
export function getCachedData<T>(key: string): T | undefined {
    const entry = cache.get(key) as CacheEntry<T> | undefined;
    return entry?.data;
}
