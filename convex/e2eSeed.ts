import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * E2E Test Support Mutations
 * These are used by Playwright tests for database seeding and cleanup
 */

// E2E test user credentials (must match e2e/fixtures/auth.fixture.ts)
const E2E_TEST_USER_EMAIL = "test@example.com";

/**
 * Check if E2E test user exists
 */
export const checkE2ETestUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", E2E_TEST_USER_EMAIL))
      .first();

    return {
      exists: !!user,
      userId: user?._id ?? null,
    };
  },
});

/**
 * Clear E2E test user and all associated data
 * This is called during test teardown to ensure clean state
 */
export const clearE2ETestUser = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", E2E_TEST_USER_EMAIL))
      .first();

    if (!user) {
      return { success: true, message: "E2E test user not found, nothing to clean" };
    }

    const userId = user._id;

    // Delete user's recipes and related data
    const recipes = await ctx.db
      .query("recipes")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const recipe of recipes) {
      // Delete recipe tags
      const recipeTags = await ctx.db
        .query("recipeTags")
        .withIndex("by_recipe", (q) => q.eq("recipeId", recipe._id))
        .collect();
      for (const rt of recipeTags) await ctx.db.delete(rt._id);

      // Delete ingredients
      const ingredients = await ctx.db
        .query("ingredients")
        .withIndex("by_recipe", (q) => q.eq("recipeId", recipe._id))
        .collect();
      for (const ing of ingredients) await ctx.db.delete(ing._id);

      // Delete steps
      const steps = await ctx.db
        .query("steps")
        .withIndex("by_recipe", (q) => q.eq("recipeId", recipe._id))
        .collect();
      for (const step of steps) await ctx.db.delete(step._id);

      // Delete cookbook recipes
      const cbRecipes = await ctx.db
        .query("cookbookRecipes")
        .withIndex("by_recipe", (q) => q.eq("recipeId", recipe._id))
        .collect();
      for (const cbr of cbRecipes) await ctx.db.delete(cbr._id);

      // Delete meal plans
      const mealPlans = await ctx.db
        .query("mealPlans")
        .withIndex("by_recipe", (q) => q.eq("recipeId", recipe._id))
        .collect();
      for (const mp of mealPlans) await ctx.db.delete(mp._id);

      // Delete recipe shares
      const recipeShares = await ctx.db
        .query("recipeShares")
        .withIndex("by_recipe", (q) => q.eq("recipeId", recipe._id))
        .collect();
      for (const share of recipeShares) await ctx.db.delete(share._id);

      // Delete share links
      const shareLinks = await ctx.db
        .query("shareLinks")
        .withIndex("by_recipe", (q) => q.eq("recipeId", recipe._id))
        .collect();
      for (const link of shareLinks) {
        // Delete link accesses
        const accesses = await ctx.db
          .query("shareLinkAccesses")
          .withIndex("by_link", (q) => q.eq("shareLinkId", link._id))
          .collect();
        for (const access of accesses) await ctx.db.delete(access._id);
        await ctx.db.delete(link._id);
      }

      // Delete user recipe interactions
      const interactions = await ctx.db
        .query("userRecipeInteractions")
        .withIndex("by_user_and_recipe", (q) =>
          q.eq("userId", userId).eq("recipeId", recipe._id)
        )
        .collect();
      for (const int of interactions) await ctx.db.delete(int._id);

      await ctx.db.delete(recipe._id);
    }

    // Delete user's tags
    const tags = await ctx.db
      .query("tags")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const tag of tags) await ctx.db.delete(tag._id);

    // Delete user's cookbooks
    const cookbooks = await ctx.db
      .query("cookbooks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const cb of cookbooks) {
      // Delete cookbook recipes junction
      const cbRecipes = await ctx.db
        .query("cookbookRecipes")
        .withIndex("by_cookbook", (q) => q.eq("cookbookId", cb._id))
        .collect();
      for (const cbr of cbRecipes) await ctx.db.delete(cbr._id);
      await ctx.db.delete(cb._id);
    }

    // Delete user's shopping lists and items
    const lists = await ctx.db
      .query("shoppingLists")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const list of lists) {
      const items = await ctx.db
        .query("shoppingItems")
        .withIndex("by_list", (q) => q.eq("listId", list._id))
        .collect();
      for (const item of items) await ctx.db.delete(item._id);

      // Delete shopping list recipes
      const listRecipes = await ctx.db
        .query("shoppingListRecipes")
        .withIndex("by_list", (q) => q.eq("listId", list._id))
        .collect();
      for (const lr of listRecipes) await ctx.db.delete(lr._id);

      await ctx.db.delete(list._id);
    }

    // Delete user's meal plans
    const userMealPlans = await ctx.db
      .query("mealPlans")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const mp of userMealPlans) await ctx.db.delete(mp._id);

    // Delete user's friendships (where user initiated)
    const friendships = await ctx.db
      .query("friendships")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const f of friendships) await ctx.db.delete(f._id);

    // Delete friendships where user is the friend (received friend requests)
    const friendshipsAsFriend = await ctx.db
      .query("friendships")
      .withIndex("by_friend", (q) => q.eq("friendId", userId))
      .collect();
    for (const f of friendshipsAsFriend) await ctx.db.delete(f._id);

    // Delete cooking sessions
    const cookingSessions = await ctx.db
      .query("cookingSessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const cs of cookingSessions) await ctx.db.delete(cs._id);

    // Delete import jobs
    const importJobs = await ctx.db
      .query("importJobs")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const ij of importJobs) await ctx.db.delete(ij._id);

    // Delete auth-related tables (authAccounts, authRefreshTokens, authSessions)
    // These are managed by @convex-dev/auth and linked to the user
    // Use filter instead of index since @convex-dev/auth index names may vary
    try {
      // Clean up auth sessions
      const authSessions = await ctx.db
        .query("authSessions")
        .filter((q) => q.eq(q.field("userId"), userId))
        .collect();
      for (const session of authSessions) {
        // Clean up refresh tokens for this session
        try {
          const tokens = await ctx.db
            .query("authRefreshTokens")
            .filter((q) => q.eq(q.field("sessionId"), session._id))
            .collect();
          for (const token of tokens) await ctx.db.delete(token._id);
        } catch {
          // Refresh tokens table might not exist or have different structure
        }
        await ctx.db.delete(session._id);
      }

      // Clean up auth accounts
      const authAccounts = await ctx.db
        .query("authAccounts")
        .filter((q) => q.eq(q.field("userId"), userId))
        .collect();
      for (const account of authAccounts) await ctx.db.delete(account._id);
    } catch (error) {
      // Auth tables cleanup failed, but we can still delete the user
      console.log("Warning: Could not fully clean auth tables:", error);
    }

    // Finally delete the user
    await ctx.db.delete(userId);

    return { success: true, message: `Cleared E2E test user and all associated data` };
  },
});

/**
 * Seed sample data for E2E test user
 * Called after registration to populate test data
 */
export const seedE2ETestData = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", E2E_TEST_USER_EMAIL))
      .first();

    if (!user) {
      return { success: false, message: "E2E test user not found" };
    }

    const userId = user._id;
    const now = Date.now();

    // Create a default cookbook
    const existingCookbook = await ctx.db
      .query("cookbooks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!existingCookbook) {
      await ctx.db.insert("cookbooks", {
        userId,
        name: "Favorites",
        description: "My favorite recipes",
        color: "#FF6B6B",
        isDefault: true,
        sortOrder: 0,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Create a sample recipe for testing
    const existingRecipe = await ctx.db
      .query("recipes")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!existingRecipe) {
      const recipeId = await ctx.db.insert("recipes", {
        userId,
        title: "E2E Test Recipe",
        description: "A simple recipe for E2E testing",
        prepTime: 10,
        cookTime: 20,
        totalTime: 30,
        servings: 4,
        difficulty: "easy",
        cuisine: "American",
        sourceType: "manual",
        isFavorite: false,
        cookCount: 0,
        createdAt: now,
        updatedAt: now,
      });

      // Add ingredients
      await ctx.db.insert("ingredients", {
        recipeId,
        name: "Test Ingredient 1",
        amount: 2,
        unit: "cups",
        sortOrder: 0,
        isOptional: false,
      });

      await ctx.db.insert("ingredients", {
        recipeId,
        name: "Test Ingredient 2",
        amount: 1,
        unit: "tbsp",
        sortOrder: 1,
        isOptional: false,
      });

      // Add steps
      await ctx.db.insert("steps", {
        recipeId,
        stepNumber: 1,
        instruction: "First test step instruction",
      });

      await ctx.db.insert("steps", {
        recipeId,
        stepNumber: 2,
        instruction: "Second test step instruction",
      });
    }

    return { success: true, message: "E2E test data seeded successfully" };
  },
});
