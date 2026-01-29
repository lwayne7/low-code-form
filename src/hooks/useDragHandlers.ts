/**
 * useDragHandlers - 拖拽处理逻辑 Hook
 * 
 * 从 App.tsx 中提取的拖拽相关状态和事件处理
 */

import { useState, useRef, useCallback } from 'react';
import { message } from 'antd';
import type { DragEndEvent, DragStartEvent, DragOverEvent } from '@dnd-kit/core';
import { useStore } from '../store';
import { findComponentById, findParentInfo, isDescendant } from '../utils/componentHelpers';
import type { ComponentType } from '../types';
import { CONTAINER_EDGE_RATIO, MAX_EDGE_HEIGHT, MIN_EDGE_HEIGHT } from '../constants/dnd';
import { startTrace } from '../utils/tracing';
import { useI18n } from '@/i18n';

// ============ 常量定义 ============
/** 滞后区比例（用于防止抖动） */
/** 非容器组件的滞后区比例 */
const ITEM_HYSTERESIS_RATIO = 0.15;

// ============ 类型定义 ============
export interface DropTarget {
    targetId: string;      // 目标组件或容器的 ID
    position: 'before' | 'after' | 'inside';  // 放置位置
    parentId?: string;     // 父容器 ID
}

export interface UseDragHandlersResult {
    // 状态
    activeDragId: string | null;
    activeDragType: ComponentType | null;
    overIndex: number | undefined;
    dropTarget: DropTarget | null;
    // 事件处理
    handleDragStart: (event: DragStartEvent) => void;
    handleDragOver: (event: DragOverEvent) => void;
    handleDragEnd: (event: DragEndEvent) => void;
}

// ============ 辅助函数 ============

/** 从拖拽事件中获取当前指针 Y 坐标 */
const getPointerY = (event: DragOverEvent): number => {
    const activatorEvent = event.activatorEvent as MouseEvent | undefined;
    const pointerY = activatorEvent?.clientY ?? 0;
    return pointerY + (event.delta?.y ?? 0);
};

// ============ Hook 实现 ============

export function useDragHandlers(): UseDragHandlersResult {
    const {
        components,
        addComponent,
        reorderComponents,
    } = useStore();
    const { t } = useI18n();

    // 拖拽状态
    const [activeDragId, setActiveDragId] = useState<string | null>(null);
    const [activeDragType, setActiveDragType] = useState<ComponentType | null>(null);
    const [overIndex, setOverIndex] = useState<number | undefined>(undefined);
    const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);

    // 🆕 上一次的拖拽目标，用于防抖
    const lastDropTargetRef = useRef<DropTarget | null>(null);
    // 🆕 防抖计时器
    const dropTargetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const stopDragTraceRef = useRef<ReturnType<typeof startTrace> | null>(null);

    // 拖拽开始
    const handleDragStart = useCallback((event: DragStartEvent) => {
        const id = String(event.active.id);
        setActiveDragId(id);
        stopDragTraceRef.current = startTrace('dnd.drag', {
            activeId: id,
            source: id.startsWith('new-') ? 'library' : 'canvas',
        });
        if (id.startsWith('new-')) {
            setActiveDragType(id.replace('new-', '') as ComponentType);
        }
    }, []);

    /**
     * 🔧 优化的拖拽悬停处理
     * 核心优化点：
     * 1. 延迟更新 - 使用 debounce 避免频繁状态变化
     * 2. 滞后区扩大 - 边界区域扩大，减少来回切换
     * 3. 位置稳定 - 相同目标相同位置不重复设置
     * 4. 空容器优先 - 空容器内部优先级最高
     * 5. 🆕 修饰键控制 - 按住 Shift 强制嵌套模式
     */
    const handleDragOver = useCallback((event: DragOverEvent) => {
        const { over, active } = event;

        // 🆕 获取修饰键状态
        const nativeEvent = (event.activatorEvent as MouseEvent | TouchEvent);
        const isShiftHeld = nativeEvent && 'shiftKey' in nativeEvent && nativeEvent.shiftKey;

        if (!over) {
            // 清理防抖计时器
            if (dropTargetTimerRef.current) {
                clearTimeout(dropTargetTimerRef.current);
                dropTargetTimerRef.current = null;
            }
            setOverIndex(undefined);
            setDropTarget(null);
            lastDropTargetRef.current = null;
            return;
        }

        const overId = String(over.id);
        const activeId = String(active.id);
        const findById = (id: string) => findComponentById(components, id);

        // 辅助函数：安全设置 dropTarget（带防抖）
        const safeSetDropTarget = (newTarget: DropTarget | null, immediate = false) => {
            // 如果目标完全相同，不更新
            if (
                lastDropTargetRef.current?.targetId === newTarget?.targetId &&
                lastDropTargetRef.current?.position === newTarget?.position
            ) {
                return;
            }

            // 清除之前的计时器
            if (dropTargetTimerRef.current) {
                clearTimeout(dropTargetTimerRef.current);
                dropTargetTimerRef.current = null;
            }

            if (immediate) {
                lastDropTargetRef.current = newTarget;
                setDropTarget(newTarget);
            } else {
                // 延迟 30ms 更新，减少抖动
                dropTargetTimerRef.current = setTimeout(() => {
                    lastDropTargetRef.current = newTarget;
                    setDropTarget(newTarget);
                }, 30);
            }
        };

        // === 1. 容器内部区域（container-xxx 格式）- 最高优先级 ===
        if (overId.startsWith('container-')) {
            const containerId = overId.replace('container-', '');

            // 防止拖入自身或形成循环
            if (containerId === activeId) {
                safeSetDropTarget(null, true);
                return;
            }

            if (!activeId.startsWith('new-') && isDescendant(components, activeId, containerId)) {
                safeSetDropTarget(null, true);
                return;
            }

            // 容器内部 - 立即响应，优先级高
            safeSetDropTarget({ targetId: containerId, position: 'inside' }, true);
            return;
        }

        // === 2. 顶层画布区域 ===
        if (overId === 'canvas-droppable') {
            safeSetDropTarget({ targetId: 'canvas', position: 'inside' });
            return;
        }

        // === 3. 放置在某个组件上 ===
        const targetComponent = findById(overId);
        if (!targetComponent) return;

        const overRect = over.rect;
        const currentY = getPointerY(event);

        // 🔧 动态计算边缘高度：取比例/最小值，并对大容器做上限
        const edgeHeight = Math.min(
            Math.max(overRect.height * CONTAINER_EDGE_RATIO, MIN_EDGE_HEIGHT),
            MAX_EDGE_HEIGHT,
            overRect.height / 2
        );

        if (targetComponent.type === 'Container' && activeId !== overId) {
            // === 容器组件 ===
            // 防止拖入自身后代
            if (!activeId.startsWith('new-') && isDescendant(components, activeId, overId)) {
                safeSetDropTarget(null, true);
                return;
            }

            // 🆕 修饰键优先判断
            // Shift: 强制嵌套模式（放入容器内部）
            if (isShiftHeld) {
                safeSetDropTarget({ targetId: overId, position: 'inside' }, true);
                return;
            }

            const topEdge = overRect.top + edgeHeight;
            const bottomEdge = overRect.top + overRect.height - edgeHeight;

            let newPosition: 'before' | 'after' | 'inside';
            if (currentY < topEdge) {
                newPosition = 'before';
            } else if (currentY > bottomEdge) {
                newPosition = 'after';
            } else {
                newPosition = 'inside';
            }

            // 三段式滞后区（减少 inside/before/after 抖动）
            if (lastDropTargetRef.current?.targetId === overId) {
                const hysteresisPx = Math.max(6, Math.min(edgeHeight * 0.35, 16));
                const lastPos = lastDropTargetRef.current.position;

                if (lastPos === 'inside') {
                    if (currentY < topEdge - hysteresisPx) newPosition = 'before';
                    else if (currentY > bottomEdge + hysteresisPx) newPosition = 'after';
                    else newPosition = 'inside';
                } else if (lastPos === 'before') {
                    if (currentY < topEdge + hysteresisPx) newPosition = 'before';
                    else if (currentY > bottomEdge + hysteresisPx) newPosition = 'after';
                    else newPosition = 'inside';
                } else if (lastPos === 'after') {
                    if (currentY > bottomEdge - hysteresisPx) newPosition = 'after';
                    else if (currentY < topEdge - hysteresisPx) newPosition = 'before';
                    else newPosition = 'inside';
                }
            }

            safeSetDropTarget({ targetId: overId, position: newPosition });
        } else {
            // === 普通组件：二区域判断 (before / after) ===
            const midPoint = overRect.top + overRect.height / 2;
            const hysteresis = overRect.height * ITEM_HYSTERESIS_RATIO * 1.5;

            // 滞后区检测
            if (lastDropTargetRef.current?.targetId === overId) {
                const lastPos = lastDropTargetRef.current.position;
                if (lastPos === 'before' && currentY < midPoint + hysteresis) {
                    return; // 保持 before
                }
                if (lastPos === 'after' && currentY > midPoint - hysteresis) {
                    return; // 保持 after
                }
            }

            const newPosition = currentY < midPoint ? 'before' : 'after';
            safeSetDropTarget({ targetId: overId, position: newPosition });
        }

        // 更新索引（用于非嵌套列表）
        const index = components.findIndex((c) => c.id === over.id);
        if (index !== -1) {
            setOverIndex(index);
        }
    }, [components]);

    // 拖拽结束
    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;
        const currentDropTarget = dropTarget; // 保存当前的 dropTarget

        stopDragTraceRef.current?.({
            overId: over ? String(over.id) : null,
            position: currentDropTarget?.position ?? null,
            targetId: currentDropTarget?.targetId ?? null,
        });
        stopDragTraceRef.current = null;

        setActiveDragId(null);
        setActiveDragType(null);
        setOverIndex(undefined);
        setDropTarget(null);

        if (!over) return;

        const overId = String(over.id);
        const activeId = String(active.id);

        // 使用辅助函数查找父容器信息
        const getParentInfo = (targetId: string) => findParentInfo(components, targetId);

        // 使用辅助函数判断是否是后代
        const checkIsDescendant = (parentId: string, childId: string) =>
            isDescendant(components, parentId, childId);

        // 从 Sidebar 拖拽新组件到 Canvas
        if (activeId.startsWith('new-')) {
            const type = activeId.replace('new-', '') as ComponentType;

            // 放入容器内（container-xxx 格式的 droppable）
            if (overId.startsWith('container-')) {
                const containerId = overId.replace('container-', '');
                addComponent(type, containerId);
                return;
            }

            if (overId !== 'canvas-droppable') {
                const targetComponent = findComponentById(components, overId);

                // 如果目标是容器组件，根据 dropTarget 的位置决定操作
                if (targetComponent?.type === 'Container') {
                    if (currentDropTarget?.position === 'inside') {
                        // 放入容器内部
                        addComponent(type, overId);
                    } else {
                        // before 或 after：作为容器的兄弟元素
                        const { parentId, index } = getParentInfo(overId);
                        if (index !== -1) {
                            const insertIndex = currentDropTarget?.position === 'before' ? index : index + 1;
                            addComponent(type, parentId ?? undefined, insertIndex);
                        } else {
                            addComponent(type, undefined);
                        }
                    }
                    return;
                }

                // 🔧 根据 dropTarget 的位置决定插入位置
                const { parentId, index } = getParentInfo(overId);

                if (index !== -1) {
                    const insertIndex = currentDropTarget?.position === 'before' ? index : index + 1;
                    addComponent(type, parentId ?? undefined, insertIndex);
                    return;
                }
            }

            // 默认添加到末尾
            addComponent(type, undefined);
            return;
        }

        // ========== 画布内已有组件拖拽 ==========
        const { moveComponent } = useStore.getState();

        // 🔧 辅助函数：检查两个组件是否在同一个父容器中
        const areSiblings = (id1: string, id2: string): boolean => {
            const parent1 = getParentInfo(id1);
            const parent2 = getParentInfo(id2);
            return parent1.parentId === parent2.parentId;
        };

        // 拖入 canvas-droppable（顶层画布区域）
        if (overId === 'canvas-droppable') {
            // 将组件移动到顶层
            moveComponent(activeId, null);
            return;
        }

        // 拖入容器的 droppable 区域（空白区域）
        if (overId.startsWith('container-')) {
            const containerId = overId.replace('container-', '');

            // 防止容器拖入自身或其后代
            if (containerId === activeId || checkIsDescendant(activeId, containerId)) {
                message.warning(t('dnd.cannotNestSelf'));
                return;
            }

            // 移动到容器内（末尾位置）
            moveComponent(activeId, containerId);
            return;
        }

        // 拖放到某个组件上
        const targetComponent = findComponentById(components, overId);
        if (!targetComponent) return;

        // 获取目标组件的父容器信息
        const { parentId: targetParentId, index: targetIndex } = getParentInfo(overId);

        // 🔧 判断是同容器排序还是跨容器移动
        const isSameContainer = areSiblings(activeId, overId);

        if (targetComponent.type === 'Container') {
            // 目标是容器组件

            // 防止容器拖入自身或其后代
            if (overId === activeId || checkIsDescendant(activeId, overId)) {
                message.warning(t('dnd.cannotNestSelf'));
                return;
            }

            // 根据 dropTarget 判断是放入内部还是前后
            if (currentDropTarget?.position === 'inside') {
                // 放入容器内部
                moveComponent(activeId, overId);
            } else if (currentDropTarget?.position === 'before') {
                // 放在容器前面
                if (isSameContainer) {
                    reorderComponents(activeId, overId);
                } else {
                    moveComponent(activeId, targetParentId, targetIndex);
                }
            } else {
                // 放在容器后面
                if (isSameContainer) {
                    reorderComponents(activeId, overId);
                } else {
                    moveComponent(activeId, targetParentId, targetIndex + 1);
                }
            }
        } else {
            // 目标是普通组件

            if (isSameContainer) {
                // 同容器内排序
                reorderComponents(activeId, overId);
            } else {
                // 🔧 跨容器移动：移动到目标组件的位置
                const insertIndex = currentDropTarget?.position === 'before' ? targetIndex : targetIndex + 1;
                moveComponent(activeId, targetParentId, insertIndex);
            }
        }
    }, [components, dropTarget, addComponent, reorderComponents]);

    return {
        activeDragId,
        activeDragType,
        overIndex,
        dropTarget,
        handleDragStart,
        handleDragOver,
        handleDragEnd,
    };
}
