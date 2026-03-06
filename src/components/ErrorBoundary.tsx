import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Button, Result, Typography, Space, message } from 'antd';
import { ReloadOutlined, CopyOutlined, BugOutlined } from '@ant-design/icons';
import { useI18n } from '@/i18n';
import { STORE_PERSIST_KEY } from '@/store';

const { Paragraph, Text } = Typography;

// 错误上报接口（可对接 Sentry、自建平台等）
interface ErrorReportPayload {
  message: string;
  stack?: string;
  componentStack?: string;
  url: string;
  userAgent: string;
  timestamp: number;
  // 可扩展更多字段
  extra?: Record<string, unknown>;
}

// 错误上报函数（可替换为实际的上报逻辑）
const reportError = async (payload: ErrorReportPayload): Promise<void> => {
  // 开发环境只打印日志
  if (import.meta.env.DEV) {
    console.group('🐛 Error Report');
    console.log('Message:', payload.message);
    console.log('Stack:', payload.stack);
    console.log('Component Stack:', payload.componentStack);
    console.log('URL:', payload.url);
    console.log('Timestamp:', new Date(payload.timestamp).toISOString());
    console.groupEnd();
    return;
  }

  // 生产环境可对接实际的错误上报服务
  // 例如: await fetch('/api/error-report', { method: 'POST', body: JSON.stringify(payload) });
  console.error('[ErrorReport]', payload);
};

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  t?: (key: string, params?: Record<string, string | number>) => string;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string; // 错误唯一标识，便于追踪
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = `ERR-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    return { hasError: true, error, errorId };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });

    // 调用外部错误处理回调
    this.props.onError?.(error, errorInfo);

    // 上报错误
    reportError({
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack ?? undefined,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined, errorId: undefined });
    // 清除 localStorage 中的持久化数据
    localStorage.removeItem(STORE_PERSIST_KEY);
    window.location.reload();
  };

  handleReload = () => {
    window.location.reload();
  };

  handleCopyError = () => {
    const { error, errorInfo, errorId } = this.state;
    const t = this.props.t || ((key: string) => key);
    const errorText = `
${t('errorBoundary.errorId')}: ${errorId}
${t('errorBoundary.errorMessage')}: ${error?.message}
${t('errorBoundary.errorStack')}: ${error?.stack}
Component Stack: ${errorInfo?.componentStack}
URL: ${window.location.href}
Time: ${new Date().toISOString()}
    `.trim();

    navigator.clipboard
      .writeText(errorText)
      .then(() => {
        message.success(t('error.copied'));
      })
      .catch(() => {
        message.error(t('error.copyFailed'));
      });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorInfo, errorId } = this.state;
      const t = this.props.t || ((key: string) => key);

      return (
        <div
          style={{
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f5f5f5',
          }}
        >
          <Result
            status="error"
            title={t('errorBoundary.title')}
            subTitle={
              <Space direction="vertical" size={4}>
                <Text>{t('errorBoundary.description')}</Text>
                {errorId && (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {t('errorBoundary.errorId')}: {errorId}
                  </Text>
                )}
              </Space>
            }
            extra={[
              <Button
                key="reload"
                type="primary"
                icon={<ReloadOutlined />}
                onClick={this.handleReload}
              >
                {t('errorBoundary.refresh')}
              </Button>,
              <Button key="copy" icon={<CopyOutlined />} onClick={this.handleCopyError}>
                {t('errorBoundary.copyError')}
              </Button>,
              <Button key="reset" danger onClick={this.handleReset}>
                {t('errorBoundary.reset')}
              </Button>,
            ]}
          >
            {import.meta.env.DEV && error && (
              <div
                style={{
                  marginTop: 24,
                  padding: 16,
                  background: '#fff1f0',
                  borderRadius: 8,
                  textAlign: 'left',
                  maxWidth: 600,
                  overflow: 'auto',
                }}
              >
                <Paragraph>
                  <BugOutlined style={{ marginRight: 8, color: '#cf1322' }} />
                  <Text strong style={{ color: '#cf1322' }}>
                    {t('errorBoundary.details')}：
                  </Text>
                </Paragraph>
                <pre
                  style={{
                    fontSize: 12,
                    color: '#666',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    margin: 0,
                    padding: 12,
                    background: '#fafafa',
                    borderRadius: 4,
                  }}
                >
                  {error.toString()}
                  {errorInfo?.componentStack}
                </pre>
              </div>
            )}
          </Result>
        </div>
      );
    }

    return this.props.children;
  }
}

// 带 i18n 的 ErrorBoundary 包装组件
export function ErrorBoundaryWithI18n({ children, fallback, onError }: Omit<Props, 't'>) {
  const { t } = useI18n();
  return (
    <ErrorBoundary fallback={fallback} onError={onError} t={t as Props['t']}>
      {children}
    </ErrorBoundary>
  );
}
