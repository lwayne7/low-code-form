import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { ComponentSchema, ComponentType } from './types';
// ⚠️ 新增：引入 arrayMove 用于数组排序
import { arrayMove } from '@dnd-kit/sortable'; 

interface State {
  components: ComponentSchema[];
  selectedId: string | null;
  
  addComponent: (type: ComponentType) => void;
  selectComponent: (id: string) => void;
  updateComponentProps: (id: string, newProps: any) => void;
  // ⚠️ 新增下面两个方法类型定义
  deleteComponent: (id: string) => void;
  reorderComponents: (activeId: string, overId: string) => void;
}

export const useStore = create<State>((set) => ({
  components: [],
  selectedId: null,

  addComponent: (type) => set((state) => {
    const newComponent: ComponentSchema = {
      id: nanoid(),
      type,
      props: type === 'Input' 
        ? { label: '未命名标题', placeholder: '请输入...' } 
        : { content: '按钮' },
    };
    return { components: [...state.components, newComponent] };
  }),

  selectComponent: (id) => set({ selectedId: id }),

  updateComponentProps: (id, newProps) => set((state) => ({
    components: state.components.map((c) =>
      c.id === id ? { ...c, props: { ...c.props, ...newProps } } : c
    ),
  })),

  // ⚠️ 新增：删除组件
  deleteComponent: (id) => set((state) => ({
    components: state.components.filter(c => c.id !== id),
    selectedId: state.selectedId === id ? null : state.selectedId, // 如果删除了选中项，要取消选中
  })),

  // ⚠️ 新增：拖拽排序逻辑
  reorderComponents: (activeId, overId) => set((state) => {
    const oldIndex = state.components.findIndex((c) => c.id === activeId);
    const newIndex = state.components.findIndex((c) => c.id === overId);
    return {
      components: arrayMove(state.components, oldIndex, newIndex),
    };
  }),
}));