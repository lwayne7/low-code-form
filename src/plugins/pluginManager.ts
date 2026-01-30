/**
 * Plugin System - 插件系统
 * 
 * 面试考点：
 * 1. 插件架构设计
 * 2. 生命周期钩子
 * 3. 中间件模式
 * 4. 开闭原则（对扩展开放，对修改关闭）
 * 
 * @example
 * ```tsx
 * // 定义插件
 * const myPlugin: Plugin = {
 *   name: 'my-plugin',
 *   version: '1.0.0',
 *   onComponentAdd: (component) => {
 *     console.log('Component added:', component);
 *     return component; // 可以修改组件
 *   },
 * };
 * 
 * // 注册插件
 * pluginManager.register(myPlugin);
 * 
 * // 触发钩子
 * const modifiedComponent = pluginManager.runHook('onComponentAdd', component);
 * ```
 */

import type { ComponentSchema, ComponentType } from '../types';
import type { ComponentDefinition } from '../registry/componentRegistry';
import { eventBus } from '../utils/eventBus';

// 插件上下文，提供给插件使用的 API
export interface PluginContext {
  // 获取当前组件列表（只读）
  getComponents: () => ComponentSchema[];
  // 获取选中的组件 ID
  getSelectedIds: () => string[];
  // 发送事件
  emit: typeof eventBus.emit;
  // 订阅事件
  on: typeof eventBus.on;
}

// 插件接口定义
export interface Plugin {
  // 插件标识
  name: string;
  version?: string;
  description?: string;
  
  // 插件依赖
  dependencies?: string[];
  
  // 生命周期钩子
  
  /** 插件初始化 */
  onInit?: (context: PluginContext) => void | Promise<void>;
  
  /** 插件销毁 */
  onDestroy?: () => void | Promise<void>;
  
  // 组件生命周期钩子（可以拦截和修改）
  
  /** 组件添加前，可以修改组件 */
  onComponentAdd?: (component: ComponentSchema) => ComponentSchema;
  
  /** 组件删除前 */
  onComponentDelete?: (ids: string[]) => string[] | false;
  
  /** 组件更新前，可以修改 props */
  onComponentUpdate?: (
    id: string,
    props: Partial<ComponentSchema['props']>
  ) => Partial<ComponentSchema['props']>;
  
  /** 组件移动前 */
  onComponentMove?: (
    id: string,
    targetParentId: string | null,
    index: number
  ) => { targetParentId: string | null; index: number } | false;
  
  // 渲染钩子
  
  /** 渲染前处理组件树 */
  onBeforeRender?: (components: ComponentSchema[]) => ComponentSchema[];
  
  /** 代码生成后处理 */
  onCodeGenerate?: (code: string) => string;
  
  // 扩展组件
  components?: ComponentDefinition[];
  
  // 扩展属性面板
  propertyPanelExtensions?: {
    componentType: ComponentType;
    render: (component: ComponentSchema) => React.ReactNode;
  }[];
}

// 已注册插件的存储
interface RegisteredPlugin {
  plugin: Plugin;
  enabled: boolean;
}

class PluginManagerImpl {
  private plugins = new Map<string, RegisteredPlugin>();
  private context: PluginContext | null = null;
  private initialized = false;

  /**
   * 初始化插件管理器
   */
  init(context: PluginContext): void {
    this.context = context;
    this.initialized = true;

    // 初始化所有已注册的插件
    this.plugins.forEach(({ plugin, enabled }) => {
      if (enabled && plugin.onInit) {
        try {
          plugin.onInit(context);
        } catch (error) {
          console.error(`[PluginManager] Failed to init plugin "${plugin.name}":`, error);
        }
      }
    });
  }

  /**
   * 注册插件
   */
  register(plugin: Plugin): boolean {
    if (this.plugins.has(plugin.name)) {
      console.warn(`[PluginManager] Plugin "${plugin.name}" is already registered`);
      return false;
    }

    // 检查依赖
    if (plugin.dependencies) {
      for (const dep of plugin.dependencies) {
        if (!this.plugins.has(dep)) {
          console.error(
            `[PluginManager] Plugin "${plugin.name}" depends on "${dep}" which is not registered`
          );
          return false;
        }
      }
    }

    this.plugins.set(plugin.name, { plugin, enabled: true });

    // 如果管理器已初始化，立即初始化插件
    if (this.initialized && this.context && plugin.onInit) {
      try {
        plugin.onInit(this.context);
      } catch (error) {
        console.error(`[PluginManager] Failed to init plugin "${plugin.name}":`, error);
      }
    }

    eventBus.emit('plugin:register', { name: plugin.name });
    console.log(`[PluginManager] Plugin "${plugin.name}" registered`);
    return true;
  }

  /**
   * 注销插件
   */
  unregister(name: string): boolean {
    const registered = this.plugins.get(name);
    if (!registered) {
      return false;
    }

    // 检查是否有其他插件依赖此插件
    for (const [otherName, { plugin }] of this.plugins) {
      if (otherName !== name && plugin.dependencies?.includes(name)) {
        console.error(
          `[PluginManager] Cannot unregister "${name}": plugin "${otherName}" depends on it`
        );
        return false;
      }
    }

    // 调用销毁钩子
    if (registered.plugin.onDestroy) {
      try {
        registered.plugin.onDestroy();
      } catch (error) {
        console.error(`[PluginManager] Error destroying plugin "${name}":`, error);
      }
    }

    this.plugins.delete(name);
    eventBus.emit('plugin:unregister', { name });
    return true;
  }

  /**
   * 启用/禁用插件
   */
  setEnabled(name: string, enabled: boolean): boolean {
    const registered = this.plugins.get(name);
    if (!registered) {
      return false;
    }
    registered.enabled = enabled;
    return true;
  }

  /**
   * 获取插件
   */
  get(name: string): Plugin | undefined {
    return this.plugins.get(name)?.plugin;
  }

  /**
   * 获取所有已注册插件
   */
  getAll(): Plugin[] {
    return Array.from(this.plugins.values())
      .filter(({ enabled }) => enabled)
      .map(({ plugin }) => plugin);
  }

  /**
   * 运行组件添加钩子
   */
  runComponentAddHook(component: ComponentSchema): ComponentSchema {
    let result = component;
    for (const { plugin, enabled } of this.plugins.values()) {
      if (enabled && plugin.onComponentAdd) {
        try {
          result = plugin.onComponentAdd(result);
        } catch (error) {
          console.error(`[PluginManager] Error in "${plugin.name}.onComponentAdd":`, error);
        }
      }
    }
    return result;
  }

  /**
   * 运行组件删除钩子
   */
  runComponentDeleteHook(ids: string[]): string[] | false {
    let result: string[] | false = ids;
    for (const { plugin, enabled } of this.plugins.values()) {
      if (enabled && plugin.onComponentDelete && result !== false) {
        try {
          result = plugin.onComponentDelete(result);
        } catch (error) {
          console.error(`[PluginManager] Error in "${plugin.name}.onComponentDelete":`, error);
        }
      }
    }
    return result;
  }

  /**
   * 运行组件更新钩子
   */
  runComponentUpdateHook(
    id: string,
    props: Partial<ComponentSchema['props']>
  ): Partial<ComponentSchema['props']> {
    let result = props;
    for (const { plugin, enabled } of this.plugins.values()) {
      if (enabled && plugin.onComponentUpdate) {
        try {
          result = plugin.onComponentUpdate(id, result);
        } catch (error) {
          console.error(`[PluginManager] Error in "${plugin.name}.onComponentUpdate":`, error);
        }
      }
    }
    return result;
  }

  /**
   * 运行渲染前钩子
   */
  runBeforeRenderHook(components: ComponentSchema[]): ComponentSchema[] {
    let result = components;
    for (const { plugin, enabled } of this.plugins.values()) {
      if (enabled && plugin.onBeforeRender) {
        try {
          result = plugin.onBeforeRender(result);
        } catch (error) {
          console.error(`[PluginManager] Error in "${plugin.name}.onBeforeRender":`, error);
        }
      }
    }
    return result;
  }

  /**
   * 运行代码生成钩子
   */
  runCodeGenerateHook(code: string): string {
    let result = code;
    for (const { plugin, enabled } of this.plugins.values()) {
      if (enabled && plugin.onCodeGenerate) {
        try {
          result = plugin.onCodeGenerate(result);
        } catch (error) {
          console.error(`[PluginManager] Error in "${plugin.name}.onCodeGenerate":`, error);
        }
      }
    }
    return result;
  }

  /**
   * 获取所有插件扩展的组件
   */
  getExtendedComponents(): ComponentDefinition[] {
    const components: ComponentDefinition[] = [];
    for (const { plugin, enabled } of this.plugins.values()) {
      if (enabled && plugin.components) {
        components.push(...plugin.components);
      }
    }
    return components;
  }
}

// 单例导出
export const pluginManager = new PluginManagerImpl();

// React Hook
import { useEffect, useState } from 'react';

/**
 * usePlugins - 获取已注册插件列表的 Hook
 */
export function usePlugins(): Plugin[] {
  const [plugins, setPlugins] = useState<Plugin[]>(() => pluginManager.getAll());

  useEffect(() => {
    const handleChange = () => {
      setPlugins(pluginManager.getAll());
    };

    const unsubRegister = eventBus.on('plugin:register', handleChange);
    const unsubUnregister = eventBus.on('plugin:unregister', handleChange);

    return () => {
      unsubRegister();
      unsubUnregister();
    };
  }, []);

  return plugins;
}
