import type { Request, Response, NextFunction } from 'express';

// API 错误类
export class ApiError extends Error {
    constructor(
        public statusCode: number,
        message: string
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

// 常用错误工厂
export const Errors = {
    badRequest: (message: string) => new ApiError(400, message),
    unauthorized: (message = '未授权访问') => new ApiError(401, message),
    forbidden: (message = '禁止访问') => new ApiError(403, message),
    notFound: (message = '资源不存在') => new ApiError(404, message),
    conflict: (message: string) => new ApiError(409, message),
    internal: (message = '服务器内部错误') => new ApiError(500, message),
};

// 全局错误处理中间件
export function errorMiddleware(
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
) {
    console.error('Error:', err.message);

    if (err instanceof ApiError) {
        res.status(err.statusCode).json({
            error: err.message,
            code: err.statusCode,
        });
        return;
    }

    // 未知错误
    res.status(500).json({
        error: '服务器内部错误',
        code: 500,
    });
}

// 异步路由包装器
export function asyncHandler(
    fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
