import React from 'react';
import { Modal, Typography, Space, Tag, Divider } from 'antd';
import {
  DeleteOutlined,
  CopyOutlined,
  SnippetsOutlined,
  UndoOutlined,
  RedoOutlined,
  SelectOutlined,
  CloseCircleOutlined,
  BlockOutlined,
} from '@ant-design/icons';

const { Text, Title } = Typography;

interface ShortcutItem {
  keys: string[];
  description: string;
  icon: React.ReactNode;
}

const shortcuts: ShortcutItem[] = [
  { keys: ['⌘/Ctrl', 'C'], description: '复制选中组件', icon: <CopyOutlined /> },
  { keys: ['⌘/Ctrl', 'V'], description: '粘贴组件', icon: <SnippetsOutlined /> },
  { keys: ['⌘/Ctrl', 'D'], description: '复制并粘贴组件', icon: <BlockOutlined /> },
  { keys: ['⌘/Ctrl', 'A'], description: '全选组件', icon: <SelectOutlined /> },
  { keys: ['⌘/Ctrl', 'Z'], description: '撤销操作', icon: <UndoOutlined /> },
  { keys: ['⌘/Ctrl', 'Shift', 'Z'], description: '重做操作', icon: <RedoOutlined /> },
  { keys: ['Delete'], description: '删除选中组件', icon: <DeleteOutlined /> },
  { keys: ['Backspace'], description: '删除选中组件', icon: <DeleteOutlined /> },
  { keys: ['Esc'], description: '取消选择', icon: <CloseCircleOutlined /> },
];

interface KeyboardShortcutsPanelProps {
  open: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsPanel: React.FC<KeyboardShortcutsPanelProps> = ({
  open,
  onClose,
}) => {
  return (
    <Modal
      title={
        <Space>
          <span>⌨️</span>
          <span>快捷键</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={480}
    >
      <div style={{ padding: '8px 0' }}>
        <Title level={5} style={{ marginBottom: 16 }}>
          编辑操作
        </Title>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {shortcuts.map((shortcut, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                background: '#fafafa',
                borderRadius: 6,
              }}
            >
              <Space>
                <span style={{ color: '#1677ff', fontSize: 16 }}>{shortcut.icon}</span>
                <Text>{shortcut.description}</Text>
              </Space>
              <Space size={4}>
                {shortcut.keys.map((key, i) => (
                  <React.Fragment key={i}>
                    <Tag
                      style={{
                        margin: 0,
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: '#fff',
                        border: '1px solid #d9d9d9',
                        fontFamily: 'monospace',
                        fontSize: 12,
                      }}
                    >
                      {key}
                    </Tag>
                    {i < shortcut.keys.length - 1 && (
                      <Text type="secondary" style={{ fontSize: 12 }}>+</Text>
                    )}
                  </React.Fragment>
                ))}
              </Space>
            </div>
          ))}
        </div>

        <Divider />

        <Title level={5} style={{ marginBottom: 16 }}>
          鼠标操作
        </Title>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              background: '#fafafa',
              borderRadius: 6,
            }}
          >
            <Text>单击组件</Text>
            <Text type="secondary">选中组件</Text>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              background: '#fafafa',
              borderRadius: 6,
            }}
          >
            <Text>⌘/Ctrl + 单击</Text>
            <Text type="secondary">多选组件</Text>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              background: '#fafafa',
              borderRadius: 6,
            }}
          >
            <Text>框选</Text>
            <Text type="secondary">批量选中区域内组件</Text>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              background: '#fafafa',
              borderRadius: 6,
            }}
          >
            <Text>拖拽</Text>
            <Text type="secondary">移动组件位置</Text>
          </div>
        </div>
      </div>
    </Modal>
  );
};
