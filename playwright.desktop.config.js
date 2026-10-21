import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/desktop', outputDir: '/tmp/tulip-desktop-playwright-results', timeout: 30000, workers: 1,
  use: { baseURL: 'http://127.0.0.1:4317', viewport: { width: 1440, height: 1000 }, trace: 'retain-on-failure' },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'webkit', use: { browserName: 'webkit' } },
    { name: 'firefox', use: { browserName: 'firefox' } }
  ],
  webServer: { command: 'node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 4317 --strictPort', url: 'http://127.0.0.1:4317', reuseExistingServer: true }
});
