import React from 'react';
import { Form, Input, Tag, Divider } from 'antd';
import type { ComponentSchema } from '../../types';

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

  return (
    <>
      <Divider style={{ margin: '16px 0' }}>组件联动</Divider>

      <Form.Item
        label="显隐条件 (visibleOn)"
        tooltip="使用 JavaScript 表达式，通过 values['组件ID'] 访问其他组件的值"
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
