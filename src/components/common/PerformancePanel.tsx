import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Drawer, Typography, Space, Tag, Progress, Divider, Button, Tooltip, Badge, Switch } from 'antd';
import { DashboardOutlined, ThunderboltOutlined, ClockCircleOutlined, ReloadOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

/**
 * 性能监控面板
 * 面试考点：
 * 1. Performance API 使用
 * 2. requestAnimationFrame 实现帧率监控
 * 3. React DevTools 原理
 * 4. 内存监控（如果支持）
 */

interface PerformanceMetrics {
  fps: number;
  renderCount: number;
  lastRenderTime: number;
  memoryUsage?: number; // MB
  longTasks: number;
  componentRenderTimes: Map<string, number>;
}

interface PerformancePanelProps {
  open: boolean;
  onClose: () => void;
}

// 全局渲染计数器
let globalRenderCount = 0;
const componentRenderCounts = new Map<string, number>();

// 导出给其他组件使用的渲染追踪函数
export function trackRender(componentName: string) {
  globalRenderCount++;
  componentRenderCounts.set(
    componentName,
    (componentRenderCounts.get(componentName) || 0) + 1
  );
}

export const PerformancePanel: React.FC<PerformancePanelProps> = ({ open, onClose }) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    renderCount: 0,
    lastRenderTime: 0,
    longTasks: 0,
    componentRenderTimes: new Map(),
  });
  const [isMonitoring, setIsMonitoring] = useState(true);
  
  const frameCountRef = useRef(0);
  const lastFrameTimeRef = useRef(performance.now());
  const animationFrameRef = useRef<number | undefined>(undefined);
  const longTaskCountRef = useRef(0);

  // FPS 监控
  const measureFPS = useCallback(() => {
    if (!isMonitoring) return;

    frameCountRef.current++;
    const now = performance.now();
    const elapsed = now - lastFrameTimeRef.current;

    if (elapsed >= 1000) {
      const fps = Math.round((frameCountRef.current * 1000) / elapsed);
      
      // 获取内存信息（仅 Chrome 支持）
      const memory = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory;
      const memoryUsage = memory ? Math.round(memory.usedJSHeapSize / 1024 / 1024) : undefined;

      setMetrics(prev => ({
        ...prev,
        fps,
        renderCount: globalRenderCount,
        memoryUsage,
        longTasks: longTaskCountRef.current,
        componentRenderTimes: new Map(componentRenderCounts),
      }));

      frameCountRef.current = 0;
      lastFrameTimeRef.current = now;
    }

    animationFrameRef.current = requestAnimationFrame(measureFPS);
  }, [isMonitoring]);

  // 长任务监控
  useEffect(() => {
    if (!isMonitoring) return;

    // PerformanceObserver 监控长任务（>50ms）
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach(() => {
            longTaskCountRef.current++;
          });
        });
        
        observer.observe({ entryTypes: ['longtask'] });
        
        return () => observer.disconnect();
      } catch {
        // 某些浏览器不支持 longtask
      }
    }
  }, [isMonitoring]);

  // 启动 FPS 监控
  useEffect(() => {
    if (open && isMonitoring) {
      animationFrameRef.current = requestAnimationFrame(measureFPS);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [open, isMonitoring, measureFPS]);

  // 重置统计
  const handleReset = () => {
    globalRenderCount = 0;
    componentRenderCounts.clear();
    longTaskCountRef.current = 0;
    setMetrics({
      fps: 60,
      renderCount: 0,
      lastRenderTime: 0,
      longTasks: 0,
      componentRenderTimes: new Map(),
    });
  };

  // FPS 颜色判断
  const getFPSColor = (fps: number): string => {
    if (fps >= 55) return '#52c41a'; // 绿色 - 流畅
    if (fps >= 30) return '#faad14'; // 黄色 - 一般
    return '#ff4d4f'; // 红色 - 卡顿
  };

  // 获取 top 渲染组件
  const topRenderComponents = Array.from(metrics.componentRenderTimes.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <Drawer
      title={
        <Space>
          <DashboardOutlined style={{ color: '#1677ff' }} />
          <span>性能监控面板</span>
          <Badge status={isMonitoring ? 'processing' : 'default'} />
        </Space>
      }
      placement="right"
      open={open}
      onClose={onClose}
      width={360}
      extra={
        <Space>
          <Tooltip title="重置统计">
            <Button type="text" icon={<ReloadOutlined />} size="small" onClick={handleReset} />
          </Tooltip>
          <Switch 
            size="small" 
            checked={isMonitoring} 
            onChange={setIsMonitoring}
            checkedChildren="监控中"
            unCheckedChildren="已暂停"
          />
        </Space>
      }
    >
      {/* 帧率监控 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={5}>
          <ThunderboltOutlined style={{ marginRight: 8 }} />
          帧率 (FPS)
        </Title>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ 
            fontSize: 48, 
            fontWeight: 'bold', 
            color: getFPSColor(metrics.fps),
            fontFamily: 'monospace'
          }}>
            {metrics.fps}
          </div>
          <div>
            <Progress 
              percent={Math.min(100, (metrics.fps / 60) * 100)} 
              strokeColor={getFPSColor(metrics.fps)}
              showInfo={false}
              style={{ width: 150 }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {metrics.fps >= 55 ? '流畅' : metrics.fps >= 30 ? '一般' : '卡顿'}
            </Text>
          </div>
        </div>
      </div>

      <Divider />

      {/* 渲染统计 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={5}>
          <ClockCircleOutlined style={{ marginRight: 8 }} />
          渲染统计
        </Title>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text>总渲染次数</Text>
            <Tag color="blue">{metrics.renderCount}</Tag>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text>长任务次数 (&gt;50ms)</Text>
            <Tag color={metrics.longTasks > 0 ? 'orange' : 'green'}>{metrics.longTasks}</Tag>
          </div>
          {metrics.memoryUsage !== undefined && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text>内存使用</Text>
              <Tag color={metrics.memoryUsage > 100 ? 'orange' : 'green'}>{metrics.memoryUsage} MB</Tag>
            </div>
          )}
        </Space>
      </div>

      <Divider />

      {/* 组件渲染排行 */}
      <div>
        <Title level={5}>🔥 高频渲染组件 Top 5</Title>
        {topRenderComponents.length === 0 ? (
          <Text type="secondary">暂无数据，请操作页面触发渲染</Text>
        ) : (
          <Space direction="vertical" style={{ width: '100%' }}>
            {topRenderComponents.map(([name, count], index) => (
              <div 
                key={name} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  padding: '4px 8px',
                  background: index === 0 ? '#fff7e6' : '#fafafa',
                  borderRadius: 4
                }}
              >
                <Text>
                  <span style={{ 
                    display: 'inline-block', 
                    width: 20, 
                    color: index === 0 ? '#fa8c16' : '#999' 
                  }}>
                    {index + 1}.
                  </span>
                  {name}
                </Text>
                <Tag color={count > 10 ? 'red' : count > 5 ? 'orange' : 'default'}>
                  {count}次
                </Tag>
              </div>
            ))}
          </Space>
        )}
      </div>

      <Divider />

      {/* 优化建议 */}
      <div style={{ 
        background: '#f6ffed', 
        border: '1px solid #b7eb8f', 
        borderRadius: 6, 
        padding: 12 
      }}>
        <Title level={5} style={{ color: '#52c41a', margin: 0, marginBottom: 8 }}>
          💡 优化建议
        </Title>
        <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12, color: '#666' }}>
          <li>使用 React.memo 包裹纯展示组件</li>
          <li>使用 useMemo/useCallback 缓存计算结果</li>
          <li>使用 Zustand selector 精确订阅状态</li>
          <li>对高频操作使用防抖/节流</li>
          <li>大列表使用虚拟滚动</li>
        </ul>
      </div>
    </Drawer>
  );
};
