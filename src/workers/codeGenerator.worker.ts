/**
 * 代码生成 Web Worker
 * 面试考点：Web Worker 多线程、主线程与 Worker 通信、结构化克隆算法
 * 
 * 优点：
 * 1. 不阻塞 UI 主线程
 * 2. 大型表单的代码生成不会造成卡顿
 * 3. 可以利用多核 CPU
 */

// Worker 内部使用简化的类型定义（避免跨环境类型问题）
interface ComponentSchema {
  id: string;
  type: string;
  props: Record<string, unknown>;
  children?: ComponentSchema[];
}

// Worker 消息类型定义
export interface WorkerMessage {
  type: 'generateCode' | 'generateJsonSchema' | 'formatJson';
  payload: unknown;
  id: string; // 用于匹配响应
}

export interface WorkerResponse {
  type: 'result' | 'error';
  payload: unknown;
  id: string;
}

// 代码生成逻辑（与 codeGenerator.ts 同步）
function generateFullCode(components: ComponentSchema[]): string {
  const imports = new Set<string>(['Form']);
  
  // 递归收集所有需要导入的组件
  const collectImports = (items: ComponentSchema[]) => {
    items.forEach((comp) => {
      switch (comp.type) {
        case 'Input':
          imports.add('Input');
          break;
        case 'TextArea':
          imports.add('Input');
          break;
        case 'InputNumber':
          imports.add('InputNumber');
          break;
        case 'Select':
          imports.add('Select');
          break;
        case 'Radio':
          imports.add('Radio');
          break;
        case 'Checkbox':
          imports.add('Checkbox');
          break;
        case 'Switch':
          imports.add('Switch');
          break;
        case 'DatePicker':
          imports.add('DatePicker');
          break;
        case 'TimePicker':
          imports.add('TimePicker');
          break;
        case 'Button':
          imports.add('Button');
          break;
        case 'Container':
          imports.add('Card');
          break;
      }
      if (comp.children) {
        collectImports(comp.children);
      }
    });
  };
  
  collectImports(components);

  const renderComponent = (comp: ComponentSchema, indent: number = 2): string => {
    const pad = ' '.repeat(indent);
    const props = comp.props;
    
    // 处理 visibleOn 条件渲染
    const visibleOnStart = props.visibleOn 
      ? `{/* 条件渲染: ${props.visibleOn} */}\n${pad}`
      : '';

    switch (comp.type) {
      case 'Input':
        return `${visibleOnStart}${pad}<Form.Item label="${props.label || ''}"${props.required ? ' rules={[{ required: true }]}' : ''}>
${pad}  <Input placeholder="${props.placeholder || ''}" />
${pad}</Form.Item>`;
      
      case 'TextArea':
        return `${visibleOnStart}${pad}<Form.Item label="${props.label || ''}"${props.required ? ' rules={[{ required: true }]}' : ''}>
${pad}  <Input.TextArea rows={${props.rows || 4}} placeholder="${props.placeholder || ''}" />
${pad}</Form.Item>`;
      
      case 'InputNumber':
        return `${visibleOnStart}${pad}<Form.Item label="${props.label || ''}"${props.required ? ' rules={[{ required: true }]}' : ''}>
${pad}  <InputNumber style={{ width: '100%' }} placeholder="${props.placeholder || ''}" />
${pad}</Form.Item>`;
      
      case 'Select':
        return `${visibleOnStart}${pad}<Form.Item label="${props.label || ''}"${props.required ? ' rules={[{ required: true }]}' : ''}>
${pad}  <Select options={${JSON.stringify(props.options || [])}} placeholder="${props.placeholder || ''}" />
${pad}</Form.Item>`;
      
      case 'Radio':
        return `${visibleOnStart}${pad}<Form.Item label="${props.label || ''}"${props.required ? ' rules={[{ required: true }]}' : ''}>
${pad}  <Radio.Group options={${JSON.stringify(props.options || [])}} />
${pad}</Form.Item>`;
      
      case 'Checkbox':
        return `${visibleOnStart}${pad}<Form.Item label="${props.label || ''}"${props.required ? ' rules={[{ required: true }]}' : ''}>
${pad}  <Checkbox.Group options={${JSON.stringify(props.options || [])}} />
${pad}</Form.Item>`;
      
      case 'Switch':
        return `${visibleOnStart}${pad}<Form.Item label="${props.label || ''}" valuePropName="checked">
${pad}  <Switch />
${pad}</Form.Item>`;
      
      case 'DatePicker':
        return `${visibleOnStart}${pad}<Form.Item label="${props.label || ''}"${props.required ? ' rules={[{ required: true }]}' : ''}>
${pad}  <DatePicker style={{ width: '100%' }} />
${pad}</Form.Item>`;
      
      case 'TimePicker':
        return `${visibleOnStart}${pad}<Form.Item label="${props.label || ''}"${props.required ? ' rules={[{ required: true }]}' : ''}>
${pad}  <TimePicker style={{ width: '100%' }} />
${pad}</Form.Item>`;
      
      case 'Button':
        return `${pad}<Form.Item>
${pad}  <Button type="${props.type || 'primary'}" htmlType="${props.htmlType || 'button'}">${props.content || '按钮'}</Button>
${pad}</Form.Item>`;
      
      case 'Container': {
        const childrenCode = comp.children?.map(child => renderComponent(child, indent + 2)).join('\n') || '';
        return `${visibleOnStart}${pad}<Card title="${props.label || '容器'}" style={{ marginBottom: 16 }}>
${childrenCode}
${pad}</Card>`;
      }
      
      default:
        return '';
    }
  };

  const formItems = components.map(comp => renderComponent(comp)).join('\n\n');

  return `import React from 'react';
import { ${Array.from(imports).join(', ')} } from 'antd';

const GeneratedForm: React.FC = () => {
  const [form] = Form.useForm();

  const onFinish = (values: any) => {
    console.log('表单数据:', values);
  };

  return (
    <Form form={form} layout="vertical" onFinish={onFinish}>
${formItems}
    </Form>
  );
};

export default GeneratedForm;`;
}

// JSON Schema 生成
function generateJsonSchema(components: ComponentSchema[]): object {
  const properties: Record<string, object> = {};
  const required: string[] = [];

  const processComponent = (comp: ComponentSchema) => {
    if (comp.type === 'Container') {
      comp.children?.forEach(processComponent);
      return;
    }
    
    if (comp.type === 'Button') return;

    const prop: Record<string, unknown> = {
      title: comp.props.label || comp.id,
    };

    switch (comp.type) {
      case 'Input':
      case 'TextArea':
        prop.type = 'string';
        break;
      case 'InputNumber':
        prop.type = 'number';
        break;
      case 'Select':
      case 'Radio': {
        prop.type = 'string';
        const selectOptions = comp.props.options as Array<{ value: string }> | undefined;
        prop.enum = selectOptions?.map((o) => o.value);
        break;
      }
      case 'Checkbox':
        {
          prop.type = 'array';
          const checkOptions = comp.props.options as Array<{ value: string }> | undefined;
          prop.items = { 
            type: 'string', 
            enum: checkOptions?.map((o) => o.value) 
          };
          break;
        }
      case 'Switch':
        prop.type = 'boolean';
        break;
      case 'DatePicker':
      case 'TimePicker':
        prop.type = 'string';
        prop.format = comp.type === 'DatePicker' ? 'date' : 'time';
        break;
    }

    properties[comp.id] = prop;
    if (comp.props.required) {
      required.push(comp.id);
    }
  };

  components.forEach(processComponent);

  return {
    $schema: 'http://json-schema.org/draft-07/schema#',
    type: 'object',
    properties,
    required,
  };
}

// Worker 消息处理
self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { type, payload, id } = event.data;

  try {
    let result: unknown;

    switch (type) {
      case 'generateCode':
        result = generateFullCode(payload as ComponentSchema[]);
        break;
      case 'generateJsonSchema':
        result = generateJsonSchema(payload as ComponentSchema[]);
        break;
      case 'formatJson':
        result = JSON.stringify(payload, null, 2);
        break;
      default:
        throw new Error(`Unknown message type: ${type}`);
    }

    const response: WorkerResponse = { type: 'result', payload: result, id };
    self.postMessage(response);
  } catch (error) {
    const response: WorkerResponse = { 
      type: 'error', 
      payload: error instanceof Error ? error.message : 'Unknown error', 
      id 
    };
    self.postMessage(response);
  }
};
