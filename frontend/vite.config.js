import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';

  return {
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
    esbuild: {
      // Strip console.log, console.debug, console.info from production builds
      // Keep console.warn and console.error for production monitoring
      drop: isProduction ? ['debugger'] : [],
      pure: isProduction
        ? ['console.log', 'console.debug', 'console.info']
        : [],
    },
    build: {
      outDir: 'dist',
      sourcemap: !isProduction,
      minify: 'esbuild',
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return;

            // Keep manual chunking focused on very heavy dependencies.
            // Let Rollup auto-split the rest to avoid circular chunk warnings.
            if (id.includes('@monaco-editor') || id.includes('monaco-editor')) return 'vendor-monaco';
            if (id.includes('@blocknote')) return 'vendor-blocknote';
            if (id.includes('@tiptap') || id.includes('prosemirror')) return 'vendor-tiptap';
            if (id.includes('prettier')) return 'vendor-prettier';
            if (id.includes('@react-three') || id.includes('/@react-three/')) return 'vendor-react-three';
            if (id.includes('/three/')) return 'vendor-three-core';

            return undefined;
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
  };
});
