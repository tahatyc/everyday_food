import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Meal Plan Page Object
 * Handles weekly meal planning interactions
 * Source: .maestro/meal-plan/add-meal.yaml, generate-plan.yaml
 */
export class MealPlanPage extends BasePage {
  // Locators
  readonly pageTitle: Locator;
  readonly breakfastSlot: Locator;
  readonly lunchSlot: Locator;
  readonly dinnerSlot: Locator;
  readonly addMealButton: Locator;
  readonly generateRandomPlanButton: Locator;
  readonly changeButton: Locator;
  readonly groceryListButton: Locator;
  readonly daySelectorContainer: Locator;

  constructor(page: Page) {
    super(page);
    this.pageTitle = page.getByText('WEEKLY PLANNER');
    this.breakfastSlot = page.getByText('BREAKFAST');
    this.lunchSlot = page.getByText('LUNCH');
    this.dinnerSlot = page.getByText('DINNER');
    this.addMealButton = page.getByText('Add a meal');
    this.generateRandomPlanButton = page.getByText('GENERATE RANDOM PLAN');
    this.changeButton = page.getByText('CHANGE');
    this.groceryListButton = page.getByText('GROCERY LIST');
    this.daySelectorContainer = page.locator('[data-testid="day-selector"]');
  }

  /**
   * Navigate to meal plan page
   */
  async goto() {
    await super.goto('/(tabs)/meal-plan');
  }

  /**
   * Verify meal plan screen is displayed
   */
  async verifyMealPlanScreen(timeout = 5000) {
    await expect(this.pageTitle).toBeVisible({ timeout });
  }

  /**
   * Verify meal slots are visible
   */
  async verifyMealSlots() {
    await expect(this.breakfastSlot).toBeVisible();
    await expect(this.lunchSlot).toBeVisible();
    await expect(this.dinnerSlot).toBeVisible();
  }

  /**
   * Click add meal button (first available)
   */
  async clickAddMeal() {
    await this.addMealButton.first().click();
  }

  /**
   * Click add meal for specific slot
   */
  async clickAddMealForSlot(slot: 'breakfast' | 'lunch' | 'dinner') {
    const slotSection = this.page.locator(`[data-testid="${slot}-slot"]`);
    await slotSection.getByText('Add a meal').click();
  }

  /**
   * Click generate random plan button
   */
  async clickGenerateRandomPlan() {
    await this.generateRandomPlanButton.click();
  }

  /**
   * Verify meals are populated (change button visible)
   */
  async verifyMealsPopulated(timeout = 5000) {
    await expect(this.changeButton).toBeVisible({ timeout });
  }

  /**
   * Navigate to grocery list
   */
  async goToGroceryList() {
    await this.groceryListButton.scrollIntoViewIfNeeded();
    await this.groceryListButton.click();
  }

  /**
   * Select a specific day
   */
  async selectDay(dayName: string) {
    await this.page.getByText(dayName).click();
  }

  /**
   * Get count of "Add a meal" buttons (empty slots)
   */
  async getEmptySlotCount(): Promise<number> {
    return await this.addMealButton.count();
  }

  /**
   * Check if plan has any meals
   */
  async hasMeals(): Promise<boolean> {
    const changeCount = await this.changeButton.count();
    return changeCount > 0;
  }

  /**
   * Click change button for an existing meal
   */
  async clickChangeMeal() {
    await this.changeButton.first().click();
  }
}
