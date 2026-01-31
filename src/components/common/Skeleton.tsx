/**
 * Skeleton - 骨架屏组件
 *
 * 面试考点：
 * 1. 用户体验优化
 * 2. 内容占位符设计
 * 3. CSS 动画性能
 * 4. 组件组合模式
 *
 * @example
 * ```tsx
 * <Suspense fallback={<FormItemSkeleton />}>
 *   <LazyFormItem />
 * </Suspense>
 *
 * <Suspense fallback={<PropertyPanelSkeleton />}>
 *   <LazyPropertyPanel />
 * </Suspense>
 * ```
 */

import React from 'react';
import './Skeleton.css';

// ============ 基础骨架组件 ============

interface SkeletonBaseProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  style?: React.CSSProperties;
  animate?: boolean;
}

/**
 * 基础骨架块
 */
export function SkeletonBlock({
  width = '100%',
  height = 16,
  borderRadius = 4,
  className = '',
  style = {},
  animate = true,
}: SkeletonBaseProps): React.ReactElement {
  return (
    <div
      className={`skeleton-block ${animate ? 'skeleton-animate' : ''} ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius,
        ...style,
      }}
    />
  );
}

/**
 * 圆形骨架
 */
export function SkeletonCircle({
  size = 40,
  className = '',
  style = {},
  animate = true,
}: {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  animate?: boolean;
}): React.ReactElement {
  return (
    <SkeletonBlock
      width={size}
      height={size}
      borderRadius="50%"
      className={className}
      style={style}
      animate={animate}
    />
  );
}

/**
 * 文本行骨架
 */
export function SkeletonText({
  lines = 3,
  lastLineWidth = '60%',
  lineHeight = 16,
  gap = 8,
  className = '',
  animate = true,
}: {
  lines?: number;
  lastLineWidth?: string | number;
  lineHeight?: number;
  gap?: number;
  className?: string;
  animate?: boolean;
}): React.ReactElement {
  return (
    <div
      className={`skeleton-text ${className}`}
      style={{ display: 'flex', flexDirection: 'column', gap }}
    >
      {Array.from({ length: lines }).map((_, index) => (
        <SkeletonBlock
          key={index}
          width={index === lines - 1 ? lastLineWidth : '100%'}
          height={lineHeight}
          animate={animate}
        />
      ))}
    </div>
  );
}

/**
 * 头像 + 文本组合
 */
export function SkeletonAvatar({
  avatarSize = 40,
  lines = 2,
  className = '',
  animate = true,
}: {
  avatarSize?: number;
  lines?: number;
  className?: string;
  animate?: boolean;
}): React.ReactElement {
  return (
    <div
      className={`skeleton-avatar ${className}`}
      style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}
    >
      <SkeletonCircle size={avatarSize} animate={animate} />
      <div style={{ flex: 1 }}>
        <SkeletonText lines={lines} animate={animate} />
      </div>
    </div>
  );
}

// ============ 业务骨架组件 ============

/**
 * 表单项骨架
 */
export function FormItemSkeleton({
  className = '',
  animate = true,
}: {
  className?: string;
  animate?: boolean;
}): React.ReactElement {
  return (
    <div className={`skeleton-form-item ${className}`} style={{ padding: '12px 16px' }}>
      {/* 标签 */}
      <SkeletonBlock width={80} height={14} animate={animate} style={{ marginBottom: 8 }} />
      {/* 输入框 */}
      <SkeletonBlock height={32} borderRadius={6} animate={animate} />
    </div>
  );
}

/**
 * 组件卡片骨架
 */
export function ComponentCardSkeleton({
  className = '',
  animate = true,
}: {
  className?: string;
  animate?: boolean;
}): React.ReactElement {
  return (
    <div
      className={`skeleton-component-card ${className}`}
      style={{
        padding: 16,
        border: '1px solid var(--skeleton-border, #f0f0f0)',
        borderRadius: 8,
        background: 'var(--skeleton-bg, #fff)',
      }}
    >
      {/* 图标 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <SkeletonBlock width={24} height={24} borderRadius={4} animate={animate} />
        <SkeletonBlock width={100} height={18} animate={animate} />
      </div>
      {/* 内容 */}
      <SkeletonBlock height={32} borderRadius={6} animate={animate} />
    </div>
  );
}

/**
 * 侧边栏组件列表骨架
 */
export function SidebarSkeleton({
  itemCount = 5,
  className = '',
  animate = true,
}: {
  itemCount?: number;
  className?: string;
  animate?: boolean;
}): React.ReactElement {
  return (
    <div className={`skeleton-sidebar ${className}`} style={{ padding: 16 }}>
      {/* 搜索框 */}
      <SkeletonBlock height={32} borderRadius={6} animate={animate} style={{ marginBottom: 16 }} />

      {/* 分类标题 */}
      <SkeletonBlock width={60} height={14} animate={animate} style={{ marginBottom: 12 }} />

      {/* 组件列表 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {Array.from({ length: itemCount }).map((_, index) => (
          <div
            key={index}
            style={{
              padding: '8px 12px',
              border: '1px solid var(--skeleton-border, #f0f0f0)',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <SkeletonBlock width={16} height={16} borderRadius={4} animate={animate} />
            <SkeletonBlock width={50} height={14} animate={animate} />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 属性面板骨架
 */
export function PropertyPanelSkeleton({
  className = '',
  animate = true,
}: {
  className?: string;
  animate?: boolean;
}): React.ReactElement {
  return (
    <div className={`skeleton-property-panel ${className}`} style={{ padding: 16 }}>
      {/* 标题 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <SkeletonBlock width={120} height={20} animate={animate} />
        <SkeletonBlock width={24} height={24} borderRadius={4} animate={animate} />
      </div>

      {/* 分割线 */}
      <SkeletonBlock height={1} animate={false} style={{ marginBottom: 16, opacity: 0.5 }} />

      {/* 属性项 */}
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} style={{ marginBottom: 16 }}>
          <SkeletonBlock width={60} height={14} animate={animate} style={{ marginBottom: 8 }} />
          <SkeletonBlock height={32} borderRadius={6} animate={animate} />
        </div>
      ))}

      {/* 折叠面板 */}
      <SkeletonBlock height={40} borderRadius={6} animate={animate} style={{ marginTop: 24 }} />
    </div>
  );
}

/**
 * 画布骨架
 */
export function CanvasSkeleton({
  itemCount = 3,
  className = '',
  animate = true,
}: {
  itemCount?: number;
  className?: string;
  animate?: boolean;
}): React.ReactElement {
  return (
    <div
      className={`skeleton-canvas ${className}`}
      style={{
        padding: 24,
        background: 'var(--skeleton-canvas-bg, #fafafa)',
        minHeight: 400,
        borderRadius: 8,
      }}
    >
      {Array.from({ length: itemCount }).map((_, index) => (
        <ComponentCardSkeleton key={index} animate={animate} />
      ))}
    </div>
  );
}

/**
 * 预览弹窗骨架
 */
export function PreviewModalSkeleton({
  className = '',
  animate = true,
}: {
  className?: string;
  animate?: boolean;
}): React.ReactElement {
  return (
    <div className={`skeleton-preview-modal ${className}`} style={{ padding: 24 }}>
      {/* 设备选择器 */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
        {Array.from({ length: 3 }).map((_, index) => (
          <SkeletonBlock key={index} width={80} height={32} borderRadius={6} animate={animate} />
        ))}
      </div>

      {/* 预览区域 */}
      <div
        style={{
          maxWidth: 375,
          margin: '0 auto',
          padding: 16,
          border: '1px solid var(--skeleton-border, #f0f0f0)',
          borderRadius: 8,
        }}
      >
        {Array.from({ length: 4 }).map((_, index) => (
          <FormItemSkeleton key={index} animate={animate} />
        ))}
      </div>
    </div>
  );
}

/**
 * 历史记录面板骨架
 */
export function HistoryPanelSkeleton({
  itemCount = 5,
  className = '',
  animate = true,
}: {
  itemCount?: number;
  className?: string;
  animate?: boolean;
}): React.ReactElement {
  return (
    <div className={`skeleton-history-panel ${className}`} style={{ padding: 16 }}>
      {/* 标题 */}
      <SkeletonBlock width={100} height={18} animate={animate} style={{ marginBottom: 16 }} />

      {/* 历史列表 */}
      {Array.from({ length: itemCount }).map((_, index) => (
        <div
          key={index}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '8px 0',
            borderBottom: '1px solid var(--skeleton-border, #f0f0f0)',
          }}
        >
          <SkeletonCircle size={8} animate={animate} />
          <SkeletonBlock width={120} height={14} animate={animate} />
          <SkeletonBlock width={60} height={12} animate={animate} style={{ marginLeft: 'auto' }} />
        </div>
      ))}
    </div>
  );
}

/**
 * 表格骨架
 */
export function TableSkeleton({
  rows = 5,
  columns = 4,
  className = '',
  animate = true,
}: {
  rows?: number;
  columns?: number;
  className?: string;
  animate?: boolean;
}): React.ReactElement {
  return (
    <div className={`skeleton-table ${className}`}>
      {/* 表头 */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          padding: '12px 16px',
          background: 'var(--skeleton-header-bg, #fafafa)',
          borderBottom: '1px solid var(--skeleton-border, #f0f0f0)',
        }}
      >
        {Array.from({ length: columns }).map((_, index) => (
          <SkeletonBlock key={index} width={100} height={14} animate={animate} />
        ))}
      </div>

      {/* 表体 */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          style={{
            display: 'flex',
            gap: 16,
            padding: '12px 16px',
            borderBottom: '1px solid var(--skeleton-border, #f0f0f0)',
          }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <SkeletonBlock
              key={colIndex}
              width={colIndex === 0 ? 60 : 100}
              height={14}
              animate={animate}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// ============ 页面级骨架 ============

/**
 * 完整应用骨架
 */
export function AppSkeleton({
  className = '',
  animate = true,
}: {
  className?: string;
  animate?: boolean;
}): React.ReactElement {
  return (
    <div className={`skeleton-app ${className}`} style={{ display: 'flex', height: '100vh' }}>
      {/* 左侧边栏 */}
      <div style={{ width: 280, borderRight: '1px solid var(--skeleton-border, #f0f0f0)' }}>
        <SidebarSkeleton animate={animate} />
      </div>

      {/* 中间画布 */}
      <div style={{ flex: 1, padding: 24, background: 'var(--skeleton-canvas-bg, #fafafa)' }}>
        <CanvasSkeleton animate={animate} />
      </div>

      {/* 右侧属性面板 */}
      <div style={{ width: 320, borderLeft: '1px solid var(--skeleton-border, #f0f0f0)' }}>
        <PropertyPanelSkeleton animate={animate} />
      </div>
    </div>
  );
}

// 默认导出
export default {
  Block: SkeletonBlock,
  Circle: SkeletonCircle,
  Text: SkeletonText,
  Avatar: SkeletonAvatar,
  FormItem: FormItemSkeleton,
  ComponentCard: ComponentCardSkeleton,
  Sidebar: SidebarSkeleton,
  PropertyPanel: PropertyPanelSkeleton,
  Canvas: CanvasSkeleton,
  PreviewModal: PreviewModalSkeleton,
  HistoryPanel: HistoryPanelSkeleton,
  Table: TableSkeleton,
  App: AppSkeleton,
};
