import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * Playwright configuration for Everyday Food E2E tests
 * Mobile-first testing for React Native Web application
 * @see https://playwright.dev/docs/test-configuration
 * @see https://playwright.dev/docs/emulation
 */

const AUTH_FILE = path.join(__dirname, 'e2e', '.auth', 'user.json');
const AUTH_FILE_MOBILE = path.join(__dirname, 'e2e', '.auth', 'user-mobile.json');

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
    ...(process.env.CI ? [['junit', { outputFile: 'e2e-results.xml' }] as const] : []),
  ],

  // Global setup runs before any tests - seeds test user
  globalSetup: './e2e/global-setup.ts',

  // Global teardown runs after all tests - cleanup
  globalTeardown: './e2e/global-teardown.ts',

  // Default timeout settings
  timeout: 30000,
  expect: {
    timeout: 10000,
  },

  use: {
    baseURL: 'http://localhost:8081',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    // Better waiting strategy for React Native Web
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },

  projects: [
    // ═══════════════════════════════════════════════════════
    // SETUP PROJECTS - Run first to authenticate
    // ═══════════════════════════════════════════════════════

    // Desktop setup - saves auth state for desktop tests
    {
      name: 'setup-desktop',
      testMatch: /auth-setup\.ts/,
      use: {
        ...devices['Desktop Chrome'],
      },
    },

    // Mobile setup - saves auth state for mobile tests (uses mobile viewport)
    {
      name: 'setup-mobile',
      testMatch: /auth-setup\.ts/,
      use: {
        ...devices['Pixel 5'],
        // Override auth file for mobile
        storageState: undefined,
      },
    },

    // ═══════════════════════════════════════════════════════
    // DESKTOP TEST PROJECTS
    // ═══════════════════════════════════════════════════════

    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: AUTH_FILE,
      },
      dependencies: ['setup-desktop'],
      // Ignore auth setup and auth tests (login/register should run unauthenticated)
      testIgnore: [/auth-setup\.ts/, /auth\/.+\.spec\.ts/],
    },

    // ═══════════════════════════════════════════════════════
    // MOBILE TEST PROJECTS - Primary target for React Native
    // ═══════════════════════════════════════════════════════

    // Android - Pixel 5
    {
      name: 'mobile-android',
      use: {
        ...devices['Pixel 5'],
        storageState: AUTH_FILE_MOBILE,
        // Touch events enabled by default with Pixel 5
      },
      dependencies: ['setup-mobile'],
      testIgnore: [/auth-setup\.ts/, /auth\/.+\.spec\.ts/],
    },

    // Android - Pixel 7 (larger screen)
    {
      name: 'mobile-android-large',
      use: {
        ...devices['Pixel 7'],
        storageState: AUTH_FILE_MOBILE,
      },
      dependencies: ['setup-mobile'],
      testIgnore: [/auth-setup\.ts/, /auth\/.+\.spec\.ts/],
    },

    // iOS - iPhone 13
    {
      name: 'mobile-ios',
      use: {
        ...devices['iPhone 13'],
        storageState: AUTH_FILE_MOBILE,
      },
      dependencies: ['setup-mobile'],
      testIgnore: [/auth-setup\.ts/, /auth\/.+\.spec\.ts/],
    },

    // iOS - iPhone 14 Pro Max (larger screen)
    {
      name: 'mobile-ios-large',
      use: {
        ...devices['iPhone 14 Pro Max'],
        storageState: AUTH_FILE_MOBILE,
      },
      dependencies: ['setup-mobile'],
      testIgnore: [/auth-setup\.ts/, /auth\/.+\.spec\.ts/],
    },

    // Tablet - iPad
    {
      name: 'tablet-ios',
      use: {
        ...devices['iPad Pro 11'],
        storageState: AUTH_FILE_MOBILE,
      },
      dependencies: ['setup-mobile'],
      testIgnore: [/auth-setup\.ts/, /auth\/.+\.spec\.ts/],
    },

    // ═══════════════════════════════════════════════════════
    // UNAUTHENTICATED PROJECTS - For login/register tests
    // ═══════════════════════════════════════════════════════

    {
      name: 'auth-desktop',
      use: {
        ...devices['Desktop Chrome'],
      },
      testMatch: /auth\/.+\.spec\.ts/,
    },

    {
      name: 'auth-mobile',
      use: {
        ...devices['Pixel 5'],
      },
      testMatch: /auth\/.+\.spec\.ts/,
    },
  ],

  webServer: {
    command: 'npm run web',
    url: 'http://localhost:8081',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
