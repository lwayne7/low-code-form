import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/index.js';
import { users, forms, submissions } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { generateToken, authMiddleware } from '../middleware/auth.js';
import { asyncHandler, Errors } from '../middleware/error.js';
import { loginRateLimiter } from '../middleware/logger.js';

const router = Router();

// 用户注册
router.post(
    '/register',
    asyncHandler(async (req, res) => {
        const { email, password } = req.body;

        if (!email || !password) {
            throw Errors.badRequest('邮箱和密码不能为空');
        }

        if (password.length < 6) {
            throw Errors.badRequest('密码至少需要6位字符');
        }

        // 检查邮箱是否已存在
        const existingUser = db.select().from(users).where(eq(users.email, email)).get();
        if (existingUser) {
            throw Errors.conflict('该邮箱已被注册');
        }

        // 哈希密码
        const passwordHash = await bcrypt.hash(password, 10);

        // 创建用户
        const result = db
            .insert(users)
            .values({ email, passwordHash })
            .returning({ id: users.id, email: users.email })
            .get();

        // 生成 Token
        const token = generateToken(result.id);

        res.status(201).json({
            message: '注册成功',
            user: { id: result.id, email: result.email },
            token,
        });
    })
);

// 用户登录（带速率限制防暴力破解）
router.post(
    '/login',
    loginRateLimiter,
    asyncHandler(async (req, res) => {
        const { email, password } = req.body;

        if (!email || !password) {
            throw Errors.badRequest('邮箱和密码不能为空');
        }

        // 查找用户
        const user = db.select().from(users).where(eq(users.email, email)).get();
        if (!user) {
            throw Errors.unauthorized('邮箱或密码错误');
        }

        // 验证密码
        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
            throw Errors.unauthorized('邮箱或密码错误');
        }

        // 生成 Token
        const token = generateToken(user.id);

        res.json({
            message: '登录成功',
            user: { id: user.id, email: user.email },
            token,
        });
    })
);

// 获取当前用户信息（需要认证）
router.get(
    '/me',
    authMiddleware,
    asyncHandler(async (req, res) => {
        if (!req.userId) {
            throw Errors.unauthorized();
        }

        const user = db
            .select({ id: users.id, email: users.email, createdAt: users.createdAt })
            .from(users)
            .where(eq(users.id, req.userId))
            .get();

        if (!user) {
            throw Errors.notFound('用户不存在');
        }

        res.json({ user });
    })
);

// 删除账号（需要认证）
router.delete(
    '/account',
    authMiddleware,
    asyncHandler(async (req, res) => {
        if (!req.userId) {
            throw Errors.unauthorized();
        }

        // 获取用户的所有表单
        const userForms = db.select({ id: forms.id }).from(forms).where(eq(forms.userId, req.userId)).all();

        // 删除用户表单的所有提交记录
        for (const form of userForms) {
            db.delete(submissions).where(eq(submissions.formId, form.id)).run();
        }

        // 删除用户的所有表单
        db.delete(forms).where(eq(forms.userId, req.userId)).run();

        // 删除用户
        db.delete(users).where(eq(users.id, req.userId)).run();

        res.json({ message: 'Account deleted successfully' });
    })
);

export default router;
