import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../store';
import type { ComponentSchema } from '../types';

describe('Store - 组件操作', () => {
  beforeEach(() => {
    // 重置 store 状态
    useStore.setState({
      components: [],
      selectedIds: [],
      formValues: {},
      history: { past: [], future: [] },
    });
  });

  describe('addComponent', () => {
    it('应该能添加 Input 组件到顶层', () => {
      const { addComponent } = useStore.getState();
      
      addComponent('Input');
      
      const state = useStore.getState();
      expect(state.components).toHaveLength(1);
      expect(state.components[0].type).toBe('Input');
      expect((state.components[0].props as { label?: string }).label).toBe('输入框');
    });

    it('应该能添加 Container 组件', () => {
      const { addComponent } = useStore.getState();
      
      addComponent('Container');
      
      const state = useStore.getState();
      expect(state.components).toHaveLength(1);
      expect(state.components[0].type).toBe('Container');
      expect(state.components[0].children).toEqual([]);
    });

    it('应该能在指定位置插入组件', () => {
      const { addComponent } = useStore.getState();
      
      addComponent('Input');
      addComponent('Button');
      addComponent('Select', undefined, 1); // 插入到索引 1
      
      const state = useStore.getState();
      expect(state.components).toHaveLength(3);
      expect(state.components[0].type).toBe('Input');
      expect(state.components[1].type).toBe('Select');
      expect(state.components[2].type).toBe('Button');
    });

    it('应该能添加组件到容器内部', () => {
      const { addComponent } = useStore.getState();
      
      addComponent('Container');
      const containerId = useStore.getState().components[0].id;
      
      addComponent('Input', containerId);
      
      const state = useStore.getState();
      expect(state.components[0].children).toHaveLength(1);
      expect(state.components[0].children![0].type).toBe('Input');
    });

    it('添加组件后应该自动选中该组件', () => {
      const { addComponent } = useStore.getState();
      
      addComponent('Input');
      
      const state = useStore.getState();
      expect(state.selectedIds).toHaveLength(1);
      expect(state.selectedIds[0]).toBe(state.components[0].id);
    });
  });

  describe('deleteComponent', () => {
    it('应该能删除单个组件', () => {
      const { addComponent, deleteComponent } = useStore.getState();
      
      addComponent('Input');
      addComponent('Button');
      const inputId = useStore.getState().components[0].id;
      
      deleteComponent(inputId);
      
      const state = useStore.getState();
      expect(state.components).toHaveLength(1);
      expect(state.components[0].type).toBe('Button');
    });

    it('应该能批量删除组件', () => {
      const { addComponent, deleteComponent } = useStore.getState();
      
      addComponent('Input');
      addComponent('Button');
      addComponent('Select');
      
      const ids = useStore.getState().components.slice(0, 2).map(c => c.id);
      deleteComponent(ids);
      
      const state = useStore.getState();
      expect(state.components).toHaveLength(1);
      expect(state.components[0].type).toBe('Select');
    });

    it('删除后应该清除选中状态', () => {
      const { addComponent, selectComponent, deleteComponent } = useStore.getState();
      
      addComponent('Input');
      const inputId = useStore.getState().components[0].id;
      selectComponent(inputId);
      
      deleteComponent(inputId);
      
      const state = useStore.getState();
      expect(state.selectedIds).not.toContain(inputId);
    });
  });

  describe('updateComponentProps', () => {
    it('应该能更新组件属性', () => {
      const { addComponent, updateComponentProps } = useStore.getState();
      
      addComponent('Input');
      const inputId = useStore.getState().components[0].id;
      
      updateComponentProps(inputId, { label: '用户名', placeholder: '请输入用户名' });
      
      const state = useStore.getState();
      const input = state.components[0] as ComponentSchema & { type: 'Input' };
      expect(input.props.label).toBe('用户名');
      expect(input.props.placeholder).toBe('请输入用户名');
    });

    it('应该能更新嵌套组件的属性', () => {
      const { addComponent, updateComponentProps } = useStore.getState();
      
      addComponent('Container');
      const containerId = useStore.getState().components[0].id;
      addComponent('Input', containerId);
      const inputId = useStore.getState().components[0].children![0].id;
      
      updateComponentProps(inputId, { label: '嵌套输入框' });
      
      const state = useStore.getState();
      expect((state.components[0].children![0].props as { label?: string }).label).toBe('嵌套输入框');
    });
  });

  describe('selectComponent', () => {
    it('应该能选中单个组件', () => {
      const { addComponent, selectComponent } = useStore.getState();
      
      addComponent('Input');
      addComponent('Button');
      const buttonId = useStore.getState().components[1].id;
      
      selectComponent(buttonId);
      
      const state = useStore.getState();
      expect(state.selectedIds).toEqual([buttonId]);
    });

    it('应该支持多选', () => {
      const { addComponent, selectComponent } = useStore.getState();
      
      addComponent('Input');
      addComponent('Button');
      const [inputId, buttonId] = useStore.getState().components.map(c => c.id);
      
      selectComponent(inputId);
      selectComponent(buttonId, true); // 多选
      
      const state = useStore.getState();
      expect(state.selectedIds).toHaveLength(2);
      expect(state.selectedIds).toContain(inputId);
      expect(state.selectedIds).toContain(buttonId);
    });

    it('多选时再次点击应该取消选中', () => {
      const { addComponent, selectComponent } = useStore.getState();
      
      addComponent('Input');
      addComponent('Button');
      const [inputId, buttonId] = useStore.getState().components.map(c => c.id);
      
      selectComponent(inputId);
      selectComponent(buttonId, true);
      selectComponent(inputId, true); // 取消选中 input
      
      const state = useStore.getState();
      expect(state.selectedIds).toEqual([buttonId]);
    });
  });

  describe('reorderComponents', () => {
    it('应该能重新排序组件', () => {
      const { addComponent, reorderComponents } = useStore.getState();
      
      addComponent('Input');
      addComponent('Button');
      addComponent('Select');
      
      const [inputId, , selectId] = useStore.getState().components.map(c => c.id);
      
      reorderComponents(selectId, inputId); // 将 Select 移动到 Input 的位置
      
      const state = useStore.getState();
      expect(state.components[0].type).toBe('Select');
      expect(state.components[1].type).toBe('Input');
      expect(state.components[2].type).toBe('Button');
    });
  });

  describe('undo/redo', () => {
    it('应该能撤销操作', () => {
      const { addComponent, undo } = useStore.getState();
      
      addComponent('Input');
      addComponent('Button');
      
      expect(useStore.getState().components).toHaveLength(2);
      
      undo();
      
      expect(useStore.getState().components).toHaveLength(1);
      expect(useStore.getState().components[0].type).toBe('Input');
    });

    it('应该能重做操作', () => {
      const { addComponent, undo, redo } = useStore.getState();
      
      addComponent('Input');
      addComponent('Button');
      
      undo();
      expect(useStore.getState().components).toHaveLength(1);
      
      redo();
      expect(useStore.getState().components).toHaveLength(2);
    });

    it('撤销后进行新操作应该清空重做栈', () => {
      const { addComponent, undo } = useStore.getState();
      
      addComponent('Input');
      addComponent('Button');
      
      undo();
      expect(useStore.getState().history.future).toHaveLength(1);
      
      addComponent('Select');
      expect(useStore.getState().history.future).toHaveLength(0);
    });
  });

  describe('formValues', () => {
    it('应该能设置表单值', () => {
      const { addComponent, setFormValue } = useStore.getState();
      
      addComponent('Input');
      const inputId = useStore.getState().components[0].id;
      
      setFormValue(inputId, 'test value');
      
      const state = useStore.getState();
      expect(state.formValues[inputId]).toBe('test value');
    });

    it('应该能获取所有表单值', () => {
      const { addComponent, setFormValue, getFormValues } = useStore.getState();
      
      addComponent('Input');
      addComponent('Select');
      const [inputId, selectId] = useStore.getState().components.map(c => c.id);
      
      setFormValue(inputId, 'hello');
      setFormValue(selectId, 'option1');
      
      const values = getFormValues();
      expect(values[inputId]).toBe('hello');
      expect(values[selectId]).toBe('option1');
    });
  });

  describe('moveComponent', () => {
    it('应该能将组件移动到容器内', () => {
      const { addComponent, moveComponent } = useStore.getState();
      
      addComponent('Container');
      addComponent('Input');
      
      const [containerId, inputId] = useStore.getState().components.map(c => c.id);
      
      moveComponent(inputId, containerId);
      
      const state = useStore.getState();
      expect(state.components).toHaveLength(1); // 顶层只有容器
      expect(state.components[0].children).toHaveLength(1);
      expect(state.components[0].children![0].id).toBe(inputId);
    });

    it('应该能将组件从容器移出到顶层', () => {
      const { addComponent, moveComponent } = useStore.getState();
      
      addComponent('Container');
      const containerId = useStore.getState().components[0].id;
      addComponent('Input', containerId);
      const inputId = useStore.getState().components[0].children![0].id;
      
      moveComponent(inputId, null); // 移到顶层
      
      const state = useStore.getState();
      expect(state.components).toHaveLength(2);
      expect(state.components[0].children).toHaveLength(0);
    });
  });
});
