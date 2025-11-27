import React, { useState } from 'react';
import { Form, Input, Button, Select, Radio, Checkbox, Switch, DatePicker, TimePicker, InputNumber, Card } from 'antd';
import type { ComponentSchema } from '../types';

interface FormRendererProps {
  components: ComponentSchema[]; // 接收 JSON 数组
  onSubmit?: (values: any) => void; // 预留提交表单的回调
}

const evaluateCondition = (condition: string, values: any) => {
  try {
    const func = new Function('values', `try { return ${condition}; } catch(e) { return false; }`);
    return func(values);
  } catch (error) {
    console.warn('Condition evaluation failed:', error);
    return true; 
  }
};

// 递归渲染组件
const renderComponent = (component: ComponentSchema, formValues: any) => {
  // 显隐逻辑
  if (component.props.visibleOn) {
    const shouldShow = evaluateCondition(component.props.visibleOn, formValues);
    if (!shouldShow) return null;
    }

  // 容器组件递归渲染
  if (component.type === 'Container') {
  return (
      <Card 
        key={component.id} 
        size="small" 
        title={component.props.label} 
        style={{ marginBottom: 16, background: '#fafafa' }}
        styles={{ body: { padding: 16 } }}
      >
        {component.children?.map(child => renderComponent(child, formValues))}
      </Card>
    );
  }

  const rules = ('required' in component.props && component.props.required) ? 
    [{ required: true, message: `请输入${('label' in component.props) ? component.props.label : ''}` }] : 
    [];

        switch (component.type) {
          case 'Input':
            return (
        <Form.Item key={component.id} label={component.props.label} name={component.id} rules={rules}>
                <Input placeholder={component.props.placeholder} />
              </Form.Item>
            );
    case 'TextArea':
      return (
        <Form.Item key={component.id} label={component.props.label} name={component.id} rules={rules}>
          <Input.TextArea placeholder={component.props.placeholder} rows={component.props.rows} />
        </Form.Item>
      );
    case 'InputNumber':
      return (
        <Form.Item key={component.id} label={component.props.label} name={component.id} rules={rules}>
          <InputNumber placeholder={component.props.placeholder} style={{ width: '100%' }} />
        </Form.Item>
      );
    case 'Select':
      return (
        <Form.Item key={component.id} label={component.props.label} name={component.id} rules={rules}>
          <Select placeholder={component.props.placeholder} options={component.props.options} allowClear />
        </Form.Item>
      );
    case 'Radio':
      return (
        <Form.Item key={component.id} label={component.props.label} name={component.id} rules={rules}>
          <Radio.Group options={component.props.options} />
        </Form.Item>
      );
    case 'Checkbox':
      return (
        <Form.Item key={component.id} label={component.props.label} name={component.id} rules={rules}>
          <Checkbox.Group options={component.props.options} />
        </Form.Item>
      );
    case 'Switch':
      return (
        <Form.Item key={component.id} label={component.props.label} name={component.id} valuePropName="checked" rules={rules}>
          <Switch checkedChildren={component.props.checkedChildren} unCheckedChildren={component.props.unCheckedChildren} />
        </Form.Item>
      );
    case 'DatePicker':
      return (
        <Form.Item key={component.id} label={component.props.label} name={component.id} rules={rules}>
          <DatePicker placeholder={component.props.placeholder} style={{ width: '100%' }} />
        </Form.Item>
      );
    case 'TimePicker':
      return (
        <Form.Item key={component.id} label={component.props.label} name={component.id} rules={rules}>
          <TimePicker placeholder={component.props.placeholder} style={{ width: '100%' }} />
        </Form.Item>
      );
          case 'Button':
            return (
              <Form.Item key={component.id}>
                <Button type="primary" htmlType="submit" block>
                  {component.props.content}
                </Button>
              </Form.Item>
            );
          default:
            return null;
        }
};

export const FormRenderer: React.FC<FormRendererProps> = ({ components, onSubmit }) => {
  const [form] = Form.useForm();
  const [formValues, setFormValues] = useState<any>({});

  const handleFinish = (values: any) => {
    console.log('用户提交的数据:', values);
    if (onSubmit) {
      onSubmit(values);
    }
    alert('提交成功！请在控制台查看数据');
  };

  const handleValuesChange = (_: any, allValues: any) => {
    setFormValues(allValues);
  };

  return (
    <Form 
      form={form} 
      layout="vertical" 
      onFinish={handleFinish}
      onValuesChange={handleValuesChange}
    >
      {components.map(c => renderComponent(c, formValues))}
    </Form>
  );
};
