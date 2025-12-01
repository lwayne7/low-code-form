/**
 * 组件默认配置工厂
 * 集中管理各组件类型的默认配置
 */

import { nanoid } from 'nanoid';
import type { ComponentSchema, ComponentType } from '../types';

/**
 * 组件默认配置
 */
const COMPONENT_DEFAULTS: Record<ComponentType, () => Omit<ComponentSchema, 'id'>> = {
  Input: () => ({
    type: 'Input',
    props: { label: '输入框', placeholder: '请输入...' }
  }),
  TextArea: () => ({
    type: 'TextArea',
    props: { label: '多行文本', placeholder: '请输入...', rows: 4 }
  }),
  InputNumber: () => ({
    type: 'InputNumber',
    props: { label: '数字输入', placeholder: '请输入数字' }
  }),
  Select: () => ({
    type: 'Select',
    props: { label: '下拉选择', placeholder: '请选择', options: [{ label: 'A', value: 'A' }] }
  }),
  Radio: () => ({
    type: 'Radio',
    props: { label: '单选框', options: [{ label: 'A', value: 'A' }] }
  }),
  Checkbox: () => ({
    type: 'Checkbox',
    props: { label: '多选框', options: [{ label: 'A', value: 'A' }] }
  }),
  Switch: () => ({
    type: 'Switch',
    props: { label: '开关' }
  }),
  DatePicker: () => ({
    type: 'DatePicker',
    props: { label: '日期', placeholder: '请选择' }
  }),
  TimePicker: () => ({
    type: 'TimePicker',
    props: { label: '时间', placeholder: '请选择' }
  }),
  Button: () => ({
    type: 'Button',
    props: { content: '提交', type: 'primary', htmlType: 'submit' }
  }),
  Container: () => ({
    type: 'Container',
    props: { label: '容器', direction: 'vertical' },
    children: []
  }),
};

/**
 * 创建新组件实例
 */
export function createComponent(type: ComponentType): ComponentSchema | null {
  const factory = COMPONENT_DEFAULTS[type];
  if (!factory) return null;
  
  const config = factory();
  return {
    id: nanoid(),
    ...config,
  } as ComponentSchema;
}

/**
 * 深拷贝组件并重新生成 ID
 */
export function cloneComponentWithNewId(component: ComponentSchema): ComponentSchema {
  return {
    ...component,
    id: nanoid(),
    props: { ...component.props },
    children: component.children?.map(cloneComponentWithNewId),
  } as ComponentSchema;
}
