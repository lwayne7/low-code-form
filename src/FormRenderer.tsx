import React from 'react';
import { Form, Input, Button } from 'antd';
import type { ComponentSchema } from './types';

interface FormRendererProps {
  components: ComponentSchema[]; // 接收 JSON 数组
  onSubmit?: (values: any) => void; // 预留提交表单的回调
}

export const FormRenderer: React.FC<FormRendererProps> = ({ components, onSubmit }) => {
  const [form] = Form.useForm();

  const handleFinish = (values: any) => {
    console.log('用户提交的数据:', values);
    if (onSubmit) {
      onSubmit(values);
    }
    alert('提交成功！请在控制台查看数据');
  };

  return (
    <Form form={form} layout="vertical" onFinish={handleFinish}>
      {components.map((component) => {
        // 根据类型渲染，这里不再需要拖拽的包裹，也不需要点击选中的逻辑
        switch (component.type) {
          case 'Input':
            return (
              <Form.Item
                key={component.id}
                label={component.props.label}
                name={component.id} // 表单字段名使用组件 ID，保证唯一
                rules={[{ required: false }]} // 可以在这里扩展必填校验逻辑
              >
                <Input placeholder={component.props.placeholder} />
              </Form.Item>
            );
          case 'Button':
            return (
              <Form.Item key={component.id}>
                <Button type="primary" htmlType="submit" block>
                  {component.props.content}
                </Button>
              </Form.Item>
            );
          default:
            return null;
        }
      })}
    </Form>
  );
};