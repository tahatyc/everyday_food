import { QueryCtx, MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { ConvexError } from "convex/values";
import { FEATURE_LIMITS, FeatureKey } from "./featureLimits";

/**
 * Check if a user has premium access (pro or trialing).
 * Uses the denormalized subscriptionStatus on the users table for fast lookups.
 */
export async function isPremiumUser(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">
): Promise<boolean> {
  const user = await ctx.db.get(userId);
  if (!user) return false;
  const status = user.subscriptionStatus;
  return status === "pro" || status === "trialing";
}

/**
 * Get the full subscription record for a user.
 */
export async function getSubscription(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">
) {
  return await ctx.db
    .query("subscriptions")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();
}

/**
 * Guard that throws if user is not premium. Use in premium-only mutations.
 */
export async function requirePremium(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">
): Promise<void> {
  const premium = await isPremiumUser(ctx, userId);
  if (!premium) {
    throw new ConvexError({
      code: "PREMIUM_REQUIRED",
      message: "This feature requires a Pro subscription.",
    });
  }
}

/**
 * Check if a user can use a feature based on their plan limits.
 */
export async function checkFeatureLimit(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
  feature: FeatureKey,
  currentCount: number
): Promise<{ allowed: boolean; current: number; limit: number }> {
  const premium = await isPremiumUser(ctx, userId);
  const tier = premium ? "pro" : "free";
  const limit = FEATURE_LIMITS[tier][feature];

  return {
    allowed: currentCount < limit,
    current: currentCount,
    limit,
  };
}

/**
 * Enforce a feature limit. Throws ConvexError if limit is exceeded.
 */
export async function enforceFeatureLimit(
  ctx: MutationCtx,
  userId: Id<"users">,
  feature: FeatureKey,
  currentCount: number
): Promise<void> {
  const { allowed, current, limit } = await checkFeatureLimit(
    ctx,
    userId,
    feature,
    currentCount
  );

  if (!allowed) {
    throw new ConvexError({
      code: "FEATURE_LIMIT_REACHED",
      message: `You've reached the free plan limit of ${limit} for ${feature}. Upgrade to Pro for unlimited access.`,
      feature,
      current,
      limit,
    });
  }
}
