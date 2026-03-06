import { v, ConvexError } from "convex/values";
import {
  action,
  internalMutation,
  internalQuery,
  query,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { getCurrentUserId } from "./lib/accessControl";

// ==================== QUERIES ====================

export const getSubscriptionStatus = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getCurrentUserId(ctx);
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!subscription) {
      return {
        status: "free" as const,
        plan: null,
        trialEnd: null,
        cancelAtPeriodEnd: false,
        currentPeriodEnd: null,
      };
    }

    return {
      status: user.subscriptionStatus || "free",
      plan: subscription.plan,
      trialEnd: subscription.trialEnd ?? null,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      currentPeriodEnd: subscription.currentPeriodEnd,
    };
  },
});

// ==================== ACTIONS ====================

export const createCheckout = action({
  args: {},
  handler: async (ctx): Promise<{ checkoutUrl: string; checkoutId: string }> => {
    const userId = await ctx.runQuery(internal.payments.getCurrentUserIdQuery);

    // Check if user already has active subscription
    const existingSub = await ctx.runQuery(
      internal.payments.getUserSubscription,
      { userId }
    );
    if (
      existingSub &&
      (existingSub.status === "active" || existingSub.status === "trialing")
    ) {
      throw new ConvexError({
        code: "ALREADY_SUBSCRIBED",
        message: "You already have an active subscription.",
      });
    }

    // Get user email
    const user = await ctx.runQuery(internal.payments.getUserById, { userId });
    if (!user) throw new Error("User not found");

    const apiKey = process.env.CREEM_API_KEY;
    const baseUrl = process.env.CREEM_API_BASE_URL;
    const productId = process.env.CREEM_PRODUCT_ID;

    if (!apiKey || !baseUrl || !productId) {
      throw new Error("Payment configuration missing");
    }

    const response = await fetch(`${baseUrl}/checkouts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        product_id: productId,
        success_url: "everydayfoodapp://payment-success",
        request_id: `checkout_${userId}_${Date.now()}`,
        metadata: { userId },
        ...(user.email ? { customer: { email: user.email } } : {}),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Creem API error: ${response.status} — ${errorText}`);
    }

    const data = await response.json();
    return {
      checkoutUrl: data.checkout_url as string,
      checkoutId: data.id as string,
    };
  },
});

export const verifyCheckout = action({
  args: { checkoutId: v.string() },
  handler: async (ctx, args) => {
    const apiKey = process.env.CREEM_API_KEY;
    const baseUrl = process.env.CREEM_API_BASE_URL;

    if (!apiKey || !baseUrl) {
      throw new Error("Payment configuration missing");
    }

    const response = await fetch(
      `${baseUrl}/checkouts/${args.checkoutId}`,
      {
        headers: { "x-api-key": apiKey },
      }
    );

    if (!response.ok) {
      throw new Error(`Creem API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.status === "completed" && data.metadata?.userId) {
      await ctx.runMutation(internal.payments.upsertSubscription, {
        userId: data.metadata.userId,
        creemSubscriptionId: data.subscription_id || data.id,
        creemCustomerId: data.customer_id || "",
        status: data.trial_end ? "trialing" : "active",
        currentPeriodStart: Date.now(),
        currentPeriodEnd: data.current_period_end
          ? new Date(data.current_period_end).getTime()
          : Date.now() + 30 * 24 * 60 * 60 * 1000,
        trialEnd: data.trial_end
          ? new Date(data.trial_end).getTime()
          : undefined,
      });
    }

    return { status: data.status };
  },
});

export const createCustomerPortal = action({
  args: {},
  handler: async (ctx): Promise<{ portalUrl: string }> => {
    const userId = await ctx.runQuery(internal.payments.getCurrentUserIdQuery);

    const subscription = await ctx.runQuery(
      internal.payments.getUserSubscription,
      { userId }
    );

    if (!subscription) {
      throw new ConvexError({
        code: "NO_SUBSCRIPTION",
        message: "No active subscription found.",
      });
    }

    const apiKey = process.env.CREEM_API_KEY;
    const baseUrl = process.env.CREEM_API_BASE_URL;

    if (!apiKey || !baseUrl) {
      throw new Error("Payment configuration missing");
    }

    const response = await fetch(`${baseUrl}/billing-portal`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        subscription_id: subscription.creemSubscriptionId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Creem API error: ${response.status}`);
    }

    const data = await response.json();
    return { portalUrl: data.portal_url as string };
  },
});

// ==================== INTERNAL QUERIES ====================

export const getCurrentUserIdQuery = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await getCurrentUserId(ctx);
  },
});

export const getUserSubscription = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
  },
});

export const getUserById = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

// ==================== INTERNAL MUTATIONS ====================

export const upsertSubscription = internalMutation({
  args: {
    userId: v.id("users"),
    creemSubscriptionId: v.string(),
    creemCustomerId: v.string(),
    status: v.union(
      v.literal("trialing"),
      v.literal("active"),
      v.literal("past_due"),
      v.literal("canceled"),
      v.literal("expired")
    ),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    trialEnd: v.optional(v.number()),
    cancelAtPeriodEnd: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check for existing subscription
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        creemSubscriptionId: args.creemSubscriptionId,
        creemCustomerId: args.creemCustomerId,
        status: args.status,
        currentPeriodStart: args.currentPeriodStart,
        currentPeriodEnd: args.currentPeriodEnd,
        trialEnd: args.trialEnd,
        cancelAtPeriodEnd: args.cancelAtPeriodEnd ?? false,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("subscriptions", {
        userId: args.userId,
        creemSubscriptionId: args.creemSubscriptionId,
        creemCustomerId: args.creemCustomerId,
        status: args.status,
        plan: "pro",
        currentPeriodStart: args.currentPeriodStart,
        currentPeriodEnd: args.currentPeriodEnd,
        trialEnd: args.trialEnd,
        cancelAtPeriodEnd: args.cancelAtPeriodEnd ?? false,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Update denormalized status on user
    const userStatus =
      args.status === "active"
        ? ("pro" as const)
        : args.status === "trialing"
          ? ("trialing" as const)
          : args.status === "past_due"
            ? ("past_due" as const)
            : args.status === "expired"
              ? ("expired" as const)
              : ("free" as const);

    await ctx.db.patch(args.userId, {
      subscriptionStatus: userStatus,
      updatedAt: now,
    });
  },
});

export const recordWebhookEvent = internalMutation({
  args: {
    eventId: v.string(),
    eventType: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("webhookEvents", {
      eventId: args.eventId,
      eventType: args.eventType,
      processedAt: Date.now(),
    });
  },
});

export const checkWebhookProcessed = internalQuery({
  args: { eventId: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("webhookEvents")
      .withIndex("by_event_id", (q) => q.eq("eventId", args.eventId))
      .first();
    return !!existing;
  },
});

export const updateSubscriptionByCreemId = internalMutation({
  args: {
    creemSubscriptionId: v.string(),
    status: v.optional(
      v.union(
        v.literal("trialing"),
        v.literal("active"),
        v.literal("past_due"),
        v.literal("canceled"),
        v.literal("expired")
      )
    ),
    currentPeriodStart: v.optional(v.number()),
    currentPeriodEnd: v.optional(v.number()),
    cancelAtPeriodEnd: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_creem_subscription", (q) =>
        q.eq("creemSubscriptionId", args.creemSubscriptionId)
      )
      .first();

    if (!subscription) return;

    const updates: Record<string, any> = { updatedAt: Date.now() };
    if (args.status) updates.status = args.status;
    if (args.currentPeriodStart)
      updates.currentPeriodStart = args.currentPeriodStart;
    if (args.currentPeriodEnd)
      updates.currentPeriodEnd = args.currentPeriodEnd;
    if (args.cancelAtPeriodEnd !== undefined)
      updates.cancelAtPeriodEnd = args.cancelAtPeriodEnd;

    await ctx.db.patch(subscription._id, updates);

    // Update denormalized user status
    if (args.status) {
      const userStatus =
        args.status === "active"
          ? ("pro" as const)
          : args.status === "trialing"
            ? ("trialing" as const)
            : args.status === "past_due"
              ? ("past_due" as const)
              : args.status === "expired"
                ? ("expired" as const)
                : ("free" as const);

      await ctx.db.patch(subscription.userId, {
        subscriptionStatus: userStatus,
        updatedAt: Date.now(),
      });
    }
  },
});
