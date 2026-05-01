// vite.config.js
import { defineConfig } from "file:///C:/Users/panch/Desktop/Preploop/frontend/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/panch/Desktop/Preploop/frontend/node_modules/@vitejs/plugin-react/dist/index.js";
var vite_config_default = defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true
      },
      "/kontests-api": {
        target: "https://kontests.net",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/kontests-api/, "/api/v1"),
        secure: false
      }
    }
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    chunkSizeWarningLimit: 1e4,
    rollupOptions: {
      output: {
        // Disable inlining of main module as data: URL
        // Ensures main.jsx is served as separate file, not embedded in HTML
        entryFileNames: "[name]-[hash].js",
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("react-dom") || id.includes("react-router")) return "vendor-react";
          if (id.includes("@monaco-editor") || id.includes("monaco-editor")) return "vendor-editor";
          if (id.includes("@blocknote") || id.includes("@tiptap") || id.includes("prosemirror")) return "vendor-richtext";
          if (id.includes("prettier")) return "vendor-prettier";
          if (id.includes("reactflow")) return "vendor-reactflow";
          if (id.includes("@react-three") || id.includes("three")) return "vendor-3d";
        }
      }
    }
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.js",
    css: true,
    include: ["src/**/*.{test,spec}.{js,jsx,ts,tsx}"]
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxwYW5jaFxcXFxEZXNrdG9wXFxcXFByZXBsb29wXFxcXGZyb250ZW5kXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxwYW5jaFxcXFxEZXNrdG9wXFxcXFByZXBsb29wXFxcXGZyb250ZW5kXFxcXHZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9wYW5jaC9EZXNrdG9wL1ByZXBsb29wL2Zyb250ZW5kL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnO1xuXG4vLyBGb3JjZSBWaXRlIHJlc3RhcnQgZm9yIGRlcGVuZGVuY3kgb3B0aW1pemF0aW9uXG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFtyZWFjdCgpXSxcbiAgc2VydmVyOiB7XG4gICAgcG9ydDogNTE3MyxcbiAgICBwcm94eToge1xuICAgICAgJy9hcGknOiB7XG4gICAgICAgIHRhcmdldDogJ2h0dHA6Ly9sb2NhbGhvc3Q6NTAwMCcsXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICAnL2tvbnRlc3RzLWFwaSc6IHtcbiAgICAgICAgdGFyZ2V0OiAnaHR0cHM6Ly9rb250ZXN0cy5uZXQnLFxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiBwYXRoLnJlcGxhY2UoL15cXC9rb250ZXN0cy1hcGkvLCAnL2FwaS92MScpLFxuICAgICAgICBzZWN1cmU6IGZhbHNlLFxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAgYnVpbGQ6IHtcbiAgICBvdXREaXI6ICdkaXN0JyxcbiAgICBzb3VyY2VtYXA6IGZhbHNlLFxuICAgIGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogMTAwMDAsXG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgb3V0cHV0OiB7XG4gICAgICAgIC8vIERpc2FibGUgaW5saW5pbmcgb2YgbWFpbiBtb2R1bGUgYXMgZGF0YTogVVJMXG4gICAgICAgIC8vIEVuc3VyZXMgbWFpbi5qc3ggaXMgc2VydmVkIGFzIHNlcGFyYXRlIGZpbGUsIG5vdCBlbWJlZGRlZCBpbiBIVE1MXG4gICAgICAgIGVudHJ5RmlsZU5hbWVzOiAnW25hbWVdLVtoYXNoXS5qcycsXG4gICAgICAgIG1hbnVhbENodW5rcyhpZCkge1xuICAgICAgICAgIGlmICghaWQuaW5jbHVkZXMoJ25vZGVfbW9kdWxlcycpKSByZXR1cm47XG5cbiAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ3JlYWN0LWRvbScpIHx8IGlkLmluY2x1ZGVzKCdyZWFjdC1yb3V0ZXInKSkgcmV0dXJuICd2ZW5kb3ItcmVhY3QnO1xuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnQG1vbmFjby1lZGl0b3InKSB8fCBpZC5pbmNsdWRlcygnbW9uYWNvLWVkaXRvcicpKSByZXR1cm4gJ3ZlbmRvci1lZGl0b3InO1xuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnQGJsb2Nrbm90ZScpIHx8IGlkLmluY2x1ZGVzKCdAdGlwdGFwJykgfHwgaWQuaW5jbHVkZXMoJ3Byb3NlbWlycm9yJykpIHJldHVybiAndmVuZG9yLXJpY2h0ZXh0JztcbiAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ3ByZXR0aWVyJykpIHJldHVybiAndmVuZG9yLXByZXR0aWVyJztcbiAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ3JlYWN0ZmxvdycpKSByZXR1cm4gJ3ZlbmRvci1yZWFjdGZsb3cnO1xuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnQHJlYWN0LXRocmVlJykgfHwgaWQuaW5jbHVkZXMoJ3RocmVlJykpIHJldHVybiAndmVuZG9yLTNkJztcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbiAgdGVzdDoge1xuICAgIGdsb2JhbHM6IHRydWUsXG4gICAgZW52aXJvbm1lbnQ6ICdqc2RvbScsXG4gICAgc2V0dXBGaWxlczogJy4vc3JjL3Rlc3Qvc2V0dXAuanMnLFxuICAgIGNzczogdHJ1ZSxcbiAgICBpbmNsdWRlOiBbJ3NyYy8qKi8qLnt0ZXN0LHNwZWN9Lntqcyxqc3gsdHMsdHN4fSddLFxuICB9XG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBc1QsU0FBUyxvQkFBb0I7QUFDblYsT0FBTyxXQUFXO0FBSWxCLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVMsQ0FBQyxNQUFNLENBQUM7QUFBQSxFQUNqQixRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixPQUFPO0FBQUEsTUFDTCxRQUFRO0FBQUEsUUFDTixRQUFRO0FBQUEsUUFDUixjQUFjO0FBQUEsTUFDaEI7QUFBQSxNQUNBLGlCQUFpQjtBQUFBLFFBQ2YsUUFBUTtBQUFBLFFBQ1IsY0FBYztBQUFBLFFBQ2QsU0FBUyxDQUFDLFNBQVMsS0FBSyxRQUFRLG1CQUFtQixTQUFTO0FBQUEsUUFDNUQsUUFBUTtBQUFBLE1BQ1Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsUUFBUTtBQUFBLElBQ1IsV0FBVztBQUFBLElBQ1gsdUJBQXVCO0FBQUEsSUFDdkIsZUFBZTtBQUFBLE1BQ2IsUUFBUTtBQUFBO0FBQUE7QUFBQSxRQUdOLGdCQUFnQjtBQUFBLFFBQ2hCLGFBQWEsSUFBSTtBQUNmLGNBQUksQ0FBQyxHQUFHLFNBQVMsY0FBYyxFQUFHO0FBRWxDLGNBQUksR0FBRyxTQUFTLFdBQVcsS0FBSyxHQUFHLFNBQVMsY0FBYyxFQUFHLFFBQU87QUFDcEUsY0FBSSxHQUFHLFNBQVMsZ0JBQWdCLEtBQUssR0FBRyxTQUFTLGVBQWUsRUFBRyxRQUFPO0FBQzFFLGNBQUksR0FBRyxTQUFTLFlBQVksS0FBSyxHQUFHLFNBQVMsU0FBUyxLQUFLLEdBQUcsU0FBUyxhQUFhLEVBQUcsUUFBTztBQUM5RixjQUFJLEdBQUcsU0FBUyxVQUFVLEVBQUcsUUFBTztBQUNwQyxjQUFJLEdBQUcsU0FBUyxXQUFXLEVBQUcsUUFBTztBQUNyQyxjQUFJLEdBQUcsU0FBUyxjQUFjLEtBQUssR0FBRyxTQUFTLE9BQU8sRUFBRyxRQUFPO0FBQUEsUUFDbEU7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLE1BQU07QUFBQSxJQUNKLFNBQVM7QUFBQSxJQUNULGFBQWE7QUFBQSxJQUNiLFlBQVk7QUFBQSxJQUNaLEtBQUs7QUFBQSxJQUNMLFNBQVMsQ0FBQyxzQ0FBc0M7QUFBQSxFQUNsRDtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
