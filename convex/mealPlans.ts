import { query, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { getCurrentUserId, getCurrentUserIdOrNull, canAccessMealPlan, canReadRecipe } from "./lib/accessControl";
import { getTagsForRecipe } from "./lib/recipeHelpers";
import { validateDateString, validateNumberRange } from "./lib/validation";
import { enforceFeatureLimit } from "./lib/subscription";

// Get meal plans for a specific date
export const getByDate = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    validateDateString(args.date, "date");
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
            recipe = {
              ...recipeData,
              tags: await getTagsForRecipe(ctx, recipeData._id),
            };
          }
        }
        return { ...plan, recipe };
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
    validateDateString(args.startDate, "startDate");
    validateDateString(args.endDate, "endDate");
    const userId = await getCurrentUserIdOrNull(ctx);
    if (!userId) return [];

    // Use by_user_and_date index with range scan instead of full user scan + in-memory filter
    const mealPlans = await ctx.db
      .query("mealPlans")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", userId).gte("date", args.startDate).lte("date", args.endDate)
      )
      .collect();

    // Fetch recipe details for each meal plan
    const mealPlansWithRecipes = await Promise.all(
      mealPlans.map(async (plan) => {
        let recipe = null;
        if (plan.recipeId) {
          const recipeData = await ctx.db.get(plan.recipeId);
          if (recipeData) {
            recipe = {
              ...recipeData,
              tags: await getTagsForRecipe(ctx, recipeData._id),
            };
          }
        }
        return { ...plan, recipe };
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
    validateDateString(args.date, "date");
    validateNumberRange(args.servings, "servings", 1, 100);
    const userId = await getCurrentUserId(ctx);

    // Verify the user can access the recipe being added
    const hasRecipeAccess = await canReadRecipe(ctx, args.recipeId, userId);
    if (!hasRecipeAccess) throw new Error("Not authorized to access this recipe");

    // Check meal plan days limit (how far ahead free users can plan)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const mealDate = new Date(args.date);
    const daysDiff = Math.ceil(
      (mealDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysDiff > 0) {
      await enforceFeatureLimit(ctx, userId, "mealPlanDays", daysDiff);
    }

    // Check cap: max 3 meals per slot
    const existing = await ctx.db
      .query("mealPlans")
      .withIndex("by_user_date_meal", (q) =>
        q.eq("userId", userId).eq("date", args.date).eq("mealType", args.mealType)
      )
      .collect();

    if (existing.length >= 3) {
      throw new Error(
        `You can only add up to 3 ${args.mealType} meals per day.`
      );
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

    // Track gamification action (async, non-blocking)
    await ctx.scheduler.runAfter(0, internal.gamification.processAction, {
      userId,
      action: "meal_plan_add",
      metadata: { mealType: args.mealType, date: args.date },
    });

    return mealPlanId;
  },
});

// Update a specific meal plan entry (change its recipe)
export const changeMeal = mutation({
  args: {
    mealPlanId: v.id("mealPlans"),
    recipeId: v.id("recipes"),
    servings: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);

    const hasAccess = await canAccessMealPlan(ctx, args.mealPlanId, userId);
    if (!hasAccess) {
      throw new Error("Not authorized to modify this meal plan entry.");
    }

    await ctx.db.patch(args.mealPlanId, {
      recipeId: args.recipeId,
      servings: args.servings,
    });

    return args.mealPlanId;
  },
});

// Update servings for an existing meal plan entry
export const updateServings = mutation({
  args: {
    mealPlanId: v.id("mealPlans"),
    servings: v.number(),
  },
  handler: async (ctx, args) => {
    validateNumberRange(args.servings, "servings", 1, 100);
    const userId = await getCurrentUserId(ctx);

    const hasAccess = await canAccessMealPlan(ctx, args.mealPlanId, userId);
    if (!hasAccess) {
      throw new Error("Not authorized to modify this meal plan entry.");
    }

    await ctx.db.patch(args.mealPlanId, {
      servings: args.servings,
    });

    return args.mealPlanId;
  },
});

// Remove a meal from the plan
export const removeMeal = mutation({
  args: {
    mealPlanId: v.id("mealPlans"),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);

    // Verify ownership of the meal plan
    const hasAccess = await canAccessMealPlan(ctx, args.mealPlanId, userId);
    if (!hasAccess) {
      throw new Error("Not authorized to delete this meal plan");
    }

    await ctx.db.delete(args.mealPlanId);
  },
});
