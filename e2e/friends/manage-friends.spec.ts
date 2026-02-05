import { test, expect } from '../fixtures/auth.fixture';
import { HomePage } from '../pages/HomePage';
import { ProfilePage } from '../pages/ProfilePage';
import { FriendsPage } from '../pages/FriendsPage';

/**
 * Manage Friends Tests
 * Migrated from: .maestro/friends/manage-friends.yaml
 * Tags: everyday-food, friends, social
 */
test.describe('Manage Friends', () => {
  test('should navigate to friends screen and search for friends', async ({ authenticatedPage: page }) => {
    const homePage = new HomePage(page);
    const profilePage = new ProfilePage(page);
    const friendsPage = new FriendsPage(page);

    // Navigate to friends screen
    await homePage.verifyHomeScreen(10000);
    await homePage.goToProfile();
    await profilePage.verifyProfileScreen();

    // Go to friends section
    await profilePage.scrollToMyFriends();
    await profilePage.goToMyFriends();

    // Verify friends screen
    await friendsPage.verifyFriendsScreen();

    // Search for a friend
    await friendsPage.searchFriend('test');

    // Wait for search results
    await friendsPage.waitForSearchResults();

    // Clear search
    await friendsPage.clearSearch();

    // Verify friends list section
    await friendsPage.verifyMyFriendsSection();
  });

  test('should display Find Friends section', async ({ authenticatedPage: page }) => {
    const homePage = new HomePage(page);
    const profilePage = new ProfilePage(page);
    const friendsPage = new FriendsPage(page);

    await homePage.verifyHomeScreen(10000);
    await homePage.goToProfile();
    await profilePage.verifyProfileScreen();
    await profilePage.scrollToMyFriends();
    await profilePage.goToMyFriends();

    // Verify Find Friends section is visible
    await expect(friendsPage.findFriendsSection).toBeVisible();
  });

  test('should have search input for finding friends', async ({ authenticatedPage: page }) => {
    const homePage = new HomePage(page);
    const profilePage = new ProfilePage(page);
    const friendsPage = new FriendsPage(page);

    await homePage.verifyHomeScreen(10000);
    await homePage.goToProfile();
    await profilePage.verifyProfileScreen();
    await profilePage.scrollToMyFriends();
    await profilePage.goToMyFriends();
    await friendsPage.verifyFriendsScreen();

    // Verify search input is visible
    await expect(friendsPage.searchInput).toBeVisible();
  });

  test('should clear search input', async ({ authenticatedPage: page }) => {
    const homePage = new HomePage(page);
    const profilePage = new ProfilePage(page);
    const friendsPage = new FriendsPage(page);

    await homePage.verifyHomeScreen(10000);
    await homePage.goToProfile();
    await profilePage.verifyProfileScreen();
    await profilePage.scrollToMyFriends();
    await profilePage.goToMyFriends();
    await friendsPage.verifyFriendsScreen();

    // Search for something
    await friendsPage.searchFriend('test user');
    await friendsPage.waitForSearchResults();

    // Clear search
    await friendsPage.clearSearch();

    // Verify search is cleared (input should be empty)
    await expect(friendsPage.searchInput).toHaveValue('');
  });

  test('should display My Friends section', async ({ authenticatedPage: page }) => {
    const homePage = new HomePage(page);
    const profilePage = new ProfilePage(page);
    const friendsPage = new FriendsPage(page);

    await homePage.verifyHomeScreen(10000);
    await homePage.goToProfile();
    await profilePage.verifyProfileScreen();
    await profilePage.scrollToMyFriends();
    await profilePage.goToMyFriends();
    await friendsPage.verifyFriendsScreen();

    // Verify My Friends section
    await friendsPage.verifyMyFriendsSection();
  });
});
