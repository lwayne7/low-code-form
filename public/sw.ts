/// <reference lib="webworker" />

/**
 * Service Worker - PWA 离线支持
 *
 * 面试考点：
 * 1. Service Worker 生命周期
 * 2. 缓存策略（Cache First, Network First, Stale While Revalidate）
 * 3. 离线功能实现
 * 4. 后台同步
 *
 * 策略说明：
 * - 静态资源：Cache First（优先使用缓存）
 * - API 请求：Network First（优先网络，失败后使用缓存）
 * - 图片资源：Stale While Revalidate（返回缓存同时更新）
 */

declare const self: ServiceWorkerGlobalScope;

// 缓存版本号（更新时修改此值）
const CACHE_VERSION = 'v1';
const CACHE_NAME = `lowcode-form-${CACHE_VERSION}`;
const API_CACHE_NAME = `lowcode-api-${CACHE_VERSION}`;

// 需要预缓存的静态资源
const PRECACHE_URLS = ['/', '/index.html', '/manifest.json'];

// API 请求路径前缀
const API_PATH_PREFIX = '/api/';

// 需要缓存的静态资源扩展名
const STATIC_EXTENSIONS = [
  '.js',
  '.css',
  '.woff2',
  '.woff',
  '.ttf',
  '.svg',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.ico',
];

// 不缓存的路径
const NO_CACHE_PATHS = ['/api/auth/', '/api/telemetry'];

// ============ 工具函数 ============

/**
 * 判断是否是需要缓存的静态资源
 */
function isStaticAsset(url: URL): boolean {
  return STATIC_EXTENSIONS.some((ext) => url.pathname.endsWith(ext));
}

/**
 * 判断是否是 API 请求
 */
function isApiRequest(url: URL): boolean {
  return url.pathname.startsWith(API_PATH_PREFIX);
}

/**
 * 判断是否应该跳过缓存
 */
function shouldSkipCache(url: URL): boolean {
  return NO_CACHE_PATHS.some((path) => url.pathname.startsWith(path));
}

/**
 * 判断是否是导航请求
 */
function isNavigationRequest(request: Request): boolean {
  return request.mode === 'navigate';
}

// ============ 缓存策略 ============

/**
 * Cache First 策略
 * 优先使用缓存，缓存不存在则请求网络
 */
async function cacheFirst(request: Request, cacheName: string): Promise<Response> {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // 返回离线页面或错误响应
    return new Response('Offline', { status: 503 });
  }
}

/**
 * Network First 策略
 * 优先使用网络，网络失败则使用缓存
 */
async function networkFirst(request: Request, cacheName: string): Promise<Response> {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    return new Response(JSON.stringify({ error: 'Offline', cached: false }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Stale While Revalidate 策略
 * 立即返回缓存，同时在后台更新缓存
 */
async function staleWhileRevalidate(request: Request, cacheName: string): Promise<Response> {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  // 后台更新
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  // 如果有缓存，立即返回
  if (cached) {
    return cached;
  }

  // 没有缓存，等待网络请求
  const response = await fetchPromise;
  if (response) {
    return response;
  }

  return new Response('Offline', { status: 503 });
}

// ============ Service Worker 事件处理 ============

/**
 * Install 事件：预缓存静态资源
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Pre-caching static assets');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        // 跳过等待，立即激活
        return self.skipWaiting();
      })
  );
});

/**
 * Activate 事件：清理旧缓存
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter(
              (name) =>
                name.startsWith('lowcode-') && name !== CACHE_NAME && name !== API_CACHE_NAME
            )
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        // 接管所有客户端
        return self.clients.claim();
      })
  );
});

/**
 * Fetch 事件：处理网络请求
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 只处理同源请求
  if (url.origin !== self.location.origin) {
    return;
  }

  // 跳过不缓存的路径
  if (shouldSkipCache(url)) {
    return;
  }

  // 处理 API 请求
  if (isApiRequest(url)) {
    event.respondWith(networkFirst(request, API_CACHE_NAME));
    return;
  }

  // 处理导航请求
  if (isNavigationRequest(request)) {
    event.respondWith(
      caches.match('/index.html').then((response) => {
        return response || fetch(request);
      })
    );
    return;
  }

  // 处理静态资源
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, CACHE_NAME));
    return;
  }

  // 其他请求使用 Stale While Revalidate
  event.respondWith(staleWhileRevalidate(request, CACHE_NAME));
});

/**
 * Message 事件：与主线程通信
 */
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }

  if (event.data === 'clearCache') {
    caches.keys().then((names) => {
      names.forEach((name) => caches.delete(name));
    });
  }
});

/**
 * Push 事件：处理推送通知
 */
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();

  event.waitUntil(
    self.registration.showNotification(data.title || 'LowCode Form', {
      body: data.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: data.url,
    })
  );
});

/**
 * NotificationClick 事件：处理通知点击
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.notification.data) {
    event.waitUntil(self.clients.openWindow(event.notification.data));
  }
});

/**
 * Sync 事件：后台同步
 */
self.addEventListener('sync', (event: Event) => {
  const syncEvent = event as ExtendableEvent & { tag: string };
  if (syncEvent.tag === 'sync-forms') {
    syncEvent.waitUntil(syncForms());
  }
});

/**
 * 同步表单数据
 */
async function syncForms(): Promise<void> {
  // 从 IndexedDB 获取待同步的数据
  // 这里只是示例，实际实现需要配合 IndexedDB
  console.log('[SW] Syncing forms...');
}

export {};
