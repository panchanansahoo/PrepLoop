import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: './dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    })
  ],
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
    sourcemap: process.env.NODE_ENV !== 'production',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.debug']
      }
    },
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          // Core React libraries
          if (id.includes('react-dom') || id.includes('react/') || id.includes('scheduler')) {
            return 'vendor-react-core';
          }
          if (id.includes('react-router')) return 'vendor-router';
          
          // Heavy editors
          if (id.includes('@monaco-editor') || id.includes('monaco-editor')) {
            return 'vendor-monaco';
          }
          
          // Rich text editors
          if (id.includes('@blocknote') || id.includes('@tiptap') || id.includes('prosemirror')) {
            return 'vendor-richtext';
          }
          
          // Code formatting
          if (id.includes('prettier')) return 'vendor-prettier';
          
          // Diagrams and flows
          if (id.includes('reactflow') || id.includes('dagre')) return 'vendor-flow';
          
          // 3D rendering
          if (id.includes('@react-three') || id.includes('three')) return 'vendor-3d';
          
          // UI libraries
          if (id.includes('@mantine') || id.includes('lucide-react')) return 'vendor-ui';
          
          // Supabase
          if (id.includes('@supabase')) return 'vendor-supabase';
          
          // Markdown and syntax highlighting
          if (id.includes('react-markdown') || id.includes('react-syntax-highlighter')) {
            return 'vendor-markdown';
          }
          
          // Other vendor code
          return 'vendor-misc';
        },
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/woff|woff2|eot|ttf|otf/i.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js'
    ],
    exclude: ['@monaco-editor/react']
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    css: true,
    include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
  }
});
