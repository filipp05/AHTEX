import { defineConfig } from '@playwright/test'
export default defineConfig({
 testDir: process.env.CONNECTED_QA ? './e2e-connected' : './e2e', timeout: 45000, workers: 1,
 use: { baseURL: 'http://127.0.0.1:3100', headless: true, screenshot: 'only-on-failure' },
 webServer: { command: 'node scripts/qa-server.mjs', url: 'http://127.0.0.1:3100', reuseExistingServer: !process.env.CI, stdout: 'ignore', stderr: 'ignore' },
 reporter: [['list'], ['html', { open: 'never' }]],
})
