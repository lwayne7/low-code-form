import type { ComponentSchema, ValidationRule } from '../types';

/**
 * 代码生成器 - 将 ComponentSchema 转换为真实的 React 代码
 */

// 🆕 将 ValidationRule 转换为 Ant Design Form rules
const generateAntdRules = (rules?: ValidationRule[], label?: string): string => {
  if (!rules || rules.length === 0) return '[]';
  
  const antdRules = rules.map(rule => {
    switch (rule.type) {
      case 'required':
        return `{ required: true, message: '${rule.message || `请输入${label}`}' }`;
      case 'minLength':
        return `{ min: ${rule.value}, message: '${rule.message || `至少${rule.value}个字符`}' }`;
      case 'maxLength':
        return `{ max: ${rule.value}, message: '${rule.message || `最多${rule.value}个字符`}' }`;
      case 'min':
        return `{ type: 'number', min: ${rule.value}, message: '${rule.message || `不能小于${rule.value}`}' }`;
      case 'max':
        return `{ type: 'number', max: ${rule.value}, message: '${rule.message || `不能大于${rule.value}`}' }`;
      case 'email':
        return `{ type: 'email', message: '${rule.message || '请输入有效的邮箱地址'}' }`;
      case 'pattern':
        return `{ pattern: /${rule.value}/, message: '${rule.message || '格式不正确'}' }`;
      case 'phone':
        return `{ pattern: /^1[3-9]\\d{9}$/, message: '${rule.message || '请输入有效的手机号码'}' }`;
      default:
        return '';
    }
  }).filter(Boolean);
  
  return `[${antdRules.join(', ')}]`;
};

// 生成组件的 JSX 代码
const generateComponentCode = (component: ComponentSchema, indent: number = 2): string => {
  const spaces = ' '.repeat(indent);
  const childIndent = indent + 2;
  const label = 'label' in component.props ? component.props.label : '';
  const rules = generateAntdRules(component.props.rules, label);

  switch (component.type) {
    case 'Input':
      return `${spaces}<Form.Item
${spaces}  name="${component.id}"
${spaces}  label="${component.props.label}"
${spaces}  rules={${rules}}
${spaces}>
${spaces}  <Input placeholder="${component.props.placeholder || ''}" />
${spaces}</Form.Item>`;

    case 'TextArea':
      return `${spaces}<Form.Item
${spaces}  name="${component.id}"
${spaces}  label="${component.props.label}"
${spaces}  rules={${rules}}
${spaces}>
${spaces}  <Input.TextArea placeholder="${component.props.placeholder || ''}" rows={${component.props.rows || 4}} />
${spaces}</Form.Item>`;

    case 'InputNumber':
      return `${spaces}<Form.Item
${spaces}  name="${component.id}"
${spaces}  label="${component.props.label}"
${spaces}  rules={${rules}}
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
${spaces}  rules={${rules}}
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
${spaces}  rules={${rules}}
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
${spaces}  rules={${rules}}
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
${spaces}  rules={${rules}}
${spaces}>
${spaces}  <DatePicker placeholder="${component.props.placeholder || ''}" style={{ width: '100%' }} />
${spaces}</Form.Item>`;

    case 'TimePicker':
      return `${spaces}<Form.Item
${spaces}  name="${component.id}"
${spaces}  label="${component.props.label}"
${spaces}  rules={${rules}}
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

    // 🆕 添加校验规则到 JSON Schema
    if (component.props.rules) {
      component.props.rules.forEach(rule => {
        switch (rule.type) {
          case 'required':
            required.push(component.id);
            break;
          case 'minLength':
            prop.minLength = rule.value;
            break;
          case 'maxLength':
            prop.maxLength = rule.value;
            break;
          case 'min':
            prop.minimum = rule.value;
            break;
          case 'max':
            prop.maximum = rule.value;
            break;
          case 'pattern':
            prop.pattern = rule.value;
            break;
          case 'email':
            prop.format = 'email';
            break;
        }
      });
    }

    // 兼容旧的 required 属性
    if ('required' in component.props && component.props.required && !required.includes(component.id)) {
      required.push(component.id);
    }

    properties[component.id] = prop;
  };

  components.forEach(processComponent);

  return {
    $schema: 'http://json-schema.org/draft-07/schema#',
    type: 'object',
    properties,
    required,
  };
};
