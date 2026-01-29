/**
 * 后端 API 测试
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import bcrypt from 'bcryptjs';
import { users, forms, submissions } from '../src/db/schema';
import { eq } from 'drizzle-orm';

describe('Database Schema', () => {
    let sqliteDb: Database.Database;
    let db: ReturnType<typeof drizzle>;

    beforeAll(() => {
        // 使用内存数据库进行测试
        sqliteDb = new Database(':memory:');
        db = drizzle(sqliteDb);

        // 创建表
        sqliteDb.exec(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (unixepoch())
      );

      CREATE TABLE forms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        name TEXT NOT NULL,
        description TEXT,
        schema TEXT NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch())
      );

      CREATE TABLE submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        form_id INTEGER NOT NULL REFERENCES forms(id),
        data TEXT NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (unixepoch())
      );
    `);
    });

    afterAll(() => {
        sqliteDb.close();
    });

    describe('Users', () => {
        it('should create a user', () => {
            const passwordHash = bcrypt.hashSync('test123456', 10);

            const result = db
                .insert(users)
                .values({
                    email: 'test@example.com',
                    passwordHash,
                })
                .returning()
                .get();

            expect(result).toBeDefined();
            expect(result.id).toBe(1);
            expect(result.email).toBe('test@example.com');
            expect(result.passwordHash).toBe(passwordHash);
        });

        it('should find user by email', () => {
            const result = db
                .select()
                .from(users)
                .where(eq(users.email, 'test@example.com'))
                .get();

            expect(result).toBeDefined();
            expect(result?.email).toBe('test@example.com');
        });

        it('should verify password', () => {
            const user = db
                .select()
                .from(users)
                .where(eq(users.email, 'test@example.com'))
                .get();

            const isValid = bcrypt.compareSync('test123456', user!.passwordHash);
            expect(isValid).toBe(true);

            const isInvalid = bcrypt.compareSync('wrongpassword', user!.passwordHash);
            expect(isInvalid).toBe(false);
        });
    });

    describe('Forms', () => {
        it('should create a form', () => {
            const result = db
                .insert(forms)
                .values({
                    userId: 1,
                    name: 'Test Form',
                    description: 'A test form',
                    schema: JSON.stringify([{ id: '1', type: 'input', props: {} }]),
                })
                .returning()
                .get();

            expect(result).toBeDefined();
            expect(result.id).toBe(1);
            expect(result.name).toBe('Test Form');
            expect(result.userId).toBe(1);
        });

        it('should get form by id', () => {
            const result = db
                .select()
                .from(forms)
                .where(eq(forms.id, 1))
                .get();

            expect(result).toBeDefined();
            expect(result?.name).toBe('Test Form');
            expect(JSON.parse(result?.schema as string)).toHaveLength(1);
        });

        it('should update form', () => {
            db.update(forms)
                .set({ name: 'Updated Form' })
                .where(eq(forms.id, 1))
                .run();

            const result = db
                .select()
                .from(forms)
                .where(eq(forms.id, 1))
                .get();

            expect(result?.name).toBe('Updated Form');
        });

        it('should list forms by user', () => {
            const results = db
                .select()
                .from(forms)
                .where(eq(forms.userId, 1))
                .all();

            expect(results).toHaveLength(1);
        });
    });

    describe('Submissions', () => {
        it('should create a submission', () => {
            const result = db
                .insert(submissions)
                .values({
                    formId: 1,
                    data: JSON.stringify({ name: 'John', email: 'john@example.com' }),
                })
                .returning()
                .get();

            expect(result).toBeDefined();
            expect(result.id).toBe(1);
            expect(result.formId).toBe(1);
        });

        it('should get submissions by form', () => {
            const results = db
                .select()
                .from(submissions)
                .where(eq(submissions.formId, 1))
                .all();

            expect(results).toHaveLength(1);
            expect(JSON.parse(results[0].data as string)).toEqual({
                name: 'John',
                email: 'john@example.com',
            });
        });
    });
});
