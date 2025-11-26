import React from 'react';
import { Form, Input, Select, Radio, Checkbox, Switch, DatePicker, TimePicker, InputNumber, Button } from 'antd';
import type { ComponentSchema } from './types';
import { useStore } from './store';

interface CanvasFormItemProps {
  component: ComponentSchema;
}

// 条件表达式求值
const evaluateCondition = (condition: string, values: Record<string, any>): boolean => {
  try {
    // 使用 Function 构造器动态求值
    const func = new Function('values', `try { return ${condition}; } catch(e) { return false; }`);
    return func(values);
  } catch (error) {
    console.warn('Condition evaluation failed:', error);
    return true; // 默认显示
  }
};

export const CanvasFormItem: React.FC<CanvasFormItemProps> = ({ component }) => {
  const { formValues, setFormValue } = useStore();
  const value = formValues[component.id];

  // 处理 visibleOn 条件
  if (component.props.visibleOn) {
    const shouldShow = evaluateCondition(component.props.visibleOn, formValues);
    if (!shouldShow) {
      return (
        <div style={{ 
          padding: '8px 12px', 
          background: '#f5f5f5', 
          border: '1px dashed #d9d9d9', 
          borderRadius: 4,
          color: '#999',
          fontSize: 12,
          marginBottom: 16
        }}>
          🔗 条件隐藏: {component.props.visibleOn}
        </div>
      );
    }
  }

  const handleChange = (newValue: any) => {
    setFormValue(component.id, newValue);
  };

  const renderField = () => {
    switch (component.type) {
      case 'Input':
        return (
          <Input
            value={value || ''}
            placeholder={component.props.placeholder}
            onChange={(e) => handleChange(e.target.value)}
          />
        );
      case 'TextArea':
        return (
          <Input.TextArea
            value={value || ''}
            placeholder={component.props.placeholder}
            rows={component.props.rows || 4}
            onChange={(e) => handleChange(e.target.value)}
          />
        );
      case 'InputNumber':
        return (
          <InputNumber
            value={value}
            placeholder={component.props.placeholder}
            style={{ width: '100%' }}
            onChange={handleChange}
          />
        );
      case 'Select':
        return (
          <Select
            value={value}
            placeholder={component.props.placeholder}
            options={component.props.options}
            style={{ width: '100%' }}
            onChange={handleChange}
            allowClear
          />
        );
      case 'Radio':
        return (
          <Radio.Group
            value={value}
            options={component.props.options}
            onChange={(e) => handleChange(e.target.value)}
          />
        );
      case 'Checkbox':
        return (
          <Checkbox.Group
            value={value || []}
            options={component.props.options}
            onChange={handleChange}
          />
        );
      case 'Switch':
        return (
          <Switch
            checked={value || false}
            checkedChildren={component.props.checkedChildren}
            unCheckedChildren={component.props.unCheckedChildren}
            onChange={handleChange}
          />
        );
      case 'DatePicker':
        return (
          <DatePicker
            value={value}
            placeholder={component.props.placeholder}
            style={{ width: '100%' }}
            onChange={handleChange}
          />
        );
      case 'TimePicker':
        return (
          <TimePicker
            value={value}
            placeholder={component.props.placeholder}
            style={{ width: '100%' }}
            onChange={handleChange}
          />
        );
      case 'Button':
        return (
          <Button type={component.props.type || 'primary'} block>
            {component.props.content}
          </Button>
        );
      default:
        return null;
    }
  };

  // Container 类型不在这里渲染，由 SortableList 处理
  if (component.type === 'Container') {
    return null;
  }

  const label = ('label' in component.props) ? component.props.label : undefined;
  const required = ('required' in component.props) ? component.props.required : false;

  return (
    <Form.Item 
      label={label} 
      required={required}
      style={{ marginBottom: 0 }}
    >
      {renderField()}
    </Form.Item>
  );
};
