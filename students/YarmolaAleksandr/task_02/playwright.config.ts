import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: /.*\.spec\.ts$/,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  reporter: [['list'], ['html']],
  timeout: 60000,
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 15000,
    locale: 'en-US',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: [
    {
      command: 'cd backend && npm run dev',
      url: 'http://localhost:5000',
      reuseExistingServer: !process.env.CI,
      timeout: 180000,
      stdout: 'ignore',
      stderr: 'pipe',
    },
    {
      command: 'cd frontend && npm start',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 180000,
      stdout: 'ignore',
      stderr: 'pipe',
    },
  ],
});

