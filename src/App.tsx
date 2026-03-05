/**
 * App.tsx - 重构后的轻量级入口
 *
 * 核心功能模块已拆分到 features/ 目录:
 * - AppHeader: 顶部工具栏
 * - PreviewModal: 预览弹窗
 * - ComponentLibrary: 左侧组件库
 * - MobileDrawers: 移动端抽屉
 *
 * 拖拽逻辑提取到 hooks/useDragHandlers.ts
 */

import { useState, useRef } from 'react';
import { ConfigProvider, Layout, FloatButton, theme as antdTheme } from 'antd';
import { AppstoreAddOutlined, PlusOutlined, SettingOutlined } from '@ant-design/icons';
import { useStore } from './store';
import { useI18n } from './i18n';
import './App.css';

// Components
import {
  SortableList,
  LazyKeyboardShortcutsPanel,
  LazyHistoryPanel,
  LazyPerformancePanel,
} from './components';
import { PropertyPanel } from './components/PropertyPanel';
import { AppFooter } from './components/common/AppFooter';

// Features
import { AppHeader, LazyPreviewModal, ComponentLibrary, MobileDrawers } from './features';

// Hooks
import { useKeyboardShortcuts, useTheme, useDragHandlers } from './hooks';

// Utils
import { customCollisionDetection } from './utils';
import { findComponentById } from './utils/componentHelpers';

// DnD Kit
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

// Types
import type { ComponentType } from './types';

const { Sider, Content } = Layout;
const { defaultAlgorithm, darkAlgorithm } = antdTheme;

// 侧边栏 Overlay 组件
const SidebarItemOverlay = ({ type }: { type: ComponentType }) => (
  <div
    style={{
      padding: '8px 16px',
      background: 'white',
      border: '1px solid #1677ff',
      borderRadius: 4,
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      opacity: 0.8,
      width: '120px',
      textAlign: 'center',
    }}
  >
    {type}
  </div>
);

// 封装 Droppable Canvas
const DroppableCanvas = ({ children }: { children: React.ReactNode }) => {
  const { setNodeRef } = useDroppable({ id: 'canvas-droppable' });
  return (
    <div ref={setNodeRef} style={{ minHeight: '100%', width: '100%' }}>
      {children}
    </div>
  );
};

function App() {
  const {
    components,
    selectedIds,
    addComponent,
    addComponents,
    selectComponent,
    clearSelection,
    updateComponentProps,
    deleteComponent,
    history,
    undo,
    redo,
    resetCanvas,
    customTemplates,
    saveAsTemplate,
    deleteTemplate,
    importComponents,
  } = useStore();

  // 主题切换
  const { themeMode, isDark, setThemeMode } = useTheme();
  const { t } = useI18n();

  // UI 状态
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isPerfPanelOpen, setIsPerfPanelOpen] = useState(false);
  const [componentSearch, setComponentSearch] = useState('');
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isPropertyDrawerOpen, setIsPropertyDrawerOpen] = useState(false);

  // 框选状态
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // 获取当前选中的组件
  const primarySelectedId = selectedIds[selectedIds.length - 1];
  const selectedComponent = primarySelectedId
    ? findComponentById(components, primarySelectedId)
    : undefined;

  // 使用键盘快捷键 Hook
  useKeyboardShortcuts();

  // 拖拽逻辑 Hook
  const {
    activeDragId,
    activeDragType,
    overIndex,
    dropTarget,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  } = useDragHandlers();

  // 拖拽传感器
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // 框选逻辑
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.sortable-item')) return;

    if (e.button === 0) {
      setIsSelecting(true);
      clearSelection();

      const rect = e.currentTarget.getBoundingClientRect();
      const startX = e.clientX - rect.left + e.currentTarget.scrollLeft;
      const startY = e.clientY - rect.top + e.currentTarget.scrollTop;

      setSelectionBox({ startX, startY, currentX: startX, currentY: startY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSelecting || !selectionBox || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const newCurrentX = e.clientX - rect.left + e.currentTarget.scrollLeft;
    const newCurrentY = e.clientY - rect.top + e.currentTarget.scrollTop;

    setSelectionBox({ ...selectionBox, currentX: newCurrentX, currentY: newCurrentY });
  };

  const handleMouseUp = () => {
    if (isSelecting && selectionBox && canvasRef.current) {
      const selectionRect = {
        left: Math.min(selectionBox.startX, selectionBox.currentX),
        top: Math.min(selectionBox.startY, selectionBox.currentY),
        right: Math.max(selectionBox.startX, selectionBox.currentX),
        bottom: Math.max(selectionBox.startY, selectionBox.currentY),
      };

      const componentNodes = document.querySelectorAll('[data-component-id]');
      const newSelectedIds: string[] = [];
      const containerRect = canvasRef.current.getBoundingClientRect();

      componentNodes.forEach((node) => {
        const nodeRect = node.getBoundingClientRect();
        const nodeLeft = nodeRect.left - containerRect.left + canvasRef.current!.scrollLeft;
        const nodeTop = nodeRect.top - containerRect.top + canvasRef.current!.scrollTop;
        const nodeRight = nodeLeft + nodeRect.width;
        const nodeBottom = nodeTop + nodeRect.height;

        const id = node.getAttribute('data-component-id');

        const isIntersecting = !(
          nodeRight < selectionRect.left ||
          nodeLeft > selectionRect.right ||
          nodeBottom < selectionRect.top ||
          nodeTop > selectionRect.bottom
        );

        if (isIntersecting && id) {
          newSelectedIds.push(id);
        }
      });

      if (newSelectedIds.length > 0) {
        newSelectedIds.forEach((id, index) => {
          selectComponent(id, index > 0);
        });
      }
    }

    setIsSelecting(false);
    setSelectionBox(null);
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? darkAlgorithm : defaultAlgorithm,
      }}
    >
      <Layout style={{ height: '100vh' }}>
        {/* 顶部工具栏 */}
        <AppHeader
          isDark={isDark}
          themeMode={themeMode}
          setThemeMode={setThemeMode}
          components={components}
          history={history}
          undo={undo}
          redo={redo}
          resetCanvas={resetCanvas}
          customTemplates={customTemplates}
          saveAsTemplate={saveAsTemplate}
          deleteTemplate={deleteTemplate}
          addComponents={addComponents}
          importComponents={importComponents}
          onPreviewOpen={() => setIsPreviewOpen(true)}
          onShortcutsOpen={() => setIsShortcutsOpen(true)}
          onHistoryOpen={() => setIsHistoryOpen(true)}
          onPerfPanelOpen={() => setIsPerfPanelOpen(true)}
        />

        <DndContext
          sensors={sensors}
          collisionDetection={customCollisionDetection}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <Layout>
            {/* 左侧组件库 */}
            <Sider
              className="sidebar-left"
              width={280}
              theme="light"
              style={{
                borderRight: `1px solid ${isDark ? '#303030' : '#f0f0f0'}`,
                overflow: 'hidden auto',
                background: isDark ? '#1f1f1f' : '#fff',
              }}
            >
              <ComponentLibrary
                isDark={isDark}
                componentSearch={componentSearch}
                onSearchChange={setComponentSearch}
                onAddComponent={(type) => addComponent(type)}
              />
            </Sider>

            {/* 中间画布 */}
            <Content
              className="canvas-container"
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{ position: 'relative', userSelect: 'none' }}
            >
              {/* 框选矩形 */}
              {isSelecting && selectionBox && (
                <div
                  style={{
                    position: 'absolute',
                    left: Math.min(selectionBox.startX, selectionBox.currentX),
                    top: Math.min(selectionBox.startY, selectionBox.currentY),
                    width: Math.abs(selectionBox.currentX - selectionBox.startX),
                    height: Math.abs(selectionBox.currentY - selectionBox.startY),
                    border: '1px solid #1677ff',
                    backgroundColor: 'rgba(22, 119, 255, 0.1)',
                    pointerEvents: 'none',
                    zIndex: 9999,
                  }}
                />
              )}

              <div className="canvas-paper">
                <DroppableCanvas>
                  <SortableList
                    items={components}
                    selectedIds={selectedIds}
                    onSelect={(id, multi) => selectComponent(id, multi)}
                    activeDragId={activeDragId}
                    overIndex={overIndex}
                    dropTarget={dropTarget}
                  />

                  {components.length === 0 && (
                    <div
                      style={{
                        height: 300,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px dashed #e5e7eb',
                        borderRadius: 8,
                        color: '#9ca3af',
                      }}
                    >
                      <AppstoreAddOutlined
                        style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}
                      />
                      <p>{t('canvas.dragFromLeft')}</p>
                    </div>
                  )}
                </DroppableCanvas>
              </div>
            </Content>

            {/* 右侧属性面板 */}
            <Sider
              className="sidebar-right"
              width={320}
              theme="light"
              style={{
                borderLeft: `1px solid ${isDark ? '#303030' : '#f0f0f0'}`,
                overflow: 'hidden auto',
                background: isDark ? '#1f1f1f' : '#fff',
              }}
            >
              <PropertyPanel
                selectedIds={selectedIds}
                selectedComponent={selectedComponent}
                components={components}
                updateComponentProps={updateComponentProps}
                deleteComponent={deleteComponent}
                isDark={isDark}
              />
            </Sider>
          </Layout>

          {/* 拖拽 Overlay */}
          <DragOverlay>
            {activeDragId ? (
              activeDragId.startsWith('new-') ? (
                <SidebarItemOverlay type={activeDragType || 'Input'} />
              ) : (
                <div
                  style={{
                    padding: 16,
                    background: isDark ? '#262626' : 'white',
                    border: `1px solid ${isDark ? '#4096ff' : '#1677ff'}`,
                    borderRadius: 4,
                    opacity: 0.8,
                    color: isDark ? '#e6e6e6' : undefined,
                  }}
                >
                  {t('dnd.moving')}
                </div>
              )
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* 预览 Modal */}
        <LazyPreviewModal
          open={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          components={components}
        />

        {/* 快捷键面板 */}
        <LazyKeyboardShortcutsPanel
          open={isShortcutsOpen}
          onClose={() => setIsShortcutsOpen(false)}
        />

        {/* 历史记录面板 */}
        <LazyHistoryPanel
          open={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          past={history.past}
          future={history.future}
          currentComponents={components}
          onJumpTo={(steps: number) => {
            if (steps < 0) {
              for (let i = 0; i < Math.abs(steps); i++) {
                undo();
              }
            } else {
              for (let i = 0; i < steps; i++) {
                redo();
              }
            }
          }}
        />

        {/* 性能监控面板 */}
        <LazyPerformancePanel open={isPerfPanelOpen} onClose={() => setIsPerfPanelOpen(false)} />

        {/* 移动端抽屉 */}
        <MobileDrawers
          isMobileDrawerOpen={isMobileDrawerOpen}
          onMobileDrawerClose={() => setIsMobileDrawerOpen(false)}
          componentSearch={componentSearch}
          onSearchChange={setComponentSearch}
          onAddComponent={(type) => addComponent(type)}
          isPropertyDrawerOpen={isPropertyDrawerOpen}
          onPropertyDrawerClose={() => setIsPropertyDrawerOpen(false)}
          selectedIds={selectedIds}
          selectedComponent={selectedComponent}
          components={components}
          updateComponentProps={updateComponentProps}
          deleteComponent={deleteComponent}
        />

        {/* 📱 移动端浮动按钮组 */}
        <FloatButton.Group className="mobile-fab" shape="square" style={{ right: 24, bottom: 60 }}>
          <FloatButton
            icon={<PlusOutlined />}
            tooltip={t('canvas.addComponent')}
            onClick={() => setIsMobileDrawerOpen(true)}
          />
          {selectedIds.length > 0 && (
            <FloatButton
              icon={<SettingOutlined />}
              tooltip={t('canvas.editProperties')}
              type="primary"
              onClick={() => setIsPropertyDrawerOpen(true)}
            />
          )}
        </FloatButton.Group>

        {/* Footer - 品牌信息 */}
        <AppFooter isDark={isDark} />
      </Layout>
    </ConfigProvider>
  );
}

export default App;
