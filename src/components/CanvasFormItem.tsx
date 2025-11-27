import React, { useCallback, useMemo } from 'react';
import { Form, Input, Select, Radio, Checkbox, Switch, DatePicker, TimePicker, InputNumber, Button } from 'antd';
import type { ComponentSchema } from '../types';
import { useStore } from '../store';

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

// 🆕 使用 React.memo 包裹并优化组件
export const CanvasFormItem: React.FC<CanvasFormItemProps> = React.memo(({ component }) => {
  // 🆕 使用 selector 精确订阅需要的状态，避免不必要的重渲染
  const formValue = useStore((state) => state.formValues[component.id]);
  const validationError = useStore((state) => state.validationErrors[component.id]);
  const formValues = useStore((state) => state.formValues);
  const setFormValue = useStore((state) => state.setFormValue);
  const validateField = useStore((state) => state.validateField);

  // 处理 visibleOn 条件
  const shouldShow = useMemo(() => {
    if (!component.props.visibleOn) return true;
    return evaluateCondition(component.props.visibleOn, formValues);
  }, [component.props.visibleOn, formValues]);

  // 🆕 使用 useCallback 缓存事件处理函数
  const handleChange = useCallback((newValue: any) => {
    setFormValue(component.id, newValue);
  }, [component.id, setFormValue]);

  // 🆕 失焦时触发校验
  const handleBlur = useCallback(() => {
    validateField(component.id);
  }, [component.id, validateField]);

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

  const renderField = () => {
    switch (component.type) {
      case 'Input':
        return (
          <Input
            value={formValue || ''}
            placeholder={component.props.placeholder}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            status={validationError ? 'error' : undefined}
          />
        );
      case 'TextArea':
        return (
          <Input.TextArea
            value={formValue || ''}
            placeholder={component.props.placeholder}
            rows={component.props.rows || 4}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            status={validationError ? 'error' : undefined}
          />
        );
      case 'InputNumber':
        return (
          <InputNumber
            value={formValue}
            placeholder={component.props.placeholder}
            style={{ width: '100%' }}
            onChange={handleChange}
            onBlur={handleBlur}
            status={validationError ? 'error' : undefined}
          />
        );
      case 'Select':
        return (
          <Select
            value={formValue}
            placeholder={component.props.placeholder}
            options={component.props.options}
            style={{ width: '100%' }}
            onChange={(val) => { handleChange(val); validateField(component.id); }}
            allowClear
            status={validationError ? 'error' : undefined}
          />
        );
      case 'Radio':
        return (
          <Radio.Group
            value={formValue}
            options={component.props.options}
            onChange={(e) => { handleChange(e.target.value); validateField(component.id); }}
          />
        );
      case 'Checkbox':
        return (
          <Checkbox.Group
            value={formValue || []}
            options={component.props.options}
            onChange={(val) => { handleChange(val); validateField(component.id); }}
          />
        );
      case 'Switch':
        return (
          <Switch
            checked={formValue || false}
            checkedChildren={component.props.checkedChildren}
            unCheckedChildren={component.props.unCheckedChildren}
            onChange={(val) => { handleChange(val); validateField(component.id); }}
          />
        );
      case 'DatePicker':
        return (
          <DatePicker
            value={formValue}
            placeholder={component.props.placeholder}
            style={{ width: '100%' }}
            onChange={(val) => { handleChange(val); validateField(component.id); }}
            status={validationError ? 'error' : undefined}
          />
        );
      case 'TimePicker':
        return (
          <TimePicker
            value={formValue}
            placeholder={component.props.placeholder}
            style={{ width: '100%' }}
            onChange={(val) => { handleChange(val); validateField(component.id); }}
            status={validationError ? 'error' : undefined}
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
  // 🆕 如果有校验规则且包含 required，自动标记为必填
  const hasRequiredRule = component.props.rules?.some(r => r.type === 'required');

  return (
    <Form.Item 
      label={label} 
      required={required || hasRequiredRule}
      validateStatus={validationError ? 'error' : undefined}
      help={validationError}
      style={{ marginBottom: 0 }}
    >
      {renderField()}
    </Form.Item>
  );
}, (prevProps, nextProps) => {
  // 🆕 自定义比较函数，只在 component 引用变化时重渲染
  return prevProps.component === nextProps.component;
});
