/**
 * Feature Flag - 功能开关系统
 *
 * 面试考点：
 * 1. A/B 测试基础设施
 * 2. 灰度发布策略
 * 3. 条件判断逻辑
 * 4. 本地存储持久化
 * 5. 远程配置拉取
 *
 * @example
 * ```tsx
 * // 检查功能是否启用
 * if (featureFlags.isEnabled('new-editor')) {
 *   return <NewEditor />;
 * }
 *
 * // 带上下文的检查
 * if (featureFlags.isEnabled('premium-feature', { userId: user.id })) {
 *   return <PremiumFeature />;
 * }
 *
 * // React Hook
 * const { isEnabled, variant } = useFeatureFlag('experiment-ui');
 * ```
 */

import { useState, useEffect, useCallback } from 'react';

// ============ 类型定义 ============

export interface FeatureFlag {
  /** 功能标识 */
  key: string;
  /** 是否启用 */
  enabled: boolean;
  /** 功能描述 */
  description?: string;
  /** 灰度比例 (0-100) */
  percentage?: number;
  /** 启用条件 */
  conditions?: FeatureFlagCondition[];
  /** A/B 测试变体 */
  variants?: FeatureFlagVariant[];
  /** 默认变体 */
  defaultVariant?: string;
  /** 过期时间 */
  expiresAt?: number;
  /** 元数据 */
  metadata?: Record<string, unknown>;
}

export interface FeatureFlagCondition {
  /** 条件类型 */
  type: 'userId' | 'userGroup' | 'environment' | 'custom';
  /** 操作符 */
  operator: 'equals' | 'notEquals' | 'contains' | 'startsWith' | 'endsWith' | 'in' | 'notIn';
  /** 字段名（用于 custom 类型） */
  field?: string;
  /** 比较值 */
  value: string | string[] | number | boolean;
}

export interface FeatureFlagVariant {
  /** 变体标识 */
  key: string;
  /** 变体名称 */
  name: string;
  /** 变体权重 (0-100) */
  weight: number;
  /** 变体配置 */
  payload?: Record<string, unknown>;
}

export interface FeatureFlagContext {
  userId?: string;
  userGroup?: string;
  environment?: string;
  [key: string]: unknown;
}

export interface FeatureFlagResult {
  enabled: boolean;
  variant?: string;
  payload?: Record<string, unknown>;
}

// ============ 存储键 ============

const STORAGE_KEY = 'lowcode_feature_flags';
const VARIANT_STORAGE_KEY = 'lowcode_feature_variants';

// ============ 默认功能标志 ============

const DEFAULT_FLAGS: FeatureFlag[] = [
  {
    key: 'virtual-scroll',
    enabled: true,
    description: '虚拟滚动优化，大量组件时自动启用',
    conditions: [],
  },
  {
    key: 'dark-mode',
    enabled: true,
    description: '暗色模式支持',
  },
  {
    key: 'advanced-validation',
    enabled: true,
    description: '高级表单校验规则',
  },
  {
    key: 'experimental-drag',
    enabled: false,
    description: '实验性拖拽优化',
    percentage: 10,
  },
  {
    key: 'cloud-sync',
    enabled: true,
    description: '云端同步功能',
    conditions: [{ type: 'environment', operator: 'notEquals', value: 'test' }],
  },
  {
    key: 'new-property-panel',
    enabled: false,
    description: '新版属性面板 UI',
    percentage: 0,
    variants: [
      { key: 'control', name: '对照组', weight: 50 },
      { key: 'treatment', name: '实验组', weight: 50 },
    ],
    defaultVariant: 'control',
  },
];

// ============ 工具函数 ============

/**
 * 生成稳定的用户哈希（用于灰度分配）
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * 根据百分比判断是否命中
 */
function isInPercentage(userId: string, flagKey: string, percentage: number): boolean {
  if (percentage <= 0) return false;
  if (percentage >= 100) return true;

  const hash = hashString(`${userId}:${flagKey}`);
  return hash % 100 < percentage;
}

/**
 * 根据权重选择变体
 */
function selectVariant(
  userId: string,
  flagKey: string,
  variants: FeatureFlagVariant[]
): FeatureFlagVariant | undefined {
  if (variants.length === 0) return undefined;

  const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
  if (totalWeight === 0) return variants[0];

  const hash = hashString(`${userId}:${flagKey}:variant`);
  let target = hash % totalWeight;

  for (const variant of variants) {
    target -= variant.weight;
    if (target < 0) return variant;
  }

  return variants[0];
}

/**
 * 评估条件
 */
function evaluateCondition(condition: FeatureFlagCondition, context: FeatureFlagContext): boolean {
  let fieldValue: unknown;

  switch (condition.type) {
    case 'userId':
      fieldValue = context.userId;
      break;
    case 'userGroup':
      fieldValue = context.userGroup;
      break;
    case 'environment':
      fieldValue = context.environment || import.meta.env.MODE;
      break;
    case 'custom':
      fieldValue = condition.field ? context[condition.field] : undefined;
      break;
    default:
      return true;
  }

  switch (condition.operator) {
    case 'equals':
      return fieldValue === condition.value;
    case 'notEquals':
      return fieldValue !== condition.value;
    case 'contains':
      return String(fieldValue).includes(String(condition.value));
    case 'startsWith':
      return String(fieldValue).startsWith(String(condition.value));
    case 'endsWith':
      return String(fieldValue).endsWith(String(condition.value));
    case 'in':
      return Array.isArray(condition.value) && condition.value.includes(fieldValue as string);
    case 'notIn':
      return Array.isArray(condition.value) && !condition.value.includes(fieldValue as string);
    default:
      return true;
  }
}

// ============ Feature Flag Manager ============

class FeatureFlagManager {
  private flags = new Map<string, FeatureFlag>();
  private userVariants = new Map<string, string>();
  private context: FeatureFlagContext = {};
  private listeners = new Set<() => void>();
  private remoteEndpoint?: string;

  constructor() {
    this.loadFromStorage();
    this.initDefaultFlags();
  }

  /**
   * 从本地存储加载
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const flags: FeatureFlag[] = JSON.parse(stored);
        flags.forEach((flag) => this.flags.set(flag.key, flag));
      }

      const variants = localStorage.getItem(VARIANT_STORAGE_KEY);
      if (variants) {
        const parsed: Record<string, string> = JSON.parse(variants);
        Object.entries(parsed).forEach(([key, value]) => {
          this.userVariants.set(key, value);
        });
      }
    } catch (error) {
      console.warn('[FeatureFlags] Failed to load from storage:', error);
    }
  }

  /**
   * 初始化默认标志
   */
  private initDefaultFlags(): void {
    DEFAULT_FLAGS.forEach((flag) => {
      if (!this.flags.has(flag.key)) {
        this.flags.set(flag.key, flag);
      }
    });
  }

  /**
   * 保存到本地存储
   */
  private saveToStorage(): void {
    try {
      const flags = Array.from(this.flags.values());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(flags));

      const variants = Object.fromEntries(this.userVariants);
      localStorage.setItem(VARIANT_STORAGE_KEY, JSON.stringify(variants));
    } catch (error) {
      console.warn('[FeatureFlags] Failed to save to storage:', error);
    }
  }

  /**
   * 通知监听者
   */
  private notify(): void {
    this.listeners.forEach((listener) => listener());
  }

  /**
   * 设置全局上下文
   */
  setContext(context: FeatureFlagContext): void {
    this.context = { ...this.context, ...context };
    this.notify();
  }

  /**
   * 清除上下文
   */
  clearContext(): void {
    this.context = {};
    this.notify();
  }

  /**
   * 配置远程端点
   */
  setRemoteEndpoint(endpoint: string): void {
    this.remoteEndpoint = endpoint;
  }

  /**
   * 从远程拉取配置
   */
  async fetchRemote(): Promise<void> {
    if (!this.remoteEndpoint) return;

    try {
      const response = await fetch(this.remoteEndpoint);
      if (response.ok) {
        const flags: FeatureFlag[] = await response.json();
        flags.forEach((flag) => this.flags.set(flag.key, flag));
        this.saveToStorage();
        this.notify();
      }
    } catch (error) {
      console.warn('[FeatureFlags] Failed to fetch remote config:', error);
    }
  }

  /**
   * 注册功能标志
   */
  register(flag: FeatureFlag): void {
    this.flags.set(flag.key, flag);
    this.saveToStorage();
    this.notify();
  }

  /**
   * 批量注册功能标志
   */
  registerAll(flags: FeatureFlag[]): void {
    flags.forEach((flag) => this.flags.set(flag.key, flag));
    this.saveToStorage();
    this.notify();
  }

  /**
   * 获取功能标志
   */
  getFlag(key: string): FeatureFlag | undefined {
    return this.flags.get(key);
  }

  /**
   * 获取所有功能标志
   */
  getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }

  /**
   * 检查功能是否启用
   */
  isEnabled(key: string, context?: FeatureFlagContext): boolean {
    return this.evaluate(key, context).enabled;
  }

  /**
   * 评估功能标志
   */
  evaluate(key: string, context?: FeatureFlagContext): FeatureFlagResult {
    const flag = this.flags.get(key);
    const mergedContext = { ...this.context, ...context };

    // 默认禁用
    if (!flag) {
      return { enabled: false };
    }

    // 检查过期
    if (flag.expiresAt && Date.now() > flag.expiresAt) {
      return { enabled: false };
    }

    // 检查基本开关
    if (!flag.enabled) {
      return { enabled: false };
    }

    // 评估条件
    if (flag.conditions && flag.conditions.length > 0) {
      const allConditionsMet = flag.conditions.every((cond) =>
        evaluateCondition(cond, mergedContext)
      );
      if (!allConditionsMet) {
        return { enabled: false };
      }
    }

    // 检查灰度百分比
    if (flag.percentage !== undefined && flag.percentage < 100) {
      const userId = mergedContext.userId || 'anonymous';
      if (!isInPercentage(userId, key, flag.percentage)) {
        return { enabled: false };
      }
    }

    // 处理变体
    let variant: string | undefined;
    let payload: Record<string, unknown> | undefined;

    if (flag.variants && flag.variants.length > 0) {
      const userId = mergedContext.userId || 'anonymous';

      // 优先使用已分配的变体
      const existingVariant = this.userVariants.get(`${userId}:${key}`);
      if (existingVariant) {
        variant = existingVariant;
        payload = flag.variants.find((v) => v.key === variant)?.payload;
      } else {
        // 分配新变体
        const selected = selectVariant(userId, key, flag.variants);
        if (selected) {
          variant = selected.key;
          payload = selected.payload;
          this.userVariants.set(`${userId}:${key}`, variant);
          this.saveToStorage();
        }
      }
    }

    return { enabled: true, variant, payload };
  }

  /**
   * 手动覆盖功能状态（用于测试）
   */
  override(key: string, enabled: boolean): void {
    const flag = this.flags.get(key);
    if (flag) {
      this.flags.set(key, { ...flag, enabled });
      this.saveToStorage();
      this.notify();
    }
  }

  /**
   * 重置功能标志
   */
  reset(key: string): void {
    const defaultFlag = DEFAULT_FLAGS.find((f) => f.key === key);
    if (defaultFlag) {
      this.flags.set(key, { ...defaultFlag });
      this.saveToStorage();
      this.notify();
    }
  }

  /**
   * 订阅变更
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * 获取快照（用于 useSyncExternalStore）
   */
  getSnapshot(): Map<string, FeatureFlag> {
    return this.flags;
  }
}

// 导出单例
export const featureFlags = new FeatureFlagManager();

// ============ React Hooks ============

/**
 * 使用功能标志 Hook
 */
export function useFeatureFlag(key: string, context?: FeatureFlagContext): FeatureFlagResult {
  const subscribe = useCallback(
    (onStoreChange: () => void) => featureFlags.subscribe(onStoreChange),
    []
  );

  const getSnapshot = useCallback(() => featureFlags.evaluate(key, context), [key, context]);

  // 使用 useSyncExternalStore 确保并发安全
  const [result, setResult] = useState(() => getSnapshot());

  useEffect(() => {
    const unsubscribe = subscribe(() => {
      setResult(getSnapshot());
    });
    return unsubscribe;
  }, [subscribe, getSnapshot]);

  return result;
}

/**
 * 使用所有功能标志 Hook
 */
export function useAllFeatureFlags(): FeatureFlag[] {
  const [flags, setFlags] = useState(() => featureFlags.getAllFlags());

  useEffect(() => {
    const unsubscribe = featureFlags.subscribe(() => {
      setFlags(featureFlags.getAllFlags());
    });
    return unsubscribe;
  }, []);

  return flags;
}

/**
 * Feature Flag 条件渲染组件
 */
export function Feature({
  flag,
  context,
  children,
  fallback = null,
}: {
  flag: string;
  context?: FeatureFlagContext;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}): React.ReactNode {
  const { enabled } = useFeatureFlag(flag, context);
  return enabled ? children : fallback;
}
