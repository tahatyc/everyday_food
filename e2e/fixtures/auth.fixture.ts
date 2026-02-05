import { test as base, Page, BrowserContext } from '@playwright/test';

/**
 * Test user credentials for E2E tests
 */
export const TEST_USER = {
  email: 'test@example.com',
  password: 'Password123!',
  name: 'Test User',
};

/**
 * Extended test fixture with authentication helpers
 */
export const test = base.extend<{
  authenticatedPage: Page;
  authContext: BrowserContext;
}>({
  /**
   * Provides a page that is already authenticated
   */
  authenticatedPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Navigate to login
    await page.goto('/');

    // Perform login
    await page.getByPlaceholder(/email/i).fill(TEST_USER.email);
    await page.getByPlaceholder(/password/i).fill(TEST_USER.password);
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for successful authentication (home page loads)
    await page.waitForURL('**/');
    await page.getByText(/hello, chef/i).waitFor({ state: 'visible', timeout: 10000 });

    await use(page);

    await context.close();
  },

  /**
   * Provides an authenticated browser context
   */
  authContext: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('/');
    await page.getByPlaceholder(/email/i).fill(TEST_USER.email);
    await page.getByPlaceholder(/password/i).fill(TEST_USER.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.getByText(/hello, chef/i).waitFor({ state: 'visible', timeout: 10000 });

    await use(context);

    await context.close();
  },
});

export { expect } from '@playwright/test';

/**
 * Login helper function for use in tests
 */
export async function login(page: Page, email = TEST_USER.email, password = TEST_USER.password) {
  await page.goto('/');
  await page.getByPlaceholder(/email/i).fill(email);
  await page.getByPlaceholder(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.getByText(/hello, chef/i).waitFor({ state: 'visible', timeout: 10000 });
}

/**
 * Logout helper function
 */
export async function logout(page: Page) {
  await page.goto('/profile');
  await page.getByRole('button', { name: /sign out/i }).click();
}

/**
 * Clear all browser state (cookies, storage)
 */
export async function clearState(context: BrowserContext) {
  await context.clearCookies();
  const pages = context.pages();
  for (const page of pages) {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }
}
