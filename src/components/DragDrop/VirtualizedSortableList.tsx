import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import { List, type ListImperativeAPI, type RowComponentProps } from 'react-window';
import { Card } from 'antd';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { SortableItem } from './SortableItem';
import { CanvasFormItem } from '../CanvasFormItem';
import { useTheme } from '../../hooks/useTheme';
import { useI18n } from '@/i18n';
import type { ComponentSchema } from '../../types';
import type { DropTarget } from './SortableList';

/**
 * 虚拟滚动版本的 SortableList
 * 用于优化大数据量场景（1000+ 组件）
 * 
 * 特性：
 * - 只渲染可见区域的组件
 * - 支持拖拽排序
 * - 支持嵌套容器
 * - 性能优化：使用 React.memo 和虚拟滚动
 */

interface VirtualizedSortableListProps {
  items: ComponentSchema[];
  selectedIds: string[];
  onSelect: (id: string, multi: boolean) => void;
  activeDragId?: string | null;
  parentId?: string;
  depth?: number;
  dropTarget?: DropTarget | null;
  height?: number; // 列表高度
  itemHeight?: number; // 每个项目的高度
  enableVirtualization?: boolean; // 是否启用虚拟滚动（默认超过50个组件时启用）
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
  if (isDark) {
    const colors = ['#4096ff', '#9254de', '#ffc53d', '#73d13d', '#ff7875'];
    return colors[d % colors.length];
  }
  const colors = ['#1677ff', '#722ed1', '#fa8c16', '#52c41a', '#f5222d'];
  return colors[d % colors.length];
};

interface VirtualRowData {
  items: ComponentSchema[];
  selectedIds: string[];
  onSelect: (id: string, multi: boolean) => void;
  activeDragId?: string | null;
  parentId: string | null;
  depth: number;
  dropTarget?: DropTarget | null;
}

// 虚拟化列表项渲染组件
const VirtualRow = ({
  ariaAttributes,
  index,
  style,
  items,
  selectedIds,
  onSelect,
  activeDragId,
  parentId,
  depth,
  dropTarget,
}: RowComponentProps<VirtualRowData>): React.ReactElement | null => {
  const { isDark } = useTheme();
  const { t } = useI18n();
  const component = items[index];
  const componentId = component?.id ?? '';
  const isSelected = component ? selectedIds.includes(componentId) : false;
  const isContainer = component?.type === 'Container';
  const shouldUseHandle = isContainer && (component?.children?.length ?? 0) > 0;
  const isDragging = activeDragId === componentId;
  const isLocked = component?.props.locked === true;

  // 计算是否显示放置指示器
  const showDropIndicator = useMemo(() => {
    if (!componentId) return null;
    if (!dropTarget || !activeDragId) return null;
    
    if (dropTarget.targetId === componentId) {
      if (dropTarget.position === 'before') return 'before';
      if (dropTarget.position === 'after') return 'after';
    }
    
    return null;
  }, [dropTarget, activeDragId, componentId]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!componentId) return;
    onSelect(componentId, e.metaKey || e.ctrlKey);
  }, [componentId, onSelect]);

  const isContainerDropTarget = isContainer && dropTarget?.targetId === componentId && dropTarget?.position === 'inside';
  const isNestTarget = !!(isContainerDropTarget && activeDragId && activeDragId !== componentId);

  const cardStyle = useMemo(() => ({
    background: getContainerBgColor(depth, isContainerDropTarget && !isDragging, isDark),
    border: isContainerDropTarget && !isDragging 
      ? `2px dashed ${isDark ? '#4096ff' : '#1677ff'}` 
      : `1px dashed ${isDark ? '#404040' : '#d9d9d9'}`,
    borderLeft: `3px solid ${getContainerBorderColor(depth, isDark)}`,
    transition: 'all 0.2s ease',
    opacity: isDragging ? 0.5 : 1,
  }), [depth, isContainerDropTarget, isDragging, isDark]);

  if (!component) return null;

  return (
    <div style={style} {...ariaAttributes}>
      <SortableItem
        id={component.id}
        componentType={component.type}
        isSelected={isSelected}
        onClick={handleClick}
        useHandle={shouldUseHandle}
        isFirst={index === 0}
        isLast={index === items.length - 1}
        isLocked={isLocked}
        depth={depth}
        isNestTarget={isNestTarget}
        parentId={parentId}
      >
        {showDropIndicator === 'before' && <DropIndicator position="before" />}
        {showDropIndicator === 'after' && <DropIndicator position="after" />}
        
        {isContainer ? (
          <div style={{ pointerEvents: 'none', position: 'relative' }}>
            {isContainerDropTarget && !isDragging && (
              <ContainerDropOverlay label={component.props.label} />
            )}
            <Card
              size="small"
              title={
                <span style={{ cursor: isLocked ? 'not-allowed' : 'grab', color: isDark ? '#e6e6e6' : undefined }}>
                  {isLocked ? '🔒' : '⠿'} {component.props.label || t('dnd.container')}
                  <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text-color-tertiary, #999)' }}>
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
              <div style={{ pointerEvents: 'auto' }}>
                {/* 嵌套容器递归渲染 */}
                <VirtualizedSortableList
                  items={component.children || []}
                  selectedIds={selectedIds}
                  onSelect={onSelect}
                  activeDragId={activeDragId}
                  parentId={component.id}
                  depth={depth + 1}
                  dropTarget={dropTarget}
                  height={300}
                  itemHeight={80}
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
    </div>
  );
};

// 放置指示器组件
const DropIndicator: React.FC<{ position: 'before' | 'after' }> = ({ position }) => {
  const { t } = useI18n();

  return (
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
        {position === 'before' ? t('dnd.insertBefore') : t('dnd.insertAfter')}
      </div>
    </div>
  );
};

// 容器嵌套指示器组件
const ContainerDropOverlay: React.FC<{ label?: string }> = ({ label }) => {
  const { t } = useI18n();
  const displayLabel = label || t('dnd.container');

  return (
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
        {t('dnd.dropInto', { label: displayLabel })}
      </div>
    </div>
  );
};

export const VirtualizedSortableList: React.FC<VirtualizedSortableListProps> = React.memo(({
  items,
  selectedIds,
  onSelect,
  activeDragId,
  parentId,
  depth = 0,
  dropTarget,
  height = 600,
  itemHeight = 80,
  enableVirtualization,
}) => {
  const { isDark } = useTheme();
  const { t } = useI18n();
  const droppableId = parentId ? `container-${parentId}` : 'canvas-droppable';
  const listRef = useRef<ListImperativeAPI | null>(null);
  
  const { setNodeRef, isOver, active } = useDroppable({
    id: droppableId,
    data: { parentId, depth },
  });

  const itemIds = useMemo(() => items.map((c) => c.id), [items]);
  const isDropTarget = isOver && active && String(active.id) !== parentId;

  // 自动判断是否需要启用虚拟化（超过50个组件）
  const shouldVirtualize = enableVirtualization !== undefined 
    ? enableVirtualization 
    : items.length > 50;

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

  // 行渲染共享数据（List 会在 rowProps 变化时触发更新）
  const rowProps = useMemo<VirtualRowData>(() => ({
    items,
    selectedIds,
    onSelect,
    activeDragId,
    parentId: parentId ?? null,
    depth,
    dropTarget,
  }), [items, selectedIds, onSelect, activeDragId, parentId, depth, dropTarget]);

  // 滚动到选中的组件
  useEffect(() => {
    if (listRef.current && selectedIds.length > 0) {
      const selectedIndex = items.findIndex(item => item.id === selectedIds[0]);
      if (selectedIndex !== -1) {
        listRef.current.scrollToRow({ index: selectedIndex, align: 'smart' });
      }
    }
  }, [selectedIds, items]);

  return (
    <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
      <div ref={setNodeRef} style={containerStyle}>
        {items.length === 0 ? (
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
        ) : shouldVirtualize ? (
          <div>
            <div style={{ 
              fontSize: 12, 
              color: isDark ? '#737373' : '#999', 
              marginBottom: 8,
              padding: '4px 8px',
              background: isDark ? '#262626' : '#fafafa',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}>
              {t('dnd.virtualScrollEnabled', { count: items.length })}
            </div>
            <List<VirtualRowData>
              listRef={listRef}
              rowCount={items.length}
              rowHeight={itemHeight}
              rowComponent={VirtualRow}
              rowProps={rowProps}
              overscanCount={5} // 预渲染5个组件，提升滚动体验
              style={{ height, width: '100%' }}
            />
          </div>
        ) : (
          // 非虚拟化渲染（组件数量较少时）
          items.map((component, index) => (
            <VirtualRow
              key={component.id}
              ariaAttributes={{
                role: 'listitem',
                'aria-posinset': index + 1,
                'aria-setsize': items.length,
              }}
              index={index}
              style={{ height: itemHeight, width: '100%' }}
              {...rowProps}
            />
          ))
        )}
      </div>
    </SortableContext>
  );
}, (prevProps, nextProps) => {
  // 自定义比较函数
  if (
    prevProps.items !== nextProps.items ||
    prevProps.selectedIds !== nextProps.selectedIds ||
    prevProps.activeDragId !== nextProps.activeDragId ||
    prevProps.parentId !== nextProps.parentId ||
    prevProps.depth !== nextProps.depth ||
    prevProps.height !== nextProps.height ||
    prevProps.itemHeight !== nextProps.itemHeight ||
    prevProps.enableVirtualization !== nextProps.enableVirtualization
  ) {
    return false;
  }
  
  // dropTarget 深比较
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
