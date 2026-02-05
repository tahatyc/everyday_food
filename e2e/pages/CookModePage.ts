import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Cook Mode Page Object
 * Handles step-by-step cooking walkthrough
 * Source: .maestro/cook-mode/walkthrough.yaml
 */
export class CookModePage extends BasePage {
  // Locators
  readonly currentStepText: Locator;
  readonly stepContent: Locator;
  readonly previousButton: Locator;
  readonly nextButton: Locator;
  readonly finishButton: Locator;
  readonly stepIndicator: Locator;
  readonly closeButton: Locator;

  constructor(page: Page) {
    super(page);
    this.currentStepText = page.locator('[data-testid="current-step"]');
    this.stepContent = page.locator('[data-testid="step-content"]');
    this.previousButton = page.getByText('Previous');
    this.nextButton = page.getByText('Next');
    this.finishButton = page.getByText('Finish');
    this.stepIndicator = page.locator('[data-testid="step-indicator"]');
    this.closeButton = page.getByTestId('icon-close');
  }

  /**
   * Navigate to cook mode for a specific recipe
   */
  async goto(recipeId: string) {
    await super.goto(`/cook-mode/${recipeId}`);
  }

  /**
   * Verify cook mode screen is displayed
   */
  async verifyCookModeScreen() {
    await expect(this.page.getByText(/Step \d+/)).toBeVisible();
  }

  /**
   * Verify specific step is displayed
   */
  async verifyStep(stepNumber: number) {
    await expect(this.page.getByText(`Step ${stepNumber}`)).toBeVisible();
  }

  /**
   * Navigate to next step (swipe left on mobile, click/keyboard on web)
   */
  async goToNextStep() {
    // On web, we use keyboard navigation as fallback for swipe
    await this.swipeLeft();
  }

  /**
   * Navigate to previous step (swipe right on mobile, click/keyboard on web)
   */
  async goToPreviousStep() {
    // On web, we use keyboard navigation as fallback for swipe
    await this.swipeRight();
  }

  /**
   * Click next button if available
   */
  async clickNext() {
    await this.nextButton.click();
  }

  /**
   * Click previous button if available
   */
  async clickPrevious() {
    await this.previousButton.click();
  }

  /**
   * Check if on first step
   */
  async isOnFirstStep(): Promise<boolean> {
    try {
      await this.page.getByText('Step 1').waitFor({ state: 'visible', timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if finish button is visible (last step)
   */
  async isOnLastStep(): Promise<boolean> {
    try {
      await this.finishButton.waitFor({ state: 'visible', timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Click finish to complete cooking
   */
  async clickFinish() {
    await this.finishButton.click();
  }

  /**
   * Close cook mode
   */
  async closeCookMode() {
    await this.closeButton.click();
  }

  /**
   * Get current step number from display
   */
  async getCurrentStepNumber(): Promise<number | null> {
    const stepText = await this.page.getByText(/Step \d+/).textContent();
    if (stepText) {
      const match = stepText.match(/Step (\d+)/);
      return match ? parseInt(match[1], 10) : null;
    }
    return null;
  }

  /**
   * Navigate through all steps to completion
   */
  async completeAllSteps() {
    while (!(await this.isOnLastStep())) {
      await this.goToNextStep();
      await this.waitForAnimation();
    }
  }

  /**
   * Walk through steps (complete flow)
   */
  async walkthrough() {
    await this.verifyCookModeScreen();
    await this.verifyStep(1);

    // Navigate forward
    await this.goToNextStep();
    await this.verifyStep(2);

    // Navigate back
    await this.goToPreviousStep();
    await this.verifyStep(1);

    // Navigate forward again
    await this.goToNextStep();
    await this.verifyStep(2);
  }
}
