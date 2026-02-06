import { Page, Locator, expect } from '@playwright/test';

/**
 * Base Page Object class with common actions and utilities
 * All page objects should extend this class
 *
 * Optimized for React Native Web with mobile-first approach
 */
export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Check if current context is mobile
   */
  get isMobile(): boolean {
    const viewport = this.page.viewportSize();
    return viewport ? viewport.width < 768 : false;
  }

  /**
   * Navigate to a specific URL
   */
  async goto(path: string = '/') {
    await this.page.goto(path, { waitUntil: 'domcontentloaded' });
    // Wait for React Native Web hydration
    await this.waitForHydration();
  }

  /**
   * Wait for React Native Web to hydrate
   */
  async waitForHydration(timeout = 5000) {
    await this.page.waitForFunction(
      () => document.body && document.body.innerText.length > 0,
      { timeout }
    );
    // Small delay for React to settle
    await this.page.waitForTimeout(500);
  }

  /**
   * Wait for page to be fully loaded
   * Uses domcontentloaded instead of networkidle for better SPA support
   */
  async waitForLoad() {
    await this.page.waitForLoadState('domcontentloaded');
    await this.waitForHydration();
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
   * Uses touch gestures on mobile, keyboard on desktop
   */
  async swipeLeft() {
    if (this.isMobile) {
      const viewport = this.page.viewportSize();
      if (viewport) {
        const startX = viewport.width * 0.8;
        const endX = viewport.width * 0.2;
        const y = viewport.height / 2;

        await this.page.touchscreen.tap(startX, y);
        await this.page.mouse.move(startX, y);
        await this.page.mouse.down();
        await this.page.mouse.move(endX, y, { steps: 10 });
        await this.page.mouse.up();
      }
    } else {
      await this.page.keyboard.press('ArrowRight');
    }
  }

  /**
   * Simulate swipe right
   * Uses touch gestures on mobile, keyboard on desktop
   */
  async swipeRight() {
    if (this.isMobile) {
      const viewport = this.page.viewportSize();
      if (viewport) {
        const startX = viewport.width * 0.2;
        const endX = viewport.width * 0.8;
        const y = viewport.height / 2;

        await this.page.touchscreen.tap(startX, y);
        await this.page.mouse.move(startX, y);
        await this.page.mouse.down();
        await this.page.mouse.move(endX, y, { steps: 10 });
        await this.page.mouse.up();
      }
    } else {
      await this.page.keyboard.press('ArrowLeft');
    }
  }

  /**
   * Tap on coordinates (for mobile touch)
   */
  async tap(x: number, y: number) {
    if (this.isMobile) {
      await this.page.touchscreen.tap(x, y);
    } else {
      await this.page.mouse.click(x, y);
    }
  }

  /**
   * Long press on element (for mobile context menus)
   */
  async longPress(locator: Locator, duration = 500) {
    const box = await locator.boundingBox();
    if (box) {
      const x = box.x + box.width / 2;
      const y = box.y + box.height / 2;

      await this.page.mouse.move(x, y);
      await this.page.mouse.down();
      await this.page.waitForTimeout(duration);
      await this.page.mouse.up();
    }
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
