// ============================================
// Gamification Engine — trackAction core engine
// Called as an internal mutation via scheduler for async processing
// ============================================

import { MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import {
  calculateLevel,
  calculateXP,
  evaluateCondition,
  calculateStreakUpdate,
  getStreakBonusXP,
  getTodayDateString,
} from "./gamificationHelpers";

/**
 * Core gamification engine. Processes an action and returns gamification results.
 * Called by the internal processAction mutation.
 */
export async function trackAction(
  ctx: MutationCtx,
  userId: Id<"users">,
  action: string,
  metadata: Record<string, any> = {}
): Promise<{
  xpEarned: number;
  newLevel: number | null;
  newAchievements: string[];
  streakUpdate: { currentStreak: number; longestStreak: number } | null;
}> {
  const now = Date.now();
  const localDate = metadata.localDate || getTodayDateString();

  // 1. Get or create gamification profile
  let profile = await ctx.db
    .query("gamificationProfiles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();

  if (!profile) {
    const profileId = await ctx.db.insert("gamificationProfiles", {
      userId,
      xp: 0,
      level: 1,
      currentStreak: 0,
      longestStreak: 0,
      actionCounts: {},
      uniqueSets: {},
      createdAt: now,
      updatedAt: now,
    });
    profile = await ctx.db.get(profileId);
    if (!profile) throw new Error("Failed to create gamification profile");
  }

  const actionCounts: Record<string, number> = (profile.actionCounts as Record<string, number>) || {};
  const uniqueSets: Record<string, string[]> = (profile.uniqueSets as Record<string, string[]>) || {};

  // 2. Calculate XP
  const xpEarned = calculateXP(action, metadata, { actionCounts, uniqueSets });

  // 3. Update action counts
  actionCounts[action] = (actionCounts[action] || 0) + 1;

  // 4. Update unique sets
  if (action === "cook_complete" && metadata.cuisine) {
    if (!uniqueSets.cuisines) uniqueSets.cuisines = [];
    const cuisineLower = metadata.cuisine.toLowerCase();
    if (!uniqueSets.cuisines.includes(cuisineLower)) {
      uniqueSets.cuisines.push(cuisineLower);
    }
  }

  // 5. Update streak (only for cook_complete)
  let streakUpdate = null;
  let streakBonusXP = 0;
  if (action === "cook_complete") {
    const oldStreak = profile.currentStreak;
    const streakResult = calculateStreakUpdate(
      profile.currentStreak,
      profile.longestStreak,
      profile.lastActivityDate || undefined,
      localDate
    );
    streakUpdate = {
      currentStreak: streakResult.currentStreak,
      longestStreak: streakResult.longestStreak,
    };
    streakBonusXP = getStreakBonusXP(streakResult.currentStreak, oldStreak);
  }

  // 6. Calculate total XP
  const totalXpEarned = xpEarned + streakBonusXP;
  const newTotalXp = profile.xp + totalXpEarned;

  // 7. Calculate new level
  const oldLevel = profile.level;
  const { level: newLevel } = calculateLevel(newTotalXp);
  const leveledUp = newLevel > oldLevel;

  // 8. Update profile
  await ctx.db.patch(profile._id, {
    xp: newTotalXp,
    level: newLevel,
    currentStreak: streakUpdate?.currentStreak ?? profile.currentStreak,
    longestStreak: streakUpdate?.longestStreak ?? profile.longestStreak,
    lastActivityDate: action === "cook_complete" ? localDate : profile.lastActivityDate,
    actionCounts,
    uniqueSets,
    updatedAt: now,
  });

  // 9. Log activity
  await ctx.db.insert("activityLog", {
    userId,
    action,
    metadata,
    xpEarned: totalXpEarned,
    timestamp: now,
  });

  // 10. Check achievements
  const newAchievements: string[] = [];

  const activeAchievements = await ctx.db
    .query("achievementDefinitions")
    .withIndex("by_active", (q) => q.eq("isActive", true))
    .collect();

  // Filter to only achievements the user hasn't unlocked yet
  const userAchievements = await ctx.db
    .query("userAchievements")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();

  const unlockedIds = new Set(userAchievements.map((ua) => ua.achievementId.toString()));

  for (const achievement of activeAchievements) {
    if (unlockedIds.has(achievement._id.toString())) continue;

    // Early-exit: skip achievements not related to this action
    const condition = achievement.condition as any;
    if (condition.action && condition.action !== action && condition.type !== "compound") {
      continue;
    }

    const result = evaluateCondition(condition, {
      actionCounts,
      uniqueSets,
      currentStreak: streakUpdate?.currentStreak ?? profile.currentStreak,
      xp: newTotalXp,
      level: newLevel,
    });

    if (result.met) {
      // Unlock achievement
      await ctx.db.insert("userAchievements", {
        userId,
        achievementId: achievement._id,
        unlockedAt: now,
        progress: result.total,
      });

      // Award bonus XP
      const bonusXp = achievement.xpReward;
      const updatedProfile = await ctx.db.get(profile._id);
      if (updatedProfile) {
        const updatedTotalXp = updatedProfile.xp + bonusXp;
        const { level: updatedLevel } = calculateLevel(updatedTotalXp);
        await ctx.db.patch(profile._id, {
          xp: updatedTotalXp,
          level: updatedLevel,
          updatedAt: now,
        });
      }

      newAchievements.push(achievement.key);
    }
  }

  return {
    xpEarned: totalXpEarned,
    newLevel: leveledUp ? newLevel : null,
    newAchievements,
    streakUpdate,
  };
}
