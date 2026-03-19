import * as React from 'react';

interface Props {
  componentId: string;
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * 组件级 ErrorBoundary — 渐进式错误恢复
 *
 * 单个组件渲染失败时，仅该组件降级为 fallback UI，
 * 不影响画布中其他组件的正常渲染。
 */
export class ComponentErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    if (import.meta.env.DEV) {
      console.error(
        `[ComponentErrorBoundary] Component "${this.props.componentId}" crashed:`,
        error,
        info.componentStack
      );
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: '12px 16px',
            background: '#fff2f0',
            border: '1px solid #ffccc7',
            borderRadius: 6,
            color: '#cf1322',
            fontSize: 12,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 4 }}>组件渲染失败</div>
          <div style={{ color: '#999', fontSize: 11 }}>
            ID: {this.props.componentId}
            {import.meta.env.DEV && this.state.error && <span> | {this.state.error.message}</span>}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
