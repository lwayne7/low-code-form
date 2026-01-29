import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// 用户表
export const users = sqliteTable('users', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
        .notNull()
        .$defaultFn(() => new Date()),
});

// 表单配置表
export const forms = sqliteTable('forms', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id')
        .notNull()
        .references(() => users.id),
    name: text('name').notNull(),
    description: text('description'),
    schema: text('schema', { mode: 'json' }).notNull(), // JSON 存储表单结构
    createdAt: integer('created_at', { mode: 'timestamp' })
        .notNull()
        .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
        .notNull()
        .$defaultFn(() => new Date()),
});

// 表单提交数据表
export const submissions = sqliteTable('submissions', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    formId: integer('form_id')
        .notNull()
        .references(() => forms.id),
    data: text('data', { mode: 'json' }).notNull(), // JSON 存储提交数据
    createdAt: integer('created_at', { mode: 'timestamp' })
        .notNull()
        .$defaultFn(() => new Date()),
});

// 类型导出
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Form = typeof forms.$inferSelect;
export type NewForm = typeof forms.$inferInsert;
export type Submission = typeof submissions.$inferSelect;
export type NewSubmission = typeof submissions.$inferInsert;
