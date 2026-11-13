import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import process from 'node:process';

export default defineConfig({
  plugins: [
    react(),
    ...(process.env.ANALYZE === 'true' ? [
      visualizer({
        filename: './dist/stats.html',
        open: false,
        gzipSize: true,
        brotliSize: true,
      })
    ] : [])
  ],
  server: {
    host: true,
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
    minify: 'esbuild',
    chunkSizeWarningLimit: 1600,
    modulePreload: {
      resolveDependencies: (_filename, deps, { hostType }) => {
        if (hostType === 'html') {
          return deps.filter((dep) =>
            !dep.includes('vendor-three') &&
            !dep.includes('vendor-react-three') &&
            !dep.includes('vendor-reactflow') &&
            !dep.includes('vendor-editor') &&
            !dep.includes('vendor-monaco') &&
            !dep.includes('vendor-prettier')
          );
        }
        return deps;
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/src/data/problemsDatabase') || id.includes('/src/data/questionsBank')) {
            return 'data-problem-bank';
          }
          if (id.includes('/src/data/algorithmCodesMulti')) {
            return 'data-algorithm-codes';
          }
          if (id.includes('/src/data/dsaPatterns')) {
            return 'data-dsa-patterns';
          }
          if (id.includes('/src/data/systemDesignTheoryData') || id.includes('/src/data/systemDesignData')) {
            return 'data-system-design';
          }

          if (!id.includes('node_modules')) return;

          // Keep manual chunking focused on very heavy dependencies.
          // Group tightly coupled editor packages to avoid circular chunk warnings.
          if (id.includes('@supabase')) return 'vendor-supabase';
          if (id.includes('@monaco-editor') || id.includes('monaco-editor')) return 'vendor-monaco';
          if (id.includes('@blocknote') || id.includes('@tiptap') || id.includes('prosemirror')) return 'vendor-editor';
          if (id.includes('prettier')) return 'vendor-prettier';
          if (id.includes('@react-three') || id.includes('/@react-three/')) return 'vendor-react-three';
          if (id.includes('/three/')) return 'vendor-three-core';
          if (id.includes('reactflow') || id.includes('dagre')) return 'vendor-reactflow';

          return undefined;
        },
        assetFileNames: (assetInfo) => {
          const name = assetInfo?.name || '';
          const info = name.split('.');
          const ext = info[info.length - 1] || '';
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
      '@supabase/supabase-js',
      'lucide-react',
      'axios',
      'clsx',
      'tailwind-merge',
      '@mantine/core',
      '@mantine/hooks',
      '@react-three/drei',
      '@react-three/fiber',
      'three',
      '@blocknote/core',
      '@blocknote/mantine',
      '@blocknote/react',
      '@tiptap/core',
      '@tiptap/react',
      '@tiptap/starter-kit',
      'reactflow',
      'react-markdown',
      'react-syntax-highlighter'
    ],
    exclude: ['@monaco-editor/react']
  },
  test: {
    globals: true,
    environment: 'jsdom',
    pool: 'forks',
    maxWorkers: 2,
    minWorkers: 1,
    testTimeout: 15000,
    hookTimeout: 10000,
    teardownTimeout: 5000,
    setupFiles: ['./vitest.setup.js'],
    css: true,
    include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{js,jsx}'],
      exclude: [
        'src/**/*.{test,spec}.{js,jsx}',
        'src/test/**',
        'src/main.jsx',
        'src/examples/**',
        'src/components/AnalyticsDashboard.jsx',
        'src/components/LoadingAnimationDemo.jsx',
        'src/utils/lazyLoading.js',
        'src/utils/lazyLoad.jsx',
      ],
    },
  }
});
