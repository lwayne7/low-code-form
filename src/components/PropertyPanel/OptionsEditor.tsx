import React from 'react';
import { Form, Input, Button } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import type { ComponentSchema } from '../../types';

// 辅助函数：安全获取组件属性
const getComponentProp = <T,>(component: ComponentSchema, key: string, defaultValue: T): T => {
  const props = component.props as Record<string, unknown>;
  return (props[key] as T) ?? defaultValue;
};

interface OptionsEditorProps {
  component: ComponentSchema;
  updateProps: (newProps: Partial<ComponentSchema['props']>) => void;
}

export const OptionsEditor: React.FC<OptionsEditorProps> = ({
  component,
  updateProps,
}) => {
  const options = getComponentProp<Array<{ label: string; value: string }>>(component, 'options', []);
  
  const handleAddOption = () => {
    const newOptions = [...options, { label: `选项${options.length + 1}`, value: `option${options.length + 1}` }];
    updateProps({ options: newOptions });
  };

  const handleUpdateOption = (index: number, field: 'label' | 'value', val: string) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [field]: val };
    updateProps({ options: newOptions });
  };

  const handleRemoveOption = (index: number) => {
    const newOptions = options.filter((_: unknown, i: number) => i !== index);
    updateProps({ options: newOptions });
  };

  return (
    <Form.Item label="选项配置">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {options.map((opt: { label: string; value: string }, index: number) => (
          <div key={index} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Input
              size="small"
              placeholder="显示名称"
              value={opt.label}
              onChange={(e) => handleUpdateOption(index, 'label', e.target.value)}
              style={{ flex: 1 }}
            />
            <Input
              size="small"
              placeholder="值"
              value={opt.value}
              onChange={(e) => handleUpdateOption(index, 'value', e.target.value)}
              style={{ flex: 1 }}
            />
            <MinusCircleOutlined
              style={{ color: '#ff4d4f', cursor: 'pointer' }}
              onClick={() => handleRemoveOption(index)}
            />
          </div>
        ))}
        <Button
          type="dashed"
          size="small"
          icon={<PlusOutlined />}
          onClick={handleAddOption}
          style={{ marginTop: 4 }}
        >
          添加选项
        </Button>
      </div>
    </Form.Item>
  );
};
