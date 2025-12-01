import React from 'react';
import { Drawer, Timeline, Empty, Typography, Space, Tag } from 'antd';
import { HistoryOutlined, RollbackOutlined } from '@ant-design/icons';
import type { ComponentSchema } from '../../types';

const { Text } = Typography;

interface HistoryPanelProps {
  open: boolean;
  onClose: () => void;
  past: ComponentSchema[][];
  future: ComponentSchema[][];
  currentComponents: ComponentSchema[];
  onJumpTo: (index: number) => void;
}

// 计算两个状态之间的变化
const describeChange = (before: ComponentSchema[], after: ComponentSchema[]): string => {
  const beforeIds = new Set(getAllIds(before));
  const afterIds = new Set(getAllIds(after));
  
  const added = [...afterIds].filter(id => !beforeIds.has(id));
  const removed = [...beforeIds].filter(id => !afterIds.has(id));
  
  if (added.length > 0 && removed.length === 0) {
    return `添加了 ${added.length} 个组件`;
  }
  if (removed.length > 0 && added.length === 0) {
    return `删除了 ${removed.length} 个组件`;
  }
  if (added.length > 0 && removed.length > 0) {
    return `添加 ${added.length} 个，删除 ${removed.length} 个`;
  }
  if (before.length === after.length) {
    return '修改了组件属性';
  }
  return '调整了组件顺序';
};

// 获取所有组件 ID
const getAllIds = (components: ComponentSchema[]): string[] => {
  const ids: string[] = [];
  const collect = (comps: ComponentSchema[]) => {
    comps.forEach(c => {
      ids.push(c.id);
      if (c.children) collect(c.children);
    });
  };
  collect(components);
  return ids;
};

// 统计组件数量
const countComponents = (components: ComponentSchema[]): number => {
  return getAllIds(components).length;
};

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  open,
  onClose,
  past,
  future,
  currentComponents,
  onJumpTo,
}) => {
  // 构建完整的历史线
  const allStates = [...past, currentComponents, ...future.slice().reverse()];
  const currentIndex = past.length;

  return (
    <Drawer
      title={
        <Space>
          <HistoryOutlined />
          <span>操作历史</span>
          <Tag color="blue">{past.length} 次操作</Tag>
        </Space>
      }
      placement="right"
      open={open}
      onClose={onClose}
      width={320}
    >
      {past.length === 0 && future.length === 0 ? (
        <Empty 
          description="暂无操作历史" 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <Timeline
          items={[
            // 初始状态
            {
              color: currentIndex === 0 ? 'blue' : 'gray',
              children: (
                <div 
                  style={{ 
                    cursor: currentIndex !== 0 ? 'pointer' : 'default',
                    opacity: currentIndex === 0 ? 1 : 0.7,
                    padding: '4px 0',
                  }}
                  onClick={() => currentIndex !== 0 && onJumpTo(-past.length)}
                >
                  <Text strong={currentIndex === 0}>初始状态</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {countComponents(allStates[0] || [])} 个组件
                  </Text>
                  {currentIndex === 0 && (
                    <Tag color="blue" style={{ marginLeft: 8 }}>当前</Tag>
                  )}
                </div>
              ),
            },
            // 历史操作
            ...past.slice(1).map((state, index) => {
              const prevState = past[index] || [];
              const isCurrentState = index + 1 === currentIndex;
              const stepsBack = currentIndex - (index + 1);
              
              return {
                color: isCurrentState ? 'blue' : 'gray',
                children: (
                  <div 
                    style={{ 
                      cursor: !isCurrentState ? 'pointer' : 'default',
                      opacity: isCurrentState ? 1 : 0.7,
                      padding: '4px 0',
                    }}
                    onClick={() => !isCurrentState && onJumpTo(-stepsBack)}
                  >
                    <Text strong={isCurrentState}>
                      {describeChange(prevState, state)}
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {countComponents(state)} 个组件
                    </Text>
                    {isCurrentState && (
                      <Tag color="blue" style={{ marginLeft: 8 }}>当前</Tag>
                    )}
                  </div>
                ),
              };
            }),
            // 当前状态（如果不在 past 中）
            ...(past.length > 0 ? [{
              color: 'blue',
              children: (
                <div style={{ padding: '4px 0' }}>
                  <Text strong>
                    {describeChange(past[past.length - 1], currentComponents)}
                  </Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {countComponents(currentComponents)} 个组件
                  </Text>
                  <Tag color="blue" style={{ marginLeft: 8 }}>当前</Tag>
                </div>
              ),
            }] : []),
            // 未来状态（重做栈）
            ...future.slice().reverse().map((state, index) => {
              const prevState = index === 0 ? currentComponents : future[future.length - index];
              const stepsForward = index + 1;
              
              return {
                color: 'gray',
                dot: <RollbackOutlined style={{ transform: 'scaleX(-1)' }} />,
                children: (
                  <div 
                    style={{ 
                      cursor: 'pointer',
                      opacity: 0.5,
                      padding: '4px 0',
                    }}
                    onClick={() => onJumpTo(stepsForward)}
                  >
                    <Text type="secondary">
                      {describeChange(prevState || [], state)}
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {countComponents(state)} 个组件 · 可重做
                    </Text>
                  </div>
                ),
              };
            }),
          ]}
        />
      )}
      
      {(past.length > 0 || future.length > 0) && (
        <div style={{ marginTop: 16, padding: '12px 0', borderTop: '1px solid #f0f0f0' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              💡 点击历史记录可以跳转到对应状态
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              ⌨️ Ctrl+Z 撤销 · Ctrl+Shift+Z 重做
            </Text>
          </Space>
        </div>
      )}
    </Drawer>
  );
};
