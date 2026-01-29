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
  SwapOutlined,
  DragOutlined,
} from '@ant-design/icons';
import { useI18n } from '../../i18n';

const { Text, Title } = Typography;

interface ShortcutItem {
  keys: string[];
  descriptionKey: string;
  icon: React.ReactNode;
}

const shortcutConfigs: ShortcutItem[] = [
  { keys: ['⌘/Ctrl', 'C'], descriptionKey: 'shortcuts.copyComponent', icon: <CopyOutlined /> },
  { keys: ['⌘/Ctrl', 'V'], descriptionKey: 'shortcuts.pasteComponent', icon: <SnippetsOutlined /> },
  { keys: ['⌘/Ctrl', 'D'], descriptionKey: 'shortcuts.duplicateComponent', icon: <BlockOutlined /> },
  { keys: ['⌘/Ctrl', 'A'], descriptionKey: 'shortcuts.selectAll', icon: <SelectOutlined /> },
  { keys: ['⌘/Ctrl', 'Z'], descriptionKey: 'shortcuts.undo', icon: <UndoOutlined /> },
  { keys: ['⌘/Ctrl', 'Shift', 'Z'], descriptionKey: 'shortcuts.redo', icon: <RedoOutlined /> },
  { keys: ['Delete'], descriptionKey: 'shortcuts.deleteComponent', icon: <DeleteOutlined /> },
  { keys: ['Backspace'], descriptionKey: 'shortcuts.deleteComponent', icon: <DeleteOutlined /> },
  { keys: ['Esc'], descriptionKey: 'shortcuts.cancelSelect', icon: <CloseCircleOutlined /> },
];

// 拖拽相关快捷键
const dragShortcutConfigs: { keys: string[]; descriptionKey: string; icon: React.ReactNode }[] = [
  { keys: ['Shift'], descriptionKey: 'shortcuts.forceNest', icon: <BlockOutlined /> },
  { keys: ['Alt/Option'], descriptionKey: 'shortcuts.forceSibling', icon: <SwapOutlined /> },
];

interface KeyboardShortcutsPanelProps {
  open: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsPanel: React.FC<KeyboardShortcutsPanelProps> = ({
  open,
  onClose,
}) => {
  const { t, locale } = useI18n();

  // 鼠标操作翻译
  const mouseOps = locale === 'zh-CN' ? [
    { action: '单击组件', result: '选中组件' },
    { action: '⌘/Ctrl + 单击', result: '多选组件' },
    { action: '框选', result: '批量选中区域内组件' },
    { action: '拖拽', result: '移动组件位置' },
  ] : [
    { action: 'Click component', result: 'Select component' },
    { action: '⌘/Ctrl + Click', result: 'Multi-select' },
    { action: 'Box select', result: 'Batch select components' },
    { action: 'Drag', result: 'Move component' },
  ];

  return (
    <Modal
      title={
        <Space>
          <span>⌨️</span>
          <span>{t('shortcuts.title')}</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={480}
    >
      <div style={{ padding: '8px 0' }}>
        <Title level={5} style={{ marginBottom: 16 }}>
          {locale === 'zh-CN' ? '编辑操作' : 'Edit Operations'}
        </Title>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {shortcutConfigs.map((shortcut, index) => (
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
                <Text>{t(shortcut.descriptionKey as keyof typeof t)}</Text>
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
          {locale === 'zh-CN' ? '鼠标操作' : 'Mouse Operations'}
        </Title>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {mouseOps.map((op, index) => (
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
              <Text>{op.action}</Text>
              <Text type="secondary">{op.result}</Text>
            </div>
          ))}
        </div>

        <Divider />

        <Title level={5} style={{ marginBottom: 16 }}>
          <DragOutlined style={{ marginRight: 8 }} />
          {locale === 'zh-CN' ? '拖拽修饰键' : 'Drag Modifiers'}
        </Title>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {dragShortcutConfigs.map((shortcut, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                background: '#e6f4ff',
                borderRadius: 6,
                border: '1px solid #91caff',
              }}
            >
              <Space>
                <span style={{ color: '#1677ff', fontSize: 16 }}>{shortcut.icon}</span>
                <Text>{t(shortcut.descriptionKey as keyof typeof t)}</Text>
              </Space>
              <Space size={4}>
                {shortcut.keys.map((key, i) => (
                  <React.Fragment key={i}>
                    <Tag
                      color="blue"
                      style={{
                        margin: 0,
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontFamily: 'monospace',
                        fontSize: 12,
                      }}
                    >
                      {key} {t('shortcuts.drag')}
                    </Tag>
                  </React.Fragment>
                ))}
              </Space>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};
