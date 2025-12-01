import React, { useMemo } from 'react';
import { Popover, Tag, Space, Typography } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { useStore } from '../../store';
import type { ComponentSchema } from '../../types';

const { Text } = Typography;

// 统计信息类型
interface FormStatsInfo {
  totalCount: number;        // 总组件数
  topLevelCount: number;     // 顶层组件数
  containerCount: number;    // 容器数量
  maxDepth: number;          // 最大嵌套深度
  typeStats: Record<string, number>;  // 各类型组件数量
}

// 递归统计组件
const calculateStats = (components: ComponentSchema[], depth = 1): FormStatsInfo => {
  let totalCount = 0;
  let containerCount = 0;
  let maxDepth = components.length > 0 ? depth : 0;
  const typeStats: Record<string, number> = {};

  const traverse = (items: ComponentSchema[], currentDepth: number) => {
    items.forEach((component) => {
      totalCount++;
      typeStats[component.type] = (typeStats[component.type] || 0) + 1;

      if (component.type === 'Container') {
        containerCount++;
        if (component.children && component.children.length > 0) {
          maxDepth = Math.max(maxDepth, currentDepth + 1);
          traverse(component.children, currentDepth + 1);
        }
      }
    });
  };

  traverse(components, depth);

  return {
    totalCount,
    topLevelCount: components.length,
    containerCount,
    maxDepth,
    typeStats,
  };
};

// 组件类型中文名映射
const typeNameMap: Record<string, string> = {
  Input: '输入框',
  TextArea: '文本域',
  InputNumber: '数字输入',
  Select: '下拉选择',
  Radio: '单选框',
  Checkbox: '多选框',
  Switch: '开关',
  DatePicker: '日期选择',
  TimePicker: '时间选择',
  Button: '按钮',
  Container: '容器',
};

export const FormStats: React.FC = () => {
  const components = useStore((state) => state.components);

  const stats = useMemo(() => calculateStats(components), [components]);

  const content = (
    <div style={{ minWidth: 180 }}>
      <div style={{ marginBottom: 12 }}>
        <Text strong>📊 表单统计</Text>
      </div>
      
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Text type="secondary">总组件数</Text>
          <Tag color="blue">{stats.totalCount}</Tag>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Text type="secondary">顶层组件</Text>
          <Tag>{stats.topLevelCount}</Tag>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Text type="secondary">容器数量</Text>
          <Tag color="purple">{stats.containerCount}</Tag>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Text type="secondary">最大嵌套</Text>
          <Tag color={stats.maxDepth > 3 ? 'orange' : 'green'}>
            {stats.maxDepth} 层
          </Tag>
        </div>
      </Space>

      {Object.keys(stats.typeStats).length > 0 && (
        <>
          <div style={{ margin: '12px 0 8px', borderTop: '1px solid #f0f0f0', paddingTop: 12 }}>
            <Text strong style={{ fontSize: 12 }}>组件类型分布</Text>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {Object.entries(stats.typeStats).map(([type, count]) => (
              <Tag key={type} style={{ margin: 0 }}>
                {typeNameMap[type] || type}: {count}
              </Tag>
            ))}
          </div>
        </>
      )}

      {stats.totalCount === 0 && (
        <Text type="secondary" style={{ fontSize: 12 }}>
          暂无组件，从左侧拖拽添加
        </Text>
      )}
    </div>
  );

  return (
    <Popover content={content} trigger="hover" placement="bottomRight">
      <Tag 
        icon={<InfoCircleOutlined />} 
        color="processing"
        style={{ cursor: 'pointer' }}
      >
        {stats.totalCount} 个组件
      </Tag>
    </Popover>
  );
};
