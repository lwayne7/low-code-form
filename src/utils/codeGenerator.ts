import type { ComponentSchema } from '../types';

/**
 * 代码生成器 - 将 ComponentSchema 转换为真实的 React 代码
 */

// 生成组件的 JSX 代码
const generateComponentCode = (component: ComponentSchema, indent: number = 2): string => {
  const spaces = ' '.repeat(indent);
  const childIndent = indent + 2;

  switch (component.type) {
    case 'Input':
      return `${spaces}<Form.Item
${spaces}  name="${component.id}"
${spaces}  label="${component.props.label}"
${spaces}  rules={[${component.props.required ? `{ required: true, message: '请输入${component.props.label}' }` : ''}]}
${spaces}>
${spaces}  <Input placeholder="${component.props.placeholder || ''}" />
${spaces}</Form.Item>`;

    case 'TextArea':
      return `${spaces}<Form.Item
${spaces}  name="${component.id}"
${spaces}  label="${component.props.label}"
${spaces}  rules={[${component.props.required ? `{ required: true, message: '请输入${component.props.label}' }` : ''}]}
${spaces}>
${spaces}  <Input.TextArea placeholder="${component.props.placeholder || ''}" rows={${component.props.rows || 4}} />
${spaces}</Form.Item>`;

    case 'InputNumber':
      return `${spaces}<Form.Item
${spaces}  name="${component.id}"
${spaces}  label="${component.props.label}"
${spaces}  rules={[${component.props.required ? `{ required: true, message: '请输入${component.props.label}' }` : ''}]}
${spaces}>
${spaces}  <InputNumber placeholder="${component.props.placeholder || ''}" style={{ width: '100%' }} />
${spaces}</Form.Item>`;

    case 'Select': {
      const options = component.props.options
        .map((o) => `{ label: '${o.label}', value: '${o.value}' }`)
        .join(', ');
      return `${spaces}<Form.Item
${spaces}  name="${component.id}"
${spaces}  label="${component.props.label}"
${spaces}  rules={[${component.props.required ? `{ required: true, message: '请选择${component.props.label}' }` : ''}]}
${spaces}>
${spaces}  <Select placeholder="${component.props.placeholder || ''}" options={[${options}]} />
${spaces}</Form.Item>`;
    }

    case 'Radio': {
      const options = component.props.options
        .map((o) => `{ label: '${o.label}', value: '${o.value}' }`)
        .join(', ');
      return `${spaces}<Form.Item
${spaces}  name="${component.id}"
${spaces}  label="${component.props.label}"
${spaces}  rules={[${component.props.required ? `{ required: true, message: '请选择${component.props.label}' }` : ''}]}
${spaces}>
${spaces}  <Radio.Group options={[${options}]} />
${spaces}</Form.Item>`;
    }

    case 'Checkbox': {
      const options = component.props.options
        .map((o) => `{ label: '${o.label}', value: '${o.value}' }`)
        .join(', ');
      return `${spaces}<Form.Item
${spaces}  name="${component.id}"
${spaces}  label="${component.props.label}"
${spaces}  rules={[${component.props.required ? `{ required: true, message: '请选择${component.props.label}' }` : ''}]}
${spaces}>
${spaces}  <Checkbox.Group options={[${options}]} />
${spaces}</Form.Item>`;
    }

    case 'Switch':
      return `${spaces}<Form.Item
${spaces}  name="${component.id}"
${spaces}  label="${component.props.label}"
${spaces}  valuePropName="checked"
${spaces}>
${spaces}  <Switch${component.props.checkedChildren ? ` checkedChildren="${component.props.checkedChildren}"` : ''}${component.props.unCheckedChildren ? ` unCheckedChildren="${component.props.unCheckedChildren}"` : ''} />
${spaces}</Form.Item>`;

    case 'DatePicker':
      return `${spaces}<Form.Item
${spaces}  name="${component.id}"
${spaces}  label="${component.props.label}"
${spaces}  rules={[${component.props.required ? `{ required: true, message: '请选择${component.props.label}' }` : ''}]}
${spaces}>
${spaces}  <DatePicker placeholder="${component.props.placeholder || ''}" style={{ width: '100%' }} />
${spaces}</Form.Item>`;

    case 'TimePicker':
      return `${spaces}<Form.Item
${spaces}  name="${component.id}"
${spaces}  label="${component.props.label}"
${spaces}  rules={[${component.props.required ? `{ required: true, message: '请选择${component.props.label}' }` : ''}]}
${spaces}>
${spaces}  <TimePicker placeholder="${component.props.placeholder || ''}" style={{ width: '100%' }} />
${spaces}</Form.Item>`;

    case 'Button':
      return `${spaces}<Form.Item>
${spaces}  <Button type="${component.props.type || 'primary'}" htmlType="submit" block>
${spaces}    ${component.props.content}
${spaces}  </Button>
${spaces}</Form.Item>`;

    case 'Container': {
      const childrenCode = (component.children || [])
        .map((child) => generateComponentCode(child, childIndent))
        .join('\n\n');
      return `${spaces}<Card title="${component.props.label || '容器'}" style={{ marginBottom: 16 }}>
${childrenCode || `${' '.repeat(childIndent)}{/* 容器内容 */}`}
${spaces}</Card>`;
    }

    default: {
      const unknownType = (component as ComponentSchema).type;
      return `${spaces}{/* Unknown component type: ${unknownType} */}`;
    }
  }
};

// 生成带有联动逻辑的组件代码
const generateComponentWithVisibility = (component: ComponentSchema, indent: number = 2): string => {
  const baseCode = generateComponentCode(component, indent + 2);
  
  if (component.props.visibleOn) {
    const spaces = ' '.repeat(indent);
    // 将 visibleOn 表达式中的 values['xxx'] 转换为 formValues['xxx']
    const condition = component.props.visibleOn.replace(/values\[/g, 'formValues[');
    return `${spaces}{/* 条件渲染: ${component.props.visibleOn} */}
${spaces}{(${condition}) && (
${baseCode}
${spaces})}`;
  }
  
  return baseCode;
};

// 生成完整的 React 组件代码
export const generateFullCode = (components: ComponentSchema[]): string => {
  const hasContainer = components.some((c) => c.type === 'Container' || c.children?.length);
  const hasDatePicker = components.some((c) => c.type === 'DatePicker');
  const hasTimePicker = components.some((c) => c.type === 'TimePicker');
  const hasSwitch = components.some((c) => c.type === 'Switch');
  const hasSelect = components.some((c) => c.type === 'Select');
  const hasRadio = components.some((c) => c.type === 'Radio');
  const hasCheckbox = components.some((c) => c.type === 'Checkbox');
  const hasInputNumber = components.some((c) => c.type === 'InputNumber');
  const hasVisibleOn = components.some((c) => c.props.visibleOn);

  // 构建导入列表
  const antdImports = ['Form', 'Input', 'Button'];
  if (hasContainer) antdImports.push('Card');
  if (hasDatePicker) antdImports.push('DatePicker');
  if (hasTimePicker) antdImports.push('TimePicker');
  if (hasSwitch) antdImports.push('Switch');
  if (hasSelect) antdImports.push('Select');
  if (hasRadio) antdImports.push('Radio');
  if (hasCheckbox) antdImports.push('Checkbox');
  if (hasInputNumber) antdImports.push('InputNumber');

  const componentsCode = components
    .map((c) => generateComponentWithVisibility(c, 6))
    .join('\n\n');

  const stateHook = hasVisibleOn 
    ? `\n  const [formValues, setFormValues] = useState<Record<string, any>>({});

  const handleValuesChange = (_: any, allValues: any) => {
    setFormValues(allValues);
  };
`
    : '';

  const formProps = hasVisibleOn
    ? `
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      onValuesChange={handleValuesChange}`
    : `
      form={form}
      layout="vertical"
      onFinish={handleSubmit}`;

  return `import React${hasVisibleOn ? ', { useState }' : ''} from 'react';
import { ${antdImports.join(', ')} } from 'antd';

/**
 * 自动生成的表单组件
 * 生成时间: ${new Date().toLocaleString('zh-CN')}
 */
export default function GeneratedForm() {
  const [form] = Form.useForm();
${stateHook}
  const handleSubmit = (values: Record<string, any>) => {
    console.log('表单提交数据:', values);
    // TODO: 在这里添加你的提交逻辑
  };

  return (
    <Form${formProps}
    >
${componentsCode}
    </Form>
  );
}
`;
};

// 生成 JSON Schema（用于后端对接）
export const generateJsonSchema = (components: ComponentSchema[]): object => {
  const properties: Record<string, object> = {};
  const required: string[] = [];

  const processComponent = (component: ComponentSchema) => {
    if (component.type === 'Container') {
      component.children?.forEach(processComponent);
      return;
    }

    if (component.type === 'Button') return;

    const prop: Record<string, unknown> = {
      title: 'label' in component.props ? component.props.label : '',
    };

    switch (component.type) {
      case 'Input':
      case 'TextArea':
        prop.type = 'string';
        break;
      case 'InputNumber':
        prop.type = 'number';
        break;
      case 'Select':
      case 'Radio':
        prop.type = 'string';
        prop.enum = component.props.options.map((o) => o.value);
        break;
      case 'Checkbox':
        prop.type = 'array';
        prop.items = { type: 'string', enum: component.props.options.map((o) => o.value) };
        break;
      case 'Switch':
        prop.type = 'boolean';
        break;
      case 'DatePicker':
      case 'TimePicker':
        prop.type = 'string';
        prop.format = component.type === 'DatePicker' ? 'date' : 'time';
        break;
    }

    properties[component.id] = prop;

    if ('required' in component.props && component.props.required) {
      required.push(component.id);
    }
  };

  components.forEach(processComponent);

  return {
    type: 'object',
    properties,
    required,
  };
};
