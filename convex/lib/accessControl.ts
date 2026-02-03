import { QueryCtx, MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Get the authenticated user ID. Throws if not authenticated.
 */
export async function getCurrentUserId(
  ctx: QueryCtx | MutationCtx
): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Not authenticated");
  }
  return userId;
}

/**
 * Get the authenticated user ID or null if not authenticated.
 */
export async function getCurrentUserIdOrNull(
  ctx: QueryCtx | MutationCtx
): Promise<Id<"users"> | null> {
  return await getAuthUserId(ctx);
}

/**
 * Check if a user can read a recipe.
 * User can read if:
 * - They own the recipe
 * - Recipe is public
 * - Recipe is shared with them
 * - They have a valid share link (handled separately via public.ts)
 */
export async function canReadRecipe(
  ctx: QueryCtx | MutationCtx,
  recipeId: Id<"recipes">,
  userId: Id<"users"> | null
): Promise<boolean> {
  const recipe = await ctx.db.get(recipeId);
  if (!recipe) return false;

  // Global recipes can be read by anyone
  if (recipe.isGlobal === true) {
    return true;
  }

  // Owner can always read
  if (userId && recipe.userId === userId) {
    return true;
  }

  // Public recipes can be read by anyone
  if (recipe.isPublic === true) {
    return true;
  }

  // Check if shared with user
  if (userId) {
    const share = await ctx.db
      .query("recipeShares")
      .withIndex("by_recipe_and_user", (q) =>
        q.eq("recipeId", recipeId).eq("sharedWithId", userId)
      )
      .first();

    if (share) {
      // Check if not expired
      if (!share.expiresAt || share.expiresAt > Date.now()) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Check if a user can modify (edit) a recipe.
 * Only the owner can modify.
 */
export async function canModifyRecipe(
  ctx: QueryCtx | MutationCtx,
  recipeId: Id<"recipes">,
  userId: Id<"users">
): Promise<boolean> {
  const recipe = await ctx.db.get(recipeId);
  if (!recipe) return false;

  // Global recipes cannot be modified by anyone
  if (recipe.isGlobal === true) {
    return false;
  }

  // Only owner can modify personal recipes
  return recipe.userId === userId;
}

/**
 * Check if a user can delete a recipe.
 * Only the owner can delete.
 */
export async function canDeleteRecipe(
  ctx: QueryCtx | MutationCtx,
  recipeId: Id<"recipes">,
  userId: Id<"users">
): Promise<boolean> {
  return canModifyRecipe(ctx, recipeId, userId);
}

/**
 * Get recipe with ownership info
 */
export async function getRecipeWithOwnership(
  ctx: QueryCtx | MutationCtx,
  recipeId: Id<"recipes">,
  currentUserId: Id<"users"> | null
) {
  const recipe = await ctx.db.get(recipeId);
  if (!recipe) return null;

  const isOwner = currentUserId ? recipe.userId === currentUserId : false;
  const owner = recipe.userId ? await ctx.db.get(recipe.userId) : null;

  return {
    ...recipe,
    isOwner,
    ownerName: owner?.name || "Unknown",
  };
}

/**
 * Check if a user owns a cookbook.
 */
export async function canAccessCookbook(
  ctx: QueryCtx | MutationCtx,
  cookbookId: Id<"cookbooks">,
  userId: Id<"users">
): Promise<boolean> {
  const cookbook = await ctx.db.get(cookbookId);
  if (!cookbook) return false;
  return cookbook.userId === userId;
}

/**
 * Check if a user owns a shopping list.
 */
export async function canAccessShoppingList(
  ctx: QueryCtx | MutationCtx,
  listId: Id<"shoppingLists">,
  userId: Id<"users">
): Promise<boolean> {
  const list = await ctx.db.get(listId);
  if (!list) return false;
  return list.userId === userId;
}

/**
 * Check if a user owns a shopping item (via the list).
 */
export async function canAccessShoppingItem(
  ctx: QueryCtx | MutationCtx,
  itemId: Id<"shoppingItems">,
  userId: Id<"users">
): Promise<boolean> {
  const item = await ctx.db.get(itemId);
  if (!item) return false;
  return canAccessShoppingList(ctx, item.listId, userId);
}

/**
 * Check if a user owns a meal plan.
 */
export async function canAccessMealPlan(
  ctx: QueryCtx | MutationCtx,
  mealPlanId: Id<"mealPlans">,
  userId: Id<"users">
): Promise<boolean> {
  const mealPlan = await ctx.db.get(mealPlanId);
  if (!mealPlan) return false;
  return mealPlan.userId === userId;
}
