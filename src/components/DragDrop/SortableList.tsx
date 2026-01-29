import React, { useMemo, useCallback } from 'react';
import { Card } from 'antd';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from './SortableItem';
import { CanvasFormItem } from '../CanvasFormItem';
import { useTheme } from '../../hooks/useTheme';
import { useI18n } from '@/i18n';
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

// 根据嵌套深度和主题计算背景色
const getContainerBgColor = (d: number, isOver: boolean, isDark = false) => {
  if (isDark) {
    const colors = ['#1a1a1a', '#1a1a2e', '#1a1f1a', '#1f1a1a', '#1a1a1f'];
    const hoverColors = ['#0d2847', '#1a1a3d', '#1a2a1a', '#2a1a1a', '#1a1a2a'];
    return isOver ? hoverColors[d % hoverColors.length] : colors[d % colors.length];
  }
  const colors = ['#fafafa', '#f0f5ff', '#fff7e6', '#f6ffed', '#fff1f0'];
  const hoverColors = ['#e6f4ff', '#d6e4ff', '#ffe7ba', '#d9f7be', '#ffccc7'];
  return isOver ? hoverColors[d % hoverColors.length] : colors[d % colors.length];
};

// 根据嵌套深度计算左边框颜色
const getContainerBorderColor = (d: number, isDark = false) => {
  // 深色模式下使用更亮的颜色
  if (isDark) {
    const colors = ['#4096ff', '#9254de', '#ffc53d', '#73d13d', '#ff7875'];
    return colors[d % colors.length];
  }
  const colors = ['#1677ff', '#722ed1', '#fa8c16', '#52c41a', '#f5222d'];
  return colors[d % colors.length];
};

// 🆕 放置指示器组件 - 增强视觉效果
const DropIndicator: React.FC<{ position: 'before' | 'after' }> = ({ position }) => (
  <div
    className="drop-indicator-line"
    style={{
      position: 'absolute',
      left: -8,
      right: -8,
      [position === 'before' ? 'top' : 'bottom']: -6,
      height: 4,
      background: 'linear-gradient(90deg, #1677ff 0%, #69b1ff 50%, #1677ff 100%)',
      borderRadius: 2,
      zIndex: 1000,
      boxShadow: '0 0 12px rgba(22, 119, 255, 0.6), 0 0 4px rgba(22, 119, 255, 0.8)',
      animation: 'dropIndicatorPulse 0.8s ease-in-out infinite',
    }}
  >
    {/* 左侧圆点 - 更大更明显 */}
    <div
      style={{
        position: 'absolute',
        left: -6,
        top: -5,
        width: 14,
        height: 14,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #1677ff 0%, #4096ff 100%)',
        border: '3px solid #fff',
        boxShadow: '0 2px 8px rgba(22, 119, 255, 0.5)',
      }}
    />
    {/* 右侧圆点 */}
    <div
      style={{
        position: 'absolute',
        right: -6,
        top: -5,
        width: 14,
        height: 14,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #1677ff 0%, #4096ff 100%)',
        border: '3px solid #fff',
        boxShadow: '0 2px 8px rgba(22, 119, 255, 0.5)',
      }}
    />
    {/* 中间文字提示 */}
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: -24,
        transform: 'translateX(-50%)',
        background: '#1677ff',
        color: '#fff',
        fontSize: 11,
        fontWeight: 600,
        padding: '2px 8px',
        borderRadius: 4,
        whiteSpace: 'nowrap',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      }}
    >
      {position === 'before' ? '↑' : '↓'}
    </div>
  </div>
);

// 🆕 容器嵌套指示器组件
const ContainerDropOverlay: React.FC<{ label?: string; dropText?: string }> = ({ label, dropText }) => (
  <div
    className="container-drop-overlay"
    style={{
      position: 'absolute',
      inset: 0,
      background: 'rgba(22, 119, 255, 0.08)',
      border: '3px dashed #1677ff',
      borderRadius: 8,
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      pointerEvents: 'none',
      animation: 'containerDropPulse 1s ease-in-out infinite',
    }}
  >
    <div
      style={{
        background: 'linear-gradient(135deg, #1677ff 0%, #4096ff 100%)',
        color: '#fff',
        fontSize: 13,
        fontWeight: 600,
        padding: '8px 16px',
        borderRadius: 6,
        boxShadow: '0 4px 12px rgba(22, 119, 255, 0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}
    >
      <span style={{ fontSize: 16 }}>📥</span>
      {dropText || `Drop into "${label || 'Container'}"`}
    </div>
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
  const { isDark } = useTheme(); // 🆕 获取当前主题
  const { t } = useI18n();
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
    border: isDropTarget 
      ? `2px dashed ${isDark ? '#4096ff' : '#1677ff'}` 
      : '2px dashed transparent',
    borderRadius: 6,
    transition: 'all 0.2s ease',
    boxShadow: isDropTarget ? 'inset 0 0 8px rgba(22, 119, 255, 0.1)' : undefined,
  }), [isDropTarget, parentId, isDark]);

  return (
    <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
      <div ref={setNodeRef} style={containerStyle}>
        {items.map((component, index) => (
          <SortableListItem
            key={component.id}
            component={component}
            parentId={parentId ?? null}
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
              color: isDropTarget 
                ? (isDark ? '#4096ff' : '#1677ff') 
                : (isDark ? '#737373' : '#999'), 
              padding: '20px 16px', 
              fontSize: 13,
              border: isDropTarget 
                ? `1px dashed ${isDark ? '#4096ff' : '#1677ff'}` 
                : `1px dashed ${isDark ? '#404040' : '#d9d9d9'}`,
              borderRadius: 4,
              background: isDropTarget 
                ? 'rgba(22, 119, 255, 0.08)' 
                : (isDark ? '#262626' : '#fafafa'),
              transition: 'all 0.2s ease',
            }}
          >
            {isDropTarget ? t('dnd.releaseHere') : t('dnd.dragHere')}
          </div>
        )}
      </div>
    </SortableContext>
  );
}, (prevProps, nextProps) => {
  // 自定义比较函数，优化渲染性能
  // 基础比较
  if (
    prevProps.items !== nextProps.items ||
    prevProps.selectedIds !== nextProps.selectedIds ||
    prevProps.activeDragId !== nextProps.activeDragId ||
    prevProps.overIndex !== nextProps.overIndex ||
    prevProps.parentId !== nextProps.parentId ||
    prevProps.depth !== nextProps.depth
  ) {
    return false;
  }
  
  // dropTarget 深比较（避免不必要的引用变化触发重渲染）
  const prevDrop = prevProps.dropTarget;
  const nextDrop = nextProps.dropTarget;
  if (prevDrop === nextDrop) return true;
  if (!prevDrop || !nextDrop) return false;
  
  return (
    prevDrop.targetId === nextDrop.targetId &&
    prevDrop.position === nextDrop.position &&
    prevDrop.parentId === nextDrop.parentId
  );
});

// 🆕 提取单个列表项为独立组件，便于 memo 优化
interface SortableListItemProps {
  component: ComponentSchema;
  parentId: string | null;
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
  parentId,
  selectedIds,
  onSelect,
  activeDragId,
  depth,
  dropTarget,
  isFirst,
  isLast,
}) => {
  const { isDark } = useTheme(); // 🆕 获取当前主题
  const { t } = useI18n(); // 🆕 获取国际化翻译函数
  const isSelected = selectedIds.includes(component.id);
  const isContainer = component.type === 'Container';
  const isDragging = activeDragId === component.id;
  const isLocked = component.props.locked === true; // 🆕 是否锁定

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

  // 🆕 判断当前容器是否是放置目标（通过 dropTarget 状态判断）
  const isContainerDropTarget = isContainer && dropTarget?.targetId === component.id && dropTarget?.position === 'inside';

  // 🆕 判断是否是嵌套目标 - 用于禁用目标容器的位移动画
  const isNestTarget = !!(isContainerDropTarget && activeDragId && activeDragId !== component.id);

  // 🆕 使用 useMemo 缓存容器样式 - 增强视觉反馈
  const cardStyle = useMemo(() => ({
    background: getContainerBgColor(depth, isContainerDropTarget && !isDragging, isDark),
    border: isContainerDropTarget && !isDragging 
      ? `2px dashed ${isDark ? '#4096ff' : '#1677ff'}` 
      : `1px dashed ${isDark ? '#404040' : '#d9d9d9'}`,
    borderLeft: `3px solid ${getContainerBorderColor(depth, isDark)}`,
    transition: 'all 0.2s ease',
    opacity: isDragging ? 0.5 : 1,
  }), [depth, isContainerDropTarget, isDragging, isDark]);

  return (
    <SortableItem
      id={component.id}
      isSelected={isSelected}
      onClick={handleClick}
      useHandle={isContainer && (component.children?.length ?? 0) > 0}
      isFirst={isFirst}
      isLast={isLast}
      isLocked={isLocked}
      depth={depth}
      isNestTarget={isNestTarget}
      parentId={parentId}
    >
      {/* 🆕 放置位置指示器 */}
      {showDropIndicator === 'before' && <DropIndicator position="before" />}
      {showDropIndicator === 'after' && <DropIndicator position="after" />}
      
      {isContainer ? (
        <div style={{ pointerEvents: 'none', position: 'relative' }}>
          {/* 🆕 容器嵌套放置指示器 - 更明显 */}
          {isContainerDropTarget && !isDragging && (
            <ContainerDropOverlay label={component.props.label} dropText={t('dnd.dropInto', { label: component.props.label || t('dnd.container') })} />
          )}
          <Card
            size="small"
            title={
              <span style={{ cursor: isLocked ? 'not-allowed' : 'grab', color: isDark ? '#e6e6e6' : undefined }}>
                {isLocked ? '🔒' : '⠿'} {component.props.label || t('dnd.container')}
                <span style={{ marginLeft: 8, fontSize: 11, color: isDark ? '#737373' : '#999' }}>
                  ({t('dnd.level', { level: depth + 1 })})
                </span>
              </span>
            }
            style={cardStyle}
            styles={{ 
              body: { padding: 8, minHeight: 60 },
              header: { background: 'transparent', borderBottom: `1px solid ${isDark ? '#303030' : '#f0f0f0'}` }
            }}
          >
            {/* 🔧 容器内部需要启用 pointerEvents 以支持嵌套拖拽 */}
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
        </div>
      ) : (
        <div style={{ pointerEvents: 'none' }}>
          <div style={{ pointerEvents: 'auto' }}>
            <CanvasFormItem component={component} />
          </div>
        </div>
      )}
    </SortableItem>
  );
}, (prevProps, nextProps) => {
  // 精确比较，避免不必要的重渲染
  const isContainer = prevProps.component.type === 'Container';
  
  // 基础比较
  if (
    prevProps.component !== nextProps.component ||
    prevProps.selectedIds.includes(prevProps.component.id) !== nextProps.selectedIds.includes(nextProps.component.id) ||
    prevProps.activeDragId !== nextProps.activeDragId ||
    prevProps.depth !== nextProps.depth ||
    prevProps.isFirst !== nextProps.isFirst ||
    prevProps.isLast !== nextProps.isLast
  ) {
    return false;
  }
  
  // dropTarget 深比较
  const prevDrop = prevProps.dropTarget;
  const nextDrop = nextProps.dropTarget;
  
  // 如果是容器，需要在 dropTarget 变化时重渲染（子组件可能需要更新）
  if (isContainer) {
    if (prevDrop === nextDrop) return true;
    if (!prevDrop || !nextDrop) return false;
    return (
      prevDrop.targetId === nextDrop.targetId &&
      prevDrop.position === nextDrop.position &&
      prevDrop.parentId === nextDrop.parentId
    );
  }
  
  // 非容器组件，只检查自己是否是目标
  const prevIsTarget = prevDrop?.targetId === prevProps.component.id;
  const nextIsTarget = nextDrop?.targetId === nextProps.component.id;
  
  if (prevIsTarget !== nextIsTarget) return false;
  if (prevIsTarget && prevDrop?.position !== nextDrop?.position) return false;
  
  return true;
});
