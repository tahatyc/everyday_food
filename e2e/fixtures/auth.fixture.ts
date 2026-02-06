import { test as base, Page, BrowserContext, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Test user credentials for E2E tests
 * These must match the user created in global-setup.ts
 */
export const TEST_USER = {
  email: 'test@example.com',
  password: 'Password123!',
  name: 'Test User',
};

const AUTH_DIR = path.join(__dirname, '..', '.auth');
const AUTH_FILE = path.join(AUTH_DIR, 'user.json');
const AUTH_FILE_MOBILE = path.join(AUTH_DIR, 'user-mobile.json');

/**
 * Get the appropriate auth file based on test context
 */
function getAuthFile(isMobile: boolean): string {
  const file = isMobile ? AUTH_FILE_MOBILE : AUTH_FILE;
  // Fallback to the other file if primary doesn't exist
  if (!fs.existsSync(file)) {
    const fallback = isMobile ? AUTH_FILE : AUTH_FILE_MOBILE;
    if (fs.existsSync(fallback)) {
      return fallback;
    }
  }
  return file;
}

/**
 * Check if auth state file exists and is valid
 */
function hasValidAuthState(isMobile = false): boolean {
  try {
    const authFile = getAuthFile(isMobile);
    if (!fs.existsSync(authFile)) {
      return false;
    }
    const content = fs.readFileSync(authFile, 'utf-8');
    const state = JSON.parse(content);
    // Check for minimum valid structure
    return state && (state.cookies || state.origins);
  } catch {
    return false;
  }
}

/**
 * Helper to detect if project is mobile based on name
 */
function isMobileProject(projectName: string): boolean {
  const name = projectName.toLowerCase();
  return name.includes('mobile') ||
    name.includes('ios') ||
    name.includes('android') ||
    name.includes('tablet');
}

/**
 * Extended test fixture with authentication helpers
 */
export const test = base.extend<{
  authenticatedPage: Page;
  authContext: BrowserContext;
}>({
  /**
   * Provides a page that is already authenticated
   * Uses stored auth state if available, otherwise performs fresh login
   */
  authenticatedPage: async ({ browser }, use, testInfo) => {
    const isMobile = isMobileProject(testInfo.project.name);
    let context: BrowserContext;
    const authFile = getAuthFile(isMobile);

    if (hasValidAuthState(isMobile)) {
      // Use stored auth state for faster tests
      context = await browser.newContext({
        storageState: authFile,
      });
    } else {
      // Fallback: perform fresh login
      console.warn(`[Auth Fixture] No valid auth state found (mobile: ${isMobile}), performing fresh login`);
      context = await browser.newContext();
      const page = await context.newPage();
      await performLogin(page);
    }

    const page = await context.newPage();

    // Verify we're authenticated by checking if we can access authenticated content
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Wait for React Native Web hydration
    await page.waitForTimeout(1000);

    try {
      await expect(page.getByText(/hello, chef/i)).toBeVisible({ timeout: 15000 });
    } catch {
      // Auth state might be stale, try fresh login
      console.warn('[Auth Fixture] Auth state appears stale, performing fresh login');
      await performLogin(page);
    }

    await use(page);
    await context.close();
  },

  /**
   * Provides an authenticated browser context
   * Uses stored auth state if available, otherwise performs fresh login
   */
  authContext: async ({ browser }, use, testInfo) => {
    const isMobile = isMobileProject(testInfo.project.name);
    let context: BrowserContext;
    const authFile = getAuthFile(isMobile);

    if (hasValidAuthState(isMobile)) {
      context = await browser.newContext({
        storageState: authFile,
      });
    } else {
      console.warn(`[Auth Fixture] No valid auth state found (mobile: ${isMobile}), performing fresh login`);
      context = await browser.newContext();
      const page = await context.newPage();
      await performLogin(page);
    }

    await use(context);
    await context.close();
  },
});

export { expect } from '@playwright/test';

/**
 * Perform login with retry logic and error handling
 */
async function performLogin(
  page: Page,
  email = TEST_USER.email,
  password = TEST_USER.password,
  maxRetries = 3
): Promise<void> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await page.goto('/');

      // Wait for login page
      await expect(page.getByText('Welcome Back')).toBeVisible({ timeout: 10000 });

      // Fill credentials
      await page.getByPlaceholder(/you@example.com|email/i).fill(email);
      await page.getByPlaceholder(/enter your password|password/i).fill(password);

      // Click sign in button
      await page.getByRole('button', { name: /sign in/i }).click();

      // Wait for successful authentication
      await expect(page.getByText(/hello, chef/i)).toBeVisible({ timeout: 15000 });

      console.log(`[Auth Fixture] Login successful on attempt ${attempt}`);
      return;
    } catch (error) {
      lastError = error as Error;
      console.warn(`[Auth Fixture] Login attempt ${attempt}/${maxRetries} failed:`, error);

      // Check for specific error conditions
      const errorText = await page.getByText(/invalid|incorrect|error|failed/i).isVisible({ timeout: 2000 }).catch(() => false);
      if (errorText) {
        throw new Error(`Login failed: Invalid credentials or user does not exist. Make sure the test user is registered.`);
      }

      if (attempt < maxRetries) {
        // Wait before retry
        await page.waitForTimeout(1000 * attempt);
      }
    }
  }

  throw new Error(`Login failed after ${maxRetries} attempts: ${lastError?.message}`);
}

/**
 * Login helper function for use in tests
 * Includes retry logic and better error handling
 */
export async function login(
  page: Page,
  email = TEST_USER.email,
  password = TEST_USER.password
): Promise<void> {
  await performLogin(page, email, password);
}

/**
 * Logout helper function
 */
export async function logout(page: Page): Promise<void> {
  await page.goto('/profile');
  await page.waitForTimeout(500);

  const signOutButton = page.getByRole('button', { name: /sign out/i });
  await expect(signOutButton).toBeVisible({ timeout: 10000 });
  await signOutButton.click();

  // Wait for redirect to login page
  await expect(page.getByText('Welcome Back')).toBeVisible({ timeout: 10000 });
}

/**
 * Clear all browser state (cookies, storage)
 */
export async function clearState(context: BrowserContext): Promise<void> {
  await context.clearCookies();
  const pages = context.pages();
  for (const page of pages) {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }
}

/**
 * Register a new user (for registration tests)
 */
export async function register(
  page: Page,
  name: string,
  email: string,
  password: string
): Promise<void> {
  await page.goto('/');

  // Click "Create Account" link to go to registration
  await page.getByText('Create Account').first().click();
  await expect(page.getByText('Join Everyday Food')).toBeVisible({ timeout: 10000 });

  // Fill registration form
  await page.getByPlaceholder('Your name').fill(name);
  await page.getByPlaceholder('you@example.com').fill(email);
  await page.getByPlaceholder('Create a password').fill(password);
  await page.getByPlaceholder('Confirm your password').fill(password);

  // Submit registration
  await page.locator('button:has-text("Create Account"), [role="button"]:has-text("Create Account")').click();

  // Wait for successful registration
  await expect(page.getByText(/hello, chef/i)).toBeVisible({ timeout: 15000 });
}
