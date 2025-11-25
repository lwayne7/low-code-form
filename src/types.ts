// 1. 定义组件类型：目前支持 文本输入框 和 按钮
export type ComponentType = 'Input' | 'Button';

// 2. 定义组件的数据结构 (Schema)
export interface ComponentSchema {
  id: string;           // 唯一标识符 (UUID)，非常重要！区分同一个类型的不同实例
  type: ComponentType;  // 组件类型
  props: any;           // 组件的属性配置 (例如 label, placeholder, content)
}

// 3. 整个画布的数据结构
export interface CanvasSchema {
  components: ComponentSchema[]; // 也就是一个数组，存着所有组件
}