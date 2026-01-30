/**
 * useSWR Hook 单元测试
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useSWR, clearCache, prefetch, getCachedData } from '../hooks/useSWR';

describe('useSWR', () => {
    beforeEach(() => {
        clearCache();
    });

    it('应该在初始加载时设置 isLoading 为 true', () => {
        const fetcher = vi.fn().mockImplementation(() => new Promise(() => {})); // never resolves
        const { result } = renderHook(() => useSWR('test-key', fetcher));

        expect(result.current.isLoading).toBe(true);
        expect(result.current.data).toBeUndefined();
    });

    it('应该在请求完成后返回数据', async () => {
        const mockData = { name: 'test' };
        const fetcher = vi.fn().mockResolvedValue(mockData);
        
        const { result } = renderHook(() => useSWR('test-key-2', fetcher));

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        }, { timeout: 1000 });

        expect(result.current.data).toEqual(mockData);
        expect(result.current.error).toBeUndefined();
    });

    it('应该在请求失败时返回错误', async () => {
        const error = new Error('请求失败');
        const fetcher = vi.fn().mockRejectedValue(error);
        
        const { result } = renderHook(() => useSWR('error-key', fetcher));

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        }, { timeout: 1000 });

        expect(result.current.error).toBeDefined();
        expect(result.current.error?.message).toBe('请求失败');
    });

    it('应该使用 fallbackData 作为初始数据', () => {
        const fetcher = vi.fn().mockResolvedValue({ new: 'data' });
        const fallbackData = { initial: 'data' };
        
        const { result } = renderHook(() => 
            useSWR('fallback-key', fetcher, { fallbackData, isPaused: true })
        );

        expect(result.current.data).toEqual(fallbackData);
        expect(result.current.isLoading).toBe(false);
    });

    it('key 为 null 时不应该发起请求', () => {
        const fetcher = vi.fn().mockResolvedValue({ data: 'test' });
        
        renderHook(() => useSWR(null, fetcher));

        expect(fetcher).not.toHaveBeenCalled();
    });

    it('mutate 应该能够乐观更新数据', async () => {
        const initialData = { count: 0 };
        const fetcher = vi.fn().mockResolvedValue(initialData);
        
        const { result } = renderHook(() => useSWR('mutate-key', fetcher));

        await waitFor(() => {
            expect(result.current.data).toEqual(initialData);
        }, { timeout: 1000 });

        await act(async () => {
            await result.current.mutate({ count: 10 }, false);
        });

        expect(result.current.data).toEqual({ count: 10 });
    });

    it('revalidate 应该重新请求数据', async () => {
        let callCount = 0;
        const fetcher = vi.fn().mockImplementation(() => {
            callCount++;
            return Promise.resolve({ count: callCount });
        });
        
        const { result } = renderHook(() => useSWR('revalidate-key', fetcher));

        await waitFor(() => {
            expect(result.current.data).toEqual({ count: 1 });
        }, { timeout: 1000 });

        await act(async () => {
            await result.current.revalidate();
        });

        await waitFor(() => {
            expect(result.current.data).toEqual({ count: 2 });
        }, { timeout: 1000 });
    });
});

describe('缓存工具函数', () => {
    beforeEach(() => {
        clearCache();
    });

    it('prefetch 应该预加载数据到缓存', async () => {
        const data = { prefetched: true };
        const fetcher = vi.fn().mockResolvedValue(data);
        
        await prefetch('prefetch-key', fetcher);
        
        expect(getCachedData('prefetch-key')).toEqual(data);
    });

    it('clearCache 应该清除指定 key 的缓存', async () => {
        await prefetch('key1', () => Promise.resolve({ a: 1 }));
        await prefetch('key2', () => Promise.resolve({ b: 2 }));
        
        clearCache('key1');
        
        expect(getCachedData('key1')).toBeUndefined();
        expect(getCachedData('key2')).toEqual({ b: 2 });
    });

    it('clearCache 无参数时应该清除所有缓存', async () => {
        await prefetch('key1', () => Promise.resolve({ a: 1 }));
        await prefetch('key2', () => Promise.resolve({ b: 2 }));
        
        clearCache();
        
        expect(getCachedData('key1')).toBeUndefined();
        expect(getCachedData('key2')).toBeUndefined();
    });
});
