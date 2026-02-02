import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUserId, getCurrentUserIdOrNull } from "./lib/accessControl";

// Get all cookbooks for current user
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getCurrentUserIdOrNull(ctx);
    if (!userId) return [];

    const cookbooks = await ctx.db
      .query("cookbooks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Get recipe count for each cookbook
    const cookbooksWithCount = await Promise.all(
      cookbooks.map(async (cookbook) => {
        const recipeLinks = await ctx.db
          .query("cookbookRecipes")
          .withIndex("by_cookbook", (q) => q.eq("cookbookId", cookbook._id))
          .collect();

        return {
          ...cookbook,
          recipeCount: recipeLinks.length,
        };
      })
    );

    return cookbooksWithCount.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  },
});

// Get a single cookbook with its recipes
export const getById = query({
  args: { id: v.id("cookbooks") },
  handler: async (ctx, args) => {
    const cookbook = await ctx.db.get(args.id);
    if (!cookbook) return null;

    // Get recipe links
    const recipeLinks = await ctx.db
      .query("cookbookRecipes")
      .withIndex("by_cookbook", (q) => q.eq("cookbookId", cookbook._id))
      .collect();

    // Get full recipe data
    const recipes = await Promise.all(
      recipeLinks.map(async (link) => {
        const recipe = await ctx.db.get(link.recipeId);
        if (!recipe) return null;

        // Get ingredients for total time calculation
        const ingredients = await ctx.db
          .query("ingredients")
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
          ingredients,
          tags: tags.filter(Boolean),
          addedAt: link.addedAt,
        };
      })
    );

    return {
      ...cookbook,
      recipes: recipes.filter(Boolean),
    };
  },
});

// Get cookbook by name
export const getByName = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserIdOrNull(ctx);
    if (!userId) return null;

    const cookbook = await ctx.db
      .query("cookbooks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();

    if (!cookbook) return null;

    // Get recipes
    const recipeLinks = await ctx.db
      .query("cookbookRecipes")
      .withIndex("by_cookbook", (q) => q.eq("cookbookId", cookbook._id))
      .collect();

    const recipes = await Promise.all(
      recipeLinks.map(async (link) => ctx.db.get(link.recipeId))
    );

    return {
      ...cookbook,
      recipes: recipes.filter(Boolean),
    };
  },
});

// Add recipe to cookbook
export const addRecipe = mutation({
  args: {
    cookbookId: v.id("cookbooks"),
    recipeId: v.id("recipes"),
  },
  handler: async (ctx, args) => {
    // Check if already exists
    const existing = await ctx.db
      .query("cookbookRecipes")
      .withIndex("by_cookbook_and_recipe", (q) =>
        q.eq("cookbookId", args.cookbookId).eq("recipeId", args.recipeId)
      )
      .first();

    if (existing) {
      return { success: false, message: "Recipe already in cookbook" };
    }

    await ctx.db.insert("cookbookRecipes", {
      cookbookId: args.cookbookId,
      recipeId: args.recipeId,
      addedAt: Date.now(),
    });

    // Update cookbook timestamp
    await ctx.db.patch(args.cookbookId, { updatedAt: Date.now() });

    return { success: true };
  },
});

// Remove recipe from cookbook
export const removeRecipe = mutation({
  args: {
    cookbookId: v.id("cookbooks"),
    recipeId: v.id("recipes"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("cookbookRecipes")
      .withIndex("by_cookbook_and_recipe", (q) =>
        q.eq("cookbookId", args.cookbookId).eq("recipeId", args.recipeId)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      await ctx.db.patch(args.cookbookId, { updatedAt: Date.now() });
    }

    return { success: true };
  },
});

// Create a new cookbook
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);

    const now = Date.now();

    // Get current max sort order
    const cookbooks = await ctx.db
      .query("cookbooks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const maxSortOrder = Math.max(...cookbooks.map((c) => c.sortOrder || 0), 0);

    const cookbookId = await ctx.db.insert("cookbooks", {
      userId: userId,
      name: args.name,
      description: args.description,
      color: args.color,
      sortOrder: maxSortOrder + 1,
      createdAt: now,
      updatedAt: now,
    });

    return cookbookId;
  },
});
