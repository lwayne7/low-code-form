import React from 'react';
import { Form, Input, Tag, Divider } from 'antd';
import type { ComponentSchema } from '../../types';
import { validateConditionExpression } from '../../utils/expression';

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
  const visibleOn = getComponentProp(component, 'visibleOn', '');
  const validation = validateConditionExpression(visibleOn);
  const hasError = Boolean(visibleOn.trim()) && !validation.ok;

  return (
    <>
      <Divider style={{ margin: '16px 0' }}>组件联动</Divider>

      <Form.Item
        label="显隐条件 (visibleOn)"
        tooltip="仅支持安全表达式：values['组件ID']、字面量、括号、!、&&、||、比较运算（=== !== < <= > >=）"
        validateStatus={hasError ? 'error' : undefined}
        help={hasError ? `表达式错误：${validation.error}` : undefined}
      >
        <Input.TextArea
          value={visibleOn}
          onChange={(e) => updateProps({ visibleOn: e.target.value })}
          placeholder={`例如：values['${allComponents[0]?.id || 'xxx'}'] === 'show'`}
          rows={3}
          style={{ fontFamily: 'monospace', fontSize: 12 }}
        />
        <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
          <div>可用的组件 ID：</div>
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
