// @ts-check
const { defineConfig, devices } = require('@playwright/test')

module.exports = defineConfig({
  testDir: './',
  fullyParallel: false, // Run tests sequentially for Foundry stability
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker for Foundry
  reporter: 'html',
  timeout: 60000, // 60 seconds per test
  use: {
    baseURL: 'http://localhost:30000',
    trace: 'on-first-retry'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
  // No webServer config - start Foundry manually with the `v14` world (which
  // must have the dcc system + mcc-classes + mcc-core-book enabled). Tests log
  // in as Gamemaster automatically.
})
