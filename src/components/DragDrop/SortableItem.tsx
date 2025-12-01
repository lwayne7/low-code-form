import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ContextMenu } from '../common/ContextMenu';
import { useStore } from '../../store';

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  isSelected: boolean;
  isOverlay?: boolean;
  showDropIndicator?: 'top' | 'bottom' | null;
  useHandle?: boolean; // 是否使用拖拽手柄模式
  isFirst?: boolean;  // 是否是列表第一项
  isLast?: boolean;   // 是否是列表最后一项
  isLocked?: boolean; // 🆕 是否锁定
}

// ⚠️ 性能优化：使用 React.memo 包裹
export const SortableItem = React.memo(function SortableItem(props: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.id, disabled: props.isLocked });

  // 从 store 获取右键菜单需要的方法
  const { 
    copyComponents, 
    cutComponents, 
    pasteComponents, 
    deleteComponent, 
    moveComponentInList,
    toggleLock,
    clipboard,
    selectComponent 
  } = useStore();

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative', 
  };

  const className = `sortable-item ${props.isSelected ? 'selected' : ''}`;

  // 如果使用手柄模式，只在手柄区域应用 listeners
  const itemProps = props.useHandle 
    ? { ...attributes }
    : { ...attributes, ...listeners };

  // 右键菜单处理函数
  const handleCopy = () => {
    selectComponent(props.id);
    setTimeout(() => copyComponents(), 0);
  };

  const handleCut = () => {
    selectComponent(props.id);
    setTimeout(() => cutComponents(), 0);
  };

  const handlePaste = () => {
    pasteComponents();
  };

  const handleDelete = () => {
    selectComponent(props.id);
    setTimeout(() => deleteComponent(props.id), 0);
  };

  const handleMoveUp = () => {
    moveComponentInList(props.id, 'up');
  };

  const handleMoveDown = () => {
    moveComponentInList(props.id, 'down');
  };

  const handleMoveToTop = () => {
    moveComponentInList(props.id, 'top');
  };

  const handleMoveToBottom = () => {
    moveComponentInList(props.id, 'bottom');
  };

  const handleToggleLock = () => {
    toggleLock(props.id);
  };

  const content = (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...itemProps}
      onClick={props.onClick}
      className={className}
      data-component-id={props.id}
    >
      {/* 拖拽手柄（仅在 useHandle 模式下显示）- 覆盖容器标题栏区域 */}
      {props.useHandle && (
        <div 
          className="drag-handle"
          {...listeners}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 40, // 增加高度以覆盖整个 Card 标题栏
            cursor: 'grab',
            zIndex: 10,
            // 添加透明背景以便点击事件能穿透
            background: 'transparent',
          }}
        />
      )}
      
      {/* 插入指示线 */}
      {props.showDropIndicator === 'top' && (
        <div style={{
          position: 'absolute',
          top: -2,
          left: 0,
          right: 0,
          height: 2,
          background: '#1677ff',
          zIndex: 10,
          boxShadow: '0 0 4px rgba(22, 119, 255, 0.5)'
        }} />
      )}
      {props.showDropIndicator === 'bottom' && (
        <div style={{
          position: 'absolute',
          bottom: -2,
          left: 0,
          right: 0,
          height: 2,
          background: '#1677ff',
          zIndex: 10,
          boxShadow: '0 0 4px rgba(22, 119, 255, 0.5)'
        }} />
      )}
      
      {props.children}
    </div>
  );

  return (
    <ContextMenu
      onCopy={handleCopy}
      onCut={handleCut}
      onPaste={handlePaste}
      onDelete={handleDelete}
      onMoveUp={handleMoveUp}
      onMoveDown={handleMoveDown}
      onMoveToTop={handleMoveToTop}
      onMoveToBottom={handleMoveToBottom}
      onToggleLock={handleToggleLock}
      canPaste={clipboard.length > 0}
      canMoveUp={!props.isFirst}
      canMoveDown={!props.isLast}
      isLocked={props.isLocked}
    >
      {content}
    </ContextMenu>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.id === nextProps.id &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.showDropIndicator === nextProps.showDropIndicator &&
    prevProps.useHandle === nextProps.useHandle &&
    prevProps.isFirst === nextProps.isFirst &&
    prevProps.isLast === nextProps.isLast &&
    prevProps.isLocked === nextProps.isLocked &&
    prevProps.children === nextProps.children
  );
});
