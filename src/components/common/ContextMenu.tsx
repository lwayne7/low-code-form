import React from 'react';
import { Dropdown, type MenuProps } from 'antd';
import {
  CopyOutlined,
  DeleteOutlined,
  ScissorOutlined,
  SnippetsOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  VerticalAlignTopOutlined,
  VerticalAlignBottomOutlined,
  LockOutlined,
  UnlockOutlined,
} from '@ant-design/icons';

interface ContextMenuProps {
  children: React.ReactNode;
  onCopy: () => void;
  onCut: () => void;
  onPaste: () => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onMoveToTop?: () => void;
  onMoveToBottom?: () => void;
  onToggleLock?: () => void;
  canPaste: boolean;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  isLocked?: boolean;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  children,
  onCopy,
  onCut,
  onPaste,
  onDelete,
  onMoveUp,
  onMoveDown,
  onMoveToTop,
  onMoveToBottom,
  onToggleLock,
  canPaste,
  canMoveUp = true,
  canMoveDown = true,
  isLocked = false,
}) => {
  const menuItems: MenuProps['items'] = [
    {
      key: 'lock',
      label: isLocked ? '解锁组件' : '锁定组件',
      icon: isLocked ? <UnlockOutlined /> : <LockOutlined />,
      onClick: onToggleLock,
    },
    {
      type: 'divider',
    },
    {
      key: 'copy',
      label: '复制',
      icon: <CopyOutlined />,
      onClick: onCopy,
      disabled: isLocked,
    },
    {
      key: 'cut',
      label: '剪切',
      icon: <ScissorOutlined />,
      onClick: onCut,
      disabled: isLocked,
    },
    {
      key: 'paste',
      label: '粘贴',
      icon: <SnippetsOutlined />,
      onClick: onPaste,
      disabled: !canPaste,
    },
    {
      type: 'divider',
    },
    {
      key: 'moveUp',
      label: '上移',
      icon: <ArrowUpOutlined />,
      onClick: onMoveUp,
      disabled: !canMoveUp || isLocked,
    },
    {
      key: 'moveDown',
      label: '下移',
      icon: <ArrowDownOutlined />,
      onClick: onMoveDown,
      disabled: !canMoveDown || isLocked,
    },
    {
      key: 'moveToTop',
      label: '移到顶部',
      icon: <VerticalAlignTopOutlined />,
      onClick: onMoveToTop,
      disabled: !canMoveUp || isLocked,
    },
    {
      key: 'moveToBottom',
      label: '移到底部',
      icon: <VerticalAlignBottomOutlined />,
      onClick: onMoveToBottom,
      disabled: !canMoveDown || isLocked,
    },
    {
      type: 'divider',
    },
    {
      key: 'delete',
      label: '删除',
      icon: <DeleteOutlined />,
      onClick: onDelete,
      danger: true,
      disabled: isLocked,
    },
  ];

  return (
    <Dropdown menu={{ items: menuItems }} trigger={['contextMenu']}>
      {children}
    </Dropdown>
  );
};
