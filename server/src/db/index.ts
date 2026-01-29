import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.js';
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

// 确保 data 目录存在
const dbPath = process.env.DATABASE_URL || './data/database.sqlite';
const dbDir = dirname(dbPath);
if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true });
}

// 创建 SQLite 连接
const sqlite = new Database(dbPath);

// 启用 WAL 模式，提升并发性能
sqlite.pragma('journal_mode = WAL');

// 创建 Drizzle 实例
export const db = drizzle(sqlite, { schema });

// 初始化数据库表（简单的 DDL）
export function initDatabase() {
    sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS forms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      description TEXT,
      schema TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      form_id INTEGER NOT NULL REFERENCES forms(id),
      data TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE INDEX IF NOT EXISTS idx_forms_user_id ON forms(user_id);
    CREATE INDEX IF NOT EXISTS idx_submissions_form_id ON submissions(form_id);
  `);

    console.log('✅ Database initialized');
}

export { sqlite };
