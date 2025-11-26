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

// 2. 各组件的具体 Props 定义
export interface BaseComponentProps {
  visibleOn?: string; // 显隐表达式
}

export interface ContainerProps extends BaseComponentProps {
  label?: string; // 容器标题（可选）
  direction?: 'vertical' | 'horizontal'; // 布局方向
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
