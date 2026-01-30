/**
 * 示例插件集合
 * 
 * 面试考点：
 * 1. 插件设计的实际应用
 * 2. 如何扩展系统功能
 * 3. 关注点分离
 */

import type { Plugin } from './pluginManager';
import type { ComponentSchema } from '../types';

// ============ 日志插件 ============

/**
 * 日志插件 - 记录所有组件操作
 */
export const loggerPlugin: Plugin = {
  name: 'logger',
  version: '1.0.0',
  description: '记录所有组件操作到控制台',

  onInit: (context) => {
    console.log('[LoggerPlugin] Initialized with context:', {
      componentsCount: context.getComponents().length,
      selectedIds: context.getSelectedIds(),
    });
  },

  onComponentAdd: (component) => {
    console.log('[LoggerPlugin] Component added:', component.type, component.id);
    return component;
  },

  onComponentDelete: (ids) => {
    console.log('[LoggerPlugin] Components deleted:', ids);
    return ids;
  },

  onComponentUpdate: (id, props) => {
    console.log('[LoggerPlugin] Component updated:', id, props);
    return props;
  },

  onDestroy: () => {
    console.log('[LoggerPlugin] Destroyed');
  },
};

// ============ 自动保存插件 ============

/**
 * 自动保存插件 - 定期保存到 localStorage
 */
export function createAutoSavePlugin(intervalMs: number = 30000): Plugin {
  let saveTimer: ReturnType<typeof setInterval> | null = null;

  return {
    name: 'auto-save',
    version: '1.0.0',
    description: `每 ${intervalMs / 1000} 秒自动保存`,

    onInit: (context) => {
      saveTimer = setInterval(() => {
        const components = context.getComponents();
        localStorage.setItem('auto-save-components', JSON.stringify(components));
        console.log('[AutoSavePlugin] Saved', components.length, 'components');
      }, intervalMs);
    },

    onDestroy: () => {
      if (saveTimer) {
        clearInterval(saveTimer);
        saveTimer = null;
      }
    },
  };
}

// ============ 组件计数插件 ============

/**
 * 组件统计插件 - 跟踪组件数量变化
 */
export const componentStatsPlugin: Plugin = {
  name: 'component-stats',
  version: '1.0.0',
  description: '跟踪组件数量统计',

  onInit: (context) => {
    context.on('component:add', () => {
      console.log('[StatsPlugin] Total components:', context.getComponents().length);
    });

    context.on('component:delete', () => {
      console.log('[StatsPlugin] Total components:', context.getComponents().length);
    });
  },
};

// ============ 默认值增强插件 ============

/**
 * 默认值增强插件 - 为新组件添加额外默认属性
 * 注意：由于 ComponentSchema 使用联合类型，这里使用类型断言
 */
export const defaultEnhancerPlugin: Plugin = {
  name: 'default-enhancer',
  version: '1.0.0',
  description: '为新组件添加额外默认属性',

  onComponentAdd: (component: ComponentSchema) => {
    // 在组件的 props 中添加元数据
    // 使用 as 断言确保类型兼容
    const enhancedProps = {
      ...component.props,
      _metadata: {
        componentId: component.id,
        createdAt: Date.now(),
      },
    };
    
    return {
      ...component,
      props: enhancedProps,
    } as ComponentSchema;
  },
};

// ============ 代码注释插件 ============

/**
 * 代码注释插件 - 在生成的代码中添加注释
 */
export const codeCommentPlugin: Plugin = {
  name: 'code-comment',
  version: '1.0.0',
  description: '在生成的代码中添加描述性注释',

  onCodeGenerate: (code: string) => {
    const header = `/**
 * 自动生成的表单代码
 * 生成时间: ${new Date().toISOString()}
 * 
 * 注意：此代码由低代码平台自动生成，请勿手动修改
 */

`;
    return header + code;
  },
};

// ============ 性能监控插件 ============

/**
 * 性能监控插件 - 记录操作耗时
 */
export const performancePlugin: Plugin = {
  name: 'performance',
  version: '1.0.0',
  description: '监控操作性能',

  onInit: (context) => {
    const operations: Array<{ name: string; duration: number; timestamp: number }> = [];

    context.on('component:add', () => {
      operations.push({
        name: 'add',
        duration: 0, // 实际实现需要 mark/measure
        timestamp: Date.now(),
      });
    });

    // 暴露到 window 供调试
    if (typeof window !== 'undefined') {
      (window as unknown as Record<string, unknown>).__pluginOperations = operations;
    }
  },
};
