import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all recipes for current user (or demo user)
export const list = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get demo user for now (later: use auth)
    const user = await ctx.db.query("users").first();
    if (!user) return [];

    let query = ctx.db
      .query("recipes")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc");

    const recipes = await query.collect();

    // If limit specified, slice the results
    const limitedRecipes = args.limit ? recipes.slice(0, args.limit) : recipes;

    // Fetch ingredients and steps for each recipe
    const recipesWithDetails = await Promise.all(
      limitedRecipes.map(async (recipe) => {
        const ingredients = await ctx.db
          .query("ingredients")
          .withIndex("by_recipe", (q) => q.eq("recipeId", recipe._id))
          .collect();

        const steps = await ctx.db
          .query("steps")
          .withIndex("by_recipe", (q) => q.eq("recipeId", recipe._id))
          .collect();

        // Get recipe tags
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
        };
      })
    );

    return recipesWithDetails;
  },
});

// Get a single recipe by ID
export const getById = query({
  args: { id: v.id("recipes") },
  handler: async (ctx, args) => {
    const recipe = await ctx.db.get(args.id);
    if (!recipe) return null;

    const ingredients = await ctx.db
      .query("ingredients")
      .withIndex("by_recipe", (q) => q.eq("recipeId", recipe._id))
      .collect();

    const steps = await ctx.db
      .query("steps")
      .withIndex("by_recipe", (q) => q.eq("recipeId", recipe._id))
      .collect();

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
    };
  },
});

// Get recipes by meal type
export const getByMealType = query({
  args: { mealType: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db.query("users").first();
    if (!user) return [];

    // Get meal type tag
    const tag = await ctx.db
      .query("tags")
      .withIndex("by_user_and_name", (q) =>
        q.eq("userId", user._id).eq("name", args.mealType)
      )
      .first();

    if (!tag) return [];

    // Get recipe IDs with this tag
    const recipeTags = await ctx.db
      .query("recipeTags")
      .withIndex("by_tag", (q) => q.eq("tagId", tag._id))
      .collect();

    const recipes = await Promise.all(
      recipeTags.map(async (rt) => {
        const recipe = await ctx.db.get(rt.recipeId);
        return recipe;
      })
    );

    return recipes.filter(Boolean);
  },
});

// Get favorite recipes
export const getFavorites = query({
  args: {},
  handler: async (ctx) => {
    const user = await ctx.db.query("users").first();
    if (!user) return [];

    const recipes = await ctx.db
      .query("recipes")
      .withIndex("by_user_and_favorite", (q) =>
        q.eq("userId", user._id).eq("isFavorite", true)
      )
      .collect();

    return recipes;
  },
});

// Toggle favorite status
export const toggleFavorite = mutation({
  args: { recipeId: v.id("recipes") },
  handler: async (ctx, args) => {
    const recipe = await ctx.db.get(args.recipeId);
    if (!recipe) throw new Error("Recipe not found");

    const newFavoriteStatus = !recipe.isFavorite;

    await ctx.db.patch(args.recipeId, {
      isFavorite: newFavoriteStatus,
      updatedAt: Date.now(),
    });

    // Sync with Favorites cookbook
    const user = await ctx.db.query("users").first();
    if (user) {
      const favoritesCookbook = await ctx.db
        .query("cookbooks")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .filter((q) => q.eq(q.field("name"), "Favorites"))
        .first();

      if (favoritesCookbook) {
        const existingLink = await ctx.db
          .query("cookbookRecipes")
          .withIndex("by_cookbook_and_recipe", (q) =>
            q.eq("cookbookId", favoritesCookbook._id).eq("recipeId", args.recipeId)
          )
          .first();

        if (newFavoriteStatus && !existingLink) {
          // Add to Favorites cookbook
          await ctx.db.insert("cookbookRecipes", {
            cookbookId: favoritesCookbook._id,
            recipeId: args.recipeId,
            addedAt: Date.now(),
          });
        } else if (!newFavoriteStatus && existingLink) {
          // Remove from Favorites cookbook
          await ctx.db.delete(existingLink._id);
        }
      }
    }

    return { isFavorite: newFavoriteStatus };
  },
});

// Search recipes
export const search = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db.query("users").first();
    if (!user) return [];

    const results = await ctx.db
      .query("recipes")
      .withSearchIndex("search_recipes", (q) =>
        q.search("title", args.query).eq("userId", user._id)
      )
      .collect();

    return results;
  },
});

// Get quick recipes (under 30 minutes)
export const getQuickRecipes = query({
  args: {},
  handler: async (ctx) => {
    const user = await ctx.db.query("users").first();
    if (!user) return [];

    const allRecipes = await ctx.db
      .query("recipes")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return allRecipes.filter(
      (r) => (r.totalTime || (r.prepTime || 0) + (r.cookTime || 0)) <= 30
    );
  },
});

// Create a recipe manually
export const createManual = mutation({
  args: {
    title: v.string(),
    servings: v.number(),
    prepTime: v.optional(v.number()),
    cookTime: v.optional(v.number()),
    difficulty: v.optional(
      v.union(v.literal("easy"), v.literal("medium"), v.literal("hard"))
    ),
    description: v.optional(v.string()),
    cuisine: v.optional(v.string()),
    ingredients: v.array(
      v.object({
        name: v.string(),
        amount: v.optional(v.number()),
        unit: v.optional(v.string()),
        preparation: v.optional(v.string()),
        isOptional: v.optional(v.boolean()),
      })
    ),
    steps: v.array(
      v.object({
        instruction: v.string(),
        timerMinutes: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Get current user (demo user for now)
    const user = await ctx.db.query("users").first();
    if (!user) throw new Error("User not found");

    // Calculate total time
    const totalTime =
      args.prepTime || args.cookTime
        ? (args.prepTime || 0) + (args.cookTime || 0)
        : undefined;

    // Create the recipe
    const recipeId = await ctx.db.insert("recipes", {
      userId: user._id,
      title: args.title,
      description: args.description,
      servings: args.servings,
      prepTime: args.prepTime,
      cookTime: args.cookTime,
      totalTime,
      difficulty: args.difficulty,
      cuisine: args.cuisine,
      sourceType: "manual",
      isFavorite: false,
      cookCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    // Create ingredients
    for (let i = 0; i < args.ingredients.length; i++) {
      const ing = args.ingredients[i];
      await ctx.db.insert("ingredients", {
        recipeId,
        name: ing.name,
        amount: ing.amount,
        unit: ing.unit,
        preparation: ing.preparation,
        isOptional: ing.isOptional || false,
        sortOrder: i,
      });
    }

    // Create steps
    for (let i = 0; i < args.steps.length; i++) {
      const step = args.steps[i];
      await ctx.db.insert("steps", {
        recipeId,
        stepNumber: i + 1,
        instruction: step.instruction,
        timerMinutes: step.timerMinutes,
      });
    }

    return { recipeId };
  },
});
