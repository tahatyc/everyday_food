import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Register Page Object
 * Handles new user registration flow
 * Source: .maestro/auth/register.yaml
 */
export class RegisterPage extends BasePage {
  // Locators
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly createAccountButton: Locator;
  readonly pageTitle: Locator;

  constructor(page: Page) {
    super(page);
    this.nameInput = page.getByPlaceholder('Your name');
    this.emailInput = page.getByPlaceholder('you@example.com');
    this.passwordInput = page.getByPlaceholder('Create a password');
    this.confirmPasswordInput = page.getByPlaceholder('Confirm your password');
    this.createAccountButton = page.getByText('Create Account').nth(1); // Second instance (button)
    this.pageTitle = page.getByText('Join Everyday Food');
  }

  /**
   * Verify register screen is displayed
   */
  async verifyRegisterScreen() {
    await expect(this.pageTitle).toBeVisible();
    await expect(this.createAccountButton).toBeVisible();
  }

  /**
   * Enter name
   */
  async enterName(name: string) {
    await this.nameInput.click();
    await this.nameInput.fill(name);
  }

  /**
   * Enter email address
   */
  async enterEmail(email: string) {
    await this.emailInput.click();
    await this.emailInput.fill(email);
  }

  /**
   * Enter password
   */
  async enterPassword(password: string) {
    await this.passwordInput.click();
    await this.passwordInput.fill(password);
  }

  /**
   * Enter password confirmation
   */
  async enterConfirmPassword(password: string) {
    await this.confirmPasswordInput.click();
    await this.confirmPasswordInput.fill(password);
  }

  /**
   * Click create account button
   */
  async clickCreateAccount() {
    await this.createAccountButton.click();
  }

  /**
   * Perform complete registration flow
   */
  async register(name: string, email: string, password: string) {
    await this.enterName(name);
    await this.enterEmail(email);
    await this.enterPassword(password);
    await this.enterConfirmPassword(password);
    await this.clickCreateAccount();
  }

  /**
   * Verify successful registration by checking home screen
   */
  async verifyRegistrationSuccess(timeout = 10000) {
    await expect(this.page.getByText('HELLO, CHEF!')).toBeVisible({ timeout });
  }
}
