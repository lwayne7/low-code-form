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
import type { ComponentType } from '../types';

export interface ComponentMaterial {
  type: ComponentType;
  label: string;
  icon: React.ReactNode;
}

// 组件材料列表
export const COMPONENT_MATERIALS: ComponentMaterial[] = [
  { type: 'Container', label: '容器', icon: <ContainerOutlined /> },
  { type: 'Input', label: '单行输入', icon: <FormOutlined /> },
  { type: 'TextArea', label: '多行输入', icon: <FileTextOutlined /> },
  { type: 'InputNumber', label: '数字输入', icon: <NumberOutlined /> },
  { type: 'Select', label: '下拉选择', icon: <SelectOutlined /> },
  { type: 'Radio', label: '单选框', icon: <CheckCircleOutlined /> },
  { type: 'Checkbox', label: '多选框', icon: <CheckSquareOutlined /> },
  { type: 'Switch', label: '开关', icon: <RocketOutlined /> },
  { type: 'DatePicker', label: '日期选择', icon: <CalendarOutlined /> },
  { type: 'TimePicker', label: '时间选择', icon: <ClockCircleOutlined /> },
  { type: 'Button', label: '按钮', icon: <BuildOutlined /> },
];

// 组件类型到中文名称的映射
export const COMPONENT_TYPE_LABELS: Record<ComponentType, string> = {
  Container: '容器',
  Input: '单行输入',
  TextArea: '多行输入',
  InputNumber: '数字输入',
  Select: '下拉选择',
  Radio: '单选框',
  Checkbox: '多选框',
  Switch: '开关',
  DatePicker: '日期选择',
  TimePicker: '时间选择',
  Button: '按钮',
};
