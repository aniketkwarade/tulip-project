import { defineConfig } from 'vite';
import { LOCAL_DEV } from './scripts/local-dev-config.mjs';

const backendTarget = `http://${LOCAL_DEV.backendHost}:${LOCAL_DEV.backendPort}`;

export default defineConfig({
  build: {
    // The graph topology is intentionally data-dense but compresses to roughly
    // 130 kB. Keep it cacheable independently from application behavior.
    chunkSizeWarningLimit: 1100,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'graph-data',
              test: /runtime-graph\.generated\.js$/,
              priority: 20
            }
          ]
        }
      }
    }
  },
  server: {
    host: LOCAL_DEV.host,
    port: LOCAL_DEV.port,
    strictPort: true,
    proxy: {
      '/api': {
        target: backendTarget,
        changeOrigin: true
      },
      '/api-openaq': {
        target: 'https://api.openaq.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-openaq/, '')
      }
    }
  },
  preview: {
    host: LOCAL_DEV.host,
    port: LOCAL_DEV.port,
    strictPort: true,
    proxy: {
      '/api': {
        target: backendTarget,
        changeOrigin: true
      },
      '/api-openaq': {
        target: 'https://api.openaq.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-openaq/, '')
      }
    }
  }
});
