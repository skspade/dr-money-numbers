import { defineConfig, devices } from '@playwright/experimental-ct-react';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// In ESM, we need to recreate __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './src/components',
  /* Test pattern to match component test files */
  testMatch: '**/*.ct.tsx',
  /* The base directory, relative to the config file, for snapshot files created with toMatchSnapshot and toHaveScreenshot. */
  snapshotDir: './__snapshots__',
  /* Maximum time one test can run for. */
  timeout: 10 * 1000,
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI ? 'dot' : 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    /* Port to use for Playwright component endpoint. */
    ctPort: 3100,
    /* Component testing specific options */
    ctViteConfig: {
      resolve: {
        alias: {
          '@': resolve(__dirname, './src'),
        },
      },
      // Server-side rendering config (disabling)
      server: {
        hmr: false, // Disable hot module reloading for tests
        preTransformRequests: false, // Disable transforming for performance
      },
      // Handle various file extensions appropriately
      assetsInclude: ['**/*.md'],
      // Exclude problematic server modules from component tests
      optimizeDeps: {
        exclude: [
          'next',
          'next/server',
          'next/cache',
          'pg',
          '@auth/core',
          '@auth/drizzle-adapter',
          'drizzle-orm',
        ],
      },
    },
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Use a single browser in CI to speed up tests
    ...(!process.env.CI ? [
      {
        name: 'firefox',
        use: { ...devices['Desktop Firefox'] },
      },
      {
        name: 'webkit',
        use: { ...devices['Desktop Safari'] },
      },
    ] : []),
  ],
});
