import { bench, describe } from 'vitest';
import type { ComponentSchema } from '../types';
import {
  countComponents,
  findComponentById,
  findParentInfo,
  flattenComponents,
  getAllComponentIds,
  isDescendant,
} from '../utils/componentHelpers';

function createInput(id: string): ComponentSchema {
  return {
    id,
    type: 'Input',
    props: { label: `Input ${id}`, placeholder: '' },
  };
}

function createContainer(id: string, children: ComponentSchema[]): ComponentSchema {
  return {
    id,
    type: 'Container',
    props: { label: `Container ${id}`, direction: 'vertical' },
    children,
  };
}

function buildFlat(count: number): ComponentSchema[] {
  const result: ComponentSchema[] = [];
  for (let i = 0; i < count; i++) result.push(createInput(`input-${i}`));
  return result;
}

function buildNested(depth: number, breadth: number): ComponentSchema[] {
  const safeDepth = Math.max(1, Math.floor(depth));
  const safeBreadth = Math.max(1, Math.floor(breadth));

  const build = (level: number, path: string): ComponentSchema => {
    if (level <= 1) {
      const children: ComponentSchema[] = [];
      for (let i = 0; i < safeBreadth; i++) children.push(createInput(`input-${path}-${i}`));
      return createContainer(`container-${path}`, children);
    }

    const children: ComponentSchema[] = [];
    for (let i = 0; i < safeBreadth; i++) children.push(build(level - 1, `${path}-${i}`));
    return createContainer(`container-${path}`, children);
  };

  return [build(safeDepth, 'root')];
}

const flat1000 = buildFlat(1000);
const nested5x3 = buildNested(5, 3); // 3^5 = 243 leaves + containers
const nestedDeepId = 'input-root-0-0-0-0-0';

describe('performance - componentHelpers (baseline)', () => {
  bench('flattenComponents - flat (1000)', () => {
    flattenComponents(flat1000);
  });

  bench('flattenComponents - nested (5x3)', () => {
    flattenComponents(nested5x3);
  });

  bench('countComponents - flat (1000)', () => {
    countComponents(flat1000);
  });

  bench('countComponents - nested (5x3)', () => {
    countComponents(nested5x3);
  });

  bench('getAllComponentIds - flat (1000)', () => {
    getAllComponentIds(flat1000);
  });

  bench('getAllComponentIds - nested (5x3)', () => {
    getAllComponentIds(nested5x3);
  });

  bench('findComponentById - flat (hit last)', () => {
    findComponentById(flat1000, 'input-999');
  });

  bench('findComponentById - nested (deep hit)', () => {
    findComponentById(nested5x3, nestedDeepId);
  });

  bench('findParentInfo - nested (deep hit)', () => {
    findParentInfo(nested5x3, nestedDeepId);
  });

  bench('isDescendant - nested (hit)', () => {
    isDescendant(nested5x3, 'container-root', nestedDeepId);
  });

  bench('findComponentById - nested (miss)', () => {
    findComponentById(nested5x3, 'non-existent');
  });
});
