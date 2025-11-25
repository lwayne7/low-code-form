import { Input, Button, Form, Modal } from 'antd';
import { useStore } from './store';
import './App.css';
import { SortableItem } from './SortableItem';
import { useState } from 'react'; // 引入 useState 控制弹窗
import { FormRenderer } from './FormRenderer'; // 引入渲染器

// ⚠️ 引入 DnD 相关库
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

function App() {
  // 从 Store 中获取数据和方法
  const {
    components,
    selectedId,
    addComponent,
    selectComponent,
    updateComponentProps,
    deleteComponent, // 获取删除方法
    reorderComponents // 获取排序方法
  } = useStore();

  // 在 App 函数内部，useStore 下方添加：
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // 1. 获取当前选中的组件对象
  const selectedComponent = components.find(c => c.id === selectedId);

  // 2. 设置传感器 (Sensors)：区分点击和拖拽
  // 这里的 activationConstraint 是为了防止点击选择时误触发拖拽
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 按住移动 5px 后才算拖拽，避免点击冲突
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 3. 拖拽结束的处理函数
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      // 如果位置发生了变化，调用 store 的排序方法
      reorderComponents(active.id as string, over?.id as string);
    }
  };

  // 4. 查看 JSON 功能
  const handleShowJson = () => {
    Modal.info({
      title: '当前表单 Schema',
      width: 600,
      content: (
        <pre style={{ maxHeight: '400px', overflow: 'auto', background: '#f5f5f5', padding: 10 }}>
          {JSON.stringify(components, null, 2)}
        </pre>
      ),
    });
  };

  return (
    <div className="editor-container">
      {/* --- 左侧 --- */}
      <div className="left-panel">
        <h3>物料堆</h3>
        <Button block onClick={() => addComponent('Input')} style={{ marginBottom: 10 }}>
          输入框组件
        </Button>
        <Button block onClick={() => addComponent('Button')}>
          按钮组件
        </Button>
        <div style={{ marginTop: 20, borderTop: '1px solid #eee', paddingTop: 20 }}>
          <Button type="dashed" danger block onClick={handleShowJson}>
            查看 JSON
          </Button>
        </div>
        {/* 在左侧面板的底部 */}
        <div style={{ marginTop: 20, borderTop: '1px solid #eee', paddingTop: 20, display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Button type="dashed" onClick={handleShowJson} style={{ flex: 1 }}>
            查看 JSON
          </Button>
          <Button type="primary" onClick={() => setIsPreviewOpen(true)} style={{ flex: 1 }}>
            预览表单
          </Button>
        </div>
      </div>

      {/* --- 中间：画布区 --- */}
      <div className="canvas-panel">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          {/* SortableContext 需要知道所有组件的 ID 列表 */}
          <SortableContext
            items={components.map(c => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <div style={{ minHeight: '100%', paddingBottom: 50 }}>
              {components.map((component) => (
                <SortableItem
                  key={component.id}
                  id={component.id}
                  isSelected={component.id === selectedId}
                  onClick={() => selectComponent(component.id)}
                >
                  {/* 渲染组件内容 */}
                  <div style={{ pointerEvents: 'none' }}>
                    {/* pointerEvents: none 很关键！防止输入框本身捕获鼠标事件导致无法拖拽 */}
                    {component.type === 'Input' && (
                      <Form.Item label={component.props.label} style={{ marginBottom: 0 }}>
                        <Input placeholder={component.props.placeholder} />
                      </Form.Item>
                    )}
                    {component.type === 'Button' && (
                      <Button type="primary">{component.props.content}</Button>
                    )}
                  </div>
                </SortableItem>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* --- 右侧：属性配置区 --- */}
      <div className="right-panel">
        <h3>属性配置</h3>
        {selectedComponent ? (
          <Form layout="vertical">
            <Form.Item label="组件 ID">
              <Input value={selectedComponent.id} disabled />
            </Form.Item>

            {/* ... 这里保持之前的 Input/Button 配置逻辑不变 ... */}
            {selectedComponent.type === 'Input' && (
              <>
                <Form.Item label="标题">
                  <Input
                    value={selectedComponent.props.label}
                    onChange={(e) => updateComponentProps(selectedComponent.id, { label: e.target.value })}
                  />
                </Form.Item>
                <Form.Item label="占位符">
                  <Input
                    value={selectedComponent.props.placeholder}
                    onChange={(e) => updateComponentProps(selectedComponent.id, { placeholder: e.target.value })}
                  />
                </Form.Item>
              </>
            )}

            {selectedComponent.type === 'Button' && (
              <Form.Item label="按钮文字">
                <Input
                  value={selectedComponent.props.content}
                  onChange={(e) => updateComponentProps(selectedComponent.id, { content: e.target.value })}
                />
              </Form.Item>
            )}

            <div style={{ marginTop: 20 }}>
              <Button danger block onClick={() => deleteComponent(selectedComponent.id)}>
                删除组件
              </Button>
            </div>
          </Form>
        ) : (
          <div style={{ color: '#999', textAlign: 'center', marginTop: 50 }}>
            请在中间点击选中一个组件
          </div>
        )}
      </div>

      {/* 预览弹窗 */}
      <Modal
        title="表单预览 (真实运行态)"
        open={isPreviewOpen}
        onCancel={() => setIsPreviewOpen(false)}
        footer={null} // 隐藏 Modal 默认的确定取消按钮，使用表单自己的按钮
        width={600}
      >
        <div style={{ padding: 20 }}>
          {/* 将 Store 中的 components 传给渲染器 */}
          <FormRenderer components={components} />
        </div>
      </Modal>
    </div>
  );
}

export default App;