/**
 * 后端中间件单元测试
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Express request/response 类型
interface MockRequest {
    method: string;
    url: string;
    ip: string;
    body: Record<string, unknown>;
    socket: { remoteAddress: string };
}

interface MockResponse {
    _status: number;
    _json: unknown;
    _headers: Record<string, string | number>;
    status: (code: number) => MockResponse;
    json: (data: unknown) => MockResponse;
    setHeader: (key: string, value: string | number) => MockResponse;
    on: ReturnType<typeof vi.fn>;
}

function createMockReq(overrides: Partial<MockRequest> = {}): MockRequest {
    return {
        method: 'GET',
        url: '/api/test',
        ip: '127.0.0.1',
        body: {},
        socket: { remoteAddress: '127.0.0.1' } as any,
        ...overrides,
    };
}

function createMockRes(): MockResponse {
    const res: MockResponse = {
        _status: 200,
        _json: null,
        _headers: {},
        status(code: number) {
            this._status = code;
            return this;
        },
        json(data: unknown) {
            this._json = data;
            return this;
        },
        setHeader(key: string, value: string | number) {
            this._headers[key] = value;
            return this;
        },
        on: vi.fn(),
    };
    return res;
}

describe('Rate Limit Middleware', () => {
    beforeEach(() => {
        vi.resetModules();
    });

    it('应该允许正常请求通过', async () => {
        const { rateLimitMiddleware } = await import('../../server/src/middleware/logger');
        
        const middleware = rateLimitMiddleware({ maxRequests: 10, windowMs: 60000 });
        const req = createMockReq({ ip: 'test-ip-1' });
        const res = createMockRes();
        const next = vi.fn();

        middleware(req as any, res as any, next);

        expect(next).toHaveBeenCalled();
        expect(res._headers['X-RateLimit-Limit']).toBe(10);
        expect(res._headers['X-RateLimit-Remaining']).toBe(9);
    });

    it('应该在超过限制时返回 429', async () => {
        const { rateLimitMiddleware } = await import('../../server/src/middleware/logger');
        
        const middleware = rateLimitMiddleware({ maxRequests: 2, windowMs: 60000 });
        const req = createMockReq({ ip: 'test-ip-2' });
        const next = vi.fn();

        // 前两次请求应该通过
        for (let i = 0; i < 2; i++) {
            const res = createMockRes();
            middleware(req as any, res as any, next);
        }
        expect(next).toHaveBeenCalledTimes(2);

        // 第三次请求应该被限制
        const res = createMockRes();
        middleware(req as any, res as any, next);
        
        expect(res._status).toBe(429);
        expect(res._json).toEqual(expect.objectContaining({
            code: 429,
        }));
    });

    it('应该支持自定义 key 生成器', async () => {
        const { rateLimitMiddleware } = await import('../../server/src/middleware/logger');
        
        const customKeyGen = vi.fn().mockReturnValue('custom-key');
        const middleware = rateLimitMiddleware({ 
            maxRequests: 10, 
            keyGenerator: customKeyGen 
        });
        
        const req = createMockReq();
        const res = createMockRes();
        const next = vi.fn();

        middleware(req as any, res as any, next);

        expect(customKeyGen).toHaveBeenCalledWith(req);
    });
});

describe('Login Rate Limiter', () => {
    it('应该对登录尝试有更严格的限制', async () => {
        const { loginRateLimiter } = await import('../../server/src/middleware/logger');
        
        expect(loginRateLimiter).toBeDefined();
        expect(typeof loginRateLimiter).toBe('function');
    });
});

describe('Logger Middleware', () => {
    it('应该调用 next 继续处理', async () => {
        const { loggerMiddleware } = await import('../../server/src/middleware/logger');
        
        const req = createMockReq();
        const res = createMockRes();
        const next = vi.fn();

        loggerMiddleware(req as any, res as any, next);

        expect(next).toHaveBeenCalled();
        expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
    });
});
