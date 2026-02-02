import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUserId, getCurrentUserIdOrNull } from "./lib/accessControl";

// Get meal plans for a specific date
export const getByDate = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserIdOrNull(ctx);
    if (!userId) return [];

    const mealPlans = await ctx.db
      .query("mealPlans")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", userId).eq("date", args.date)
      )
      .collect();

    // Fetch recipe details for each meal plan
    const mealPlansWithRecipes = await Promise.all(
      mealPlans.map(async (plan) => {
        let recipe = null;
        if (plan.recipeId) {
          const recipeData = await ctx.db.get(plan.recipeId);
          if (recipeData) {
            // Get tags for the recipe
            const recipeTags = await ctx.db
              .query("recipeTags")
              .withIndex("by_recipe", (q) => q.eq("recipeId", recipeData._id))
              .collect();

            const tags = await Promise.all(
              recipeTags.map(async (rt) => {
                const tag = await ctx.db.get(rt.tagId);
                return tag?.name || "";
              })
            );

            recipe = {
              ...recipeData,
              tags: tags.filter(Boolean),
            };
          }
        }

        return {
          ...plan,
          recipe,
        };
      })
    );

    return mealPlansWithRecipes;
  },
});

// Get meal plans for a date range (week view)
export const getByDateRange = query({
  args: {
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserIdOrNull(ctx);
    if (!userId) return [];

    // Get all meal plans for the user
    const allMealPlans = await ctx.db
      .query("mealPlans")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Filter by date range
    const mealPlans = allMealPlans.filter(
      (plan) => plan.date >= args.startDate && plan.date <= args.endDate
    );

    // Fetch recipe details for each meal plan
    const mealPlansWithRecipes = await Promise.all(
      mealPlans.map(async (plan) => {
        let recipe = null;
        if (plan.recipeId) {
          const recipeData = await ctx.db.get(plan.recipeId);
          if (recipeData) {
            const recipeTags = await ctx.db
              .query("recipeTags")
              .withIndex("by_recipe", (q) => q.eq("recipeId", recipeData._id))
              .collect();

            const tags = await Promise.all(
              recipeTags.map(async (rt) => {
                const tag = await ctx.db.get(rt.tagId);
                return tag?.name || "";
              })
            );

            recipe = {
              ...recipeData,
              tags: tags.filter(Boolean),
            };
          }
        }

        return {
          ...plan,
          recipe,
        };
      })
    );

    return mealPlansWithRecipes;
  },
});

// Add a meal to the plan
export const addMeal = mutation({
  args: {
    date: v.string(),
    mealType: v.union(
      v.literal("breakfast"),
      v.literal("lunch"),
      v.literal("dinner"),
      v.literal("snack")
    ),
    recipeId: v.id("recipes"),
    servings: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);

    // Check if meal already exists for this date/type
    const existing = await ctx.db
      .query("mealPlans")
      .withIndex("by_user_date_meal", (q) =>
        q.eq("userId", userId).eq("date", args.date).eq("mealType", args.mealType)
      )
      .first();

    if (existing) {
      // Update existing meal plan
      await ctx.db.patch(existing._id, {
        recipeId: args.recipeId,
        servings: args.servings,
      });
      return existing._id;
    }

    // Create new meal plan
    const mealPlanId = await ctx.db.insert("mealPlans", {
      userId: userId,
      date: args.date,
      mealType: args.mealType,
      recipeId: args.recipeId,
      servings: args.servings,
      createdAt: Date.now(),
    });

    return mealPlanId;
  },
});

// Remove a meal from the plan
export const removeMeal = mutation({
  args: {
    mealPlanId: v.id("mealPlans"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.mealPlanId);
  },
});
