/**
 * 组件默认配置工厂
 * 集中管理各组件类型的默认配置
 */

import { nanoid } from 'nanoid';
import type { ComponentSchema, ComponentType } from '../types';
import { getComponentDefinition } from '../registry/componentRegistry';

/**
 * 创建新组件实例
 */
export function createComponent(type: ComponentType): ComponentSchema | null {
  const def = getComponentDefinition(type);
  if (!def) return null;

  const config = def.createDefault();
  return {
    id: nanoid(),
    ...config,
  } as ComponentSchema;
}

/**
 * 深拷贝组件并重新生成 ID
 */
export function cloneComponentWithNewId(component: ComponentSchema): ComponentSchema {
  return {
    ...component,
    id: nanoid(),
    props: { ...component.props },
    children: component.children?.map(cloneComponentWithNewId),
  } as ComponentSchema;
}
