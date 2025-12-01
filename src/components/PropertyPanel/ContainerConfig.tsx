import React from 'react';
import { Form, Input, Select, InputNumber } from 'antd';
import type { ComponentSchema } from '../../types';

// 辅助函数：安全获取组件属性
const getComponentProp = <T,>(component: ComponentSchema, key: string, defaultValue: T): T => {
  const props = component.props as Record<string, unknown>;
  return (props[key] as T) ?? defaultValue;
};

interface ContainerConfigProps {
  component: ComponentSchema;
  updateProps: (newProps: Partial<ComponentSchema['props']>) => void;
}

export const ContainerConfig: React.FC<ContainerConfigProps> = ({
  component,
  updateProps,
}) => {
  return (
    <>
      <Form.Item label="容器标题">
        <Input
          value={getComponentProp(component, 'label', '')}
          onChange={(e) => updateProps({ label: e.target.value })}
        />
      </Form.Item>
      <Form.Item label="布局方向">
        <Select
          value={getComponentProp(component, 'direction', 'vertical')}
          onChange={(val) => updateProps({ direction: val as 'vertical' | 'horizontal' })}
          options={[
            { label: '垂直布局', value: 'vertical' },
            { label: '水平布局', value: 'horizontal' },
          ]}
        />
      </Form.Item>
      <Form.Item label="栅格列数" tooltip="容器内部的栅格列数，子组件可以设置占用列数">
        <Select
          value={getComponentProp(component, 'columns', 1)}
          onChange={(val) => updateProps({ columns: val })}
          options={[
            { label: '1 列', value: 1 },
            { label: '2 列', value: 2 },
            { label: '3 列', value: 3 },
            { label: '4 列', value: 4 },
            { label: '6 列', value: 6 },
          ]}
        />
      </Form.Item>
      <Form.Item label="列间距">
        <InputNumber
          value={getComponentProp(component, 'gutter', 16)}
          onChange={(val) => updateProps({ gutter: val ?? 16 })}
          min={0}
          max={48}
          addonAfter="px"
        />
      </Form.Item>
    </>
  );
};
