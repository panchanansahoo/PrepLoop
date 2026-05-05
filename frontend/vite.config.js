import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import compression from 'vite-plugin-compression';

export default defineConfig(({ mode }) => {
  const isProd = mode === 'production';

  return {
    plugins: [
      react(),
      isProd && compression({
        verbose: true,
        disable: false,
        threshold: 1024,
        algorithm: 'brotliCompress',
        ext: '.br',
        compressionOptions: {
          level: 11, // Max compression level for Brotli (0-11)
        },
      }),
      isProd && visualizer({
        filename: './dist/stats.html',
        open: false,
        gzipSize: true,
        brotliSize: true,
      }),
    ].filter(Boolean),
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
      sourcemap: !isProd,
      minify: 'esbuild',
      cssCodeSplit: true,
      chunkSizeWarningLimit: 500,
      target: 'es2020',
      ...(isProd && {
        esbuild: {
          drop: ['debugger'],
          pure: ['console.log', 'console.debug', 'console.info', 'console.warn'],
        },
      }),
      rollupOptions: {
        treeshake: {
          moduleSideEffects: true,
          propertyReadSideEffects: false,
          tryCatchDeoptimization: false,
        },
        output: {
          entryFileNames: 'assets/js/[name]-[hash].js',
          chunkFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            const ext = assetInfo.name.split('.').pop();
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) return 'assets/images/[name]-[hash][extname]';
            if (/woff|woff2|eot|ttf|otf/i.test(ext)) return 'assets/fonts/[name]-[hash][extname]';
            return 'assets/[name]-[hash][extname]';
          },
          manualChunks(id) {
            if (!id.includes('node_modules')) return;
            if (id.includes('@monaco-editor') || id.includes('monaco-editor')) return 'vendor-monaco';
            if (id.includes('@react-three') || id.includes('/three/')) return 'vendor-3d';
            if (id.includes('@tiptap') || id.includes('prosemirror')) return 'vendor-tiptap';
            if (id.includes('prettier')) return 'vendor-prettier';
            if (id.includes('reactflow') || id.includes('dagre')) return 'vendor-flow';
            if (id.includes('react-dom') || id.includes('react/') || id.includes('scheduler')) return 'vendor-react';
            if (id.includes('react-router')) return 'vendor-router';
            if (id.includes('@mantine') || id.includes('lucide-react')) return 'vendor-ui';
            if (id.includes('@supabase')) return 'vendor-supabase';
            if (id.includes('react-markdown') || id.includes('react-syntax-highlighter')) return 'vendor-markdown';
          },
        },
      },
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', '@supabase/supabase-js'],
      exclude: ['@monaco-editor/react'],
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.js',
      css: true,
      include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    }
  };
});
