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
    'perf.title': '性能监控',
    'perf.reset': '重置',
    'perf.resetSuccess': '性能统计已重置',
    'perf.testFailed': '性能测试失败',
    'perf.runTest': '运行性能测试',
    'perf.testing': '测试中...',

    // Stats extras
    'stats.levels': '层',
    'stats.components': '个组件',

    // Template extras
    'template.use': '使用模板',
    'template.deleteTitle': '删除模板',
    'template.nameRequired': '请输入模板名称',
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
    'perf.title': 'Performance',
    'perf.reset': 'Reset',
    'perf.resetSuccess': 'Performance stats reset',
    'perf.testFailed': 'Performance test failed',
    'perf.runTest': 'Run Performance Test',
    'perf.testing': 'Testing...',

    // Stats extras
    'stats.levels': 'levels',
    'stats.components': 'components',

    // Template extras
    'template.use': 'Use Template',
    'template.deleteTitle': 'Delete Template',
    'template.nameRequired': 'Please enter template name',
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
    // 1. 从本地存储读取
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored && (stored === 'zh-CN' || stored === 'en-US')) {
        return stored;
    }

    // 2. 从浏览器语言推断
    const browserLang = navigator.language;
    if (browserLang.startsWith('zh')) {
        return 'zh-CN';
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

// 导出翻译 key 类型供其他文件使用
export type { TranslationKey };
