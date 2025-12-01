import React, { useState } from 'react';
import { Form, Input, Button, Select, Radio, Checkbox, Switch, DatePicker, TimePicker, InputNumber, Card, message } from 'antd';
import type { ComponentSchema, FormSubmitConfig } from '../types';

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
const renderComponent = (component: ComponentSchema, formValues: any, submitting: boolean) => {
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
        {component.children?.map(child => renderComponent(child, formValues, submitting))}
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
          case 'Button': {
            // 如果按钮内容包含"提交"且没有明确设置 htmlType，则默认为 submit
            const content = component.props.content || '';
            const defaultHtmlType = content.includes('提交') ? 'submit' : 'button';
            const htmlType = component.props.htmlType || defaultHtmlType;
            const buttonType = component.props.type || 'primary';
            const isSubmit = htmlType === 'submit';
            return (
              <Form.Item key={component.id}>
                <Button 
                  type={buttonType} 
                  htmlType={htmlType}
                  loading={isSubmit && submitting}
                  block
                >
                  {content}
                </Button>
              </Form.Item>
            );
          }
          default:
            return null;
        }
};

// 查找提交按钮的配置
const findSubmitConfig = (components: ComponentSchema[]): FormSubmitConfig | undefined => {
  for (const comp of components) {
    if (comp.type === 'Button' && comp.props.htmlType === 'submit' && comp.props.submitConfig) {
      return comp.props.submitConfig;
    }
    if (comp.children) {
      const found = findSubmitConfig(comp.children);
      if (found) return found;
    }
  }
  return undefined;
};

export const FormRenderer: React.FC<FormRendererProps> = ({ components, onSubmit }) => {
  const [form] = Form.useForm();
  const [formValues, setFormValues] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);

  const handleFinish = async (values: any) => {
    console.log('用户提交的数据:', values);
    
    const submitConfig = findSubmitConfig(components);
    
    // 如果有自定义 onSubmit 回调，优先使用
    if (onSubmit) {
      onSubmit(values);
      return;
    }

    // 如果配置了提交地址，发送请求
    if (submitConfig?.action) {
      setSubmitting(true);
      try {
        const response = await fetch(submitConfig.action, {
          method: submitConfig.method || 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),
        });

        if (response.ok) {
          message.success(submitConfig.successMessage || '提交成功！');
          if (submitConfig.redirectUrl) {
            window.location.href = submitConfig.redirectUrl;
          }
        } else {
          message.error(submitConfig.errorMessage || '提交失败，请重试');
        }
      } catch (error) {
        console.error('提交错误:', error);
        message.error(submitConfig.errorMessage || '提交失败，请检查网络');
      } finally {
        setSubmitting(false);
      }
    } else {
      // 没有配置提交地址，显示默认提示
      message.success('表单验证通过！');
      console.log('表单数据:', values);
    }
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
      {components.map(c => renderComponent(c, formValues, submitting))}
    </Form>
  );
};
