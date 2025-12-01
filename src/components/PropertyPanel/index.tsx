import React from 'react';
import { Form, Input, Button, Space, Tag, Typography } from 'antd';
import { DeleteOutlined, SettingOutlined } from '@ant-design/icons';
import type { ComponentSchema } from '../../types';

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
}

export const PropertyPanel: React.FC<PropertyPanelProps> = ({
  selectedIds,
  selectedComponent,
  components,
  updateComponentProps,
  deleteComponent,
}) => {
  const allComponents = flattenComponents(components);

  // 包装 updateProps 函数
  const updateProps = (newProps: Partial<ComponentSchema['props']>) => {
    if (selectedComponent) {
      updateComponentProps(selectedComponent.id, newProps);
    }
  };

  return (
    <div style={{ padding: '20px 16px' }}>
      <Space align="center" style={{ marginBottom: 24 }}>
        <SettingOutlined style={{ color: '#1677ff' }} />
        <Title level={5} style={{ margin: 0 }}>
          属性配置
        </Title>
      </Space>

      {selectedIds.length > 1 ? (
        // 多选状态
        <div style={{ textAlign: 'center', color: '#666', padding: '40px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
          <p>已选中 {selectedIds.length} 个组件</p>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => deleteComponent(selectedIds)}
            style={{ marginTop: 16 }}
          >
            批量删除
          </Button>
        </div>
      ) : selectedComponent ? (
        // 单选状态
        <Form layout="vertical">
          {/* 组件信息 */}
          <div style={{ background: '#f9fafb', padding: 12, borderRadius: 6, marginBottom: 20 }}>
            <Form.Item label="组件 ID" style={{ marginBottom: 0 }}>
              <Space>
                <Tag>{selectedComponent.type}</Tag>
                <Text code style={{ fontSize: 12 }}>
                  {selectedComponent.id}
                </Text>
              </Space>
            </Form.Item>
          </div>

          {/* 容器组件配置 */}
          {selectedComponent.type === 'Container' && (
            <ContainerConfig component={selectedComponent} updateProps={updateProps} />
          )}

          {/* 标题配置 - 除 Container 和 Button 外 */}
          {!['Container', 'Button'].includes(selectedComponent.type) && (
            <Form.Item label="标题 (Label)">
              <Input
                value={getComponentProp(selectedComponent, 'label', '')}
                onChange={(e) => updateProps({ label: e.target.value })}
              />
            </Form.Item>
          )}

          {/* 占位符配置 */}
          {['Input', 'TextArea', 'InputNumber', 'Select', 'DatePicker', 'TimePicker'].includes(
            selectedComponent.type
          ) && (
            <Form.Item label="占位符">
              <Input
                value={getComponentProp(selectedComponent, 'placeholder', '')}
                onChange={(e) => updateProps({ placeholder: e.target.value })}
                placeholder="请输入..."
              />
            </Form.Item>
          )}

          {/* 必填配置 */}
          {!['Container', 'Button'].includes(selectedComponent.type) && (
            <Form.Item label="必填">
              <Button
                type={getComponentProp(selectedComponent, 'required', false) ? 'primary' : 'default'}
                size="small"
                onClick={() => {
                  const current = getComponentProp(selectedComponent, 'required', false);
                  updateProps({ required: !current });
                }}
              >
                {getComponentProp(selectedComponent, 'required', false) ? '✓ 必填' : '非必填'}
              </Button>
            </Form.Item>
          )}

          {/* 按钮配置 */}
          {selectedComponent.type === 'Button' && (
            <ButtonConfig component={selectedComponent} updateProps={updateProps} />
          )}

          {/* 选项配置 */}
          {['Select', 'Radio', 'Checkbox'].includes(selectedComponent.type) && (
            <OptionsEditor component={selectedComponent} updateProps={updateProps} />
          )}

          {/* Switch 开关文字配置 */}
          {selectedComponent.type === 'Switch' && (
            <>
              <Form.Item label="开启时文字">
                <Input
                  value={selectedComponent.props.checkedChildren || ''}
                  onChange={(e) => updateProps({ checkedChildren: e.target.value })}
                  placeholder="例如：开"
                />
              </Form.Item>
              <Form.Item label="关闭时文字">
                <Input
                  value={selectedComponent.props.unCheckedChildren || ''}
                  onChange={(e) => updateProps({ unCheckedChildren: e.target.value })}
                  placeholder="例如：关"
                />
              </Form.Item>
            </>
          )}

          {/* TextArea 行数配置 */}
          {selectedComponent.type === 'TextArea' && (
            <Form.Item label="行数">
              <Input
                type="number"
                value={selectedComponent.props.rows || 4}
                onChange={(e) => updateProps({ rows: Number(e.target.value) || 4 })}
              />
            </Form.Item>
          )}

          {/* 响应式布局配置 */}
          {!['Container'].includes(selectedComponent.type) && (
            <ResponsiveConfig component={selectedComponent} updateProps={updateProps} />
          )}

          {/* 组件联动配置 */}
          <LinkageConfig
            component={selectedComponent}
            allComponents={allComponents}
            updateProps={updateProps}
          />

          {/* 校验规则配置 */}
          {!['Container', 'Button'].includes(selectedComponent.type) && (
            <ValidationConfig component={selectedComponent} updateProps={updateProps} />
          )}

          <div style={{ marginTop: 32 }}>
            <Button
              danger
              block
              icon={<DeleteOutlined />}
              onClick={() => deleteComponent(selectedComponent.id)}
            >
              删除
            </Button>
          </div>
        </Form>
      ) : (
        // 未选中状态
        <div style={{ textAlign: 'center', color: '#999', marginTop: 50 }}>请选择一个组件</div>
      )}
    </div>
  );
};
