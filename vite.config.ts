import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Cấu hình Vite cho React + TypeScript với alias @ trỏ tới src
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: false,
  },
});
