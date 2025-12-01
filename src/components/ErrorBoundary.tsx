import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Button, Result, Typography, Space, message } from 'antd';
import { ReloadOutlined, CopyOutlined, BugOutlined } from '@ant-design/icons';

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
    localStorage.removeItem('lowcode-storage');
    window.location.reload();
  };

  handleReload = () => {
    window.location.reload();
  };

  handleCopyError = () => {
    const { error, errorInfo, errorId } = this.state;
    const errorText = `
错误ID: ${errorId}
错误信息: ${error?.message}
错误堆栈: ${error?.stack}
组件堆栈: ${errorInfo?.componentStack}
URL: ${window.location.href}
时间: ${new Date().toISOString()}
    `.trim();

    navigator.clipboard.writeText(errorText).then(() => {
      message.success('错误信息已复制到剪贴板');
    }).catch(() => {
      message.error('复制失败，请手动复制');
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorInfo, errorId } = this.state;

      return (
        <div style={{ 
          height: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: '#f5f5f5'
        }}>
          <Result
            status="error"
            title="页面出错了"
            subTitle={
              <Space direction="vertical" size={4}>
                <Text>抱歉，应用遇到了一些问题。您可以尝试刷新页面或重置应用。</Text>
                {errorId && (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    错误ID: {errorId}
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
                刷新页面
              </Button>,
              <Button 
                key="copy" 
                icon={<CopyOutlined />}
                onClick={this.handleCopyError}
              >
                复制错误信息
              </Button>,
              <Button 
                key="reset" 
                danger
                onClick={this.handleReset}
              >
                重置应用
              </Button>,
            ]}
          >
            {import.meta.env.DEV && error && (
              <div style={{ 
                marginTop: 24, 
                padding: 16, 
                background: '#fff1f0', 
                borderRadius: 8,
                textAlign: 'left',
                maxWidth: 600,
                overflow: 'auto'
              }}>
                <Paragraph>
                  <BugOutlined style={{ marginRight: 8, color: '#cf1322' }} />
                  <Text strong style={{ color: '#cf1322' }}>错误详情（仅开发环境显示）：</Text>
                </Paragraph>
                <pre style={{ 
                  fontSize: 12, 
                  color: '#666',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  margin: 0,
                  padding: 12,
                  background: '#fafafa',
                  borderRadius: 4,
                }}>
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

// HOC 包装器
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundaryWrapper(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}
