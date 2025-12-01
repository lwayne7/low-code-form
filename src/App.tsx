import { useState, useEffect, useRef } from 'react';
import { Input, Button, Modal, Layout, Typography, Space, Divider, Tooltip, message, Dropdown, Drawer, FloatButton } from 'antd';
import {
  UndoOutlined,
  RedoOutlined,
  CodeOutlined,
  EyeOutlined,
  AppstoreAddOutlined,
  ExportOutlined,
  FileAddOutlined,
  ClearOutlined,
  PlusOutlined,
  RocketOutlined,
  QuestionCircleOutlined,
  MobileOutlined,
  TabletOutlined,
  DesktopOutlined,
  HistoryOutlined,
  SettingOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  SaveOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useStore } from './store';
import './App.css';

// Components
import { FormRenderer, PropertyPanel, DraggableSidebarItem, SortableList, KeyboardShortcutsPanel, Toolbar, HistoryPanel, FormStats } from './components';

// Utils
import { generateFullCode, generateJsonSchema, customCollisionDetection } from './utils';
import { findComponentById, findParentInfo, isDescendant } from './utils/componentHelpers';
import { formTemplates } from './utils/formTemplates';

// Constants
import { COMPONENT_MATERIALS } from './constants';

// DnD Kit
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  useDroppable,
  type DragOverEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

// Types
import type { ComponentType } from './types';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

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
    selectAll,
    clearSelection,
    updateComponentProps,
    deleteComponent,
    reorderComponents,
    copyComponents,
    pasteComponents,
    duplicateComponents,
    clipboard,
    history,
    undo,
    redo,
    resetCanvas,
    customTemplates,
    saveAsTemplate,
    deleteTemplate,
    importComponents,
  } = useStore();

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false); // 🆕 全屏预览
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'tablet' | 'desktop'>('desktop'); // 🆕 预览设备
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false); // 🆕 快捷键面板
  const [isHistoryOpen, setIsHistoryOpen] = useState(false); // 🆕 历史面板
  const [componentSearch, setComponentSearch] = useState(''); // 🆕 组件搜索
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false); // 🆕 移动端组件抽屉
  const [isPropertyDrawerOpen, setIsPropertyDrawerOpen] = useState(false); // 🆕 移动端属性抽屉
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [activeDragType, setActiveDragType] = useState<ComponentType | null>(null);
  const [overIndex, setOverIndex] = useState<number | undefined>(undefined);
  // 🆕 追踪拖拽目标信息，用于显示精确位置指示器
  const [dropTarget, setDropTarget] = useState<{
    targetId: string;  // 目标组件或容器的 ID
    position: 'before' | 'after' | 'inside';  // 放置位置
    parentId?: string;  // 父容器 ID
  } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const primarySelectedId = selectedIds[selectedIds.length - 1];
  const selectedComponent = primarySelectedId ? findComponentById(components, primarySelectedId) : undefined;

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      const isInputFocused = activeTag === 'input' || activeTag === 'textarea';

      // Delete/Backspace - 删除选中组件
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0) {
        if (!isInputFocused) {
          deleteComponent(selectedIds);
        }
      }

      // Cmd/Ctrl + Z - 撤销
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      // Cmd/Ctrl + Shift + Z - 重做
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'z') {
        e.preventDefault();
        redo();
      }

      // Cmd/Ctrl + A - 全选
      if ((e.metaKey || e.ctrlKey) && e.key === 'a' && !isInputFocused) {
        e.preventDefault();
        selectAll();
      }

      // Cmd/Ctrl + C - 复制
      if ((e.metaKey || e.ctrlKey) && e.key === 'c' && !isInputFocused) {
        if (selectedIds.length > 0) {
          copyComponents();
          message.success(`已复制 ${selectedIds.length} 个组件`);
        }
      }

      // Cmd/Ctrl + V - 粘贴
      if ((e.metaKey || e.ctrlKey) && e.key === 'v' && !isInputFocused) {
        if (clipboard.length > 0) {
          pasteComponents();
          message.success(`已粘贴 ${clipboard.length} 个组件`);
        }
      }

      // Cmd/Ctrl + D - 复制组件
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        if (selectedIds.length > 0 && !isInputFocused) {
          e.preventDefault();
          duplicateComponents();
          message.success('已复制组件');
        }
      }

      // Escape - 取消选择
      if (e.key === 'Escape') {
        clearSelection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, deleteComponent, undo, redo, selectAll, copyComponents, pasteComponents, duplicateComponents, clipboard, clearSelection]);

  // 拖拽传感器
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // 拖拽事件处理
  const handleDragStart = (event: DragStartEvent) => {
    const id = String(event.active.id);
    setActiveDragId(id);
    if (id.startsWith('new-')) {
      setActiveDragType(id.replace('new-', '') as ComponentType);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over, active } = event;
    
    if (!over) {
      setOverIndex(undefined);
      setDropTarget(null);
      return;
    }

    const overId = String(over.id);
    const activeId = String(active.id);

    // 🔧 计算鼠标在目标区域的相对位置
    const getDropPosition = (): 'before' | 'after' | 'inside' => {
      const overRect = over.rect;
      // @ts-ignore
      const pointerY = event.activatorEvent?.clientY ?? 0;
      // @ts-ignore
      const currentY = pointerY + (event.delta?.y ?? 0);
      
      const topThreshold = overRect.top + overRect.height * 0.25; // 上 25%
      const bottomThreshold = overRect.top + overRect.height * 0.75; // 下 25%
      
      if (currentY < topThreshold) {
        return 'before';
      } else if (currentY > bottomThreshold) {
        return 'after';
      }
      return 'inside';
    };

    // 计算放置位置
    if (overId.startsWith('container-')) {
      // 放入容器 droppable 区域（容器内部空白区域）
      const containerId = overId.replace('container-', '');
      if (containerId !== activeId) {
        setDropTarget({ targetId: containerId, position: 'inside' });
      }
    } else if (overId !== 'canvas-droppable') {
      // 放置在某个组件上
      const targetComponent = findComponentById(components, overId);
      if (targetComponent) {
        if (targetComponent.type === 'Container' && activeId !== overId) {
          // 🔧 容器组件：根据鼠标位置判断是放入内部还是前后
          const position = getDropPosition();
          setDropTarget({ targetId: overId, position });
        } else {
          // 普通组件：判断上方还是下方
          const overRect = over.rect;
          // @ts-ignore
          const pointerY = event.activatorEvent?.clientY ?? 0;
          // @ts-ignore
          const currentY = pointerY + (event.delta?.y ?? 0);
          const midPoint = overRect.top + overRect.height / 2;
          
          if (currentY < midPoint) {
            setDropTarget({ targetId: overId, position: 'before' });
          } else {
            setDropTarget({ targetId: overId, position: 'after' });
          }
        }
      }
    } else {
      // 放入顶层画布
      setDropTarget({ targetId: 'canvas', position: 'inside' });
    }

    const index = components.findIndex((c) => c.id === over.id);
    if (index !== -1) {
      setOverIndex(index);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const currentDropTarget = dropTarget; // 保存当前的 dropTarget
    
    setActiveDragId(null);
    setActiveDragType(null);
    setOverIndex(undefined);
    setDropTarget(null);

    if (!over) return;

    const overId = String(over.id);
    const activeId = String(active.id);

    // 使用辅助函数查找父容器信息
    const getParentInfo = (targetId: string) => findParentInfo(components, targetId);
    
    // 使用辅助函数判断是否是后代
    const checkIsDescendant = (parentId: string, childId: string) => 
      isDescendant(components, parentId, childId);

    // 从 Sidebar 拖拽新组件到 Canvas
    if (activeId.startsWith('new-')) {
      const type = activeId.replace('new-', '') as ComponentType;

      // 放入容器内（container-xxx 格式的 droppable）
      if (overId.startsWith('container-')) {
        const containerId = overId.replace('container-', '');
        addComponent(type, containerId);
        return;
      }

      if (overId !== 'canvas-droppable') {
        const targetComponent = findComponentById(components, overId);
        
        // 如果目标是容器组件，根据 dropTarget 的位置决定操作
        if (targetComponent?.type === 'Container') {
          if (currentDropTarget?.position === 'inside') {
            // 放入容器内部
            addComponent(type, overId);
          } else {
            // before 或 after：作为容器的兄弟元素
            const { parentId, index } = getParentInfo(overId);
            if (index !== -1) {
              const insertIndex = currentDropTarget?.position === 'before' ? index : index + 1;
              addComponent(type, parentId ?? undefined, insertIndex);
            } else {
              addComponent(type, undefined);
            }
          }
          return;
        }
        
        // 🔧 根据 dropTarget 的位置决定插入位置
        const { parentId, index } = getParentInfo(overId);
        
        if (index !== -1) {
          const insertIndex = currentDropTarget?.position === 'before' ? index : index + 1;
          addComponent(type, parentId ?? undefined, insertIndex);
          return;
        }
      }

      // 默认添加到末尾
      addComponent(type, undefined);
      return;
    }

    // ========== 画布内已有组件拖拽 ==========
    const { moveComponent } = useStore.getState();

    // 拖入 canvas-droppable（顶层画布区域）
    if (overId === 'canvas-droppable') {
      // 将组件移动到顶层
      moveComponent(activeId, null);
      return;
    }

    // 拖入容器的 droppable 区域
    if (overId.startsWith('container-')) {
      const containerId = overId.replace('container-', '');
      
      // 防止容器拖入自身或其后代
      if (containerId === activeId || checkIsDescendant(activeId, containerId)) {
        message.warning('不能将容器拖入自身');
        return;
      }
      
      moveComponent(activeId, containerId);
      return;
    }

    // 拖放到某个组件上
    const targetComponent = findComponentById(components, overId);
    if (targetComponent) {
      // 如果目标是容器，根据 dropTarget 的位置决定操作
      if (targetComponent.type === 'Container') {
        // 防止容器拖入自身或其后代
        if (overId === activeId || checkIsDescendant(activeId, overId)) {
          message.warning('不能将容器拖入自身');
          return;
        }
        
        // 根据 dropTarget 判断是放入内部还是前后
        if (currentDropTarget?.position === 'inside') {
          moveComponent(activeId, overId);
        } else {
          // before 或 after：作为兄弟元素移动到目标容器的父级
          const { parentId, index } = getParentInfo(overId);
          if (index !== -1) {
            const insertIndex = currentDropTarget?.position === 'before' ? index : index + 1;
            // 使用 moveComponent 移动到目标的父容器，指定位置
            moveComponent(activeId, parentId, insertIndex);
          } else {
            reorderComponents(activeId, overId);
          }
        }
        return;
      }
      
      // 否则进行排序
      if (activeId !== overId) {
        reorderComponents(activeId, overId);
      }
    }
  };

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
    <Layout style={{ height: '100vh' }}>
      {/* 顶部工具栏 */}
      <Header
        className="app-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#fff',
          padding: '0 24px',
          borderBottom: '1px solid #f0f0f0',
          height: 64,
          zIndex: 10,
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
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
          <Space size="small" wrap>
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
                onClick={() => setIsHistoryOpen(true)}
                type="text"
              />
            </Tooltip>
            <Divider type="vertical" style={{ height: 20, margin: '0 4px' }} />
            {/* 🆕 编辑工具栏 */}
            <Toolbar />
            <Divider type="vertical" style={{ height: 20, margin: '0 4px' }} />
            {/* 🆕 表单统计 */}
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
                onClick={() => setIsShortcutsOpen(true)}
                type="text"
              />
            </Tooltip>
          </Space>
        </div>
        <Space wrap size="small">
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
            <Button icon={<FileAddOutlined />}>
              <span className="btn-text">模板</span>
            </Button>
          </Dropdown>
          <Button icon={<CodeOutlined />} onClick={handleShowJson}>
            <span className="btn-text">JSON</span>
          </Button>
          <Button icon={<ExportOutlined />} onClick={handleExportCode}>
            <span className="btn-text">导出</span>
          </Button>
          <Button type="primary" icon={<EyeOutlined />} onClick={() => setIsPreviewOpen(true)}>
            <span className="btn-text">预览</span>
          </Button>
        </Space>
      </Header>

      <DndContext
        sensors={sensors}
        collisionDetection={customCollisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <Layout>
          {/* 左侧组件库 */}
          <Sider className="sidebar-left" width={280} theme="light" style={{ borderRight: '1px solid #f0f0f0', overflowY: 'auto' }}>
            <div style={{ padding: '20px 16px' }}>
              <Space align="center" style={{ marginBottom: 12 }}>
                <AppstoreAddOutlined style={{ color: '#1677ff' }} />
                <Title level={5} style={{ margin: 0 }}>
                  组件库
                </Title>
              </Space>

              {/* 🆕 组件搜索 */}
              <Input
                placeholder="搜索组件..."
                value={componentSearch}
                onChange={(e) => setComponentSearch(e.target.value)}
                allowClear
                style={{ marginBottom: 12 }}
              />

              <div className="component-grid">
                {COMPONENT_MATERIALS
                  .filter((item) => 
                    item.label.toLowerCase().includes(componentSearch.toLowerCase()) ||
                    item.type.toLowerCase().includes(componentSearch.toLowerCase())
                  )
                  .map((item) => (
                  <DraggableSidebarItem
                    key={item.type}
                    id={`new-${item.type}`}
                    onClick={() => addComponent(item.type as ComponentType)}
                  >
                    {item.icon}
                    <span className="component-card-label">{item.label}</span>
                  </DraggableSidebarItem>
                ))}
                {COMPONENT_MATERIALS.filter((item) => 
                  item.label.toLowerCase().includes(componentSearch.toLowerCase()) ||
                  item.type.toLowerCase().includes(componentSearch.toLowerCase())
                ).length === 0 && (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#999', padding: 16 }}>
                    未找到匹配的组件
                  </div>
                )}
              </div>
            </div>
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
                    <AppstoreAddOutlined style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }} />
                    <p>从左侧拖拽组件到这里</p>
                  </div>
                )}
              </DroppableCanvas>
            </div>
          </Content>

          {/* 右侧属性面板 */}
          <Sider className="sidebar-right" width={320} theme="light" style={{ borderLeft: '1px solid #f0f0f0', overflowY: 'auto' }}>
            <PropertyPanel
              selectedIds={selectedIds}
              selectedComponent={selectedComponent}
              components={components}
              updateComponentProps={updateComponentProps}
              deleteComponent={deleteComponent}
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
                  background: 'white',
                  border: '1px solid #1677ff',
                  borderRadius: 4,
                  opacity: 0.8,
                }}
              >
                正在移动...
              </div>
            )
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* 预览 Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 32 }}>
            <span>表单预览</span>
            <Space>
              <Tooltip title="手机 (375px)">
                <Button
                  type={previewDevice === 'mobile' ? 'primary' : 'text'}
                  icon={<MobileOutlined />}
                  size="small"
                  onClick={() => setPreviewDevice('mobile')}
                />
              </Tooltip>
              <Tooltip title="平板 (768px)">
                <Button
                  type={previewDevice === 'tablet' ? 'primary' : 'text'}
                  icon={<TabletOutlined />}
                  size="small"
                  onClick={() => setPreviewDevice('tablet')}
                />
              </Tooltip>
              <Tooltip title="桌面 (100%)">
                <Button
                  type={previewDevice === 'desktop' ? 'primary' : 'text'}
                  icon={<DesktopOutlined />}
                  size="small"
                  onClick={() => setPreviewDevice('desktop')}
                />
              </Tooltip>
              <Divider type="vertical" style={{ height: 16 }} />
              <Tooltip title={isFullscreen ? "退出全屏" : "全屏预览"}>
                <Button
                  type="text"
                  icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                  size="small"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                />
              </Tooltip>
            </Space>
          </div>
        }
        open={isPreviewOpen}
        onCancel={() => { setIsPreviewOpen(false); setIsFullscreen(false); }}
        footer={null}
        width={isFullscreen ? '100vw' : (previewDevice === 'mobile' ? 435 : previewDevice === 'tablet' ? 830 : 700)}
        centered={!isFullscreen}
        style={isFullscreen ? { top: 0, maxWidth: '100vw', padding: 0 } : undefined}
        styles={{ 
          body: { padding: 0, height: isFullscreen ? 'calc(100vh - 55px)' : 'auto', overflow: 'auto' },
        }}
      >
        <div 
          style={{ 
            padding: 20,
            maxWidth: previewDevice === 'mobile' ? 375 : previewDevice === 'tablet' ? 768 : '100%',
            margin: '0 auto',
            background: previewDevice !== 'desktop' ? '#f5f5f5' : 'transparent',
            minHeight: previewDevice === 'mobile' ? 600 : previewDevice === 'tablet' ? 500 : 'auto',
            borderRadius: previewDevice !== 'desktop' ? 8 : 0,
            boxShadow: previewDevice !== 'desktop' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
          }}
        >
          <div style={{ background: 'white', padding: 16, borderRadius: previewDevice !== 'desktop' ? 8 : 0 }}>
            <FormRenderer components={components} />
          </div>
        </div>
      </Modal>

      {/* 🆕 快捷键面板 */}
      <KeyboardShortcutsPanel
        open={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* 🆕 历史记录面板 */}
      <HistoryPanel
        open={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        past={history.past}
        future={history.future}
        currentComponents={components}
        onJumpTo={(steps) => {
          // steps < 0 表示撤销，steps > 0 表示重做
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

      {/* 📱 移动端组件库抽屉 */}
      <Drawer
        title={
          <Space>
            <AppstoreAddOutlined style={{ color: '#1677ff' }} />
            <span>组件库</span>
          </Space>
        }
        placement="left"
        open={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        width={280}
      >
        <Input
          placeholder="搜索组件..."
          value={componentSearch}
          onChange={(e) => setComponentSearch(e.target.value)}
          allowClear
          style={{ marginBottom: 12 }}
        />
        <div className="component-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
          {COMPONENT_MATERIALS
            .filter((item) =>
              item.label.toLowerCase().includes(componentSearch.toLowerCase()) ||
              item.type.toLowerCase().includes(componentSearch.toLowerCase())
            )
            .map((item) => (
              <div
                key={item.type}
                className="component-card"
                onClick={() => {
                  addComponent(item.type as ComponentType);
                  setIsMobileDrawerOpen(false);
                }}
              >
                {item.icon}
                <span className="component-card-label">{item.label}</span>
              </div>
            ))}
        </div>
      </Drawer>

      {/* 📱 移动端属性面板抽屉 */}
      <Drawer
        title={
          <Space>
            <SettingOutlined style={{ color: '#1677ff' }} />
            <span>组件属性</span>
          </Space>
        }
        placement="right"
        open={isPropertyDrawerOpen}
        onClose={() => setIsPropertyDrawerOpen(false)}
        width={320}
      >
        <PropertyPanel
          selectedIds={selectedIds}
          selectedComponent={selectedComponent}
          components={components}
          updateComponentProps={updateComponentProps}
          deleteComponent={deleteComponent}
        />
      </Drawer>

      {/* 📱 移动端浮动按钮组 */}
      <FloatButton.Group className="mobile-fab" shape="square" style={{ right: 24, bottom: 24 }}>
        <FloatButton
          icon={<PlusOutlined />}
          tooltip="添加组件"
          onClick={() => setIsMobileDrawerOpen(true)}
        />
        {selectedIds.length > 0 && (
          <FloatButton
            icon={<SettingOutlined />}
            tooltip="编辑属性"
            type="primary"
            onClick={() => setIsPropertyDrawerOpen(true)}
          />
        )}
      </FloatButton.Group>
    </Layout>
  );
}

export default App;
