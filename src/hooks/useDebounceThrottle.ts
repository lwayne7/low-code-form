import { useRef, useCallback, useEffect, useState } from 'react';

/**
 * 防抖 Hook - 延迟执行，适用于输入搜索、表单校验等
 * 面试考点：理解防抖原理，区分防抖和节流
 */
export function useDebounce<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);

  // 保持 callback 引用最新
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  ) as T;

  return debouncedCallback;
}

/**
 * 防抖值 Hook - 对值进行防抖，适用于搜索输入等
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * 节流 Hook - 固定频率执行，适用于滚动、拖拽等
 * 面试考点：节流的两种实现方式（时间戳 vs 定时器）
 */
export function useThrottle<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number,
  options: { leading?: boolean; trailing?: boolean } = {}
): T {
  const { leading = true, trailing = true } = options;
  
  const lastCallRef = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastArgsRef = useRef<Parameters<T> | null>(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const remaining = delay - (now - lastCallRef.current);

      lastArgsRef.current = args;

      if (remaining <= 0 || remaining > delay) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        lastCallRef.current = now;
        if (leading || lastCallRef.current !== 0) {
          callbackRef.current(...args);
        }
      } else if (!timeoutRef.current && trailing) {
        timeoutRef.current = setTimeout(() => {
          lastCallRef.current = leading ? Date.now() : 0;
          timeoutRef.current = null;
          if (lastArgsRef.current) {
            callbackRef.current(...lastArgsRef.current);
          }
        }, remaining);
      }
    },
    [delay, leading, trailing]
  ) as T;

  return throttledCallback;
}

/**
 * RAF 节流 Hook - 使用 requestAnimationFrame 实现，适用于动画、拖拽
 * 面试考点：理解 rAF 与节流的区别，帧率同步
 */
export function useRAFThrottle<T extends (...args: unknown[]) => unknown>(
  callback: T
): T {
  const rafIdRef = useRef<number | null>(null);
  const callbackRef = useRef(callback);
  const lastArgsRef = useRef<Parameters<T> | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      lastArgsRef.current = args;

      if (rafIdRef.current === null) {
        rafIdRef.current = requestAnimationFrame(() => {
          rafIdRef.current = null;
          if (lastArgsRef.current) {
            callbackRef.current(...lastArgsRef.current);
          }
        });
      }
    },
    []
  ) as T;

  return throttledCallback;
}

/**
 * 取消防抖/节流 Hook
 */
export function useCancelableDebounce<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): { debouncedFn: T; cancel: () => void; flush: () => void } {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);
  const lastArgsRef = useRef<Parameters<T> | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const flush = useCallback(() => {
    cancel();
    if (lastArgsRef.current) {
      callbackRef.current(...lastArgsRef.current);
    }
  }, [cancel]);

  useEffect(() => {
    return cancel;
  }, [cancel]);

  const debouncedFn = useCallback(
    (...args: Parameters<T>) => {
      lastArgsRef.current = args;
      cancel();
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay, cancel]
  ) as T;

  return { debouncedFn, cancel, flush };
}
