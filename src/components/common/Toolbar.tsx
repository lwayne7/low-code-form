import React, { useRef } from 'react';
import { Button, Tooltip, Divider, Space, message } from 'antd';
import {
  CopyOutlined,
  SnippetsOutlined,
  DeleteOutlined,
  BlockOutlined,
  SelectOutlined,
  DownloadOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { useStore } from '../../store';

interface ToolbarProps {
  disabled?: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({ disabled = false }) => {
  const {
    selectedIds,
    clipboard,
    components,
    copyComponents,
    pasteComponents,
    duplicateComponents,
    deleteComponent,
    selectAll,
    importComponents,
  } = useStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasSelection = selectedIds.length > 0;
  const hasClipboard = clipboard.length > 0;
  const hasComponents = components.length > 0;

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

  // 🆕 导出 JSON
  const handleExport = () => {
    if (!hasComponents) {
      message.warning('没有组件可导出');
      return;
    }
    
    const json = JSON.stringify({ components, version: '1.0' }, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `form-schema-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    message.success('已导出表单配置');
  };

  // 🆕 导入 JSON
  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.components && Array.isArray(json.components)) {
          importComponents(json.components);
          message.success(`已导入 ${json.components.length} 个组件`);
        } else {
          message.error('无效的表单配置文件');
        }
      } catch {
        message.error('解析文件失败，请确保是有效的 JSON 文件');
      }
    };
    reader.readAsText(file);
    
    // 重置 input，允许重复导入同一文件
    e.target.value = '';
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

      <Tooltip title="导出 JSON">
        <Button
          size="small"
          type="text"
          icon={<DownloadOutlined />}
          onClick={handleExport}
          disabled={disabled || !hasComponents}
        />
      </Tooltip>
      
      <Tooltip title="导入 JSON">
        <Button
          size="small"
          type="text"
          icon={<UploadOutlined />}
          onClick={handleImport}
          disabled={disabled}
        />
      </Tooltip>
      
      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      
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
