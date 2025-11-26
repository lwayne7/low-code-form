import React from 'react';
import { Card } from 'antd';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from '../SortableItem';
import { CanvasFormItem } from '../CanvasFormItem';
import type { ComponentSchema } from '../types';

interface SortableListProps {
  items: ComponentSchema[];
  selectedIds: string[];
  onSelect: (id: string, multi: boolean) => void;
  activeDragId?: string | null;
  overIndex?: number;
  parentId?: string;
  depth?: number;
}

// 根据嵌套深度计算背景色
const getContainerBgColor = (d: number) => {
  const colors = ['#f9f9f9', '#f0f5ff', '#fff7e6', '#f6ffed', '#fff1f0'];
  return colors[d % colors.length];
};

// 根据嵌套深度计算左边框颜色
const getContainerBorderColor = (d: number) => {
  const colors = ['#1677ff', '#722ed1', '#fa8c16', '#52c41a', '#f5222d'];
  return colors[d % colors.length];
};

export const SortableList: React.FC<SortableListProps> = ({
  items,
  selectedIds,
  onSelect,
  activeDragId,
  overIndex,
  parentId,
  depth = 0,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: parentId ? `container-${parentId}` : 'canvas-droppable',
    data: { parentId, depth },
  });

  return (
    <SortableContext items={items.map((c) => c.id)} strategy={verticalListSortingStrategy}>
      <div
        ref={setNodeRef}
        style={{
          minHeight: 10,
          padding: 4,
          background: isOver ? 'rgba(22, 119, 255, 0.05)' : undefined,
          border: isOver ? '2px dashed #1677ff' : '2px dashed transparent',
          borderRadius: 4,
          transition: 'all 0.2s',
        }}
      >
        {items.map((component, index) => {
          // 计算是否显示插入指示线
          let showDropIndicator: 'top' | 'bottom' | null = null;
          if (activeDragId && activeDragId.startsWith('new-') && typeof overIndex === 'number') {
            if (index === overIndex) {
              showDropIndicator = 'top';
            }
          }

          const isContainer = component.type === 'Container';

          return (
            <SortableItem
              key={component.id}
              id={component.id}
              isSelected={selectedIds.includes(component.id)}
              showDropIndicator={showDropIndicator}
              onClick={(e: React.MouseEvent) => onSelect(component.id, e.metaKey || e.ctrlKey)}
              useHandle={isContainer}
            >
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
                      </span>
                    }
                    style={{
                      background: getContainerBgColor(depth),
                      border: '1px dashed #d9d9d9',
                      borderLeft: `3px solid ${getContainerBorderColor(depth)}`,
                    }}
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
                      />
                      {(component.children || []).length === 0 && (
                        <div style={{ textAlign: 'center', color: '#999', padding: 16, fontSize: 13 }}>
                          📦 拖拽组件到这里
                        </div>
                      )}
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
        })}
      </div>
    </SortableContext>
  );
};
