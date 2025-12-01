import { describe, it, expect } from 'vitest';
import {
  findComponentById,
  findParentInfo,
  isDescendant,
  getAllComponentIds,
  countComponents,
} from '../utils/componentHelpers';
import type { ComponentSchema } from '../types';

// 测试用的组件树结构
const createTestTree = (): ComponentSchema[] => [
  {
    id: 'input-1',
    type: 'Input',
    props: { label: '输入框1', placeholder: '' },
  },
  {
    id: 'container-1',
    type: 'Container',
    props: { label: '容器1' },
    children: [
      {
        id: 'input-2',
        type: 'Input',
        props: { label: '嵌套输入框', placeholder: '' },
      },
      {
        id: 'container-2',
        type: 'Container',
        props: { label: '嵌套容器' },
        children: [
          {
            id: 'button-1',
            type: 'Button',
            props: { content: '深层按钮' },
          },
        ],
      },
    ],
  },
  {
    id: 'button-2',
    type: 'Button',
    props: { content: '顶层按钮' },
  },
];

describe('componentHelpers - 组件辅助函数', () => {
  describe('findComponentById', () => {
    it('应该能找到顶层组件', () => {
      const tree = createTestTree();
      const result = findComponentById(tree, 'input-1');
      expect(result).toBeDefined();
      expect(result?.id).toBe('input-1');
    });

    it('应该能找到一级嵌套组件', () => {
      const tree = createTestTree();
      const result = findComponentById(tree, 'input-2');
      expect(result).toBeDefined();
      expect(result?.id).toBe('input-2');
    });

    it('应该能找到深层嵌套组件', () => {
      const tree = createTestTree();
      const result = findComponentById(tree, 'button-1');
      expect(result).toBeDefined();
      expect(result?.id).toBe('button-1');
    });

    it('找不到组件时应该返回 undefined', () => {
      const tree = createTestTree();
      const result = findComponentById(tree, 'non-existent');
      expect(result).toBeUndefined();
    });

    it('空数组应该返回 undefined', () => {
      const result = findComponentById([], 'any-id');
      expect(result).toBeUndefined();
    });
  });

  describe('findParentInfo', () => {
    it('顶层组件的父容器应该是 null', () => {
      const tree = createTestTree();
      const result = findParentInfo(tree, 'input-1');
      expect(result.parentId).toBeNull();
      expect(result.index).toBe(0);
    });

    it('应该正确找到一级嵌套组件的父容器', () => {
      const tree = createTestTree();
      const result = findParentInfo(tree, 'input-2');
      expect(result.parentId).toBe('container-1');
      expect(result.index).toBe(0);
    });

    it('应该正确找到深层嵌套组件的父容器', () => {
      const tree = createTestTree();
      const result = findParentInfo(tree, 'button-1');
      expect(result.parentId).toBe('container-2');
      expect(result.index).toBe(0);
    });

    it('应该返回正确的索引位置', () => {
      const tree = createTestTree();
      // container-2 是 container-1 的第二个子组件 (index = 1)
      const result = findParentInfo(tree, 'container-2');
      expect(result.parentId).toBe('container-1');
      expect(result.index).toBe(1);
    });

    it('找不到组件时应该返回 index = -1', () => {
      const tree = createTestTree();
      const result = findParentInfo(tree, 'non-existent');
      expect(result.parentId).toBeNull();
      expect(result.index).toBe(-1);
    });
  });

  describe('isDescendant', () => {
    it('直接子组件应该返回 true', () => {
      const tree = createTestTree();
      const result = isDescendant(tree, 'container-1', 'input-2');
      expect(result).toBe(true);
    });

    it('深层子组件应该返回 true', () => {
      const tree = createTestTree();
      const result = isDescendant(tree, 'container-1', 'button-1');
      expect(result).toBe(true);
    });

    it('非后代组件应该返回 false', () => {
      const tree = createTestTree();
      const result = isDescendant(tree, 'container-1', 'button-2');
      expect(result).toBe(false);
    });

    it('同级组件应该返回 false', () => {
      const tree = createTestTree();
      const result = isDescendant(tree, 'input-2', 'container-2');
      expect(result).toBe(false);
    });

    it('非容器组件应该返回 false', () => {
      const tree = createTestTree();
      const result = isDescendant(tree, 'input-1', 'button-1');
      expect(result).toBe(false);
    });

    it('自身应该返回 false', () => {
      const tree = createTestTree();
      const result = isDescendant(tree, 'container-1', 'container-1');
      expect(result).toBe(false);
    });
  });

  describe('getAllComponentIds', () => {
    it('应该返回所有组件的 ID', () => {
      const tree = createTestTree();
      const ids = getAllComponentIds(tree);
      expect(ids).toHaveLength(6);
      expect(ids).toContain('input-1');
      expect(ids).toContain('container-1');
      expect(ids).toContain('input-2');
      expect(ids).toContain('container-2');
      expect(ids).toContain('button-1');
      expect(ids).toContain('button-2');
    });

    it('空数组应该返回空数组', () => {
      const ids = getAllComponentIds([]);
      expect(ids).toHaveLength(0);
    });
  });

  describe('countComponents', () => {
    it('应该正确计算组件总数', () => {
      const tree = createTestTree();
      const count = countComponents(tree);
      expect(count).toBe(6);
    });

    it('空数组应该返回 0', () => {
      const count = countComponents([]);
      expect(count).toBe(0);
    });
  });
});

describe('componentHelpers - 边界情况', () => {
  it('处理 children 为 undefined 的情况', () => {
    const tree: ComponentSchema[] = [
      {
        id: 'input-1',
        type: 'Input',
        props: { label: '输入框', placeholder: '' },
        // 没有 children 属性
      },
    ];

    expect(findComponentById(tree, 'input-1')).toBeDefined();
    expect(isDescendant(tree, 'input-1', 'any')).toBe(false);
    expect(getAllComponentIds(tree)).toHaveLength(1);
  });

  it('处理 children 为空数组的情况', () => {
    const tree: ComponentSchema[] = [
      {
        id: 'container-1',
        type: 'Container',
        props: { label: '空容器' },
        children: [],
      },
    ];

    expect(findComponentById(tree, 'container-1')).toBeDefined();
    expect(isDescendant(tree, 'container-1', 'any')).toBe(false);
    expect(getAllComponentIds(tree)).toHaveLength(1);
  });

  it('处理深度嵌套结构 (5层)', () => {
    const deepTree: ComponentSchema[] = [
      {
        id: 'level-1',
        type: 'Container',
        props: { label: '层级1' },
        children: [
          {
            id: 'level-2',
            type: 'Container',
            props: { label: '层级2' },
            children: [
              {
                id: 'level-3',
                type: 'Container',
                props: { label: '层级3' },
                children: [
                  {
                    id: 'level-4',
                    type: 'Container',
                    props: { label: '层级4' },
                    children: [
                      {
                        id: 'level-5',
                        type: 'Input',
                        props: { label: '最深层', placeholder: '' },
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ];

    // 应该能找到最深层的组件
    expect(findComponentById(deepTree, 'level-5')).toBeDefined();
    
    // 应该正确判断后代关系
    expect(isDescendant(deepTree, 'level-1', 'level-5')).toBe(true);
    expect(isDescendant(deepTree, 'level-3', 'level-5')).toBe(true);
    
    // 应该正确计数
    expect(countComponents(deepTree)).toBe(5);
  });
});
