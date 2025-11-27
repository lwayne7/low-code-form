import { nanoid } from 'nanoid';
import type { ComponentSchema } from '../types';

export interface FormTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  getComponents: () => ComponentSchema[];
}

// 登录表单模板
const loginFormTemplate: FormTemplate = {
  id: 'login',
  name: '登录表单',
  description: '包含用户名、密码和登录按钮',
  icon: '🔐',
  getComponents: () => [
    {
      id: nanoid(),
      type: 'Input',
      props: {
        label: '用户名',
        placeholder: '请输入用户名',
        rules: [{ type: 'required', message: '请输入用户名' }],
      },
    },
    {
      id: nanoid(),
      type: 'Input',
      props: {
        label: '密码',
        placeholder: '请输入密码',
        rules: [
          { type: 'required', message: '请输入密码' },
          { type: 'minLength', value: 6, message: '密码至少6位' },
        ],
      },
    },
    {
      id: nanoid(),
      type: 'Switch',
      props: {
        label: '记住我',
        checkedChildren: '是',
        unCheckedChildren: '否',
      },
    },
    {
      id: nanoid(),
      type: 'Button',
      props: {
        content: '登录',
        type: 'primary',
      },
    },
  ],
};

// 注册表单模板
const registerFormTemplate: FormTemplate = {
  id: 'register',
  name: '注册表单',
  description: '包含用户名、邮箱、密码和确认密码',
  icon: '📝',
  getComponents: () => [
    {
      id: nanoid(),
      type: 'Input',
      props: {
        label: '用户名',
        placeholder: '请输入用户名',
        rules: [
          { type: 'required', message: '请输入用户名' },
          { type: 'minLength', value: 3, message: '用户名至少3个字符' },
        ],
      },
    },
    {
      id: nanoid(),
      type: 'Input',
      props: {
        label: '邮箱',
        placeholder: '请输入邮箱地址',
        rules: [
          { type: 'required', message: '请输入邮箱' },
          { type: 'email', message: '请输入有效的邮箱地址' },
        ],
      },
    },
    {
      id: nanoid(),
      type: 'Input',
      props: {
        label: '手机号',
        placeholder: '请输入手机号',
        rules: [{ type: 'phone', message: '请输入有效的手机号' }],
      },
    },
    {
      id: nanoid(),
      type: 'Input',
      props: {
        label: '密码',
        placeholder: '请输入密码（至少8位）',
        rules: [
          { type: 'required', message: '请输入密码' },
          { type: 'minLength', value: 8, message: '密码至少8位' },
        ],
      },
    },
    {
      id: nanoid(),
      type: 'Checkbox',
      props: {
        label: '我已阅读并同意',
        options: [{ label: '用户协议', value: 'agree' }],
        rules: [{ type: 'required', message: '请阅读并同意用户协议' }],
      },
    },
    {
      id: nanoid(),
      type: 'Button',
      props: {
        content: '注册',
        type: 'primary',
      },
    },
  ],
};

// 联系我们表单模板
const contactFormTemplate: FormTemplate = {
  id: 'contact',
  name: '联系我们',
  description: '包含姓名、邮箱、主题和留言内容',
  icon: '📬',
  getComponents: () => [
    {
      id: nanoid(),
      type: 'Input',
      props: {
        label: '姓名',
        placeholder: '请输入您的姓名',
        rules: [{ type: 'required', message: '请输入姓名' }],
      },
    },
    {
      id: nanoid(),
      type: 'Input',
      props: {
        label: '邮箱',
        placeholder: '请输入您的邮箱',
        rules: [
          { type: 'required', message: '请输入邮箱' },
          { type: 'email', message: '请输入有效的邮箱地址' },
        ],
      },
    },
    {
      id: nanoid(),
      type: 'Select',
      props: {
        label: '咨询类型',
        placeholder: '请选择咨询类型',
        options: [
          { label: '产品咨询', value: 'product' },
          { label: '技术支持', value: 'support' },
          { label: '商务合作', value: 'business' },
          { label: '其他', value: 'other' },
        ],
        rules: [{ type: 'required', message: '请选择咨询类型' }],
      },
    },
    {
      id: nanoid(),
      type: 'TextArea',
      props: {
        label: '留言内容',
        placeholder: '请输入您的留言内容...',
        rows: 5,
        rules: [
          { type: 'required', message: '请输入留言内容' },
          { type: 'minLength', value: 10, message: '留言内容至少10个字符' },
        ],
      },
    },
    {
      id: nanoid(),
      type: 'Button',
      props: {
        content: '提交',
        type: 'primary',
      },
    },
  ],
};

// 个人信息表单模板
const profileFormTemplate: FormTemplate = {
  id: 'profile',
  name: '个人信息',
  description: '包含基本信息和详细信息分组',
  icon: '👤',
  getComponents: () => {
    const basicInfoId = nanoid();
    const detailInfoId = nanoid();
    
    return [
      {
        id: basicInfoId,
        type: 'Container',
        props: {
          label: '基本信息',
          direction: 'vertical',
        },
        children: [
          {
            id: nanoid(),
            type: 'Input',
            props: {
              label: '姓名',
              placeholder: '请输入姓名',
              rules: [{ type: 'required', message: '请输入姓名' }],
            },
          },
          {
            id: nanoid(),
            type: 'Radio',
            props: {
              label: '性别',
              options: [
                { label: '男', value: 'male' },
                { label: '女', value: 'female' },
              ],
            },
          },
          {
            id: nanoid(),
            type: 'DatePicker',
            props: {
              label: '出生日期',
              placeholder: '请选择出生日期',
            },
          },
        ],
      },
      {
        id: detailInfoId,
        type: 'Container',
        props: {
          label: '联系方式',
          direction: 'vertical',
        },
        children: [
          {
            id: nanoid(),
            type: 'Input',
            props: {
              label: '手机号',
              placeholder: '请输入手机号',
              rules: [
                { type: 'required', message: '请输入手机号' },
                { type: 'phone', message: '请输入有效的手机号' },
              ],
            },
          },
          {
            id: nanoid(),
            type: 'Input',
            props: {
              label: '邮箱',
              placeholder: '请输入邮箱',
              rules: [{ type: 'email', message: '请输入有效的邮箱地址' }],
            },
          },
          {
            id: nanoid(),
            type: 'TextArea',
            props: {
              label: '详细地址',
              placeholder: '请输入详细地址',
              rows: 2,
            },
          },
        ],
      },
      {
        id: nanoid(),
        type: 'Button',
        props: {
          content: '保存',
          type: 'primary',
        },
      },
    ];
  },
};

// 反馈表单模板
const feedbackFormTemplate: FormTemplate = {
  id: 'feedback',
  name: '意见反馈',
  description: '包含评分、反馈类型和详细描述',
  icon: '💬',
  getComponents: () => [
    {
      id: nanoid(),
      type: 'Radio',
      props: {
        label: '您的满意度',
        options: [
          { label: '非常满意', value: '5' },
          { label: '满意', value: '4' },
          { label: '一般', value: '3' },
          { label: '不满意', value: '2' },
          { label: '非常不满意', value: '1' },
        ],
        rules: [{ type: 'required', message: '请选择满意度' }],
      },
    },
    {
      id: nanoid(),
      type: 'Checkbox',
      props: {
        label: '问题类型（可多选）',
        options: [
          { label: '功能问题', value: 'feature' },
          { label: '性能问题', value: 'performance' },
          { label: '界面问题', value: 'ui' },
          { label: '其他问题', value: 'other' },
        ],
      },
    },
    {
      id: nanoid(),
      type: 'TextArea',
      props: {
        label: '详细描述',
        placeholder: '请详细描述您遇到的问题或建议...',
        rows: 6,
        rules: [{ type: 'required', message: '请输入详细描述' }],
      },
    },
    {
      id: nanoid(),
      type: 'Input',
      props: {
        label: '联系方式（可选）',
        placeholder: '如需我们回复，请留下您的联系方式',
      },
    },
    {
      id: nanoid(),
      type: 'Button',
      props: {
        content: '提交反馈',
        type: 'primary',
      },
    },
  ],
};

// 导出所有模板
export const formTemplates: FormTemplate[] = [
  loginFormTemplate,
  registerFormTemplate,
  contactFormTemplate,
  profileFormTemplate,
  feedbackFormTemplate,
];
