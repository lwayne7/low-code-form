# 性能测试报告

## 📊 性能基准测试

### 测试环境
- **设备**: MacBook Pro M1
- **浏览器**: Chrome 120+
- **测试时间**: 2026年1月（持续维护）

### 基准测试结果

| 测试场景 | 组件数量 | 渲染时间 | 内存占用 | FPS |
|---------|---------|---------|---------|-----|
| 小规模 | 100 | ~200ms | ~5MB | 60 |
| 中规模 | 500 | ~800ms | ~20MB | 58 |
| 大规模 | 1000 | ~1.5s | ~40MB | 55 |
| 深度嵌套（5层） | 243 | ~500ms | ~12MB | 59 |
| 深度嵌套（10层） | 2046 | ~2s | ~50MB | 50 |

### 操作性能

| 操作类型 | 数量 | 耗时 | 备注 |
|---------|-----|------|------|
| 添加组件 | 100个 | ~1.2s | 批量添加 |
| 删除组件 | 100个（批量） | ~50ms | 一次性删除 |
| 删除组件 | 100个（单个） | ~800ms | 逐个删除 |
| 更新属性 | 100个 | ~400ms | 批量更新 |
| 撤销操作 | 50次 | ~300ms | |
| 重做操作 | 50次 | ~250ms | |
| 复制粘贴 | 100个 | ~600ms | |
| 查找组件（扁平） | 1000个中查找 | <1ms | |
| 查找组件（嵌套） | 深度10层 | ~2ms | |

## 🎯 性能优化措施

### 1. React 性能优化
- ✅ 使用 `React.memo` 包裹组件，减少不必要的重渲染
- ✅ 自定义 memo 比较函数，对 `dropTarget` 进行深比较
- ✅ 使用 `useMemo` 缓存计算结果
- ✅ 使用 `useCallback` 缓存回调函数

### 2. 虚拟滚动
- ✅ 组件数量 > 50 时自动启用虚拟滚动
- ✅ 使用 `react-window` 实现虚拟列表
- ✅ 只渲染可见区域的组件（overscan: 5）
- ✅ 减少 DOM 节点数量，提升滚动性能

### 3. 状态管理优化
- ✅ 历史记录限制为最多 50 条，防止内存溢出
- ✅ Undo/Redo 使用 Patch 历史 + 结构共享，降低内存与 GC 压力
- ✅ 使用 Zustand 的 `persist` 中间件实现持久化
- ✅ 选择器优化，避免不必要的状态订阅

### 4. 拖拽性能优化
- ✅ 自定义碰撞检测算法，减少计算量
- ✅ 热路径缓存（`id -> rect/depth`）与“距离平方”排序，提升嵌套拖拽稳定性
- ✅ 滞后区设计（Hysteresis），减少边界抖动
- ✅ 防抖处理拖拽悬停事件（30ms延迟）
- ✅ 使用 `pointerEvents: 'none'` 优化拖拽体验

### 5. 可观测性与性能预算
- ✅ 关键交互（拖拽、导出）Tracing + 性能面板，便于定位回归
- ✅ CI 通过单测内的性能预算用例做防回归

## 🔬 性能监控

### 使用内置性能监控工具

在浏览器控制台中使用以下命令（仅开发环境 `npm run dev` 下可用）：

```javascript
// 生成1000个测试组件
window.performanceTest.generateTestComponents(1000);

// 生成嵌套结构（深度5层，每层3个节点）
window.performanceTest.generateNestedStructure(5, 3);

// 生成性能报告
await window.performanceTest.generatePerformanceReport();

// 压力测试（测试FPS降至30时的组件数量）
window.performanceTest.stressTest(30);
```

### 运行性能基准测试

```bash
# 运行所有基准测试
npm run bench

# 监听模式（开发时使用）
npm run bench:watch
```

## 📈 Lighthouse 性能报告

### 性能指标目标

| 指标 | 目标值 | 说明 |
|-----|-------|------|
| Performance | ≥ 80 | 性能分数 |
| Accessibility | ≥ 90 | 可访问性分数 |
| Best Practices | ≥ 90 | 最佳实践分数 |
| SEO | ≥ 80 | SEO分数 |
| FCP | ≤ 2s | 首次内容绘制 |
| LCP | ≤ 3s | 最大内容绘制 |
| CLS | ≤ 0.1 | 累计布局偏移 |
| TBT | ≤ 500ms | 总阻塞时间 |
| Speed Index | ≤ 3s | 速度指数 |

### 运行 Lighthouse

```bash
# 本地运行 Lighthouse
npm run lighthouse
```

报告将保存在 `.lighthouseci/` 目录下。

## 🚀 已实现的改进（摘要）

- React 组件 memo / 精准订阅，减少不必要渲染
- 虚拟滚动（大量组件渲染）
- Undo/Redo Patch 历史 + 结构共享
- 拖拽：碰撞检测热路径缓存、滞后区、边缘判定常量统一
- 代码导出：Web Worker 执行，避免阻塞主线程
- Tracing + 性能面板 + CI 性能预算用例，降低性能回归风险

## ⏳ 可继续优化方向

- IndexedDB 替代 localStorage（大数据量场景）
- 组件按需加载（减少首屏体积）
- Canvas 缩略图/局部渲染（提升预览性能）

## 🎯 持续集成与报告

- `ci.yml`：lint + unit tests + build（含性能预算用例）
- `lighthouse-ci.yml`：运行 Lighthouse CI 并上传 `.lighthouseci/` 报告 artifacts

---

**更新时间**: 2026-01-29
