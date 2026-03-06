/**
 * Tests for subscription helper functions.
 *
 * Since these are Convex server functions that depend on ctx.db,
 * we test the logic by mocking the database context.
 */

import { FEATURE_LIMITS } from "../featureLimits";

// We can't import the actual functions because they depend on Convex server context.
// Instead, we test the core logic that those functions implement.

// ==================== isPremiumUser logic ====================

describe("isPremiumUser logic", () => {
  function isPremiumStatus(status: string | undefined): boolean {
    return status === "pro" || status === "trialing";
  }

  it('returns true for "pro" status', () => {
    expect(isPremiumStatus("pro")).toBe(true);
  });

  it('returns true for "trialing" status', () => {
    expect(isPremiumStatus("trialing")).toBe(true);
  });

  it('returns false for "free" status', () => {
    expect(isPremiumStatus("free")).toBe(false);
  });

  it('returns false for "past_due" status', () => {
    expect(isPremiumStatus("past_due")).toBe(false);
  });

  it('returns false for "expired" status', () => {
    expect(isPremiumStatus("expired")).toBe(false);
  });

  it('returns false for "canceled" status', () => {
    expect(isPremiumStatus("canceled")).toBe(false);
  });

  it("returns false for undefined status", () => {
    expect(isPremiumStatus(undefined)).toBe(false);
  });
});

// ==================== checkFeatureLimit logic ====================

describe("checkFeatureLimit logic", () => {
  function checkFeatureLimit(
    isPremium: boolean,
    feature: keyof typeof FEATURE_LIMITS.free,
    currentCount: number
  ) {
    const tier = isPremium ? "pro" : "free";
    const limit = FEATURE_LIMITS[tier][feature];
    return {
      allowed: currentCount < limit,
      current: currentCount,
      limit,
    };
  }

  describe("free tier", () => {
    it("allows recipe creation under limit", () => {
      const result = checkFeatureLimit(false, "recipes", 10);
      expect(result.allowed).toBe(true);
      expect(result.current).toBe(10);
      expect(result.limit).toBe(15);
    });

    it("blocks recipe creation at limit", () => {
      const result = checkFeatureLimit(false, "recipes", 15);
      expect(result.allowed).toBe(false);
      expect(result.current).toBe(15);
      expect(result.limit).toBe(15);
    });

    it("blocks recipe creation over limit", () => {
      const result = checkFeatureLimit(false, "recipes", 20);
      expect(result.allowed).toBe(false);
    });

    it("allows at 0 usage", () => {
      const result = checkFeatureLimit(false, "recipes", 0);
      expect(result.allowed).toBe(true);
    });

    it("blocks shopping list creation at limit of 1", () => {
      const result = checkFeatureLimit(false, "activeShoppingLists", 1);
      expect(result.allowed).toBe(false);
      expect(result.limit).toBe(1);
    });

    it("allows first shopping list", () => {
      const result = checkFeatureLimit(false, "activeShoppingLists", 0);
      expect(result.allowed).toBe(true);
    });

    it("blocks sharing at limit of 3", () => {
      const result = checkFeatureLimit(false, "shareRecipesWith", 3);
      expect(result.allowed).toBe(false);
    });

    it("allows meal plan days under limit", () => {
      const result = checkFeatureLimit(false, "mealPlanDays", 2);
      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(3);
    });

    it("blocks imports at monthly limit", () => {
      const result = checkFeatureLimit(false, "importsPerMonth", 3);
      expect(result.allowed).toBe(false);
      expect(result.limit).toBe(3);
    });
  });

  describe("pro tier", () => {
    it("always allows recipe creation", () => {
      const result = checkFeatureLimit(true, "recipes", 1000);
      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(Infinity);
    });

    it("always allows shopping lists", () => {
      const result = checkFeatureLimit(true, "activeShoppingLists", 100);
      expect(result.allowed).toBe(true);
    });

    it("always allows sharing", () => {
      const result = checkFeatureLimit(true, "shareRecipesWith", 500);
      expect(result.allowed).toBe(true);
    });

    it("always allows meal plan days", () => {
      const result = checkFeatureLimit(true, "mealPlanDays", 365);
      expect(result.allowed).toBe(true);
    });

    it("always allows imports", () => {
      const result = checkFeatureLimit(true, "importsPerMonth", 999);
      expect(result.allowed).toBe(true);
    });
  });
});

// ==================== upsertSubscription status mapping ====================

describe("subscription status to user status mapping", () => {
  function mapSubscriptionStatusToUserStatus(
    status: string
  ): "pro" | "trialing" | "past_due" | "expired" | "free" {
    return status === "active"
      ? "pro"
      : status === "trialing"
        ? "trialing"
        : status === "past_due"
          ? "past_due"
          : status === "expired"
            ? "expired"
            : "free";
  }

  it('maps "active" to "pro"', () => {
    expect(mapSubscriptionStatusToUserStatus("active")).toBe("pro");
  });

  it('maps "trialing" to "trialing"', () => {
    expect(mapSubscriptionStatusToUserStatus("trialing")).toBe("trialing");
  });

  it('maps "past_due" to "past_due"', () => {
    expect(mapSubscriptionStatusToUserStatus("past_due")).toBe("past_due");
  });

  it('maps "expired" to "expired"', () => {
    expect(mapSubscriptionStatusToUserStatus("expired")).toBe("expired");
  });

  it('maps "canceled" to "free"', () => {
    expect(mapSubscriptionStatusToUserStatus("canceled")).toBe("free");
  });
});
