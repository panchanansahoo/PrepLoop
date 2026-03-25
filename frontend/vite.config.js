import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Force Vite restart for dependency optimization

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/kontests-api': {
        target: 'https://kontests.net',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/kontests-api/, '/api/v1'),
        secure: false,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    chunkSizeWarningLimit: 10000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          if (id.includes('react-dom') || id.includes('react-router')) return 'vendor-react';
          if (id.includes('@monaco-editor') || id.includes('monaco-editor')) return 'vendor-editor';
          if (id.includes('prettier')) return 'vendor-prettier';
          if (id.includes('reactflow')) return 'vendor-reactflow';
          if (id.includes('@react-three') || id.includes('three')) return 'vendor-3d';
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    css: true,
  }
});
