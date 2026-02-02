import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUserId, getCurrentUserIdOrNull } from "./lib/accessControl";

// Generate a random 9-character share code
function generateShareCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < 9; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Get share links for a recipe (owner only)
export const getByRecipe = query({
  args: { recipeId: v.id("recipes") },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserIdOrNull(ctx);
    if (!userId) return [];

    // Verify ownership
    const recipe = await ctx.db.get(args.recipeId);
    if (!recipe || recipe.userId !== userId) {
      return [];
    }

    const links = await ctx.db
      .query("shareLinks")
      .withIndex("by_recipe", (q) => q.eq("recipeId", args.recipeId))
      .collect();

    return links.map((link) => ({
      linkId: link._id,
      shareCode: link.shareCode,
      createdAt: link.createdAt,
      expiresAt: link.expiresAt,
      accessCount: link.accessCount,
      lastAccessedAt: link.lastAccessedAt,
      isActive: link.isActive,
      isExpired: link.expiresAt ? link.expiresAt < Date.now() : false,
    }));
  },
});

// Get all share links created by user
export const getMyLinks = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getCurrentUserIdOrNull(ctx);
    if (!userId) return [];

    const links = await ctx.db
      .query("shareLinks")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .collect();

    const linksWithRecipes = await Promise.all(
      links.map(async (link) => {
        const recipe = await ctx.db.get(link.recipeId);
        return {
          linkId: link._id,
          shareCode: link.shareCode,
          recipeId: link.recipeId,
          recipeTitle: recipe?.title || "Unknown",
          createdAt: link.createdAt,
          expiresAt: link.expiresAt,
          accessCount: link.accessCount,
          lastAccessedAt: link.lastAccessedAt,
          isActive: link.isActive,
          isExpired: link.expiresAt ? link.expiresAt < Date.now() : false,
        };
      })
    );

    return linksWithRecipes;
  },
});

// Create a share link
export const create = mutation({
  args: {
    recipeId: v.id("recipes"),
    expiresInDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);

    // Verify ownership
    const recipe = await ctx.db.get(args.recipeId);
    if (!recipe) {
      throw new Error("Recipe not found");
    }
    if (recipe.userId !== userId) {
      throw new Error("Not the recipe owner");
    }

    const now = Date.now();

    // Generate unique code
    let shareCode = generateShareCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await ctx.db
        .query("shareLinks")
        .withIndex("by_code", (q) => q.eq("shareCode", shareCode))
        .first();
      if (!existing) break;
      shareCode = generateShareCode();
      attempts++;
    }

    if (attempts >= 10) {
      throw new Error("Failed to generate unique share code");
    }

    // Calculate expiration
    const expiresAt = args.expiresInDays
      ? now + args.expiresInDays * 24 * 60 * 60 * 1000
      : undefined;

    const linkId = await ctx.db.insert("shareLinks", {
      recipeId: args.recipeId,
      ownerId: userId,
      shareCode,
      createdAt: now,
      expiresAt,
      accessCount: 0,
      isActive: true,
    });

    return { linkId, shareCode };
  },
});

// Revoke (deactivate) a share link
export const revoke = mutation({
  args: { linkId: v.id("shareLinks") },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);

    const link = await ctx.db.get(args.linkId);
    if (!link) {
      throw new Error("Share link not found");
    }
    if (link.ownerId !== userId) {
      throw new Error("Not the link owner");
    }

    await ctx.db.patch(args.linkId, { isActive: false });

    return { success: true };
  },
});

// Reactivate a share link
export const reactivate = mutation({
  args: { linkId: v.id("shareLinks") },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);

    const link = await ctx.db.get(args.linkId);
    if (!link) {
      throw new Error("Share link not found");
    }
    if (link.ownerId !== userId) {
      throw new Error("Not the link owner");
    }

    await ctx.db.patch(args.linkId, { isActive: true });

    return { success: true };
  },
});

// Delete a share link permanently
export const deleteLink = mutation({
  args: { linkId: v.id("shareLinks") },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);

    const link = await ctx.db.get(args.linkId);
    if (!link) {
      throw new Error("Share link not found");
    }
    if (link.ownerId !== userId) {
      throw new Error("Not the link owner");
    }

    // Delete access records
    const accesses = await ctx.db
      .query("shareLinkAccesses")
      .withIndex("by_link", (q) => q.eq("shareLinkId", args.linkId))
      .collect();

    for (const access of accesses) {
      await ctx.db.delete(access._id);
    }

    // Delete the link
    await ctx.db.delete(args.linkId);

    return { success: true };
  },
});

// Delete all share links for a recipe
export const deleteAllForRecipe = mutation({
  args: { recipeId: v.id("recipes") },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);

    // Verify ownership
    const recipe = await ctx.db.get(args.recipeId);
    if (!recipe || recipe.userId !== userId) {
      throw new Error("Not the recipe owner");
    }

    const links = await ctx.db
      .query("shareLinks")
      .withIndex("by_recipe", (q) => q.eq("recipeId", args.recipeId))
      .collect();

    for (const link of links) {
      // Delete access records
      const accesses = await ctx.db
        .query("shareLinkAccesses")
        .withIndex("by_link", (q) => q.eq("shareLinkId", link._id))
        .collect();

      for (const access of accesses) {
        await ctx.db.delete(access._id);
      }

      // Delete the link
      await ctx.db.delete(link._id);
    }

    return { success: true, removed: links.length };
  },
});
