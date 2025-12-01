import React from 'react';
import { Button, Tag, Input, InputNumber, Select, Divider, Typography } from 'antd';
import { MinusCircleOutlined } from '@ant-design/icons';
import type { ComponentSchema, ValidationRule } from '../../types';

const { Text } = Typography;

interface ValidationConfigProps {
  component: ComponentSchema;
  updateProps: (newProps: Partial<ComponentSchema['props']>) => void;
}

export const ValidationConfig: React.FC<ValidationConfigProps> = ({
  component,
  updateProps,
}) => {
  const rules = component.props.rules || [];

  const toggleRule = (type: ValidationRule['type'], defaultMessage: string) => {
    const hasRule = rules.some(r => r.type === type);
    const newRules = hasRule 
      ? rules.filter(r => r.type !== type)
      : [...rules, { type, message: defaultMessage }];
    updateProps({ rules: newRules });
  };

  const addRule = (type: ValidationRule['type']) => {
    const defaultMessages: Record<string, string> = {
      minLength: '长度不能少于指定值',
      maxLength: '长度不能超过指定值',
      min: '数值不能小于指定值',
      max: '数值不能大于指定值',
      pattern: '格式不正确',
    };
    const defaultValues: Record<string, number | string> = {
      minLength: 1,
      maxLength: 100,
      min: 0,
      max: 100,
      pattern: '',
    };
    const newRule = { 
      type, 
      value: defaultValues[type],
      message: defaultMessages[type] 
    };
    updateProps({ rules: [...rules, newRule] });
  };

  const updateRule = (index: number, updates: Partial<ValidationRule>) => {
    const newRules = [...rules];
    newRules[index] = { ...newRules[index], ...updates };
    updateProps({ rules: newRules });
  };

  const removeRule = (index: number) => {
    updateProps({ rules: rules.filter((_, i) => i !== index) });
  };

  return (
    <>
      <Divider style={{ margin: '16px 0' }}>校验规则</Divider>
      
      {/* 快捷校验开关 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        <Button
          size="small"
          type={rules.some(r => r.type === 'required') ? 'primary' : 'default'}
          onClick={() => toggleRule('required', '此项为必填项')}
        >
          必填
        </Button>
        
        {['Input', 'TextArea'].includes(component.type) && (
          <>
            <Button
              size="small"
              type={rules.some(r => r.type === 'email') ? 'primary' : 'default'}
              onClick={() => toggleRule('email', '请输入有效的邮箱地址')}
            >
              邮箱
            </Button>
            <Button
              size="small"
              type={rules.some(r => r.type === 'phone') ? 'primary' : 'default'}
              onClick={() => toggleRule('phone', '请输入有效的手机号码')}
            >
              手机号
            </Button>
          </>
        )}
      </div>

      {/* 详细规则列表 */}
      <div style={{ background: '#fafafa', padding: 12, borderRadius: 6 }}>
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
          已添加的规则：
        </Text>
        {rules.length === 0 ? (
          <Text type="secondary" style={{ fontSize: 12 }}>暂无校验规则</Text>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {rules.map((rule, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', padding: 8, borderRadius: 4 }}>
                <Tag color="blue" style={{ margin: 0 }}>{rule.type}</Tag>
                {rule.value !== undefined && (
                  <Tag color="orange">{String(rule.value)}</Tag>
                )}
                <Text style={{ flex: 1, fontSize: 12 }} ellipsis>{rule.message}</Text>
                <MinusCircleOutlined 
                  style={{ color: '#ff4d4f', cursor: 'pointer' }}
                  onClick={() => removeRule(index)}
                />
              </div>
            ))}
          </div>
        )}

        {/* 添加自定义规则 */}
        <Divider style={{ margin: '12px 0' }} dashed />
        <div style={{ display: 'flex', gap: 8 }}>
          <Select
            size="small"
            placeholder="添加规则"
            style={{ flex: 1 }}
            value={undefined}
            options={[
              { label: '最小长度', value: 'minLength' },
              { label: '最大长度', value: 'maxLength' },
              { label: '最小值', value: 'min' },
              { label: '最大值', value: 'max' },
              { label: '正则匹配', value: 'pattern' },
            ]}
            onChange={(type) => {
              if (type) addRule(type as ValidationRule['type']);
            }}
          />
        </div>

        {/* 规则值编辑器 */}
        {rules.map((rule, index) => {
          if (['minLength', 'maxLength', 'min', 'max'].includes(rule.type)) {
            return (
              <div key={`edit-${index}`} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                <Text style={{ fontSize: 12, minWidth: 60 }}>{rule.type}:</Text>
                <InputNumber
                  size="small"
                  value={rule.value as number}
                  onChange={(val) => updateRule(index, { value: val ?? 0 })}
                  style={{ width: 80 }}
                />
                <Input
                  size="small"
                  value={rule.message}
                  onChange={(e) => updateRule(index, { message: e.target.value })}
                  placeholder="错误提示"
                  style={{ flex: 1 }}
                />
              </div>
            );
          }
          if (rule.type === 'pattern') {
            return (
              <div key={`edit-${index}`} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                <Text style={{ fontSize: 12, minWidth: 60 }}>正则:</Text>
                <Input
                  size="small"
                  value={rule.value as string}
                  onChange={(e) => updateRule(index, { value: e.target.value })}
                  placeholder="正则表达式"
                  style={{ flex: 1 }}
                />
              </div>
            );
          }
          return null;
        })}
      </div>
    </>
  );
};
