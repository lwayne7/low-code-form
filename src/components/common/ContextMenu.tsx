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
  canPaste: boolean;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
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
  canPaste,
  canMoveUp = true,
  canMoveDown = true,
}) => {
  const menuItems: MenuProps['items'] = [
    {
      key: 'copy',
      label: '复制',
      icon: <CopyOutlined />,
      onClick: onCopy,
    },
    {
      key: 'cut',
      label: '剪切',
      icon: <ScissorOutlined />,
      onClick: onCut,
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
      disabled: !canMoveUp,
    },
    {
      key: 'moveDown',
      label: '下移',
      icon: <ArrowDownOutlined />,
      onClick: onMoveDown,
      disabled: !canMoveDown,
    },
    {
      key: 'moveToTop',
      label: '移到顶部',
      icon: <VerticalAlignTopOutlined />,
      onClick: onMoveToTop,
      disabled: !canMoveUp,
    },
    {
      key: 'moveToBottom',
      label: '移到底部',
      icon: <VerticalAlignBottomOutlined />,
      onClick: onMoveToBottom,
      disabled: !canMoveDown,
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
    },
  ];

  return (
    <Dropdown menu={{ items: menuItems }} trigger={['contextMenu']}>
      {children}
    </Dropdown>
  );
};
