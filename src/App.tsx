import { useState, useEffect, useRef, useCallback } from 'react';
import { Input, Button, Modal, Layout, Typography, Space, Divider, Tooltip, message } from 'antd';
import {
  FormOutlined,
  BuildOutlined,
  SelectOutlined,
  CheckCircleOutlined,
  CheckSquareOutlined,
  UndoOutlined,
  RedoOutlined,
  CodeOutlined,
  EyeOutlined,
  AppstoreAddOutlined,
  RocketOutlined,
  ExportOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  NumberOutlined,
  FileTextOutlined,
  ContainerOutlined,
} from '@ant-design/icons';
import { useStore } from './store';
import './App.css';
import { FormRenderer } from './FormRenderer';
import { DraggableSidebarItem } from './DraggableSidebarItem';
import { SortableList } from './components/SortableList';
import { PropertyPanel } from './components/PropertyPanel';
import { generateFullCode, generateJsonSchema } from './utils/codeGenerator';
import {
  DndContext,
  closestCenter,
  pointerWithin,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  useDroppable,
  type DragOverEvent,
  type CollisionDetection,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import type { ComponentType, ComponentSchema } from './types';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

// 组件材料列表
const COMPONENT_MATERIALS = [
  { type: 'Container', label: '容器', icon: <ContainerOutlined /> },
  { type: 'Input', label: '单行输入', icon: <FormOutlined /> },
  { type: 'TextArea', label: '多行输入', icon: <FileTextOutlined /> },
  { type: 'InputNumber', label: '数字输入', icon: <NumberOutlined /> },
  { type: 'Select', label: '下拉选择', icon: <SelectOutlined /> },
  { type: 'Radio', label: '单选框', icon: <CheckCircleOutlined /> },
  { type: 'Checkbox', label: '多选框', icon: <CheckSquareOutlined /> },
  { type: 'Switch', label: '开关', icon: <RocketOutlined /> },
  { type: 'DatePicker', label: '日期选择', icon: <CalendarOutlined /> },
  { type: 'TimePicker', label: '时间选择', icon: <ClockCircleOutlined /> },
  { type: 'Button', label: '按钮', icon: <BuildOutlined /> },
] as const;

// 自定义碰撞检测：优先检测容器内部
const customCollisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  const containerCollisions = pointerCollisions.filter((collision) =>
    String(collision.id).startsWith('container-')
  );

  if (containerCollisions.length > 0) {
    return [containerCollisions[containerCollisions.length - 1]];
  }

  const rectCollisions = rectIntersection(args);
  if (rectCollisions.length > 0) {
    return rectCollisions;
  }

  return closestCenter(args);
};

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
    selectComponent,
    clearSelection,
    updateComponentProps,
    deleteComponent,
    reorderComponents,
    history,
    undo,
    redo,
  } = useStore();

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [activeDragType, setActiveDragType] = useState<ComponentType | null>(null);
  const [overIndex, setOverIndex] = useState<number | undefined>(undefined);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // 查找组件
  const findComponentById = useCallback(
    (list: ComponentSchema[], id: string): ComponentSchema | undefined => {
      for (const item of list) {
        if (item.id === id) return item;
        if (item.children) {
          const found = findComponentById(item.children, id);
          if (found) return found;
        }
      }
      return undefined;
    },
    []
  );

  const primarySelectedId = selectedIds[selectedIds.length - 1];
  const selectedComponent = primarySelectedId ? findComponentById(components, primarySelectedId) : undefined;

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0) {
        const activeTag = document.activeElement?.tagName.toLowerCase();
        if (activeTag !== 'input' && activeTag !== 'textarea') {
          deleteComponent(selectedIds);
        }
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'z') {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, deleteComponent, undo, redo]);

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
    const { over } = event;
    if (!over) {
      setOverIndex(undefined);
      return;
    }
    const index = components.findIndex((c) => c.id === over.id);
    if (index !== -1) {
      setOverIndex(index);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);
    setActiveDragType(null);
    setOverIndex(undefined);

    if (!over) return;

    const overId = String(over.id);
    const activeId = String(active.id);

    // 从 Sidebar 拖拽到 Canvas
    if (activeId.startsWith('new-')) {
      const type = activeId.replace('new-', '') as ComponentType;

      if (overId.startsWith('container-')) {
        const containerId = overId.replace('container-', '');
        addComponent(type, containerId);
        return;
      }

      let insertIndex: number | undefined = undefined;

      if (overId !== 'canvas-droppable') {
        const targetComponent = findComponentById(components, overId);
        if (targetComponent?.type === 'Container') {
          addComponent(type, overId);
          return;
        }
        if (typeof overIndex === 'number') {
          insertIndex = overIndex;
        }
      }

      addComponent(type, undefined, insertIndex);
      return;
    }

    // 画布内排序
    if (overId === 'canvas-droppable') return;

    if (overId.startsWith('container-')) {
      const containerId = overId.replace('container-', '');
      const { moveComponent } = useStore.getState();
      moveComponent(activeId, containerId);
      return;
    }

    if (activeId !== overId) {
      reorderComponents(activeId, overId);
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
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#fff',
          padding: '0 24px',
          borderBottom: '1px solid #f0f0f0',
          height: 64,
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
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
            }}
          >
            <RocketOutlined style={{ fontSize: 18 }} />
          </div>
          <Title level={4} style={{ margin: 0, fontWeight: 600, fontSize: 18 }}>
            LowCode Form
          </Title>
          <Divider type="vertical" style={{ height: 24, margin: '0 8px' }} />
          <Space size="small">
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
          </Space>
        </div>
        <Space>
          <Button icon={<CodeOutlined />} onClick={handleShowJson}>
            JSON
          </Button>
          <Button icon={<ExportOutlined />} onClick={handleExportCode}>
            导出代码
          </Button>
          <Button type="primary" icon={<EyeOutlined />} onClick={() => setIsPreviewOpen(true)}>
            预览
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
          <Sider width={280} theme="light" style={{ borderRight: '1px solid #f0f0f0', overflowY: 'auto' }}>
            <div style={{ padding: '20px 16px' }}>
              <Space align="center" style={{ marginBottom: 16 }}>
                <AppstoreAddOutlined style={{ color: '#1677ff' }} />
                <Title level={5} style={{ margin: 0 }}>
                  组件库
                </Title>
              </Space>

              <div className="component-grid">
                {COMPONENT_MATERIALS.map((item) => (
                  <DraggableSidebarItem
                    key={item.type}
                    id={`new-${item.type}`}
                    onClick={() => addComponent(item.type as ComponentType)}
                  >
                    {item.icon}
                    <span className="component-card-label">{item.label}</span>
                  </DraggableSidebarItem>
                ))}
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
          <Sider width={320} theme="light" style={{ borderLeft: '1px solid #f0f0f0', overflowY: 'auto' }}>
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
        title="表单预览"
        open={isPreviewOpen}
        onCancel={() => setIsPreviewOpen(false)}
        footer={null}
        width={600}
        centered
      >
        <div style={{ padding: 20 }}>
          <FormRenderer components={components} />
        </div>
      </Modal>
    </Layout>
  );
}

export default App;
