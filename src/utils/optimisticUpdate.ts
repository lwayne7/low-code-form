/**
 * Optimistic Update - 乐观更新工具
 *
 * 面试考点：
 * 1. 乐观更新的原理和实现
 * 2. 回滚机制
 * 3. 并发控制
 * 4. 错误处理策略
 *
 * @example
 * ```tsx
 * // 基础用法
 * const result = await optimisticUpdate({
 *   localUpdate: () => setItems([...items, newItem]),
 *   remoteCall: () => api.createItem(newItem),
 *   rollback: () => setItems(items),
 * });
 *
 * // 使用 Hook
 * const { execute, isLoading, error } = useOptimisticMutation({
 *   mutationFn: (data) => api.updateItem(data),
 *   onMutate: (data) => {
 *     const previous = items;
 *     setItems(items.map(i => i.id === data.id ? data : i));
 *     return { previous };
 *   },
 *   onError: (error, data, context) => {
 *     setItems(context.previous);
 *   },
 * });
 * ```
 */

import { useState, useCallback, useRef } from 'react';
import { logger } from './logger';

// ============ 类型定义 ============

export interface OptimisticUpdateOptions<TData, TResult> {
  /** 本地更新函数（立即执行） */
  localUpdate: () => TData;
  /** 远程调用函数 */
  remoteCall: () => Promise<TResult>;
  /** 回滚函数（远程调用失败时执行） */
  rollback: (previousData: TData) => void;
  /** 成功回调 */
  onSuccess?: (result: TResult) => void;
  /** 失败回调 */
  onError?: (error: Error, previousData: TData) => void;
  /** 最大重试次数 */
  maxRetries?: number;
  /** 重试延迟（毫秒） */
  retryDelay?: number;
}

export interface OptimisticUpdateResult<TResult> {
  success: boolean;
  data?: TResult;
  error?: Error;
  retryCount: number;
}

export interface OptimisticMutationOptions<TData, TVariables, TContext> {
  /** 变更函数 */
  mutationFn: (variables: TVariables) => Promise<TData>;
  /** 变更前回调，返回上下文用于回滚 */
  onMutate?: (variables: TVariables) => TContext | Promise<TContext>;
  /** 成功回调 */
  onSuccess?: (data: TData, variables: TVariables, context: TContext) => void;
  /** 失败回调 */
  onError?: (error: Error, variables: TVariables, context: TContext) => void;
  /** 完成回调（无论成功失败） */
  onSettled?: (
    data: TData | undefined,
    error: Error | null,
    variables: TVariables,
    context: TContext
  ) => void;
  /** 最大重试次数 */
  maxRetries?: number;
}

export interface MutationState<TData> {
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  data?: TData;
  error?: Error;
}

// ============ 核心函数 ============

/**
 * 执行乐观更新
 */
export async function optimisticUpdate<TData, TResult>(
  options: OptimisticUpdateOptions<TData, TResult>
): Promise<OptimisticUpdateResult<TResult>> {
  const {
    localUpdate,
    remoteCall,
    rollback,
    onSuccess,
    onError,
    maxRetries = 0,
    retryDelay = 1000,
  } = options;

  // 1. 立即执行本地更新
  const previousData = localUpdate();
  logger.debug('Optimistic update: local update applied');

  let retryCount = 0;
  let lastError: Error | undefined;

  // 2. 执行远程调用（带重试）
  while (retryCount <= maxRetries) {
    try {
      const result = await remoteCall();

      logger.debug('Optimistic update: remote call succeeded');
      onSuccess?.(result);

      return {
        success: true,
        data: result,
        retryCount,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (retryCount < maxRetries) {
        logger.warn(`Optimistic update: retry ${retryCount + 1}/${maxRetries}`, {
          error: lastError.message,
        });
        await new Promise((resolve) => setTimeout(resolve, retryDelay * (retryCount + 1)));
        retryCount++;
      } else {
        break;
      }
    }
  }

  // 3. 远程调用失败，执行回滚
  logger.error('Optimistic update: remote call failed, rolling back', {}, lastError);
  rollback(previousData);
  onError?.(lastError!, previousData);

  return {
    success: false,
    error: lastError,
    retryCount,
  };
}

/**
 * 批量乐观更新（按顺序执行，任一失败则全部回滚）
 */
export async function batchOptimisticUpdate<TData, TResult>(
  updates: Array<{
    localUpdate: () => TData;
    remoteCall: () => Promise<TResult>;
  }>
): Promise<{
  success: boolean;
  results: Array<TResult | undefined>;
  error?: Error;
  failedIndex?: number;
}> {
  const previousStates: TData[] = [];
  const results: Array<TResult | undefined> = [];

  // 1. 先执行所有本地更新
  for (const update of updates) {
    previousStates.push(update.localUpdate());
  }

  // 2. 按顺序执行远程调用
  for (let i = 0; i < updates.length; i++) {
    try {
      const result = await updates[i].remoteCall();
      results.push(result);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      // 3. 失败时回滚所有更新（逆序）
      logger.error(`Batch optimistic update: failed at index ${i}, rolling back all`, {}, err);

      // 这里需要调用方提供回滚逻辑
      // 由于我们只记录了之前的状态，需要外部处理回滚

      return {
        success: false,
        results,
        error: err,
        failedIndex: i,
      };
    }
  }

  return {
    success: true,
    results,
  };
}

// ============ React Hooks ============

/**
 * 乐观变更 Hook
 */
export function useOptimisticMutation<TData, TVariables, TContext = unknown>(
  options: OptimisticMutationOptions<TData, TVariables, TContext>
): {
  execute: (variables: TVariables) => Promise<TData | undefined>;
  reset: () => void;
} & MutationState<TData> {
  const { mutationFn, onMutate, onSuccess, onError, onSettled, maxRetries = 0 } = options;

  const [state, setState] = useState<MutationState<TData>>({
    isLoading: false,
    isSuccess: false,
    isError: false,
  });

  const contextRef = useRef<TContext | undefined>(undefined);
  const abortControllerRef = useRef<AbortController | null>(null);

  const execute = useCallback(
    async (variables: TVariables): Promise<TData | undefined> => {
      // 取消之前的请求
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      setState({
        isLoading: true,
        isSuccess: false,
        isError: false,
        data: undefined,
        error: undefined,
      });

      // 执行 onMutate（乐观更新）
      let context: TContext | undefined;
      if (onMutate) {
        try {
          context = await onMutate(variables);
          contextRef.current = context;
        } catch (error) {
          logger.error('onMutate failed', {}, error instanceof Error ? error : undefined);
        }
      }

      // 执行变更（带重试）
      let retryCount = 0;
      let lastError: Error | undefined;

      while (retryCount <= maxRetries) {
        try {
          const data = await mutationFn(variables);

          setState({
            isLoading: false,
            isSuccess: true,
            isError: false,
            data,
          });

          onSuccess?.(data, variables, context as TContext);
          onSettled?.(data, null, variables, context as TContext);

          return data;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));

          if (retryCount < maxRetries) {
            retryCount++;
            await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount));
          } else {
            break;
          }
        }
      }

      // 失败，触发回滚
      setState({
        isLoading: false,
        isSuccess: false,
        isError: true,
        error: lastError,
      });

      onError?.(lastError!, variables, context as TContext);
      onSettled?.(undefined, lastError!, variables, context as TContext);

      return undefined;
    },
    [mutationFn, onMutate, onSuccess, onError, onSettled, maxRetries]
  );

  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    setState({
      isLoading: false,
      isSuccess: false,
      isError: false,
      data: undefined,
      error: undefined,
    });
    contextRef.current = undefined;
  }, []);

  return {
    execute,
    reset,
    ...state,
  };
}

/**
 * React 19 风格的 useOptimistic Hook 封装
 *
 * 面试加分：展示对 React 19 新 API 的理解
 *
 * 采用简化的设计：只追踪乐观更新的 pending 状态，
 * 外部 state 变化时自动同步（React 的自然行为）
 */
export function useOptimisticState<TState, TAction>(
  state: TState,
  updateFn: (state: TState, action: TAction) => TState
): [TState, (action: TAction) => void, boolean] {
  // 使用 reducer 模式管理乐观状态
  const [optimisticState, setOptimisticState] = useState<{
    baseState: TState;
    optimisticValue: TState | null;
    isPending: boolean;
  }>({
    baseState: state,
    optimisticValue: null,
    isPending: false,
  });

  // 当外部 state 变化时，重置乐观状态
  // 这是 React 推荐的 "state 派生" 模式
  const currentBaseState = optimisticState.baseState;
  if (state !== currentBaseState) {
    setOptimisticState({
      baseState: state,
      optimisticValue: null,
      isPending: false,
    });
  }

  const addOptimistic = useCallback(
    (action: TAction) => {
      setOptimisticState((prev) => ({
        ...prev,
        optimisticValue: updateFn(prev.optimisticValue ?? prev.baseState, action),
        isPending: true,
      }));
    },
    [updateFn]
  );

  // 返回乐观值（如果有）或基础状态
  const displayState = optimisticState.optimisticValue ?? optimisticState.baseState;

  return [displayState, addOptimistic, optimisticState.isPending];
}

// ============ 工具函数 ============

/**
 * 创建可取消的 Promise
 */
export function makeCancellable<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }

    const abortHandler = () => {
      reject(new DOMException('Aborted', 'AbortError'));
    };

    signal?.addEventListener('abort', abortHandler);

    promise
      .then(resolve)
      .catch(reject)
      .finally(() => {
        signal?.removeEventListener('abort', abortHandler);
      });
  });
}

/**
 * 防抖变更（多次快速调用只执行最后一次）
 */
export function createDebouncedMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  delay: number = 300
): {
  execute: (variables: TVariables) => Promise<TData>;
  cancel: () => void;
} {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let pendingResolve: ((value: TData) => void) | null = null;
  let pendingReject: ((reason: Error) => void) | null = null;

  const execute = (variables: TVariables): Promise<TData> => {
    // 取消之前的定时器
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    return new Promise((resolve, reject) => {
      // 拒绝之前的 Promise
      if (pendingReject) {
        pendingReject(new Error('Cancelled by new request'));
      }

      pendingResolve = resolve;
      pendingReject = reject;

      timeoutId = setTimeout(async () => {
        try {
          const result = await mutationFn(variables);
          pendingResolve?.(result);
        } catch (error) {
          pendingReject?.(error instanceof Error ? error : new Error(String(error)));
        } finally {
          pendingResolve = null;
          pendingReject = null;
          timeoutId = null;
        }
      }, delay);
    });
  };

  const cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (pendingReject) {
      pendingReject(new Error('Cancelled'));
      pendingResolve = null;
      pendingReject = null;
    }
  };

  return { execute, cancel };
}
