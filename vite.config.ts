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
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          // React
          if (id.includes('/react/') || id.includes('/react-dom/')) return 'vendor-react';

          // Ant Design + icons（分开减少单 chunk 体积）
          if (id.includes('/antd/')) return 'vendor-antd';
          if (id.includes('/@ant-design/icons/')) return 'vendor-icons';

          // DnD
          if (id.includes('/@dnd-kit/')) return 'vendor-dnd';

          // State
          if (id.includes('/zustand/')) return 'vendor-zustand';

          // Virtualization
          if (id.includes('/react-window') || id.includes('/react-window-infinite-loader')) {
            return 'vendor-virtual';
          }

          // Small utils
          if (id.includes('/nanoid/') || id.includes('/clsx/') || id.includes('/tailwind-merge/')) {
            return 'vendor-utils';
          }

          return 'vendor';
        },
      },
    },
    // 提高 chunk 大小警告阈值（antd 仍然较大；其余通过懒加载/分包控制）
    chunkSizeWarningLimit: 800,
  },
})
