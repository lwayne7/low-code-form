/**
 * Command Pattern - 命令模式实现
 * 
 * 面试考点：
 * 1. 命令模式的核心思想（将操作封装为对象）
 * 2. 支持撤销/重做
 * 3. 命令队列和批量执行
 * 4. 宏命令（组合命令）
 * 
 * @example
 * ```tsx
 * // 创建命令
 * const addCmd = new AddComponentCommand('Input');
 * 
 * // 执行命令
 * commandManager.execute(addCmd);
 * 
 * // 撤销
 * commandManager.undo();
 * 
 * // 重做
 * commandManager.redo();
 * ```
 */

import type { ComponentSchema, ComponentType } from '../types';
import { eventBus } from '../utils/eventBus';

// 命令接口
export interface Command {
  /** 命令名称（用于日志和调试） */
  readonly name: string;
  /** 命令描述 */
  readonly description: string;
  /** 执行命令 */
  execute(): void | Promise<void>;
  /** 撤销命令 */
  undo(): void | Promise<void>;
  /** 是否可以与其他命令合并（用于优化连续的相同操作） */
  canMerge?(other: Command): boolean;
  /** 合并命令 */
  merge?(other: Command): Command;
}

// Store 操作接口（依赖注入）
export interface StoreOperations {
  addComponent: (type: ComponentType, parentId?: string, index?: number) => void;
  addComponents: (components: ComponentSchema[]) => void;
  deleteComponent: (ids: string | string[]) => void;
  updateComponentProps: (id: string, props: Partial<ComponentSchema['props']>) => void;
  moveComponent: (activeId: string, targetContainerId: string | null, index?: number) => void;
  selectComponent: (id: string, multi?: boolean) => void;
  clearSelection: () => void;
  getComponents: () => ComponentSchema[];
  getSelectedIds: () => string[];
}

/**
 * 添加组件命令
 */
export class AddComponentCommand implements Command {
  readonly name = 'AddComponent';
  private addedId: string | null = null;
  private type: ComponentType;
  private parentId?: string;
  private index?: number;
  private store?: StoreOperations;

  constructor(
    type: ComponentType,
    parentId?: string,
    index?: number,
    store?: StoreOperations
  ) {
    this.type = type;
    this.parentId = parentId;
    this.index = index;
    this.store = store;
  }

  get description() {
    return `添加 ${this.type} 组件`;
  }

  execute(): void {
    if (!this.store) throw new Error('Store not provided');
    
    const beforeIds = new Set(this.getAllIds(this.store.getComponents()));
    this.store.addComponent(this.type, this.parentId, this.index);
    const afterIds = this.getAllIds(this.store.getComponents());
    
    // 找出新添加的组件 ID
    for (const id of afterIds) {
      if (!beforeIds.has(id)) {
        this.addedId = id;
        break;
      }
    }

    eventBus.emit('component:add', { 
      component: this.findComponent(this.store.getComponents(), this.addedId!)!,
      parentId: this.parentId 
    });
  }

  undo(): void {
    if (!this.store || !this.addedId) return;
    this.store.deleteComponent(this.addedId);
  }

  private getAllIds(components: ComponentSchema[]): string[] {
    const ids: string[] = [];
    const collect = (items: ComponentSchema[]) => {
      for (const item of items) {
        ids.push(item.id);
        if (item.children) collect(item.children);
      }
    };
    collect(components);
    return ids;
  }

  private findComponent(components: ComponentSchema[], id: string): ComponentSchema | undefined {
    for (const c of components) {
      if (c.id === id) return c;
      if (c.children) {
        const found = this.findComponent(c.children, id);
        if (found) return found;
      }
    }
    return undefined;
  }
}

/**
 * 删除组件命令
 */
export class DeleteComponentCommand implements Command {
  readonly name = 'DeleteComponent';
  private deletedComponents: ComponentSchema[] = [];
  private deletedPositions: Map<string, { parentId: string | null; index: number }> = new Map();
  private ids: string[];
  private store?: StoreOperations;

  constructor(
    ids: string[],
    store?: StoreOperations
  ) {
    this.ids = ids;
    this.store = store;
  }

  get description() {
    return `删除 ${this.ids.length} 个组件`;
  }

  execute(): void {
    if (!this.store) throw new Error('Store not provided');
    
    // 保存删除前的组件信息（用于撤销）
    const components = this.store.getComponents();
    for (const id of this.ids) {
      const info = this.findComponentWithPosition(components, id);
      if (info) {
        this.deletedComponents.push(info.component);
        this.deletedPositions.set(id, { parentId: info.parentId, index: info.index });
      }
    }

    this.store.deleteComponent(this.ids);
    eventBus.emit('component:delete', { ids: this.ids });
  }

  undo(): void {
    if (!this.store) return;
    // 恢复删除的组件
    this.store.addComponents(this.deletedComponents);
  }

  private findComponentWithPosition(
    components: ComponentSchema[],
    id: string,
    parentId: string | null = null
  ): { component: ComponentSchema; parentId: string | null; index: number } | undefined {
    for (let i = 0; i < components.length; i++) {
      const c = components[i];
      if (c.id === id) {
        return { component: c, parentId, index: i };
      }
      if (c.children) {
        const found = this.findComponentWithPosition(c.children, id, c.id);
        if (found) return found;
      }
    }
    return undefined;
  }
}

/**
 * 更新组件属性命令
 */
export class UpdatePropsCommand implements Command {
  readonly name = 'UpdateProps';
  private prevProps: Partial<ComponentSchema['props']> | null = null;
  private componentId: string;
  private newProps: Partial<ComponentSchema['props']>;
  private store?: StoreOperations;

  constructor(
    componentId: string,
    newProps: Partial<ComponentSchema['props']>,
    store?: StoreOperations
  ) {
    this.componentId = componentId;
    this.newProps = newProps;
    this.store = store;
  }

  get description() {
    return `更新组件属性`;
  }

  execute(): void {
    if (!this.store) throw new Error('Store not provided');
    
    // 保存旧属性
    const component = this.findComponent(this.store.getComponents(), this.componentId);
    if (component) {
      this.prevProps = { ...component.props };
    }

    this.store.updateComponentProps(this.componentId, this.newProps);
    eventBus.emit('component:update', { id: this.componentId, props: this.newProps });
  }

  undo(): void {
    if (!this.store || !this.prevProps) return;
    this.store.updateComponentProps(this.componentId, this.prevProps);
  }

  canMerge(other: Command): boolean {
    return other instanceof UpdatePropsCommand && other.componentId === this.componentId;
  }

  merge(other: Command): Command {
    if (!(other instanceof UpdatePropsCommand)) return this;
    // 合并属性更新
    return new UpdatePropsCommand(
      this.componentId,
      { ...this.newProps, ...other.newProps },
      this.store
    );
  }

  private findComponent(components: ComponentSchema[], id: string): ComponentSchema | undefined {
    for (const c of components) {
      if (c.id === id) return c;
      if (c.children) {
        const found = this.findComponent(c.children, id);
        if (found) return found;
      }
    }
    return undefined;
  }
}

/**
 * 移动组件命令
 */
export class MoveComponentCommand implements Command {
  readonly name = 'MoveComponent';
  private previousPosition: { parentId: string | null; index: number } | null = null;
  private componentId: string;
  private targetParentId: string | null;
  private targetIndex: number;
  private store?: StoreOperations;

  constructor(
    componentId: string,
    targetParentId: string | null,
    targetIndex: number,
    store?: StoreOperations
  ) {
    this.componentId = componentId;
    this.targetParentId = targetParentId;
    this.targetIndex = targetIndex;
    this.store = store;
  }

  get description() {
    return `移动组件`;
  }

  execute(): void {
    if (!this.store) throw new Error('Store not provided');
    
    // 保存原位置
    const components = this.store.getComponents();
    this.previousPosition = this.findPosition(components, this.componentId);

    this.store.moveComponent(this.componentId, this.targetParentId, this.targetIndex);
    eventBus.emit('component:move', { 
      id: this.componentId, 
      from: this.previousPosition?.parentId ?? null, 
      to: this.targetParentId 
    });
  }

  undo(): void {
    if (!this.store || !this.previousPosition) return;
    this.store.moveComponent(
      this.componentId,
      this.previousPosition.parentId,
      this.previousPosition.index
    );
  }

  private findPosition(
    components: ComponentSchema[],
    id: string,
    parentId: string | null = null
  ): { parentId: string | null; index: number } | null {
    for (let i = 0; i < components.length; i++) {
      const c = components[i];
      if (c.id === id) {
        return { parentId, index: i };
      }
      if (c.children) {
        const found = this.findPosition(c.children, id, c.id);
        if (found) return found;
      }
    }
    return null;
  }
}

/**
 * 宏命令 - 组合多个命令
 */
export class MacroCommand implements Command {
  readonly name = 'MacroCommand';
  private commands: Command[];
  private macroDescription?: string;

  constructor(
    commands: Command[],
    macroDescription?: string
  ) {
    this.commands = commands;
    this.macroDescription = macroDescription;
  }

  get description() {
    return this.macroDescription || `执行 ${this.commands.length} 个操作`;
  }

  async execute(): Promise<void> {
    for (const cmd of this.commands) {
      await cmd.execute();
    }
  }

  async undo(): Promise<void> {
    // 反向撤销
    for (let i = this.commands.length - 1; i >= 0; i--) {
      await this.commands[i].undo();
    }
  }
}

/**
 * 命令管理器
 */
class CommandManagerImpl {
  private history: Command[] = [];
  private redoStack: Command[] = [];
  private maxHistory = 50;

  /**
   * 执行命令
   */
  async execute(command: Command): Promise<void> {
    // 检查是否可以与上一个命令合并
    if (this.history.length > 0) {
      const lastCmd = this.history[this.history.length - 1];
      if (lastCmd.canMerge?.(command)) {
        this.history[this.history.length - 1] = lastCmd.merge!(command);
        await command.execute();
        return;
      }
    }

    await command.execute();
    this.history.push(command);

    // 执行新命令后清空重做栈
    this.redoStack = [];

    // 限制历史记录长度
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(-this.maxHistory);
    }

    console.log(`[CommandManager] Executed: ${command.description}`);
  }

  /**
   * 撤销
   */
  async undo(): Promise<boolean> {
    const command = this.history.pop();
    if (!command) return false;

    await command.undo();
    this.redoStack.push(command);

    console.log(`[CommandManager] Undone: ${command.description}`);
    return true;
  }

  /**
   * 重做
   */
  async redo(): Promise<boolean> {
    const command = this.redoStack.pop();
    if (!command) return false;

    await command.execute();
    this.history.push(command);

    console.log(`[CommandManager] Redone: ${command.description}`);
    return true;
  }

  /**
   * 是否可以撤销
   */
  canUndo(): boolean {
    return this.history.length > 0;
  }

  /**
   * 是否可以重做
   */
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /**
   * 清空历史
   */
  clear(): void {
    this.history = [];
    this.redoStack = [];
  }

  /**
   * 获取历史记录（用于调试）
   */
  getHistory(): Command[] {
    return [...this.history];
  }

  /**
   * 获取重做栈（用于调试）
   */
  getRedoStack(): Command[] {
    return [...this.redoStack];
  }
}

// 单例导出
export const commandManager = new CommandManagerImpl();
