/**
 * 历史记录序列化大小基准测试
 *
 * 对比两种 undo/redo 方案在 100 次添加操作后的内存占用：
 *   - Snapshot 方案：每步保存完整组件树快照
 *   - Patch 方案（当前实现）：每步只保存 insert/delete 等差量补丁
 *
 * 用于验证 README 中 "~482KB → ~23KB（-95%）" 的声明。
 */
import { describe, bench } from 'vitest';
import type { ComponentSchema } from '../types';
import type { HistoryEntry } from '../store';
import type { ComponentInsert } from '../utils/componentTreeOps';

/* ---------- helpers ---------- */

/**
 * 模拟真实的 createComponent('Input') 输出。
 * 实际默认 props 只有 label + placeholder（见 componentRegistry.tsx）。
 */
function createInput(id: string): ComponentSchema {
  return {
    id,
    type: 'Input',
    props: { label: `输入框 ${id}`, placeholder: '请输入' },
  };
}

function byteSize(obj: unknown): number {
  return new TextEncoder().encode(JSON.stringify(obj)).byteLength;
}

/* ---------- 模拟 100 次添加 ---------- */

const STEPS = 100;

// Snapshot 方案：每步记录完整组件树
function buildSnapshotHistory(): ComponentSchema[][] {
  const snapshots: ComponentSchema[][] = [];
  const tree: ComponentSchema[] = [];
  for (let i = 0; i < STEPS; i++) {
    tree.push(createInput(`input-${i}`));
    snapshots.push(structuredClone(tree));
  }
  return snapshots;
}

// Patch 方案（当前实现）：每步只记录 insert 补丁
function buildPatchHistory(): HistoryEntry[] {
  const entries: HistoryEntry[] = [];
  for (let i = 0; i < STEPS; i++) {
    const component = createInput(`input-${i}`);
    const insert: ComponentInsert = {
      component,
      location: { parentId: null, index: i },
    };
    entries.push({
      kind: 'insert',
      label: `添加 Input input-${i}`,
      timestamp: Date.now(),
      inserts: [insert],
    });
  }
  return entries;
}

const snapshotHistory = buildSnapshotHistory();
const patchHistory = buildPatchHistory();

const snapshotBytes = byteSize(snapshotHistory);
const patchBytes = byteSize(patchHistory);
const reduction = ((1 - patchBytes / snapshotBytes) * 100).toFixed(1);

/* ---------- bench ---------- */

describe('history serialization size (100 inserts)', () => {
  bench(
    `snapshot: ${(snapshotBytes / 1024).toFixed(1)}KB | patch: ${(patchBytes / 1024).toFixed(1)}KB | -${reduction}%`,
    () => {
      // 此 bench 仅用于在报告中展示数据，序列化开销可忽略
      JSON.stringify(patchHistory);
    }
  );

  bench('snapshot serialize', () => {
    JSON.stringify(snapshotHistory);
  });

  bench('patch serialize', () => {
    JSON.stringify(patchHistory);
  });
});

describe('history size assertion', () => {
  bench('patch history should be >90% smaller than snapshot history', () => {
    // 验证 patch 方案体积显著小于 snapshot
    if (patchBytes >= snapshotBytes * 0.1) {
      throw new Error(`Patch (${patchBytes}) should be <10% of snapshot (${snapshotBytes})`);
    }
  });
});
