import type { ComponentType } from '../types';
import { getAllComponentDefinitions } from '../registry/componentRegistry';

export interface ComponentMaterial {
  type: ComponentType;
  label: string;
  icon: React.ReactNode;
}

// 组件材料列表（从组件注册表派生）
export const COMPONENT_MATERIALS: ComponentMaterial[] = getAllComponentDefinitions().map((def) => ({
  type: def.type,
  label: def.label,
  icon: def.icon,
}));

// 组件类型到中文名称的映射（从组件注册表派生）
export const COMPONENT_TYPE_LABELS: Record<ComponentType, string> = getAllComponentDefinitions().reduce(
  (acc, def) => {
    acc[def.type] = def.label;
    return acc;
  },
  {} as Record<ComponentType, string>
);
