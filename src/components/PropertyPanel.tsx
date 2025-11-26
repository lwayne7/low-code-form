import React from 'react';
import { Form, Input, Button, Space, Tag, Divider, Typography } from 'antd';
import { DeleteOutlined, SettingOutlined } from '@ant-design/icons';
import type { ComponentSchema } from '../types';

const { Title, Text } = Typography;

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
  // 渲染选项编辑器（Select/Radio/Checkbox）
  const renderOptionsEditor = () => {
    if (!selectedComponent) return null;
    
    const optionsStr =
      // @ts-ignore
      selectedComponent.props.options?.map((o: { label: string; value: string }) => `${o.label}:${o.value}`).join('\n') || '';

    return (
      <Form.Item label="选项配置" tooltip="每行一个选项，格式：显示名:值">
        <Input.TextArea
          rows={5}
          value={optionsStr}
          onChange={(e) => {
            const lines = e.target.value.split('\n');
            const newOptions = lines
              .map((line: string) => {
                const parts = line.split(/[:：]/);
                const label = parts[0]?.trim();
                const value = parts[1]?.trim() || label;
                return { label, value };
              })
              .filter((o) => o.label);

            updateComponentProps(selectedComponent.id, { options: newOptions });
          }}
          placeholder={`例如：\n男:male\n女:female`}
        />
      </Form.Item>
    );
  };

  // 获取所有组件（扁平化，用于联动配置）
  const getAllComponentIds = (comps: ComponentSchema[]): ComponentSchema[] => {
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

  const allComponents = getAllComponentIds(components);

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
            <Form.Item label="容器标题">
              <Input
                value={selectedComponent.props.label || ''}
                onChange={(e) => updateComponentProps(selectedComponent.id, { label: e.target.value })}
              />
            </Form.Item>
          )}

          {/* 标题配置 - 除 Container 和 Button 外 */}
          {!['Container', 'Button'].includes(selectedComponent.type) && (
            <Form.Item label="标题 (Label)">
              <Input
                // @ts-ignore
                value={selectedComponent.props.label || ''}
                onChange={(e) => updateComponentProps(selectedComponent.id, { label: e.target.value })}
              />
            </Form.Item>
          )}

          {/* 占位符配置 */}
          {['Input', 'TextArea', 'InputNumber', 'Select', 'DatePicker', 'TimePicker'].includes(
            selectedComponent.type
          ) && (
            <Form.Item label="占位符">
              <Input
                // @ts-ignore
                value={selectedComponent.props.placeholder || ''}
                onChange={(e) => updateComponentProps(selectedComponent.id, { placeholder: e.target.value })}
                placeholder="请输入..."
              />
            </Form.Item>
          )}

          {/* 必填配置 */}
          {!['Container', 'Button'].includes(selectedComponent.type) && (
            <Form.Item label="必填">
              <Button
                type={'required' in selectedComponent.props && selectedComponent.props.required ? 'primary' : 'default'}
                size="small"
                onClick={() => {
                  // @ts-ignore
                  const current = selectedComponent.props.required || false;
                  updateComponentProps(selectedComponent.id, { required: !current });
                }}
              >
                {/* @ts-ignore */}
                {selectedComponent.props.required ? '✓ 必填' : '非必填'}
              </Button>
            </Form.Item>
          )}

          {/* 按钮内容配置 */}
          {selectedComponent.type === 'Button' && (
            <Form.Item label="按钮文字">
              <Input
                value={selectedComponent.props.content}
                onChange={(e) => updateComponentProps(selectedComponent.id, { content: e.target.value })}
              />
            </Form.Item>
          )}

          {/* 选项配置 */}
          {['Select', 'Radio', 'Checkbox'].includes(selectedComponent.type) && renderOptionsEditor()}

          {/* Switch 开关文字配置 */}
          {selectedComponent.type === 'Switch' && (
            <>
              <Form.Item label="开启时文字">
                <Input
                  value={selectedComponent.props.checkedChildren || ''}
                  onChange={(e) => updateComponentProps(selectedComponent.id, { checkedChildren: e.target.value })}
                  placeholder="例如：开"
                />
              </Form.Item>
              <Form.Item label="关闭时文字">
                <Input
                  value={selectedComponent.props.unCheckedChildren || ''}
                  onChange={(e) => updateComponentProps(selectedComponent.id, { unCheckedChildren: e.target.value })}
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
                onChange={(e) => updateComponentProps(selectedComponent.id, { rows: Number(e.target.value) || 4 })}
              />
            </Form.Item>
          )}

          <Divider style={{ margin: '16px 0' }}>组件联动</Divider>

          {/* 显隐条件配置 */}
          <Form.Item
            label="显隐条件 (visibleOn)"
            tooltip="使用 JavaScript 表达式，通过 values['组件ID'] 访问其他组件的值"
          >
            <Input.TextArea
              // @ts-ignore
              value={selectedComponent.props.visibleOn || ''}
              onChange={(e) => updateComponentProps(selectedComponent.id, { visibleOn: e.target.value })}
              placeholder={`例如：values['${allComponents[0]?.id || 'xxx'}'] === 'show'`}
              rows={3}
              style={{ fontFamily: 'monospace', fontSize: 12 }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
              <div>可用的组件 ID：</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                {allComponents
                  .filter((c) => c.id !== selectedComponent.id)
                  .slice(0, 5)
                  .map((c) => (
                    <Tag
                      key={c.id}
                      style={{ cursor: 'pointer', fontSize: 11 }}
                      onClick={() => {
                        // @ts-ignore
                        const current = selectedComponent.props.visibleOn || '';
                        updateComponentProps(selectedComponent.id, {
                          visibleOn: current ? current : `values['${c.id}']`,
                        });
                      }}
                    >
                      {c.type}: {c.id.slice(0, 8)}...
                    </Tag>
                  ))}
              </div>
            </div>
          </Form.Item>

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
