import React from 'react';
import { Form, Select, InputNumber, Divider, Typography } from 'antd';
import type { ComponentSchema } from '../../types';
import { useI18n } from '@/i18n';

const { Text } = Typography;

// 辅助函数：安全获取组件属性
const getComponentProp = <T,>(component: ComponentSchema, key: string, defaultValue: T): T => {
  const props = component.props as Record<string, unknown>;
  return (props[key] as T) ?? defaultValue;
};

interface ResponsiveConfigProps {
  component: ComponentSchema;
  updateProps: (newProps: Partial<ComponentSchema['props']>) => void;
  isDark?: boolean;
}

export const ResponsiveConfig: React.FC<ResponsiveConfigProps> = ({
  component,
  updateProps,
  isDark = false,
}) => {
  const { t } = useI18n();
  const responsive = getComponentProp<Record<string, number>>(component, 'responsive', {});

  const updateResponsive = (key: string, value: number | null) => {
    updateProps({
      responsive: { ...responsive, [key]: value ?? undefined }
    });
  };

  return (
    <>
      <Divider style={{ margin: '16px 0' }}>{t('propertyPanel.responsiveLayout')}</Divider>

      <Form.Item label={t('propertyPanel.columnSpan')} tooltip={t('propertyPanel.columnSpanTooltip')}>
        <Select
          value={getComponentProp(component, 'colSpan', 24)}
          onChange={(val) => updateProps({ colSpan: val })}
          options={[
            { label: t('propertyPanel.fullWidth'), value: 24 },
            { label: t('propertyPanel.threeQuarter'), value: 18 },
            { label: t('propertyPanel.twoThird'), value: 16 },
            { label: t('propertyPanel.half'), value: 12 },
            { label: t('propertyPanel.oneThird'), value: 8 },
            { label: t('propertyPanel.quarter'), value: 6 },
          ]}
        />
      </Form.Item>

      <Form.Item label={t('propertyPanel.responsiveConfig')} tooltip={t('propertyPanel.responsiveTooltip')}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <Text type="secondary" style={{ fontSize: 11, color: isDark ? '#a3a3a3' : undefined }}>{t('propertyPanel.mobile')}</Text>
            <InputNumber
              size="small"
              min={1}
              max={24}
              value={responsive.xs ?? 24}
              onChange={(val) => updateResponsive('xs', val)}
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 11, color: isDark ? '#a3a3a3' : undefined }}>{t('propertyPanel.tablet')}</Text>
            <InputNumber
              size="small"
              min={1}
              max={24}
              value={responsive.sm ?? 24}
              onChange={(val) => updateResponsive('sm', val)}
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 11, color: isDark ? '#a3a3a3' : undefined }}>{t('propertyPanel.desktop')}</Text>
            <InputNumber
              size="small"
              min={1}
              max={24}
              value={responsive.md}
              onChange={(val) => updateResponsive('md', val)}
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 11, color: isDark ? '#a3a3a3' : undefined }}>{t('propertyPanel.largeScreen')}</Text>
            <InputNumber
              size="small"
              min={1}
              max={24}
              value={responsive.lg}
              onChange={(val) => updateResponsive('lg', val)}
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </Form.Item>
    </>
  );
};
