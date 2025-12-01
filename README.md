# Low-Code Form Builder 🚀

一个基于 React + TypeScript 的**企业级低代码表单构建器**，支持拖拽配置、组件联动、无限嵌套、响应式布局和代码导出。

> 🎯 **项目亮点**：采用现代前端最佳实践，展示复杂交互场景的架构设计能力

## 🏆 技术亮点 (面试重点)

### 1. 自定义碰撞检测算法
**场景**：拖拽组件到嵌套容器时，需要智能判断是放入容器内部还是排序到容器前后

**解决方案**：
\`\`\`typescript
// src/utils/collisionDetection.ts
// 基于鼠标位置的智能容器检测
const EDGE_ZONE_RATIO = 0.2; // 上下各 20% 为边缘区域

// 优先级策略：
// 1. 非容器组件优先 - 用于精确插入位置
// 2. 容器处理：边缘区域返回 sortable，中心区域返回 droppable
// 3. 深度排序：优先选择最深层容器
\`\`\`

### 2. 防抖与滞后区设计
**场景**：拖拽过程中鼠标在边界附近时，放置位置会频繁抖动

**解决方案**：
\`\`\`typescript
// 滞后区（Hysteresis Zone）设计
const HYSTERESIS_RATIO = 0.05;
// 当前位置必须超出滞后区才触发状态切换
// 避免边界抖动，提升用户体验
\`\`\`

### 3. Zustand 状态管理最佳实践
- **持久化存储**：使用 \`persist\` 中间件实现本地持久化
- **历史记录限制**：最多保留 50 条历史，防止内存溢出
- **选择器优化**：避免不必要的重渲染

### 4. React.memo 深度优化
\`\`\`typescript
// src/components/DragDrop/SortableList.tsx
// 自定义 memo 比较函数，对 dropTarget 进行深比较
// 容器组件需要传递 dropTarget 给子组件，非容器只关心自己是否是目标
\`\`\`

### 5. 错误边界与上报机制
\`\`\`typescript
// src/components/ErrorBoundary.tsx
// - 错误 ID 生成：便于追踪问题
// - 错误信息复制：方便用户反馈
// - 错误上报接口：可对接 Sentry 等平台
\`\`\`

### 6. 无障碍支持 (a11y)
\`\`\`typescript
// src/hooks/useAccessibility.ts
// - useFocusTrap：焦点陷阱，用于 Modal 等场景
// - useArrowNavigation：箭头键导航
// - useAnnounce：屏幕阅读器通知
\`\`\`

## ✨ 功能特性

### 🎨 可视化拖拽
- 左侧组件库拖拽到画布
- 画布内组件自由排序
- **智能容器检测**（边缘排序 / 中心放入）
- 支持多选批量操作 (Ctrl/Cmd + 点击)
- 支持框选多个组件
- 撤销/重做 (Ctrl+Z / Ctrl+Shift+Z)

### 🔐 组件锁定
- 锁定后禁止拖拽和删除
- 右键菜单快速切换锁定状态
- 视觉指示器显示锁定状态

### 📋 右键菜单
- 复制 / 剪切 / 粘贴
- 删除
- 移动（上/下/顶/底）
- 锁定/解锁

### 📦 模板系统
- 内置常用模板（登录、注册、反馈表单）
- 自定义模板保存
- 模板管理（删除）

### ⌨️ 快捷键
| 快捷键 | 功能 |
|--------|------|
| \`Ctrl/Cmd + A\` | 全选组件 |
| \`Ctrl/Cmd + C\` | 复制选中组件 |
| \`Ctrl/Cmd + V\` | 粘贴组件 |
| \`Ctrl/Cmd + X\` | 剪切组件 |
| \`Ctrl/Cmd + D\` | 复制并粘贴 |
| \`Ctrl/Cmd + Z\` | 撤销 |
| \`Ctrl/Cmd + Shift + Z\` | 重做 |
| \`Delete / Backspace\` | 删除选中 |
| \`Escape\` | 取消选择 |

### 📦 丰富的组件
| 组件类型 | 支持的组件 |
|---------|-----------|
| 输入类 | Input、TextArea、InputNumber |
| 选择类 | Select、Radio、Checkbox、Switch |
| 日期类 | DatePicker、TimePicker |
| 容器类 | Container (支持无限嵌套) |
| 操作类 | Button (支持 submit/reset) |

### 🏗️ 无限嵌套
- Container 容器支持**任意层级**嵌套
- 可视化深度指示器（颜色递进）
- 智能碰撞检测（优先放入内层容器）
- 容器布局配置（列数、间距、方向）
- **跨容器拖拽移动**

### ✅ 表单校验
支持的校验规则：
- \`required\` - 必填
- \`minLength\` / \`maxLength\` - 长度限制
- \`min\` / \`max\` - 数值范围
- \`email\` - 邮箱格式
- \`phone\` - 手机号格式
- \`pattern\` - 正则表达式

### 📱 响应式预览
- 桌面 (100%)
- 平板 (768px)
- 手机 (375px)
- 全屏预览模式

### 📤 导出能力
- **React 代码**：生成完整可运行的组件代码
- **JSON Schema**：生成后端可解析的表单结构
- **JSON 导入/导出**：支持表单配置的导入导出

## 🛠️ 技术栈

| 技术 | 版本 | 用途 |
|-----|------|-----|
| React | 19.x | UI 框架 |
| TypeScript | 5.9 | 类型安全 |
| Vite | 7.x | 构建工具 |
| Zustand | 5.x | 状态管理（with persist） |
| @dnd-kit | 6.x | 拖拽功能 |
| Ant Design | 6.x | UI 组件库 |
| Tailwind CSS | 4.x | 样式工具 |
| Vitest | 4.x | 单元测试 |

## 🏗️ 架构设计

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                        App.tsx                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                    DndContext                            ││
│  │  ┌─────────┐  ┌──────────────────┐  ┌─────────────────┐ ││
│  │  │ Sidebar │  │      Canvas      │  │  PropertyPanel  │ ││
│  │  │         │  │  ┌────────────┐  │  │                 │ ││
│  │  │Draggable│  │  │SortableList│  │  │  Form Controls  │ ││
│  │  │  Items  │  │  │  ┌───────┐ │  │  │                 │ ││
│  │  │         │  │  │  │Sortable│ │  │  │  Validation    │ ││
│  │  │         │  │  │  │ Item  │ │  │  │  Rules         │ ││
│  │  └─────────┘  │  │  └───────┘ │  │  └─────────────────┘ ││
│  │               │  └────────────┘  │                       ││
│  │               └──────────────────┘                       ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Zustand Store                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────┐  │
│  │components│ │selectedIds│ │ history │ │ customTemplates │  │
│  └──────────┘ └──────────┘ └──────────┘ └────────────────┘  │
└─────────────────────────────────────────────────────────────┘
\`\`\`

## 📁 项目结构

\`\`\`
src/
├── components/
│   ├── common/                  # 通用组件
│   │   ├── ContextMenu.tsx      # 右键菜单
│   │   ├── FormStats.tsx        # 表单统计
│   │   ├── HistoryPanel.tsx     # 历史记录面板
│   │   ├── KeyboardShortcutsPanel.tsx
│   │   └── Toolbar.tsx          # 编辑工具栏
│   ├── DragDrop/                # 拖拽组件
│   │   ├── SortableItem.tsx     # 可拖拽项
│   │   └── SortableList.tsx     # 可排序列表（递归）
│   ├── Sidebar/
│   │   └── DraggableSidebarItem.tsx
│   ├── CanvasFormItem.tsx       # 画布表单项渲染
│   ├── FormRenderer.tsx         # 预览模式渲染
│   ├── PropertyPanel.tsx        # 属性配置面板
│   └── ErrorBoundary.tsx        # 错误边界
├── hooks/
│   ├── useKeyboardShortcuts.ts  # 键盘快捷键
│   ├── useSelectionBox.ts       # 框选逻辑
│   ├── usePerformanceMonitor.ts # 性能监控
│   └── useAccessibility.ts      # 无障碍支持
├── constants/
│   └── materials.tsx            # 组件物料配置
├── utils/
│   ├── codeGenerator.ts         # 代码生成器
│   ├── componentHelpers.ts      # 组件辅助函数
│   ├── collisionDetection.ts    # 自定义碰撞检测
│   └── formTemplates.ts         # 表单模板
├── test/
│   ├── setup.ts
│   ├── store.test.ts            # Store 测试
│   └── componentHelpers.test.ts # 辅助函数测试
├── App.tsx                      # 主应用
├── store.ts                     # Zustand 状态管理
└── types.ts                     # TypeScript 类型
\`\`\`

## 🚀 快速开始

\`\`\`bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 运行测试
npm test

# 测试覆盖率
npm run test:coverage
\`\`\`

## 🧪 测试覆盖

\`\`\`bash
✓ src/test/store.test.ts (34 tests)
✓ src/test/componentHelpers.test.ts (19 tests)

# 覆盖核心功能：
- 组件 CRUD 操作
- 容器嵌套操作
- 跨容器移动
- 撤销/重做
- 表单校验
- 剪贴板操作
- 组件辅助函数
\`\`\`

## 🎯 面试问答准备

<details>
<summary><strong>Q: 如何实现拖拽到嵌套容器的智能检测？</strong></summary>

使用自定义碰撞检测算法 (\`collisionDetection.ts\`)：
1. **深度优先**：优先选择最深层的容器
2. **位置判断**：根据鼠标相对于容器的位置判断
   - 上下 20% 区域：排序模式（放在容器前/后）
   - 中间 60% 区域：放入模式（放入容器内部）
3. **防抖设计**：添加 5% 的滞后区防止边界抖动
</details>

<details>
<summary><strong>Q: 如何处理无限嵌套的组件树？</strong></summary>

使用递归组件设计：
- \`SortableList\` 递归渲染自身
- 每层传递 \`depth\` 属性用于样式区分和碰撞检测优先级
- 使用 \`React.memo\` + 自定义比较函数优化性能
</details>

<details>
<summary><strong>Q: 如何优化大量组件的渲染性能？</strong></summary>

1. **React.memo**：使用自定义比较函数，只在必要时重渲染
2. **dropTarget 深比较**：避免引用变化触发不必要渲染
3. **历史记录限制**：最多保留 50 条，防止内存溢出
4. **useMemo/useCallback**：缓存计算结果和回调函数
</details>

<details>
<summary><strong>Q: 状态管理为什么选择 Zustand？</strong></summary>

1. **轻量**：只有 ~1KB，远小于 Redux
2. **简单**：无需 Provider、reducer、action 等模板代码
3. **TypeScript 友好**：完美的类型推导
4. **中间件支持**：内置 persist、devtools 等中间件
5. **选择器优化**：避免不必要的重渲染
</details>

## 📝 更新日志

### v2.6.0 (2025-12-01)
- 🔧 代码优化重构
- ✨ 添加性能监控 Hooks
- ✨ 增强错误边界（错误上报机制）
- ✨ 添加无障碍支持 Hooks
- ✨ 新增组件辅助函数测试

### v2.5.0 - 自定义模板 UI 界面
### v2.4.0 - 组件锁定功能
### v2.3.0 - 表单统计、全屏预览
### v2.2.0 - 右键菜单、JSON 导入/导出

## 📄 License

MIT
