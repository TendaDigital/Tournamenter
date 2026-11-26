const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './test',
  workers: 1,
  use: {
    browserName: 'chromium',
    launchOptions: { executablePath: process.env.CHROMIUM_PATH || undefined },
  },
});
