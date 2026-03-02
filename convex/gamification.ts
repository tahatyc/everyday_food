// ============================================
// Gamification — Queries, Mutations, Internal Actions
// ============================================

import { query, mutation, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { getCurrentUserId, getCurrentUserIdOrNull } from "./lib/accessControl";
import { calculateLevel, evaluateCondition } from "./lib/gamificationHelpers";
import { trackAction } from "./lib/gamificationEngine";

// ==================== QUERIES ====================

/** Get the current user's gamification profile */
export const getProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getCurrentUserIdOrNull(ctx);
    if (!userId) return null;

    const profile = await ctx.db
      .query("gamificationProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!profile) {
      // Return default profile for users who haven't started
      return {
        xp: 0,
        level: 1,
        title: "Home Cook",
        xpForNext: 100,
        xpProgress: 0,
        currentStreak: 0,
        longestStreak: 0,
        showcaseBadges: [],
      };
    }

    const levelInfo = calculateLevel(profile.xp);

    return {
      xp: profile.xp,
      level: levelInfo.level,
      title: levelInfo.title,
      xpForNext: levelInfo.xpForNext,
      xpProgress: levelInfo.xpProgress,
      currentStreak: profile.currentStreak,
      longestStreak: profile.longestStreak,
      showcaseBadges: profile.showcaseBadges || [],
    };
  },
});

/** Get achievements with progress for the current user */
export const getAchievements = query({
  args: { category: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserIdOrNull(ctx);
    if (!userId) return [];

    // Get all active achievement definitions
    let definitions = await ctx.db
      .query("achievementDefinitions")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    if (args.category) {
      definitions = definitions.filter((d) => d.category === args.category);
    }

    // Sort by sortOrder
    definitions.sort((a, b) => a.sortOrder - b.sortOrder);

    // Get user's unlocked achievements
    const userAchievements = await ctx.db
      .query("userAchievements")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const unlockedMap = new Map(
      userAchievements.map((ua) => [ua.achievementId.toString(), ua])
    );

    // Get profile for progress evaluation
    const profile = await ctx.db
      .query("gamificationProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const actionCounts = (profile?.actionCounts as Record<string, number>) || {};
    const uniqueSets = (profile?.uniqueSets as Record<string, string[]>) || {};

    return definitions.map((def) => {
      const unlocked = unlockedMap.get(def._id.toString());
      const condition = def.condition as any;

      const { progress, total } = profile
        ? evaluateCondition(condition, {
            actionCounts,
            uniqueSets,
            currentStreak: profile.currentStreak,
            xp: profile.xp,
            level: profile.level,
          })
        : { progress: 0, total: condition.threshold || 1 };

      return {
        _id: def._id,
        key: def.key,
        name: def.name,
        description: def.description,
        icon: def.icon,
        category: def.category,
        tier: def.tier,
        xpReward: def.xpReward,
        isUnlocked: !!unlocked,
        unlockedAt: unlocked?.unlockedAt,
        progress,
        total,
        progressPercent: total > 0 ? Math.min(Math.round((progress / total) * 100), 100) : 0,
      };
    });
  },
});

/** Get active challenges with user progress */
export const getActiveChallenges = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getCurrentUserIdOrNull(ctx);
    if (!userId) return [];

    const now = Date.now();

    const challenges = await ctx.db
      .query("challengeDefinitions")
      .withIndex("by_active_and_dates", (q) => q.eq("isActive", true))
      .collect();

    // Filter to currently active challenges
    const activeChallenges = challenges.filter(
      (c) => c.startsAt <= now && c.endsAt > now
    );

    // Get user's challenge progress
    const userChallenges = await ctx.db
      .query("userChallenges")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const progressMap = new Map(
      userChallenges.map((uc) => [uc.challengeId.toString(), uc])
    );

    return activeChallenges.map((challenge) => {
      const userProgress = progressMap.get(challenge._id.toString());
      const condition = challenge.condition as any;
      const total = condition.threshold || 1;

      return {
        _id: challenge._id,
        key: challenge.key,
        name: challenge.name,
        description: challenge.description,
        icon: challenge.icon,
        type: challenge.type,
        xpReward: challenge.xpReward,
        userProgress: userProgress?.progress || 0,
        total,
        isCompleted: userProgress?.isCompleted || false,
        timeRemaining: challenge.endsAt - now,
        endsAt: challenge.endsAt,
      };
    });
  },
});

/** Get leaderboard (friends or global) */
export const getLeaderboard = query({
  args: {
    type: v.union(v.literal("friends"), v.literal("global")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserIdOrNull(ctx);
    if (!userId) return [];

    const limit = Math.min(args.limit || 20, 50);

    if (args.type === "friends") {
      // Get accepted friendships
      const friendships = await ctx.db
        .query("friendships")
        .withIndex("by_user_and_status", (q) =>
          q.eq("userId", userId).eq("status", "accepted")
        )
        .collect();

      const friendIds = friendships.map((f) => f.friendId);
      const allIds = [userId, ...friendIds];

      // Fetch profiles for all
      const profiles = await Promise.all(
        allIds.map(async (id) => {
          const profile = await ctx.db
            .query("gamificationProfiles")
            .withIndex("by_user", (q) => q.eq("userId", id))
            .first();

          const user = await ctx.db.get(id);

          const levelInfo = calculateLevel(profile?.xp || 0);

          return {
            userId: id,
            name: user?.name || "Unknown",
            imageUrl: user?.imageUrl,
            xp: profile?.xp || 0,
            level: levelInfo.level,
            title: levelInfo.title,
          };
        })
      );

      return profiles.sort((a, b) => b.xp - a.xp).slice(0, limit);
    } else {
      // Global leaderboard - query by XP index
      const profiles = await ctx.db
        .query("gamificationProfiles")
        .withIndex("by_xp")
        .order("desc")
        .take(limit);

      return Promise.all(
        profiles.map(async (profile) => {
          const user = await ctx.db.get(profile.userId);
          const levelInfo = calculateLevel(profile.xp);

          return {
            userId: profile.userId,
            name: user?.name || "Unknown",
            imageUrl: user?.imageUrl,
            xp: profile.xp,
            level: levelInfo.level,
            title: levelInfo.title,
          };
        })
      );
    }
  },
});

/** Get recent activity feed */
export const getActivityFeed = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserIdOrNull(ctx);
    if (!userId) return [];

    const limit = Math.min(args.limit || 20, 50);

    const activities = await ctx.db
      .query("activityLog")
      .withIndex("by_user_and_timestamp", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);

    return activities.map((a) => ({
      action: a.action,
      metadata: a.metadata,
      xpEarned: a.xpEarned,
      timestamp: a.timestamp,
    }));
  },
});

/** Get comprehensive gamification stats */
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getCurrentUserIdOrNull(ctx);
    if (!userId) return null;

    const profile = await ctx.db
      .query("gamificationProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const actionCounts = (profile?.actionCounts as Record<string, number>) || {};
    const uniqueSets = (profile?.uniqueSets as Record<string, string[]>) || {};

    const levelInfo = calculateLevel(profile?.xp || 0);

    // Count achievements
    const userAchievements = await ctx.db
      .query("userAchievements")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const totalAchievements = await ctx.db
      .query("achievementDefinitions")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    return {
      totalXp: profile?.xp || 0,
      level: levelInfo.level,
      title: levelInfo.title,
      xpForNext: levelInfo.xpForNext,
      xpProgress: levelInfo.xpProgress,
      achievementsUnlocked: userAchievements.length,
      totalAchievements: totalAchievements.length,
      currentStreak: profile?.currentStreak || 0,
      longestStreak: profile?.longestStreak || 0,
      cuisinesExplored: uniqueSets.cuisines?.length || 0,
      totalCooks: actionCounts.cook_complete || 0,
      totalMealsPlanned: actionCounts.meal_plan_add || 0,
      totalRecipesCreated: actionCounts.recipe_create || 0,
      totalShares: actionCounts.recipe_share || 0,
    };
  },
});

// ==================== MUTATIONS ====================

/** Update showcase badges (max 5) */
export const updateShowcaseBadges = mutation({
  args: { badgeIds: v.array(v.id("userAchievements")) },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);

    if (args.badgeIds.length > 5) {
      throw new Error("Maximum 5 showcase badges allowed");
    }

    // Verify all badges belong to the user
    for (const badgeId of args.badgeIds) {
      const badge = await ctx.db.get(badgeId);
      if (!badge || badge.userId !== userId) {
        throw new Error("Invalid badge");
      }
    }

    const profile = await ctx.db
      .query("gamificationProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!profile) throw new Error("Profile not found");

    await ctx.db.patch(profile._id, {
      showcaseBadges: args.badgeIds,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// ==================== INTERNAL MUTATIONS ====================

/** Process a gamification action (called via scheduler for async processing) */
export const processAction = internalMutation({
  args: {
    userId: v.id("users"),
    action: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return trackAction(ctx, args.userId, args.action, args.metadata || {});
  },
});

/** Seed initial achievement definitions */
export const seedAchievements = internalMutation({
  args: {},
  handler: async (ctx) => {
    const achievements = [
      {
        key: "first_flame",
        name: "First Flame",
        description: "Cook your first recipe in Cook Mode",
        icon: "flame",
        category: "cooking" as const,
        tier: "bronze" as const,
        xpReward: 25,
        condition: { type: "count", action: "cook_complete", threshold: 1 },
        sortOrder: 1,
      },
      {
        key: "five_star_cook",
        name: "Five Star Cook",
        description: "Cook 5 recipes",
        icon: "star",
        category: "cooking" as const,
        tier: "silver" as const,
        xpReward: 50,
        condition: { type: "count", action: "cook_complete", threshold: 5 },
        sortOrder: 2,
      },
      {
        key: "iron_chef",
        name: "Iron Chef",
        description: "Cook 100 recipes — a true kitchen master",
        icon: "trophy",
        category: "cooking" as const,
        tier: "platinum" as const,
        xpReward: 500,
        condition: { type: "count", action: "cook_complete", threshold: 100 },
        sortOrder: 3,
      },
      {
        key: "world_traveler",
        name: "World Traveler",
        description: "Cook recipes from 10 different cuisines",
        icon: "globe",
        category: "exploration" as const,
        tier: "gold" as const,
        xpReward: 200,
        condition: { type: "unique_count", action: "cook_complete", field: "cuisines", threshold: 10 },
        sortOrder: 4,
      },
      {
        key: "recipe_creator",
        name: "Recipe Creator",
        description: "Create your first recipe",
        icon: "create",
        category: "cooking" as const,
        tier: "bronze" as const,
        xpReward: 25,
        condition: { type: "count", action: "recipe_create", threshold: 1 },
        sortOrder: 5,
      },
      {
        key: "cookbook_author",
        name: "Cookbook Author",
        description: "Create 10 original recipes",
        icon: "book",
        category: "cooking" as const,
        tier: "gold" as const,
        xpReward: 150,
        condition: { type: "count", action: "recipe_create", threshold: 10 },
        sortOrder: 6,
      },
      {
        key: "meal_planner",
        name: "Meal Planner",
        description: "Plan your first meal",
        icon: "calendar",
        category: "planning" as const,
        tier: "bronze" as const,
        xpReward: 15,
        condition: { type: "count", action: "meal_plan_add", threshold: 1 },
        sortOrder: 7,
      },
      {
        key: "meal_prep_master",
        name: "Meal Prep Master",
        description: "Complete 4 full weeks of meal planning",
        icon: "calendar-outline",
        category: "planning" as const,
        tier: "gold" as const,
        xpReward: 200,
        condition: { type: "count", action: "meal_plan_week_complete", threshold: 4 },
        sortOrder: 8,
      },
      {
        key: "grocery_guru",
        name: "Grocery Guru",
        description: "Complete 20 shopping lists",
        icon: "cart",
        category: "planning" as const,
        tier: "silver" as const,
        xpReward: 100,
        condition: { type: "count", action: "shopping_list_complete", threshold: 20 },
        sortOrder: 9,
      },
      {
        key: "social_butterfly",
        name: "Social Butterfly",
        description: "Share 10 recipes with friends",
        icon: "share-social",
        category: "social" as const,
        tier: "silver" as const,
        xpReward: 100,
        condition: { type: "count", action: "recipe_share", threshold: 10 },
        sortOrder: 10,
      },
      {
        key: "streak_starter",
        name: "Streak Starter",
        description: "Cook for 3 days in a row",
        icon: "flame",
        category: "streak" as const,
        tier: "bronze" as const,
        xpReward: 50,
        condition: { type: "streak", action: "cook_complete", threshold: 3 },
        sortOrder: 11,
      },
      {
        key: "week_warrior",
        name: "Week Warrior",
        description: "Cook for 7 days in a row",
        icon: "flame",
        category: "streak" as const,
        tier: "silver" as const,
        xpReward: 100,
        condition: { type: "streak", action: "cook_complete", threshold: 7 },
        sortOrder: 12,
      },
      {
        key: "monthly_master",
        name: "Monthly Master",
        description: "Cook for 30 days in a row — unstoppable!",
        icon: "flame",
        category: "streak" as const,
        tier: "gold" as const,
        xpReward: 500,
        condition: { type: "streak", action: "cook_complete", threshold: 30 },
        sortOrder: 13,
      },
      {
        key: "breakfast_champion",
        name: "Breakfast Champion",
        description: "Plan 7 breakfast meals",
        icon: "sunny",
        category: "cooking" as const,
        tier: "silver" as const,
        xpReward: 75,
        condition: { type: "count", action: "meal_plan_add", threshold: 7 },
        sortOrder: 14,
      },
    ];

    const now = Date.now();

    for (const achievement of achievements) {
      // Check if already exists
      const existing = await ctx.db
        .query("achievementDefinitions")
        .withIndex("by_key", (q) => q.eq("key", achievement.key))
        .first();

      if (!existing) {
        await ctx.db.insert("achievementDefinitions", {
          ...achievement,
          isActive: true,
          createdAt: now,
        });
      }
    }

    return { success: true, count: achievements.length };
  },
});
