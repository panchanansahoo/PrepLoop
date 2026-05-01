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
    sourcemap: false,
    // Warning limit: warn when uncompressed chunks exceed 500 KB
    // (roughly 100-150 KB gzipped, which is reasonable for a single chunk)
    // Largest legitimate chunks (vendor libraries) should be <800 KB uncompressed
    // Hard limit is enforced by checkBundleSize.js during build
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      treeshake: {
        moduleSideEffects: true,
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false,
      },
      output: {
        // Disable inlining of main module as data: URL
        // Ensures main.jsx is served as separate file, not embedded in HTML
        entryFileNames: '[name]-[hash].js',
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          if (id.includes('react-dom') || id.includes('react-router')) return 'vendor-react';
          if (id.includes('@monaco-editor') || id.includes('monaco-editor')) return 'vendor-editor';
          if (id.includes('@blocknote') || id.includes('@tiptap') || id.includes('prosemirror')) return 'vendor-richtext';
          if (id.includes('prettier')) return 'vendor-prettier';
          if (id.includes('reactflow')) return 'vendor-reactflow';
          if (id.includes('@react-three') || id.includes('three')) return 'vendor-3d';
          if (id.includes('@mantine')) return 'vendor-mantine';
          if (id.includes('@supabase')) return 'vendor-supabase';
          if (id.includes('lucide-react')) return 'vendor-lucide';
          if (id.includes('react-syntax-highlighter') || id.includes('highlight.js')) return 'vendor-syntax';
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    css: true,
    include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
  }
});
