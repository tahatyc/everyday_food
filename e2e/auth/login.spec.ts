import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { clearState } from '../fixtures/auth.fixture';

/**
 * Login Flow Tests
 * Migrated from: .maestro/auth/login.yaml
 * Tags: auth, smoke
 */
test.describe('Login Flow', () => {
  test.beforeEach(async ({ context }) => {
    // Clear state before each test (equivalent to launchApp: clearState: true)
    await clearState(context);
  });

  test('should display login screen elements', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();

    // Verify login screen elements
    await expect(loginPage.appTitle).toBeVisible();
    await expect(loginPage.welcomeText).toBeVisible();
    await expect(loginPage.signInButton).toBeVisible();
  });

  test('should sign in with valid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();

    // Verify login screen is displayed
    await loginPage.verifyLoginScreen();

    // Enter credentials
    await loginPage.enterEmail('test@example.com');
    await loginPage.enterPassword('Password123!');

    // Submit login
    await loginPage.clickSignIn();

    // Verify navigation to home screen
    await loginPage.verifyLoginSuccess();
  });

  test('should show Create Account link', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();

    // Verify Create Account link is visible
    await expect(loginPage.createAccountLink).toBeVisible();
  });
});
