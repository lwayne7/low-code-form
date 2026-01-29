import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Drawer, Typography, Space, Tag, Progress, Divider, Button, Tooltip, Badge, Switch, Card, Statistic, Row, Col, message, Collapse } from 'antd';
import { DashboardOutlined, ClockCircleOutlined, ReloadOutlined, ExperimentOutlined, DownloadOutlined, RocketOutlined } from '@ant-design/icons';
import { useStore } from '../../store';
import { getRenderTrackingSnapshot, resetRenderTracking } from './performanceTracking';
import type { TraceEvent } from '../../utils/tracing';
import { clearTraces, getTraceSnapshot, subscribeTrace } from '../../utils/tracing';
import { useI18n } from '../../i18n';

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
  fpsHistory: number[]; // FPS历史记录（最近60秒）
  memoryHistory: number[]; // 内存历史记录
  timestamp: number;
}

interface PerformancePanelProps {
  open: boolean;
  onClose: () => void;
}

export const PerformancePanel: React.FC<PerformancePanelProps> = ({ open, onClose }) => {
  const { t } = useI18n();
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    renderCount: 0,
    lastRenderTime: 0,
    longTasks: 0,
    componentRenderTimes: new Map(),
    fpsHistory: [],
    memoryHistory: [],
    timestamp: Date.now(),
  });
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [traces, setTraces] = useState<TraceEvent[]>(() => getTraceSnapshot());
  
  const frameCountRef = useRef(0);
  const lastFrameTimeRef = useRef(performance.now());
  const animationFrameRef = useRef<number | undefined>(undefined);
  const longTaskCountRef = useRef(0);

  // Tracing 订阅（拖拽/生成器等关键交互）
  useEffect(() => subscribeTrace(() => setTraces(getTraceSnapshot())), []);

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

      setMetrics(prev => {
        const trackingSnapshot = getRenderTrackingSnapshot();
        const newFpsHistory = [...prev.fpsHistory, fps].slice(-60); // 保留最近60秒
        const newMemoryHistory = memoryUsage !== undefined 
          ? [...prev.memoryHistory, memoryUsage].slice(-60)
          : prev.memoryHistory;
        
        return {
          ...prev,
          fps,
          renderCount: trackingSnapshot.renderCount,
          memoryUsage,
          longTasks: longTaskCountRef.current,
          componentRenderTimes: trackingSnapshot.componentRenderCounts,
          fpsHistory: newFpsHistory,
          memoryHistory: newMemoryHistory,
          timestamp: Date.now(),
        };
      });

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
    resetRenderTracking();
    longTaskCountRef.current = 0;
    setMetrics({
      fps: 60,
      renderCount: 0,
      lastRenderTime: 0,
      longTasks: 0,
      componentRenderTimes: new Map(),
      fpsHistory: [],
      memoryHistory: [],
      timestamp: Date.now(),
    });
    message.success(t('perf.resetSuccess'));
  };

  // 性能测试快捷操作
  const runPerformanceTest = useCallback(async (testType: 'small' | 'medium' | 'large') => {
    setIsRunningTest(true);
    const { addComponent } = useStore.getState();
    
    try {
      const counts = { small: 100, medium: 500, large: 1000 };
      const count = counts[testType];
      
      message.loading(t('perf.addingComponents', { count }), 0);
      
      const startTime = performance.now();
      
      // 批量添加组件
      for (let i = 0; i < count; i++) {
        addComponent('Input');
        // 每100个组件暂停一下，避免阻塞UI
        if (i % 100 === 0 && i > 0) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }
      
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);
      
      message.destroy();
      message.success(t('perf.testComplete', { count, duration }), 3);
      
      console.log(`📊 性能测试结果:`, {
        组件数量: count,
        耗时: `${duration}ms`,
        平均每个组件: `${(duration / count).toFixed(2)}ms`,
        当前FPS: metrics.fps,
        当前内存: metrics.memoryUsage ? `${metrics.memoryUsage}MB` : 'N/A',
      });
    } catch (error) {
      message.error(t('perf.testFailed'));
      console.error(error);
    } finally {
      setIsRunningTest(false);
    }
  }, [metrics, t]);

  // 导出性能报告
  const exportReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      metrics: {
        currentFPS: metrics.fps,
        averageFPS: metrics.fpsHistory.length > 0 
          ? Math.round(metrics.fpsHistory.reduce((a, b) => a + b, 0) / metrics.fpsHistory.length)
          : 0,
        minFPS: metrics.fpsHistory.length > 0 ? Math.min(...metrics.fpsHistory) : 0,
        maxFPS: metrics.fpsHistory.length > 0 ? Math.max(...metrics.fpsHistory) : 0,
        totalRenderCount: metrics.renderCount,
        longTaskCount: metrics.longTasks,
        memoryUsage: metrics.memoryUsage,
        averageMemory: metrics.memoryHistory.length > 0
          ? Math.round(metrics.memoryHistory.reduce((a, b) => a + b, 0) / metrics.memoryHistory.length)
          : 0,
      },
      topRenderComponents: Array.from(metrics.componentRenderTimes.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, count]) => ({ component: name, renderCount: count })),
      environment: {
        userAgent: navigator.userAgent,
        screen: `${window.screen.width}x${window.screen.height}`,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
      }
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    message.success(t('perf.exportSuccess'));
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

  // 计算平均FPS
  const averageFPS = metrics.fpsHistory.length > 0
    ? Math.round(metrics.fpsHistory.reduce((a, b) => a + b, 0) / metrics.fpsHistory.length)
    : 60;

  // 计算FPS稳定性（标准差）
  const fpsStability = metrics.fpsHistory.length > 0
    ? Math.sqrt(
        metrics.fpsHistory.reduce((sum, fps) => sum + Math.pow(fps - averageFPS, 2), 0) / metrics.fpsHistory.length
      )
    : 0;

  // 获取store组件数量
  const componentCount = useStore(state => state.components.length);

  return (
    <Drawer
      title={
        <Space>
          <DashboardOutlined style={{ color: '#1677ff' }} />
          <span>{t('perf.title')}</span>
          <Badge status={isMonitoring ? 'processing' : 'default'} />
        </Space>
      }
      placement="right"
      open={open}
      onClose={onClose}
      width={360}
      extra={
        <Space>
          <Tooltip title={t('perf.exportReport')}>
            <Button type="text" icon={<DownloadOutlined />} size="small" onClick={exportReport} />
          </Tooltip>
          <Tooltip title={t('perf.reset')}>
            <Button type="text" icon={<ReloadOutlined />} size="small" onClick={handleReset} />
          </Tooltip>
          <Switch
            size="small"
            checked={isMonitoring}
            onChange={setIsMonitoring}
            checkedChildren={t('perf.monitoring')}
            unCheckedChildren={t('perf.paused')}
          />
        </Space>
      }
    >
      {/* 关键指标卡片 */}
      <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Card size="small">
            <Statistic
              title={t('perf.currentFps')}
              value={metrics.fps}
              valueStyle={{ color: getFPSColor(metrics.fps), fontSize: 28, fontWeight: 'bold' }}
              suffix={
                <div style={{ fontSize: 12, color: '#999', fontWeight: 'normal' }}>
                  {metrics.fps >= 55 ? t('perf.smooth') : metrics.fps >= 30 ? t('perf.normal') : t('perf.laggy')}
                </div>
              }
            />
            <Progress 
              percent={Math.min(100, (metrics.fps / 60) * 100)} 
              strokeColor={getFPSColor(metrics.fps)}
              showInfo={false}
              size="small"
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card size="small">
            <Statistic
              title={t('perf.avgFps')}
              value={averageFPS}
              valueStyle={{ color: getFPSColor(averageFPS), fontSize: 28, fontWeight: 'bold' }}
              suffix={
                <div style={{ fontSize: 12, color: '#999', fontWeight: 'normal' }}>
                  {t('perf.stability')}: {fpsStability.toFixed(1)}
                </div>
              }
            />
            <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
              {metrics.fpsHistory.length > 0
                ? `${t('perf.range')}: ${Math.min(...metrics.fpsHistory)}-${Math.max(...metrics.fpsHistory)}`
                : t('perf.noData')}
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card size="small">
            <Statistic
              title={t('perf.componentCount')}
              value={componentCount}
              prefix={<RocketOutlined />}
              valueStyle={{ fontSize: 24 }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card size="small">
            <Statistic
              title={t('perf.renderCount')}
              value={metrics.renderCount}
              valueStyle={{ fontSize: 24 }}
            />
          </Card>
        </Col>
      </Row>

      <Divider />

      {/* 渲染统计 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={5}>
          <ClockCircleOutlined style={{ marginRight: 8 }} />
          {t('perf.renderStats')}
        </Title>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text>{t('perf.totalRenders')}</Text>
            <Tag color="blue">{metrics.renderCount}</Tag>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text>{t('perf.longTasks')}</Text>
            <Tag color={metrics.longTasks > 0 ? 'orange' : 'green'}>{metrics.longTasks}</Tag>
          </div>
          {metrics.memoryUsage !== undefined && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text>{t('perf.memoryUsage')}</Text>
              <Tag color={metrics.memoryUsage > 100 ? 'orange' : 'green'}>{metrics.memoryUsage} MB</Tag>
            </div>
          )}
        </Space>
      </div>

      <Divider />

      {/* 组件渲染排行 */}
      <div>
        <Title level={5}>🔥 {t('perf.topRenders')}</Title>
        {topRenderComponents.length === 0 ? (
          <Text type="secondary">{t('perf.noRenderData')}</Text>
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
                  {count}{t('perf.times')}
                </Tag>
              </div>
            ))}
          </Space>
        )}
      </div>

      <Divider />

      {/* 性能测试 */}
      <Collapse
        ghost
        items={[
          {
            key: '1',
            label: (
              <Space>
                <ExperimentOutlined />
                <Text strong>{t('perf.stressTest')}</Text>
              </Space>
            ),
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {t('perf.stressTestDesc')}
                </Text>
                <Space wrap style={{ width: '100%' }}>
                  <Button
                    size="small"
                    onClick={() => runPerformanceTest('small')}
                    loading={isRunningTest}
                  >
                    {t('perf.components100')}
                  </Button>
                  <Button
                    size="small"
                    onClick={() => runPerformanceTest('medium')}
                    loading={isRunningTest}
                  >
                    {t('perf.components500')}
                  </Button>
                  <Button
                    size="small"
                    type="primary"
                    onClick={() => runPerformanceTest('large')}
                    loading={isRunningTest}
                  >
                    {t('perf.components1000')}
                  </Button>
                </Space>
                <Text type="warning" style={{ fontSize: 11 }}>
                  ⚠️ {t('perf.stressTestWarning')}
                </Text>
              </Space>
            ),
          },
          {
            key: '2',
            label: (
              <Space>
                <ClockCircleOutlined />
                <Text strong>{t('perf.tracing')}</Text>
                <Tag>{traces.length}</Tag>
              </Space>
            ),
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {t('perf.recentTraces', { count: Math.min(20, traces.length) })}
                  </Text>
                  <Button size="small" onClick={clearTraces} disabled={traces.length === 0}>
                    {t('perf.clear')}
                  </Button>
                </div>
                {traces.length === 0 ? (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {t('perf.noTracingData')}
                  </Text>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {traces
                      .slice()
                      .reverse()
                      .slice(0, 20)
                      .map((event, index) => (
                        <div
                          key={`${event.timestamp}-${event.name}-${index}`}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '4px 8px',
                            background: '#fafafa',
                            borderRadius: 4,
                          }}
                        >
                          <div style={{ minWidth: 0 }}>
                            <Text style={{ fontSize: 12 }} ellipsis>
                              <Text code style={{ fontSize: 12 }}>
                                {event.name}
                              </Text>
                            </Text>
                            {event.meta && (
                              <div style={{ fontSize: 11, color: '#888' }}>
                                {Object.entries(event.meta)
                                  .slice(0, 4)
                                  .map(([k, v]) => `${k}=${String(v)}`)
                                  .join('  ')}
                              </div>
                            )}
                          </div>
                          <Tag color={event.durationMs > 200 ? 'orange' : 'green'}>
                            {event.durationMs.toFixed(1)}ms
                          </Tag>
                        </div>
                      ))}
                  </div>
                )}
              </Space>
            ),
          },
        ]}
        style={{ marginBottom: 16 }}
      />

      {/* 优化建议 */}
      <div style={{
        background: '#f6ffed',
        border: '1px solid #b7eb8f',
        borderRadius: 6,
        padding: 12
      }}>
        <Title level={5} style={{ color: '#52c41a', margin: 0, marginBottom: 8 }}>
          💡 {t('perf.optimizeTips')}
        </Title>
        <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12, color: '#666' }}>
          <li>{t('perf.tip1')}</li>
          <li>{t('perf.tip2')}</li>
          <li>{t('perf.tip3')}</li>
          <li>{t('perf.tip4')}</li>
          <li>{t('perf.tip5')}</li>
          {metrics.fps < 30 && (
            <li style={{ color: '#ff4d4f' }}>
              <strong>{t('perf.lowFpsWarning')}</strong>
            </li>
          )}
          {metrics.longTasks > 10 && (
            <li style={{ color: '#fa8c16' }}>
              <strong>{t('perf.longTaskWarning', { count: metrics.longTasks })}</strong>
            </li>
          )}
        </ul>
      </div>
    </Drawer>
  );
};
