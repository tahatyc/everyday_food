import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Friends Page Object
 * Handles friend management and search
 * Source: .maestro/friends/manage-friends.yaml
 */
export class FriendsPage extends BasePage {
  // Locators
  readonly pageTitle: Locator;
  readonly findFriendsSection: Locator;
  readonly searchInput: Locator;
  readonly clearSearchButton: Locator;
  readonly myFriendsSection: Locator;
  readonly friendsList: Locator;
  readonly pendingRequestsSection: Locator;
  readonly noResultsText: Locator;

  constructor(page: Page) {
    super(page);
    this.pageTitle = page.getByText('FRIENDS');
    this.findFriendsSection = page.getByText('FIND FRIENDS');
    this.searchInput = page.getByPlaceholder('Search by name or email...');
    this.clearSearchButton = page.getByTestId('icon-close-circle');
    this.myFriendsSection = page.getByText('MY FRIENDS');
    this.friendsList = page.locator('[data-testid^="friend-item"]');
    this.pendingRequestsSection = page.getByText('PENDING REQUESTS');
    this.noResultsText = page.getByText('No results found');
  }

  /**
   * Navigate to friends page
   */
  async goto() {
    await super.goto('/friends');
  }

  /**
   * Verify friends screen is displayed
   */
  async verifyFriendsScreen() {
    await expect(this.pageTitle).toBeVisible();
    await expect(this.findFriendsSection).toBeVisible();
  }

  /**
   * Search for a friend
   */
  async searchFriend(query: string) {
    await this.searchInput.click();
    await this.searchInput.fill(query);
  }

  /**
   * Clear search input
   */
  async clearSearch() {
    await this.clearSearchButton.click();
  }

  /**
   * Wait for search results to load
   */
  async waitForSearchResults() {
    await this.waitForAnimation();
  }

  /**
   * Verify my friends section is visible
   */
  async verifyMyFriendsSection() {
    await expect(this.myFriendsSection).toBeVisible();
  }

  /**
   * Get count of friends in list
   */
  async getFriendsCount(): Promise<number> {
    return await this.friendsList.count();
  }

  /**
   * Click on a friend at specific index
   */
  async clickFriendAtIndex(index: number) {
    await this.friendsList.nth(index).click();
  }

  /**
   * Send friend request to user at index
   */
  async sendFriendRequest(index: number) {
    const friendItem = this.friendsList.nth(index);
    await friendItem.getByText('Add').click();
  }

  /**
   * Verify pending requests section
   */
  async verifyPendingRequestsSection() {
    await expect(this.pendingRequestsSection).toBeVisible();
  }

  /**
   * Check if no results found
   */
  async hasNoResults(): Promise<boolean> {
    try {
      await this.noResultsText.waitFor({ state: 'visible', timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Scroll to friends list
   */
  async scrollToFriendsList() {
    await this.myFriendsSection.scrollIntoViewIfNeeded();
  }
}
