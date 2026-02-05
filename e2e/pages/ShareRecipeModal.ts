import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Share Recipe Modal Page Object
 * Handles recipe sharing via friends or shareable links
 * Source: .maestro/recipes/share-recipe.yaml
 */
export class ShareRecipeModal extends BasePage {
  // Locators
  readonly modalTitle: Locator;
  readonly friendsTab: Locator;
  readonly linkTab: Locator;
  readonly shareWithFriendsText: Locator;
  readonly createShareableLinkText: Locator;
  readonly linkInfoText: Locator;
  readonly createNewLinkButton: Locator;
  readonly linkCreatedText: Locator;
  readonly okButton: Locator;
  readonly activeLinksSection: Locator;
  readonly closeButton: Locator;
  readonly friendsList: Locator;

  constructor(page: Page) {
    super(page);
    this.modalTitle = page.getByText('SHARE RECIPE');
    this.friendsTab = page.getByText('FRIENDS');
    this.linkTab = page.getByText('LINK');
    this.shareWithFriendsText = page.getByText('Share with friends');
    this.createShareableLinkText = page.getByText('Create shareable link');
    this.linkInfoText = page.getByText('Anyone with the link can view this recipe');
    this.createNewLinkButton = page.getByText('CREATE NEW LINK');
    this.linkCreatedText = page.getByText('Link Created');
    this.okButton = page.getByText('OK');
    this.activeLinksSection = page.getByText('Active links');
    this.closeButton = page.getByTestId('icon-close');
    this.friendsList = page.locator('[data-testid^="friend-item"]');
  }

  /**
   * Verify share modal is displayed
   */
  async verifyModalVisible() {
    await expect(this.modalTitle).toBeVisible();
  }

  /**
   * Verify friends tab is active/visible
   */
  async verifyFriendsTab() {
    await expect(this.friendsTab).toBeVisible();
    await expect(this.shareWithFriendsText).toBeVisible();
  }

  /**
   * Switch to Link tab
   */
  async switchToLinkTab() {
    await this.linkTab.click();
  }

  /**
   * Switch to Friends tab
   */
  async switchToFriendsTab() {
    await this.friendsTab.click();
  }

  /**
   * Verify link tab content
   */
  async verifyLinkTabContent() {
    await expect(this.createShareableLinkText).toBeVisible();
    await expect(this.linkInfoText).toBeVisible();
  }

  /**
   * Create a new shareable link
   */
  async createNewLink() {
    await this.createNewLinkButton.click();
  }

  /**
   * Verify link was created
   */
  async verifyLinkCreated() {
    await expect(this.linkCreatedText).toBeVisible();
  }

  /**
   * Dismiss link created confirmation
   */
  async dismissLinkCreatedConfirmation() {
    await this.okButton.click();
  }

  /**
   * Verify active links section is displayed
   */
  async verifyActiveLinksVisible() {
    await expect(this.activeLinksSection).toBeVisible();
  }

  /**
   * Close the share modal
   */
  async closeModal() {
    await this.closeButton.click();
  }

  /**
   * Create shareable link flow (complete)
   */
  async createShareableLinkFlow() {
    await this.switchToLinkTab();
    await this.verifyLinkTabContent();
    await this.createNewLink();
    await this.verifyLinkCreated();
    await this.dismissLinkCreatedConfirmation();
    await this.verifyActiveLinksVisible();
  }

  /**
   * Select a friend to share with (by index)
   */
  async selectFriendAtIndex(index: number) {
    await this.friendsList.nth(index).click();
  }

  /**
   * Get count of available friends
   */
  async getFriendsCount(): Promise<number> {
    return await this.friendsList.count();
  }
}
