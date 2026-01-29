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
import { useI18n } from '../../i18n';

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
  const { t } = useI18n();

  const menuItems: MenuProps['items'] = [
    {
      key: 'lock',
      label: isLocked ? t('contextMenu.unlock') : t('contextMenu.lock'),
      icon: isLocked ? <UnlockOutlined /> : <LockOutlined />,
      onClick: onToggleLock,
    },
    {
      type: 'divider',
    },
    {
      key: 'copy',
      label: t('common.copy'),
      icon: <CopyOutlined />,
      onClick: onCopy,
      disabled: isLocked,
    },
    {
      key: 'cut',
      label: t('common.cut'),
      icon: <ScissorOutlined />,
      onClick: onCut,
      disabled: isLocked,
    },
    {
      key: 'paste',
      label: t('common.paste'),
      icon: <SnippetsOutlined />,
      onClick: onPaste,
      disabled: !canPaste,
    },
    {
      type: 'divider',
    },
    {
      key: 'moveUp',
      label: t('contextMenu.moveUp'),
      icon: <ArrowUpOutlined />,
      onClick: onMoveUp,
      disabled: !canMoveUp || isLocked,
    },
    {
      key: 'moveDown',
      label: t('contextMenu.moveDown'),
      icon: <ArrowDownOutlined />,
      onClick: onMoveDown,
      disabled: !canMoveDown || isLocked,
    },
    {
      key: 'moveToTop',
      label: t('contextMenu.moveToTop'),
      icon: <VerticalAlignTopOutlined />,
      onClick: onMoveToTop,
      disabled: !canMoveUp || isLocked,
    },
    {
      key: 'moveToBottom',
      label: t('contextMenu.moveToBottom'),
      icon: <VerticalAlignBottomOutlined />,
      onClick: onMoveToBottom,
      disabled: !canMoveDown || isLocked,
    },
    {
      type: 'divider',
    },
    {
      key: 'delete',
      label: t('common.delete'),
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
