import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              // Group React and ReactDOM
              if (id.includes('react') || id.includes('react-dom')) {
                return 'vendor-react';
              }
              // Group Material UI
              if (id.includes('@mui/') || id.includes('material')) {
                return 'vendor-mui';
              }
              // Group CodeMirror related libraries
              if (
                id.includes('@codemirror') ||
                id.includes('@uiw/react-codemirror') ||
                id.includes('codemirror') ||
                id.includes('@lezer')
              ) {
                return 'vendor-codemirror';
              }
              // Group Xterm.js
              if (id.includes('@xterm')) {
                return 'vendor-xterm';
              }
              // Group Nanostores
              if (id.includes('nanostores')) {
                return 'vendor-nanostores';
              }
              // Group markdown related libraries
              if (
                id.includes('react-markdown') ||
                id.includes('rehype') ||
                id.includes('remark') ||
                id.includes('github-markdown-css')
              ) {
                return 'vendor-markdown';
              }
              // Group framer-motion
              if (id.includes('framer-motion')) {
                return 'vendor-framer-motion';
              }
              // All other node_modules dependencies go into a general 'vendor' chunk
              return 'vendor';
            }
          },
        },
      },
    },
    preview: {
      port: 4173,
    },
    server: {
      port: 3001,
      proxy: {
        '/api': {
          target: env.VITE_API_URL,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },

        '/socket.io': {
          target: env.VITE_WS_URL,
          changeOrigin: true,
          ws: true,
        },
      },
      cors: {
        origin: ['*'],
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
      },
      allowedHosts: ['app.local', 'localhost'],
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
      'import.meta.env.GITHUB_CALLBACK_URL': JSON.stringify(
        env.GITHUB_CALLBACK_URL,
      ),
      'import.meta.env.GOOGLE_CALLBACK_URL': JSON.stringify(
        env.GOOGLE_CALLBACK_URL,
      ),
      'import.meta.env.FRONTEND_URL': JSON.stringify(env.VITE_FRONTEND_URL),
    },
  };
});
