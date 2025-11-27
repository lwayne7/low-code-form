import React from 'react';
import { Button, Tooltip, Divider, Space, message } from 'antd';
import {
  CopyOutlined,
  SnippetsOutlined,
  DeleteOutlined,
  BlockOutlined,
  SelectOutlined,
} from '@ant-design/icons';
import { useStore } from '../../store';

interface ToolbarProps {
  disabled?: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({ disabled = false }) => {
  const {
    selectedIds,
    clipboard,
    copyComponents,
    pasteComponents,
    duplicateComponents,
    deleteComponent,
    selectAll,
  } = useStore();

  const hasSelection = selectedIds.length > 0;
  const hasClipboard = clipboard.length > 0;

  const handleCopy = () => {
    if (hasSelection) {
      copyComponents();
      message.success(`已复制 ${selectedIds.length} 个组件`);
    }
  };

  const handlePaste = () => {
    if (hasClipboard) {
      pasteComponents();
      message.success(`已粘贴 ${clipboard.length} 个组件`);
    }
  };

  const handleDuplicate = () => {
    if (hasSelection) {
      duplicateComponents();
      message.success('已复制组件');
    }
  };

  const handleDelete = () => {
    if (hasSelection) {
      deleteComponent(selectedIds);
      message.success(`已删除 ${selectedIds.length} 个组件`);
    }
  };

  return (
    <Space size={4}>
      <Tooltip title="全选 (⌘A)">
        <Button
          size="small"
          type="text"
          icon={<SelectOutlined />}
          onClick={selectAll}
          disabled={disabled}
        />
      </Tooltip>
      
      <Divider type="vertical" style={{ height: 16, margin: '0 4px' }} />
      
      <Tooltip title="复制 (⌘C)">
        <Button
          size="small"
          type="text"
          icon={<CopyOutlined />}
          onClick={handleCopy}
          disabled={disabled || !hasSelection}
        />
      </Tooltip>
      
      <Tooltip title="粘贴 (⌘V)">
        <Button
          size="small"
          type="text"
          icon={<SnippetsOutlined />}
          onClick={handlePaste}
          disabled={disabled || !hasClipboard}
        />
      </Tooltip>
      
      <Tooltip title="复制并粘贴 (⌘D)">
        <Button
          size="small"
          type="text"
          icon={<BlockOutlined />}
          onClick={handleDuplicate}
          disabled={disabled || !hasSelection}
        />
      </Tooltip>
      
      <Divider type="vertical" style={{ height: 16, margin: '0 4px' }} />
      
      <Tooltip title="删除 (Delete)">
        <Button
          size="small"
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={handleDelete}
          disabled={disabled || !hasSelection}
        />
      </Tooltip>
    </Space>
  );
};
