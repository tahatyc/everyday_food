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
