/**
 * Logger - 结构化日志系统
 *
 * 面试考点：
 * 1. 结构化日志设计
 * 2. 日志级别控制
 * 3. 批量上报优化
 * 4. 敏感信息脱敏
 * 5. 单例模式
 *
 * @example
 * ```tsx
 * // 记录日志
 * logger.info('User action', { action: 'click', target: 'button' });
 *
 * // 记录错误
 * logger.error('API failed', { endpoint: '/api/forms', status: 500 });
 *
 * // 带上下文的日志
 * const userLogger = logger.child({ userId: 'user-123' });
 * userLogger.info('Form saved');
 * ```
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  context: Record<string, unknown>;
  stack?: string;
  sessionId?: string;
}

// 敏感字段列表
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'accessToken',
  'refreshToken',
  'secret',
  'apiKey',
  'authorization',
  'cookie',
  'creditCard',
  'ssn',
  'phone',
  'email',
];

// 日志级别优先级
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// 配置接口
export interface LoggerConfig {
  /** 最小日志级别 */
  minLevel: LogLevel;
  /** 是否启用控制台输出 */
  enableConsole: boolean;
  /** 是否启用远程上报 */
  enableRemote: boolean;
  /** 远程上报地址 */
  remoteEndpoint?: string;
  /** 批量上报大小 */
  batchSize: number;
  /** 批量上报间隔（毫秒） */
  flushInterval: number;
  /** 是否启用敏感信息脱敏 */
  enableSanitization: boolean;
  /** 采样率 (0-1) */
  sampleRate: number;
}

// 默认配置
const DEFAULT_CONFIG: LoggerConfig = {
  minLevel: import.meta.env.DEV ? 'debug' : 'info',
  enableConsole: true,
  enableRemote: !import.meta.env.DEV,
  remoteEndpoint: '/api/logs',
  batchSize: 10,
  flushInterval: 5000,
  enableSanitization: true,
  sampleRate: 1,
};

/**
 * 脱敏处理
 */
function sanitizeValue(value: unknown, key: string): unknown {
  // 检查是否是敏感字段
  const lowerKey = key.toLowerCase();
  if (SENSITIVE_FIELDS.some((field) => lowerKey.includes(field.toLowerCase()))) {
    if (typeof value === 'string') {
      if (value.length <= 4) return '****';
      return value.slice(0, 2) + '****' + value.slice(-2);
    }
    return '[REDACTED]';
  }
  return value;
}

/**
 * 深度脱敏对象
 */
function sanitizeObject(
  obj: Record<string, unknown>,
  enableSanitization: boolean
): Record<string, unknown> {
  if (!enableSanitization) return obj;

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = sanitizeObject(value as Record<string, unknown>, enableSanitization);
    } else {
      result[key] = sanitizeValue(value, key);
    }
  }
  return result;
}

/**
 * 生成会话 ID
 */
function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}

class LoggerImpl {
  private static instance: LoggerImpl;
  private config: LoggerConfig;
  private buffer: LogEntry[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private sessionId: string;
  private defaultContext: Record<string, unknown> = {};

  private constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.sessionId = generateSessionId();
    this.startFlushTimer();
  }

  /**
   * 获取单例实例
   */
  static getInstance(config?: Partial<LoggerConfig>): LoggerImpl {
    if (!LoggerImpl.instance) {
      LoggerImpl.instance = new LoggerImpl(config);
    }
    return LoggerImpl.instance;
  }

  /**
   * 更新配置
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
    this.restartFlushTimer();
  }

  /**
   * 设置默认上下文（例如用户信息）
   */
  setContext(context: Record<string, unknown>): void {
    this.defaultContext = { ...this.defaultContext, ...context };
  }

  /**
   * 清除上下文
   */
  clearContext(): void {
    this.defaultContext = {};
  }

  /**
   * 创建子日志器（带预设上下文）
   */
  child(context: Record<string, unknown>): ChildLogger {
    return new ChildLogger(this, context);
  }

  /**
   * 记录 debug 级别日志
   */
  debug(message: string, context: Record<string, unknown> = {}): void {
    this.log('debug', message, context);
  }

  /**
   * 记录 info 级别日志
   */
  info(message: string, context: Record<string, unknown> = {}): void {
    this.log('info', message, context);
  }

  /**
   * 记录 warn 级别日志
   */
  warn(message: string, context: Record<string, unknown> = {}): void {
    this.log('warn', message, context);
  }

  /**
   * 记录 error 级别日志
   */
  error(message: string, context: Record<string, unknown> = {}, error?: Error): void {
    this.log('error', message, {
      ...context,
      ...(error && {
        errorName: error.name,
        errorMessage: error.message,
        stack: error.stack,
      }),
    });
  }

  /**
   * 核心日志方法
   */
  private log(level: LogLevel, message: string, context: Record<string, unknown>): void {
    // 检查日志级别
    if (LOG_LEVEL_PRIORITY[level] < LOG_LEVEL_PRIORITY[this.config.minLevel]) {
      return;
    }

    // 采样
    if (Math.random() > this.config.sampleRate) {
      return;
    }

    // 合并上下文并脱敏
    const mergedContext = sanitizeObject(
      { ...this.defaultContext, ...context },
      this.config.enableSanitization
    );

    const entry: LogEntry = {
      level,
      message,
      timestamp: Date.now(),
      context: mergedContext,
      sessionId: this.sessionId,
    };

    // 控制台输出
    if (this.config.enableConsole) {
      this.consoleOutput(entry);
    }

    // 添加到缓冲区
    if (this.config.enableRemote) {
      this.buffer.push(entry);

      // 达到批量大小时立即发送
      if (this.buffer.length >= this.config.batchSize) {
        this.flush();
      }
    }
  }

  /**
   * 控制台输出
   */
  private consoleOutput(entry: LogEntry): void {
    const timestamp = new Date(entry.timestamp).toISOString();
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}]`;

    const consoleMethod = {
      debug: console.debug,
      info: console.info,
      warn: console.warn,
      error: console.error,
    }[entry.level];

    const style = {
      debug: 'color: #6b7280',
      info: 'color: #3b82f6',
      warn: 'color: #f59e0b',
      error: 'color: #ef4444',
    }[entry.level];

    if (Object.keys(entry.context).length > 0) {
      consoleMethod(`%c${prefix} ${entry.message}`, style, entry.context);
    } else {
      consoleMethod(`%c${prefix} ${entry.message}`, style);
    }
  }

  /**
   * 立即发送所有缓冲日志
   */
  async flush(): Promise<void> {
    if (this.buffer.length === 0 || !this.config.enableRemote) {
      return;
    }

    const logsToSend = [...this.buffer];
    this.buffer = [];

    try {
      if (this.config.remoteEndpoint) {
        // 使用 sendBeacon 保证页面关闭时也能发送
        if (navigator.sendBeacon) {
          const blob = new Blob([JSON.stringify(logsToSend)], { type: 'application/json' });
          navigator.sendBeacon(this.config.remoteEndpoint, blob);
        } else {
          await fetch(this.config.remoteEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(logsToSend),
            keepalive: true,
          });
        }
      }
    } catch (err) {
      // 发送失败，将日志放回缓冲区
      this.buffer = [...logsToSend, ...this.buffer];
      console.error('[Logger] Failed to flush logs:', err);
    }
  }

  /**
   * 启动定时刷新
   */
  private startFlushTimer(): void {
    if (this.config.flushInterval > 0) {
      this.flushTimer = setInterval(() => {
        this.flush();
      }, this.config.flushInterval);
    }

    // 页面卸载时发送剩余日志
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flush();
      });
      window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.flush();
        }
      });
    }
  }

  /**
   * 重启定时刷新
   */
  private restartFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.startFlushTimer();
  }

  /**
   * 获取缓冲区日志（用于调试）
   */
  getBuffer(): LogEntry[] {
    return [...this.buffer];
  }

  /**
   * 获取会话 ID
   */
  getSessionId(): string {
    return this.sessionId;
  }
}

/**
 * 子日志器（带预设上下文）
 */
class ChildLogger {
  private parent: LoggerImpl;
  private context: Record<string, unknown>;

  constructor(parent: LoggerImpl, context: Record<string, unknown>) {
    this.parent = parent;
    this.context = context;
  }

  debug(message: string, context: Record<string, unknown> = {}): void {
    this.parent.debug(message, { ...this.context, ...context });
  }

  info(message: string, context: Record<string, unknown> = {}): void {
    this.parent.info(message, { ...this.context, ...context });
  }

  warn(message: string, context: Record<string, unknown> = {}): void {
    this.parent.warn(message, { ...this.context, ...context });
  }

  error(message: string, context: Record<string, unknown> = {}, error?: Error): void {
    this.parent.error(message, { ...this.context, ...context }, error);
  }

  child(context: Record<string, unknown>): ChildLogger {
    return new ChildLogger(this.parent, { ...this.context, ...context });
  }
}

// 导出单例实例
export const logger = LoggerImpl.getInstance();

// 导出类型供扩展使用
export type { LoggerImpl, ChildLogger };
