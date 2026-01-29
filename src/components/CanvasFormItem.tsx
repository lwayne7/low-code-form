import React, { useCallback, useMemo } from 'react';
import { Form, Input, Select, Radio, Checkbox, Switch, DatePicker, TimePicker, InputNumber, Button } from 'antd';
import type { Dayjs } from 'dayjs';
import type { ComponentSchema } from '../types';
import { useStore } from '../store';
import { evaluateConditionSafe } from '../utils/expression';
import { useI18n } from '@/i18n';

interface CanvasFormItemProps {
  component: ComponentSchema;
}

const isDayjs = (value: unknown): value is Dayjs =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as { isValid?: unknown }).isValid === 'function';

const toDayjsOrNull = (value: unknown): Dayjs | null => (isDayjs(value) ? value : null);
const toStringValue = (value: unknown): string => (typeof value === 'string' ? value : '');
const toNumberValue = (value: unknown): number | null => (typeof value === 'number' ? value : null);
const toBooleanValue = (value: unknown): boolean => (typeof value === 'boolean' ? value : false);
const toStringArrayValue = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

// 🆕 使用 React.memo 包裹并优化组件
export const CanvasFormItem: React.FC<CanvasFormItemProps> = React.memo(({ component }) => {
  // 🆕 使用 selector 精确订阅需要的状态，避免不必要的重渲染
  const formValue = useStore((state) => state.formValues[component.id]);
  const validationError = useStore((state) => state.validationErrors[component.id]);
  const formValues = useStore((state) => state.formValues);
  const setFormValue = useStore((state) => state.setFormValue);
  const { t } = useI18n();
  const validateField = useStore((state) => state.validateField);

  // 处理 visibleOn 条件
  const shouldShow = useMemo(() => {
    if (!component.props.visibleOn) return true;
    return evaluateConditionSafe(component.props.visibleOn, formValues);
  }, [component.props.visibleOn, formValues]);

  // 🆕 使用 useCallback 缓存事件处理函数
  const handleChange = useCallback((newValue: unknown) => {
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
        {t('canvas.conditionalHidden', { condition: component.props.visibleOn || '' })}
      </div>
    );
  }

  const renderField = () => {
    switch (component.type) {
      case 'Input':
        return (
          <Input
            value={toStringValue(formValue)}
            placeholder={component.props.placeholder}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            status={validationError ? 'error' : undefined}
          />
        );
      case 'TextArea':
        return (
          <Input.TextArea
            value={toStringValue(formValue)}
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
            value={toNumberValue(formValue)}
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
            value={typeof formValue === 'string' ? formValue : undefined}
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
            value={typeof formValue === 'string' ? formValue : undefined}
            options={component.props.options}
            onChange={(e) => { handleChange(e.target.value); validateField(component.id); }}
          />
        );
      case 'Checkbox':
        return (
          <Checkbox.Group
            value={toStringArrayValue(formValue)}
            options={component.props.options}
            onChange={(val) => { handleChange(val); validateField(component.id); }}
          />
        );
      case 'Switch':
        return (
          <Switch
            checked={toBooleanValue(formValue)}
            checkedChildren={component.props.checkedChildren}
            unCheckedChildren={component.props.unCheckedChildren}
            onChange={(val) => { handleChange(val); validateField(component.id); }}
          />
        );
      case 'DatePicker':
        return (
          <DatePicker
            value={toDayjsOrNull(formValue)}
            placeholder={component.props.placeholder}
            style={{ width: '100%' }}
            onChange={(val) => { handleChange(val); validateField(component.id); }}
            status={validationError ? 'error' : undefined}
          />
        );
      case 'TimePicker':
        return (
          <TimePicker
            value={toDayjsOrNull(formValue)}
            placeholder={component.props.placeholder}
            style={{ width: '100%' }}
            onChange={(val) => { handleChange(val); validateField(component.id); }}
            status={validationError ? 'error' : undefined}
          />
        );
      case 'Button':
        return (
          <Button 
            type={component.props.type || 'primary'} 
            htmlType={component.props.htmlType || 'button'}
            block
          >
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
  const isLocked = component.props.locked === true;

  return (
    <div style={{ position: 'relative' }}>
      {/* 🆕 锁定标识 */}
      {isLocked && (
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          background: '#faad14',
          color: '#fff',
          fontSize: 10,
          padding: '1px 6px',
          borderRadius: '0 0 0 4px',
          zIndex: 5,
        }}>
          {t('canvas.locked')}
        </div>
      )}
      <Form.Item 
        label={label} 
        required={required || hasRequiredRule}
        validateStatus={validationError ? 'error' : undefined}
        help={validationError}
        style={{ marginBottom: 0, opacity: isLocked ? 0.7 : 1 }}
      >
        {renderField()}
      </Form.Item>
    </div>
  );
}, (prevProps, nextProps) => {
  // 🆕 自定义比较函数：比较 component 的 id 和 props
  // 使用浅比较 props 避免不必要的重渲染
  if (prevProps.component.id !== nextProps.component.id) return false;
  if (prevProps.component.type !== nextProps.component.type) return false;
  
  // 比较 props 的关键字段
  const prevP = prevProps.component.props;
  const nextP = nextProps.component.props;
  
  return (
    prevP.visibleOn === nextP.visibleOn &&
    prevP.locked === nextP.locked &&
    JSON.stringify(prevP.rules) === JSON.stringify(nextP.rules)
  );
});
