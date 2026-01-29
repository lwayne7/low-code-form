# 低代码表单构建器 🚀

[English](./README_EN.md) | 简体中文

一个基于 React + TypeScript 的**企业级低代码表单构建器**，支持拖拽配置、组件联动、无限嵌套、响应式布局和代码导出。

> 🎯 **项目特色**：采用现代前端最佳实践，具备完整的性能优化和测试体系，适合大厂实习面试展示

[![GitHub](https://img.shields.io/github/license/lwayne7/low-code-form)](https://github.com/lwayne7/low-code-form)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb)](https://react.dev/)
[![Test Coverage](https://img.shields.io/badge/coverage-70%25-green)](./docs/TESTING.md)

## ✨ 核心亮点

### 🎨 技术架构
- **React 19** + **TypeScript 5.9** - 最新技术栈
- **Zustand** - 轻量级状态管理（with persist）
- **@dnd-kit** - 现代化拖拽方案
- **Ant Design 6** - 企业级UI组件
- **Vite 7** - 极速构建工具
- **Express.js** - 后端 RESTful API（含 JWT 认证）
- **SQLite + Drizzle ORM** - 类型安全的数据持久化

### 🚀 性能优化
- ✅ **虚拟滚动**：支持1000+组件流畅渲染（FPS 55+）
- ✅ **自定义碰撞检测算法**：智能判断拖拽位置
- ✅ **React性能优化**：memo、useMemo、useCallback全覆盖
- ✅ **性能提升**：FPS +57%，内存 -50%（大数据量场景）

### 🛠️ 近期修复与优化（2026-01）
- ✅ **碰撞检测热路径优化**：为每次计算构建 `id -> depth/rect` 缓存，并使用“距离平方”排序，减少 `find/sqrt` 开销、提升嵌套拖拽稳定性（`src/utils/collisionDetection.ts`）
- ✅ **拖拽常量统一**：抽出 `CONTAINER_EDGE_RATIO`/`MIN_EDGE_HEIGHT`，保证碰撞检测与拖拽处理逻辑一致（`src/constants/dnd.ts`、`src/hooks/useDragHandlers.ts`）
- ✅ **主题不同步修复**：`useTheme` 改为全局 Zustand 单一数据源，支持 `auto` 跟随系统与跨标签页同步（`src/themeStore.ts`、`src/hooks/useTheme.ts`）
- ✅ **虚拟滚动类型修复**：适配 `react-window@2` 的 `List` API，去掉 `@ts-nocheck` 并重新启用导出（`src/components/DragDrop/VirtualizedSortableList.tsx`）
- ✅ **工程化与类型安全**：分离 `trackRender` 以兼容 Fast Refresh；`formValues` 从 `any` 收紧到 `unknown`；worker 中 `switch/case` 声明块修复 lint（`src/components/common/performanceTracking.ts`、`src/store.ts`、`src/workers/codeGenerator.worker.ts`）
- ✅ **性能基准与控制台工具**：新增 `vitest bench` 基准（`src/test/performance.bench.ts`）与开发环境控制台 `window.performanceTest`（`src/utils/performanceTester.ts`、`src/main.tsx`、`src/global.d.ts`）
- ✅ **Undo/Redo Patch 历史**：用“补丁记录 + 结构共享”替代整树快照，显著降低内存与 GC；示例（100 次添加）历史数据序列化大小 `~373KB → ~18KB`（约 **-95%**）（`src/store.ts`、`src/utils/componentTreeOps.ts`、`src/components/common/HistoryPanel.tsx`）
- ✅ **组件注册表 + schema 属性面板**：新增 `src/registry/componentRegistry.tsx` 统一维护组件默认配置/物料/属性面板 schema，新增组件基本只改声明（`src/utils/componentFactory.ts`、`src/constants/materials.tsx`、`src/components/PropertyPanel/index.tsx`）
- ✅ **表达式安全**：`visibleOn` 从 `new Function` 改为 AST 白名单解析 + 安全执行，并在属性面板实时校验，避免注入与运行时崩溃（`src/utils/expression.ts`、`src/components/CanvasFormItem.tsx`、`src/components/FormRenderer.tsx`、`src/components/PropertyPanel/LinkageConfig.tsx`）
- ✅ **Tracing + CI 性能预算**：拖拽/导出代码打点并在性能面板展示；新增 CI 工作流运行 lint/test/build，加入性能预算用例防回归（`src/utils/tracing.ts`、`src/hooks/useDragHandlers.ts`、`src/features/Header/AppHeader.tsx`、`src/components/common/PerformancePanel.tsx`、`.github/workflows/ci.yml`、`src/test/perfBudget.test.ts`）

### 🧪 完整测试体系
- ✅ **65个单元测试**：覆盖核心业务逻辑（Vitest）
- ✅ **21个E2E测试**：Playwright端到端测试
- ✅ **10+性能基准测试**：量化性能指标
- ✅ **Lighthouse CI**：自动化性能评分
- ✅ **覆盖率报告**：`npm run test:coverage`（HTML 输出到 `coverage/`）

### 💡 功能特性
- 🎨 可视化拖拽构建表单
- 📦 丰富的组件库（10+种组件）
- 🏗️ 容器支持无限嵌套
- ✅ 完整的表单校验（7种规则）
- 📱 响应式预览（桌面/平板/手机）
- 💾 自定义模板系统
- 🔐 组件锁定功能
- ⌨️ 完整的快捷键支持
- 📤 代码导出（React/JSON Schema）
- ⏱️ 撤销/重做（Patch 历史，50步）
- ☁️ 云端保存/加载（需后端服务）
- 🔑 用户认证（JWT）
- 🌐 国际化支持（中文/English）

## 📊 性能数据

### 大数据量场景（1000组件）

| 指标 | 优化前 | 优化后 | 提升 |
|-----|-------|-------|------|
| **FPS** | ~35 | ~55 | **+57%** |
| **内存占用** | ~80MB | ~40MB | **-50%** |
| **首屏渲染** | ~3s | ~1.5s | **-50%** |

### 操作性能

| 操作 | 数量 | 耗时 | 评级 |
|-----|------|------|------|
| 添加组件 | 100 | ~200ms | ⭐⭐⭐⭐⭐ |
| 添加组件 | 1000 | ~1.5s | ⭐⭐⭐⭐ |
| 删除组件（批量） | 100 | ~50ms | ⭐⭐⭐⭐⭐ |
| 撤销操作 | 50次 | ~300ms | ⭐⭐⭐⭐⭐ |

## 🚀 快速开始

### 安装依赖

```bash
npm install --legacy-peer-deps
```

### 启动开发

```bash
# 仅前端
npm run dev

# 前后端同时启动（推荐）
npm run server:install  # 首次需安装后端依赖
npm run dev:all
```

- 前端：http://localhost:5173
- 后端：http://localhost:3001

### 运行测试

```bash
# 单元测试
npm test
npm run test:coverage

# 性能基准测试
npm run bench

# E2E测试
npm run test:e2e
npm run test:e2e:ui

# Lighthouse性能测试
npm run lighthouse
```

## 📁 项目结构

```
low-code-form/
├── src/
│   ├── components/           # 组件
│   │   ├── DragDrop/        # 拖拽组件（含虚拟滚动）
│   │   ├── common/          # 通用组件
│   │   └── PropertyPanel/   # 属性配置面板
│   ├── features/            # UI 功能模块（Header/Preview/Sidebar/移动端）
│   ├── hooks/               # 自定义Hooks
│   ├── services/            # API 服务层（后端交互）
│   ├── utils/               # 工具函数
│   │   ├── collisionDetection.ts  # 碰撞检测算法
│   │   ├── codeGenerator.ts       # 代码生成器
│   │   ├── performanceTester.ts   # 性能测试工具（dev: window.performanceTest）
│   │   └── validation.ts          # 表单校验
│   ├── constants/           # 常量配置
│   │   └── dnd.ts            # 拖拽常量（edge ratio/min height）
│   ├── test/               # 单元测试/基准测试
│   │   └── performance.bench.ts   # 性能基准（vitest bench）
│   ├── store.ts            # Zustand状态管理
│   ├── themeStore.ts        # 主题状态（单一数据源）
│   └── types.ts            # TypeScript类型
├── server/                 # 后端服务
│   ├── src/
│   │   ├── db/             # 数据库（SQLite + Drizzle ORM）
│   │   ├── routes/         # API 路由（auth/forms）
│   │   ├── middleware/     # 中间件（JWT/错误处理）
│   │   └── index.ts        # Express 入口
│   └── package.json
├── e2e/                    # E2E测试
├── docs/                   # 文档
│   ├── PERFORMANCE.md     # 性能报告
│   ├── TESTING.md         # 测试指南
│   └── OPTIMIZATION_SUMMARY.md  # 优化总结
├── .github/
│   └── workflows/         # GitHub Actions
└── playwright.config.ts   # Playwright配置
```

## 🎯 技术亮点（面试重点）

### 1. 自定义碰撞检测算法 ⭐⭐⭐⭐⭐

**问题**：拖拽到嵌套容器时，如何智能判断是放入容器内部还是排序到容器前后？

**解决方案**：
```typescript
// src/constants/dnd.ts
export const CONTAINER_EDGE_RATIO = 0.25; // 上下各25%为边缘区域
export const MIN_EDGE_HEIGHT = 20;        // 小容器兜底边缘高度（px）

// src/utils/collisionDetection.ts
// - pointerWithin -> rectIntersection -> closestCenter 兜底
// - 深度优先 + 距离优先（距离使用平方，减少 sqrt）

// 优先级策略：
// 1. 非容器组件优先 - 用于精确插入位置
// 2. 容器处理：边缘区域→排序，中心区域→放入
// 3. 深度优先：优先选择最深层容器
// 4. 滞后区设计：防止边界抖动
```

**面试加分项**：展示了处理复杂交互逻辑的能力

### 2. 虚拟滚动优化 ⭐⭐⭐⭐⭐

**问题**：1000+组件时页面卡顿，FPS降至30

**解决方案**：
- 使用 react-window 实现虚拟列表
- 组件数量 > 50 时自动启用
- 只渲染可见区域（overscan: 5）
- 性能提升：FPS +57%，内存 -50%

### 3. React性能优化最佳实践 ⭐⭐⭐⭐

```typescript
// 自定义memo比较函数
const SortableList = React.memo(Component, (prev, next) => {
  // dropTarget深比较，避免引用变化触发不必要渲染
  if (prevDrop?.targetId === nextDrop?.targetId &&
      prevDrop?.position === nextDrop?.position) {
    return true;
  }
  return false;
});

// useMemo缓存计算
const itemIds = useMemo(() => items.map(c => c.id), [items]);

// useCallback缓存回调
const handleClick = useCallback((e) => {
  onSelect(component.id, e.metaKey || e.ctrlKey);
}, [component.id, onSelect]);
```

### 4. 完整的测试金字塔 ⭐⭐⭐⭐⭐

```
        E2E (21)      ← Playwright
       ┌────────┐
      ┌──────────┐
     ┌────────────┐
	    └──────────────┘
	     单元测试 (65)    ← Vitest
     
性能基准 (10+)       ← Vitest Bench
Lighthouse CI        ← 自动化
```

## 📚 文档

- 📖 [测试指南](./docs/TESTING.md) - 完整的测试使用说明
- 📊 [性能报告](./docs/PERFORMANCE.md) - 详细的性能数据和优化措施
- ✨ [优化总结](./docs/OPTIMIZATION_SUMMARY.md) - 本次优化的完整说明
- 🚀 [快速开始](./QUICK_START.md) - 5分钟上手指南
- 📋 [更新日志](./CHANGELOG.md) - 版本更新记录

## 🏆 适用场景

### ✅ 大厂实习面试（评分：90/100）

**优势**：
- 完整的技术栈（React 19 + TS 5.9）
- 自定义算法（碰撞检测）
- 性能优化实战（可量化指标）
- 完善的工程化（测试+CI/CD）

**适合公司**：
- 字节跳动/抖音 - 重视技术深度 ✅
- 阿里巴巴 - 重视工程化 ✅
- 腾讯 - 重视产品完整度 ✅
- 美团/快手 - 需补充后端 ⚠️

### ✅ 技术分享/开源项目

- 代码质量高，注释完善
- 文档齐全，易于上手
- 性能优化有亮点
- 测试覆盖完整

## 🎓 学习价值

通过这个项目，你可以学到：

1. **React最佳实践**
   - Hooks使用技巧
   - 性能优化方案
   - 组件设计模式

2. **复杂交互实现**
   - 拖拽排序
   - 嵌套容器
   - 碰撞检测算法

3. **状态管理**
   - Zustand使用
   - 持久化方案
   - 撤销/重做实现

4. **工程化能力**
   - TypeScript类型设计
   - 单元测试编写
   - E2E测试实践
   - 性能监控和优化

5. **代码生成**
   - AST理解
   - 模板引擎
   - JSON Schema

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

---

## 🌟 Star History

如果这个项目对你有帮助，请给个Star⭐！

## 📧 联系方式

- GitHub: [@lwayne7](https://github.com/lwayne7)
- 项目地址: [low-code-form](https://github.com/lwayne7/low-code-form)

---

**最后更新**: 2026-01-29  
**当前版本**: v2.8.0  
**自动化测试**: 单元 65 + E2E 21  
**性能基准**: 10+（Vitest Bench）
