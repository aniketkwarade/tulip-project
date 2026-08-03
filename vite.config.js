import { defineConfig } from 'vite';
import { LOCAL_DEV } from './scripts/local-dev-config.mjs';

const backendTarget = `http://${LOCAL_DEV.backendHost}:${LOCAL_DEV.backendPort}`;

export default defineConfig({
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
