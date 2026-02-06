import { test as setup, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Auth Setup Project
 *
 * This is a special Playwright test that runs BEFORE all other tests.
 * It logs in and saves the authentication state to a file that other
 * tests can reuse, avoiding login on every test.
 *
 * Runs for both desktop and mobile setup projects.
 */

const TEST_USER = {
  email: 'test@example.com',
  password: 'Password123!',
};

const AUTH_DIR = path.join(__dirname, '.auth');
const AUTH_FILE = path.join(AUTH_DIR, 'user.json');
const AUTH_FILE_MOBILE = path.join(AUTH_DIR, 'user-mobile.json');

setup('authenticate', async ({ page, browserName }, testInfo) => {
  // Determine if this is a mobile setup based on project name
  const isMobile = testInfo.project.name.includes('mobile');
  const authFile = isMobile ? AUTH_FILE_MOBILE : AUTH_FILE;

  console.log(`[Auth Setup] Starting authentication (${isMobile ? 'mobile' : 'desktop'})...`);
  console.log(`[Auth Setup] Project: ${testInfo.project.name}`);
  console.log(`[Auth Setup] Browser: ${browserName}`);

  // Ensure auth directory exists
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
  }

  // Navigate to login page
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  // Wait for React Native Web to hydrate
  await page.waitForFunction(
    () => document.body && document.body.innerText.length > 0,
    { timeout: 15000 }
  );
  await page.waitForTimeout(1000);

  // Wait for login page to load - use multiple possible selectors
  const loginPageVisible = await Promise.race([
    page.getByText('Welcome Back').waitFor({ state: 'visible', timeout: 15000 }).then(() => true),
    page.getByText('Sign In').waitFor({ state: 'visible', timeout: 15000 }).then(() => true),
  ]).catch(() => false);

  if (!loginPageVisible) {
    // Check if we're already logged in
    const isHome = await page.getByText(/hello, chef/i).isVisible({ timeout: 3000 }).catch(() => false);
    if (isHome) {
      console.log('[Auth Setup] Already logged in, saving state...');
      await page.context().storageState({ path: authFile });
      console.log(`[Auth Setup] Auth state saved to ${authFile}`);
      return;
    }
    throw new Error('Could not find login page or home page');
  }

  // Fill in credentials with retry logic for React Native Web inputs
  const emailInput = page.getByPlaceholder(/you@example\.com|email/i).first();
  const passwordInput = page.getByPlaceholder(/enter your password|password/i).first();

  await emailInput.waitFor({ state: 'visible', timeout: 10000 });
  await emailInput.click();
  await emailInput.fill(TEST_USER.email);

  await passwordInput.waitFor({ state: 'visible', timeout: 10000 });
  await passwordInput.click();
  await passwordInput.fill(TEST_USER.password);

  // Click sign in - React Native Pressable might not have role="button"
  // Use text-based selector as fallback
  let signInButton = page.getByRole('button', { name: /sign in/i });
  let isVisible = await signInButton.isVisible().catch(() => false);

  if (!isVisible) {
    // Try role="button" with text
    signInButton = page.locator('[role="button"]').filter({ hasText: /^sign in$/i });
    isVisible = await signInButton.isVisible().catch(() => false);
  }

  if (!isVisible) {
    // Fallback: find by text content (the button's text child)
    signInButton = page.getByText(/^sign in$/i).first();
    isVisible = await signInButton.isVisible().catch(() => false);
  }

  if (!isVisible) {
    throw new Error('Could not find Sign In button');
  }

  await signInButton.click();

  // Wait for successful login - should see the home screen
  await expect(page.getByText(/hello, chef/i)).toBeVisible({ timeout: 20000 });

  console.log('[Auth Setup] Login successful, saving auth state...');

  // Save signed-in state to file
  await page.context().storageState({ path: authFile });

  // Also save to the other auth file for cross-compatibility
  // This ensures both desktop and mobile tests can run from either setup
  const otherAuthFile = isMobile ? AUTH_FILE : AUTH_FILE_MOBILE;
  await page.context().storageState({ path: otherAuthFile });

  console.log(`[Auth Setup] Auth state saved to ${authFile}`);
  console.log(`[Auth Setup] Auth state also saved to ${otherAuthFile}`);
});
