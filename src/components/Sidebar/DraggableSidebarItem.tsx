import React from 'react';
import { useDraggable } from '@dnd-kit/core';

interface DraggableSidebarItemProps {
  id: string;
  children: React.ReactNode;
  onClick: () => void;
}

export function DraggableSidebarItem({ id, children, onClick }: DraggableSidebarItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: id,
  });

  // 侧边栏物料区建议使用 DragOverlay 展示拖拽预览，
  // 避免把原始卡片本体 translate 出侧边栏导致“组件库跟着跑/位移”的观感。
  const style: React.CSSProperties = {
    opacity: isDragging ? 0.6 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
    userSelect: 'none',
    touchAction: 'none',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className="component-card" // 复用之前的样式
    >
      {children}
    </div>
  );
}
