import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
  onClick: () => void;
  isSelected: boolean;
}

export function SortableItem(props: SortableItemProps) {
  // useSortable 是核心 hook
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: props.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    // 增加一点样式优化
    padding: '10px',
    marginBottom: '10px',
    background: 'white',
    border: props.isSelected ? '2px solid #1890ff' : '1px dashed #ccc',
    cursor: 'move', // 鼠标变成移动图标
    position: 'relative' as const,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} onClick={props.onClick}>
      {props.children}
    </div>
  );
}