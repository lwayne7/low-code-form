# 优化与工程化总结

本文档聚焦项目**已落地**的性能、架构、稳定性与工程化改进，并与当前实现保持一致。

- 性能数据与基准：`docs/PERFORMANCE.md`
- 测试与 CI：`docs/TESTING.md`

---

## 1. 交互性能：大规模渲染与嵌套拖拽

### 1.1 虚拟滚动（大量组件渲染）

当画布组件数量较多时，使用虚拟列表减少 DOM 节点与渲染开销：

- 自动启用阈值：组件数量 > 50
- 只渲染可见区域（`overscan`）
- 兼容拖拽排序与嵌套容器

相关实现：
- `src/components/DragDrop/VirtualizedSortableList.tsx`

### 1.2 碰撞检测：深度优先 + 边缘/中心判定 + 热路径缓存

嵌套容器拖拽的核心难点是：指针位置同时命中多个容器时，如何稳定地决定“插入到容器前后”还是“放入容器内部”。

当前策略：
- 指针命中优先：`pointerWithin` → `rectIntersection` → `closestCenter` 兜底
- 容器边缘/中心区：边缘区域倾向“排序插入”，中心区域倾向“放入容器”
- 深度优先：更深层容器优先（更符合用户直觉）
- 热路径优化：为每次计算构建 `id -> depth/rect` 缓存，距离排序使用“距离平方”减少 `sqrt`/多次查找

相关实现：
- `src/utils/collisionDetection.ts`
- `src/hooks/useDragHandlers.ts`

### 1.3 拖拽常量统一

为避免“碰撞检测逻辑”和“拖拽处理逻辑”对边缘判定不一致，抽出统一常量：

- `CONTAINER_EDGE_RATIO`
- `MIN_EDGE_HEIGHT`

相关实现：
- `src/constants/dnd.ts`

---

## 2. Undo/Redo：Patch 历史 + 结构共享

从“整树快照”切换到“补丁记录（patch）+ 结构共享”：

- 显著降低历史记录内存占用与 GC 压力
- 细粒度记录变更，更利于调试与扩展

量化示例（100 次添加操作）：
- 历史数据序列化大小 `~373KB → ~18KB`（约 **-95%**）

相关实现：
- `src/store.ts`
- `src/utils/componentTreeOps.ts`
- `src/components/common/HistoryPanel.tsx`

---

## 3. 组件扩展性：组件注册表 + schema 驱动属性面板

为降低“新增组件”成本，引入统一注册表与 schema 化属性面板：

- 组件默认值、物料区展示、属性面板配置集中维护
- 新增组件以“声明”为主，避免到处改 switch/if
- 属性面板可按 schema 渲染，具备更好的可组合性与可扩展性

相关实现：
- `src/registry/componentRegistry.tsx`
- `src/components/PropertyPanel/index.tsx`
- `src/constants/materials.tsx`
- `src/utils/componentFactory.ts`

---

## 4. 表达式安全：`visibleOn` AST 白名单 + 校验

将联动表达式从 `new Function` 改为 AST 白名单解析与安全执行：

- 防止注入风险
- 提前做语法/类型校验，减少运行时崩溃
- 在属性面板内联提示错误，提高可用性

相关实现：
- `src/utils/expression.ts`
- `src/components/FormRenderer.tsx`
- `src/components/CanvasFormItem.tsx`
- `src/components/PropertyPanel/LinkageConfig.tsx`

---

## 5. 稳定性与可观测性：Tracing + CI 防回归

### 5.1 Tracing 与性能面板

对关键交互（例如拖拽、代码导出）做埋点，结合性能面板展示关键指标（FPS、渲染次数、内存等），用于定位性能问题与回归。

相关实现：
- `src/utils/tracing.ts`
- `src/components/common/PerformancePanel.tsx`

### 5.2 CI：lint/test/build + Lighthouse CI

仓库包含两类工作流：
- `ci.yml`：lint + 单测 + build（包含性能预算用例，防止关键指标回退）
- `lighthouse-ci.yml`：运行 Lighthouse CI 并上传报告 artifacts

相关实现：
- `.github/workflows/ci.yml`
- `.github/workflows/lighthouse-ci.yml`
- `src/test/perfBudget.test.ts`

---

## 6. UI/可用性修复（2026-01）

- Header 统计信息在中英文环境下溢出/裁切修复，保证操作按钮可见：`src/features/Header/AppHeader.tsx`
- 暗色模式对比度与文字可见性提升：`src/App.css`、`src/components/PropertyPanel/*`
- 画布组件名称与默认文案的国际化对齐，避免中英文混用：`src/registry/componentRegistry.tsx`、`src/i18n/index.tsx`

---

## 如何验证

```bash
# 代码质量
npm run lint

# 单元测试（CI 模式）
npm run test:run

# 构建
npm run build

# 性能基准（vitest bench）
npm run bench

# E2E（Playwright）
npm run test:e2e

# Lighthouse（可选）
npm run lighthouse
```

---

## 文档结构

```text
docs/
  OPTIMIZATIONS.md   # 本文档
  PERFORMANCE.md     # 性能测试报告与指标
  TESTING.md         # 测试体系与 CI 说明
```

**最后更新**：2026-01-29
