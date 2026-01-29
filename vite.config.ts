import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // 分包配置
    rollupOptions: {
      output: {
        manualChunks: {
          // React 核心库
          'vendor-react': ['react', 'react-dom'],
          
          // Ant Design 组件库（最大的依赖）
          'vendor-antd': ['antd', '@ant-design/icons'],
          
          // 拖拽库
          'vendor-dnd': [
            '@dnd-kit/core',
            '@dnd-kit/sortable',
            '@dnd-kit/utilities',
          ],
          
          // 状态管理
          'vendor-zustand': ['zustand'],
          
          // 工具库
          'vendor-utils': ['nanoid', 'dayjs'],
        },
      },
    },
    // 提高 chunk 大小警告阈值（因为 antd 本身就很大）
    chunkSizeWarningLimit: 600,
  },
})
