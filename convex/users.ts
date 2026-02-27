import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { validateStringLength, validateUrl, validateNumberRange, validateArrayLength } from "./lib/validation";

// Get current authenticated user
export const current = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    const user = await ctx.db.get(userId);
    if (!user) return null;
    // Strip internal fields from the client response
    const { tokenIdentifier, ...safeUser } = user;
    return safeUser;
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
      const { tokenIdentifier, ...safeUser } = existingUser;
      return safeUser;
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

    const newUser = await ctx.db.get(newUserId);
    if (!newUser) return null;
    const { tokenIdentifier: _, ...safeNewUser } = newUser;
    return safeNewUser;
  },
});

// Get user stats (recipes, favorites count)
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

    const personalCookCount = recipes.reduce((sum, r) => sum + (r.cookCount || 0), 0);

    // Count cook completions for global/shared recipes (tracked in interactions)
    const interactions = await ctx.db
      .query("userRecipeInteractions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const interactionCookCount = interactions.reduce((sum, i) => sum + (i.cookCount || 0), 0);

    const totalMealsCooked = personalCookCount + interactionCookCount;

    // Count global recipe favorites from userRecipeInteractions
    const globalFavorites = interactions.filter((i) => i.isFavorite);

    const personalFavorites = recipes.filter((r) => r.isFavorite).length;

    return {
      totalRecipes: recipes.length,
      totalFavorites: personalFavorites + globalFavorites.length,
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
    bio: v.optional(v.string()),
    defaultServings: v.optional(v.number()),
    preferredUnits: v.optional(v.union(v.literal("metric"), v.literal("imperial"))),
    dietaryPreferences: v.optional(v.array(v.string())),
    weekStartDay: v.optional(v.union(v.literal("monday"), v.literal("sunday"))),
  },
  handler: async (ctx, args) => {
    validateStringLength(args.name, "name", 100);
    validateStringLength(args.email, "email", 254);
    validateStringLength(args.bio, "bio", 500);
    validateUrl(args.imageUrl, "imageUrl");
    validateNumberRange(args.defaultServings, "defaultServings", 1, 100);
    if (args.dietaryPreferences) {
      validateArrayLength(args.dietaryPreferences, "dietaryPreferences", 20);
      for (const pref of args.dietaryPreferences) {
        validateStringLength(pref, "dietary preference", 50);
      }
    }

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

    const updated = await ctx.db.get(userId);
    if (!updated) return null;
    const { tokenIdentifier, ...safeUser } = updated;
    return safeUser;
  },
});
