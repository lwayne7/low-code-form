import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E 测试配置
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  
  // 测试超时时间
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },
  
  // 并行运行测试
  fullyParallel: true,
  
  // 失败时重试次数（CI环境下）
  retries: process.env.CI ? 2 : 0,
  
  // 并发worker数量
  workers: process.env.CI ? 1 : undefined,
  
  // 报告器配置
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'playwright-report/results.json' }],
    ['list'],
  ],
  
  // 共享配置
  use: {
    // 基础URL
    baseURL: 'http://localhost:5173',
    
    // 收集trace用于调试
    trace: 'on-first-retry',
    
    // 截图设置
    screenshot: 'only-on-failure',
    
    // 视频录制
    video: 'retain-on-failure',
    
    // 视口大小
    viewport: { width: 1280, height: 720 },
  },

  // 配置测试项目（不同浏览器）
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // 移动端测试
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // 在所有测试之前启动开发服务器
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
