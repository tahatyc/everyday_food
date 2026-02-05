import { Page, Locator, expect } from '@playwright/test';

/**
 * Base Page Object class with common actions and utilities
 * All page objects should extend this class
 */
export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to a specific URL
   */
  async goto(path: string = '/') {
    await this.page.goto(path);
  }

  /**
   * Wait for page to be fully loaded
   */
  async waitForLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get element by test ID
   */
  getByTestId(testId: string): Locator {
    return this.page.getByTestId(testId);
  }

  /**
   * Get element by text content
   */
  getByText(text: string | RegExp): Locator {
    return this.page.getByText(text);
  }

  /**
   * Get element by role
   */
  getByRole(role: Parameters<Page['getByRole']>[0], options?: Parameters<Page['getByRole']>[1]): Locator {
    return this.page.getByRole(role, options);
  }

  /**
   * Get element by placeholder
   */
  getByPlaceholder(placeholder: string | RegExp): Locator {
    return this.page.getByPlaceholder(placeholder);
  }

  /**
   * Click on element with text
   */
  async clickText(text: string | RegExp) {
    await this.page.getByText(text).click();
  }

  /**
   * Click on element by test ID
   */
  async clickTestId(testId: string) {
    await this.page.getByTestId(testId).click();
  }

  /**
   * Fill input by placeholder
   */
  async fillByPlaceholder(placeholder: string | RegExp, value: string) {
    await this.page.getByPlaceholder(placeholder).fill(value);
  }

  /**
   * Assert element with text is visible
   */
  async assertVisible(text: string | RegExp, timeout?: number) {
    await expect(this.page.getByText(text)).toBeVisible({ timeout });
  }

  /**
   * Assert element with text is not visible
   */
  async assertNotVisible(text: string | RegExp, timeout?: number) {
    await expect(this.page.getByText(text)).not.toBeVisible({ timeout });
  }

  /**
   * Assert element by test ID is visible
   */
  async assertTestIdVisible(testId: string, timeout?: number) {
    await expect(this.page.getByTestId(testId)).toBeVisible({ timeout });
  }

  /**
   * Wait for element to be visible
   */
  async waitForText(text: string | RegExp, timeout?: number) {
    await this.page.getByText(text).waitFor({ state: 'visible', timeout });
  }

  /**
   * Scroll element into view
   */
  async scrollIntoView(locator: Locator) {
    await locator.scrollIntoViewIfNeeded();
  }

  /**
   * Scroll to text element
   */
  async scrollToText(text: string | RegExp) {
    const element = this.page.getByText(text);
    await element.scrollIntoViewIfNeeded();
  }

  /**
   * Take a screenshot
   */
  async screenshot(name: string) {
    await this.page.screenshot({ path: `./e2e/screenshots/${name}.png` });
  }

  /**
   * Wait for navigation to complete
   */
  async waitForNavigation() {
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Go back to previous page
   */
  async goBack() {
    await this.page.goBack();
  }

  /**
   * Simulate swipe left (for cook mode, etc.)
   * Falls back to keyboard navigation on web
   */
  async swipeLeft() {
    await this.page.keyboard.press('ArrowRight');
  }

  /**
   * Simulate swipe right
   * Falls back to keyboard navigation on web
   */
  async swipeRight() {
    await this.page.keyboard.press('ArrowLeft');
  }

  /**
   * Wait for animation to complete
   */
  async waitForAnimation(duration = 300) {
    await this.page.waitForTimeout(duration);
  }

  /**
   * Clear input field
   */
  async clearInput(locator: Locator) {
    await locator.clear();
  }

  /**
   * Get current URL
   */
  getCurrentUrl(): string {
    return this.page.url();
  }

  /**
   * Assert current URL matches pattern
   */
  async assertUrl(pattern: string | RegExp) {
    await expect(this.page).toHaveURL(pattern);
  }
}
