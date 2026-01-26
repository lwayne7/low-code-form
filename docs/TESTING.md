# 测试指南

## 📋 测试概览

本项目包含完整的测试体系，覆盖单元测试、性能测试和E2E测试。

### 测试统计

| 测试类型 | 测试数量 | 覆盖范围 |
|---------|---------|---------|
| 单元测试 | 53+ | Store、工具函数、表单校验 |
| E2E测试 | 20+ | 基础操作、拖拽、预览、性能 |
| 性能基准测试 | 10+ | 添加、删除、查找、渲染 |

## 🧪 单元测试

### 运行测试

```bash
# 运行所有单元测试
npm test

# 运行测试并生成覆盖率报告
npm run test:coverage

# 单次运行测试（CI模式）
npm run test:run
```

### 测试文件结构

```
src/test/
├── setup.ts                    # 测试环境配置
├── store.test.ts              # Store状态管理测试（34个测试）
├── componentHelpers.test.ts   # 组件辅助函数测试（19个测试）
└── performance.bench.ts       # 性能基准测试
```

### 测试覆盖范围

#### Store测试 (34个测试用例)
- ✅ 组件CRUD操作
- ✅ 多选和全选
- ✅ 拖拽排序
- ✅ 跨容器移动
- ✅ 撤销/重做
- ✅ 复制/粘贴/剪切
- ✅ 表单校验（7种规则）
- ✅ 自定义模板

#### 组件辅助函数测试 (19个测试用例)
- ✅ 组件查找
- ✅ 组件扁平化
- ✅ 父组件查找
- ✅ 后代判断
- ✅ 选择器函数

## 📊 性能基准测试

### 运行基准测试

```bash
# 运行所有性能基准测试
npm run bench

# 监听模式（开发时使用）
npm run bench:watch
```

### 基准测试场景

```typescript
// 测试场景包括：
1. 添加组件性能（100、500、1000组件）
2. 组件查找性能（扁平结构 vs 嵌套结构）
3. 组件更新性能
4. 删除组件性能
5. 撤销/重做性能（50次操作）
6. 复制/粘贴性能
7. 扁平化组件树性能
8. 表单校验性能
9. 内存占用测试
```

### 性能测试工具

在浏览器控制台中使用（仅开发环境 `npm run dev` 下可用）：

```javascript
// 生成测试组件
window.performanceTest.generateTestComponents(1000);

// 生成嵌套结构（深度5层，每层3个节点）
window.performanceTest.generateNestedStructure(5, 3);

// 生成完整性能报告
await window.performanceTest.generatePerformanceReport();

// 压力测试（测试FPS降至30时的组件数量）
window.performanceTest.stressTest(30);
```

## 🎭 E2E 测试 (Playwright)

### 安装浏览器

```bash
# 首次运行前需要安装浏览器
npx playwright install
```

### 运行E2E测试

```bash
# 运行所有E2E测试
npm run test:e2e

# 使用UI模式运行（推荐）
npm run test:e2e:ui

# 运行特定浏览器的测试
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# 调试模式
npx playwright test --debug

# 生成测试代码（录制操作）
npx playwright codegen http://localhost:5173
```

### E2E测试文件

```
e2e/
├── basic-operations.spec.ts   # 基础操作流程（8个测试）
├── drag-and-drop.spec.ts      # 拖拽功能（3个测试）
├── form-preview.spec.ts       # 预览和导出（5个测试）
└── performance.spec.ts        # 性能测试（5个测试）
```

### E2E测试覆盖场景

#### 基础操作 (8个测试)
- ✅ 页面加载和元素显示
- ✅ 点击添加组件
- ✅ 添加多种组件类型
- ✅ 修改组件属性
- ✅ 删除组件
- ✅ 键盘快捷键删除
- ✅ 撤销/重做
- ✅ 清空画布

#### 拖拽功能 (3个测试)
- ✅ 从侧边栏拖拽到画布
- ✅ 画布内拖拽排序
- ✅ 拖拽到容器内

#### 预览和导出 (5个测试)
- ✅ 打开预览模态框
- ✅ 切换预览设备尺寸
- ✅ 全屏预览
- ✅ 导出JSON
- ✅ 导出React代码

#### 性能测试 (5个测试)
- ✅ 页面加载时间（< 3秒）
- ✅ 添加100个组件（< 5秒）
- ✅ 撤销50次（< 2秒）
- ✅ 复制粘贴50个组件（< 2秒）
- ✅ 深度嵌套渲染（< 5秒）

### 查看测试报告

测试完成后，报告会自动生成在 `playwright-report/` 目录：

```bash
# 打开HTML报告
npx playwright show-report
```

## 🏆 Lighthouse 性能测试

### 运行Lighthouse

```bash
# 本地运行Lighthouse CI
npm run lighthouse
```

### Lighthouse配置

配置文件：`lighthouserc.json`

性能指标阈值：
- Performance: ≥ 80
- Accessibility: ≥ 90
- Best Practices: ≥ 90
- SEO: ≥ 80
- FCP (首次内容绘制): ≤ 2s
- LCP (最大内容绘制): ≤ 3s
- CLS (累计布局偏移): ≤ 0.1
- TBT (总阻塞时间): ≤ 500ms
- Speed Index: ≤ 3s

### 查看Lighthouse报告

报告保存在 `.lighthouseci/` 目录下，包含：
- HTML格式报告
- JSON格式原始数据
- 性能指标详情

## 🔄 CI/CD 自动化测试

### GitHub Actions

项目配置了自动化测试流程：

```yaml
# .github/workflows/lighthouse-ci.yml
# 每次Push或PR时自动运行Lighthouse测试
```

功能：
- 自动构建项目
- 运行Lighthouse性能测试
- 上传测试报告（保留30天）
- PR中显示性能评分

## 📈 性能监控

### 使用内置性能监控面板

1. 点击工具栏的"性能监控"按钮（仪表盘图标）
2. 实时查看：
   - 当前FPS和平均FPS
   - 渲染次数统计
   - 内存使用情况
   - 高频渲染组件Top 5
   - 长任务次数

3. 性能测试快捷操作：
   - 100组件压力测试
   - 500组件压力测试
   - 1000组件压力测试

4. 导出性能报告（JSON格式）

### 性能监控API

```javascript
// 在控制台中使用
const { fps, renderCount, memoryUsage } = useStore.getState().performanceMetrics;
```

## 🎯 测试最佳实践

### 编写单元测试
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../store';

describe('新功能测试', () => {
  beforeEach(() => {
    // 重置store
    useStore.setState({ components: [], selectedIds: [] });
  });

  it('应该正常工作', () => {
    // 测试代码
  });
});
```

### 编写E2E测试
```typescript
import { test, expect } from '@playwright/test';

test.describe('新功能E2E测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('应该正常交互', async ({ page }) => {
    // 测试步骤
  });
});
```

## 📊 测试覆盖率目标

| 类型 | 当前 | 目标 |
|-----|------|------|
| 语句覆盖率 | ~70% | 80% |
| 分支覆盖率 | ~65% | 75% |
| 函数覆盖率 | ~75% | 85% |
| 行覆盖率 | ~70% | 80% |

## 🐛 调试测试

### 调试单元测试
```bash
# 使用Vitest UI
npx vitest --ui
```

### 调试E2E测试
```bash
# Playwright Inspector
npx playwright test --debug

# 查看测试trace
npx playwright show-trace trace.zip
```

## 📝 编写新测试的检查清单

- [ ] 测试命名清晰描述功能
- [ ] 使用 beforeEach 重置状态
- [ ] 验证正常流程和边界情况
- [ ] 添加性能断言（如果适用）
- [ ] 更新测试文档
- [ ] 确保CI通过

---

**更新时间**: 2025-01-20  
**测试框架**: Vitest 4.x + Playwright 1.x + Lighthouse CI  
**覆盖率**: 70%+ (目标 80%)
