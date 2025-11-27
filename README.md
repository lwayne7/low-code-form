# Low-Code Form Builder 🚀

一个基于 React + TypeScript 的低代码表单构建器，支持拖拽配置、组件联动、无限嵌套、响应式布局和代码导出。

## ✨ 功能特性

### 🎨 可视化拖拽
- 左侧组件库拖拽到画布
- 画布内组件自由排序
- 支持多选批量操作 (Ctrl/Cmd + 点击)
- 支持框选多个组件
- 撤销/重做 (Ctrl+Z / Ctrl+Shift+Z)

### ⌨️ 快捷键与工具栏
| 快捷键 | 功能 |
|--------|------|
| `Ctrl/Cmd + A` | 全选组件 |
| `Ctrl/Cmd + C` | 复制选中组件 |
| `Ctrl/Cmd + V` | 粘贴组件 |
| `Ctrl/Cmd + D` | 复制并粘贴 |
| `Ctrl/Cmd + Z` | 撤销 |
| `Ctrl/Cmd + Shift + Z` | 重做 |
| `Delete / Backspace` | 删除选中 |
| `Escape` | 取消选择 |

> 💡 点击顶部工具栏的 **?** 按钮查看完整快捷键列表

### 📦 丰富的组件
| 组件类型 | 支持的组件 |
|---------|-----------|
| 输入类 | Input、TextArea、InputNumber |
| 选择类 | Select、Radio、Checkbox |
| 日期类 | DatePicker、TimePicker |
| 容器类 | Container (支持无限嵌套) |
| 操作类 | Button (支持 submit/reset) |

### 🔗 组件联动
通过 `visibleOn` 配置实现条件渲染：
```javascript
// 当 input_1 的值等于 "show" 时显示该组件
visibleOn: "{{$formValues.input_1}} === 'show'"
```

### 🏗️ 无限嵌套
- Container 容器支持无限层级嵌套
- 可视化深度指示器（颜色递进）
- 智能拖拽检测（优先放入内层容器）
- 容器布局配置（列数、间距、方向）

### 📱 响应式布局
- **组件栅格**: 支持 1-24 列栅格占比 (colSpan)
- **断点配置**: xs / sm / md / lg 响应式断点
- **容器布局**: 可配置列数 (1-6)、间距、方向

### 📤 表单提交配置
- 按钮类型: button / submit / reset
- 提交地址 (action) 配置
- 请求方法: GET / POST
- 成功/失败消息提示
- 提交后跳转地址

### 📤 代码导出
- **React 代码**: 生成完整可运行的 React 组件代码
- **JSON Schema**: 生成后端可解析的表单结构

## 🛠️ 技术栈

| 技术 | 版本 | 用途 |
|-----|------|-----|
| React | 19.x | UI 框架 |
| TypeScript | 5.9 | 类型安全 |
| Vite | 7.x | 构建工具 |
| Zustand | 5.x | 状态管理 |
| @dnd-kit | 6.x | 拖拽功能 |
| Ant Design | 6.x | UI 组件库 |
| Tailwind CSS | 4.x | 样式工具 |
| Vitest | 4.x | 单元测试 |

## 🚀 快速开始

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

### 运行测试
```bash
# 监听模式
npm test

# 单次运行
npm run test:run
```

## 📁 项目结构

```
src/
├── components/
│   ├── common/                  # 通用组件
│   │   ├── KeyboardShortcutsPanel.tsx  # 快捷键帮助面板
│   │   └── Toolbar.tsx          # 工具栏
│   ├── DragDrop/                # 拖拽组件
│   │   ├── SortableItem.tsx     # 可拖拽项包装器
│   │   └── SortableList.tsx     # 可排序列表
│   ├── Sidebar/                 # 侧边栏组件
│   │   └── DraggableSidebarItem.tsx
│   ├── CanvasFormItem.tsx       # 画布表单项
│   ├── FormRenderer.tsx         # 表单渲染器（预览）
│   ├── PropertyPanel.tsx        # 属性配置面板
│   └── ErrorBoundary.tsx        # 错误边界
├── hooks/
│   ├── useKeyboardShortcuts.ts  # 键盘快捷键
│   └── useSelectionBox.ts       # 框选逻辑
├── constants/
│   └── materials.tsx            # 组件物料配置
├── utils/
│   ├── codeGenerator.ts         # 代码生成器
│   ├── componentHelpers.ts      # 组件操作辅助
│   ├── collisionDetection.ts    # 碰撞检测
│   └── formTemplates.ts         # 表单模板
├── test/
│   ├── setup.ts                 # 测试配置
│   └── store.test.ts            # Store 单元测试
├── App.tsx                      # 主应用
├── store.ts                     # Zustand 状态管理
└── types.ts                     # TypeScript 类型定义
```

## 🧪 测试覆盖

34 个单元测试覆盖核心功能：
- ✅ 组件增删改查
- ✅ 容器嵌套操作
- ✅ 多选/单选切换
- ✅ 撤销/重做
- ✅ 表单值管理
- ✅ 跨容器移动
- ✅ 剪贴板操作
- ✅ 表单验证

## 📝 更新日志

### v2.0.0 (2025-11-27)
- 🎉 代码结构重构，模块化组织
- ✨ 新增快捷键帮助面板
- ✨ 新增工具栏组件
- ✨ 新增表单提交配置
- ✨ 新增响应式布局配置
- 🔧 优化代码结构，提取可复用逻辑

### v1.0.0
- 🎉 初始版本发布
- ✨ 拖拽配置功能
- ✨ 组件联动
- ✨ 无限嵌套
- ✨ 代码导出

## 📝 开发计划

- [x] 快捷键帮助面板
- [x] 工具栏操作按钮
- [x] 表单提交配置
- [x] 响应式布局配置
- [ ] 更多组件类型（上传、富文本等）
- [ ] 组件模板库
- [ ] 历史版本管理
- [ ] 协同编辑

## 📄 License

MIT
