import React from 'react';
import { Form, Input, Select, InputNumber } from 'antd';
import type { ComponentSchema } from '../../types';
import { useI18n } from '@/i18n';

// 辅助函数：安全获取组件属性
const getComponentProp = <T,>(component: ComponentSchema, key: string, defaultValue: T): T => {
  const props = component.props as Record<string, unknown>;
  return (props[key] as T) ?? defaultValue;
};

interface ContainerConfigProps {
  component: ComponentSchema;
  updateProps: (newProps: Partial<ComponentSchema['props']>) => void;
}

export const ContainerConfig: React.FC<ContainerConfigProps> = ({
  component,
  updateProps,
}) => {
  const { t } = useI18n();

  return (
    <>
      <Form.Item label={t('propertyPanel.containerTitle')}>
        <Input
          value={getComponentProp(component, 'label', '')}
          onChange={(e) => updateProps({ label: e.target.value })}
        />
      </Form.Item>
      <Form.Item label={t('propertyPanel.layoutDirection')}>
        <Select
          value={getComponentProp(component, 'direction', 'vertical')}
          onChange={(val) => updateProps({ direction: val as 'vertical' | 'horizontal' })}
          options={[
            { label: t('propertyPanel.vertical'), value: 'vertical' },
            { label: t('propertyPanel.horizontal'), value: 'horizontal' },
          ]}
        />
      </Form.Item>
      <Form.Item label={t('propertyPanel.gridColumns')} tooltip={t('propertyPanel.gridColumnsTooltip')}>
        <Select
          value={getComponentProp(component, 'columns', 1)}
          onChange={(val) => updateProps({ columns: val })}
          options={[
            { label: t('propertyPanel.column', { count: 1 }), value: 1 },
            { label: t('propertyPanel.column', { count: 2 }), value: 2 },
            { label: t('propertyPanel.column', { count: 3 }), value: 3 },
            { label: t('propertyPanel.column', { count: 4 }), value: 4 },
            { label: t('propertyPanel.column', { count: 6 }), value: 6 },
          ]}
        />
      </Form.Item>
      <Form.Item label={t('propertyPanel.columnGap')}>
        <InputNumber
          value={getComponentProp(component, 'gutter', 16)}
          onChange={(val) => updateProps({ gutter: val ?? 16 })}
          min={0}
          max={48}
          addonAfter="px"
        />
      </Form.Item>
    </>
  );
};
