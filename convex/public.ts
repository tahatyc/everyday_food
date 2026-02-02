import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUserIdOrNull } from "./lib/accessControl";

// Get recipe by share code (public - no auth required)
export const getRecipeByShareCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    // Find the share link
    const link = await ctx.db
      .query("shareLinks")
      .withIndex("by_code", (q) => q.eq("shareCode", args.code))
      .first();

    if (!link) {
      return { error: "Share link not found", recipe: null };
    }

    // Check if link is active
    if (!link.isActive) {
      return { error: "This share link has been revoked", recipe: null };
    }

    // Check if link is expired
    if (link.expiresAt && link.expiresAt < Date.now()) {
      return { error: "This share link has expired", recipe: null };
    }

    // Get the recipe
    const recipe = await ctx.db.get(link.recipeId);
    if (!recipe) {
      return { error: "Recipe not found", recipe: null };
    }

    // Get owner info
    const owner = await ctx.db.get(link.ownerId);

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
      error: null,
      recipe: {
        ...recipe,
        ingredients: ingredients.sort((a, b) => a.sortOrder - b.sortOrder),
        steps: steps.sort((a, b) => a.stepNumber - b.stepNumber),
        tags: tags.filter(Boolean),
        ownerName: owner?.name || "Unknown",
        isSharedViaLink: true,
        accessCount: link.accessCount,
      },
    };
  },
});

// Record access to a share link (mutation so it can update)
export const recordShareLinkAccess = mutation({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    // Find the share link
    const link = await ctx.db
      .query("shareLinks")
      .withIndex("by_code", (q) => q.eq("shareCode", args.code))
      .first();

    if (!link) {
      return { success: false, error: "Share link not found" };
    }

    // Check if link is active and not expired
    if (!link.isActive) {
      return { success: false, error: "Share link revoked" };
    }
    if (link.expiresAt && link.expiresAt < Date.now()) {
      return { success: false, error: "Share link expired" };
    }

    const now = Date.now();

    // Update link stats
    await ctx.db.patch(link._id, {
      accessCount: link.accessCount + 1,
      lastAccessedAt: now,
    });

    // Record access (with optional user if authenticated)
    const userId = await getCurrentUserIdOrNull(ctx);
    await ctx.db.insert("shareLinkAccesses", {
      shareLinkId: link._id,
      userId: userId ?? undefined,
      accessedAt: now,
    });

    return { success: true };
  },
});

// Check if a share code is valid (without recording access)
export const validateShareCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const link = await ctx.db
      .query("shareLinks")
      .withIndex("by_code", (q) => q.eq("shareCode", args.code))
      .first();

    if (!link) {
      return { valid: false, reason: "not_found" };
    }

    if (!link.isActive) {
      return { valid: false, reason: "revoked" };
    }

    if (link.expiresAt && link.expiresAt < Date.now()) {
      return { valid: false, reason: "expired" };
    }

    return { valid: true, reason: null };
  },
});
