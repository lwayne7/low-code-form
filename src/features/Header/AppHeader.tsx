/**
 * AppHeader - 顶部工具栏
 *
 * 包含 logo、撤销/重做、工具栏、模板、JSON/导出按钮等
 */

import React, { useState, useEffect } from 'react';
import {
  Layout,
  Button,
  Modal,
  Tooltip,
  Space,
  Divider,
  Dropdown,
  Typography,
  Input,
  message,
  Avatar,
} from 'antd';
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
import { countComponents, startTrace } from '../../utils';
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
  const handleExportCode = async () => {
    const componentCount = countComponents(components);
    const { generateFullCode, generateJsonSchema } = await import('../../utils/codeGenerator');

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
            style={{
              fontFamily: 'monospace',
              background: isDark ? '#141414' : '#f5f5f5',
              fontSize: 12,
            }}
          />
          <div style={{ marginTop: 16, marginBottom: 8 }}>
            <strong>{t('export.jsonSchema')}</strong>
          </div>
          <Input.TextArea
            value={jsonSchema}
            autoSize={{ minRows: 5, maxRows: 10 }}
            readOnly
            style={{
              fontFamily: 'monospace',
              background: isDark ? '#141414' : '#f5f5f5',
              fontSize: 12,
            }}
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
          padding: '8px 24px',
          borderBottom: `1px solid ${isDark ? '#303030' : '#f0f0f0'}`,
          height: 'auto',
          minHeight: 64,
          zIndex: 10,
          flexWrap: 'wrap',
          gap: 12,
          lineHeight: 1.2,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            columnGap: 12,
            rowGap: 8,
            minWidth: 0,
            flex: '1 1 auto',
          }}
        >
          {/* Logo - 品牌化设计 */}
          <div
            style={{
              width: 36,
              height: 36,
              background: 'linear-gradient(135deg, #1677ff 0%, #69b1ff 50%, #91caff 100%)',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(22, 119, 255, 0.3)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* 装饰性光效 */}
            <div
              style={{
                position: 'absolute',
                top: -10,
                right: -10,
                width: 20,
                height: 20,
                background: 'rgba(255, 255, 255, 0.3)',
                borderRadius: '50%',
                filter: 'blur(4px)',
              }}
            />
            <RocketOutlined style={{ fontSize: 20, position: 'relative', zIndex: 1 }} />
          </div>
          {/* 标题和副标题 */}
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <Title
              level={4}
              className="app-title"
              ellipsis={{ tooltip: t('header.title') }}
              style={{
                margin: 0,
                fontWeight: 700,
                fontSize: 18,
                whiteSpace: 'nowrap',
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                background: isDark
                  ? 'linear-gradient(135deg, #69b1ff 0%, #91caff 100%)'
                  : 'linear-gradient(135deg, #1677ff 0%, #4096ff 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {t('header.title')}
            </Title>
            <span
              style={{
                fontSize: 11,
                color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)',
                fontWeight: 500,
                letterSpacing: '0.5px',
              }}
            >
              {t('header.subtitle')}
            </span>
          </div>
          <Divider
            type="vertical"
            className="header-divider"
            style={{ height: 24, margin: '0 8px' }}
          />
          <Space size={4} wrap={false} style={{ flexShrink: 0 }}>
            <Tooltip title={`${t('header.undo')} (Cmd/Ctrl + Z)`}>
              <Button
                aria-label={t('header.undo')}
                data-testid="btn-undo"
                icon={<UndoOutlined />}
                disabled={history.past.length === 0}
                onClick={undo}
                type="text"
              />
            </Tooltip>
            <Tooltip title={`${t('header.redo')} (Cmd/Ctrl + Shift + Z)`}>
              <Button
                aria-label={t('header.redo')}
                data-testid="btn-redo"
                icon={<RedoOutlined />}
                disabled={history.future.length === 0}
                onClick={redo}
                type="text"
              />
            </Tooltip>
            <Tooltip title={t('header.history')}>
              <Button
                aria-label={t('header.history')}
                data-testid="btn-history"
                icon={<HistoryOutlined />}
                onClick={onHistoryOpen}
                type="text"
              />
            </Tooltip>
          </Space>
          <Divider type="vertical" style={{ height: 20, margin: '0 4px' }} />
          <div style={{ flexShrink: 0 }}>
            <Toolbar />
          </div>
          <Divider type="vertical" style={{ height: 20, margin: '0 4px' }} />
          <div style={{ flexShrink: 0 }}>
            <FormStats />
          </div>
        </div>
        {/* 右侧工具按钮区域 - 始终可见 */}
        <Space size={4} wrap={false} style={{ flexShrink: 0 }}>
          <Tooltip title={t('header.clear')}>
            <Button
              aria-label={t('header.clear')}
              data-testid="btn-clear"
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
              aria-label={t('header.shortcuts')}
              data-testid="btn-shortcuts"
              icon={<QuestionCircleOutlined />}
              onClick={onShortcutsOpen}
              type="text"
            />
          </Tooltip>
          <Tooltip title={t('header.performance')}>
            <Button
              aria-label={t('header.performance')}
              data-testid="btn-performance"
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
              aria-label={t('header.theme.auto')}
              data-testid="btn-theme"
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
              items: (['zh-CN', 'en-US'] as Locale[]).map((l) => ({
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
              aria-label={localeNames[locale]}
              data-testid="btn-locale"
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
                  children: formTemplates.map((template) => ({
                    key: template.id,
                    label: (
                      <div style={{ padding: '4px 0' }}>
                        <span style={{ marginRight: 8 }}>{template.icon}</span>
                        <strong>{t(`template.${template.id}.name` as keyof typeof t)}</strong>
                        <div
                          style={{
                            fontSize: 12,
                            color: 'var(--text-color-secondary, #666)',
                            marginTop: 2,
                          }}
                        >
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
                ...(customTemplates.length > 0
                  ? [
                      { type: 'divider' as const },
                      {
                        key: 'custom',
                        type: 'group' as const,
                        label: t('template.custom'),
                        children: customTemplates.map((template) => ({
                          key: template.id,
                          label: (
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '4px 0',
                              }}
                            >
                              <div>
                                <strong>{template.name}</strong>
                                {template.description && (
                                  <div
                                    style={{
                                      fontSize: 12,
                                      color: 'var(--text-color-secondary, #666)',
                                      marginTop: 2,
                                    }}
                                  >
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
                    ]
                  : []),
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
                        const name = (
                          document.getElementById('template-name-input') as HTMLInputElement
                        )?.value;
                        const desc = (
                          document.getElementById('template-desc-input') as HTMLTextAreaElement
                        )?.value;
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
            <Button
              icon={<FileAddOutlined />}
              style={isDark ? { color: '#e6e6e6', borderColor: '#404040' } : undefined}
            >
              <span className="btn-text">{t('header.template')}</span>
            </Button>
          </Dropdown>
          <Button
            data-testid="btn-json"
            icon={<CodeOutlined />}
            onClick={handleShowJson}
            style={isDark ? { color: '#e6e6e6', borderColor: '#404040' } : undefined}
          >
            <span className="btn-text">{t('header.json')}</span>
          </Button>
          <Button
            data-testid="btn-export"
            icon={<ExportOutlined />}
            onClick={handleExportCode}
            style={isDark ? { color: '#e6e6e6', borderColor: '#404040' } : undefined}
          >
            <span className="btn-text">{t('header.export')}</span>
          </Button>
          <Button
            data-testid="btn-preview"
            type="primary"
            icon={<EyeOutlined />}
            onClick={onPreviewOpen}
          >
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
                  onClick: () => (user ? setSaveToCloudModalOpen(true) : setAuthModalOpen(true)),
                },
                {
                  key: 'load',
                  icon: <CloudDownloadOutlined />,
                  label: t('header.cloudLoad'),
                  onClick: () => (user ? setCloudFormsModalOpen(true) : setAuthModalOpen(true)),
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
                    label: (
                      <span style={{ color: 'var(--text-color-secondary, #666)' }}>
                        {user.email}
                      </span>
                    ),
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
                            <ul
                              style={{
                                paddingLeft: 20,
                                color: 'var(--text-color-secondary, #666)',
                              }}
                            >
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
      <SaveToCloudModal
        open={saveToCloudModalOpen}
        onClose={() => setSaveToCloudModalOpen(false)}
      />
    </>
  );
};

export default AppHeader;
