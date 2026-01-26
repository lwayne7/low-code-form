import React from 'react';
import {
  FormOutlined,
  BuildOutlined,
  SelectOutlined,
  CheckCircleOutlined,
  CheckSquareOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  NumberOutlined,
  FileTextOutlined,
  ContainerOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import type { ComponentSchema, ComponentType } from '../types';

export type BuiltinPropertyPanelBlockId =
  | 'container'
  | 'button'
  | 'options'
  | 'responsive'
  | 'linkage'
  | 'validation';

export type PropertyFieldControl = 'text' | 'number';

export type PropertyPanelBlock =
  | {
      kind: 'field';
      label: string;
      prop: string;
      control: PropertyFieldControl;
      placeholder?: string;
      defaultValue?: unknown;
    }
  | {
      kind: 'booleanButton';
      label: string;
      prop: string;
      trueText: string;
      falseText: string;
    }
  | {
      kind: 'builtin';
      id: BuiltinPropertyPanelBlockId;
    };

export interface ComponentDefinition {
  type: ComponentType;
  label: string;
  icon: React.ReactNode;
  createDefault: () => Omit<ComponentSchema, 'id'>;
  propertyPanel: PropertyPanelBlock[];
}

const COMPONENT_DEFINITIONS: Record<ComponentType, ComponentDefinition> = {
  Container: {
    type: 'Container',
    label: '容器',
    icon: <ContainerOutlined />,
    createDefault: () =>
      ({
        type: 'Container',
        props: { label: '容器', direction: 'vertical' },
        children: [],
      }) as Omit<ComponentSchema, 'id'>,
    propertyPanel: [
      { kind: 'builtin', id: 'container' },
      { kind: 'builtin', id: 'linkage' },
    ],
  },
  Input: {
    type: 'Input',
    label: '单行输入',
    icon: <FormOutlined />,
    createDefault: () =>
      ({
        type: 'Input',
        props: { label: '输入框', placeholder: '请输入...' },
      }) as Omit<ComponentSchema, 'id'>,
    propertyPanel: [
      { kind: 'field', label: '标题 (Label)', prop: 'label', control: 'text', defaultValue: '' },
      { kind: 'field', label: '占位符', prop: 'placeholder', control: 'text', defaultValue: '', placeholder: '请输入...' },
      { kind: 'booleanButton', label: '必填', prop: 'required', trueText: '✓ 必填', falseText: '非必填' },
      { kind: 'builtin', id: 'responsive' },
      { kind: 'builtin', id: 'linkage' },
      { kind: 'builtin', id: 'validation' },
    ],
  },
  TextArea: {
    type: 'TextArea',
    label: '多行输入',
    icon: <FileTextOutlined />,
    createDefault: () =>
      ({
        type: 'TextArea',
        props: { label: '多行文本', placeholder: '请输入...', rows: 4 },
      }) as Omit<ComponentSchema, 'id'>,
    propertyPanel: [
      { kind: 'field', label: '标题 (Label)', prop: 'label', control: 'text', defaultValue: '' },
      { kind: 'field', label: '占位符', prop: 'placeholder', control: 'text', defaultValue: '', placeholder: '请输入...' },
      { kind: 'field', label: '行数', prop: 'rows', control: 'number', defaultValue: 4 },
      { kind: 'booleanButton', label: '必填', prop: 'required', trueText: '✓ 必填', falseText: '非必填' },
      { kind: 'builtin', id: 'responsive' },
      { kind: 'builtin', id: 'linkage' },
      { kind: 'builtin', id: 'validation' },
    ],
  },
  InputNumber: {
    type: 'InputNumber',
    label: '数字输入',
    icon: <NumberOutlined />,
    createDefault: () =>
      ({
        type: 'InputNumber',
        props: { label: '数字输入', placeholder: '请输入数字' },
      }) as Omit<ComponentSchema, 'id'>,
    propertyPanel: [
      { kind: 'field', label: '标题 (Label)', prop: 'label', control: 'text', defaultValue: '' },
      { kind: 'field', label: '占位符', prop: 'placeholder', control: 'text', defaultValue: '', placeholder: '请输入...' },
      { kind: 'booleanButton', label: '必填', prop: 'required', trueText: '✓ 必填', falseText: '非必填' },
      { kind: 'builtin', id: 'responsive' },
      { kind: 'builtin', id: 'linkage' },
      { kind: 'builtin', id: 'validation' },
    ],
  },
  Select: {
    type: 'Select',
    label: '下拉选择',
    icon: <SelectOutlined />,
    createDefault: () =>
      ({
        type: 'Select',
        props: { label: '下拉选择', placeholder: '请选择', options: [{ label: 'A', value: 'A' }] },
      }) as Omit<ComponentSchema, 'id'>,
    propertyPanel: [
      { kind: 'field', label: '标题 (Label)', prop: 'label', control: 'text', defaultValue: '' },
      { kind: 'field', label: '占位符', prop: 'placeholder', control: 'text', defaultValue: '', placeholder: '请输入...' },
      { kind: 'booleanButton', label: '必填', prop: 'required', trueText: '✓ 必填', falseText: '非必填' },
      { kind: 'builtin', id: 'options' },
      { kind: 'builtin', id: 'responsive' },
      { kind: 'builtin', id: 'linkage' },
      { kind: 'builtin', id: 'validation' },
    ],
  },
  Radio: {
    type: 'Radio',
    label: '单选框',
    icon: <CheckCircleOutlined />,
    createDefault: () =>
      ({
        type: 'Radio',
        props: { label: '单选框', options: [{ label: 'A', value: 'A' }] },
      }) as Omit<ComponentSchema, 'id'>,
    propertyPanel: [
      { kind: 'field', label: '标题 (Label)', prop: 'label', control: 'text', defaultValue: '' },
      { kind: 'booleanButton', label: '必填', prop: 'required', trueText: '✓ 必填', falseText: '非必填' },
      { kind: 'builtin', id: 'options' },
      { kind: 'builtin', id: 'responsive' },
      { kind: 'builtin', id: 'linkage' },
      { kind: 'builtin', id: 'validation' },
    ],
  },
  Checkbox: {
    type: 'Checkbox',
    label: '多选框',
    icon: <CheckSquareOutlined />,
    createDefault: () =>
      ({
        type: 'Checkbox',
        props: { label: '多选框', options: [{ label: 'A', value: 'A' }] },
      }) as Omit<ComponentSchema, 'id'>,
    propertyPanel: [
      { kind: 'field', label: '标题 (Label)', prop: 'label', control: 'text', defaultValue: '' },
      { kind: 'booleanButton', label: '必填', prop: 'required', trueText: '✓ 必填', falseText: '非必填' },
      { kind: 'builtin', id: 'options' },
      { kind: 'builtin', id: 'responsive' },
      { kind: 'builtin', id: 'linkage' },
      { kind: 'builtin', id: 'validation' },
    ],
  },
  Switch: {
    type: 'Switch',
    label: '开关',
    icon: <RocketOutlined />,
    createDefault: () =>
      ({
        type: 'Switch',
        props: { label: '开关' },
      }) as Omit<ComponentSchema, 'id'>,
    propertyPanel: [
      { kind: 'field', label: '标题 (Label)', prop: 'label', control: 'text', defaultValue: '' },
      { kind: 'field', label: '开启时文字', prop: 'checkedChildren', control: 'text', defaultValue: '' },
      { kind: 'field', label: '关闭时文字', prop: 'unCheckedChildren', control: 'text', defaultValue: '' },
      { kind: 'booleanButton', label: '必填', prop: 'required', trueText: '✓ 必填', falseText: '非必填' },
      { kind: 'builtin', id: 'responsive' },
      { kind: 'builtin', id: 'linkage' },
      { kind: 'builtin', id: 'validation' },
    ],
  },
  DatePicker: {
    type: 'DatePicker',
    label: '日期选择',
    icon: <CalendarOutlined />,
    createDefault: () =>
      ({
        type: 'DatePicker',
        props: { label: '日期', placeholder: '请选择' },
      }) as Omit<ComponentSchema, 'id'>,
    propertyPanel: [
      { kind: 'field', label: '标题 (Label)', prop: 'label', control: 'text', defaultValue: '' },
      { kind: 'field', label: '占位符', prop: 'placeholder', control: 'text', defaultValue: '', placeholder: '请输入...' },
      { kind: 'booleanButton', label: '必填', prop: 'required', trueText: '✓ 必填', falseText: '非必填' },
      { kind: 'builtin', id: 'responsive' },
      { kind: 'builtin', id: 'linkage' },
      { kind: 'builtin', id: 'validation' },
    ],
  },
  TimePicker: {
    type: 'TimePicker',
    label: '时间选择',
    icon: <ClockCircleOutlined />,
    createDefault: () =>
      ({
        type: 'TimePicker',
        props: { label: '时间', placeholder: '请选择' },
      }) as Omit<ComponentSchema, 'id'>,
    propertyPanel: [
      { kind: 'field', label: '标题 (Label)', prop: 'label', control: 'text', defaultValue: '' },
      { kind: 'field', label: '占位符', prop: 'placeholder', control: 'text', defaultValue: '', placeholder: '请输入...' },
      { kind: 'booleanButton', label: '必填', prop: 'required', trueText: '✓ 必填', falseText: '非必填' },
      { kind: 'builtin', id: 'responsive' },
      { kind: 'builtin', id: 'linkage' },
      { kind: 'builtin', id: 'validation' },
    ],
  },
  Button: {
    type: 'Button',
    label: '按钮',
    icon: <BuildOutlined />,
    createDefault: () =>
      ({
        type: 'Button',
        props: { content: '提交', type: 'primary', htmlType: 'submit' },
      }) as Omit<ComponentSchema, 'id'>,
    propertyPanel: [
      { kind: 'builtin', id: 'button' },
      { kind: 'builtin', id: 'responsive' },
      { kind: 'builtin', id: 'linkage' },
    ],
  },
};

export function getComponentDefinition(type: ComponentType): ComponentDefinition {
  return COMPONENT_DEFINITIONS[type];
}

export function getAllComponentDefinitions(): ComponentDefinition[] {
  return Object.values(COMPONENT_DEFINITIONS);
}

