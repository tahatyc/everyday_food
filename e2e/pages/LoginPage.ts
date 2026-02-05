import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Login Page Object
 * Handles user authentication login flow
 * Source: .maestro/auth/login.yaml
 */
export class LoginPage extends BasePage {
  // Locators
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;
  readonly createAccountLink: Locator;
  readonly appTitle: Locator;
  readonly welcomeText: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.getByPlaceholder('you@example.com');
    this.passwordInput = page.getByPlaceholder('Enter your password');
    this.signInButton = page.getByText('Sign In');
    this.createAccountLink = page.getByText('Create Account');
    this.appTitle = page.getByText('Everyday Food');
    this.welcomeText = page.getByText('Welcome Back');
  }

  /**
   * Navigate to login page
   */
  async goto() {
    await super.goto('/');
  }

  /**
   * Verify login screen is displayed
   */
  async verifyLoginScreen() {
    await expect(this.appTitle).toBeVisible();
    await expect(this.welcomeText).toBeVisible();
    await expect(this.signInButton).toBeVisible();
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
   * Click sign in button
   */
  async clickSignIn() {
    await this.signInButton.click();
  }

  /**
   * Perform complete login flow
   */
  async login(email: string, password: string) {
    await this.enterEmail(email);
    await this.enterPassword(password);
    await this.clickSignIn();
  }

  /**
   * Navigate to registration page
   */
  async goToRegister() {
    await this.createAccountLink.click();
  }

  /**
   * Verify successful login by checking home screen
   */
  async verifyLoginSuccess(timeout = 10000) {
    await expect(this.page.getByText('HELLO, CHEF!')).toBeVisible({ timeout });
  }
}
