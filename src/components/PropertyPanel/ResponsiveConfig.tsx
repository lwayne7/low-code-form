import React from 'react';
import { Form, Select, InputNumber, Divider, Typography } from 'antd';
import type { ComponentSchema } from '../../types';

const { Text } = Typography;

// 辅助函数：安全获取组件属性
const getComponentProp = <T,>(component: ComponentSchema, key: string, defaultValue: T): T => {
  const props = component.props as Record<string, unknown>;
  return (props[key] as T) ?? defaultValue;
};

interface ResponsiveConfigProps {
  component: ComponentSchema;
  updateProps: (newProps: Partial<ComponentSchema['props']>) => void;
}

export const ResponsiveConfig: React.FC<ResponsiveConfigProps> = ({
  component,
  updateProps,
}) => {
  const responsive = getComponentProp<Record<string, number>>(component, 'responsive', {});

  const updateResponsive = (key: string, value: number | null) => {
    updateProps({
      responsive: { ...responsive, [key]: value ?? undefined }
    });
  };

  return (
    <>
      <Divider style={{ margin: '16px 0' }}>响应式布局</Divider>
      
      <Form.Item label="占用列数" tooltip="组件在父容器栅格中占用的列数 (1-24)">
        <Select
          value={getComponentProp(component, 'colSpan', 24)}
          onChange={(val) => updateProps({ colSpan: val })}
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
              value={responsive.xs ?? 24}
              onChange={(val) => updateResponsive('xs', val)}
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 11 }}>平板 (sm)</Text>
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
            <Text type="secondary" style={{ fontSize: 11 }}>桌面 (md)</Text>
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
            <Text type="secondary" style={{ fontSize: 11 }}>大屏 (lg)</Text>
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
