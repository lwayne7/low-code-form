import type { Request, Response, NextFunction } from 'express';

/**
 * 请求日志中间件
 * 
 * 记录每个请求的方法、路径、状态码和响应时间
 * 面试考点：中间件设计模式、性能监控
 */
export function loggerMiddleware(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    const { method, url } = req;

    // 响应完成时记录日志
    res.on('finish', () => {
        const duration = Date.now() - start;
        const { statusCode } = res;
        
        // 根据状态码选择日志级别
        const logFn = statusCode >= 400 ? console.error : console.log;
        const statusEmoji = statusCode >= 500 ? '❌' : statusCode >= 400 ? '⚠️' : '✅';
        
        logFn(
            `${statusEmoji} ${method} ${url} ${statusCode} - ${duration}ms`
        );
    });

    next();
}

/**
 * 简单的内存速率限制器
 * 
 * 面试考点：防暴力破解、滑动窗口算法
 * 
 * 生产环境建议使用 Redis 实现分布式限流
 */
interface RateLimitRecord {
    count: number;
    resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// 定期清理过期记录
setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
        if (now > record.resetTime) {
            rateLimitStore.delete(key);
        }
    }
}, 60000); // 每分钟清理一次

export interface RateLimitOptions {
    windowMs?: number;  // 时间窗口（毫秒）
    maxRequests?: number;  // 最大请求数
    message?: string;  // 超限提示信息
    keyGenerator?: (req: Request) => string;  // 自定义 key 生成器
}

export function rateLimitMiddleware(options: RateLimitOptions = {}) {
    const {
        windowMs = 60000,  // 默认 1 分钟
        maxRequests = 100,  // 默认每分钟 100 次
        message = '请求过于频繁，请稍后再试',
        keyGenerator = (req) => req.ip || req.socket.remoteAddress || 'unknown',
    } = options;

    return (req: Request, res: Response, next: NextFunction) => {
        const key = keyGenerator(req);
        const now = Date.now();

        let record = rateLimitStore.get(key);

        if (!record || now > record.resetTime) {
            // 创建新记录或重置过期记录
            record = { count: 1, resetTime: now + windowMs };
            rateLimitStore.set(key, record);
        } else {
            record.count++;
        }

        // 设置速率限制响应头
        res.setHeader('X-RateLimit-Limit', maxRequests);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count));
        res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

        if (record.count > maxRequests) {
            res.status(429).json({
                error: message,
                code: 429,
                retryAfter: Math.ceil((record.resetTime - now) / 1000),
            });
            return;
        }

        next();
    };
}

/**
 * 登录专用速率限制（更严格）
 * 防止暴力破解密码
 */
export const loginRateLimiter = rateLimitMiddleware({
    windowMs: 15 * 60 * 1000,  // 15 分钟
    maxRequests: 5,  // 最多 5 次失败尝试
    message: '登录尝试次数过多，请 15 分钟后再试',
    keyGenerator: (req) => `login:${req.ip}:${req.body?.email || 'unknown'}`,
});
