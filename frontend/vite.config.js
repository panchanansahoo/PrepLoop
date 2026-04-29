import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => {
  const isProd = mode === 'production';

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
    build: {
      outDir: 'dist',
      sourcemap: !isProd,
      // Use esbuild (built-in, fastest) for minification
      minify: 'esbuild',
      // Enable CSS code splitting — each lazy route gets its own CSS chunk
      cssCodeSplit: true,
      chunkSizeWarningLimit: 800, // Stricter warning threshold (was 1000)
      // Target modern browsers for smaller output
      target: 'es2020',
      // Drop console.log and debugger in production
      ...(isProd && {
        esbuild: {
          drop: ['debugger'],
          pure: ['console.log', 'console.debug', 'console.info'],
        },
      }),
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return;

            // === Heavy, isolated dependencies (lazy-loaded pages only) ===

            // Monaco Editor (~2MB) — only loaded by DSACodeEditor, CodingPlayground
            if (id.includes('@monaco-editor') || id.includes('monaco-editor')) {
              return 'vendor-monaco';
            }

            // 3D rendering (~1.5MB) — only loaded by AlgorithmPlayground, Home
            if (id.includes('@react-three') || id.includes('/three/')) {
              return 'vendor-3d';
            }

            // Rich text editors (~800KB) — only loaded by CreateBlog, Notes
            if (id.includes('@blocknote')) return 'vendor-blocknote';
            if (id.includes('@tiptap') || id.includes('prosemirror')) {
              return 'vendor-tiptap';
            }

            // Code formatting (~3MB) — only loaded by CodingPlayground
            if (id.includes('prettier')) return 'vendor-prettier';

            // Diagram/flow libraries — only loaded by SystemDesignSimulator
            if (id.includes('reactflow') || id.includes('dagre')) {
              return 'vendor-flow';
            }

            // === Core framework (loaded on every page) ===

            // React core — always needed
            if (id.includes('react-dom') || id.includes('react/') || id.includes('scheduler')) {
              return 'vendor-react';
            }

            // Router — loaded on every page
            if (id.includes('react-router')) return 'vendor-router';

            // === Shared UI libraries ===

            // Mantine + Icons — used across many pages
            if (id.includes('@mantine') || id.includes('lucide-react')) {
              return 'vendor-ui';
            }

            // Supabase client
            if (id.includes('@supabase')) return 'vendor-supabase';

            // Markdown + syntax highlighting
            if (id.includes('react-markdown') || id.includes('react-syntax-highlighter')) {
              return 'vendor-markdown';
            }

            // Let Rollup auto-split remaining modules to avoid circular chunk issues
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
