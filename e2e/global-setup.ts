import { chromium, FullConfig, Page } from '@playwright/test';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Global Setup for E2E Tests
 *
 * This runs ONCE before all tests to:
 * 1. Check if E2E test user exists
 * 2. If not, register the test user via UI
 * 3. Seed test data via Convex mutation
 *
 * The test user credentials must match auth.fixture.ts
 */

const TEST_USER = {
  email: 'test@example.com',
  password: 'Password123!',
  name: 'Test User',
};

const BASE_URL = process.env.BASE_URL || 'http://localhost:8081';
const CONVEX_URL = process.env.CONVEX_URL || process.env.EXPO_PUBLIC_CONVEX_URL;
const AUTH_DIR = path.join(__dirname, '.auth');

/**
 * Wait for the app to be ready (React Native Web can be slow to hydrate)
 */
async function waitForAppReady(page: Page, timeout = 30000): Promise<void> {
  console.log('[Global Setup] Waiting for app to be ready...');

  // Wait for the page to have meaningful content
  await page.waitForFunction(
    () => document.body && document.body.innerText.length > 0,
    { timeout }
  );

  // Small delay for React hydration
  await page.waitForTimeout(1000);
}

/**
 * Check if we're on the login page
 */
async function isOnLoginPage(page: Page): Promise<boolean> {
  try {
    const loginIndicators = [
      page.getByText('Welcome Back'),
      page.getByText('Sign In'),
      page.getByPlaceholder(/email/i),
    ];

    for (const indicator of loginIndicators) {
      if (await indicator.isVisible({ timeout: 2000 }).catch(() => false)) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Check if we're on the home page (logged in)
 */
async function isOnHomePage(page: Page): Promise<boolean> {
  try {
    return await page.getByText(/hello, chef/i).isVisible({ timeout: 3000 }).catch(() => false);
  } catch {
    return false;
  }
}

/**
 * Fill input field with retry (React Native Web inputs can be tricky)
 * Uses label-based selection which is more reliable for RN Web
 */
async function fillInput(page: Page, placeholder: string, value: string, maxRetries = 3): Promise<void> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // React Native Web can render multiple input elements
      // Use locator that filters for visible elements only
      const input = page.locator(`input[placeholder="${placeholder}"]`).locator('visible=true').first();

      // If that doesn't work, try the standard approach
      let targetInput = input;
      const isVisible = await input.isVisible().catch(() => false);

      if (!isVisible) {
        // Fallback: find by placeholder and scroll into view
        targetInput = page.getByPlaceholder(placeholder).first();
        await targetInput.scrollIntoViewIfNeeded();
        await page.waitForTimeout(300);
      }

      await targetInput.waitFor({ state: 'visible', timeout: 8000 });
      await targetInput.click();

      // Clear any existing value first
      await targetInput.clear();
      await page.waitForTimeout(100);

      // Type the value character by character for RN Web reliability
      await targetInput.pressSequentially(value, { delay: 50 });

      // Verify the value was set
      const actualValue = await targetInput.inputValue();
      if (actualValue === value) {
        console.log(`[Global Setup] Input "${placeholder}" filled successfully`);
        return;
      }

      // If verification failed, try fill() instead
      await targetInput.fill(value);
      const retryValue = await targetInput.inputValue();
      if (retryValue === value) {
        console.log(`[Global Setup] Input "${placeholder}" filled with fill() method`);
        return;
      }

      console.log(`[Global Setup] Input verification failed (got "${actualValue}"), retrying... (${attempt}/${maxRetries})`);
    } catch (error) {
      console.log(`[Global Setup] Input "${placeholder}" attempt ${attempt} failed:`, error);
      if (attempt === maxRetries) throw error;
      await page.waitForTimeout(1000);
    }
  }
}

async function globalSetup(_config: FullConfig) {
  console.log('\n[Global Setup] Starting E2E test setup...');
  console.log(`[Global Setup] Base URL: ${BASE_URL}`);
  console.log(`[Global Setup] Convex URL: ${CONVEX_URL ? 'configured' : 'not configured'}`);

  // Ensure auth directory exists
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
  }

  // Check if user exists via Convex
  let userExists = false;
  if (CONVEX_URL) {
    try {
      const client = new ConvexHttpClient(CONVEX_URL);
      const result = await client.query(api.e2eSeed.checkE2ETestUser);
      userExists = result.exists;
      console.log(`[Global Setup] Test user exists in DB: ${userExists}`);
    } catch (error) {
      console.log('[Global Setup] Could not check Convex directly, will check via UI');
    }
  }

  // Launch browser to register user if needed
  const browser = await chromium.launch();
  const context = await browser.newContext({
    // Use mobile viewport for setup (matches primary target)
    viewport: { width: 393, height: 851 },
    deviceScaleFactor: 2.75,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();

  try {
    // Navigate to the app - use 'domcontentloaded' instead of 'networkidle' for faster, more reliable loading
    console.log(`[Global Setup] Navigating to ${BASE_URL}...`);
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Wait for React Native Web to hydrate
    await waitForAppReady(page);

    // Check current state
    const onLoginPage = await isOnLoginPage(page);
    const onHomePage = await isOnHomePage(page);

    console.log(`[Global Setup] On login page: ${onLoginPage}, On home page: ${onHomePage}`);

    if (onHomePage) {
      console.log('[Global Setup] Already logged in, logging out for clean state...');
      await page.goto(`${BASE_URL}/profile`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);

      const signOutButton = page.getByRole('button', { name: /sign out/i });
      if (await signOutButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await signOutButton.click();
        await page.waitForSelector('text=Welcome Back', { timeout: 10000 });
        console.log('[Global Setup] Logged out successfully');
      }
    }

    if (!userExists) {
      // Need to register the test user
      console.log('[Global Setup] Registering test user...');

      // Make sure we're on login page first
      if (!await isOnLoginPage(page)) {
        await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
        await waitForAppReady(page);
      }

      // Go to registration page
      const createAccountLink = page.getByText('Create Account').first();
      await createAccountLink.waitFor({ state: 'visible', timeout: 10000 });
      await createAccountLink.click();

      // Wait for registration page
      await page.waitForURL('**/register', { timeout: 10000 });

      // Wait for page to fully load and stabilize
      await waitForAppReady(page);

      // Wait for the registration page title (unique to this page)
      const pageTitle = page.getByText('Join Everyday Food');
      await pageTitle.waitFor({ state: 'visible', timeout: 15000 });
      console.log('[Global Setup] Registration page visible');

      // Scroll the page to ensure form is in view
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(500);

      // Fill registration form with retry logic
      console.log('[Global Setup] Filling registration form...');
      await fillInput(page, 'Your name', TEST_USER.name);
      await fillInput(page, 'you@example.com', TEST_USER.email);
      await fillInput(page, 'Create a password', TEST_USER.password);
      await fillInput(page, 'Confirm your password', TEST_USER.password);

      // Submit registration - scroll down to see the button
      console.log('[Global Setup] Submitting registration...');

      // Scroll to bottom to ensure submit button is visible
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);

      // Debug: Log all buttons on the page
      const buttons = await page.locator('[role="button"]').all();
      console.log(`[Global Setup] Found ${buttons.length} buttons on page`);

      // Find submit button by looking for the primary button with "Create Account" text
      // Try multiple selectors
      let submitButton = page.locator('[role="button"]').filter({ hasText: 'Create Account' }).last();
      let isVisible = await submitButton.isVisible().catch(() => false);

      if (!isVisible) {
        // Try finding by the green background (primary button)
        submitButton = page.locator('div[role="button"]').filter({ hasText: 'Create Account' }).last();
        isVisible = await submitButton.isVisible().catch(() => false);
      }

      if (!isVisible) {
        // Last resort: find any clickable element with "Create Account" and click it
        submitButton = page.getByText('Create Account').last();
        isVisible = await submitButton.isVisible().catch(() => false);
      }

      if (!isVisible) {
        // Take a screenshot before failing for debugging
        await page.screenshot({ path: path.join(AUTH_DIR, 'submit-button-debug.png'), fullPage: true });
        const html = await page.content();
        fs.writeFileSync(path.join(AUTH_DIR, 'submit-button-debug.html'), html);
        throw new Error('Could not find Create Account submit button');
      }

      console.log('[Global Setup] Clicking submit button...');
      await submitButton.click();

      // Wait for registration to complete (redirects to home)
      await page.waitForSelector('text=/hello, chef/i', { timeout: 20000 });
      console.log('[Global Setup] Test user registered successfully');

      // Seed test data after registration
      if (CONVEX_URL) {
        try {
          const client = new ConvexHttpClient(CONVEX_URL);
          await client.mutation(api.e2eSeed.seedE2ETestData);
          console.log('[Global Setup] Test data seeded successfully');
        } catch (error) {
          console.log('[Global Setup] Warning: Could not seed test data:', error);
        }
      }

      // Logout so auth-setup can do a clean login
      console.log('[Global Setup] Logging out after registration...');
      await page.goto(`${BASE_URL}/profile`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);

      const signOutButton = page.getByRole('button', { name: /sign out/i });
      if (await signOutButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await signOutButton.click();
        await page.waitForSelector('text=Welcome Back', { timeout: 10000 });
        console.log('[Global Setup] Logged out after registration');
      }
    } else {
      console.log('[Global Setup] Test user already exists, skipping registration');
    }
  } catch (error) {
    console.error('[Global Setup] Error during setup:', error);

    // Take screenshots for debugging
    const timestamp = Date.now();
    await page.screenshot({ path: path.join(AUTH_DIR, `setup-error-${timestamp}.png`), fullPage: true });

    // Log page content for debugging
    const content = await page.content();
    fs.writeFileSync(path.join(AUTH_DIR, `setup-error-${timestamp}.html`), content);

    throw error;
  } finally {
    await browser.close();
  }

  console.log('[Global Setup] Setup complete\n');
}

export default globalSetup;
