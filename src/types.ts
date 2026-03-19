// 1. 基础类型定义
export type ComponentType =
  | 'Input'
  | 'TextArea'
  | 'InputNumber'
  | 'Select'
  | 'Radio'
  | 'Checkbox'
  | 'Switch'
  | 'DatePicker'
  | 'TimePicker'
  | 'Button'
  | 'Container'; // ⚠️ 新增 Container 类型

export interface ComponentOption {
  label: string;
  value: string;
}

// 🆕 校验规则定义
export interface ValidationRule {
  type:
    | 'required'
    | 'minLength'
    | 'maxLength'
    | 'pattern'
    | 'min'
    | 'max'
    | 'email'
    | 'phone'
    | 'custom'
    | 'crossField';
  value?: string | number | boolean; // 规则的参数值（crossField 时为表达式字符串，如 "values['password'] === values['confirmPassword']"）
  message: string; // 错误提示信息
}

// 🆕 响应式布局配置
export interface ResponsiveConfig {
  xs?: number; // <576px 手机
  sm?: number; // ≥576px 平板
  md?: number; // ≥768px 小桌面
  lg?: number; // ≥992px 桌面
  xl?: number; // ≥1200px 大桌面
  xxl?: number; // ≥1600px 超大屏
}

// 🆕 表单提交配置
export interface FormSubmitConfig {
  action?: string; // 提交地址
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'; // 请求方法
  headers?: Record<string, string>; // 请求头
  successMessage?: string; // 成功提示
  errorMessage?: string; // 失败提示
  redirectUrl?: string; // 成功后跳转
  resetAfterSubmit?: boolean; // 提交后重置表单
}

// 2. 各组件的具体 Props 定义
export interface BaseComponentProps {
  visibleOn?: string; // 显隐表达式
  rules?: ValidationRule[]; // 🆕 校验规则数组
  responsive?: ResponsiveConfig; // 🆕 响应式布局
  colSpan?: number; // 占用列数 (1-24)
  locked?: boolean; // 🆕 锁定状态（防止编辑和删除）
}

export interface ContainerProps extends BaseComponentProps {
  label?: string; // 容器标题（可选）
  direction?: 'vertical' | 'horizontal'; // 布局方向
  columns?: number; // 🆕 列数 (用于栅格布局)
  gutter?: number; // 🆕 列间距
}

export interface InputProps extends BaseComponentProps {
  label: string;
  placeholder: string;
  required?: boolean;
}

export interface TextAreaProps extends BaseComponentProps {
  label: string;
  placeholder: string;
  rows?: number;
  required?: boolean;
}

export interface InputNumberProps extends BaseComponentProps {
  label: string;
  placeholder: string;
  required?: boolean;
}

export interface SelectProps extends BaseComponentProps {
  label: string;
  placeholder: string;
  options: ComponentOption[];
  required?: boolean;
}

export interface RadioProps extends BaseComponentProps {
  label: string;
  options: ComponentOption[];
  required?: boolean;
}

export interface CheckboxProps extends BaseComponentProps {
  label: string;
  options: ComponentOption[];
  required?: boolean;
}

export interface SwitchProps extends BaseComponentProps {
  label: string;
  checkedChildren?: string;
  unCheckedChildren?: string;
  required?: boolean;
}

export interface DatePickerProps extends BaseComponentProps {
  label: string;
  placeholder: string;
  format?: string;
  required?: boolean;
}

export interface TimePickerProps extends BaseComponentProps {
  label: string;
  placeholder: string;
  format?: string;
  required?: boolean;
}

export interface ButtonProps extends BaseComponentProps {
  content: string;
  type?: 'primary' | 'default' | 'dashed' | 'text' | 'link';
  htmlType?: 'button' | 'submit' | 'reset'; // 🆕 按钮类型
  submitConfig?: FormSubmitConfig; // 🆕 表单提交配置
}

// 3. 使用辨识联合类型 (Discriminated Union)
// 这样 TS 可以根据 type 自动推断 props 的类型
export type ComponentSchema =
  | { id: string; type: 'Input'; props: InputProps; children?: ComponentSchema[] }
  | { id: string; type: 'TextArea'; props: TextAreaProps; children?: ComponentSchema[] }
  | { id: string; type: 'InputNumber'; props: InputNumberProps; children?: ComponentSchema[] }
  | { id: string; type: 'Select'; props: SelectProps; children?: ComponentSchema[] }
  | { id: string; type: 'Radio'; props: RadioProps; children?: ComponentSchema[] }
  | { id: string; type: 'Checkbox'; props: CheckboxProps; children?: ComponentSchema[] }
  | { id: string; type: 'Switch'; props: SwitchProps; children?: ComponentSchema[] }
  | { id: string; type: 'DatePicker'; props: DatePickerProps; children?: ComponentSchema[] }
  | { id: string; type: 'TimePicker'; props: TimePickerProps; children?: ComponentSchema[] }
  | { id: string; type: 'Button'; props: ButtonProps; children?: ComponentSchema[] }
  | { id: string; type: 'Container'; props: ContainerProps; children?: ComponentSchema[] }; // ⚠️ 新增

// 4. 整个画布的数据结构
export interface CanvasSchema {
  components: ComponentSchema[];
}
