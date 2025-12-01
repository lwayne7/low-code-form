import React, { useMemo, useCallback } from 'react';
import { Card } from 'antd';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from './SortableItem';
import { CanvasFormItem } from '../CanvasFormItem';
import type { ComponentSchema } from '../../types';

// 🆕 放置目标类型
export interface DropTarget {
  targetId: string;
  position: 'before' | 'after' | 'inside';
  parentId?: string;
}

interface SortableListProps {
  items: ComponentSchema[];
  selectedIds: string[];
  onSelect: (id: string, multi: boolean) => void;
  activeDragId?: string | null;
  overIndex?: number;
  parentId?: string;
  depth?: number;
  dropTarget?: DropTarget | null;
}

// 根据嵌套深度计算背景色
const getContainerBgColor = (d: number, isOver: boolean) => {
  const colors = ['#fafafa', '#f0f5ff', '#fff7e6', '#f6ffed', '#fff1f0'];
  const hoverColors = ['#e6f4ff', '#d6e4ff', '#ffe7ba', '#d9f7be', '#ffccc7'];
  return isOver ? hoverColors[d % hoverColors.length] : colors[d % colors.length];
};

// 根据嵌套深度计算左边框颜色
const getContainerBorderColor = (d: number) => {
  const colors = ['#1677ff', '#722ed1', '#fa8c16', '#52c41a', '#f5222d'];
  return colors[d % colors.length];
};

// 🆕 放置指示器组件
const DropIndicator: React.FC<{ position: 'before' | 'after' }> = ({ position }) => (
  <div
    style={{
      position: 'absolute',
      left: 0,
      right: 0,
      [position === 'before' ? 'top' : 'bottom']: -2,
      height: 3,
      background: 'linear-gradient(90deg, #1677ff 0%, #69b1ff 50%, #1677ff 100%)',
      borderRadius: 2,
      zIndex: 100,
      boxShadow: '0 0 8px rgba(22, 119, 255, 0.5)',
      animation: 'dropIndicatorPulse 1s ease-in-out infinite',
    }}
  >
    {/* 左侧圆点 */}
    <div
      style={{
        position: 'absolute',
        left: -4,
        top: -3,
        width: 9,
        height: 9,
        borderRadius: '50%',
        background: '#1677ff',
        border: '2px solid #fff',
        boxShadow: '0 0 4px rgba(22, 119, 255, 0.5)',
      }}
    />
    {/* 右侧圆点 */}
    <div
      style={{
        position: 'absolute',
        right: -4,
        top: -3,
        width: 9,
        height: 9,
        borderRadius: '50%',
        background: '#1677ff',
        border: '2px solid #fff',
        boxShadow: '0 0 4px rgba(22, 119, 255, 0.5)',
      }}
    />
  </div>
);

// 🆕 使用 React.memo 包裹整个组件
export const SortableList: React.FC<SortableListProps> = React.memo(({
  items,
  selectedIds,
  onSelect,
  activeDragId,
  parentId,
  depth = 0,
  dropTarget,
}) => {
  const droppableId = parentId ? `container-${parentId}` : 'canvas-droppable';
  
  const { setNodeRef, isOver, active } = useDroppable({
    id: droppableId,
    data: { parentId, depth },
  });

  // 🆕 使用 useMemo 缓存 items 的 id 数组
  const itemIds = useMemo(() => items.map((c) => c.id), [items]);

  // 🆕 判断当前是否有拖拽操作且可接受放置
  const isDropTarget = isOver && active && String(active.id) !== parentId;

  // 🆕 使用 useMemo 缓存容器样式 - 增强视觉反馈
  const containerStyle = useMemo(() => ({
    minHeight: parentId ? 60 : 10,
    padding: parentId ? 8 : 4,
    background: isDropTarget ? 'rgba(22, 119, 255, 0.08)' : undefined,
    border: isDropTarget ? '2px dashed #1677ff' : '2px dashed transparent',
    borderRadius: 6,
    transition: 'all 0.2s ease',
    boxShadow: isDropTarget ? 'inset 0 0 8px rgba(22, 119, 255, 0.1)' : undefined,
  }), [isDropTarget, parentId]);

  return (
    <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
      <div ref={setNodeRef} style={containerStyle}>
        {items.map((component, index) => (
          <SortableListItem
            key={component.id}
            component={component}
            selectedIds={selectedIds}
            onSelect={onSelect}
            activeDragId={activeDragId}
            depth={depth}
            dropTarget={dropTarget}
            isFirst={index === 0}
            isLast={index === items.length - 1}
          />
        ))}
        
        {/* 🆕 空容器的放置提示 */}
        {parentId && items.length === 0 && (
          <div 
            style={{ 
              textAlign: 'center', 
              color: isDropTarget ? '#1677ff' : '#999', 
              padding: '20px 16px', 
              fontSize: 13,
              border: isDropTarget ? '1px dashed #1677ff' : '1px dashed #d9d9d9',
              borderRadius: 4,
              background: isDropTarget ? 'rgba(22, 119, 255, 0.04)' : '#fafafa',
              transition: 'all 0.2s ease',
            }}
          >
            {isDropTarget ? '📥 松开鼠标放入此处' : '📦 拖拽组件到这里'}
          </div>
        )}
      </div>
    </SortableContext>
  );
}, (prevProps, nextProps) => {
  // 🆕 自定义比较函数
  return (
    prevProps.items === nextProps.items &&
    prevProps.selectedIds === nextProps.selectedIds &&
    prevProps.activeDragId === nextProps.activeDragId &&
    prevProps.overIndex === nextProps.overIndex &&
    prevProps.parentId === nextProps.parentId &&
    prevProps.depth === nextProps.depth &&
    prevProps.dropTarget === nextProps.dropTarget
  );
});

// 🆕 提取单个列表项为独立组件，便于 memo 优化
interface SortableListItemProps {
  component: ComponentSchema;
  selectedIds: string[];
  onSelect: (id: string, multi: boolean) => void;
  activeDragId?: string | null;
  depth: number;
  dropTarget?: DropTarget | null;
  isFirst: boolean;  // 🆕 是否是列表第一项
  isLast: boolean;   // 🆕 是否是列表最后一项
}

const SortableListItem: React.FC<SortableListItemProps> = React.memo(({
  component,
  selectedIds,
  onSelect,
  activeDragId,
  depth,
  dropTarget,
  isFirst,
  isLast,
}) => {
  const isSelected = selectedIds.includes(component.id);
  const isContainer = component.type === 'Container';
  const isDragging = activeDragId === component.id;

  // 🆕 计算是否显示放置指示器
  const showDropIndicator = useMemo(() => {
    if (!dropTarget || !activeDragId) return null;
    
    // 如果目标是当前组件
    if (dropTarget.targetId === component.id) {
      if (dropTarget.position === 'before') return 'before';
      if (dropTarget.position === 'after') return 'after';
    }
    
    return null;
  }, [dropTarget, activeDragId, component.id]);

  // 🆕 使用 useCallback 缓存点击处理函数
  const handleClick = useCallback((e: React.MouseEvent) => {
    onSelect(component.id, e.metaKey || e.ctrlKey);
  }, [component.id, onSelect]);

  // 🆕 容器内部使用 useDroppable 检测是否有拖拽悬停
  const { isOver: isContainerOver } = useDroppable({
    id: `container-${component.id}`,
    disabled: !isContainer,
    data: { parentId: component.id, depth: depth + 1 },
  });

  // 🆕 判断当前容器是否是放置目标
  const isContainerDropTarget = dropTarget?.targetId === component.id && dropTarget?.position === 'inside';

  // 🆕 使用 useMemo 缓存容器样式 - 增强视觉反馈
  const cardStyle = useMemo(() => ({
    background: getContainerBgColor(depth, (isContainerOver || isContainerDropTarget) && !isDragging),
    border: (isContainerOver || isContainerDropTarget) && !isDragging ? '2px dashed #1677ff' : '1px dashed #d9d9d9',
    borderLeft: `3px solid ${getContainerBorderColor(depth)}`,
    transition: 'all 0.2s ease',
    opacity: isDragging ? 0.5 : 1,
  }), [depth, isContainerOver, isContainerDropTarget, isDragging]);

  return (
    <SortableItem
      id={component.id}
      isSelected={isSelected}
      onClick={handleClick}
      useHandle={isContainer}
      isFirst={isFirst}
      isLast={isLast}
    >
      {/* 🆕 放置位置指示器 */}
      {showDropIndicator === 'before' && <DropIndicator position="before" />}
      {showDropIndicator === 'after' && <DropIndicator position="after" />}
      
      <div style={{ pointerEvents: 'none' }}>
        {isContainer ? (
          <Card
            size="small"
            title={
              <span style={{ cursor: 'grab' }}>
                ⠿ {component.props.label || '容器'}
                <span style={{ marginLeft: 8, fontSize: 11, color: '#999' }}>
                  (层级 {depth + 1})
                </span>
                {(isContainerOver || isContainerDropTarget) && !isDragging && (
                  <span style={{ marginLeft: 8, fontSize: 11, color: '#1677ff' }}>
                    📥 可放入
                  </span>
                )}
              </span>
            }
            style={cardStyle}
            styles={{ body: { padding: 8, minHeight: 60 } }}
          >
            <div style={{ pointerEvents: 'auto' }}>
              <SortableList
                items={component.children || []}
                selectedIds={selectedIds}
                onSelect={onSelect}
                activeDragId={activeDragId}
                parentId={component.id}
                depth={depth + 1}
                dropTarget={dropTarget}
              />
            </div>
          </Card>
        ) : (
          <div style={{ pointerEvents: 'auto' }}>
            <CanvasFormItem component={component} />
          </div>
        )}
      </div>
    </SortableItem>
  );
}, (prevProps, nextProps) => {
  // 🆕 精确比较，避免不必要的重渲染
  const prevIsTarget = prevProps.dropTarget?.targetId === prevProps.component.id;
  const nextIsTarget = nextProps.dropTarget?.targetId === nextProps.component.id;
  
  return (
    prevProps.component === nextProps.component &&
    prevProps.selectedIds.includes(prevProps.component.id) === nextProps.selectedIds.includes(nextProps.component.id) &&
    prevProps.activeDragId === nextProps.activeDragId &&
    prevProps.depth === nextProps.depth &&
    prevProps.isFirst === nextProps.isFirst &&
    prevProps.isLast === nextProps.isLast &&
    prevIsTarget === nextIsTarget &&
    (prevIsTarget ? prevProps.dropTarget?.position === nextProps.dropTarget?.position : true)
  );
});
