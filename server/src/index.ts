import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDatabase } from './db/index.js';
import { errorMiddleware } from './middleware/error.js';
import authRoutes from './routes/auth.js';
import formsRoutes from './routes/forms.js';
import { loggerMiddleware, rateLimitMiddleware } from './middleware/logger.js';

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// 请求日志（开发环境）
if (process.env.NODE_ENV !== 'production') {
    app.use(loggerMiddleware);
}

// 全局速率限制
app.use(rateLimitMiddleware({
    windowMs: 60000,  // 1 分钟
    maxRequests: 100,  // 每分钟最多 100 次请求
}));

// 根路由
app.get('/', (_req, res) => {
    res.json({
        message: 'LowCode Form API Server',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            auth: '/api/auth',
            forms: '/api/forms'
        }
    });
});

// 健康检查
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 轻量级前端遥测（可选）
app.post('/api/telemetry', (req, res) => {
    if (process.env.NODE_ENV !== 'production') {
        console.log('[telemetry]', req.body);
    }
    res.status(204).end();
});

// API 路由
app.use('/api/auth', authRoutes);

app.use('/api/forms', formsRoutes);

// 错误处理
app.use(errorMiddleware);

// 初始化数据库并启动服务器
initDatabase();

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`📚 API endpoints:`);
    console.log(`   POST   /api/auth/register`);
    console.log(`   POST   /api/auth/login`);
    console.log(`   GET    /api/auth/me`);
    console.log(`   DELETE /api/auth/account`);
    console.log(`   GET    /api/forms`);
    console.log(`   POST   /api/forms`);
    console.log(`   GET    /api/forms/:id`);
    console.log(`   PUT    /api/forms/:id`);
    console.log(`   DELETE /api/forms/:id`);
    console.log(`   POST   /api/forms/:id/submit`);
    console.log(`   GET    /api/forms/:id/submissions`);
});

export default app;
