import type { ComponentSchema } from '../types';

export type ComponentLocation = {
  parentId: string | null;
  index: number;
};

export type ComponentInsert = {
  component: ComponentSchema;
  location: ComponentLocation;
};

export type RemoveResult = {
  components: ComponentSchema[];
  removed: ComponentInsert[];
};

function clampIndex(index: number, length: number) {
  if (index < 0) return 0;
  if (index > length) return length;
  return index;
}

function insertIntoArray<T>(list: T[], item: T, index: number) {
  const safeIndex = clampIndex(index, list.length);
  const next = list.slice();
  next.splice(safeIndex, 0, item);
  return { list: next, index: safeIndex };
}

type InsertTraverseResult = {
  components: ComponentSchema[];
  inserted: boolean;
  insertedIndex?: number;
};

function insertIntoTree(
  components: ComponentSchema[],
  parentId: string,
  component: ComponentSchema,
  index: number
): InsertTraverseResult {
  let inserted = false;
  let insertedIndex: number | undefined;

  const next = components.map((node) => {
    if (inserted) return node;

    if (node.id === parentId && node.type === 'Container') {
      const children = node.children ?? [];
      const result = insertIntoArray(children, component, index);
      inserted = true;
      insertedIndex = result.index;
      return { ...node, children: result.list };
    }

    if (node.children && node.children.length > 0) {
      const childResult = insertIntoTree(node.children, parentId, component, index);
      if (childResult.inserted) {
        inserted = true;
        insertedIndex = childResult.insertedIndex;
        const nextChildren = childResult.components;
        if (node.type === 'Container') return { ...node, children: nextChildren };
        return { ...node, children: nextChildren.length > 0 ? nextChildren : undefined };
      }
    }

    return node;
  });

  if (!inserted) return { components, inserted: false };
  return { components: next, inserted: true, insertedIndex };
}

export function insertComponent(
  components: ComponentSchema[],
  component: ComponentSchema,
  location: ComponentLocation
): { components: ComponentSchema[]; insertedIndex: number } {
  const { parentId, index } = location;

  if (parentId === null) {
    const result = insertIntoArray(components, component, index);
    return { components: result.list, insertedIndex: result.index };
  }

  const traverse = insertIntoTree(components, parentId, component, index);
  if (!traverse.inserted || typeof traverse.insertedIndex !== 'number') {
    return { components, insertedIndex: -1 };
  }
  return { components: traverse.components, insertedIndex: traverse.insertedIndex };
}

type RemoveTraverseResult = {
  components: ComponentSchema[];
  removed: ComponentInsert[];
  changed: boolean;
};

function removeFromTree(
  components: ComponentSchema[],
  idsToRemove: ReadonlySet<string>,
  parentId: string | null
): RemoveTraverseResult {
  let changed = false;
  const removed: ComponentInsert[] = [];
  const next: ComponentSchema[] = [];

  components.forEach((node, index) => {
    if (idsToRemove.has(node.id)) {
      removed.push({ component: node, location: { parentId, index } });
      changed = true;
      return;
    }

    if (node.children && node.children.length > 0) {
      const childResult = removeFromTree(node.children, idsToRemove, node.id);
      if (childResult.changed) {
        changed = true;
        removed.push(...childResult.removed);
        const nextChildren = childResult.components;
        if (node.type === 'Container') {
          next.push({ ...node, children: nextChildren });
        } else {
          next.push({ ...node, children: nextChildren.length > 0 ? nextChildren : undefined });
        }
        return;
      }
    }

    next.push(node);
  });

  if (!changed) return { components, removed: [], changed: false };
  return { components: next, removed, changed: true };
}

export function removeComponentsByIds(
  components: ComponentSchema[],
  idsToRemove: ReadonlySet<string>
): RemoveResult {
  const result = removeFromTree(components, idsToRemove, null);
  if (!result.changed) return { components, removed: [] };
  return { components: result.components, removed: result.removed };
}

type UpdateResult = {
  components: ComponentSchema[];
  prevProps?: ComponentSchema['props'];
  nextProps?: ComponentSchema['props'];
  changed: boolean;
};

function updatePropsInTree(
  components: ComponentSchema[],
  targetId: string,
  patch: Partial<ComponentSchema['props']>
): UpdateResult {
  let changed = false;
  let prevProps: ComponentSchema['props'] | undefined;
  let nextProps: ComponentSchema['props'] | undefined;

  const next = components.map((node) => {
    if (changed) return node;

    if (node.id === targetId) {
      prevProps = node.props;
      nextProps = { ...node.props, ...patch } as ComponentSchema['props'];
      changed = true;
      return { ...node, props: nextProps } as ComponentSchema;
    }

    if (node.children && node.children.length > 0) {
      const childResult = updatePropsInTree(node.children, targetId, patch);
      if (childResult.changed) {
        changed = true;
        prevProps = childResult.prevProps;
        nextProps = childResult.nextProps;
        const nextChildren = childResult.components;
        if (node.type === 'Container') return { ...node, children: nextChildren };
        return { ...node, children: nextChildren.length > 0 ? nextChildren : undefined };
      }
    }

    return node;
  });

  if (!changed) return { components, changed: false };
  return { components: next, prevProps, nextProps, changed: true };
}

export function updateComponentProps(
  components: ComponentSchema[],
  targetId: string,
  patch: Partial<ComponentSchema['props']>
): { components: ComponentSchema[]; prevProps?: ComponentSchema['props']; nextProps?: ComponentSchema['props'] } {
  const result = updatePropsInTree(components, targetId, patch);
  return { components: result.components, prevProps: result.prevProps, nextProps: result.nextProps };
}

type ReplacePropsResult = {
  components: ComponentSchema[];
  replaced: boolean;
};

function replacePropsInTree(
  components: ComponentSchema[],
  targetId: string,
  props: ComponentSchema['props']
): ReplacePropsResult {
  let replaced = false;

  const next = components.map((node) => {
    if (replaced) return node;

    if (node.id === targetId) {
      replaced = true;
      return { ...node, props } as ComponentSchema;
    }

    if (node.children && node.children.length > 0) {
      const child = replacePropsInTree(node.children, targetId, props);
      if (child.replaced) {
        replaced = true;
        const nextChildren = child.components;
        if (node.type === 'Container') return { ...node, children: nextChildren };
        return { ...node, children: nextChildren.length > 0 ? nextChildren : undefined };
      }
    }

    return node;
  });

  if (!replaced) return { components, replaced: false };
  return { components: next, replaced: true };
}

export function replaceComponentProps(
  components: ComponentSchema[],
  targetId: string,
  props: ComponentSchema['props']
): { components: ComponentSchema[]; replaced: boolean } {
  return replacePropsInTree(components, targetId, props);
}

export function moveComponent(
  components: ComponentSchema[],
  targetId: string,
  to: ComponentLocation
): { components: ComponentSchema[]; moved?: { component: ComponentSchema; from: ComponentLocation; to: ComponentLocation } } {
  // 1) Remove
  const removeResult = removeComponentsByIds(components, new Set([targetId]));
  const movedRecord = removeResult.removed.find((r) => r.component.id === targetId);
  if (!movedRecord) return { components };

  const from = movedRecord.location;
  const component = movedRecord.component;

  const insertResult = insertComponent(removeResult.components, component, {
    parentId: to.parentId,
    index: to.index,
  });

  // If insertion failed (e.g., target container missing), roll back to original location.
  if (insertResult.insertedIndex === -1) {
    return { components: insertComponent(removeResult.components, component, from).components };
  }

  const actualTo: ComponentLocation = {
    parentId: to.parentId,
    index: insertResult.insertedIndex === -1 ? to.index : insertResult.insertedIndex,
  };

  return {
    components: insertResult.components,
    moved: { component, from, to: actualTo },
  };
}
