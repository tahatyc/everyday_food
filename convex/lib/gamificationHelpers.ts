// ============================================
// Gamification Helpers — Level calc, XP tables, condition evaluation
// ============================================

// Level titles by level number
const LEVEL_TITLES: Record<number, string> = {
  1: "Home Cook",
  2: "Kitchen Helper",
  3: "Line Cook",
  4: "Prep Chef",
  5: "Station Chef",
  6: "Sous Chef",
  7: "Head Chef",
  8: "Executive Chef",
  9: "Master Chef",
  10: "Culinary Legend",
};

// Formula: XP_for_level(n) = round(50 * n * (n + 1) / 2)
function xpRequiredForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.round(50 * level * (level + 1) / 2);
}

/**
 * Calculate current level info from total XP.
 */
export function calculateLevel(xp: number): {
  level: number;
  title: string;
  xpForNext: number;
  xpProgress: number;
  xpForCurrentLevel: number;
} {
  let level = 1;
  while (level < 10 && xp >= xpRequiredForLevel(level + 1)) {
    level++;
  }

  const currentLevelXp = xpRequiredForLevel(level);
  const nextLevelXp = level < 10 ? xpRequiredForLevel(level + 1) : xpRequiredForLevel(level);
  const xpProgress = xp - currentLevelXp;
  const xpForNext = nextLevelXp - currentLevelXp;

  return {
    level,
    title: LEVEL_TITLES[level] || "Culinary Legend",
    xpForNext: level >= 10 ? 0 : xpForNext,
    xpProgress: level >= 10 ? 0 : xpProgress,
    xpForCurrentLevel: currentLevelXp,
  };
}

// ==================== XP REWARD TABLE ====================

const BASE_XP: Record<string, number> = {
  cook_complete: 50,
  meal_plan_add: 10,
  meal_plan_week_complete: 100,
  shopping_list_complete: 20,
  recipe_create: 30,
  recipe_share: 15,
  friend_added: 10,
  share_link_created: 10,
  daily_login: 5,
  recipe_favorite: 5,
};

/**
 * Calculate XP for an action, including bonus conditions.
 */
export function calculateXP(
  action: string,
  metadata: Record<string, any> = {},
  profile?: { actionCounts?: Record<string, number>; uniqueSets?: Record<string, string[]> }
): number {
  let xp = BASE_XP[action] || 0;

  if (action === "cook_complete") {
    // +25 if new cuisine
    if (metadata.cuisine && profile?.uniqueSets?.cuisines) {
      if (!profile.uniqueSets.cuisines.includes(metadata.cuisine.toLowerCase())) {
        xp += 25;
      }
    }
    // +10 if hard difficulty
    if (metadata.difficulty === "hard") {
      xp += 10;
    }
  }

  return xp;
}

// ==================== CONDITION EVALUATION ====================

export interface AchievementCondition {
  type: "count" | "streak" | "unique_count" | "threshold" | "compound";
  action?: string;
  threshold?: number;
  field?: string;
  filters?: Record<string, string>;
  operator?: "and" | "or";
  conditions?: AchievementCondition[];
}

/**
 * Evaluate an achievement condition against denormalized profile data.
 * Returns { met, progress, total }.
 */
export function evaluateCondition(
  condition: AchievementCondition,
  profile: {
    actionCounts?: Record<string, number>;
    uniqueSets?: Record<string, string[]>;
    currentStreak: number;
    xp: number;
    level: number;
  }
): { met: boolean; progress: number; total: number } {
  const actionCounts = profile.actionCounts || {};
  const uniqueSets = profile.uniqueSets || {};

  switch (condition.type) {
    case "count": {
      const count = actionCounts[condition.action || ""] || 0;
      const threshold = condition.threshold || 1;
      return {
        met: count >= threshold,
        progress: Math.min(count, threshold),
        total: threshold,
      };
    }

    case "streak": {
      const currentStreak = profile.currentStreak;
      const threshold = condition.threshold || 1;
      return {
        met: currentStreak >= threshold,
        progress: Math.min(currentStreak, threshold),
        total: threshold,
      };
    }

    case "unique_count": {
      const field = condition.field || "";
      const values = uniqueSets[field] || [];
      const threshold = condition.threshold || 1;
      return {
        met: values.length >= threshold,
        progress: Math.min(values.length, threshold),
        total: threshold,
      };
    }

    case "threshold": {
      const field = condition.field || "";
      let value = 0;
      if (field === "xp") value = profile.xp;
      else if (field === "level") value = profile.level;
      const threshold = condition.threshold || 1;
      return {
        met: value >= threshold,
        progress: Math.min(value, threshold),
        total: threshold,
      };
    }

    case "compound": {
      const subConditions = condition.conditions || [];
      const results = subConditions.map((c) => evaluateCondition(c, profile));

      if (condition.operator === "and") {
        const met = results.every((r) => r.met);
        const totalProgress = results.reduce((sum, r) => sum + r.progress, 0);
        const totalRequired = results.reduce((sum, r) => sum + r.total, 0);
        return { met, progress: totalProgress, total: totalRequired };
      } else {
        // "or"
        const met = results.some((r) => r.met);
        const best = results.reduce((prev, curr) =>
          curr.progress / curr.total > prev.progress / prev.total ? curr : prev
        );
        return { met, progress: best.progress, total: best.total };
      }
    }

    default:
      return { met: false, progress: 0, total: 1 };
  }
}

// ==================== STREAK HELPERS ====================

/**
 * Get yesterday's date string from a given date string.
 */
export function getYesterday(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00Z");
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().split("T")[0];
}

/**
 * Get today's date as YYYY-MM-DD string.
 */
export function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Calculate streak update based on last activity date and current local date.
 */
export function calculateStreakUpdate(
  currentStreak: number,
  longestStreak: number,
  lastActivityDate: string | undefined,
  localDate: string
): { currentStreak: number; longestStreak: number; lastActivityDate: string } {
  if (lastActivityDate === localDate) {
    // Already tracked today, no change
    return { currentStreak, longestStreak, lastActivityDate: localDate };
  }

  const yesterday = getYesterday(localDate);
  if (lastActivityDate === yesterday) {
    // Continue streak
    const newStreak = currentStreak + 1;
    return {
      currentStreak: newStreak,
      longestStreak: Math.max(longestStreak, newStreak),
      lastActivityDate: localDate,
    };
  }

  // Streak broken — reset to 1
  return {
    currentStreak: 1,
    longestStreak: Math.max(longestStreak, 1),
    lastActivityDate: localDate,
  };
}

// ==================== STREAK BONUS XP ====================

/**
 * Check if streak milestones were hit and return bonus XP.
 */
export function getStreakBonusXP(newStreak: number, oldStreak: number): number {
  let bonus = 0;
  // 7-day streak bonus
  if (newStreak >= 7 && oldStreak < 7) {
    bonus += 100;
  }
  // 30-day streak bonus
  if (newStreak >= 30 && oldStreak < 30) {
    bonus += 500;
  }
  return bonus;
}
