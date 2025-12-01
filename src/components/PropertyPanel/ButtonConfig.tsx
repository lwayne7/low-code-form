import React from 'react';
import { Form, Input, Select, Divider, Typography } from 'antd';
import type { ComponentSchema } from '../../types';

const { Text } = Typography;

// 辅助函数：安全获取组件属性
const getComponentProp = <T,>(component: ComponentSchema, key: string, defaultValue: T): T => {
  const props = component.props as Record<string, unknown>;
  return (props[key] as T) ?? defaultValue;
};

interface ButtonConfigProps {
  component: ComponentSchema;
  updateProps: (newProps: Partial<ComponentSchema['props']>) => void;
}

export const ButtonConfig: React.FC<ButtonConfigProps> = ({
  component,
  updateProps,
}) => {
  return (
    <>
      <Form.Item label="按钮文字">
        <Input
          value={getComponentProp(component, 'content', '')}
          onChange={(e) => updateProps({ content: e.target.value })}
        />
      </Form.Item>
      <Form.Item label="按钮类型">
        <Select
          value={getComponentProp(component, 'type', 'default')}
          onChange={(val) => updateProps({ type: val as 'primary' | 'default' | 'dashed' | 'text' | 'link' })}
          options={[
            { label: '主要按钮', value: 'primary' },
            { label: '默认按钮', value: 'default' },
            { label: '虚线按钮', value: 'dashed' },
            { label: '文字按钮', value: 'text' },
            { label: '链接按钮', value: 'link' },
          ]}
        />
      </Form.Item>
      <Form.Item label="HTML 类型">
        <Select
          value={getComponentProp(component, 'htmlType', 'button')}
          onChange={(val) => updateProps({ htmlType: val as 'button' | 'submit' | 'reset' })}
          options={[
            { label: '普通按钮', value: 'button' },
            { label: '提交按钮', value: 'submit' },
            { label: '重置按钮', value: 'reset' },
          ]}
        />
      </Form.Item>
      
      {/* 表单提交配置 */}
      {getComponentProp<string>(component, 'htmlType', 'button') === 'submit' && (
        <>
          <Divider style={{ margin: '12px 0' }} dashed />
          <Text strong style={{ display: 'block', marginBottom: 12 }}>提交配置</Text>
          <Form.Item label="提交地址">
            <Input
              value={getComponentProp<{ action?: string }>(component, 'submitConfig', {}).action || ''}
              onChange={(e) => updateProps({ 
                submitConfig: { 
                  ...getComponentProp(component, 'submitConfig', {}), 
                  action: e.target.value 
                } 
              })}
              placeholder="例如：/api/submit"
            />
          </Form.Item>
          <Form.Item label="请求方法">
            <Select
              value={getComponentProp<{ method?: string }>(component, 'submitConfig', {}).method || 'POST'}
              onChange={(val) => updateProps({ 
                submitConfig: { 
                  ...getComponentProp(component, 'submitConfig', {}), 
                  method: val as 'GET' | 'POST' | 'PUT' | 'DELETE'
                } 
              })}
              options={[
                { label: 'GET', value: 'GET' },
                { label: 'POST', value: 'POST' },
                { label: 'PUT', value: 'PUT' },
                { label: 'DELETE', value: 'DELETE' },
              ]}
            />
          </Form.Item>
          <Form.Item label="成功提示">
            <Input
              value={getComponentProp<{ successMessage?: string }>(component, 'submitConfig', {}).successMessage || ''}
              onChange={(e) => updateProps({ 
                submitConfig: { 
                  ...getComponentProp(component, 'submitConfig', {}), 
                  successMessage: e.target.value 
                } 
              })}
              placeholder="提交成功！"
            />
          </Form.Item>
          <Form.Item label="失败提示">
            <Input
              value={getComponentProp<{ errorMessage?: string }>(component, 'submitConfig', {}).errorMessage || ''}
              onChange={(e) => updateProps({ 
                submitConfig: { 
                  ...getComponentProp(component, 'submitConfig', {}), 
                  errorMessage: e.target.value 
                } 
              })}
              placeholder="提交失败，请重试"
            />
          </Form.Item>
          <Form.Item label="成功跳转">
            <Input
              value={getComponentProp<{ redirectUrl?: string }>(component, 'submitConfig', {}).redirectUrl || ''}
              onChange={(e) => updateProps({ 
                submitConfig: { 
                  ...getComponentProp(component, 'submitConfig', {}), 
                  redirectUrl: e.target.value 
                } 
              })}
              placeholder="例如：/success"
            />
          </Form.Item>
        </>
      )}
    </>
  );
};
