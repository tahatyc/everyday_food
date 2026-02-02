import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUserId, getCurrentUserIdOrNull } from "./lib/accessControl";

// Get users a recipe is shared with (owner only)
export const getSharedWith = query({
  args: { recipeId: v.id("recipes") },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserIdOrNull(ctx);
    if (!userId) return [];

    // Verify ownership
    const recipe = await ctx.db.get(args.recipeId);
    if (!recipe || recipe.userId !== userId) {
      return [];
    }

    const shares = await ctx.db
      .query("recipeShares")
      .withIndex("by_recipe", (q) => q.eq("recipeId", args.recipeId))
      .collect();

    const sharedWith = await Promise.all(
      shares.map(async (share) => {
        const user = await ctx.db.get(share.sharedWithId);
        if (!user) return null;
        return {
          shareId: share._id,
          userId: user._id,
          name: user.name || "Unknown",
          email: user.email,
          imageUrl: user.imageUrl,
          sharedAt: share.sharedAt,
          message: share.message,
        };
      })
    );

    return sharedWith.filter((s): s is NonNullable<typeof s> => s !== null);
  },
});

// Get recipes shared with current user
export const getSharedWithMe = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getCurrentUserIdOrNull(ctx);
    if (!userId) return [];

    const shares = await ctx.db
      .query("recipeShares")
      .withIndex("by_shared_with", (q) => q.eq("sharedWithId", userId))
      .collect();

    const now = Date.now();

    const recipes = await Promise.all(
      shares.map(async (share) => {
        // Skip expired shares
        if (share.expiresAt && share.expiresAt < now) {
          return null;
        }

        const recipe = await ctx.db.get(share.recipeId);
        if (!recipe) return null;

        const owner = await ctx.db.get(share.ownerId);

        // Get ingredients
        const ingredients = await ctx.db
          .query("ingredients")
          .withIndex("by_recipe", (q) => q.eq("recipeId", recipe._id))
          .collect();

        // Get steps
        const steps = await ctx.db
          .query("steps")
          .withIndex("by_recipe", (q) => q.eq("recipeId", recipe._id))
          .collect();

        // Get tags
        const recipeTags = await ctx.db
          .query("recipeTags")
          .withIndex("by_recipe", (q) => q.eq("recipeId", recipe._id))
          .collect();

        const tags = await Promise.all(
          recipeTags.map(async (rt) => {
            const tag = await ctx.db.get(rt.tagId);
            return tag?.name || "";
          })
        );

        return {
          ...recipe,
          ingredients: ingredients.sort((a, b) => a.sortOrder - b.sortOrder),
          steps: steps.sort((a, b) => a.stepNumber - b.stepNumber),
          tags: tags.filter(Boolean),
          isShared: true,
          ownerName: owner?.name || "Unknown",
          sharedAt: share.sharedAt,
          shareMessage: share.message,
        };
      })
    );

    return recipes.filter((r): r is NonNullable<typeof r> => r !== null);
  },
});

// Check if can share a recipe with a user
export const canShare = query({
  args: {
    recipeId: v.id("recipes"),
    friendId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserIdOrNull(ctx);
    if (!userId) return { canShare: false, reason: "Not authenticated" };

    // Check ownership
    const recipe = await ctx.db.get(args.recipeId);
    if (!recipe || recipe.userId !== userId) {
      return { canShare: false, reason: "Not the recipe owner" };
    }

    // Check friendship
    const friendship = await ctx.db
      .query("friendships")
      .withIndex("by_user_and_friend", (q) =>
        q.eq("userId", userId).eq("friendId", args.friendId)
      )
      .first();

    if (!friendship || friendship.status !== "accepted") {
      return { canShare: false, reason: "Not friends" };
    }

    // Check if already shared
    const existingShare = await ctx.db
      .query("recipeShares")
      .withIndex("by_recipe_and_user", (q) =>
        q.eq("recipeId", args.recipeId).eq("sharedWithId", args.friendId)
      )
      .first();

    if (existingShare) {
      return { canShare: false, reason: "Already shared" };
    }

    return { canShare: true, reason: null };
  },
});

// Share a recipe with a friend
export const share = mutation({
  args: {
    recipeId: v.id("recipes"),
    friendId: v.id("users"),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);

    // Check ownership
    const recipe = await ctx.db.get(args.recipeId);
    if (!recipe) {
      throw new Error("Recipe not found");
    }
    if (recipe.userId !== userId) {
      throw new Error("Not the recipe owner");
    }

    // Check friendship
    const friendship = await ctx.db
      .query("friendships")
      .withIndex("by_user_and_friend", (q) =>
        q.eq("userId", userId).eq("friendId", args.friendId)
      )
      .first();

    if (!friendship || friendship.status !== "accepted") {
      throw new Error("Can only share with friends");
    }

    // Check if already shared
    const existingShare = await ctx.db
      .query("recipeShares")
      .withIndex("by_recipe_and_user", (q) =>
        q.eq("recipeId", args.recipeId).eq("sharedWithId", args.friendId)
      )
      .first();

    if (existingShare) {
      throw new Error("Recipe already shared with this user");
    }

    // Create share
    const shareId = await ctx.db.insert("recipeShares", {
      recipeId: args.recipeId,
      ownerId: userId,
      sharedWithId: args.friendId,
      permission: "view",
      sharedAt: Date.now(),
      message: args.message,
    });

    return { shareId };
  },
});

// Share a recipe with multiple friends
export const shareWithMultiple = mutation({
  args: {
    recipeId: v.id("recipes"),
    friendIds: v.array(v.id("users")),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);

    // Check ownership
    const recipe = await ctx.db.get(args.recipeId);
    if (!recipe) {
      throw new Error("Recipe not found");
    }
    if (recipe.userId !== userId) {
      throw new Error("Not the recipe owner");
    }

    const results: Array<{
      friendId: typeof args.friendIds[0];
      success: boolean;
      error?: string;
    }> = [];

    for (const friendId of args.friendIds) {
      // Check friendship
      const friendship = await ctx.db
        .query("friendships")
        .withIndex("by_user_and_friend", (q) =>
          q.eq("userId", userId).eq("friendId", friendId)
        )
        .first();

      if (!friendship || friendship.status !== "accepted") {
        results.push({ friendId, success: false, error: "Not friends" });
        continue;
      }

      // Check if already shared
      const existingShare = await ctx.db
        .query("recipeShares")
        .withIndex("by_recipe_and_user", (q) =>
          q.eq("recipeId", args.recipeId).eq("sharedWithId", friendId)
        )
        .first();

      if (existingShare) {
        results.push({ friendId, success: false, error: "Already shared" });
        continue;
      }

      // Create share
      await ctx.db.insert("recipeShares", {
        recipeId: args.recipeId,
        ownerId: userId,
        sharedWithId: friendId,
        permission: "view",
        sharedAt: Date.now(),
        message: args.message,
      });

      results.push({ friendId, success: true });
    }

    return { results };
  },
});

// Revoke share access
export const unshare = mutation({
  args: {
    recipeId: v.id("recipes"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserId(ctx);

    // Check ownership
    const recipe = await ctx.db.get(args.recipeId);
    if (!recipe || recipe.userId !== currentUserId) {
      throw new Error("Not the recipe owner");
    }

    // Find and delete share
    const share = await ctx.db
      .query("recipeShares")
      .withIndex("by_recipe_and_user", (q) =>
        q.eq("recipeId", args.recipeId).eq("sharedWithId", args.userId)
      )
      .first();

    if (share) {
      await ctx.db.delete(share._id);
    }

    return { success: true };
  },
});

// Revoke all shares for a recipe
export const unshareAll = mutation({
  args: { recipeId: v.id("recipes") },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);

    // Check ownership
    const recipe = await ctx.db.get(args.recipeId);
    if (!recipe || recipe.userId !== userId) {
      throw new Error("Not the recipe owner");
    }

    // Delete all shares
    const shares = await ctx.db
      .query("recipeShares")
      .withIndex("by_recipe", (q) => q.eq("recipeId", args.recipeId))
      .collect();

    for (const share of shares) {
      await ctx.db.delete(share._id);
    }

    return { success: true, removed: shares.length };
  },
});
