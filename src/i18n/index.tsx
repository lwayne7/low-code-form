/**
 * 国际化支持（i18n）
 * 
 * 面试考点：
 * 1. React Context 状态管理
 * 2. 类型安全的多语言支持
 * 3. 动态语言切换
 * 4. 本地存储持久化
 */

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

// 支持的语言
export type Locale = 'zh-CN' | 'en-US';

// 翻译文本类型
type TranslationKey = keyof typeof zhCN;
type Translations = Record<TranslationKey, string>;

// 中文翻译
const zhCN = {
    // 通用
    'common.confirm': '确认',
    'common.cancel': '取消',
    'common.save': '保存',
    'common.delete': '删除',
    'common.edit': '编辑',
    'common.add': '添加',
    'common.search': '搜索',
    'common.loading': '加载中...',
    'common.success': '成功',
    'common.error': '错误',
    'common.warning': '警告',
    'common.info': '提示',

    // Header
    'header.title': 'LowCode Form',
    'header.undo': '撤销',
    'header.redo': '重做',
    'header.history': '操作历史',
    'header.clear': '清空画布',
    'header.shortcuts': '快捷键',
    'header.performance': '性能监控',
    'header.template': '模板',
    'header.json': 'JSON',
    'header.export': '导出',
    'header.preview': '预览',
    'header.cloud': '云端',
    'header.cloudSave': '保存到云端',
    'header.cloudLoad': '从云端加载',
    'header.login': '登录',
    'header.logout': '退出登录',
    'header.deleteAccount': '删除账号',
    'header.theme.light': '亮色模式',
    'header.theme.dark': '深色模式',
    'header.theme.auto': '跟随系统',

    // Auth
    'auth.welcome': '欢迎回来',
    'auth.createAccount': '创建账号',
    'auth.loginSubtitle': '登录以继续使用 LowCode Form',
    'auth.registerSubtitle': '注册以开始使用 LowCode Form',
    'auth.email': '请输入邮箱',
    'auth.password': '请输入密码',
    'auth.passwordHint': '请输入密码（至少6位）',
    'auth.loginBtn': '登 录',
    'auth.registerBtn': '注 册',
    'auth.noAccount': '还没有账号？',
    'auth.hasAccount': '已有账号？',
    'auth.registerNow': '立即注册',
    'auth.loginNow': '立即登录',
    'auth.loginSuccess': '登录成功',
    'auth.registerSuccess': '注册成功',
    'auth.logoutSuccess': '已退出登录',
    'auth.deleteAccountTitle': '删除账号',
    'auth.deleteAccountConfirm': '确定要删除您的账号吗？此操作将：',
    'auth.deleteAccountWarning1': '删除您保存的所有表单',
    'auth.deleteAccountWarning2': '删除所有表单提交数据',
    'auth.deleteAccountWarning3': '此操作无法撤销',
    'auth.accountDeleted': '账号已删除',

    // Component Library
    'components.library': '组件库',
    'components.search': '搜索组件...',
    'components.basic': '基础组件',
    'components.layout': '布局组件',
    'components.advanced': '高级组件',
    'components.input': '单行输入',
    'components.textarea': '多行输入',
    'components.inputNumber': '数字输入',
    'components.number': '数字输入',
    'components.select': '下拉选择',
    'components.radio': '单选框',
    'components.checkbox': '复选框',
    'components.switch': '开关',
    'components.datePicker': '日期选择',
    'components.timePicker': '时间选择',
    'components.rate': '评分',
    'components.slider': '滑块',
    'components.upload': '上传',
    'components.button': '按钮',
    'components.text': '文本',
    'components.divider': '分割线',
    'components.container': '容器',
    'components.grid': '栅格布局',
    'components.tabs': '标签页',
    'components.collapse': '折叠面板',
    'components.notFound': '未找到匹配的组件',

    // Canvas
    'canvas.empty': '拖拽组件到此处',
    'canvas.emptyHint': '从左侧组件库拖拽组件到画布，或点击添加',
    'canvas.confirmClear': '确认清空',
    'canvas.clearWarning': '确定要清空画布吗？此操作可以通过撤销恢复。',
    'canvas.cleared': '画布已清空',

    // Property Panel
    'property.title': '属性配置',
    'property.noSelection': '请选择一个组件',
    'property.multiSelect': '已选中 {count} 个组件',
    'property.batchDelete': '批量删除',
    'property.componentId': '组件 ID',
    'property.basic': '基础属性',
    'property.advanced': '高级属性',
    'property.style': '样式设置',
    'property.linkage': '联动配置',
    'property.validation': '校验规则',
    'property.label': '标签',
    'property.placeholder': '占位文本',
    'property.required': '必填',
    'property.disabled': '禁用',
    'property.hidden': '隐藏',

    // Templates
    'template.builtin': '📦 内置模板',
    'template.custom': '⭐ 我的模板',
    'template.saveAs': '保存为模板',
    'template.namePlaceholder': '请输入模板名称',
    'template.descPlaceholder': '模板描述（可选）',
    'template.saved': '模板已保存',
    'template.deleted': '模板已删除',
    'template.applied': '已应用「{name}」模板',
    'template.confirmUse': '使用模板将清空当前画布内容，是否继续？',
    // 内置模板名称
    'template.login.name': '登录表单',
    'template.login.desc': '包含用户名、密码和登录按钮',
    'template.register.name': '注册表单',
    'template.register.desc': '包含用户名、邮箱、密码和确认密码',
    'template.contact.name': '联系我们',
    'template.contact.desc': '包含姓名、邮箱、主题和留言内容',
    'template.profile.name': '个人信息',
    'template.profile.desc': '包含基本信息和详细信息分组',
    'template.feedback.name': '意见反馈',
    'template.feedback.desc': '包含评分、反馈类型和详细描述',

    // Cloud
    'cloud.forms': '我的云端表单',
    'cloud.noForms': '暂无保存的表单',
    'cloud.noDescription': '无描述',
    'cloud.updatedAt': '更新于',
    'cloud.saveTitle': '保存到云端',
    'cloud.formName': '表单名称',
    'cloud.formNamePlaceholder': '请输入表单名称',
    'cloud.formNameExample': '如：用户注册表单',
    'cloud.formDesc': '描述（可选）',
    'cloud.formDescPlaceholder': '表单用途说明...',
    'cloud.saveSuccess': '保存成功',
    'cloud.updateSuccess': '更新成功',
    'cloud.loadSuccess': '加载成功',
    'cloud.deleteConfirm': '确定要删除这个表单吗？',
    'cloud.deleteSuccess': '删除成功',
    'cloud.emptyCanvas': '画布为空，请先添加组件',

    // Common extras
    'common.load': '加载',
    'common.update': '更新',
    'common.close': '关闭',
    'common.import': '导入',
    'common.export': '导出',
    'common.copy': '复制',
    'common.paste': '粘贴',
    'common.cut': '剪切',
    'common.submit': '提交',
    'common.reset': '重置',

    // Toolbar
    'toolbar.selectAll': '全选 (⌘A)',
    'toolbar.copy': '复制 (⌘C)',
    'toolbar.paste': '粘贴 (⌘V)',
    'toolbar.duplicate': '复制并粘贴 (⌘D)',
    'toolbar.delete': '删除 (Delete)',
    'toolbar.exportJson': '导出 JSON',
    'toolbar.importJson': '导入 JSON',
    'toolbar.copied': '已复制 {count} 个组件',
    'toolbar.pasted': '已粘贴 {count} 个组件',
    'toolbar.duplicated': '已复制组件',
    'toolbar.deleted': '已删除 {count} 个组件',
    'toolbar.exported': '已导出表单配置',
    'toolbar.imported': '已导入 {count} 个组件',
    'toolbar.noExport': '没有组件可导出',
    'toolbar.invalidFile': '无效的表单配置文件',
    'toolbar.parseError': '解析文件失败，请确保是有效的 JSON 文件',

    // Stats
    'stats.title': '表单统计',
    'stats.total': '总组件数',
    'stats.topLevel': '顶层组件',
    'stats.containers': '容器数量',
    'stats.maxDepth': '最大嵌套',
    'stats.typeDistribution': '组件类型分布',
    'stats.empty': '暂无组件，从左侧拖拽添加',

    // Preview
    'preview.title': '表单预览',
    'preview.mobile': '手机 (375px)',
    'preview.tablet': '平板 (768px)',
    'preview.desktop': '桌面 (100%)',
    'preview.fullscreen': '全屏预览',
    'preview.exitFullscreen': '退出全屏',

    // Errors
    'error.network': '网络连接失败，请检查网络设置',
    'error.timeout': '请求超时，请检查网络连接',
    'error.unauthorized': '登录已过期，请重新登录',
    'error.serverError': '服务器内部错误',
    'error.invalidEmail': '请输入有效的邮箱地址',
    'error.passwordTooShort': '密码至少需要6位字符',
    'error.emailRequired': '邮箱不能为空',
    'error.passwordRequired': '密码不能为空',
    'error.copied': '错误信息已复制到剪贴板',
    'error.copyFailed': '复制失败，请手动复制',
    'error.jsonFormat': 'JSON 格式错误',

    // JSON/Export Modal
    'json.title': '表单 Schema',
    'json.import': '导入',
    'json.importOverride': '导入 (覆盖)',
    'json.importSuccess': '导入成功',
    'export.title': '导出代码',
    'export.reactCode': 'React 组件代码：',
    'export.jsonSchema': 'JSON Schema（可用于后端校验）：',

    // Context Menu
    'contextMenu.lock': '锁定组件',
    'contextMenu.unlock': '解锁组件',
    'contextMenu.moveUp': '上移',
    'contextMenu.moveDown': '下移',
    'contextMenu.moveToTop': '移到顶部',
    'contextMenu.moveToBottom': '移到底部',

    // Keyboard Shortcuts
    'shortcuts.title': '快捷键',
    'shortcuts.copyComponent': '复制选中组件',
    'shortcuts.pasteComponent': '粘贴组件',
    'shortcuts.duplicateComponent': '复制并粘贴组件',
    'shortcuts.selectAll': '全选组件',
    'shortcuts.undo': '撤销操作',
    'shortcuts.redo': '重做操作',
    'shortcuts.deleteComponent': '删除选中组件',
    'shortcuts.cancelSelect': '取消选择',
    'shortcuts.forceNest': '强制嵌套到容器内部',
    'shortcuts.forceSibling': '强制在容器前/后放置',
    'shortcuts.drag': '+ 拖拽',

    // Drag & Drop
    'dnd.dropIntoContainer': '放入「{label}」内部',
    'dnd.container': '容器',

    // Form Submit
    'form.submitSuccess': '提交成功！',
    'form.submitFailed': '提交失败，请重试',
    'form.submitError': '提交失败，请检查网络',
    'form.validationPassed': '表单验证通过！',
    'form.submittedData': '用户提交的数据:',
    'form.formData': '表单数据:',
    'form.submitError2': '提交错误:',

    // Performance Panel
    'perf.title': '性能监控面板',
    'perf.reset': '重置统计',
    'perf.resetSuccess': '性能统计已重置',
    'perf.testFailed': '性能测试失败',
    'perf.runTest': '运行性能测试',
    'perf.testing': '测试中...',
    'perf.exportReport': '导出报告',
    'perf.exportSuccess': '性能报告已导出',
    'perf.monitoring': '监控中',
    'perf.paused': '已暂停',
    'perf.currentFps': '当前 FPS',
    'perf.avgFps': '平均 FPS',
    'perf.smooth': '流畅',
    'perf.normal': '一般',
    'perf.laggy': '卡顿',
    'perf.stability': '稳定性',
    'perf.range': '范围',
    'perf.noData': '暂无数据',
    'perf.componentCount': '组件数量',
    'perf.renderCount': '渲染次数',
    'perf.renderStats': '渲染统计',
    'perf.totalRenders': '总渲染次数',
    'perf.longTasks': '长任务次数 (>50ms)',
    'perf.memoryUsage': '内存使用',
    'perf.topRenders': '高频渲染组件 Top 5',
    'perf.noRenderData': '暂无数据，请操作页面触发渲染',
    'perf.times': '次',
    'perf.stressTest': '性能压力测试',
    'perf.stressTestDesc': '快速测试不同数据量下的性能表现',
    'perf.components100': '100 组件',
    'perf.components500': '500 组件',
    'perf.components1000': '1000 组件',
    'perf.stressTestWarning': '大规模测试会添加大量组件到画布',
    'perf.tracing': 'Tracing（拖拽/生成器）',
    'perf.recentTraces': '最近 {count} 条（自动采样关键交互耗时）',
    'perf.clear': '清空',
    'perf.noTracingData': '暂无数据：尝试拖拽组件或导出代码',
    'perf.optimizeTips': '优化建议',
    'perf.tip1': '组件 > 50 时自动启用虚拟滚动',
    'perf.tip2': '使用 React.memo 减少不必要渲染',
    'perf.tip3': 'useMemo/useCallback 缓存计算结果',
    'perf.tip4': 'Zustand selector 精确订阅状态',
    'perf.tip5': '防抖/节流优化高频操作',
    'perf.lowFpsWarning': '当前FPS较低，建议减少组件数量或优化渲染',
    'perf.longTaskWarning': '检测到 {count} 次长任务，可能影响交互响应',
    'perf.addingComponents': '正在添加 {count} 个组件...',
    'perf.testComplete': '性能测试完成！添加 {count} 个组件耗时 {duration}ms',

    // Stats extras
    'stats.levels': '层',
    'stats.components': '个组件',

    // Template extras
    'template.use': '使用模板',
    'template.deleteTitle': '删除模板',
    'template.nameRequired': '请输入模板名称',

    // Error Boundary
    'errorBoundary.title': '页面出错了',
    'errorBoundary.description': '抱歉，应用遇到了一些问题。您可以尝试刷新页面或重置应用。',
    'errorBoundary.errorId': '错误ID',
    'errorBoundary.errorMessage': '错误信息',
    'errorBoundary.errorStack': '错误堆栈',
    'errorBoundary.refresh': '刷新页面',
    'errorBoundary.copyError': '复制错误信息',
    'errorBoundary.reset': '重置应用',
    'errorBoundary.details': '错误详情（仅开发环境显示）',

    // Store History Labels
    'history.add': '添加 {type}',
    'history.update': '修改组件属性',
    'history.delete': '删除组件',
    'history.deleteMultiple': '删除 {count} 个组件',
    'history.reorder': '调整组件顺序',
    'history.move': '移动组件',
    'history.movePosition': '移动组件位置',
    'history.batchAdd': '批量添加 {count} 个组件',
    'history.paste': '粘贴 {count} 个组件',
    'history.duplicate': '复制 {count} 个组件',
    'history.cut': '剪切 {count} 个组件',
    'history.clear': '清空画布',
    'history.import': '导入组件',
    'history.toggleLock': '切换锁定',

    // Validation Messages
    'validation.required': '此项为必填项',
    'validation.email': '请输入有效的邮箱地址',
    'validation.phone': '请输入有效的手机号码',
    'validation.minLength': '至少需要 {min} 个字符',
    'validation.maxLength': '最多允许 {max} 个字符',
    'validation.min': '不能小于 {min}',
    'validation.max': '不能大于 {max}',
    'validation.pattern': '格式不正确',
    'validation.url': '请输入有效的网址',
    'validation.number': '请输入有效的数字',
    'validation.integer': '请输入整数',
    'validation.empty': '不能为空',
    'validation.defaultLabel': '此项',
    'validation.defaultMessage': '请输入{label}',

    // Property Panel - Container Config
    'propertyPanel.containerTitle': '容器标题',
    'propertyPanel.layoutDirection': '布局方向',
    'propertyPanel.vertical': '垂直布局',
    'propertyPanel.horizontal': '水平布局',
    'propertyPanel.gridColumns': '栅格列数',
    'propertyPanel.gridColumnsTooltip': '容器内部的栅格列数，用于控制子组件的布局',
    'propertyPanel.column': '{count} 列',
    'propertyPanel.columnGap': '列间距',

    // Property Panel - Options Editor
    'propertyPanel.optionsConfig': '选项配置',
    'propertyPanel.optionLabel': '显示名称',
    'propertyPanel.optionValue': '值',
    'propertyPanel.addOption': '添加选项',
    'propertyPanel.defaultOption': '选项{index}',

    // Property Panel - Button Config
    'propertyPanel.buttonText': '按钮文字',
    'propertyPanel.buttonType': '按钮类型',
    'propertyPanel.primaryButton': '主要按钮',
    'propertyPanel.defaultButton': '默认按钮',
    'propertyPanel.dashedButton': '虚线按钮',
    'propertyPanel.textButton': '文字按钮',
    'propertyPanel.linkButton': '链接按钮',
    'propertyPanel.htmlType': 'HTML 类型',
    'propertyPanel.normalButton': '普通按钮',
    'propertyPanel.submitButton': '提交按钮',
    'propertyPanel.resetButton': '重置按钮',
    'propertyPanel.submitConfig': '提交配置',
    'propertyPanel.submitUrl': '提交地址',
    'propertyPanel.submitUrlPlaceholder': '例如：/api/submit',
    'propertyPanel.requestMethod': '请求方法',
    'propertyPanel.successMessage': '成功提示',
    'propertyPanel.successMessagePlaceholder': '提交成功！',
    'propertyPanel.errorMessage': '失败提示',
    'propertyPanel.errorMessagePlaceholder': '提交失败，请重试',
    'propertyPanel.successRedirect': '成功跳转',
    'propertyPanel.successRedirectPlaceholder': '例如：/success',

    // Property Panel - Validation Config
    'propertyPanel.validationRules': '校验规则',
    'propertyPanel.addedRules': '已添加的规则：',
    'propertyPanel.noRules': '暂无校验规则',
    'propertyPanel.addRule': '添加规则',
    'propertyPanel.ruleType': '规则类型',
    'propertyPanel.minLengthRule': '最小长度',
    'propertyPanel.maxLengthRule': '最大长度',
    'propertyPanel.minRule': '最小值',
    'propertyPanel.maxRule': '最大值',
    'propertyPanel.patternRule': '正则表达式',
    'propertyPanel.errorTip': '错误提示',
    'propertyPanel.errorTipPlaceholder': '错误提示',
    'propertyPanel.regexLabel': '正则',
    'propertyPanel.regexPlaceholder': '正则表达式',
    'propertyPanel.ruleRequired': '必填',
    'propertyPanel.ruleEmail': '邮箱',
    'propertyPanel.rulePhone': '手机号',
    'propertyPanel.ruleDescription.minLength': '长度不能少于指定值',
    'propertyPanel.ruleDescription.maxLength': '长度不能超过指定值',
    'propertyPanel.ruleDescription.min': '数值不能小于指定值',
    'propertyPanel.ruleDescription.max': '数值不能大于指定值',
    'propertyPanel.ruleDescription.pattern': '必须匹配指定的正则表达式',

    // Property Panel - Responsive Config
    'propertyPanel.responsiveLayout': '响应式布局',
    'propertyPanel.columnSpan': '占用列数',
    'propertyPanel.columnSpanTooltip': '在 24 栅格系统中占用的列数',
    'propertyPanel.fullWidth': '满行 (24)',
    'propertyPanel.threeQuarter': '3/4 行 (18)',
    'propertyPanel.twoThird': '2/3 行 (16)',
    'propertyPanel.half': '1/2 行 (12)',
    'propertyPanel.oneThird': '1/3 行 (8)',
    'propertyPanel.quarter': '1/4 行 (6)',
    'propertyPanel.responsiveConfig': '响应式配置',
    'propertyPanel.responsiveTooltip': '不同屏幕尺寸下的列数',
    'propertyPanel.mobile': '手机 (xs)',
    'propertyPanel.tablet': '平板 (sm)',
    'propertyPanel.desktop': '桌面 (md)',
    'propertyPanel.largeScreen': '大屏 (lg)',

    // Property Panel - Linkage Config
    'propertyPanel.componentLinkage': '组件联动',
    'propertyPanel.visibleCondition': '显隐条件 (visibleOn)',
    'propertyPanel.visibleTooltip': '仅支持安全表达式，如：values[\'xxx\'] === \'show\'',
    'propertyPanel.expressionError': '表达式错误：{error}',
    'propertyPanel.visiblePlaceholder': '例如：values[\'{id}\'] === \'show\'',
    'propertyPanel.availableIds': '可用的组件 ID：',

    // Component Registry Defaults
    'component.container': '容器',
    'component.input': '单行输入',
    'component.inputLabel': '输入框',
    'component.inputPlaceholder': '请输入...',
    'component.labelTitle': '标题 (Label)',
    'component.placeholderText': '占位符',
    'component.requiredYes': '必填',
    'component.requiredNo': '非必填',
    'component.textarea': '多行输入',
    'component.textareaLabel': '文本域',
    'component.textareaPlaceholder': '请输入多行文本...',
    'component.inputNumber': '数字输入',
    'component.inputNumberLabel': '数字',
    'component.inputNumberPlaceholder': '请输入数字',
    'component.select': '下拉选择',
    'component.selectLabel': '选择器',
    'component.selectPlaceholder': '请选择',
    'component.radio': '单选框',
    'component.radioLabel': '单选',
    'component.checkbox': '多选框',
    'component.checkboxLabel': '多选',
    'component.switch': '开关',
    'component.switchLabel': '开关',
    'component.switchCheckedText': '开启时文字',
    'component.switchUncheckedText': '关闭时文字',
    'component.datePicker': '日期选择',
    'component.datePickerLabel': '日期',
    'component.datePickerPlaceholder': '请选择日期',
    'component.timePicker': '时间选择',
    'component.timePickerLabel': '时间',
    'component.timePickerPlaceholder': '请选择时间',
    'component.button': '按钮',
    'component.buttonText': '提交',

    // Drag & Drop Messages
    'dnd.insertBefore': '↑ 插入到上方',
    'dnd.insertAfter': '↓ 插入到下方',
    'dnd.level': '层级 {level}',
    'dnd.dropInto': '放入「{label}」内部',
    'dnd.releaseHere': '📥 松开鼠标放入此处',
    'dnd.dragHere': '📦 拖拽组件到这里',
    'dnd.cannotNestSelf': '不能将容器拖入自身',
    'dnd.moving': '正在移动...',
    'dnd.virtualScrollEnabled': '⚡ 虚拟滚动已启用（{count} 个组件）',

    // Canvas Messages
    'canvas.dragFromLeft': '从左侧拖拽组件到这里',
    'canvas.addComponent': '添加组件',
    'canvas.editProperties': '编辑属性',
    'canvas.locked': '🔒 已锁定',
    'canvas.conditionalHidden': '🔗 条件隐藏: {condition}',
    'canvas.conditionalRender': '条件渲染: {condition}',

    // History Panel
    'historyPanel.title': '操作历史',
    'historyPanel.operations': '{count} 次操作',
    'historyPanel.empty': '暂无操作历史',
    'historyPanel.initialState': '初始状态',
    'historyPanel.current': '当前',
    'historyPanel.components': '{count} 个组件',
    'historyPanel.canRedo': '可重做',
    'historyPanel.tip1': '点击历史记录可以跳转到该状态',
    'historyPanel.tip2': 'Ctrl+Z 撤销，Ctrl+Shift+Z 重做',

    // Form Stats
    'formStats.input': '输入框',
    'formStats.textarea': '文本域',
    'formStats.inputNumber': '数字输入',
    'formStats.select': '下拉选择',
    'formStats.radio': '单选框',
    'formStats.checkbox': '多选框',
    'formStats.switch': '开关',
    'formStats.datePicker': '日期选择',
    'formStats.timePicker': '时间选择',
    'formStats.button': '按钮',
    'formStats.container': '容器',

    // Keyboard Shortcuts Panel
    'keyboardShortcuts.clickComponent': '单击组件',
    'keyboardShortcuts.selectComponent': '选中组件',
    'keyboardShortcuts.multiSelect': '多选组件',
    'keyboardShortcuts.editOperations': '编辑操作',
    'keyboardShortcuts.mouseOperations': '鼠标操作',
    'keyboardShortcuts.dragModifiers': '拖拽修饰键',

    // Toast Messages
    'toast.cannotDeleteLocked': '无法删除锁定的组件',
    'toast.componentsCopied': '已复制 {count} 个组件',
    'toast.componentsPasted': '已粘贴 {count} 个组件',
    'toast.componentDuplicated': '已复制组件',
    'toast.cannotNestIntoSelf': '不能将容器拖入自身',

    // Code Generator
    'codeGen.autoGenerated': '自动生成的表单组件',
    'codeGen.generatedAt': '生成时间: {time}',
    'codeGen.formSubmitLog': '表单提交数据:',
    'codeGen.todoComment': 'TODO: 在这里添加你的提交逻辑',
    'codeGen.containerComment': '容器',
    'codeGen.containerContent': '容器内容',
    'codeGen.conditionalComment': '条件渲染: {condition}',
    'codeGen.defaultButton': '按钮',
    'codeGen.defaultContainer': '容器',
    'codeGen.formDataLog': '表单数据:',
} as const;

// 英文翻译
const enUS: Translations = {
    // Common
    'common.confirm': 'Confirm',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',
    'common.search': 'Search',
    'common.loading': 'Loading...',
    'common.success': 'Success',
    'common.error': 'Error',
    'common.warning': 'Warning',
    'common.info': 'Info',

    // Header
    'header.title': 'LowCode Form',
    'header.undo': 'Undo',
    'header.redo': 'Redo',
    'header.history': 'History',
    'header.clear': 'Clear Canvas',
    'header.shortcuts': 'Shortcuts',
    'header.performance': 'Performance',
    'header.template': 'Template',
    'header.json': 'JSON',
    'header.export': 'Export',
    'header.preview': 'Preview',
    'header.cloud': 'Cloud',
    'header.cloudSave': 'Save to Cloud',
    'header.cloudLoad': 'Load from Cloud',
    'header.login': 'Login',
    'header.logout': 'Logout',
    'header.deleteAccount': 'Delete Account',
    'header.theme.light': 'Light Mode',
    'header.theme.dark': 'Dark Mode',
    'header.theme.auto': 'System Default',

    // Auth
    'auth.welcome': 'Welcome Back',
    'auth.createAccount': 'Create Account',
    'auth.loginSubtitle': 'Sign in to continue using LowCode Form',
    'auth.registerSubtitle': 'Sign up to start using LowCode Form',
    'auth.email': 'Enter your email',
    'auth.password': 'Enter your password',
    'auth.passwordHint': 'Enter password (at least 6 characters)',
    'auth.loginBtn': 'Sign In',
    'auth.registerBtn': 'Sign Up',
    'auth.noAccount': "Don't have an account?",
    'auth.hasAccount': 'Already have an account?',
    'auth.registerNow': 'Sign up now',
    'auth.loginNow': 'Sign in now',
    'auth.loginSuccess': 'Login successful',
    'auth.registerSuccess': 'Registration successful',
    'auth.logoutSuccess': 'Logged out successfully',
    'auth.deleteAccountTitle': 'Delete Account',
    'auth.deleteAccountConfirm': 'Are you sure you want to delete your account? This will:',
    'auth.deleteAccountWarning1': 'Delete all your saved forms',
    'auth.deleteAccountWarning2': 'Delete all form submissions',
    'auth.deleteAccountWarning3': 'This action cannot be undone',
    'auth.accountDeleted': 'Account deleted',

    // Component Library
    'components.library': 'Components',
    'components.search': 'Search components...',
    'components.basic': 'Basic',
    'components.layout': 'Layout',
    'components.advanced': 'Advanced',
    'components.input': 'Input',
    'components.textarea': 'TextArea',
    'components.inputNumber': 'Number Input',
    'components.number': 'Number',
    'components.select': 'Select',
    'components.radio': 'Radio',
    'components.checkbox': 'Checkbox',
    'components.switch': 'Switch',
    'components.datePicker': 'Date Picker',
    'components.timePicker': 'Time Picker',
    'components.rate': 'Rate',
    'components.slider': 'Slider',
    'components.upload': 'Upload',
    'components.button': 'Button',
    'components.text': 'Text',
    'components.divider': 'Divider',
    'components.container': 'Container',
    'components.grid': 'Grid',
    'components.tabs': 'Tabs',
    'components.collapse': 'Collapse',
    'components.notFound': 'No components found',

    // Canvas
    'canvas.empty': 'Drop components here',
    'canvas.emptyHint': 'Drag components from the left panel to the canvas, or click to add',
    'canvas.confirmClear': 'Confirm Clear',
    'canvas.clearWarning': 'Are you sure you want to clear the canvas? This can be undone.',
    'canvas.cleared': 'Canvas cleared',

    // Property Panel
    'property.title': 'Properties',
    'property.noSelection': 'Select a component',
    'property.multiSelect': '{count} components selected',
    'property.batchDelete': 'Batch Delete',
    'property.componentId': 'Component ID',
    'property.basic': 'Basic',
    'property.advanced': 'Advanced',
    'property.style': 'Style',
    'property.linkage': 'Linkage',
    'property.validation': 'Validation',
    'property.label': 'Label',
    'property.placeholder': 'Placeholder',
    'property.required': 'Required',
    'property.disabled': 'Disabled',
    'property.hidden': 'Hidden',

    // Templates
    'template.builtin': '📦 Built-in Templates',
    'template.custom': '⭐ My Templates',
    'template.saveAs': 'Save as Template',
    'template.namePlaceholder': 'Enter template name',
    'template.descPlaceholder': 'Template description (optional)',
    'template.saved': 'Template saved',
    'template.deleted': 'Template deleted',
    'template.applied': 'Applied "{name}" template',
    'template.confirmUse': 'Using a template will clear the current canvas. Continue?',
    // Built-in template names
    'template.login.name': 'Login Form',
    'template.login.desc': 'Username, password and login button',
    'template.register.name': 'Registration Form',
    'template.register.desc': 'Username, email, password and confirmation',
    'template.contact.name': 'Contact Us',
    'template.contact.desc': 'Name, email, subject and message',
    'template.profile.name': 'Personal Info',
    'template.profile.desc': 'Basic info and contact details groups',
    'template.feedback.name': 'Feedback',
    'template.feedback.desc': 'Rating, issue type and description',

    // Cloud
    'cloud.forms': 'My Cloud Forms',
    'cloud.noForms': 'No saved forms yet',
    'cloud.noDescription': 'No description',
    'cloud.updatedAt': 'Updated at',
    'cloud.saveTitle': 'Save to Cloud',
    'cloud.formName': 'Form Name',
    'cloud.formNamePlaceholder': 'Enter form name',
    'cloud.formNameExample': 'e.g.: User Registration Form',
    'cloud.formDesc': 'Description (optional)',
    'cloud.formDescPlaceholder': 'Form description...',
    'cloud.saveSuccess': 'Saved successfully',
    'cloud.updateSuccess': 'Updated successfully',
    'cloud.loadSuccess': 'Loaded successfully',
    'cloud.deleteConfirm': 'Are you sure you want to delete this form?',
    'cloud.deleteSuccess': 'Deleted successfully',
    'cloud.emptyCanvas': 'Canvas is empty, please add components first',

    // Common extras
    'common.load': 'Load',
    'common.update': 'Update',
    'common.close': 'Close',
    'common.import': 'Import',
    'common.export': 'Export',
    'common.copy': 'Copy',
    'common.paste': 'Paste',
    'common.cut': 'Cut',
    'common.submit': 'Submit',
    'common.reset': 'Reset',

    // Toolbar
    'toolbar.selectAll': 'Select All (⌘A)',
    'toolbar.copy': 'Copy (⌘C)',
    'toolbar.paste': 'Paste (⌘V)',
    'toolbar.duplicate': 'Duplicate (⌘D)',
    'toolbar.delete': 'Delete',
    'toolbar.exportJson': 'Export JSON',
    'toolbar.importJson': 'Import JSON',
    'toolbar.copied': 'Copied {count} component(s)',
    'toolbar.pasted': 'Pasted {count} component(s)',
    'toolbar.duplicated': 'Component duplicated',
    'toolbar.deleted': 'Deleted {count} component(s)',
    'toolbar.exported': 'Form configuration exported',
    'toolbar.imported': 'Imported {count} component(s)',
    'toolbar.noExport': 'No components to export',
    'toolbar.invalidFile': 'Invalid form configuration file',
    'toolbar.parseError': 'Failed to parse file. Please ensure it is a valid JSON file.',

    // Stats
    'stats.title': 'Form Stats',
    'stats.total': 'Total Components',
    'stats.topLevel': 'Top Level',
    'stats.containers': 'Containers',
    'stats.maxDepth': 'Max Depth',
    'stats.typeDistribution': 'Component Types',
    'stats.empty': 'No components yet. Drag from the left panel.',

    // Preview
    'preview.title': 'Form Preview',
    'preview.mobile': 'Mobile (375px)',
    'preview.tablet': 'Tablet (768px)',
    'preview.desktop': 'Desktop (100%)',
    'preview.fullscreen': 'Fullscreen',
    'preview.exitFullscreen': 'Exit Fullscreen',

    // Errors
    'error.network': 'Network connection failed. Please check your network settings.',
    'error.timeout': 'Request timeout. Please check your network connection.',
    'error.unauthorized': 'Session expired. Please sign in again.',
    'error.serverError': 'Internal server error',
    'error.invalidEmail': 'Please enter a valid email address',
    'error.passwordTooShort': 'Password must be at least 6 characters',
    'error.emailRequired': 'Email is required',
    'error.passwordRequired': 'Password is required',
    'error.copied': 'Error message copied to clipboard',
    'error.copyFailed': 'Copy failed, please copy manually',
    'error.jsonFormat': 'Invalid JSON format',

    // JSON/Export Modal
    'json.title': 'Form Schema',
    'json.import': 'Import',
    'json.importOverride': 'Import (Override)',
    'json.importSuccess': 'Import successful',
    'export.title': 'Export Code',
    'export.reactCode': 'React Component Code:',
    'export.jsonSchema': 'JSON Schema (for backend validation):',

    // Context Menu
    'contextMenu.lock': 'Lock Component',
    'contextMenu.unlock': 'Unlock Component',
    'contextMenu.moveUp': 'Move Up',
    'contextMenu.moveDown': 'Move Down',
    'contextMenu.moveToTop': 'Move to Top',
    'contextMenu.moveToBottom': 'Move to Bottom',

    // Keyboard Shortcuts
    'shortcuts.title': 'Keyboard Shortcuts',
    'shortcuts.copyComponent': 'Copy selected component',
    'shortcuts.pasteComponent': 'Paste component',
    'shortcuts.duplicateComponent': 'Duplicate component',
    'shortcuts.selectAll': 'Select all components',
    'shortcuts.undo': 'Undo',
    'shortcuts.redo': 'Redo',
    'shortcuts.deleteComponent': 'Delete selected component',
    'shortcuts.cancelSelect': 'Cancel selection',
    'shortcuts.forceNest': 'Force nest into container',
    'shortcuts.forceSibling': 'Force place before/after container',
    'shortcuts.drag': '+ Drag',

    // Drag & Drop
    'dnd.dropIntoContainer': 'Drop into "{label}"',
    'dnd.container': 'Container',

    // Form Submit
    'form.submitSuccess': 'Submitted successfully!',
    'form.submitFailed': 'Submission failed, please retry',
    'form.submitError': 'Submission failed, please check network',
    'form.validationPassed': 'Form validation passed!',
    'form.submittedData': 'Submitted data:',
    'form.formData': 'Form data:',
    'form.submitError2': 'Submit error:',

    // Performance Panel
    'perf.title': 'Performance Monitor',
    'perf.reset': 'Reset Stats',
    'perf.resetSuccess': 'Performance stats reset',
    'perf.testFailed': 'Performance test failed',
    'perf.runTest': 'Run Performance Test',
    'perf.testing': 'Testing...',
    'perf.exportReport': 'Export Report',
    'perf.exportSuccess': 'Performance report exported',
    'perf.monitoring': 'Monitoring',
    'perf.paused': 'Paused',
    'perf.currentFps': 'Current FPS',
    'perf.avgFps': 'Average FPS',
    'perf.smooth': 'Smooth',
    'perf.normal': 'Normal',
    'perf.laggy': 'Laggy',
    'perf.stability': 'Stability',
    'perf.range': 'Range',
    'perf.noData': 'No data',
    'perf.componentCount': 'Components',
    'perf.renderCount': 'Renders',
    'perf.renderStats': 'Render Stats',
    'perf.totalRenders': 'Total Renders',
    'perf.longTasks': 'Long Tasks (>50ms)',
    'perf.memoryUsage': 'Memory Usage',
    'perf.topRenders': 'Top 5 Render Components',
    'perf.noRenderData': 'No data, interact with the page to trigger renders',
    'perf.times': 'times',
    'perf.stressTest': 'Stress Test',
    'perf.stressTestDesc': 'Quick test performance with different data volumes',
    'perf.components100': '100 Components',
    'perf.components500': '500 Components',
    'perf.components1000': '1000 Components',
    'perf.stressTestWarning': 'Large-scale tests will add many components to canvas',
    'perf.tracing': 'Tracing (Drag & Drop / Generators)',
    'perf.recentTraces': 'Recent {count} entries (auto-sampling key interactions)',
    'perf.clear': 'Clear',
    'perf.noTracingData': 'No data: try dragging components or exporting code',
    'perf.optimizeTips': 'Optimization Tips',
    'perf.tip1': 'Auto virtual scroll when components > 50',
    'perf.tip2': 'Use React.memo to reduce unnecessary renders',
    'perf.tip3': 'Cache results with useMemo/useCallback',
    'perf.tip4': 'Use Zustand selectors for precise subscriptions',
    'perf.tip5': 'Debounce/throttle high-frequency operations',
    'perf.lowFpsWarning': 'Low FPS detected, consider reducing components or optimizing renders',
    'perf.longTaskWarning': 'Detected {count} long tasks, may affect interaction response',
    'perf.addingComponents': 'Adding {count} components...',
    'perf.testComplete': 'Test complete! Added {count} components in {duration}ms',

    // Stats extras
    'stats.levels': 'levels',
    'stats.components': 'components',

    // Template extras
    'template.use': 'Use Template',
    'template.deleteTitle': 'Delete Template',
    'template.nameRequired': 'Please enter template name',

    // Error Boundary
    'errorBoundary.title': 'Something went wrong',
    'errorBoundary.description': 'Sorry, the application encountered an issue. You can try refreshing the page or resetting the app.',
    'errorBoundary.errorId': 'Error ID',
    'errorBoundary.errorMessage': 'Error Message',
    'errorBoundary.errorStack': 'Error Stack',
    'errorBoundary.refresh': 'Refresh Page',
    'errorBoundary.copyError': 'Copy Error Info',
    'errorBoundary.reset': 'Reset App',
    'errorBoundary.details': 'Error Details (Development Only)',

    // Store History Labels
    'history.add': 'Add {type}',
    'history.update': 'Update Component Properties',
    'history.delete': 'Delete Component',
    'history.deleteMultiple': 'Delete {count} Components',
    'history.reorder': 'Reorder Components',
    'history.move': 'Move Component',
    'history.movePosition': 'Move Component Position',
    'history.batchAdd': 'Batch Add {count} Components',
    'history.paste': 'Paste {count} Components',
    'history.duplicate': 'Duplicate {count} Components',
    'history.cut': 'Cut {count} Components',
    'history.clear': 'Clear Canvas',
    'history.import': 'Import Components',
    'history.toggleLock': 'Toggle Lock',

    // Validation Messages
    'validation.required': 'This field is required',
    'validation.email': 'Please enter a valid email address',
    'validation.phone': 'Please enter a valid phone number',
    'validation.minLength': 'Minimum {min} characters required',
    'validation.maxLength': 'Maximum {max} characters allowed',
    'validation.min': 'Cannot be less than {min}',
    'validation.max': 'Cannot be greater than {max}',
    'validation.pattern': 'Invalid format',
    'validation.url': 'Please enter a valid URL',
    'validation.number': 'Please enter a valid number',
    'validation.integer': 'Please enter an integer',
    'validation.empty': 'Cannot be empty',
    'validation.defaultLabel': 'This field',
    'validation.defaultMessage': 'Please enter {label}',

    // Property Panel - Container Config
    'propertyPanel.containerTitle': 'Container Title',
    'propertyPanel.layoutDirection': 'Layout Direction',
    'propertyPanel.vertical': 'Vertical',
    'propertyPanel.horizontal': 'Horizontal',
    'propertyPanel.gridColumns': 'Grid Columns',
    'propertyPanel.gridColumnsTooltip': 'Number of grid columns inside the container for child component layout',
    'propertyPanel.column': '{count} Column(s)',
    'propertyPanel.columnGap': 'Column Gap',

    // Property Panel - Options Editor
    'propertyPanel.optionsConfig': 'Options Configuration',
    'propertyPanel.optionLabel': 'Display Name',
    'propertyPanel.optionValue': 'Value',
    'propertyPanel.addOption': 'Add Option',
    'propertyPanel.defaultOption': 'Option {index}',

    // Property Panel - Button Config
    'propertyPanel.buttonText': 'Button Text',
    'propertyPanel.buttonType': 'Button Type',
    'propertyPanel.primaryButton': 'Primary',
    'propertyPanel.defaultButton': 'Default',
    'propertyPanel.dashedButton': 'Dashed',
    'propertyPanel.textButton': 'Text',
    'propertyPanel.linkButton': 'Link',
    'propertyPanel.htmlType': 'HTML Type',
    'propertyPanel.normalButton': 'Button',
    'propertyPanel.submitButton': 'Submit',
    'propertyPanel.resetButton': 'Reset',
    'propertyPanel.submitConfig': 'Submit Configuration',
    'propertyPanel.submitUrl': 'Submit URL',
    'propertyPanel.submitUrlPlaceholder': 'e.g.: /api/submit',
    'propertyPanel.requestMethod': 'Request Method',
    'propertyPanel.successMessage': 'Success Message',
    'propertyPanel.successMessagePlaceholder': 'Submitted successfully!',
    'propertyPanel.errorMessage': 'Error Message',
    'propertyPanel.errorMessagePlaceholder': 'Submission failed, please retry',
    'propertyPanel.successRedirect': 'Success Redirect',
    'propertyPanel.successRedirectPlaceholder': 'e.g.: /success',

    // Property Panel - Validation Config
    'propertyPanel.validationRules': 'Validation Rules',
    'propertyPanel.addedRules': 'Added Rules:',
    'propertyPanel.noRules': 'No validation rules yet',
    'propertyPanel.addRule': 'Add Rule',
    'propertyPanel.ruleType': 'Rule Type',
    'propertyPanel.minLengthRule': 'Min Length',
    'propertyPanel.maxLengthRule': 'Max Length',
    'propertyPanel.minRule': 'Min Value',
    'propertyPanel.maxRule': 'Max Value',
    'propertyPanel.patternRule': 'Pattern',
    'propertyPanel.errorTip': 'Error Message',
    'propertyPanel.errorTipPlaceholder': 'Error message',
    'propertyPanel.regexLabel': 'Regex',
    'propertyPanel.regexPlaceholder': 'Regular expression',
    'propertyPanel.ruleRequired': 'Required',
    'propertyPanel.ruleEmail': 'Email',
    'propertyPanel.rulePhone': 'Phone',
    'propertyPanel.ruleDescription.minLength': 'Length cannot be less than specified value',
    'propertyPanel.ruleDescription.maxLength': 'Length cannot exceed specified value',
    'propertyPanel.ruleDescription.min': 'Value cannot be less than specified value',
    'propertyPanel.ruleDescription.max': 'Value cannot be greater than specified value',
    'propertyPanel.ruleDescription.pattern': 'Must match the specified regular expression',

    // Property Panel - Responsive Config
    'propertyPanel.responsiveLayout': 'Responsive Layout',
    'propertyPanel.columnSpan': 'Column Span',
    'propertyPanel.columnSpanTooltip': 'Number of columns occupied in the 24-grid system',
    'propertyPanel.fullWidth': 'Full Width (24)',
    'propertyPanel.threeQuarter': '3/4 Width (18)',
    'propertyPanel.twoThird': '2/3 Width (16)',
    'propertyPanel.half': '1/2 Width (12)',
    'propertyPanel.oneThird': '1/3 Width (8)',
    'propertyPanel.quarter': '1/4 Width (6)',
    'propertyPanel.responsiveConfig': 'Responsive Config',
    'propertyPanel.responsiveTooltip': 'Column span for different screen sizes',
    'propertyPanel.mobile': 'Mobile (xs)',
    'propertyPanel.tablet': 'Tablet (sm)',
    'propertyPanel.desktop': 'Desktop (md)',
    'propertyPanel.largeScreen': 'Large Screen (lg)',

    // Property Panel - Linkage Config
    'propertyPanel.componentLinkage': 'Component Linkage',
    'propertyPanel.visibleCondition': 'Visible Condition (visibleOn)',
    'propertyPanel.visibleTooltip': 'Only safe expressions supported, e.g.: values[\'xxx\'] === \'show\'',
    'propertyPanel.expressionError': 'Expression error: {error}',
    'propertyPanel.visiblePlaceholder': 'e.g.: values[\'{id}\'] === \'show\'',
    'propertyPanel.availableIds': 'Available Component IDs:',

    // Component Registry Defaults
    'component.container': 'Container',
    'component.input': 'Input',
    'component.inputLabel': 'Input Field',
    'component.inputPlaceholder': 'Please enter...',
    'component.labelTitle': 'Label',
    'component.placeholderText': 'Placeholder',
    'component.requiredYes': 'Required',
    'component.requiredNo': 'Optional',
    'component.textarea': 'TextArea',
    'component.textareaLabel': 'Text Area',
    'component.textareaPlaceholder': 'Please enter text...',
    'component.inputNumber': 'Number Input',
    'component.inputNumberLabel': 'Number',
    'component.inputNumberPlaceholder': 'Please enter a number',
    'component.select': 'Select',
    'component.selectLabel': 'Selector',
    'component.selectPlaceholder': 'Please select',
    'component.radio': 'Radio',
    'component.radioLabel': 'Radio Group',
    'component.checkbox': 'Checkbox',
    'component.checkboxLabel': 'Checkbox Group',
    'component.switch': 'Switch',
    'component.switchLabel': 'Switch',
    'component.switchCheckedText': 'Checked Text',
    'component.switchUncheckedText': 'Unchecked Text',
    'component.datePicker': 'Date Picker',
    'component.datePickerLabel': 'Date',
    'component.datePickerPlaceholder': 'Select date',
    'component.timePicker': 'Time Picker',
    'component.timePickerLabel': 'Time',
    'component.timePickerPlaceholder': 'Select time',
    'component.button': 'Button',
    'component.buttonText': 'Submit',

    // Drag & Drop Messages
    'dnd.insertBefore': '↑ Insert Above',
    'dnd.insertAfter': '↓ Insert Below',
    'dnd.level': 'Level {level}',
    'dnd.dropInto': 'Drop into "{label}"',
    'dnd.releaseHere': '📥 Release to drop here',
    'dnd.dragHere': '📦 Drag components here',
    'dnd.cannotNestSelf': 'Cannot nest container into itself',
    'dnd.moving': 'Moving...',
    'dnd.virtualScrollEnabled': '⚡ Virtualization enabled ({count} components)',

    // Canvas Messages
    'canvas.dragFromLeft': 'Drag components from the left panel here',
    'canvas.addComponent': 'Add Component',
    'canvas.editProperties': 'Edit Properties',
    'canvas.locked': '🔒 Locked',
    'canvas.conditionalHidden': '🔗 Conditional Hidden: {condition}',
    'canvas.conditionalRender': 'Conditional Render: {condition}',

    // History Panel
    'historyPanel.title': 'Operation History',
    'historyPanel.operations': '{count} Operation(s)',
    'historyPanel.empty': 'No operation history yet',
    'historyPanel.initialState': 'Initial State',
    'historyPanel.current': 'Current',
    'historyPanel.components': '{count} Component(s)',
    'historyPanel.canRedo': 'Can Redo',
    'historyPanel.tip1': 'Click on history to jump to that state',
    'historyPanel.tip2': 'Ctrl+Z to undo, Ctrl+Shift+Z to redo',

    // Form Stats
    'formStats.input': 'Input',
    'formStats.textarea': 'TextArea',
    'formStats.inputNumber': 'Number Input',
    'formStats.select': 'Select',
    'formStats.radio': 'Radio',
    'formStats.checkbox': 'Checkbox',
    'formStats.switch': 'Switch',
    'formStats.datePicker': 'Date Picker',
    'formStats.timePicker': 'Time Picker',
    'formStats.button': 'Button',
    'formStats.container': 'Container',

    // Keyboard Shortcuts Panel
    'keyboardShortcuts.clickComponent': 'Click Component',
    'keyboardShortcuts.selectComponent': 'Select Component',
    'keyboardShortcuts.multiSelect': 'Multi-select Components',
    'keyboardShortcuts.editOperations': 'Edit Operations',
    'keyboardShortcuts.mouseOperations': 'Mouse Operations',
    'keyboardShortcuts.dragModifiers': 'Drag Modifiers',

    // Toast Messages
    'toast.cannotDeleteLocked': 'Cannot delete locked component',
    'toast.componentsCopied': 'Copied {count} component(s)',
    'toast.componentsPasted': 'Pasted {count} component(s)',
    'toast.componentDuplicated': 'Component duplicated',
    'toast.cannotNestIntoSelf': 'Cannot nest container into itself',

    // Code Generator
    'codeGen.autoGenerated': 'Auto-generated form component',
    'codeGen.generatedAt': 'Generated at: {time}',
    'codeGen.formSubmitLog': 'Form submission data:',
    'codeGen.todoComment': 'TODO: Add your submission logic here',
    'codeGen.containerComment': 'Container',
    'codeGen.containerContent': 'Container Content',
    'codeGen.conditionalComment': 'Conditional Render: {condition}',
    'codeGen.defaultButton': 'Button',
    'codeGen.defaultContainer': 'Container',
    'codeGen.formDataLog': 'Form data:',
};

// 翻译表
const translations = {
    'zh-CN': zhCN,
    'en-US': enUS,
} as const;

// 语言名称
// eslint-disable-next-line react-refresh/only-export-components
export const localeNames: Record<Locale, string> = {
    'zh-CN': '简体中文',
    'en-US': 'English',
};

// Context 类型
interface I18nContextType {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

// 本地存储 key
const LOCALE_STORAGE_KEY = 'low-code-form-locale';

// 获取默认语言
function getDefaultLocale(): Locale {
    // 1. 从本地存储读取（某些环境下 localStorage 可能不可用，需兜底避免首屏崩溃）
    try {
        const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
        if (stored && (stored === 'zh-CN' || stored === 'en-US')) {
            return stored;
        }
    } catch {
        // ignore
    }

    // 2. 从浏览器语言推断
    try {
        const browserLang = navigator.language ?? '';
        if (browserLang.startsWith('zh')) {
            return 'zh-CN';
        }
    } catch {
        // ignore
    }

    return 'en-US';
}

// Provider 组件
export function I18nProvider({ children }: { children: ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>(getDefaultLocale);

    const setLocale = useCallback((newLocale: Locale) => {
        setLocaleState(newLocale);
        localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
        // 更新 HTML lang 属性
        document.documentElement.lang = newLocale;
    }, []);

    // 初始化时设置 HTML lang
    useEffect(() => {
        document.documentElement.lang = locale;
    }, [locale]);

    // 翻译函数
    const t = useCallback((key: TranslationKey, params?: Record<string, string | number>): string => {
        let text = translations[locale][key] || key;

        // 替换参数
        if (params) {
            Object.entries(params).forEach(([paramKey, value]) => {
                text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(value));
            });
        }

        return text;
    }, [locale]);

    return (
        <I18nContext.Provider value={{ locale, setLocale, t }}>
            {children}
        </I18nContext.Provider>
    );
}

// Hook
// eslint-disable-next-line react-refresh/only-export-components
export function useI18n() {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error('useI18n must be used within an I18nProvider');
    }
    return context;
}

// 非 React 环境下的翻译函数（用于 api.ts、store.ts 等非组件文件）
// eslint-disable-next-line react-refresh/only-export-components
export function getI18nInstance() {
    const locale = getDefaultLocale();
    return {
        locale,
        t: (key: TranslationKey, params?: Record<string, string | number>): string => {
            let text = translations[locale][key] || key;
            if (params) {
                Object.entries(params).forEach(([paramKey, value]) => {
                    text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(value));
                });
            }
            return text;
        },
    };
}

// 导出翻译 key 类型供其他文件使用
export type { TranslationKey };
