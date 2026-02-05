import { test, expect } from '../fixtures/auth.fixture';
import { HomePage } from '../pages/HomePage';
import { RecipesPage } from '../pages/RecipesPage';
import { RecipeDetailPage } from '../pages/RecipeDetailPage';
import { ShareRecipeModal } from '../pages/ShareRecipeModal';

/**
 * Share Recipe Flow Tests
 * Migrated from: .maestro/recipes/share-recipe.yaml
 * Tags: everyday-food, recipes, sharing
 */
test.describe('Share Recipe with Friends', () => {
  test('should open share modal and create shareable link', async ({ authenticatedPage: page }) => {
    const homePage = new HomePage(page);
    const recipesPage = new RecipesPage(page);
    const recipeDetailPage = new RecipeDetailPage(page);
    const shareModal = new ShareRecipeModal(page);

    // Navigate to a recipe
    await homePage.verifyHomeScreen(10000);
    await homePage.goToRecipes();
    await recipesPage.verifyRecipesScreen(5000);

    // Click first recipe
    const recipeCount = await recipesPage.getRecipeCount();
    if (recipeCount === 0) {
      test.skip();
      return;
    }
    await recipesPage.clickFirstRecipe();

    // Verify on recipe detail page
    await recipeDetailPage.verifyRecipeDetailScreen();

    // Open share modal
    await recipeDetailPage.clickShare();
    await shareModal.verifyModalVisible();

    // Test Friends tab
    await shareModal.verifyFriendsTab();

    // Switch to Link tab
    await shareModal.switchToLinkTab();
    await shareModal.verifyLinkTabContent();

    // Create a share link
    await shareModal.createNewLink();
    await shareModal.verifyLinkCreated();
    await shareModal.dismissLinkCreatedConfirmation();

    // Verify link was created
    await shareModal.verifyActiveLinksVisible();

    // Close the modal
    await shareModal.closeModal();
  });

  test('should display Friends tab in share modal', async ({ authenticatedPage: page }) => {
    const homePage = new HomePage(page);
    const recipesPage = new RecipesPage(page);
    const recipeDetailPage = new RecipeDetailPage(page);
    const shareModal = new ShareRecipeModal(page);

    await homePage.verifyHomeScreen(10000);
    await homePage.goToRecipes();
    await recipesPage.verifyRecipesScreen(5000);

    const recipeCount = await recipesPage.getRecipeCount();
    if (recipeCount === 0) {
      test.skip();
      return;
    }
    await recipesPage.clickFirstRecipe();

    await recipeDetailPage.verifyRecipeDetailScreen();
    await recipeDetailPage.clickShare();

    // Verify Friends tab is visible
    await expect(shareModal.friendsTab).toBeVisible();
    await expect(shareModal.shareWithFriendsText).toBeVisible();
  });

  test('should switch between Friends and Link tabs', async ({ authenticatedPage: page }) => {
    const homePage = new HomePage(page);
    const recipesPage = new RecipesPage(page);
    const recipeDetailPage = new RecipeDetailPage(page);
    const shareModal = new ShareRecipeModal(page);

    await homePage.verifyHomeScreen(10000);
    await homePage.goToRecipes();
    await recipesPage.verifyRecipesScreen(5000);

    const recipeCount = await recipesPage.getRecipeCount();
    if (recipeCount === 0) {
      test.skip();
      return;
    }
    await recipesPage.clickFirstRecipe();

    await recipeDetailPage.verifyRecipeDetailScreen();
    await recipeDetailPage.clickShare();
    await shareModal.verifyModalVisible();

    // Switch to Link tab
    await shareModal.switchToLinkTab();
    await expect(shareModal.createShareableLinkText).toBeVisible();

    // Switch back to Friends tab
    await shareModal.switchToFriendsTab();
    await expect(shareModal.shareWithFriendsText).toBeVisible();
  });
});
