import { defineConfig } from '@playwright/test';
const gpu = { args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] };
export default defineConfig({
  testDir: 'tests',
  testMatch: /.*\.spec\.mjs/,
  timeout: 120000,
  workers: 1,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:8080', hasTouch: true },
  webServer: { command: 'node scripts/serve.mjs', port: 8080, reuseExistingServer: true },
  projects: [
    { name: 'ipad-1180', use: { browserName: 'chromium', viewport: { width: 1180, height: 820 }, launchOptions: gpu } },
    { name: 'ipad-1024', use: { browserName: 'chromium', viewport: { width: 1024, height: 768 }, launchOptions: gpu } },
    { name: 'webkit-1180', use: { browserName: 'webkit', viewport: { width: 1180, height: 820 } } },
  ],
});
