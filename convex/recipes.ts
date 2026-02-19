import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import {
  getCurrentUserId,
  getCurrentUserIdOrNull,
  canReadRecipe,
  canModifyRecipe,
} from "./lib/accessControl";

// Get all recipes for current user
export const list = query({
  args: {
    limit: v.optional(v.number()),
    includeShared: v.optional(v.boolean()),
    includeGlobal: v.optional(v.boolean()),
    globalOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserIdOrNull(ctx);

    let recipes: any[] = [];

    // Global only mode
    if (args.globalOnly) {
      const globalRecipes = await ctx.db
        .query("recipes")
        .withIndex("by_global", (q) => q.eq("isGlobal", true))
        .order("desc")
        .collect();
      recipes = globalRecipes;
    } else {
      // Get user's own recipes
      if (userId) {
        const ownRecipes = await ctx.db
          .query("recipes")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .order("desc")
          .collect();
        recipes = [...ownRecipes];
      }

      // Get shared recipes if requested
      if (args.includeShared && userId) {
        const shares = await ctx.db
          .query("recipeShares")
          .withIndex("by_shared_with", (q) => q.eq("sharedWithId", userId))
          .collect();

        const now = Date.now();
        const validShares = shares.filter(
          (s) => !s.expiresAt || s.expiresAt > now
        );

        const sharedRecipes = (
          await Promise.all(
            validShares.map(async (share) => {
              const recipe = await ctx.db.get(share.recipeId);
              if (!recipe) return null;
              const owner = await ctx.db.get(share.ownerId);
              return {
                ...recipe,
                isShared: true as const,
                ownerName: owner?.name || "Unknown",
              };
            })
          )
        ).filter(Boolean);
        recipes = [...recipes, ...sharedRecipes];
      }

      // Get global recipes if requested
      if (args.includeGlobal) {
        const globalRecipes = await ctx.db
          .query("recipes")
          .withIndex("by_global", (q) => q.eq("isGlobal", true))
          .order("desc")
          .collect();

        // Enrich with user interactions if authenticated
        if (userId) {
          const enrichedGlobal = await Promise.all(
            globalRecipes.map(async (recipe) => {
              const interaction = await ctx.db
                .query("userRecipeInteractions")
                .withIndex("by_user_and_recipe", (q) =>
                  q.eq("userId", userId).eq("recipeId", recipe._id)
                )
                .first();

              return {
                ...recipe,
                isGlobal: true as const,
                isFavorite: interaction?.isFavorite || false,
                cookCount: interaction?.cookCount || 0,
              };
            })
          );
          recipes = [...recipes, ...enrichedGlobal];
        } else {
          recipes = [...recipes, ...globalRecipes.map(r => ({ ...r, isGlobal: true as const }))];
        }
      }
    }

    const typedRecipes = recipes as any[];

    // If limit specified, slice the results
    const limitedRecipes = args.limit ? typedRecipes.slice(0, args.limit) : typedRecipes;

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

// Get a single recipe by ID (with authorization)
export const getById = query({
  args: { id: v.id("recipes") },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserIdOrNull(ctx);

    // Check if user can read this recipe
    const hasAccess = await canReadRecipe(ctx, args.id, userId);
    if (!hasAccess) {
      return null; // Return null for unauthorized access (same as not found)
    }

    const recipe = await ctx.db.get(args.id);
    if (!recipe) return null;

    // Add ownership info
    const isOwner = userId ? recipe.userId === userId : false;
    const owner = recipe.userId ? await ctx.db.get(recipe.userId) : null;
    const ownerName = owner?.name || "Unknown";

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
      isOwner,
      ownerName,
    };
  },
});

// Get recipes by meal type
export const getByMealType = query({
  args: { mealType: v.string() },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserIdOrNull(ctx);
    if (!userId) return [];

    // Get meal type tag
    const tag = await ctx.db
      .query("tags")
      .withIndex("by_user_and_name", (q) =>
        q.eq("userId", userId).eq("name", args.mealType)
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
    const userId = await getCurrentUserIdOrNull(ctx);
    if (!userId) return [];

    // Get personal favorite recipes
    const personalFavorites = await ctx.db
      .query("recipes")
      .withIndex("by_user_and_favorite", (q) =>
        q.eq("userId", userId).eq("isFavorite", true)
      )
      .collect();

    // Get global recipe favorites from userRecipeInteractions
    const favoriteInteractions = await ctx.db
      .query("userRecipeInteractions")
      .withIndex("by_user_and_favorite", (q) =>
        q.eq("userId", userId).eq("isFavorite", true)
      )
      .collect();

    const globalFavorites = (
      await Promise.all(
        favoriteInteractions.map((interaction) =>
          ctx.db.get(interaction.recipeId)
        )
      )
    ).filter((r): r is NonNullable<typeof r> => r !== null);

    // Merge and deduplicate
    const seenIds = new Set(personalFavorites.map((r) => r._id));
    const recipes = [
      ...personalFavorites,
      ...globalFavorites.filter((r) => !seenIds.has(r._id)),
    ];

    // Fetch ingredients, steps, and tags for each recipe
    const recipesWithDetails = await Promise.all(
      recipes.map(async (recipe) => {
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
          isFavorite: true as const,
          ingredients: ingredients.sort((a, b) => a.sortOrder - b.sortOrder),
          steps: steps.sort((a, b) => a.stepNumber - b.stepNumber),
          tags: tags.filter(Boolean),
        };
      })
    );

    return recipesWithDetails;
  },
});

// Toggle favorite status
export const toggleFavorite = mutation({
  args: { recipeId: v.id("recipes") },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);

    const recipe = await ctx.db.get(args.recipeId);
    if (!recipe) throw new Error("Recipe not found");

    // Only owner can toggle favorite on their recipes
    if (recipe.userId !== userId) {
      throw new Error("Not authorized to modify this recipe");
    }

    const newFavoriteStatus = !recipe.isFavorite;

    await ctx.db.patch(args.recipeId, {
      isFavorite: newFavoriteStatus,
      updatedAt: Date.now(),
    });

    return { isFavorite: newFavoriteStatus };
  },
});

// Search recipes
export const search = query({
  args: {
    query: v.string(),
    includeGlobal: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserIdOrNull(ctx);

    let results: any[] = [];

    // Search personal recipes
    if (userId) {
      const personalResults = await ctx.db
        .query("recipes")
        .withSearchIndex("search_recipes", (q) =>
          q.search("title", args.query).eq("userId", userId)
        )
        .collect();
      results = [...personalResults];
    }

    // Search global recipes if requested
    if (args.includeGlobal) {
      const globalResults = await ctx.db
        .query("recipes")
        .withSearchIndex("search_recipes", (q) =>
          q.search("title", args.query).eq("isGlobal", true)
        )
        .collect();
      results = [...results, ...globalResults];
    }

    return results;
  },
});

// Get quick recipes (under 30 minutes)
export const getQuickRecipes = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getCurrentUserIdOrNull(ctx);
    if (!userId) return [];

    const allRecipes = await ctx.db
      .query("recipes")
      .withIndex("by_user", (q) => q.eq("userId", userId))
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
    isPublic: v.optional(v.boolean()),
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

    // Get authenticated user
    const userId = await getCurrentUserId(ctx);

    // Calculate total time
    const totalTime =
      args.prepTime || args.cookTime
        ? (args.prepTime || 0) + (args.cookTime || 0)
        : undefined;

    // Create the recipe (private by default)
    const recipeId = await ctx.db.insert("recipes", {
      userId: userId,
      title: args.title,
      description: args.description,
      servings: args.servings,
      prepTime: args.prepTime,
      cookTime: args.cookTime,
      totalTime,
      difficulty: args.difficulty,
      cuisine: args.cuisine,
      sourceType: "manual",
      isPublic: args.isPublic ?? false, // Private by default
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

// Record a recipe view (for "recently viewed" tracking)
export const recordView = mutation({
  args: { recipeId: v.id("recipes") },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    const now = Date.now();

    const interaction = await ctx.db
      .query("userRecipeInteractions")
      .withIndex("by_user_and_recipe", (q) =>
        q.eq("userId", userId).eq("recipeId", args.recipeId)
      )
      .first();

    if (interaction) {
      await ctx.db.patch(interaction._id, {
        lastViewedAt: now,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("userRecipeInteractions", {
        userId,
        recipeId: args.recipeId,
        lastViewedAt: now,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Get recently viewed recipes
export const getRecentlyViewed = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserIdOrNull(ctx);
    if (!userId) return [];

    const limit = args.limit || 10;

    // Get interactions with lastViewedAt, ordered desc
    const interactions = await ctx.db
      .query("userRecipeInteractions")
      .withIndex("by_user_and_last_viewed", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    // Filter out those without lastViewedAt and limit
    const viewed = interactions
      .filter((i) => i.lastViewedAt)
      .slice(0, limit);

    // Fetch recipe details
    const recipes = await Promise.all(
      viewed.map(async (interaction) => {
        const recipe = await ctx.db.get(interaction.recipeId);
        if (!recipe) return null;

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
          tags: tags.filter(Boolean),
        };
      })
    );

    return recipes.filter(Boolean);
  },
});

// Record a cook completion — increments cookCount and sets lastCookedAt
export const recordCookCompletion = mutation({
  args: { recipeId: v.id("recipes") },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    const now = Date.now();

    const recipe = await ctx.db.get(args.recipeId);
    if (!recipe) throw new Error("Recipe not found");

    // Personal recipe: update cookCount directly on the recipe row
    if (recipe.userId === userId) {
      await ctx.db.patch(args.recipeId, {
        cookCount: (recipe.cookCount || 0) + 1,
        lastCookedAt: now,
        updatedAt: now,
      });
      return;
    }

    // Global / shared recipe: track via userRecipeInteractions
    const interaction = await ctx.db
      .query("userRecipeInteractions")
      .withIndex("by_user_and_recipe", (q) =>
        q.eq("userId", userId).eq("recipeId", args.recipeId)
      )
      .first();

    if (interaction) {
      await ctx.db.patch(interaction._id, {
        cookCount: (interaction.cookCount || 0) + 1,
        lastCookedAt: now,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("userRecipeInteractions", {
        userId,
        recipeId: args.recipeId,
        cookCount: 1,
        lastCookedAt: now,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Toggle favorite for global recipes (creates/updates interaction record)
export const toggleGlobalRecipeFavorite = mutation({
  args: { recipeId: v.id("recipes") },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);

    const recipe = await ctx.db.get(args.recipeId);
    if (!recipe) throw new Error("Recipe not found");
    if (!recipe.isGlobal) {
      throw new Error("Use toggleFavorite for personal recipes");
    }

    const now = Date.now();

    // Find existing interaction
    const interaction = await ctx.db
      .query("userRecipeInteractions")
      .withIndex("by_user_and_recipe", (q) =>
        q.eq("userId", userId).eq("recipeId", args.recipeId)
      )
      .first();

    if (interaction) {
      // Toggle favorite
      const newFavoriteStatus = !interaction.isFavorite;
      await ctx.db.patch(interaction._id, {
        isFavorite: newFavoriteStatus,
        updatedAt: now,
      });
      return { isFavorite: newFavoriteStatus };
    } else {
      // Create new interaction
      await ctx.db.insert("userRecipeInteractions", {
        userId,
        recipeId: args.recipeId,
        isFavorite: true,
        createdAt: now,
        updatedAt: now,
      });
      return { isFavorite: true };
    }
  },
});
