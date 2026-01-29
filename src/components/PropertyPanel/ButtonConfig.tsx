import React from 'react';
import { Form, Input, Select, Divider, Typography } from 'antd';
import type { ComponentSchema } from '../../types';
import { useI18n } from '@/i18n';

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
  const { t } = useI18n();

  return (
    <>
      <Form.Item label={t('propertyPanel.buttonText')}>
        <Input
          value={getComponentProp(component, 'content', '')}
          onChange={(e) => updateProps({ content: e.target.value })}
        />
      </Form.Item>
      <Form.Item label={t('propertyPanel.buttonType')}>
        <Select
          value={getComponentProp(component, 'type', 'default')}
          onChange={(val) => updateProps({ type: val as 'primary' | 'default' | 'dashed' | 'text' | 'link' })}
          options={[
            { label: t('propertyPanel.primaryButton'), value: 'primary' },
            { label: t('propertyPanel.defaultButton'), value: 'default' },
            { label: t('propertyPanel.dashedButton'), value: 'dashed' },
            { label: t('propertyPanel.textButton'), value: 'text' },
            { label: t('propertyPanel.linkButton'), value: 'link' },
          ]}
        />
      </Form.Item>
      <Form.Item label={t('propertyPanel.htmlType')}>
        <Select
          value={getComponentProp(component, 'htmlType', 'button')}
          onChange={(val) => updateProps({ htmlType: val as 'button' | 'submit' | 'reset' })}
          options={[
            { label: t('propertyPanel.normalButton'), value: 'button' },
            { label: t('propertyPanel.submitButton'), value: 'submit' },
            { label: t('propertyPanel.resetButton'), value: 'reset' },
          ]}
        />
      </Form.Item>

      {/* 表单提交配置 */}
      {getComponentProp<string>(component, 'htmlType', 'button') === 'submit' && (
        <>
          <Divider style={{ margin: '12px 0' }} dashed />
          <Text strong style={{ display: 'block', marginBottom: 12 }}>{t('propertyPanel.submitConfig')}</Text>
          <Form.Item label={t('propertyPanel.submitUrl')}>
            <Input
              value={getComponentProp<{ action?: string }>(component, 'submitConfig', {}).action || ''}
              onChange={(e) => updateProps({
                submitConfig: {
                  ...getComponentProp(component, 'submitConfig', {}),
                  action: e.target.value
                }
              })}
              placeholder={t('propertyPanel.submitUrlPlaceholder')}
            />
          </Form.Item>
          <Form.Item label={t('propertyPanel.requestMethod')}>
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
          <Form.Item label={t('propertyPanel.successMessage')}>
            <Input
              value={getComponentProp<{ successMessage?: string }>(component, 'submitConfig', {}).successMessage || ''}
              onChange={(e) => updateProps({
                submitConfig: {
                  ...getComponentProp(component, 'submitConfig', {}),
                  successMessage: e.target.value
                }
              })}
              placeholder={t('propertyPanel.successMessagePlaceholder')}
            />
          </Form.Item>
          <Form.Item label={t('propertyPanel.errorMessage')}>
            <Input
              value={getComponentProp<{ errorMessage?: string }>(component, 'submitConfig', {}).errorMessage || ''}
              onChange={(e) => updateProps({
                submitConfig: {
                  ...getComponentProp(component, 'submitConfig', {}),
                  errorMessage: e.target.value
                }
              })}
              placeholder={t('propertyPanel.errorMessagePlaceholder')}
            />
          </Form.Item>
          <Form.Item label={t('propertyPanel.successRedirect')}>
            <Input
              value={getComponentProp<{ redirectUrl?: string }>(component, 'submitConfig', {}).redirectUrl || ''}
              onChange={(e) => updateProps({
                submitConfig: {
                  ...getComponentProp(component, 'submitConfig', {}),
                  redirectUrl: e.target.value
                }
              })}
              placeholder={t('propertyPanel.successRedirectPlaceholder')}
            />
          </Form.Item>
        </>
      )}
    </>
  );
};
