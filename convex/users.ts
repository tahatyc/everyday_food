import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get current authenticated user
export const current = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    return await ctx.db.get(userId);
  },
});

// Get or create user profile after authentication
export const getOrCreateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const existingUser = await ctx.db.get(userId);
    if (existingUser) {
      return existingUser;
    }

    // Create new user profile
    const now = Date.now();
    const newUserId = await ctx.db.insert("users", {
      tokenIdentifier: userId.toString(),
      name: args.name,
      email: args.email,
      createdAt: now,
      updatedAt: now,
      preferredUnits: "imperial",
      defaultServings: 4,
    });

    return await ctx.db.get(newUserId);
  },
});

// Get user stats (recipes, favorites, cookbooks count)
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const recipes = await ctx.db
      .query("recipes")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const cookbooks = await ctx.db
      .query("cookbooks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const totalMealsCooked = recipes.reduce((sum, r) => sum + (r.cookCount || 0), 0);

    return {
      totalRecipes: recipes.length,
      totalFavorites: recipes.filter((r) => r.isFavorite).length,
      totalCookbooks: cookbooks.length,
      totalMealsCooked,
    };
  },
});

// Update user profile
export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    defaultServings: v.optional(v.number()),
    preferredUnits: v.optional(v.union(v.literal("metric"), v.literal("imperial"))),
    dietaryPreferences: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(userId, {
      ...args,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(userId);
  },
});
