import { Input, Button, Form, Modal, Layout, Typography, Space, Divider, Tooltip, Tag, Card, message } from 'antd';
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
  DeleteOutlined,
  AppstoreAddOutlined,
  SettingOutlined,
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
import { SortableItem } from './SortableItem';
import { useState, useEffect, useRef } from 'react'; 
import { FormRenderer } from './FormRenderer';
import { DraggableSidebarItem } from './DraggableSidebarItem';
import { CanvasFormItem } from './CanvasFormItem';
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
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { ComponentType, ComponentSchema } from './types';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

// 自定义碰撞检测：优先检测容器内部
const customCollisionDetection: CollisionDetection = (args) => {
  // 先用 pointerWithin 检测鼠标指针在哪些区域内
  const pointerCollisions = pointerWithin(args);
  
  // 如果有容器碰撞，优先返回最内层的容器
  const containerCollisions = pointerCollisions.filter(
    collision => String(collision.id).startsWith('container-')
  );
  
  if (containerCollisions.length > 0) {
    // 返回最后一个（通常是最内层的容器）
    return [containerCollisions[containerCollisions.length - 1]];
  }
  
  // 否则使用 rectIntersection 进行普通碰撞检测
  const rectCollisions = rectIntersection(args);
  if (rectCollisions.length > 0) {
    return rectCollisions;
  }
  
  // 最后使用 closestCenter
  return closestCenter(args);
};

// 递归渲染组件列表
const SortableList = ({ items, selectedIds, onSelect, activeDragId, overIndex, parentId, depth = 0 }: { items: ComponentSchema[], selectedIds: string[], onSelect: (id: string, multi: boolean) => void, activeDragId?: string | null, overIndex?: number, parentId?: string, depth?: number }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: parentId ? `container-${parentId}` : 'canvas-droppable',
    data: { parentId, depth }
  });

  // 根据嵌套深度计算背景色
  const getContainerBgColor = (d: number) => {
    const colors = ['#f9f9f9', '#f0f5ff', '#fff7e6', '#f6ffed', '#fff1f0'];
    return colors[d % colors.length];
  };

  return (
    <SortableContext
      items={items.map(c => c.id)}
      strategy={verticalListSortingStrategy}
    >
      <div 
        ref={setNodeRef} 
        style={{ 
          minHeight: 10, 
          padding: 4,
          background: isOver ? 'rgba(22, 119, 255, 0.05)' : undefined,
          border: isOver ? '2px dashed #1677ff' : '2px dashed transparent',
          borderRadius: 4,
          transition: 'all 0.2s'
        }}
      >
        {items.map((component, index) => {
          // 计算是否显示插入指示线
          let showDropIndicator: 'top' | 'bottom' | null = null;
          if (activeDragId && activeDragId.startsWith('new-') && typeof overIndex === 'number') {
             if (index === overIndex) {
               showDropIndicator = 'top'; 
             }
          }

          const isContainer = component.type === 'Container';

          return (
            <SortableItem
              key={component.id}
              id={component.id}
              isSelected={selectedIds.includes(component.id)}
              showDropIndicator={showDropIndicator}
              onClick={(e: React.MouseEvent) => onSelect(component.id, e.metaKey || e.ctrlKey)}
              useHandle={isContainer} // 容器使用拖拽手柄模式
            >
              <div style={{ pointerEvents: 'none' }}>
                {isContainer ? (
                  <Card 
                    size="small" 
                    title={
                      <span style={{ cursor: 'grab' }}>
                        ⠿ {component.props.label || '容器'}
                        <span style={{ marginLeft: 8, fontSize: 11, color: '#999' }}>
                          (层级 {depth + 1})
                        </span>
                      </span>
                    }
                    style={{ 
                      background: getContainerBgColor(depth), 
                      border: '1px dashed #d9d9d9',
                      borderLeft: `3px solid ${['#1677ff', '#722ed1', '#fa8c16', '#52c41a', '#f5222d'][depth % 5]}`
                    }}
                    styles={{ body: { padding: 8, minHeight: 60 } }}
                  >
                    {/* 容器内部区域可以接收拖拽 */}
                    <div style={{ pointerEvents: 'auto' }}>
                      <SortableList 
                        items={component.children || []} 
                        selectedIds={selectedIds} 
                        onSelect={onSelect}
                        activeDragId={activeDragId}
                        parentId={component.id}
                        depth={depth + 1}
                      />
                      {(component.children || []).length === 0 && (
                        <div style={{ textAlign: 'center', color: '#999', padding: 16, fontSize: 13 }}>
                          📦 拖拽组件到这里
                        </div>
                      )}
                    </div>
                  </Card>
                ) : (
                  <div style={{ pointerEvents: 'auto' }}>
                    <CanvasFormItem component={component} />
                  </div>
                )}
              </div>
            </SortableItem>
          );
        })}
      </div>
    </SortableContext>
  );
};

// 侧边栏 Overlay 组件
const SidebarItemOverlay = ({ type }: { type: ComponentType }) => {
  const style = {
    padding: '8px 16px',
    background: 'white',
    border: '1px solid #1677ff',
    borderRadius: 4,
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    opacity: 0.8,
    width: '120px',
    textAlign: 'center' as const
  };
  return <div style={style}>{type}</div>;
};

// 封装 Droppable Canvas
const DroppableCanvas = ({ children }: { children: React.ReactNode }) => {
  const { setNodeRef } = useDroppable({
    id: 'canvas-droppable',
  });

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
    redo
  } = useStore();

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [activeDragType, setActiveDragType] = useState<ComponentType | null>(null);
  
  // 新增：记录 over 的位置信息
  const [overIndex, setOverIndex] = useState<number | undefined>(undefined);

  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{ startX: number, startY: number, currentX: number, currentY: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const primarySelectedId = selectedIds[selectedIds.length - 1];
  
  const findComponentById = (list: ComponentSchema[], id: string): ComponentSchema | undefined => {
    for (const item of list) {
      if (item.id === id) return item;
      if (item.children) {
        const found = findComponentById(item.children, id);
        if (found) return found;
      }
    }
    return undefined;
  };
  
  const selectedComponent = primarySelectedId ? findComponentById(components, primarySelectedId) : undefined;

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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
    
    // 尝试在顶层 components 中找到 over 的 index
    const index = components.findIndex(c => c.id === over.id);
    if (index !== -1) {
      setOverIndex(index);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);
    setActiveDragType(null);
    setOverIndex(undefined); // Reset
    
    if (!over) return;

    const overId = String(over.id);
    const activeId = String(active.id);

    // 1. 从 Sidebar 拖拽到 Canvas
    if (activeId.startsWith('new-')) {
        const type = activeId.replace('new-', '') as ComponentType;
        
        // 判断是否拖拽到容器内
        if (overId.startsWith('container-')) {
          const containerId = overId.replace('container-', '');
          addComponent(type, containerId);
          return;
        }
        
        // 如果 over.id 是 canvas-droppable，添加到末尾
        let insertIndex: number | undefined = undefined;
        
        if (overId !== 'canvas-droppable') {
           // 如果 over 是组件，检查它是否是 Container
           const targetComponent = findComponentById(components, overId);
           if (targetComponent?.type === 'Container') {
             // 拖拽到容器组件上，添加到容器内
             addComponent(type, overId);
             return;
           }
           
           // 普通组件位置插入
           if (typeof overIndex === 'number') {
             insertIndex = overIndex;
           }
        }

        addComponent(type, undefined, insertIndex); 
        return;
    }

    // 2. 画布内排序
    if (overId === 'canvas-droppable') return;
    
    // 检查是否拖拽到容器内
    if (overId.startsWith('container-')) {
      const containerId = overId.replace('container-', '');
      // 使用 moveComponent 移动到容器内
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
    if ((e.target as HTMLElement).closest('.sortable-item')) {
        return; 
    }

    if (e.button === 0) {
      setIsSelecting(true);
      clearSelection();
      
      const rect = e.currentTarget.getBoundingClientRect();
      const startX = e.clientX - rect.left + e.currentTarget.scrollLeft;
      const startY = e.clientY - rect.top + e.currentTarget.scrollTop;

      setSelectionBox({
        startX,
        startY,
        currentX: startX,
        currentY: startY,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSelecting || !selectionBox || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const newCurrentX = e.clientX - rect.left + e.currentTarget.scrollLeft;
    const newCurrentY = e.clientY - rect.top + e.currentTarget.scrollTop;

    setSelectionBox({
      ...selectionBox,
      currentX: newCurrentX,
      currentY: newCurrentY,
    });
  };

  const handleMouseUp = () => {
    if (isSelecting && selectionBox && canvasRef.current) {
      // const rect = canvasRef.current.getBoundingClientRect();
      
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

  const handleComponentClick = (id: string, isMulti: boolean) => {
    selectComponent(id, isMulti);
  };

  const handleShowJson = () => {
    // 优化：支持编辑导入
    let jsonValue = JSON.stringify(components, null, 2);
    
    Modal.confirm({
      title: '表单 Schema',
      width: 600,
      icon: <CodeOutlined />,
      content: (
        <Input.TextArea 
          defaultValue={jsonValue}
          rows={15}
          onChange={(e) => { jsonValue = e.target.value; }}
          style={{ fontFamily: 'monospace', marginTop: 10 }}
        />
      ),
      okText: '导入 (覆盖)',
      cancelText: '关闭',
      onOk: () => {
        try {
          const parsed = JSON.parse(jsonValue);
          // 为了安全起见，这里应该做 Schema 校验
          // 但为了演示，直接覆盖 Store
          useStore.setState({ components: parsed, selectedIds: [], history: { past: [], future: [] } });
          message.success('导入成功');
        } catch (e) {
          message.error('JSON 格式错误');
          return Promise.reject();
        }
      }
    });
  };

  const generateCode = () => {
    const imports = `import React from 'react';
import { Form, Input, Button, Select, Radio, Checkbox, Switch, DatePicker, TimePicker, InputNumber, Card } from 'antd';

export default function MyForm() {
  const [form] = Form.useForm();
  const onFinish = (values) => console.log(values);

  return (
    <Form form={form} layout="vertical" onFinish={onFinish}>
      {/* Components here */}
    </Form>
  );
}`;
    return imports;
  };

  const handleExportCode = () => {
    const code = generateCode();
    Modal.info({
      title: '导出 React 代码',
      width: 800,
      icon: <CodeOutlined />,
      content: (
        <div>
          <Input.TextArea 
            value={code} 
            autoSize={{ minRows: 10, maxRows: 20 }} 
            readOnly 
            style={{ fontFamily: 'monospace', background: '#f5f5f5' }} 
          />
        </div>
      ),
    });
  };

  const renderOptionsEditor = () => {
    // @ts-ignore
    const optionsStr = selectedComponent?.props.options?.map((o: any) => `${o.label}:${o.value}`).join('\n') || '';
    
    return (
      <Form.Item label="选项配置" tooltip="每行一个选项，格式：显示名:值">
        <Input.TextArea 
          rows={5} 
          value={optionsStr}
          onChange={(e) => {
            const lines = e.target.value.split('\n');
            const newOptions = lines.map((line: string) => {
              const parts = line.split(/[:：]/);
              const label = parts[0]?.trim();
              const value = parts[1]?.trim() || label;
              return { label, value };
            }).filter((o: any) => o.label);
            
            if (selectedComponent) {
              updateComponentProps(selectedComponent.id, { options: newOptions });
            }
          }}
          placeholder={`例如：\n男:male\n女:female`}
        />
      </Form.Item>
    );
  };

  const componentMaterials = [
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
  ];

  return (
    <Layout style={{ height: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', padding: '0 24px', borderBottom: '1px solid #f0f0f0', height: 64, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #1677ff 0%, #80b3ff 100%)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <RocketOutlined style={{ fontSize: 18 }} />
          </div>
          <Title level={4} style={{ margin: 0, fontWeight: 600, fontSize: 18 }}>LowCode Form</Title>
          <Divider type="vertical" style={{ height: 24, margin: '0 8px' }} />
          <Space size="small">
            <Tooltip title="撤销 (Cmd/Ctrl + Z)"><Button icon={<UndoOutlined />} disabled={history.past.length === 0} onClick={undo} type="text" /></Tooltip>
            <Tooltip title="重做 (Cmd/Ctrl + Shift + Z)"><Button icon={<RedoOutlined />} disabled={history.future.length === 0} onClick={redo} type="text" /></Tooltip>
          </Space>
        </div>
        <Space>
          <Button icon={<CodeOutlined />} onClick={handleShowJson}>JSON</Button>
          <Button icon={<ExportOutlined />} onClick={handleExportCode}>导出代码</Button>
          <Button type="primary" icon={<EyeOutlined />} onClick={() => setIsPreviewOpen(true)}>预览</Button>
        </Space>
      </Header>
      
      <DndContext
        sensors={sensors}
        collisionDetection={customCollisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver} 
        onDragEnd={handleDragEnd}
      >
        {/* ... Layout content (Sider, Content, Sider) remains same ... */}
        <Layout>
          <Sider width={280} theme="light" style={{ borderRight: '1px solid #f0f0f0', overflowY: 'auto' }}>
            <div style={{ padding: '20px 16px' }}>
              <Space align="center" style={{ marginBottom: 16 }}>
                <AppstoreAddOutlined style={{ color: '#1677ff' }} />
                <Title level={5} style={{ margin: 0 }}>组件库</Title>
              </Space>
              
              <div className="component-grid">
                {componentMaterials.map((item) => (
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
          
          <Content 
            className="canvas-container" 
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ position: 'relative', userSelect: 'none' }}
          >
            {isSelecting && selectionBox && (
              <div style={{
                position: 'absolute',
                left: Math.min(selectionBox.startX, selectionBox.currentX),
                top: Math.min(selectionBox.startY, selectionBox.currentY),
                width: Math.abs(selectionBox.currentX - selectionBox.startX),
                height: Math.abs(selectionBox.currentY - selectionBox.startY),
                border: '1px solid #1677ff',
                backgroundColor: 'rgba(22, 119, 255, 0.1)',
                pointerEvents: 'none',
                zIndex: 9999
              }} />
            )}

            <div className="canvas-paper">
              <DroppableCanvas>
                <SortableList 
                  items={components} 
                  selectedIds={selectedIds} 
                  onSelect={handleComponentClick} 
                  activeDragId={activeDragId}
                  overIndex={overIndex}
                />
                
                {components.length === 0 && (
                  <div style={{ height: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed #e5e7eb', borderRadius: 8, color: '#9ca3af' }}>
                    <AppstoreAddOutlined style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }} />
                    <p>从左侧拖拽组件到这里</p>
                  </div>
                )}
              </DroppableCanvas>
            </div>
          </Content>

          <Sider width={320} theme="light" style={{ borderLeft: '1px solid #f0f0f0', overflowY: 'auto' }}>
            {/* ... Right Sider Content ... */}
            <div style={{ padding: '20px 16px' }}>
              <Space align="center" style={{ marginBottom: 24 }}>
                <SettingOutlined style={{ color: '#1677ff' }} />
                <Title level={5} style={{ margin: 0 }}>属性配置</Title>
              </Space>

              {selectedIds.length > 1 ? (
                <div style={{ textAlign: 'center', color: '#666', padding: '40px 0' }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
                  <p>已选中 {selectedIds.length} 个组件</p>
                  <Button danger icon={<DeleteOutlined />} onClick={() => deleteComponent(selectedIds)} style={{ marginTop: 16 }}>
                    批量删除
                  </Button>
                </div>
              ) : selectedComponent ? (
                <Form layout="vertical">
                  <div style={{ background: '#f9fafb', padding: 12, borderRadius: 6, marginBottom: 20 }}>
                    <Form.Item label="组件 ID" style={{ marginBottom: 0 }}>
                      <Space>
                        <Tag>{selectedComponent.type}</Tag>
                        <Text code style={{ fontSize: 12 }}>{selectedComponent.id}</Text>
                      </Space>
                    </Form.Item>
                  </div>

                  {/* 容器组件配置 */}
                  {selectedComponent.type === 'Container' && (
                     <Form.Item label="容器标题">
                       <Input 
                          // @ts-ignore
                         value={selectedComponent.props.label}
                         onChange={(e) => updateComponentProps(selectedComponent.id, { label: e.target.value })}
                       />
                     </Form.Item>
                  )}

                  {/* 标题配置 - 除 Container 和 Button 外的所有组件 */}
                  {!['Container', 'Button'].includes(selectedComponent.type) && (
                    <Form.Item label="标题 (Label)">
                      <Input
                        // @ts-ignore
                        value={selectedComponent.props.label}
                        onChange={(e) => updateComponentProps(selectedComponent.id, { label: e.target.value })}
                      />
                    </Form.Item>
                  )}

                  {/* 占位符配置 */}
                  {['Input', 'TextArea', 'InputNumber', 'Select', 'DatePicker', 'TimePicker'].includes(selectedComponent.type) && (
                    <Form.Item label="占位符">
                      <Input
                        // @ts-ignore
                        value={selectedComponent.props.placeholder}
                        onChange={(e) => updateComponentProps(selectedComponent.id, { placeholder: e.target.value })}
                        placeholder="请输入..."
                      />
                    </Form.Item>
                  )}

                  {/* 必填配置 */}
                  {!['Container', 'Button'].includes(selectedComponent.type) && (
                    <Form.Item label="必填">
                      <Button 
                        type={('required' in selectedComponent.props && selectedComponent.props.required) ? 'primary' : 'default'}
                        size="small"
                        onClick={() => {
                          // @ts-ignore
                          const current = selectedComponent.props.required || false;
                          updateComponentProps(selectedComponent.id, { required: !current });
                        }}
                      >
                        {/* @ts-ignore */}
                        {selectedComponent.props.required ? '✓ 必填' : '非必填'}
                      </Button>
                    </Form.Item>
                  )}

                  {/* 按钮内容配置 */}
                  {selectedComponent.type === 'Button' && (
                    <Form.Item label="按钮文字">
                      <Input
                        value={selectedComponent.props.content}
                        onChange={(e) => updateComponentProps(selectedComponent.id, { content: e.target.value })}
                      />
                    </Form.Item>
                  )}

                  {/* 选项配置 */}
                  {['Select', 'Radio', 'Checkbox'].includes(selectedComponent.type) && renderOptionsEditor()}

                  {/* Switch 开关文字配置 */}
                  {selectedComponent.type === 'Switch' && (
                    <>
                      <Form.Item label="开启时文字">
                        <Input
                          value={selectedComponent.props.checkedChildren || ''}
                          onChange={(e) => updateComponentProps(selectedComponent.id, { checkedChildren: e.target.value })}
                          placeholder="例如：开"
                        />
                      </Form.Item>
                      <Form.Item label="关闭时文字">
                        <Input
                          value={selectedComponent.props.unCheckedChildren || ''}
                          onChange={(e) => updateComponentProps(selectedComponent.id, { unCheckedChildren: e.target.value })}
                          placeholder="例如：关"
                        />
                      </Form.Item>
                    </>
                  )}

                  {/* TextArea 行数配置 */}
                  {selectedComponent.type === 'TextArea' && (
                    <Form.Item label="行数">
                      <Input
                        type="number"
                        value={selectedComponent.props.rows || 4}
                        onChange={(e) => updateComponentProps(selectedComponent.id, { rows: Number(e.target.value) || 4 })}
                      />
                    </Form.Item>
                  )}

                  <Divider style={{ margin: '16px 0' }}>组件联动</Divider>

                  {/* 显隐条件配置 */}
                  <Form.Item 
                    label="显隐条件 (visibleOn)" 
                    tooltip="使用 JavaScript 表达式，通过 values.组件ID 访问其他组件的值"
                  >
                    <Input.TextArea
                      // @ts-ignore
                      value={selectedComponent.props.visibleOn || ''}
                      onChange={(e) => updateComponentProps(selectedComponent.id, { visibleOn: e.target.value })}
                      placeholder={`例如：values['${components[0]?.id || 'xxx'}'] === 'show'`}
                      rows={3}
                      style={{ fontFamily: 'monospace', fontSize: 12 }}
                    />
                    <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                      <div>可用的组件 ID：</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                        {components.filter(c => c.id !== selectedComponent.id).slice(0, 5).map(c => (
                          <Tag 
                            key={c.id} 
                            style={{ cursor: 'pointer', fontSize: 11 }}
                            onClick={() => {
                              // @ts-ignore
                              const current = selectedComponent.props.visibleOn || '';
                              updateComponentProps(selectedComponent.id, { 
                                visibleOn: current ? current : `values['${c.id}']` 
                              });
                            }}
                          >
                            {c.type}: {c.id.slice(0, 8)}...
                          </Tag>
                        ))}
                      </div>
                    </div>
                  </Form.Item>
                  
                  <div style={{ marginTop: 32 }}>
                    <Button danger block icon={<DeleteOutlined />} onClick={() => deleteComponent(selectedComponent.id)}>
                      删除
                    </Button>
                  </div>
                </Form>
              ) : (
                <div style={{ textAlign: 'center', color: '#999', marginTop: 50 }}>
                  请选择一个组件
                </div>
              )}
            </div>
          </Sider>
        </Layout>

        <DragOverlay>
          {activeDragId ? (
            activeDragId.startsWith('new-') ? (
              <SidebarItemOverlay type={activeDragType || 'Input'} />
            ) : (
              <div style={{ padding: 16, background: 'white', border: '1px solid #1677ff', borderRadius: 4, opacity: 0.8 }}>
                正在移动...
              </div>
            )
          ) : null}
        </DragOverlay>
      </DndContext>

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