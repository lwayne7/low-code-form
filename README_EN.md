# Low-Code Form Builder 🚀

[简体中文](./README.md)

A React + TypeScript low-code form builder featuring drag-and-drop, nested containers, responsive preview, validation rules, and code export.

## Recent fixes & optimizations (2026-01)

- **Collision detection hot path**: build per-call `id -> depth/rect` caches and use squared-distance sorting to reduce `find/sqrt` work and stabilize nested drop decisions (`src/utils/collisionDetection.ts`)
- **Shared DnD constants**: unify edge ratio and min edge height between collision detection and drag handlers (`src/constants/dnd.ts`, `src/hooks/useDragHandlers.ts`)
- **Theme consistency**: replace per-hook local state with a single Zustand store (system-theme `auto` + cross-tab sync) (`src/themeStore.ts`, `src/hooks/useTheme.ts`)
- **Virtualized list**: migrate to `react-window@2` `List` API, remove `@ts-nocheck`, and re-enable exports (`src/components/DragDrop/VirtualizedSortableList.tsx`)
- **Tooling & type safety**: move `trackRender` into a helper for Fast Refresh, tighten `formValues` from `any` to `unknown`, fix worker switch-case lint (`src/components/common/performanceTracking.ts`, `src/store.ts`, `src/workers/codeGenerator.worker.ts`)
- **Benchmarks & console tooling**: add `vitest bench` baseline benchmarks and expose `window.performanceTest` in dev for quick data generation/reports (`src/test/performance.bench.ts`, `src/utils/performanceTester.ts`)
- **Undo/redo patch history**: replace full-tree snapshots with patch entries + structural sharing to cut memory/GC; example (100 adds) serialized history size `~373KB → ~18KB` (~**-95%**) (`src/store.ts`, `src/utils/componentTreeOps.ts`, `src/components/common/HistoryPanel.tsx`)
- **Component registry + schema-driven property panel**: new `src/registry/componentRegistry.tsx` as a single source of truth (defaults/materials/panel schema); adding a component becomes mostly declarative (`src/utils/componentFactory.ts`, `src/constants/materials.tsx`, `src/components/PropertyPanel/index.tsx`)
- **Safe expressions**: replace `new Function` for `visibleOn` with a whitelisted AST parser + safe evaluator, plus inline validation in the property panel (`src/utils/expression.ts`, `src/components/CanvasFormItem.tsx`, `src/components/FormRenderer.tsx`, `src/components/PropertyPanel/LinkageConfig.tsx`)
- **Tracing + CI perf budgets**: instrument drag/code export and surface traces in the Performance Panel; add CI workflow (lint/test/build) and perf budget tests to guard regressions (`src/utils/tracing.ts`, `src/hooks/useDragHandlers.ts`, `src/features/Header/AppHeader.tsx`, `src/components/common/PerformancePanel.tsx`, `.github/workflows/ci.yml`, `src/test/perfBudget.test.ts`)
- **Header stats UI**: fix overflow/cropping for the form count chip across locales and ensure actions remain visible (`src/features/Header/AppHeader.tsx`)
- **Dark-mode readability**: improve contrast for property panel labels and config text in dark theme (`src/App.css`, `src/components/PropertyPanel/*`)
- **Canvas i18n**: align canvas labels and default texts with the i18n map to avoid mixed-language UI (`src/registry/componentRegistry.tsx`, `src/i18n/index.tsx`)

## Highlights

- Smart nested drag-and-drop based on pointer position + depth
- Virtualized rendering for large component counts
- Patch-based undo/redo (50 steps), templates, keyboard shortcuts
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
    expression.ts
    tracing.ts
  registry/
    componentRegistry.tsx
```

## Docs

- Chinese README: `README.md`
- Performance notes: `docs/PERFORMANCE.md`
- Testing guide: `docs/TESTING.md`

## License

MIT
