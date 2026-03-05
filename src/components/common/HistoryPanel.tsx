import * as React from 'react';
import { Drawer, Timeline, Empty, Typography, Space, Tag } from 'antd';
import { HistoryOutlined, RollbackOutlined } from '@ant-design/icons';
import type { ComponentSchema } from '../../types';
import type { HistoryEntry } from '../../store';

const { Text } = Typography;

interface HistoryPanelProps {
  open: boolean;
  onClose: () => void;
  past: HistoryEntry[];
  future: HistoryEntry[];
  currentComponents: ComponentSchema[];
  onJumpTo: (index: number) => void;
}

function countComponentTree(components: ComponentSchema[]): number {
  let count = 0;
  const traverse = (list: ComponentSchema[]) => {
    for (const component of list) {
      count += 1;
      if (component.children && component.children.length > 0) traverse(component.children);
    }
  };
  traverse(components);
  return count;
}

function entryDelta(entry: HistoryEntry): number {
  const countRecords = (records: Array<{ component: ComponentSchema }>) =>
    records.reduce((sum, record) => sum + countComponentTree([record.component]), 0);

  switch (entry.kind) {
    case 'insert':
      return countRecords(entry.inserts);
    case 'delete':
      return -countRecords(entry.removes);
    case 'replaceAll':
      return countRecords(entry.inserts) - countRecords(entry.removes);
    case 'move':
    case 'updateProps':
      return 0;
  }
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  open,
  onClose,
  past,
  future,
  currentComponents,
  onJumpTo,
}) => {
  const currentCount = countComponentTree(currentComponents);
  const pastDeltas = past.map(entryDelta);
  const initialCount = currentCount - pastDeltas.reduce((sum, delta) => sum + delta, 0);

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
        <Empty description="暂无操作历史" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <Timeline
          items={[
            // 初始状态
            {
              color: past.length === 0 ? 'blue' : 'gray',
              children: (
                <div
                  style={{
                    cursor: past.length !== 0 ? 'pointer' : 'default',
                    opacity: past.length === 0 ? 1 : 0.7,
                    padding: '4px 0',
                  }}
                  onClick={() => past.length !== 0 && onJumpTo(-past.length)}
                >
                  <Text strong={past.length === 0}>初始状态</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {initialCount} 个组件
                  </Text>
                  {past.length === 0 && (
                    <Tag color="blue" style={{ marginLeft: 8 }}>
                      当前
                    </Tag>
                  )}
                </div>
              ),
            },
            // 历史操作
            ...past.map((entry, index) => {
              const isCurrentState = index === past.length - 1;
              const stepsBack = past.length - (index + 1);
              const countAfter =
                initialCount +
                pastDeltas.slice(0, index + 1).reduce((sum, delta) => sum + delta, 0);

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
                    <Text strong={isCurrentState}>{entry.label}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {countAfter} 个组件
                    </Text>
                    {isCurrentState && (
                      <Tag color="blue" style={{ marginLeft: 8 }}>
                        当前
                      </Tag>
                    )}
                  </div>
                ),
              };
            }),
            // 未来状态（重做栈）
            ...future.map((entry, index) => {
              const stepsForward = index + 1;
              const countAfter =
                currentCount +
                future
                  .slice(0, index + 1)
                  .reduce((sum, futureEntry) => sum + entryDelta(futureEntry), 0);

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
                    <Text type="secondary">{entry.label}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {countAfter} 个组件 · 可重做
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
