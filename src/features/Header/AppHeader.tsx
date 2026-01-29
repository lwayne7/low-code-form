/**
 * AppHeader - 顶部工具栏
 * 
 * 包含 logo、撤销/重做、工具栏、模板、JSON/导出按钮等
 */

import React, { useState, useEffect } from 'react';
import { Layout, Button, Modal, Tooltip, Space, Divider, Dropdown, Typography, Input, message, Avatar } from 'antd';
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
    CloudUploadOutlined,
    CloudDownloadOutlined,
    UserOutlined,
    LogoutOutlined,
    ExclamationCircleOutlined,
    GlobalOutlined,
} from '@ant-design/icons';
import { Toolbar, FormStats } from '../../components';
import { AuthModal } from '../../components/common/AuthModal';
import { CloudFormsModal } from '../../components/common/CloudFormsModal';
import { SaveToCloudModal } from '../../components/common/SaveToCloudModal';
import { formTemplates } from '../../utils/formTemplates';
import { useStore, type CustomTemplate } from '../../store';
import { useAuthStore } from '../../services/authStore';
import { useI18n, localeNames, type Locale } from '../../i18n';
import { countComponents, generateFullCode, generateJsonSchema, startTrace } from '../../utils';
import type { ComponentSchema } from '../../types';
import type { ThemeMode } from '../../hooks';
import type { HistoryEntry } from '../../store';

const { Header } = Layout;
const { Title } = Typography;

interface AppHeaderProps {
    isDark: boolean;
    themeMode: ThemeMode;
    setThemeMode: (mode: ThemeMode) => void;
    components: ComponentSchema[];
    history: { past: HistoryEntry[]; future: HistoryEntry[] };
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
    // 云端功能状态
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [cloudFormsModalOpen, setCloudFormsModalOpen] = useState(false);
    const [saveToCloudModalOpen, setSaveToCloudModalOpen] = useState(false);

    // 用户认证状态
    const { user, logout, checkAuth, deleteAccount } = useAuthStore();

    // 国际化
    const { locale, setLocale, t } = useI18n();

    // 初始化时检查认证状态
    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    // JSON 导入导出
    const handleShowJson = () => {
        let jsonValue = JSON.stringify(components, null, 2);

        Modal.confirm({
            title: t('json.title'),
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
            okText: t('json.importOverride'),
            cancelText: t('common.close'),
            onOk: () => {
                try {
                    const parsed = JSON.parse(jsonValue);
                    useStore.setState({
                        components: parsed,
                        selectedIds: [],
                        history: { past: [], future: [] },
                    });
                    message.success(t('json.importSuccess'));
                } catch {
                    message.error(t('error.jsonFormat'));
                    return Promise.reject();
                }
            },
        });
    };

    // 代码导出
    const handleExportCode = () => {
        const componentCount = countComponents(components);

        const stopReact = startTrace('generator.react', { componentCount });
        const code = generateFullCode(components);
        stopReact({ outputChars: code.length });

        const stopSchema = startTrace('generator.jsonSchema', { componentCount });
        const schemaObject = generateJsonSchema(components);
        const jsonSchema = JSON.stringify(schemaObject, null, 2);
        stopSchema({ outputChars: jsonSchema.length });

        Modal.info({
            title: t('export.title'),
            width: 900,
            icon: <CodeOutlined />,
            content: (
                <div>
                    <div style={{ marginBottom: 16 }}>
                        <strong>{t('export.reactCode')}</strong>
                    </div>
                    <Input.TextArea
                        value={code}
                        autoSize={{ minRows: 15, maxRows: 25 }}
                        readOnly
                        style={{ fontFamily: 'monospace', background: '#f5f5f5', fontSize: 12 }}
                    />
                    <div style={{ marginTop: 16, marginBottom: 8 }}>
                        <strong>{t('export.jsonSchema')}</strong>
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
        <>
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
                        {t('header.title')}
                    </Title>
                    <Divider type="vertical" className="header-divider" style={{ height: 24, margin: '0 8px' }} />
                    <Space size={4} wrap={false} style={{ flexShrink: 0 }}>
                        <Tooltip title={`${t('header.undo')} (Cmd/Ctrl + Z)`}>
                            <Button
                                icon={<UndoOutlined />}
                                disabled={history.past.length === 0}
                                onClick={undo}
                                type="text"
                            />
                        </Tooltip>
                        <Tooltip title={`${t('header.redo')} (Cmd/Ctrl + Shift + Z)`}>
                            <Button
                                icon={<RedoOutlined />}
                                disabled={history.future.length === 0}
                                onClick={redo}
                                type="text"
                            />
                        </Tooltip>
                        <Tooltip title={t('header.history')}>
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
                    </Space>
                </div>
                {/* 右侧工具按钮区域 - 始终可见 */}
                <Space size={4} wrap={false} style={{ flexShrink: 0 }}>
                    <Tooltip title={t('header.clear')}>
                        <Button
                            icon={<ClearOutlined />}
                            disabled={components.length === 0}
                            onClick={() => {
                                Modal.confirm({
                                    title: t('canvas.confirmClear'),
                                    content: t('canvas.clearWarning'),
                                    okText: t('header.clear'),
                                    okType: 'danger',
                                    cancelText: t('common.cancel'),
                                    onOk: () => {
                                        resetCanvas();
                                        message.success(t('canvas.cleared'));
                                    },
                                });
                            }}
                            type="text"
                            danger
                        />
                    </Tooltip>
                    <Tooltip title={t('header.shortcuts')}>
                        <Button
                            icon={<QuestionCircleOutlined />}
                            onClick={onShortcutsOpen}
                            type="text"
                        />
                    </Tooltip>
                    <Tooltip title={t('header.performance')}>
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
                                    label: t('header.theme.light'),
                                    onClick: () => setThemeMode('light'),
                                },
                                {
                                    key: 'dark',
                                    icon: <MoonOutlined />,
                                    label: t('header.theme.dark'),
                                    onClick: () => setThemeMode('dark'),
                                },
                                { type: 'divider' as const },
                                {
                                    key: 'auto',
                                    icon: <SettingOutlined />,
                                    label: t('header.theme.auto'),
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
                            title={t('header.theme.light')}
                        />
                    </Dropdown>
                </Space>
                <Space size={4} wrap={false} style={{ flexShrink: 0 }}>
                    {/* 语言切换 */}
                    <Dropdown
                        menu={{
                            items: (['zh-CN', 'en-US'] as Locale[]).map(l => ({
                                key: l,
                                label: localeNames[l],
                                onClick: () => setLocale(l),
                            })),
                            selectedKeys: [locale],
                        }}
                        placement="bottomRight"
                        trigger={['click']}
                    >
                        <Button
                            icon={<GlobalOutlined />}
                            type="text"
                            title={localeNames[locale]}
                        />
                    </Dropdown>
                    <Divider type="vertical" className="header-divider" style={{ height: 24 }} />
                    <Dropdown
                        menu={{
                            items: [
                                // 内置模板
                                {
                                    key: 'builtin',
                                    type: 'group',
                                    label: t('template.builtin'),
                                    children: formTemplates.map(template => ({
                                        key: template.id,
                                        label: (
                                            <div style={{ padding: '4px 0' }}>
                                                <span style={{ marginRight: 8 }}>{template.icon}</span>
                                                <strong>{t(`template.${template.id}.name` as keyof typeof t)}</strong>
                                                <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                                                    {t(`template.${template.id}.desc` as keyof typeof t)}
                                                </div>
                                            </div>
                                        ),
                                        onClick: () => {
                                            const templateName = t(`template.${template.id}.name` as keyof typeof t);
                                            if (components.length > 0) {
                                                Modal.confirm({
                                                    title: t('template.use'),
                                                    content: t('template.confirmUse'),
                                                    onOk: () => {
                                                        useStore.setState({
                                                            components: template.getComponents(),
                                                            selectedIds: [],
                                                            history: { past: [], future: [] },
                                                        });
                                                        message.success(t('template.applied', { name: templateName }));
                                                    },
                                                });
                                            } else {
                                                addComponents(template.getComponents());
                                                message.success(t('template.applied', { name: templateName }));
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
                                        label: t('template.custom'),
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
                                                                title: t('template.deleteTitle'),
                                                                content: `${t('cloud.deleteConfirm').replace('这个表单', `「${template.name}」模板`)}`,
                                                                okType: 'danger',
                                                                onOk: () => {
                                                                    deleteTemplate(template.id);
                                                                    message.success(t('template.deleted'));
                                                                },
                                                            });
                                                        }}
                                                    />
                                                </div>
                                            ),
                                            onClick: () => {
                                                if (components.length > 0) {
                                                    Modal.confirm({
                                                        title: t('template.use'),
                                                        content: t('template.confirmUse'),
                                                        onOk: () => {
                                                            importComponents(template.components);
                                                            message.success(t('template.applied', { name: template.name }));
                                                        },
                                                    });
                                                } else {
                                                    importComponents(template.components);
                                                    message.success(t('template.applied', { name: template.name }));
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
                                    label: t('template.saveAs'),
                                    disabled: components.length === 0,
                                    onClick: () => {
                                        Modal.confirm({
                                            title: t('template.saveAs'),
                                            content: (
                                                <div style={{ marginTop: 16 }}>
                                                    <Input
                                                        id="template-name-input"
                                                        placeholder={t('template.namePlaceholder')}
                                                        style={{ marginBottom: 8 }}
                                                    />
                                                    <Input.TextArea
                                                        id="template-desc-input"
                                                        placeholder={t('template.descPlaceholder')}
                                                        rows={2}
                                                    />
                                                </div>
                                            ),
                                            onOk: () => {
                                                const name = (document.getElementById('template-name-input') as HTMLInputElement)?.value;
                                                const desc = (document.getElementById('template-desc-input') as HTMLTextAreaElement)?.value;
                                                if (!name?.trim()) {
                                                    message.error(t('template.nameRequired'));
                                                    return Promise.reject();
                                                }
                                                saveAsTemplate(name.trim(), desc?.trim());
                                                message.success(t('template.saved'));
                                            },
                                        });
                                    },
                                },
                            ],
                        }}
                        placement="bottomRight"
                    >
                        <Button icon={<FileAddOutlined />} style={isDark ? { color: '#e6e6e6', borderColor: '#404040' } : undefined}>
                            <span className="btn-text">{t('header.template')}</span>
                        </Button>
                    </Dropdown>
                    <Button icon={<CodeOutlined />} onClick={handleShowJson} style={isDark ? { color: '#e6e6e6', borderColor: '#404040' } : undefined}>
                        <span className="btn-text">{t('header.json')}</span>
                    </Button>
                    <Button icon={<ExportOutlined />} onClick={handleExportCode} style={isDark ? { color: '#e6e6e6', borderColor: '#404040' } : undefined}>
                        <span className="btn-text">{t('header.export')}</span>
                    </Button>
                    <Button type="primary" icon={<EyeOutlined />} onClick={onPreviewOpen}>
                        <span className="btn-text">{t('header.preview')}</span>
                    </Button>
                    <Divider type="vertical" className="header-divider" style={{ height: 24 }} />
                    {/* 云端功能按钮 - 合并为下拉菜单 */}
                    <Dropdown
                        menu={{
                            items: [
                                {
                                    key: 'save',
                                    icon: <CloudUploadOutlined />,
                                    label: t('header.cloudSave'),
                                    onClick: () => user ? setSaveToCloudModalOpen(true) : setAuthModalOpen(true),
                                },
                                {
                                    key: 'load',
                                    icon: <CloudDownloadOutlined />,
                                    label: t('header.cloudLoad'),
                                    onClick: () => user ? setCloudFormsModalOpen(true) : setAuthModalOpen(true),
                                },
                            ],
                        }}
                        placement="bottomRight"
                    >
                        <Button
                            icon={<CloudUploadOutlined />}
                            style={isDark ? { color: '#e6e6e6', borderColor: '#404040' } : undefined}
                        >
                            <span className="btn-text">{t('header.cloud')}</span>
                        </Button>
                    </Dropdown>
                    <Divider type="vertical" className="header-divider" style={{ height: 24 }} />
                    {/* 用户认证 */}
                    {user ? (
                        <Dropdown
                            menu={{
                                items: [
                                    {
                                        key: 'email',
                                        label: <span style={{ color: '#666' }}>{user.email}</span>,
                                        disabled: true,
                                    },
                                    { type: 'divider' },
                                    {
                                        key: 'logout',
                                        icon: <LogoutOutlined />,
                                        label: t('header.logout'),
                                        onClick: () => {
                                            logout();
                                            message.success(t('auth.logoutSuccess'));
                                        },
                                    },
                                    { type: 'divider' },
                                    {
                                        key: 'delete',
                                        icon: <DeleteOutlined />,
                                        label: t('header.deleteAccount'),
                                        danger: true,
                                        onClick: () => {
                                            Modal.confirm({
                                                title: t('auth.deleteAccountTitle'),
                                                icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
                                                content: (
                                                    <div>
                                                        <p style={{ marginBottom: 8 }}>{t('auth.deleteAccountConfirm')}</p>
                                                        <ul style={{ paddingLeft: 20, color: '#666' }}>
                                                            <li>{t('auth.deleteAccountWarning1')}</li>
                                                            <li>{t('auth.deleteAccountWarning2')}</li>
                                                            <li>{t('auth.deleteAccountWarning3')}</li>
                                                        </ul>
                                                    </div>
                                                ),
                                                okText: t('common.confirm'),
                                                okType: 'danger',
                                                cancelText: t('common.cancel'),
                                                onOk: async () => {
                                                    const success = await deleteAccount();
                                                    if (success) {
                                                        message.success(t('auth.accountDeleted'));
                                                    }
                                                },
                                            });
                                        },
                                    },
                                ],
                            }}
                            placement="bottomRight"
                        >
                            <Button icon={<Avatar size="small" icon={<UserOutlined />} />} type="text">
                                <span className="btn-text">{user.email.split('@')[0]}</span>
                            </Button>
                        </Dropdown>
                    ) : (
                        <Button
                            icon={<UserOutlined />}
                            onClick={() => setAuthModalOpen(true)}
                            style={isDark ? { color: '#e6e6e6', borderColor: '#404040' } : undefined}
                        >
                            <span className="btn-text">{t('header.login')}</span>
                        </Button>
                    )}
                </Space>
            </Header>

            {/* 模态框 */}
            <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
            <CloudFormsModal open={cloudFormsModalOpen} onClose={() => setCloudFormsModalOpen(false)} />
            <SaveToCloudModal open={saveToCloudModalOpen} onClose={() => setSaveToCloudModalOpen(false)} />
        </>
    );
};

export default AppHeader;
