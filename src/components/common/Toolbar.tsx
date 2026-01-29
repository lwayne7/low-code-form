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
import { useI18n } from '../../i18n';

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

  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasSelection = selectedIds.length > 0;
  const hasClipboard = clipboard.length > 0;
  const hasComponents = components.length > 0;

  const handleCopy = () => {
    if (hasSelection) {
      copyComponents();
      message.success(t('toolbar.copied', { count: selectedIds.length }));
    }
  };

  const handlePaste = () => {
    if (hasClipboard) {
      pasteComponents();
      message.success(t('toolbar.pasted', { count: clipboard.length }));
    }
  };

  const handleDuplicate = () => {
    if (hasSelection) {
      duplicateComponents();
      message.success(t('toolbar.duplicated'));
    }
  };

  const handleDelete = () => {
    if (hasSelection) {
      deleteComponent(selectedIds);
      message.success(t('toolbar.deleted', { count: selectedIds.length }));
    }
  };

  // 🆕 导出 JSON
  const handleExport = () => {
    if (!hasComponents) {
      message.warning(t('toolbar.noExport'));
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
    
    message.success(t('toolbar.exported'));
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
          message.success(t('toolbar.imported', { count: json.components.length }));
        } else {
          message.error(t('toolbar.invalidFile'));
        }
      } catch {
        message.error(t('toolbar.parseError'));
      }
    };
    reader.readAsText(file);
    
    // 重置 input，允许重复导入同一文件
    e.target.value = '';
  };

  return (
    <Space size={4}>
      <Tooltip title={t('toolbar.selectAll')}>
        <Button
          size="small"
          type="text"
          icon={<SelectOutlined />}
          onClick={selectAll}
          disabled={disabled}
        />
      </Tooltip>
      
      <Divider type="vertical" style={{ height: 16, margin: '0 4px' }} />
      
      <Tooltip title={t('toolbar.copy')}>
        <Button
          size="small"
          type="text"
          icon={<CopyOutlined />}
          onClick={handleCopy}
          disabled={disabled || !hasSelection}
        />
      </Tooltip>
      
      <Tooltip title={t('toolbar.paste')}>
        <Button
          size="small"
          type="text"
          icon={<SnippetsOutlined />}
          onClick={handlePaste}
          disabled={disabled || !hasClipboard}
        />
      </Tooltip>
      
      <Tooltip title={t('toolbar.duplicate')}>
        <Button
          size="small"
          type="text"
          icon={<BlockOutlined />}
          onClick={handleDuplicate}
          disabled={disabled || !hasSelection}
        />
      </Tooltip>
      
      <Divider type="vertical" style={{ height: 16, margin: '0 4px' }} />

      <Tooltip title={t('toolbar.exportJson')}>
        <Button
          size="small"
          type="text"
          icon={<DownloadOutlined />}
          onClick={handleExport}
          disabled={disabled || !hasComponents}
        />
      </Tooltip>
      
      <Tooltip title={t('toolbar.importJson')}>
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
      
      <Tooltip title={t('toolbar.delete')}>
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
