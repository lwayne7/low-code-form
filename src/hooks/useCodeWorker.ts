import { useRef, useCallback, useEffect, useState } from 'react';
import type { ComponentSchema } from '../types';

/**
 * Web Worker Hook - 用于在后台线程执行代码生成
 * 面试考点：
 * 1. Web Worker 的创建和销毁
 * 2. 主线程与 Worker 的通信机制
 * 3. Promise 封装异步操作
 * 4. 错误处理和超时机制
 */

interface WorkerMessage {
  type: 'generateCode' | 'generateJsonSchema' | 'formatJson';
  payload: unknown;
  id: string;
}

interface WorkerResponse {
  type: 'result' | 'error';
  payload: unknown;
  id: string;
}

interface UseCodeWorkerReturn {
  generateCode: (components: ComponentSchema[]) => Promise<string>;
  generateJsonSchema: (components: ComponentSchema[]) => Promise<object>;
  formatJson: (data: unknown) => Promise<string>;
  isProcessing: boolean;
  error: string | null;
}

export function useCodeWorker(): UseCodeWorkerReturn {
  const workerRef = useRef<Worker | null>(null);
  const pendingRef = useRef<Map<string, { resolve: (value: unknown) => void; reject: (error: Error) => void }>>(new Map());
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 初始化 Worker
  useEffect(() => {
    // 使用 Vite 的 Worker 导入语法
    workerRef.current = new Worker(
      new URL('../workers/codeGenerator.worker.ts', import.meta.url),
      { type: 'module' }
    );

    // 处理 Worker 响应
    workerRef.current.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const { type, payload, id } = event.data;
      const pending = pendingRef.current.get(id);

      if (pending) {
        pendingRef.current.delete(id);
        setIsProcessing(pendingRef.current.size > 0);

        if (type === 'result') {
          pending.resolve(payload);
        } else {
          pending.reject(new Error(payload as string));
        }
      }
    };

    // 处理 Worker 错误
    workerRef.current.onerror = (event) => {
      console.error('Worker error:', event);
      setError(event.message);
      
      // 拒绝所有待处理的 Promise
      pendingRef.current.forEach(({ reject }) => {
        reject(new Error('Worker error'));
      });
      pendingRef.current.clear();
      setIsProcessing(false);
    };

    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  // 发送消息到 Worker
  const sendMessage = useCallback(<T>(type: WorkerMessage['type'], payload: unknown): Promise<T> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Worker not initialized'));
        return;
      }

      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      
      // 设置超时
      const timeout = setTimeout(() => {
        pendingRef.current.delete(id);
        setIsProcessing(pendingRef.current.size > 0);
        reject(new Error('Worker timeout'));
      }, 10000); // 10秒超时

      pendingRef.current.set(id, {
        resolve: (value) => {
          clearTimeout(timeout);
          resolve(value as T);
        },
        reject: (error) => {
          clearTimeout(timeout);
          reject(error);
        },
      });

      setIsProcessing(true);
      setError(null);

      const message: WorkerMessage = { type, payload, id };
      workerRef.current.postMessage(message);
    });
  }, []);

  const generateCode = useCallback(
    (components: ComponentSchema[]) => sendMessage<string>('generateCode', components),
    [sendMessage]
  );

  const generateJsonSchema = useCallback(
    (components: ComponentSchema[]) => sendMessage<object>('generateJsonSchema', components),
    [sendMessage]
  );

  const formatJson = useCallback(
    (data: unknown) => sendMessage<string>('formatJson', data),
    [sendMessage]
  );

  return {
    generateCode,
    generateJsonSchema,
    formatJson,
    isProcessing,
    error,
  };
}

/**
 * 简易版本：不使用 Worker，直接同步执行
 * 用于 Worker 不可用时的降级方案
 */
export function useCodeGeneratorFallback() {
  const [isProcessing, setIsProcessing] = useState(false);

  const generateCode = useCallback(async (components: ComponentSchema[]): Promise<string> => {
    setIsProcessing(true);
    try {
      // 动态导入代码生成器
      const { generateFullCode } = await import('../utils/codeGenerator');
      return generateFullCode(components);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const generateJsonSchema = useCallback(async (components: ComponentSchema[]): Promise<object> => {
    setIsProcessing(true);
    try {
      const { generateJsonSchema: genSchema } = await import('../utils/codeGenerator');
      return genSchema(components);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const formatJson = useCallback(async (data: unknown): Promise<string> => {
    return JSON.stringify(data, null, 2);
  }, []);

  return {
    generateCode,
    generateJsonSchema,
    formatJson,
    isProcessing,
    error: null,
  };
}
