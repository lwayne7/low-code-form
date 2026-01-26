# Low-Code Form Builder 🚀

[简体中文](./README_CN.md)

A React + TypeScript low-code form builder featuring drag-and-drop, nested containers, responsive preview, validation rules, and code export.

## Recent fixes & optimizations (2026-01)

- **Collision detection hot path**: build per-call `id -> depth/rect` caches and use squared-distance sorting to reduce `find/sqrt` work and stabilize nested drop decisions (`src/utils/collisionDetection.ts`)
- **Shared DnD constants**: unify edge ratio and min edge height between collision detection and drag handlers (`src/constants/dnd.ts`, `src/hooks/useDragHandlers.ts`)
- **Theme consistency**: replace per-hook local state with a single Zustand store (system-theme `auto` + cross-tab sync) (`src/themeStore.ts`, `src/hooks/useTheme.ts`)
- **Virtualized list**: migrate to `react-window@2` `List` API, remove `@ts-nocheck`, and re-enable exports (`src/components/DragDrop/VirtualizedSortableList.tsx`)
- **Tooling & type safety**: move `trackRender` into a helper for Fast Refresh, tighten `formValues` from `any` to `unknown`, fix worker switch-case lint (`src/components/common/performanceTracking.ts`, `src/store.ts`, `src/workers/codeGenerator.worker.ts`)

## Highlights

- Smart nested drag-and-drop based on pointer position + depth
- Virtualized rendering for large component counts
- Undo/redo history (50 steps), templates, keyboard shortcuts
- Unit tests (Vitest) + E2E tests (Playwright) + Lighthouse CI

## Getting started

```bash
npm install
npm run dev
```

## Useful scripts

```bash
npm run lint
npm run test:run
npm run build
npm run test:e2e
```

## Project structure (partial)

```text
src/
  components/
    DragDrop/
      SortableList.tsx
      SortableItem.tsx
      VirtualizedSortableList.tsx
    common/
      PerformancePanel.tsx
      performanceTracking.ts
  constants/
    materials.tsx
    dnd.ts
  features/
  hooks/
    useDragHandlers.ts
    useTheme.ts
  themeStore.ts
  utils/
    collisionDetection.ts
```

## Docs

- Chinese README: `README_CN.md`
- Performance notes: `docs/PERFORMANCE.md`
- Testing guide: `docs/TESTING.md`

## License

MIT
