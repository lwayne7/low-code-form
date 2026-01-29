import React, { useState } from 'react';
import { Form, Input, Button, Select, Radio, Checkbox, Switch, DatePicker, TimePicker, InputNumber, Card, message } from 'antd';
import type { ComponentSchema, FormSubmitConfig } from '../types';
import { evaluateConditionSafe } from '../utils/expression';
import { useI18n } from '@/i18n';

interface FormRendererProps {
  components: ComponentSchema[]; // 接收 JSON 数组
  onSubmit?: (values: Record<string, unknown>) => void; // 预留提交表单的回调
}

// 递归渲染组件
const renderComponent = (component: ComponentSchema, formValues: Record<string, unknown>, submitting: boolean, t: (key: string, params?: Record<string, string | number>) => string) => {
  // 显隐逻辑
  if (component.props.visibleOn) {
    const shouldShow = evaluateConditionSafe(component.props.visibleOn, formValues);
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
        {component.children?.map(child => renderComponent(child, formValues, submitting, t))}
      </Card>
    );
  }

  const label = ('label' in component.props) ? component.props.label : '';
  const rules = ('required' in component.props && component.props.required) ?
    [{ required: true, message: t('validation.defaultMessage', { label: label || t('validation.defaultLabel') }) }] :
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
            // 如果按钮内容包含"提交"或"Submit"且没有明确设置 htmlType，则默认为 submit
            const content = component.props.content || '';
            const defaultHtmlType = (content.includes('提交') || content.toLowerCase().includes('submit')) ? 'submit' : 'button';
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
  const [formValues, setFormValues] = useState<Record<string, unknown>>({});
  const [submitting, setSubmitting] = useState(false);
  const { t } = useI18n();

  const handleFinish = async (values: Record<string, unknown>) => {
    if (import.meta.env.DEV) {
      console.log(t('form.submittedData'), values);
    }

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
          message.success(submitConfig.successMessage || t('form.submitSuccess'));
          if (submitConfig.redirectUrl) {
            window.location.href = submitConfig.redirectUrl;
          }
        } else {
          message.error(submitConfig.errorMessage || t('form.submitFailed'));
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error(t('form.submitError2'), error);
        }
        message.error(submitConfig.errorMessage || t('form.submitError'));
      } finally {
        setSubmitting(false);
      }
    } else {
      // 没有配置提交地址，显示默认提示
      message.success(t('form.validationPassed'));
      if (import.meta.env.DEV) {
        console.log(t('form.formData'), values);
      }
    }
  };

  const handleValuesChange = (_: unknown, allValues: unknown) => {
    if (allValues && typeof allValues === 'object') {
      setFormValues(allValues as Record<string, unknown>);
    } else {
      setFormValues({});
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      onValuesChange={handleValuesChange}
    >
      {components.map(c => renderComponent(c, formValues, submitting, t as (key: string, params?: Record<string, string | number>) => string))}
    </Form>
  );
};
