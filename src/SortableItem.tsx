import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  isSelected: boolean;
  isOverlay?: boolean;
  showDropIndicator?: 'top' | 'bottom' | null;
  useHandle?: boolean; // 是否使用拖拽手柄模式
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
  } = useSortable({ id: props.id });

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

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...itemProps}
      onClick={props.onClick}
      className={className}
      data-component-id={props.id}
    >
      {/* 拖拽手柄（仅在 useHandle 模式下显示） */}
      {props.useHandle && (
        <div 
          className="drag-handle"
          {...listeners}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 32,
            cursor: 'grab',
            zIndex: 5,
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
}, (prevProps, nextProps) => {
  return (
    prevProps.id === nextProps.id &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.showDropIndicator === nextProps.showDropIndicator &&
    prevProps.useHandle === nextProps.useHandle &&
    prevProps.children === nextProps.children
  );
});
