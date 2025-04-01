import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
      buffer: "buffer/"
    }
  },
  server: {
    port: 5173,
    host: true,
    watch: {
      usePolling: true,
      interval: 100
    },
    hmr: {
      overlay: false
    }
  },
  preview: {
    host: true,
    port: 5173,
  },
  css: {
    postcss: './postcss.config.js'
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis'
      },
      plugins: [
        NodeGlobalsPolyfillPlugin({
          buffer: true
        })
      ]
    }
  },
  define:  process.env.NODE_ENV === "development"
  ? {
      global: {},
    }
  : undefined
});
