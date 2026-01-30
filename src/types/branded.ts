
/**
 * Branded Types - 品牌类型增强类型安全
 * 
 * 面试考点：
 * 1. TypeScript 类型系统高级用法
 * 2. 名义类型 vs 结构类型
 * 3. 运行时类型安全
 * 4. 防止类型混用错误
 * 
 * 品牌类型通过在基础类型上添加"品牌标记"，使得看起来相同的类型在编译期被区分开。
 * 例如：ComponentId 和 TemplateId 都是 string，但不能互相赋值。
 * 
 * @example
 * ```tsx
 * const componentId = createComponentId(); // ComponentId 类型
 * const templateId = createTemplateId();   // TemplateId 类型
 * 
 * // ✅ 正确
 * findComponentById(components, componentId);
 * 
 * // ❌ 编译错误：不能将 TemplateId 赋值给 ComponentId
 * findComponentById(components, templateId);
 * ```
 */

import { nanoid } from 'nanoid';

// ============ 品牌类型定义 ============

/**
 * 品牌类型基础接口
 */
declare const __brand: unique symbol;
type Brand<T, B> = T & { readonly [__brand]: B };

/**
 * 组件 ID 类型
 */
export type ComponentId = Brand<string, 'ComponentId'>;

/**
 * 模板 ID 类型
 */
export type TemplateId = Brand<string, 'TemplateId'>;

/**
 * 用户 ID 类型
 */
export type UserId = Brand<string, 'UserId'>;

/**
 * 表单 ID 类型
 */
export type FormId = Brand<string, 'FormId'>;

/**
 * 表达式字符串类型（已验证的安全表达式）
 */
export type SafeExpression = Brand<string, 'SafeExpression'>;

/**
 * 正整数类型
 */
export type PositiveInteger = Brand<number, 'PositiveInteger'>;

/**
 * 百分比类型 (0-100)
 */
export type Percentage = Brand<number, 'Percentage'>;

/**
 * 非空字符串类型
 */
export type NonEmptyString = Brand<string, 'NonEmptyString'>;

/**
 * 邮箱地址类型
 */
export type Email = Brand<string, 'Email'>;

/**
 * 手机号类型
 */
export type PhoneNumber = Brand<string, 'PhoneNumber'>;

// ============ 类型创建函数 ============

/**
 * 创建组件 ID
 */
export function createComponentId(): ComponentId {
  return nanoid() as ComponentId;
}

/**
 * 将字符串转换为组件 ID（用于从外部数据恢复）
 * @throws 如果字符串为空
 */
export function toComponentId(id: string): ComponentId {
  if (!id || typeof id !== 'string') {
    throw new Error('Invalid ComponentId: must be a non-empty string');
  }
  return id as ComponentId;
}

/**
 * 创建模板 ID
 */
export function createTemplateId(): TemplateId {
  return `tpl_${nanoid()}` as TemplateId;
}

/**
 * 将字符串转换为模板 ID
 */
export function toTemplateId(id: string): TemplateId {
  if (!id || typeof id !== 'string') {
    throw new Error('Invalid TemplateId: must be a non-empty string');
  }
  return id as TemplateId;
}

/**
 * 创建用户 ID
 */
export function createUserId(): UserId {
  return `usr_${nanoid()}` as UserId;
}

/**
 * 创建表单 ID
 */
export function createFormId(): FormId {
  return `frm_${nanoid()}` as FormId;
}

/**
 * 创建安全表达式（需要先验证）
 */
export function createSafeExpression(expr: string): SafeExpression | null {
  // 这里只是标记，实际验证在 expression.ts 中
  // 简单检查是否包含危险字符
  const dangerous = ['eval', 'Function', 'setTimeout', 'setInterval', 'import', 'require'];
  if (dangerous.some(d => expr.includes(d))) {
    return null;
  }
  return expr as SafeExpression;
}

/**
 * 创建正整数
 */
export function toPositiveInteger(n: number): PositiveInteger {
  if (!Number.isInteger(n) || n <= 0) {
    throw new Error(`Invalid PositiveInteger: ${n}`);
  }
  return n as PositiveInteger;
}

/**
 * 创建百分比
 */
export function toPercentage(n: number): Percentage {
  if (n < 0 || n > 100) {
    throw new Error(`Invalid Percentage: ${n} (must be 0-100)`);
  }
  return n as Percentage;
}

/**
 * 创建非空字符串
 */
export function toNonEmptyString(s: string): NonEmptyString {
  if (!s || s.trim().length === 0) {
    throw new Error('Invalid NonEmptyString: must not be empty');
  }
  return s as NonEmptyString;
}

/**
 * 创建邮箱地址
 */
export function toEmail(s: string): Email {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(s)) {
    throw new Error(`Invalid Email: ${s}`);
  }
  return s as Email;
}

/**
 * 创建手机号
 */
export function toPhoneNumber(s: string): PhoneNumber {
  const phoneRegex = /^1[3-9]\d{9}$/;
  if (!phoneRegex.test(s)) {
    throw new Error(`Invalid PhoneNumber: ${s}`);
  }
  return s as PhoneNumber;
}

// ============ 类型守卫函数 ============

/**
 * 检查是否为有效的组件 ID
 */
export function isComponentId(value: unknown): value is ComponentId {
  return typeof value === 'string' && value.length > 0;
}

/**
 * 检查是否为有效的模板 ID
 */
export function isTemplateId(value: unknown): value is TemplateId {
  return typeof value === 'string' && value.startsWith('tpl_');
}

/**
 * 检查是否为有效的正整数
 */
export function isPositiveInteger(value: unknown): value is PositiveInteger {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

/**
 * 检查是否为有效的百分比
 */
export function isPercentage(value: unknown): value is Percentage {
  return typeof value === 'number' && value >= 0 && value <= 100;
}

/**
 * 检查是否为有效的邮箱
 */
export function isEmail(value: unknown): value is Email {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return typeof value === 'string' && emailRegex.test(value);
}

// ============ 工具类型 ============

/**
 * 移除品牌标记，获取基础类型
 */
export type Unbrand<T> = T extends Brand<infer U, unknown> ? U : T;

/**
 * 深度移除品牌标记
 */
export type DeepUnbrand<T> = T extends Brand<infer U, unknown>
  ? U
  : T extends object
  ? { [K in keyof T]: DeepUnbrand<T[K]> }
  : T;
