import { FEATURE_LIMITS, FeatureKey, PlanTier } from "../featureLimits";

describe("FEATURE_LIMITS", () => {
  describe("free tier", () => {
    it("has recipes limited to 15", () => {
      expect(FEATURE_LIMITS.free.recipes).toBe(15);
    });

    it("has mealPlanDays limited to 3", () => {
      expect(FEATURE_LIMITS.free.mealPlanDays).toBe(3);
    });

    it("has importsPerMonth limited to 3", () => {
      expect(FEATURE_LIMITS.free.importsPerMonth).toBe(3);
    });

    it("has activeShoppingLists limited to 1", () => {
      expect(FEATURE_LIMITS.free.activeShoppingLists).toBe(1);
    });

    it("has shareRecipesWith limited to 3", () => {
      expect(FEATURE_LIMITS.free.shareRecipesWith).toBe(3);
    });
  });

  describe("pro tier", () => {
    it("has all limits set to Infinity", () => {
      const proLimits = FEATURE_LIMITS.pro;
      expect(proLimits.recipes).toBe(Infinity);
      expect(proLimits.mealPlanDays).toBe(Infinity);
      expect(proLimits.importsPerMonth).toBe(Infinity);
      expect(proLimits.activeShoppingLists).toBe(Infinity);
      expect(proLimits.shareRecipesWith).toBe(Infinity);
    });
  });

  describe("type safety", () => {
    it("free and pro tiers have the same feature keys", () => {
      const freeKeys = Object.keys(FEATURE_LIMITS.free).sort();
      const proKeys = Object.keys(FEATURE_LIMITS.pro).sort();
      expect(freeKeys).toEqual(proKeys);
    });

    it("all free tier values are finite numbers", () => {
      for (const [key, value] of Object.entries(FEATURE_LIMITS.free)) {
        expect(typeof value).toBe("number");
        expect(Number.isFinite(value)).toBe(true);
      }
    });

    it("all pro tier values are Infinity", () => {
      for (const [key, value] of Object.entries(FEATURE_LIMITS.pro)) {
        expect(value).toBe(Infinity);
      }
    });
  });
});
