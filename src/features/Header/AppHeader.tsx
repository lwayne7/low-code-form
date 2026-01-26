/**
 * AppHeader - 顶部工具栏
 * 
 * 包含 logo、撤销/重做、工具栏、模板、JSON/导出按钮等
 */

import React from 'react';
import { Layout, Button, Modal, Tooltip, Space, Divider, Dropdown, Typography, Input, message } from 'antd';
import {
    UndoOutlined,
    RedoOutlined,
    CodeOutlined,
    EyeOutlined,
    FileAddOutlined,
    ClearOutlined,
    RocketOutlined,
    QuestionCircleOutlined,
    HistoryOutlined,
    SaveOutlined,
    DeleteOutlined,
    DashboardOutlined,
    SunOutlined,
    MoonOutlined,
    SettingOutlined,
    ExportOutlined,
} from '@ant-design/icons';
import { Toolbar, FormStats } from '../../components';
import { formTemplates } from '../../utils/formTemplates';
import { useStore, type CustomTemplate } from '../../store';
import { generateFullCode, generateJsonSchema } from '../../utils';
import type { ComponentSchema } from '../../types';
import type { ThemeMode } from '../../hooks';

const { Header } = Layout;
const { Title } = Typography;

interface AppHeaderProps {
    isDark: boolean;
    themeMode: ThemeMode;
    setThemeMode: (mode: ThemeMode) => void;
    components: ComponentSchema[];
    history: { past: ComponentSchema[][]; future: ComponentSchema[][] };
    undo: () => void;
    redo: () => void;
    resetCanvas: () => void;
    customTemplates: CustomTemplate[];
    saveAsTemplate: (name: string, description?: string) => void;
    deleteTemplate: (id: string) => void;
    addComponents: (components: ComponentSchema[]) => void;
    importComponents: (components: ComponentSchema[]) => void;
    onPreviewOpen: () => void;
    onShortcutsOpen: () => void;
    onHistoryOpen: () => void;
    onPerfPanelOpen: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
    isDark,
    themeMode,
    setThemeMode,
    components,
    history,
    undo,
    redo,
    resetCanvas,
    customTemplates,
    saveAsTemplate,
    deleteTemplate,
    addComponents,
    importComponents,
    onPreviewOpen,
    onShortcutsOpen,
    onHistoryOpen,
    onPerfPanelOpen,
}) => {
    // JSON 导入导出
    const handleShowJson = () => {
        let jsonValue = JSON.stringify(components, null, 2);

        Modal.confirm({
            title: '表单 Schema',
            width: 600,
            icon: <CodeOutlined />,
            content: (
                <Input.TextArea
                    defaultValue={jsonValue}
                    rows={15}
                    onChange={(e) => {
                        jsonValue = e.target.value;
                    }}
                    style={{ fontFamily: 'monospace', marginTop: 10 }}
                />
            ),
            okText: '导入 (覆盖)',
            cancelText: '关闭',
            onOk: () => {
                try {
                    const parsed = JSON.parse(jsonValue);
                    useStore.setState({
                        components: parsed,
                        selectedIds: [],
                        history: { past: [], future: [] },
                    });
                    message.success('导入成功');
                } catch {
                    message.error('JSON 格式错误');
                    return Promise.reject();
                }
            },
        });
    };

    // 代码导出
    const handleExportCode = () => {
        const code = generateFullCode(components);
        const jsonSchema = JSON.stringify(generateJsonSchema(components), null, 2);

        Modal.info({
            title: '导出代码',
            width: 900,
            icon: <CodeOutlined />,
            content: (
                <div>
                    <div style={{ marginBottom: 16 }}>
                        <strong>React 组件代码：</strong>
                    </div>
                    <Input.TextArea
                        value={code}
                        autoSize={{ minRows: 15, maxRows: 25 }}
                        readOnly
                        style={{ fontFamily: 'monospace', background: '#f5f5f5', fontSize: 12 }}
                    />
                    <div style={{ marginTop: 16, marginBottom: 8 }}>
                        <strong>JSON Schema（可用于后端校验）：</strong>
                    </div>
                    <Input.TextArea
                        value={jsonSchema}
                        autoSize={{ minRows: 5, maxRows: 10 }}
                        readOnly
                        style={{ fontFamily: 'monospace', background: '#f5f5f5', fontSize: 12 }}
                    />
                </div>
            ),
        });
    };

    return (
        <Header
            className="app-header"
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: isDark ? '#1f1f1f' : '#fff',
                padding: '0 24px',
                borderBottom: `1px solid ${isDark ? '#303030' : '#f0f0f0'}`,
                height: 64,
                zIndex: 10,
                flexWrap: 'nowrap',
                gap: 12,
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: '1 1 auto' }}>
                <div
                    style={{
                        width: 32,
                        height: 32,
                        background: 'linear-gradient(135deg, #1677ff 0%, #80b3ff 100%)',
                        borderRadius: 6,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        flexShrink: 0,
                    }}
                >
                    <RocketOutlined style={{ fontSize: 18 }} />
                </div>
                <Title level={4} className="app-title" style={{ margin: 0, fontWeight: 600, fontSize: 18, whiteSpace: 'nowrap' }}>
                    LowCode Form
                </Title>
                <Divider type="vertical" className="header-divider" style={{ height: 24, margin: '0 8px' }} />
                <Space size="small">
                    <Tooltip title="撤销 (Cmd/Ctrl + Z)">
                        <Button
                            icon={<UndoOutlined />}
                            disabled={history.past.length === 0}
                            onClick={undo}
                            type="text"
                        />
                    </Tooltip>
                    <Tooltip title="重做 (Cmd/Ctrl + Shift + Z)">
                        <Button
                            icon={<RedoOutlined />}
                            disabled={history.future.length === 0}
                            onClick={redo}
                            type="text"
                        />
                    </Tooltip>
                    <Tooltip title="操作历史">
                        <Button
                            icon={<HistoryOutlined />}
                            onClick={onHistoryOpen}
                            type="text"
                        />
                    </Tooltip>
                    <Divider type="vertical" style={{ height: 20, margin: '0 4px' }} />
                    <Toolbar />
                    <Divider type="vertical" style={{ height: 20, margin: '0 4px' }} />
                    <FormStats />
                    <Divider type="vertical" style={{ height: 20, margin: '0 4px' }} />
                    <Tooltip title="清空画布">
                        <Button
                            icon={<ClearOutlined />}
                            disabled={components.length === 0}
                            onClick={() => {
                                Modal.confirm({
                                    title: '确认清空',
                                    content: '确定要清空画布吗？此操作可以通过撤销恢复。',
                                    okText: '清空',
                                    okType: 'danger',
                                    cancelText: '取消',
                                    onOk: () => {
                                        resetCanvas();
                                        message.success('画布已清空');
                                    },
                                });
                            }}
                            type="text"
                            danger
                        />
                    </Tooltip>
                    <Tooltip title="快捷键">
                        <Button
                            icon={<QuestionCircleOutlined />}
                            onClick={onShortcutsOpen}
                            type="text"
                        />
                    </Tooltip>
                    <Tooltip title="性能监控">
                        <Button
                            icon={<DashboardOutlined />}
                            onClick={onPerfPanelOpen}
                            type="text"
                        />
                    </Tooltip>
                    <Dropdown
                        menu={{
                            items: [
                                {
                                    key: 'light',
                                    icon: <SunOutlined />,
                                    label: '亮色模式',
                                    onClick: () => setThemeMode('light'),
                                },
                                {
                                    key: 'dark',
                                    icon: <MoonOutlined />,
                                    label: '深色模式',
                                    onClick: () => setThemeMode('dark'),
                                },
                                { type: 'divider' as const },
                                {
                                    key: 'auto',
                                    icon: <SettingOutlined />,
                                    label: '跟随系统',
                                    onClick: () => setThemeMode('auto'),
                                },
                            ],
                            selectedKeys: [themeMode],
                        }}
                        placement="bottomRight"
                        trigger={['click']}
                    >
                        <Button
                            icon={isDark ? <MoonOutlined /> : <SunOutlined />}
                            type="text"
                            title={`主题: ${themeMode === 'light' ? '亮色' : themeMode === 'dark' ? '深色' : '跟随系统'}`}
                        />
                    </Dropdown>
                </Space>
            </div>
            <Space size="small" style={{ flexShrink: 0 }}>
                <Dropdown
                    menu={{
                        items: [
                            // 内置模板
                            {
                                key: 'builtin',
                                type: 'group',
                                label: '📦 内置模板',
                                children: formTemplates.map(template => ({
                                    key: template.id,
                                    label: (
                                        <div style={{ padding: '4px 0' }}>
                                            <span style={{ marginRight: 8 }}>{template.icon}</span>
                                            <strong>{template.name}</strong>
                                            <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                                                {template.description}
                                            </div>
                                        </div>
                                    ),
                                    onClick: () => {
                                        if (components.length > 0) {
                                            Modal.confirm({
                                                title: '使用模板',
                                                content: '使用模板将清空当前画布内容，是否继续？',
                                                onOk: () => {
                                                    useStore.setState({
                                                        components: template.getComponents(),
                                                        selectedIds: [],
                                                        history: { past: [], future: [] },
                                                    });
                                                    message.success(`已应用「${template.name}」模板`);
                                                },
                                            });
                                        } else {
                                            addComponents(template.getComponents());
                                            message.success(`已应用「${template.name}」模板`);
                                        }
                                    },
                                })),
                            },
                            // 自定义模板
                            ...(customTemplates.length > 0 ? [
                                { type: 'divider' as const },
                                {
                                    key: 'custom',
                                    type: 'group' as const,
                                    label: '⭐ 我的模板',
                                    children: customTemplates.map(template => ({
                                        key: template.id,
                                        label: (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                                                <div>
                                                    <strong>{template.name}</strong>
                                                    {template.description && (
                                                        <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                                                            {template.description}
                                                        </div>
                                                    )}
                                                </div>
                                                <DeleteOutlined
                                                    style={{ color: '#ff4d4f', marginLeft: 8 }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        Modal.confirm({
                                                            title: '删除模板',
                                                            content: `确定删除「${template.name}」模板吗？`,
                                                            okType: 'danger',
                                                            onOk: () => {
                                                                deleteTemplate(template.id);
                                                                message.success('模板已删除');
                                                            },
                                                        });
                                                    }}
                                                />
                                            </div>
                                        ),
                                        onClick: () => {
                                            if (components.length > 0) {
                                                Modal.confirm({
                                                    title: '使用模板',
                                                    content: '使用模板将清空当前画布内容，是否继续？',
                                                    onOk: () => {
                                                        importComponents(template.components);
                                                        message.success(`已应用「${template.name}」模板`);
                                                    },
                                                });
                                            } else {
                                                importComponents(template.components);
                                                message.success(`已应用「${template.name}」模板`);
                                            }
                                        },
                                    })),
                                },
                            ] : []),
                            // 保存当前为模板
                            { type: 'divider' as const },
                            {
                                key: 'save',
                                icon: <SaveOutlined />,
                                label: '保存为模板',
                                disabled: components.length === 0,
                                onClick: () => {
                                    Modal.confirm({
                                        title: '保存为模板',
                                        content: (
                                            <div style={{ marginTop: 16 }}>
                                                <Input
                                                    id="template-name-input"
                                                    placeholder="请输入模板名称"
                                                    style={{ marginBottom: 8 }}
                                                />
                                                <Input.TextArea
                                                    id="template-desc-input"
                                                    placeholder="模板描述（可选）"
                                                    rows={2}
                                                />
                                            </div>
                                        ),
                                        onOk: () => {
                                            const name = (document.getElementById('template-name-input') as HTMLInputElement)?.value;
                                            const desc = (document.getElementById('template-desc-input') as HTMLTextAreaElement)?.value;
                                            if (!name?.trim()) {
                                                message.error('请输入模板名称');
                                                return Promise.reject();
                                            }
                                            saveAsTemplate(name.trim(), desc?.trim());
                                            message.success('模板已保存');
                                        },
                                    });
                                },
                            },
                        ],
                    }}
                    placement="bottomRight"
                >
                    <Button icon={<FileAddOutlined />} style={isDark ? { color: '#e6e6e6', borderColor: '#404040' } : undefined}>
                        <span className="btn-text">模板</span>
                    </Button>
                </Dropdown>
                <Button icon={<CodeOutlined />} onClick={handleShowJson} style={isDark ? { color: '#e6e6e6', borderColor: '#404040' } : undefined}>
                    <span className="btn-text">JSON</span>
                </Button>
                <Button icon={<ExportOutlined />} onClick={handleExportCode} style={isDark ? { color: '#e6e6e6', borderColor: '#404040' } : undefined}>
                    <span className="btn-text">导出</span>
                </Button>
                <Button type="primary" icon={<EyeOutlined />} onClick={onPreviewOpen}>
                    <span className="btn-text">预览</span>
                </Button>
            </Space>
        </Header>
    );
};

export default AppHeader;
