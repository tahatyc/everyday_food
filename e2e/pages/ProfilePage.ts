import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Profile Page Object
 * Handles user profile and settings
 * Source: .maestro/friends/manage-friends.yaml (profile navigation)
 */
export class ProfilePage extends BasePage {
  // Locators
  readonly chefProfileTitle: Locator;
  readonly myFriendsLink: Locator;
  readonly myCookbooksSection: Locator;
  readonly settingsButton: Locator;
  readonly logoutButton: Locator;
  readonly statsSection: Locator;
  readonly recipesCreatedStat: Locator;
  readonly mealsPlannnedStat: Locator;

  constructor(page: Page) {
    super(page);
    this.chefProfileTitle = page.getByText('CHEF PROFILE');
    this.myFriendsLink = page.getByText('MY FRIENDS');
    this.myCookbooksSection = page.getByText('MY COOKBOOKS');
    this.settingsButton = page.getByTestId('icon-settings');
    this.logoutButton = page.getByText('Logout');
    this.statsSection = page.locator('[data-testid="profile-stats"]');
    this.recipesCreatedStat = page.getByText(/recipes created/i);
    this.mealsPlannnedStat = page.getByText(/meals planned/i);
  }

  /**
   * Navigate to profile page
   */
  async goto() {
    await super.goto('/(tabs)/profile');
  }

  /**
   * Verify profile screen is displayed
   */
  async verifyProfileScreen() {
    await expect(this.chefProfileTitle).toBeVisible();
  }

  /**
   * Navigate to My Friends
   */
  async goToMyFriends() {
    await this.myFriendsLink.scrollIntoViewIfNeeded();
    await this.myFriendsLink.click();
  }

  /**
   * Navigate to My Cookbooks
   */
  async goToMyCookbooks() {
    await this.myCookbooksSection.scrollIntoViewIfNeeded();
    await this.myCookbooksSection.click();
  }

  /**
   * Click settings button
   */
  async openSettings() {
    await this.settingsButton.click();
  }

  /**
   * Click logout button
   */
  async logout() {
    await this.logoutButton.scrollIntoViewIfNeeded();
    await this.logoutButton.click();
  }

  /**
   * Verify stats section is visible
   */
  async verifyStatsSection() {
    await expect(this.statsSection).toBeVisible();
  }

  /**
   * Scroll to my friends section
   */
  async scrollToMyFriends() {
    await this.myFriendsLink.scrollIntoViewIfNeeded();
  }

  /**
   * Verify my friends link is visible
   */
  async verifyMyFriendsLinkVisible() {
    await expect(this.myFriendsLink).toBeVisible();
  }

  /**
   * Get user name from profile (if displayed)
   */
  async getUserName(): Promise<string | null> {
    const nameElement = this.page.locator('[data-testid="profile-name"], h1, h2').first();
    return await nameElement.textContent();
  }

  /**
   * Verify user is logged in (profile accessible)
   */
  async verifyLoggedIn() {
    await this.verifyProfileScreen();
  }
}
