import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests', timeout: 60000, fullyParallel: false,
  use: { browserName: process.env.PLAYWRIGHT_BROWSER === 'webkit' ? 'webkit' : 'chromium', baseURL: process.env.APP_BASE_URL || 'http://127.0.0.1:5187', headless: true, launchOptions: process.env.PLAYWRIGHT_BROWSER === 'webkit' ? {} : { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE, args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] } },
  webServer: process.env.APP_BASE_URL ? undefined : { command: 'npm run dev -- --host 127.0.0.1 --port 5187 --strictPort', url: 'http://127.0.0.1:5187', reuseExistingServer: false },
});
