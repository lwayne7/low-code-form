import React from 'react';
import { Form, Input, Button, Space, Tag, Divider, Typography, Select, InputNumber } from 'antd';
import { DeleteOutlined, SettingOutlined, MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import type { ComponentSchema, ValidationRule } from '../types';

const { Title, Text } = Typography;

interface PropertyPanelProps {
  selectedIds: string[];
  selectedComponent: ComponentSchema | undefined;
  components: ComponentSchema[];
  updateComponentProps: (id: string, newProps: Partial<ComponentSchema['props']>) => void;
  deleteComponent: (ids: string | string[]) => void;
}

// 🆕 独立的选项编辑器组件，使用内部状态管理输入
const OptionsEditor: React.FC<{
  component: ComponentSchema;
  updateComponentProps: (id: string, newProps: Partial<ComponentSchema['props']>) => void;
}> = ({ component, updateComponentProps }) => {
  // @ts-ignore
  const options = component.props.options || [];
  
  // 解析选项到数组形式方便编辑
  const handleAddOption = () => {
    const newOptions = [...options, { label: `选项${options.length + 1}`, value: `option${options.length + 1}` }];
    updateComponentProps(component.id, { options: newOptions });
  };

  const handleUpdateOption = (index: number, field: 'label' | 'value', val: string) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [field]: val };
    updateComponentProps(component.id, { options: newOptions });
  };

  const handleRemoveOption = (index: number) => {
    const newOptions = options.filter((_: unknown, i: number) => i !== index);
    updateComponentProps(component.id, { options: newOptions });
  };

  return (
    <Form.Item label="选项配置">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {options.map((opt: { label: string; value: string }, index: number) => (
          <div key={index} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Input
              size="small"
              placeholder="显示名称"
              value={opt.label}
              onChange={(e) => handleUpdateOption(index, 'label', e.target.value)}
              style={{ flex: 1 }}
            />
            <Input
              size="small"
              placeholder="值"
              value={opt.value}
              onChange={(e) => handleUpdateOption(index, 'value', e.target.value)}
              style={{ flex: 1 }}
            />
            <MinusCircleOutlined
              style={{ color: '#ff4d4f', cursor: 'pointer' }}
              onClick={() => handleRemoveOption(index)}
            />
          </div>
        ))}
        <Button
          type="dashed"
          size="small"
          icon={<PlusOutlined />}
          onClick={handleAddOption}
          style={{ marginTop: 4 }}
        >
          添加选项
        </Button>
      </div>
    </Form.Item>
  );
};

export const PropertyPanel: React.FC<PropertyPanelProps> = ({
  selectedIds,
  selectedComponent,
  components,
  updateComponentProps,
  deleteComponent,
}) => {

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
            <>
              <Form.Item label="容器标题">
                <Input
                  value={selectedComponent.props.label || ''}
                  onChange={(e) => updateComponentProps(selectedComponent.id, { label: e.target.value })}
                />
              </Form.Item>
              <Form.Item label="布局方向">
                <Select
                  value={selectedComponent.props.direction || 'vertical'}
                  onChange={(val) => updateComponentProps(selectedComponent.id, { direction: val })}
                  options={[
                    { label: '垂直布局', value: 'vertical' },
                    { label: '水平布局', value: 'horizontal' },
                  ]}
                />
              </Form.Item>
              <Form.Item label="栅格列数" tooltip="容器内部的栅格列数，子组件可以设置占用列数">
                <Select
                  value={selectedComponent.props.columns || 1}
                  onChange={(val) => updateComponentProps(selectedComponent.id, { columns: val })}
                  options={[
                    { label: '1 列', value: 1 },
                    { label: '2 列', value: 2 },
                    { label: '3 列', value: 3 },
                    { label: '4 列', value: 4 },
                    { label: '6 列', value: 6 },
                  ]}
                />
              </Form.Item>
              <Form.Item label="列间距">
                <InputNumber
                  value={selectedComponent.props.gutter || 16}
                  onChange={(val) => updateComponentProps(selectedComponent.id, { gutter: val ?? 16 })}
                  min={0}
                  max={48}
                  addonAfter="px"
                />
              </Form.Item>
            </>
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
            <>
              <Form.Item label="按钮文字">
                <Input
                  value={selectedComponent.props.content}
                  onChange={(e) => updateComponentProps(selectedComponent.id, { content: e.target.value })}
                />
              </Form.Item>
              <Form.Item label="按钮类型">
                <Select
                  value={selectedComponent.props.type || 'default'}
                  onChange={(val) => updateComponentProps(selectedComponent.id, { type: val })}
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
                  value={selectedComponent.props.htmlType || 'button'}
                  onChange={(val) => updateComponentProps(selectedComponent.id, { htmlType: val })}
                  options={[
                    { label: '普通按钮', value: 'button' },
                    { label: '提交按钮', value: 'submit' },
                    { label: '重置按钮', value: 'reset' },
                  ]}
                />
              </Form.Item>
              
              {/* 表单提交配置 */}
              {selectedComponent.props.htmlType === 'submit' && (
                <>
                  <Divider style={{ margin: '12px 0' }} dashed />
                  <Text strong style={{ display: 'block', marginBottom: 12 }}>提交配置</Text>
                  <Form.Item label="提交地址">
                    <Input
                      value={selectedComponent.props.submitConfig?.action || ''}
                      onChange={(e) => updateComponentProps(selectedComponent.id, { 
                        submitConfig: { 
                          ...selectedComponent.props.submitConfig, 
                          action: e.target.value 
                        } 
                      })}
                      placeholder="例如：/api/submit"
                    />
                  </Form.Item>
                  <Form.Item label="请求方法">
                    <Select
                      value={selectedComponent.props.submitConfig?.method || 'POST'}
                      onChange={(val) => updateComponentProps(selectedComponent.id, { 
                        submitConfig: { 
                          ...selectedComponent.props.submitConfig, 
                          method: val 
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
                      value={selectedComponent.props.submitConfig?.successMessage || ''}
                      onChange={(e) => updateComponentProps(selectedComponent.id, { 
                        submitConfig: { 
                          ...selectedComponent.props.submitConfig, 
                          successMessage: e.target.value 
                        } 
                      })}
                      placeholder="提交成功！"
                    />
                  </Form.Item>
                  <Form.Item label="失败提示">
                    <Input
                      value={selectedComponent.props.submitConfig?.errorMessage || ''}
                      onChange={(e) => updateComponentProps(selectedComponent.id, { 
                        submitConfig: { 
                          ...selectedComponent.props.submitConfig, 
                          errorMessage: e.target.value 
                        } 
                      })}
                      placeholder="提交失败，请重试"
                    />
                  </Form.Item>
                  <Form.Item label="成功跳转">
                    <Input
                      value={selectedComponent.props.submitConfig?.redirectUrl || ''}
                      onChange={(e) => updateComponentProps(selectedComponent.id, { 
                        submitConfig: { 
                          ...selectedComponent.props.submitConfig, 
                          redirectUrl: e.target.value 
                        } 
                      })}
                      placeholder="例如：/success"
                    />
                  </Form.Item>
                </>
              )}
            </>
          )}

          {/* 选项配置 */}
          {['Select', 'Radio', 'Checkbox'].includes(selectedComponent.type) && (
            <OptionsEditor component={selectedComponent} updateComponentProps={updateComponentProps} />
          )}

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

          {/* 🆕 响应式布局配置 */}
          {!['Container'].includes(selectedComponent.type) && (
            <>
              <Divider style={{ margin: '16px 0' }}>响应式布局</Divider>
              
              <Form.Item label="占用列数" tooltip="组件在父容器栅格中占用的列数 (1-24)">
                <Select
                  // @ts-ignore
                  value={selectedComponent.props.colSpan || 24}
                  onChange={(val) => updateComponentProps(selectedComponent.id, { colSpan: val })}
                  options={[
                    { label: '满行 (24)', value: 24 },
                    { label: '3/4 行 (18)', value: 18 },
                    { label: '2/3 行 (16)', value: 16 },
                    { label: '半行 (12)', value: 12 },
                    { label: '1/3 行 (8)', value: 8 },
                    { label: '1/4 行 (6)', value: 6 },
                  ]}
                />
              </Form.Item>

              <Form.Item label="响应式配置" tooltip="不同屏幕尺寸下的列数">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <Text type="secondary" style={{ fontSize: 11 }}>手机 (xs)</Text>
                    <InputNumber
                      size="small"
                      min={1}
                      max={24}
                      // @ts-ignore
                      value={selectedComponent.props.responsive?.xs || 24}
                      onChange={(val) => updateComponentProps(selectedComponent.id, { 
                        // @ts-ignore
                        responsive: { ...selectedComponent.props.responsive, xs: val } 
                      })}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: 11 }}>平板 (sm)</Text>
                    <InputNumber
                      size="small"
                      min={1}
                      max={24}
                      // @ts-ignore
                      value={selectedComponent.props.responsive?.sm || 24}
                      onChange={(val) => updateComponentProps(selectedComponent.id, { 
                        // @ts-ignore
                        responsive: { ...selectedComponent.props.responsive, sm: val } 
                      })}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: 11 }}>桌面 (md)</Text>
                    <InputNumber
                      size="small"
                      min={1}
                      max={24}
                      // @ts-ignore
                      value={selectedComponent.props.responsive?.md}
                      onChange={(val) => updateComponentProps(selectedComponent.id, { 
                        // @ts-ignore
                        responsive: { ...selectedComponent.props.responsive, md: val } 
                      })}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: 11 }}>大屏 (lg)</Text>
                    <InputNumber
                      size="small"
                      min={1}
                      max={24}
                      // @ts-ignore
                      value={selectedComponent.props.responsive?.lg}
                      onChange={(val) => updateComponentProps(selectedComponent.id, { 
                        // @ts-ignore
                        responsive: { ...selectedComponent.props.responsive, lg: val } 
                      })}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              </Form.Item>
            </>
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

          {/* 🆕 校验规则配置 */}
          {!['Container', 'Button'].includes(selectedComponent.type) && (
            <>
              <Divider style={{ margin: '16px 0' }}>校验规则</Divider>
              
              {/* 快捷校验开关 */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                <Button
                  size="small"
                  type={selectedComponent.props.rules?.some(r => r.type === 'required') ? 'primary' : 'default'}
                  onClick={() => {
                    const rules = selectedComponent.props.rules || [];
                    const hasRequired = rules.some(r => r.type === 'required');
                    const newRules = hasRequired 
                      ? rules.filter(r => r.type !== 'required')
                      : [...rules, { type: 'required' as const, message: '此项为必填项' }];
                    updateComponentProps(selectedComponent.id, { rules: newRules });
                  }}
                >
                  必填
                </Button>
                
                {['Input', 'TextArea'].includes(selectedComponent.type) && (
                  <>
                    <Button
                      size="small"
                      type={selectedComponent.props.rules?.some(r => r.type === 'email') ? 'primary' : 'default'}
                      onClick={() => {
                        const rules = selectedComponent.props.rules || [];
                        const hasEmail = rules.some(r => r.type === 'email');
                        const newRules = hasEmail 
                          ? rules.filter(r => r.type !== 'email')
                          : [...rules, { type: 'email' as const, message: '请输入有效的邮箱地址' }];
                        updateComponentProps(selectedComponent.id, { rules: newRules });
                      }}
                    >
                      邮箱
                    </Button>
                    <Button
                      size="small"
                      type={selectedComponent.props.rules?.some(r => r.type === 'phone') ? 'primary' : 'default'}
                      onClick={() => {
                        const rules = selectedComponent.props.rules || [];
                        const hasPhone = rules.some(r => r.type === 'phone');
                        const newRules = hasPhone 
                          ? rules.filter(r => r.type !== 'phone')
                          : [...rules, { type: 'phone' as const, message: '请输入有效的手机号码' }];
                        updateComponentProps(selectedComponent.id, { rules: newRules });
                      }}
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
                {(selectedComponent.props.rules || []).length === 0 ? (
                  <Text type="secondary" style={{ fontSize: 12 }}>暂无校验规则</Text>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {selectedComponent.props.rules?.map((rule, index) => (
                      <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', padding: 8, borderRadius: 4 }}>
                        <Tag color="blue" style={{ margin: 0 }}>{rule.type}</Tag>
                        {rule.value !== undefined && (
                          <Tag color="orange">{String(rule.value)}</Tag>
                        )}
                        <Text style={{ flex: 1, fontSize: 12 }} ellipsis>{rule.message}</Text>
                        <MinusCircleOutlined 
                          style={{ color: '#ff4d4f', cursor: 'pointer' }}
                          onClick={() => {
                            const newRules = selectedComponent.props.rules?.filter((_, i) => i !== index) || [];
                            updateComponentProps(selectedComponent.id, { rules: newRules });
                          }}
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
                    options={[
                      { label: '最小长度', value: 'minLength' },
                      { label: '最大长度', value: 'maxLength' },
                      { label: '最小值', value: 'min' },
                      { label: '最大值', value: 'max' },
                      { label: '正则匹配', value: 'pattern' },
                    ]}
                    onChange={(type) => {
                      if (!type) return;
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
                      const rules = selectedComponent.props.rules || [];
                      const newRule = { 
                        type: type as ValidationRule['type'], 
                        value: defaultValues[type],
                        message: defaultMessages[type] 
                      };
                      updateComponentProps(selectedComponent.id, { rules: [...rules, newRule] });
                    }}
                  />
                </div>

                {/* 规则值编辑器 */}
                {selectedComponent.props.rules?.map((rule, index) => {
                  if (['minLength', 'maxLength', 'min', 'max'].includes(rule.type)) {
                    return (
                      <div key={`edit-${index}`} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                        <Text style={{ fontSize: 12, minWidth: 60 }}>{rule.type}:</Text>
                        <InputNumber
                          size="small"
                          value={rule.value as number}
                          onChange={(val) => {
                            const newRules = [...(selectedComponent.props.rules || [])];
                            newRules[index] = { ...rule, value: val ?? 0 };
                            updateComponentProps(selectedComponent.id, { rules: newRules });
                          }}
                          style={{ width: 80 }}
                        />
                        <Input
                          size="small"
                          value={rule.message}
                          onChange={(e) => {
                            const newRules = [...(selectedComponent.props.rules || [])];
                            newRules[index] = { ...rule, message: e.target.value };
                            updateComponentProps(selectedComponent.id, { rules: newRules });
                          }}
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
                          onChange={(e) => {
                            const newRules = [...(selectedComponent.props.rules || [])];
                            newRules[index] = { ...rule, value: e.target.value };
                            updateComponentProps(selectedComponent.id, { rules: newRules });
                          }}
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
