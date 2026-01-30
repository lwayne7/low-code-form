/**
 * Zod Schemas - 运行时类型校验
 * 
 * 面试考点：
 * 1. 运行时校验 vs 编译时校验
 * 2. Schema-first 设计
 * 3. 类型推断（z.infer）
 * 4. 数据验证和转换
 * 
 * @example
 * ```tsx
 * // 验证导入的 JSON 数据
 * const result = ComponentSchemaZ.safeParse(jsonData);
 * if (result.success) {
 *   // result.data 是类型安全的 ComponentSchema
 * } else {
 *   console.error(result.error.issues);
 * }
 * ```
 */

import { z } from 'zod';

// ============ 基础类型 Schema ============

/**
 * 组件类型枚举
 */
export const ComponentTypeZ = z.enum([
  'Input',
  'TextArea',
  'InputNumber',
  'Select',
  'Radio',
  'Checkbox',
  'Switch',
  'DatePicker',
  'TimePicker',
  'Button',
  'Container',
]);

/**
 * 组件选项（用于 Select、Radio、Checkbox）
 */
export const ComponentOptionZ = z.object({
  label: z.string(),
  value: z.string(),
});

/**
 * 校验规则类型
 */
export const ValidationRuleTypeZ = z.enum([
  'required',
  'minLength',
  'maxLength',
  'pattern',
  'min',
  'max',
  'email',
  'phone',
  'custom',
]);

/**
 * 校验规则
 */
export const ValidationRuleZ = z.object({
  type: ValidationRuleTypeZ,
  value: z.union([z.string(), z.number(), z.boolean()]).optional(),
  message: z.string(),
});

/**
 * 响应式配置
 */
export const ResponsiveConfigZ = z.object({
  xs: z.number().min(1).max(24).optional(),
  sm: z.number().min(1).max(24).optional(),
  md: z.number().min(1).max(24).optional(),
  lg: z.number().min(1).max(24).optional(),
  xl: z.number().min(1).max(24).optional(),
  xxl: z.number().min(1).max(24).optional(),
});

// ============ 组件属性 Schema ============

/**
 * 基础组件属性
 */
export const BaseComponentPropsZ = z.object({
  visibleOn: z.string().optional(),
  rules: z.array(ValidationRuleZ).optional(),
  responsive: ResponsiveConfigZ.optional(),
  colSpan: z.number().min(1).max(24).optional(),
  locked: z.boolean().optional(),
});

/**
 * 容器属性
 */
export const ContainerPropsZ = BaseComponentPropsZ.extend({
  label: z.string().optional(),
  direction: z.enum(['vertical', 'horizontal']).optional(),
  columns: z.number().min(1).max(12).optional(),
  gutter: z.number().min(0).optional(),
});

/**
 * 输入框属性
 */
export const InputPropsZ = BaseComponentPropsZ.extend({
  label: z.string(),
  placeholder: z.string().optional().default(''),
  required: z.boolean().optional(),
});

/**
 * 多行文本属性
 */
export const TextAreaPropsZ = BaseComponentPropsZ.extend({
  label: z.string(),
  placeholder: z.string().optional().default(''),
  rows: z.number().min(1).max(20).optional(),
  required: z.boolean().optional(),
});

/**
 * 数字输入属性
 */
export const InputNumberPropsZ = BaseComponentPropsZ.extend({
  label: z.string(),
  placeholder: z.string().optional().default(''),
  required: z.boolean().optional(),
});

/**
 * 选择器属性
 */
export const SelectPropsZ = BaseComponentPropsZ.extend({
  label: z.string(),
  placeholder: z.string().optional().default(''),
  options: z.array(ComponentOptionZ),
  required: z.boolean().optional(),
});

/**
 * 单选框属性
 */
export const RadioPropsZ = BaseComponentPropsZ.extend({
  label: z.string(),
  options: z.array(ComponentOptionZ),
  required: z.boolean().optional(),
});

/**
 * 多选框属性
 */
export const CheckboxPropsZ = BaseComponentPropsZ.extend({
  label: z.string(),
  options: z.array(ComponentOptionZ),
  required: z.boolean().optional(),
});

/**
 * 开关属性
 */
export const SwitchPropsZ = BaseComponentPropsZ.extend({
  label: z.string(),
  checkedChildren: z.string().optional(),
  unCheckedChildren: z.string().optional(),
  required: z.boolean().optional(),
});

/**
 * 日期选择器属性
 */
export const DatePickerPropsZ = BaseComponentPropsZ.extend({
  label: z.string(),
  placeholder: z.string().optional().default(''),
  required: z.boolean().optional(),
});

/**
 * 时间选择器属性
 */
export const TimePickerPropsZ = BaseComponentPropsZ.extend({
  label: z.string(),
  placeholder: z.string().optional().default(''),
  required: z.boolean().optional(),
});

/**
 * 按钮属性
 */
export const ButtonPropsZ = BaseComponentPropsZ.extend({
  label: z.string(),
  buttonType: z.enum(['submit', 'reset', 'button']).optional(),
  variant: z.enum(['primary', 'default', 'dashed', 'text', 'link']).optional(),
});

// ============ 组件 Schema（递归定义） ============

/**
 * 组件 Schema 基础
 */
const BaseComponentSchemaZ = z.object({
  id: z.string().min(1),
  type: ComponentTypeZ,
});

/**
 * 完整的组件 Schema（支持递归嵌套）
 */
export const ComponentSchemaZ: z.ZodType<{
  id: string;
  type: z.infer<typeof ComponentTypeZ>;
  props: Record<string, unknown>;
  children?: Array<{
    id: string;
    type: z.infer<typeof ComponentTypeZ>;
    props: Record<string, unknown>;
    children?: unknown[];
  }>;
}> = BaseComponentSchemaZ.extend({
  props: z.record(z.string(), z.unknown()),
  children: z.lazy(() => z.array(ComponentSchemaZ)).optional(),
});

// ============ 模板 Schema ============

/**
 * 自定义模板 Schema
 */
export const CustomTemplateZ = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(50),
  description: z.string().max(200).optional().default(''),
  components: z.array(ComponentSchemaZ),
  createdAt: z.number(),
});

// ============ API 响应 Schema ============

/**
 * 表单列表响应
 */
export const FormListResponseZ = z.object({
  forms: z.array(z.object({
    id: z.number(),
    name: z.string(),
    description: z.string().nullable(),
    components: z.string(), // JSON 字符串
    createdAt: z.string(),
    updatedAt: z.string(),
  })),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});

/**
 * 登录响应
 */
export const LoginResponseZ = z.object({
  token: z.string(),
  user: z.object({
    id: z.number(),
    username: z.string(),
    createdAt: z.string(),
  }),
});

// ============ 验证辅助函数 ============

/**
 * 安全解析组件数据 - 返回解析结果
 */
export function parseComponents(data: unknown) {
  return z.array(ComponentSchemaZ).safeParse(data);
}

/**
 * 安全解析模板数据
 */
export function parseTemplate(data: unknown) {
  return CustomTemplateZ.safeParse(data);
}

/**
 * 验证组件类型
 */
export function isValidComponentType(type: unknown): type is z.infer<typeof ComponentTypeZ> {
  return ComponentTypeZ.safeParse(type).success;
}

/**
 * 验证校验规则
 */
export function isValidRule(rule: unknown): rule is z.infer<typeof ValidationRuleZ> {
  return ValidationRuleZ.safeParse(rule).success;
}

// ============ 类型导出 ============

export type ComponentTypeZod = z.infer<typeof ComponentTypeZ>;
export type ComponentOptionZod = z.infer<typeof ComponentOptionZ>;
export type ValidationRuleZod = z.infer<typeof ValidationRuleZ>;
export type ComponentSchemaZod = z.infer<typeof ComponentSchemaZ>;
export type CustomTemplateZod = z.infer<typeof CustomTemplateZ>;
export type FormListResponseZod = z.infer<typeof FormListResponseZ>;
export type LoginResponseZod = z.infer<typeof LoginResponseZ>;
