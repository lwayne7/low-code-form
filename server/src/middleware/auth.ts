import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';

// 扩展 Request 类型 - 使用模块扩展而非 namespace
declare module 'express-serve-static-core' {
    interface Request {
        userId?: number;
    }
}

// JWT Token 验证中间件
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'No token provided' });
        return;
    }

    const token = authHeader.substring(7);

    try {
        const payload = jwt.verify(token, JWT_SECRET) as { userId: number };
        req.userId = payload.userId;
        next();
    } catch {
        res.status(401).json({ error: 'Invalid token' });
        return;
    }
}

// 生成 JWT Token
export function generateToken(userId: number): string {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}
