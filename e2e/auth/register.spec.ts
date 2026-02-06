import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { clearState } from '../fixtures/auth.fixture';

/**
 * Registration Flow Tests
 * Migrated from: .maestro/auth/register.yaml
 * Tags: auth, smoke
 */
test.describe('Registration Flow', () => {
  test.beforeEach(async ({ context }) => {
    // Clear state before each test (equivalent to launchApp: clearState: true)
    await clearState(context);
  });

  test('should navigate to register screen and display elements', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const registerPage = new RegisterPage(page);

    await loginPage.goto();

    // Navigate to register screen
    await loginPage.goToRegister();

    // Verify register screen elements
    await registerPage.verifyRegisterScreen();
  });

  test('should create new account with valid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const registerPage = new RegisterPage(page);

    await loginPage.goto();

    // Navigate to register screen
    await loginPage.goToRegister();

    // Verify register screen is displayed
    await expect(registerPage.pageTitle).toBeVisible();
    await expect(registerPage.createAccountButton).toBeVisible();

    // Fill in registration form
    await registerPage.enterName('Test User');
    await registerPage.enterEmail('newuser@example.com');
    await registerPage.enterPassword('SecurePass123!');
    await registerPage.enterConfirmPassword('SecurePass123!');

    // Submit registration (button at index 1)
    await registerPage.clickCreateAccount();

    // Verify navigation to home screen after successful registration
    await registerPage.verifyRegistrationSuccess(10000);
  });

  test('should display all form fields on register screen', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const registerPage = new RegisterPage(page);

    await loginPage.goto();
    await loginPage.goToRegister();

    // Wait for register page to be fully loaded (login page hidden)
    await registerPage.waitForRegisterPageReady();

    // Verify all form fields are visible
    await expect(registerPage.nameInput).toBeVisible();
    await expect(registerPage.emailInput).toBeVisible();
    await expect(registerPage.passwordInput).toBeVisible();
    await expect(registerPage.confirmPasswordInput).toBeVisible();
  });
});
