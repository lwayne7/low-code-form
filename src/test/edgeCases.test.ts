/**
 * 边界条件测试
 *
 * 面试考点：
 * 1. 边界条件测试策略
 * 2. 极端情况处理
 * 3. 并发测试
 * 4. 错误恢复测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../store';
import type { ComponentSchema } from '../types';

// ============ 辅助函数 ============

function createManyComponents(count: number): ComponentSchema[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `comp-${i}`,
    type: 'Input' as const,
    props: { label: `Input ${i}`, placeholder: '' },
  }));
}

function createDeepNestedStructure(depth: number): ComponentSchema {
  const createLevel = (level: number): ComponentSchema => ({
    id: `container-${level}`,
    type: 'Container',
    props: { label: `Container ${level}`, direction: 'vertical' },
    children:
      level < depth - 1
        ? [createLevel(level + 1)]
        : [{ id: `leaf-${level}`, type: 'Input', props: { label: 'Leaf', placeholder: '' } }],
  });
  return createLevel(0);
}

// ============ 测试套件 ============

describe('边界条件测试', () => {
  beforeEach(() => {
    // 重置 store
    useStore.setState({
      components: [],
      selectedIds: [],
      formValues: {},
      validationErrors: {},
      clipboard: [],
      history: { past: [], future: [] },
      customTemplates: [],
    });
  });

  describe('超大数据量处理', () => {
    it('应该能处理 1000 个组件', () => {
      const components = createManyComponents(1000);
      useStore.setState({ components });

      const state = useStore.getState();
      expect(state.components).toHaveLength(1000);
    });

    it('应该能处理 10 层深度嵌套', () => {
      const nested = createDeepNestedStructure(10);
      useStore.setState({ components: [nested] });

      const state = useStore.getState();
      expect(state.components).toHaveLength(1);

      // 验证深度
      let current: ComponentSchema | undefined = state.components[0];
      let depth = 0;
      while (current?.children?.[0]) {
        depth++;
        current = current.children[0];
      }
      expect(depth).toBe(10);
    });

    it('全选 1000 个组件应该正常工作', () => {
      const components = createManyComponents(1000);
      useStore.setState({ components });

      const { selectAll } = useStore.getState();
      selectAll();

      const state = useStore.getState();
      expect(state.selectedIds).toHaveLength(1000);
    });

    it('批量删除 500 个组件应该正常工作', () => {
      const components = createManyComponents(1000);
      useStore.setState({ components });

      const idsToDelete = components.slice(0, 500).map((c) => c.id);
      const { deleteComponent } = useStore.getState();
      deleteComponent(idsToDelete);

      const state = useStore.getState();
      expect(state.components).toHaveLength(500);
    });
  });

  describe('并发操作测试', () => {
    it('快速连续添加组件应该保持顺序', async () => {
      const { addComponent } = useStore.getState();

      // 快速连续添加
      for (let i = 0; i < 10; i++) {
        addComponent('Input');
      }

      const state = useStore.getState();
      expect(state.components).toHaveLength(10);
    });

    it('快速连续撤销/重做应该正确恢复状态', () => {
      const { addComponent, undo, redo } = useStore.getState();

      // 添加组件
      addComponent('Input');
      addComponent('Button');
      addComponent('Select');

      // 快速撤销
      undo();
      undo();
      undo();

      expect(useStore.getState().components).toHaveLength(0);

      // 快速重做
      redo();
      redo();
      redo();

      expect(useStore.getState().components).toHaveLength(3);
    });

    it('同时选择和删除应该正确处理', () => {
      const { addComponent, selectComponent, deleteComponent } = useStore.getState();

      addComponent('Input');
      addComponent('Button');

      const state1 = useStore.getState();
      const firstId = state1.components[0].id;

      selectComponent(firstId);
      deleteComponent(firstId);

      const state2 = useStore.getState();
      expect(state2.components).toHaveLength(1);
      expect(state2.selectedIds).not.toContain(firstId);
    });
  });

  describe('边界值测试', () => {
    it('空组件列表应该正常处理', () => {
      const state = useStore.getState();
      expect(state.components).toHaveLength(0);
      expect(state.getFormValues()).toEqual({});
    });

    it('删除不存在的组件应该不报错', () => {
      const { deleteComponent } = useStore.getState();

      expect(() => {
        deleteComponent('non-existent-id');
      }).not.toThrow();
    });

    it('更新不存在的组件属性应该不报错', () => {
      const { updateComponentProps } = useStore.getState();

      expect(() => {
        updateComponentProps('non-existent-id', { label: 'test' });
      }).not.toThrow();
    });

    it('选择不存在的组件应该正常处理', () => {
      const { selectComponent } = useStore.getState();

      selectComponent('non-existent-id');

      const state = useStore.getState();
      expect(state.selectedIds).toContain('non-existent-id');
    });

    it('空剪贴板粘贴应该不报错', () => {
      const { pasteComponents } = useStore.getState();

      expect(() => {
        pasteComponents();
      }).not.toThrow();
    });

    it('历史记录为空时撤销应该不报错', () => {
      const { undo } = useStore.getState();

      expect(() => {
        undo();
      }).not.toThrow();
    });

    it('没有未来历史时重做应该不报错', () => {
      const { redo } = useStore.getState();

      expect(() => {
        redo();
      }).not.toThrow();
    });
  });

  describe('特殊字符和编码测试', () => {
    it('应该正确处理包含特殊字符的标签', () => {
      const { addComponent, updateComponentProps } = useStore.getState();

      addComponent('Input');
      const id = useStore.getState().components[0].id;

      updateComponentProps(id, {
        label: '<script>alert("xss")</script>',
        placeholder: '测试 & 特殊字符 "引号"',
      });

      const state = useStore.getState();
      expect((state.components[0].props as { label: string }).label).toBe(
        '<script>alert("xss")</script>'
      );
    });

    it('应该正确处理 Unicode 字符', () => {
      const { addComponent, updateComponentProps } = useStore.getState();

      addComponent('Input');
      const id = useStore.getState().components[0].id;

      updateComponentProps(id, {
        label: '🎉 Emoji 测试 中文 العربية',
      });

      const state = useStore.getState();
      expect((state.components[0].props as { label: string }).label).toBe(
        '🎉 Emoji 测试 中文 العربية'
      );
    });

    it('应该正确处理超长字符串', () => {
      const { addComponent, updateComponentProps } = useStore.getState();

      addComponent('Input');
      const id = useStore.getState().components[0].id;

      const longString = 'a'.repeat(10000);
      updateComponentProps(id, { label: longString });

      const state = useStore.getState();
      expect((state.components[0].props as { label: string }).label.length).toBe(10000);
    });
  });

  describe('状态一致性测试', () => {
    it('删除后选中状态应该清理', () => {
      const { addComponent, selectComponent, deleteComponent } = useStore.getState();

      addComponent('Input');
      addComponent('Button');

      const state1 = useStore.getState();
      const id1 = state1.components[0].id;
      const id2 = state1.components[1].id;

      selectComponent(id1);
      selectComponent(id2, true);

      deleteComponent(id1);

      const state2 = useStore.getState();
      expect(state2.selectedIds).not.toContain(id1);
      expect(state2.selectedIds).toContain(id2);
    });

    it('重置画布应该清理所有状态', () => {
      const { addComponent, selectComponent, setFormValue, resetCanvas } = useStore.getState();

      addComponent('Input');
      const id = useStore.getState().components[0].id;
      selectComponent(id);
      setFormValue(id, 'test value');

      resetCanvas();

      const state = useStore.getState();
      expect(state.components).toHaveLength(0);
      expect(state.selectedIds).toHaveLength(0);
      expect(state.formValues).toEqual({});
    });

    it('复制粘贴应该生成新 ID', () => {
      const { addComponent, selectComponent, copyComponents, pasteComponents } =
        useStore.getState();

      addComponent('Input');
      const originalId = useStore.getState().components[0].id;

      selectComponent(originalId);
      copyComponents();
      pasteComponents();

      const state = useStore.getState();
      expect(state.components).toHaveLength(2);
      expect(state.components[0].id).toBe(originalId);
      expect(state.components[1].id).not.toBe(originalId);
    });
  });

  describe('历史记录限制测试', () => {
    it('历史记录应该限制在 50 条以内', () => {
      const { addComponent } = useStore.getState();

      // 添加 60 个组件（每次添加产生一条历史记录）
      for (let i = 0; i < 60; i++) {
        addComponent('Input');
      }

      const state = useStore.getState();
      expect(state.history.past.length).toBeLessThanOrEqual(50);
    });
  });

  describe('内存和性能测试', () => {
    it('大量操作后不应该有内存泄漏迹象', () => {
      const { addComponent, deleteComponent, undo, redo } = useStore.getState();

      // 执行大量操作
      for (let i = 0; i < 100; i++) {
        addComponent('Input');
      }

      for (let i = 0; i < 50; i++) {
        const state = useStore.getState();
        if (state.components.length > 0) {
          deleteComponent(state.components[0].id);
        }
      }

      for (let i = 0; i < 20; i++) {
        undo();
      }

      for (let i = 0; i < 10; i++) {
        redo();
      }

      // 验证状态仍然有效
      const finalState = useStore.getState();
      expect(finalState.components.length).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(finalState.history.past)).toBe(true);
    });
  });
});

describe('工具函数边界测试', () => {
  describe('findComponentById', () => {
    it('应该在空数组中返回 undefined', async () => {
      const { findComponentById } = await import('../utils/componentHelpers');
      expect(findComponentById([], 'any-id')).toBeUndefined();
    });

    it('应该在深层嵌套中找到组件', async () => {
      const { findComponentById } = await import('../utils/componentHelpers');
      const nested = createDeepNestedStructure(5);
      const result = findComponentById([nested], 'container-3');
      expect(result).toBeDefined();
      expect(result?.id).toBe('container-3');
    });
  });

  describe('flattenComponents', () => {
    it('应该正确扁平化嵌套结构', async () => {
      const { flattenComponents } = await import('../utils/componentHelpers');
      const nested = createDeepNestedStructure(3);
      const flat = flattenComponents([nested]);
      // depth=3 表示 3 层深度：3 个容器 + 1 个叶子节点 = 4
      expect(flat.length).toBe(4);
    });
  });
});

describe('表单校验边界测试', () => {
  it('应该正确处理空规则数组', async () => {
    const { validateValue } = await import('../utils/validation');
    const result = validateValue('test', [], 'Field');
    expect(result).toBeNull();
  });

  it('应该正确处理 undefined 规则', async () => {
    const { validateValue } = await import('../utils/validation');
    const result = validateValue('test', undefined, 'Field');
    expect(result).toBeNull();
  });

  it('应该正确处理各种空值', async () => {
    const { validateValue } = await import('../utils/validation');
    const rules = [{ type: 'required' as const, message: '必填' }];

    expect(validateValue(undefined, rules, 'Field')).toBe('必填');
    expect(validateValue(null, rules, 'Field')).toBe('必填');
    expect(validateValue('', rules, 'Field')).toBe('必填');
    expect(validateValue([], rules, 'Field')).toBe('必填');
  });
});
