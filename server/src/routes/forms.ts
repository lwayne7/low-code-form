import { Router } from 'express';
import { db } from '../db/index.js';
import { forms, submissions } from '../db/schema.js';
import { eq, and, desc } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth.js';
import { asyncHandler, Errors } from '../middleware/error.js';

const router = Router();

// 所有表单路由都需要认证
router.use(authMiddleware);

// 获取用户的表单列表
router.get(
    '/',
    asyncHandler(async (req, res) => {
        const userId = req.userId!;

        const userForms = db
            .select({
                id: forms.id,
                name: forms.name,
                description: forms.description,
                createdAt: forms.createdAt,
                updatedAt: forms.updatedAt,
            })
            .from(forms)
            .where(eq(forms.userId, userId))
            .orderBy(desc(forms.updatedAt))
            .all();

        res.json({ forms: userForms });
    })
);

// 获取单个表单详情
router.get(
    '/:id',
    asyncHandler(async (req, res) => {
        const userId = req.userId!;
        const formId = parseInt(req.params.id, 10);

        if (isNaN(formId)) {
            throw Errors.badRequest('Invalid form ID');
        }

        const form = db
            .select()
            .from(forms)
            .where(and(eq(forms.id, formId), eq(forms.userId, userId)))
            .get();

        if (!form) {
            throw Errors.notFound('Form not found');
        }

        res.json({ form });
    })
);

// 创建新表单
router.post(
    '/',
    asyncHandler(async (req, res) => {
        const userId = req.userId!;
        const { name, description, schema } = req.body;

        if (!name) {
            throw Errors.badRequest('Form name is required');
        }

        if (!schema) {
            throw Errors.badRequest('Form schema is required');
        }

        const result = db
            .insert(forms)
            .values({
                userId,
                name,
                description: description || null,
                schema: schema,
            })
            .returning()
            .get();

        res.status(201).json({
            message: 'Form created successfully',
            form: result,
        });
    })
);

// 更新表单
router.put(
    '/:id',
    asyncHandler(async (req, res) => {
        const userId = req.userId!;
        const formId = parseInt(req.params.id, 10);
        const { name, description, schema } = req.body;

        if (isNaN(formId)) {
            throw Errors.badRequest('Invalid form ID');
        }

        // 检查表单是否存在且属于当前用户
        const existingForm = db
            .select()
            .from(forms)
            .where(and(eq(forms.id, formId), eq(forms.userId, userId)))
            .get();

        if (!existingForm) {
            throw Errors.notFound('Form not found');
        }

        const result = db
            .update(forms)
            .set({
                name: name ?? existingForm.name,
                description: description ?? existingForm.description,
                schema: schema ?? existingForm.schema,
                updatedAt: new Date(),
            })
            .where(eq(forms.id, formId))
            .returning()
            .get();

        res.json({
            message: 'Form updated successfully',
            form: result,
        });
    })
);

// 删除表单
router.delete(
    '/:id',
    asyncHandler(async (req, res) => {
        const userId = req.userId!;
        const formId = parseInt(req.params.id, 10);

        if (isNaN(formId)) {
            throw Errors.badRequest('Invalid form ID');
        }

        // 检查表单是否存在且属于当前用户
        const existingForm = db
            .select()
            .from(forms)
            .where(and(eq(forms.id, formId), eq(forms.userId, userId)))
            .get();

        if (!existingForm) {
            throw Errors.notFound('Form not found');
        }

        // 先删除关联的提交数据
        db.delete(submissions).where(eq(submissions.formId, formId)).run();

        // 再删除表单
        db.delete(forms).where(eq(forms.id, formId)).run();

        res.json({ message: 'Form deleted successfully' });
    })
);

// 提交表单数据
router.post(
    '/:id/submit',
    asyncHandler(async (req, res) => {
        const formId = parseInt(req.params.id, 10);
        const { data } = req.body;

        if (isNaN(formId)) {
            throw Errors.badRequest('Invalid form ID');
        }

        // 检查表单是否存在（不需要验证用户，任何人都可以提交）
        const form = db.select().from(forms).where(eq(forms.id, formId)).get();

        if (!form) {
            throw Errors.notFound('Form not found');
        }

        const result = db
            .insert(submissions)
            .values({
                formId,
                data: data || {},
            })
            .returning()
            .get();

        res.status(201).json({
            message: 'Form submitted successfully',
            submission: result,
        });
    })
);

// 获取表单的提交数据列表
router.get(
    '/:id/submissions',
    asyncHandler(async (req, res) => {
        const userId = req.userId!;
        const formId = parseInt(req.params.id, 10);

        if (isNaN(formId)) {
            throw Errors.badRequest('Invalid form ID');
        }

        // 检查表单是否存在且属于当前用户
        const form = db
            .select()
            .from(forms)
            .where(and(eq(forms.id, formId), eq(forms.userId, userId)))
            .get();

        if (!form) {
            throw Errors.notFound('Form not found');
        }

        const formSubmissions = db
            .select()
            .from(submissions)
            .where(eq(submissions.formId, formId))
            .orderBy(desc(submissions.createdAt))
            .all();

        res.json({ submissions: formSubmissions });
    })
);

export default router;
