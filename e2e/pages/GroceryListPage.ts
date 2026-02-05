import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Grocery List Page Object
 * Handles shopping list interactions
 * Source: .maestro/grocery-list/view-grocery.yaml, generate-list.yaml
 */
export class GroceryListPage extends BasePage {
  // Locators
  readonly pageTitle: Locator;
  readonly smartGroceryTitle: Locator;
  readonly shoppingListTitle: Locator;
  readonly progressText: Locator;
  readonly aisleViewButton: Locator;
  readonly recipeViewButton: Locator;
  readonly checkoutButton: Locator;
  readonly addItemButton: Locator;
  readonly addItemInput: Locator;
  readonly addButton: Locator;
  readonly groceryItems: Locator;

  constructor(page: Page) {
    super(page);
    this.pageTitle = page.getByText('SMART GROCERY LIST');
    this.smartGroceryTitle = page.getByText('SMART GROCERY LIST');
    this.shoppingListTitle = page.getByText('Shopping List');
    this.progressText = page.getByText('Progress');
    this.aisleViewButton = page.getByText('AISLE');
    this.recipeViewButton = page.getByText('RECIPE');
    this.checkoutButton = page.getByText('CHECKOUT / ORDER LIST');
    this.addItemButton = page.getByTestId('icon-add');
    this.addItemInput = page.getByPlaceholder('Add item...');
    this.addButton = page.getByText('Add').last();
    this.groceryItems = page.locator('[data-testid^="grocery-item"]');
  }

  /**
   * Navigate to grocery list page
   */
  async goto() {
    await super.goto('/grocery-list');
  }

  /**
   * Verify grocery list screen is displayed
   */
  async verifyGroceryListScreen(timeout = 5000) {
    await expect(this.pageTitle).toBeVisible({ timeout });
  }

  /**
   * Verify shopping list screen (alternative title)
   */
  async verifyShoppingListScreen() {
    await expect(this.shoppingListTitle).toBeVisible();
    await expect(this.progressText).toBeVisible();
  }

  /**
   * Verify view toggle buttons
   */
  async verifyViewToggleButtons() {
    await expect(this.aisleViewButton).toBeVisible();
    await expect(this.recipeViewButton).toBeVisible();
  }

  /**
   * Switch to aisle view
   */
  async switchToAisleView() {
    await this.aisleViewButton.click();
  }

  /**
   * Switch to recipe view
   */
  async switchToRecipeView() {
    await this.recipeViewButton.click();
  }

  /**
   * Verify checkout button is visible
   */
  async verifyCheckoutButtonVisible() {
    await expect(this.checkoutButton).toBeVisible();
  }

  /**
   * Click add item button
   */
  async clickAddItem() {
    await this.addItemButton.click();
  }

  /**
   * Add an item manually
   */
  async addItem(itemName: string) {
    await this.addItemInput.click();
    await this.addItemInput.fill(itemName);
    await this.addButton.click();
  }

  /**
   * Verify item is in the list
   */
  async verifyItemInList(itemName: string) {
    await expect(this.page.getByText(itemName)).toBeVisible();
  }

  /**
   * Toggle an item (check/uncheck)
   */
  async toggleItem(itemName: string) {
    await this.page.getByText(itemName).click();
  }

  /**
   * Click checkout button
   */
  async clickCheckout() {
    await this.checkoutButton.click();
  }

  /**
   * Get count of grocery items
   */
  async getItemCount(): Promise<number> {
    return await this.groceryItems.count();
  }

  /**
   * Go back to previous screen
   */
  async goBack() {
    await super.goBack();
  }

  /**
   * Verify return to meal plan
   */
  async verifyReturnToMealPlan(timeout = 5000) {
    await expect(this.page.getByText('WEEKLY PLANNER')).toBeVisible({ timeout });
  }
}
