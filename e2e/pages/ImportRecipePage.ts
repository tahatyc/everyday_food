import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Import Recipe Page Object
 * Handles recipe import via URL
 * Source: .maestro/recipes/import-recipe.yaml
 */
export class ImportRecipePage extends BasePage {
  // Locators
  readonly pageTitle: Locator;
  readonly pasteLinkSection: Locator;
  readonly urlLabel: Locator;
  readonly urlInput: Locator;
  readonly importButton: Locator;
  readonly createManuallyButton: Locator;
  readonly syncingIndicator: Locator;

  constructor(page: Page) {
    super(page);
    this.pageTitle = page.getByText('Import & Sync');
    this.pasteLinkSection = page.getByText('PASTE A LINK');
    this.urlLabel = page.getByText('RECIPE URL');
    this.urlInput = page.getByPlaceholder('TikTok, YouTube, or Blog URL...');
    this.importButton = page.getByText('IMPORT RECIPE').last(); // Button, not nav item
    this.createManuallyButton = page.getByText('MANUAL');
    this.syncingIndicator = page.getByText('SYNCING...');
  }

  /**
   * Navigate to import page
   */
  async goto() {
    await super.goto('/import');
  }

  /**
   * Verify import screen is displayed
   */
  async verifyImportScreen() {
    await expect(this.pageTitle).toBeVisible();
    await expect(this.pasteLinkSection).toBeVisible();
    await expect(this.urlLabel).toBeVisible();
  }

  /**
   * Enter recipe URL
   */
  async enterUrl(url: string) {
    await this.urlInput.click();
    await this.urlInput.fill(url);
  }

  /**
   * Click import button
   */
  async clickImport() {
    await this.importButton.click();
  }

  /**
   * Import recipe from URL (complete flow)
   */
  async importRecipe(url: string) {
    await this.enterUrl(url);
    await this.clickImport();
  }

  /**
   * Click create manually to navigate to manual recipe creation
   */
  async clickCreateManually() {
    await this.createManuallyButton.click();
  }

  /**
   * Verify syncing state appears
   */
  async verifySyncingState(timeout = 5000) {
    await expect(this.syncingIndicator).toBeVisible({ timeout });
  }

  /**
   * Wait for import to complete (returns to home screen)
   */
  async waitForImportComplete(timeout = 15000) {
    await expect(this.page.getByText('HELLO, CHEF!')).toBeVisible({ timeout });
  }

  /**
   * Verify URL input is empty
   */
  async verifyUrlInputEmpty() {
    await expect(this.urlInput).toHaveValue('');
  }
}
