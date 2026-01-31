/**
 * Service Worker 注册与管理
 *
 * 面试考点：
 * 1. Service Worker 注册流程
 * 2. 更新检测与处理
 * 3. 用户提示与交互
 */

export interface ServiceWorkerConfig {
  /** 是否启用 */
  enabled: boolean;
  /** SW 文件路径 */
  swUrl: string;
  /** 更新检查间隔（毫秒） */
  updateCheckInterval: number;
  /** 更新可用时的回调 */
  onUpdateAvailable?: (registration: ServiceWorkerRegistration) => void;
  /** 首次安装成功回调 */
  onInstalled?: () => void;
  /** 离线状态变化回调 */
  onOfflineChange?: (isOffline: boolean) => void;
}

const DEFAULT_CONFIG: ServiceWorkerConfig = {
  enabled: import.meta.env.PROD,
  swUrl: '/sw.js',
  updateCheckInterval: 60 * 60 * 1000, // 1小时
};

class ServiceWorkerManager {
  private config: ServiceWorkerConfig;
  private registration: ServiceWorkerRegistration | null = null;
  private updateCheckTimer: ReturnType<typeof setInterval> | null = null;

  constructor(config: Partial<ServiceWorkerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.setupOfflineListener();
  }

  /**
   * 注册 Service Worker
   */
  async register(): Promise<ServiceWorkerRegistration | null> {
    if (!this.config.enabled || !('serviceWorker' in navigator)) {
      console.log('[SW Manager] Service Worker not supported or disabled');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register(this.config.swUrl, {
        scope: '/',
      });

      this.registration = registration;
      console.log('[SW Manager] Service Worker registered:', registration.scope);

      // 监听更新
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // 新版本可用
              console.log('[SW Manager] New version available');
              this.config.onUpdateAvailable?.(registration);
            } else if (newWorker.state === 'activated') {
              // 首次安装完成
              if (!navigator.serviceWorker.controller) {
                console.log('[SW Manager] First install completed');
                this.config.onInstalled?.();
              }
            }
          });
        }
      });

      // 定时检查更新
      this.startUpdateCheck();

      return registration;
    } catch (error) {
      console.error('[SW Manager] Registration failed:', error);
      return null;
    }
  }

  /**
   * 注销 Service Worker
   */
  async unregister(): Promise<boolean> {
    if (this.registration) {
      const result = await this.registration.unregister();
      if (result) {
        this.registration = null;
        this.stopUpdateCheck();
        console.log('[SW Manager] Service Worker unregistered');
      }
      return result;
    }
    return false;
  }

  /**
   * 检查更新
   */
  async checkUpdate(): Promise<void> {
    if (this.registration) {
      try {
        await this.registration.update();
        console.log('[SW Manager] Update check completed');
      } catch (error) {
        console.error('[SW Manager] Update check failed:', error);
      }
    }
  }

  /**
   * 跳过等待，立即激活新版本
   */
  async skipWaiting(): Promise<void> {
    const waiting = this.registration?.waiting;
    if (waiting) {
      waiting.postMessage('skipWaiting');
      // 刷新页面以加载新版本
      window.location.reload();
    }
  }

  /**
   * 清除所有缓存
   */
  async clearCache(): Promise<void> {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
    console.log('[SW Manager] All caches cleared');
  }

  /**
   * 获取缓存统计
   */
  async getCacheStats(): Promise<{
    cacheNames: string[];
    totalSize: number;
    entries: number;
  }> {
    const cacheNames = await caches.keys();
    let totalSize = 0;
    let entries = 0;

    for (const name of cacheNames) {
      const cache = await caches.open(name);
      const keys = await cache.keys();
      entries += keys.length;

      // 估算大小（需要遍历所有响应）
      for (const key of keys) {
        const response = await cache.match(key);
        if (response) {
          const blob = await response.clone().blob();
          totalSize += blob.size;
        }
      }
    }

    return { cacheNames, totalSize, entries };
  }

  /**
   * 获取注册状态
   */
  getRegistration(): ServiceWorkerRegistration | null {
    return this.registration;
  }

  /**
   * 检查是否已激活
   */
  isActive(): boolean {
    return this.registration?.active !== null;
  }

  /**
   * 检查是否有等待中的更新
   */
  hasWaitingUpdate(): boolean {
    return this.registration?.waiting !== null;
  }

  /**
   * 开始定时检查更新
   */
  private startUpdateCheck(): void {
    if (this.config.updateCheckInterval > 0) {
      this.updateCheckTimer = setInterval(() => {
        this.checkUpdate();
      }, this.config.updateCheckInterval);
    }
  }

  /**
   * 停止定时检查更新
   */
  private stopUpdateCheck(): void {
    if (this.updateCheckTimer) {
      clearInterval(this.updateCheckTimer);
      this.updateCheckTimer = null;
    }
  }

  /**
   * 设置离线状态监听
   */
  private setupOfflineListener(): void {
    window.addEventListener('online', () => {
      this.config.onOfflineChange?.(false);
    });

    window.addEventListener('offline', () => {
      this.config.onOfflineChange?.(true);
    });
  }
}

// 导出单例
export const swManager = new ServiceWorkerManager();

// ============ React Hook ============

import { useState, useEffect, useCallback } from 'react';

export interface UseServiceWorkerReturn {
  /** 是否支持 SW */
  isSupported: boolean;
  /** 是否已注册 */
  isRegistered: boolean;
  /** 是否有更新可用 */
  hasUpdate: boolean;
  /** 是否离线 */
  isOffline: boolean;
  /** 应用更新 */
  applyUpdate: () => Promise<void>;
  /** 检查更新 */
  checkUpdate: () => Promise<void>;
  /** 清除缓存 */
  clearCache: () => Promise<void>;
}

export function useServiceWorker(): UseServiceWorkerReturn {
  const [isSupported] = useState(() => 'serviceWorker' in navigator);
  const [isRegistered, setIsRegistered] = useState(false);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    if (!isSupported) return;

    swManager.register().then((reg) => {
      setIsRegistered(!!reg);
    });

    // 监听更新和离线状态
    const updateListener = () => setHasUpdate(true);
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    // 监听 SW 更新事件
    navigator.serviceWorker?.addEventListener('controllerchange', updateListener);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      navigator.serviceWorker?.removeEventListener('controllerchange', updateListener);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isSupported]);

  const applyUpdate = useCallback(async () => {
    await swManager.skipWaiting();
    setHasUpdate(false);
  }, []);

  const checkUpdate = useCallback(async () => {
    await swManager.checkUpdate();
  }, []);

  const clearCache = useCallback(async () => {
    await swManager.clearCache();
  }, []);

  return {
    isSupported,
    isRegistered,
    hasUpdate,
    isOffline,
    applyUpdate,
    checkUpdate,
    clearCache,
  };
}
