import React from 'react';
import { Form, Input, Button, Space, Tag, Typography } from 'antd';
import { DeleteOutlined, SettingOutlined } from '@ant-design/icons';
import type { ComponentSchema } from '../../types';
import type { PropertyPanelBlock } from '../../registry/componentRegistry';
import { getComponentDefinition } from '../../registry/componentRegistry';
import { useI18n } from '../../i18n';

// 子组件
import { ContainerConfig } from './ContainerConfig';
import { ButtonConfig } from './ButtonConfig';
import { ValidationConfig } from './ValidationConfig';
import { ResponsiveConfig } from './ResponsiveConfig';
import { LinkageConfig } from './LinkageConfig';
import { OptionsEditor } from './OptionsEditor';

const { Title, Text } = Typography;

// 辅助函数：安全获取组件属性
const getComponentProp = <T,>(component: ComponentSchema, key: string, defaultValue: T): T => {
  const props = component.props as Record<string, unknown>;
  return (props[key] as T) ?? defaultValue;
};

// 获取所有组件（扁平化，用于联动配置）
const flattenComponents = (comps: ComponentSchema[]): ComponentSchema[] => {
  const result: ComponentSchema[] = [];
  const traverse = (list: ComponentSchema[]) => {
    list.forEach((c) => {
      result.push(c);
      if (c.children) traverse(c.children);
    });
  };
  traverse(comps);
  return result;
};

interface PropertyPanelProps {
  selectedIds: string[];
  selectedComponent: ComponentSchema | undefined;
  components: ComponentSchema[];
  updateComponentProps: (id: string, newProps: Partial<ComponentSchema['props']>) => void;
  deleteComponent: (ids: string | string[]) => void;
  isDark?: boolean; // 🆕 深色模式标志
}

export const PropertyPanel: React.FC<PropertyPanelProps> = ({
  selectedIds,
  selectedComponent,
  components,
  updateComponentProps,
  deleteComponent,
  isDark = false,
}) => {
  const allComponents = flattenComponents(components);
  const { t } = useI18n();

  // 包装 updateProps 函数
  const updateProps = (newProps: Partial<ComponentSchema['props']>) => {
    if (selectedComponent) {
      updateComponentProps(selectedComponent.id, newProps);
    }
  };

  const setPropValue = (prop: string, value: unknown) => {
    updateProps({ [prop]: value } as Partial<ComponentSchema['props']>);
  };

  const renderSchemaBlock = (block: PropertyPanelBlock) => {
    if (!selectedComponent) return null;

    switch (block.kind) {
      case 'field': {
        const value = getComponentProp<unknown>(
          selectedComponent,
          block.prop,
          block.defaultValue ?? ''
        );

        if (block.control === 'number') {
          const numberValue = typeof value === 'number' ? value : Number(block.defaultValue ?? 0) || 0;
          return (
            <Form.Item key={`field-${block.prop}`} label={block.label}>
              <Input
                type="number"
                value={numberValue}
                onChange={(e) => {
                  const parsed = Number(e.target.value);
                  const next = Number.isFinite(parsed) ? parsed : (Number(block.defaultValue ?? 0) || 0);
                  setPropValue(block.prop, next);
                }}
              />
            </Form.Item>
          );
        }

        return (
          <Form.Item key={`field-${block.prop}`} label={block.label}>
            <Input
              value={typeof value === 'string' ? value : String(value ?? '')}
              onChange={(e) => setPropValue(block.prop, e.target.value)}
              placeholder={block.placeholder}
            />
          </Form.Item>
        );
      }

      case 'booleanButton': {
        const current = getComponentProp(selectedComponent, block.prop, false);
        return (
          <Form.Item key={`bool-${block.prop}`} label={block.label}>
            <Button
              type={current ? 'primary' : 'default'}
              size="small"
              onClick={() => setPropValue(block.prop, !current)}
            >
              {current ? block.trueText : block.falseText}
            </Button>
          </Form.Item>
        );
      }

      case 'builtin': {
        switch (block.id) {
          case 'container':
            return <ContainerConfig key="builtin-container" component={selectedComponent} updateProps={updateProps} />;
          case 'button':
            return <ButtonConfig key="builtin-button" component={selectedComponent} updateProps={updateProps} />;
          case 'options':
            return <OptionsEditor key="builtin-options" component={selectedComponent} updateProps={updateProps} />;
          case 'responsive':
            return <ResponsiveConfig key="builtin-responsive" component={selectedComponent} updateProps={updateProps} isDark={isDark} />;
          case 'linkage':
            return (
              <LinkageConfig
                key="builtin-linkage"
                component={selectedComponent}
                allComponents={allComponents}
                updateProps={updateProps}
                isDark={isDark}
              />
            );
          case 'validation':
            return <ValidationConfig key="builtin-validation" component={selectedComponent} updateProps={updateProps} isDark={isDark} />;
        }
      }
    }
  };

  return (
    <div style={{ padding: '20px 16px' }}>
      <Space align="center" style={{ marginBottom: 24 }}>
        <SettingOutlined style={{ color: isDark ? '#4096ff' : '#1677ff' }} />
        <Title level={5} style={{ margin: 0, color: isDark ? '#e6e6e6' : undefined }}>
          {t('property.title')}
        </Title>
      </Space>

      {selectedIds.length > 1 ? (
        // 多选状态
        <div style={{ textAlign: 'center', color: isDark ? '#a3a3a3' : '#666', padding: '40px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
          <p>{t('property.multiSelect', { count: selectedIds.length })}</p>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => deleteComponent(selectedIds)}
            style={{ marginTop: 16 }}
          >
            {t('property.batchDelete')}
          </Button>
        </div>
      ) : selectedComponent ? (
        // 单选状态
        <Form layout="vertical">
          {/* 组件信息 */}
          <div style={{ background: isDark ? '#262626' : '#f9fafb', padding: 12, borderRadius: 6, marginBottom: 20 }}>
            <Form.Item label={t('property.componentId')} style={{ marginBottom: 0 }}>
              <Space>
                <Tag>{selectedComponent.type}</Tag>
                <Text code style={{ fontSize: 12 }}>
                  {selectedComponent.id}
                </Text>
              </Space>
            </Form.Item>
          </div>

          {getComponentDefinition(selectedComponent.type).propertyPanel.map(renderSchemaBlock)}

          <div style={{ marginTop: 32 }}>
            <Button
              danger
              block
              icon={<DeleteOutlined />}
              onClick={() => deleteComponent(selectedComponent.id)}
            >
              {t('common.delete')}
            </Button>
          </div>
        </Form>
      ) : (
        // 未选中状态
        <div style={{ textAlign: 'center', color: isDark ? '#737373' : '#999', marginTop: 50 }}>{t('property.noSelection')}</div>
      )}
    </div>
  );
};
