export const FEATURE_LIMITS = {
  free: {
    recipes: 15,
    mealPlanDays: 3,
    importsPerMonth: 3,
    activeShoppingLists: 1,
    shareRecipesWith: 3,
  },
  pro: {
    recipes: Infinity,
    mealPlanDays: Infinity,
    importsPerMonth: Infinity,
    activeShoppingLists: Infinity,
    shareRecipesWith: Infinity,
  },
} as const;

export type FeatureKey = keyof typeof FEATURE_LIMITS.free;
export type PlanTier = keyof typeof FEATURE_LIMITS;
