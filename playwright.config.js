const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests',
  workers: 1,
  timeout: 60000,
  use: { baseURL: 'http://localhost:5187', viewport: { width: 1366, height: 900 }, trace: 'retain-on-failure' },
  reporter: [['list'], ['json', { outputFile: 'test-results/browser-results.json' }]],
  webServer: [
    { command: 'node scripts/e2e-api.js', url: 'http://localhost:3107/api/health', reuseExistingServer: false },
    { command: 'node frontend/node_modules/vite/bin/vite.js frontend --host localhost --port 5187 --strictPort', url: 'http://localhost:5187', env: { VITE_API_URL: 'http://localhost:3107/api' }, reuseExistingServer: false }
  ]
});
