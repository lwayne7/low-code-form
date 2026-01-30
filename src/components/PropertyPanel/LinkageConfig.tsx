import React from 'react';
import { Form, Input, Tag, Divider } from 'antd';
import type { ComponentSchema } from '../../types';
import { validateConditionExpressionWithTypes } from '../../utils/visibleOnTypeValidation';
import { useI18n } from '@/i18n';

// 辅助函数：安全获取组件属性
const getComponentProp = <T,>(component: ComponentSchema, key: string, defaultValue: T): T => {
  const props = component.props as Record<string, unknown>;
  return (props[key] as T) ?? defaultValue;
};

interface LinkageConfigProps {
  component: ComponentSchema;
  allComponents: ComponentSchema[];
  updateProps: (newProps: Partial<ComponentSchema['props']>) => void;
}

export const LinkageConfig: React.FC<LinkageConfigProps> = ({
  component,
  allComponents,
  updateProps,
}) => {
  const { t } = useI18n();
  const tt = t as unknown as (key: string, params?: Record<string, string | number>) => string;
  const visibleOn = getComponentProp(component, 'visibleOn', '');
  const validation = validateConditionExpressionWithTypes(visibleOn, allComponents);
  const hasError = Boolean(visibleOn.trim()) && !validation.ok;
  const warnings =
    Boolean(visibleOn.trim()) && validation.ok ? validation.warnings : [];
  const warningText =
    warnings.length > 0
      ? warnings
          .slice(0, 2)
          .map((w) => {
            if (w.kind === 'unknownKey') {
              return tt('propertyPanel.expressionWarning.unknownKey', { key: w.key });
            }
            return tt('propertyPanel.expressionWarning.typeMismatch', {
              key: w.key,
              expected: tt(`propertyPanel.valueType.${w.expected}`),
              actual: tt(`propertyPanel.valueType.${w.actual}`),
              operator: w.operator,
            });
          })
          .join('；') + (warnings.length > 2 ? '…' : '')
      : '';

  return (
    <>
      <Divider style={{ margin: '16px 0' }}>{t('propertyPanel.componentLinkage')}</Divider>

      <Form.Item
        label={t('propertyPanel.visibleCondition')}
        tooltip={t('propertyPanel.visibleTooltip')}
        validateStatus={hasError ? 'error' : warnings.length > 0 ? 'warning' : undefined}
        help={
          hasError
            ? t('propertyPanel.expressionError', { error: validation.error || '' })
            : warnings.length > 0
              ? tt('propertyPanel.expressionWarning', { warning: warningText })
              : undefined
        }
      >
        <Input.TextArea
          value={visibleOn}
          onChange={(e) => updateProps({ visibleOn: e.target.value })}
          placeholder={t('propertyPanel.visiblePlaceholder', { id: allComponents[0]?.id || 'xxx' })}
          rows={3}
          style={{ fontFamily: 'monospace', fontSize: 12 }}
        />
        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-color-secondary, #666)' }}>
          <div>{t('propertyPanel.availableIds')}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
            {allComponents
              .filter((c) => c.id !== component.id)
              .slice(0, 5)
              .map((c) => (
                <Tag
                  key={c.id}
                  style={{ cursor: 'pointer', fontSize: 11 }}
                  onClick={() => {
                    updateProps({
                      visibleOn: visibleOn || `values['${c.id}']`,
                    });
                  }}
                >
                  {c.type}: {c.id.slice(0, 8)}...
                </Tag>
              ))}
          </div>
        </div>
      </Form.Item>
    </>
  );
};
