import React, { useMemo } from 'react';
import { Popover, Tag, Space, Typography } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { useStore } from '../../store';
import { useI18n } from '../../i18n';
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

export const FormStats: React.FC = () => {
  const components = useStore((state) => state.components);
  const { t, locale } = useI18n();

  const stats = useMemo(() => calculateStats(components), [components]);

  // 组件类型名称映射
  const getTypeName = (type: string) => {
    const typeNameMap: Record<string, string> = locale === 'zh-CN' ? {
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
    } : {
      Input: 'Input',
      TextArea: 'TextArea',
      InputNumber: 'Number',
      Select: 'Select',
      Radio: 'Radio',
      Checkbox: 'Checkbox',
      Switch: 'Switch',
      DatePicker: 'Date',
      TimePicker: 'Time',
      Button: 'Button',
      Container: 'Container',
    };
    return typeNameMap[type] || type;
  };

  const content = (
    <div style={{ minWidth: 180 }}>
      <div style={{ marginBottom: 12 }}>
        <Text strong>📊 {t('stats.title')}</Text>
      </div>

      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Text type="secondary">{t('stats.total')}</Text>
          <Tag color="blue">{stats.totalCount}</Tag>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Text type="secondary">{t('stats.topLevel')}</Text>
          <Tag>{stats.topLevelCount}</Tag>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Text type="secondary">{t('stats.containers')}</Text>
          <Tag color="purple">{stats.containerCount}</Tag>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Text type="secondary">{t('stats.maxDepth')}</Text>
          <Tag color={stats.maxDepth > 3 ? 'orange' : 'green'}>
            {stats.maxDepth} {t('stats.levels')}
          </Tag>
        </div>
      </Space>

      {Object.keys(stats.typeStats).length > 0 && (
        <>
          <div style={{ margin: '12px 0 8px', borderTop: '1px solid #f0f0f0', paddingTop: 12 }}>
            <Text strong style={{ fontSize: 12 }}>{t('stats.typeDistribution')}</Text>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {Object.entries(stats.typeStats).map(([type, count]) => (
              <Tag key={type} style={{ margin: 0 }}>
                {getTypeName(type)}: {count}
              </Tag>
            ))}
          </div>
        </>
      )}

      {stats.totalCount === 0 && (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {t('stats.empty')}
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
        {stats.totalCount} {t('stats.components')}
      </Tag>
    </Popover>
  );
};
