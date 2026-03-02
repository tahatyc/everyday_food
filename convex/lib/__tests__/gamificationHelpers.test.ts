import {
  calculateLevel,
  calculateXP,
  evaluateCondition,
  getYesterday,
  getTodayDateString,
  calculateStreakUpdate,
  getStreakBonusXP,
  AchievementCondition,
} from "../gamificationHelpers";

// ==================== calculateLevel ====================

describe("calculateLevel", () => {
  it("returns level 1 for 0 XP", () => {
    const result = calculateLevel(0);
    expect(result.level).toBe(1);
    expect(result.title).toBe("Home Cook");
  });

  it("returns level 1 for XP below level 2 threshold", () => {
    const result = calculateLevel(100);
    expect(result.level).toBe(1);
    expect(result.title).toBe("Home Cook");
  });

  it("returns level 2 at 150 XP (threshold for level 2)", () => {
    // xpRequiredForLevel(2) = round(50 * 2 * 3 / 2) = 150
    const result = calculateLevel(150);
    expect(result.level).toBe(2);
    expect(result.title).toBe("Kitchen Helper");
  });

  it("returns level 3 at 300 XP", () => {
    // xpRequiredForLevel(3) = round(50 * 3 * 4 / 2) = 300
    const result = calculateLevel(300);
    expect(result.level).toBe(3);
    expect(result.title).toBe("Line Cook");
  });

  it("returns level 10 at max XP", () => {
    // xpRequiredForLevel(10) = round(50 * 10 * 11 / 2) = 2750
    const result = calculateLevel(2750);
    expect(result.level).toBe(10);
    expect(result.title).toBe("Culinary Legend");
  });

  it("returns level 10 for XP far above max", () => {
    const result = calculateLevel(99999);
    expect(result.level).toBe(10);
    expect(result.title).toBe("Culinary Legend");
  });

  it("returns 0 for xpForNext and xpProgress at max level", () => {
    const result = calculateLevel(5000);
    expect(result.level).toBe(10);
    expect(result.xpForNext).toBe(0);
    expect(result.xpProgress).toBe(0);
  });

  it("returns correct xpProgress and xpForNext mid-level", () => {
    // Level 2 starts at 150, level 3 at 300 → xpForNext = 150, xpProgress = 49
    const result = calculateLevel(199);
    expect(result.level).toBe(2);
    expect(result.xpProgress).toBe(49);
    expect(result.xpForNext).toBe(150);
  });

  it("returns xpForCurrentLevel correctly", () => {
    const result = calculateLevel(300);
    expect(result.xpForCurrentLevel).toBe(300); // level 3 starts at 300
  });

  it("handles negative XP gracefully", () => {
    const result = calculateLevel(-10);
    expect(result.level).toBe(1);
    expect(result.title).toBe("Home Cook");
  });
});

// ==================== calculateXP ====================

describe("calculateXP", () => {
  it("returns base XP for cook_complete", () => {
    expect(calculateXP("cook_complete")).toBe(50);
  });

  it("returns base XP for meal_plan_add", () => {
    expect(calculateXP("meal_plan_add")).toBe(10);
  });

  it("returns base XP for recipe_create", () => {
    expect(calculateXP("recipe_create")).toBe(30);
  });

  it("returns base XP for recipe_share", () => {
    expect(calculateXP("recipe_share")).toBe(15);
  });

  it("returns base XP for friend_added", () => {
    expect(calculateXP("friend_added")).toBe(10);
  });

  it("returns base XP for shopping_list_complete", () => {
    expect(calculateXP("shopping_list_complete")).toBe(20);
  });

  it("returns base XP for daily_login", () => {
    expect(calculateXP("daily_login")).toBe(5);
  });

  it("returns base XP for recipe_favorite", () => {
    expect(calculateXP("recipe_favorite")).toBe(5);
  });

  it("returns 0 for unknown action", () => {
    expect(calculateXP("unknown_action")).toBe(0);
  });

  it("adds +25 bonus for new cuisine on cook_complete", () => {
    const profile = {
      actionCounts: {},
      uniqueSets: { cuisines: ["italian"] },
    };
    const xp = calculateXP("cook_complete", { cuisine: "Thai" }, profile);
    expect(xp).toBe(75); // 50 base + 25 new cuisine
  });

  it("does not add cuisine bonus for existing cuisine", () => {
    const profile = {
      actionCounts: {},
      uniqueSets: { cuisines: ["thai"] },
    };
    const xp = calculateXP("cook_complete", { cuisine: "Thai" }, profile);
    expect(xp).toBe(50); // 50 base only — "thai" already exists (lowercased)
  });

  it("adds +10 bonus for hard difficulty on cook_complete", () => {
    const xp = calculateXP("cook_complete", { difficulty: "hard" });
    expect(xp).toBe(60); // 50 base + 10 hard
  });

  it("stacks both new cuisine and hard difficulty bonuses", () => {
    const profile = {
      actionCounts: {},
      uniqueSets: { cuisines: [] },
    };
    const xp = calculateXP(
      "cook_complete",
      { cuisine: "Japanese", difficulty: "hard" },
      profile
    );
    expect(xp).toBe(85); // 50 + 25 + 10
  });

  it("does not add bonuses for non-cook_complete actions", () => {
    const profile = {
      actionCounts: {},
      uniqueSets: { cuisines: [] },
    };
    const xp = calculateXP(
      "recipe_create",
      { cuisine: "Italian", difficulty: "hard" },
      profile
    );
    expect(xp).toBe(30); // base only
  });
});

// ==================== evaluateCondition ====================

describe("evaluateCondition", () => {
  const baseProfile = {
    actionCounts: {},
    uniqueSets: {},
    currentStreak: 0,
    xp: 0,
    level: 1,
  };

  describe("count condition", () => {
    it("returns met when count meets threshold", () => {
      const condition: AchievementCondition = {
        type: "count",
        action: "cook_complete",
        threshold: 5,
      };
      const profile = { ...baseProfile, actionCounts: { cook_complete: 5 } };
      const result = evaluateCondition(condition, profile);
      expect(result.met).toBe(true);
      expect(result.progress).toBe(5);
      expect(result.total).toBe(5);
    });

    it("returns not met when count is below threshold", () => {
      const condition: AchievementCondition = {
        type: "count",
        action: "cook_complete",
        threshold: 10,
      };
      const profile = { ...baseProfile, actionCounts: { cook_complete: 3 } };
      const result = evaluateCondition(condition, profile);
      expect(result.met).toBe(false);
      expect(result.progress).toBe(3);
      expect(result.total).toBe(10);
    });

    it("caps progress at threshold", () => {
      const condition: AchievementCondition = {
        type: "count",
        action: "cook_complete",
        threshold: 5,
      };
      const profile = { ...baseProfile, actionCounts: { cook_complete: 100 } };
      const result = evaluateCondition(condition, profile);
      expect(result.progress).toBe(5);
    });

    it("handles missing action count as 0", () => {
      const condition: AchievementCondition = {
        type: "count",
        action: "cook_complete",
        threshold: 1,
      };
      const result = evaluateCondition(condition, baseProfile);
      expect(result.met).toBe(false);
      expect(result.progress).toBe(0);
    });
  });

  describe("streak condition", () => {
    it("returns met when streak meets threshold", () => {
      const condition: AchievementCondition = {
        type: "streak",
        threshold: 7,
      };
      const profile = { ...baseProfile, currentStreak: 7 };
      const result = evaluateCondition(condition, profile);
      expect(result.met).toBe(true);
      expect(result.progress).toBe(7);
      expect(result.total).toBe(7);
    });

    it("returns not met when streak is below threshold", () => {
      const condition: AchievementCondition = {
        type: "streak",
        threshold: 7,
      };
      const profile = { ...baseProfile, currentStreak: 3 };
      const result = evaluateCondition(condition, profile);
      expect(result.met).toBe(false);
      expect(result.progress).toBe(3);
    });
  });

  describe("unique_count condition", () => {
    it("returns met when unique values meet threshold", () => {
      const condition: AchievementCondition = {
        type: "unique_count",
        field: "cuisines",
        threshold: 3,
      };
      const profile = {
        ...baseProfile,
        uniqueSets: { cuisines: ["italian", "thai", "japanese"] },
      };
      const result = evaluateCondition(condition, profile);
      expect(result.met).toBe(true);
      expect(result.progress).toBe(3);
    });

    it("returns not met when unique values are below threshold", () => {
      const condition: AchievementCondition = {
        type: "unique_count",
        field: "cuisines",
        threshold: 10,
      };
      const profile = {
        ...baseProfile,
        uniqueSets: { cuisines: ["italian", "thai"] },
      };
      const result = evaluateCondition(condition, profile);
      expect(result.met).toBe(false);
      expect(result.progress).toBe(2);
      expect(result.total).toBe(10);
    });

    it("handles missing field as empty array", () => {
      const condition: AchievementCondition = {
        type: "unique_count",
        field: "cuisines",
        threshold: 1,
      };
      const result = evaluateCondition(condition, baseProfile);
      expect(result.met).toBe(false);
      expect(result.progress).toBe(0);
    });
  });

  describe("threshold condition", () => {
    it("returns met when xp meets threshold", () => {
      const condition: AchievementCondition = {
        type: "threshold",
        field: "xp",
        threshold: 100,
      };
      const profile = { ...baseProfile, xp: 150 };
      const result = evaluateCondition(condition, profile);
      expect(result.met).toBe(true);
    });

    it("returns met when level meets threshold", () => {
      const condition: AchievementCondition = {
        type: "threshold",
        field: "level",
        threshold: 5,
      };
      const profile = { ...baseProfile, level: 5 };
      const result = evaluateCondition(condition, profile);
      expect(result.met).toBe(true);
    });

    it("returns not met for unknown field", () => {
      const condition: AchievementCondition = {
        type: "threshold",
        field: "unknown",
        threshold: 1,
      };
      const result = evaluateCondition(condition, baseProfile);
      expect(result.met).toBe(false);
      expect(result.progress).toBe(0);
    });
  });

  describe("compound condition", () => {
    it("handles AND: met when all sub-conditions are met", () => {
      const condition: AchievementCondition = {
        type: "compound",
        operator: "and",
        conditions: [
          { type: "count", action: "recipe_share", threshold: 10 },
          { type: "count", action: "friend_added", threshold: 5 },
        ],
      };
      const profile = {
        ...baseProfile,
        actionCounts: { recipe_share: 15, friend_added: 5 },
      };
      const result = evaluateCondition(condition, profile);
      expect(result.met).toBe(true);
      expect(result.progress).toBe(15); // 10 + 5
      expect(result.total).toBe(15); // 10 + 5
    });

    it("handles AND: not met when any sub-condition fails", () => {
      const condition: AchievementCondition = {
        type: "compound",
        operator: "and",
        conditions: [
          { type: "count", action: "recipe_share", threshold: 10 },
          { type: "count", action: "friend_added", threshold: 5 },
        ],
      };
      const profile = {
        ...baseProfile,
        actionCounts: { recipe_share: 15, friend_added: 2 },
      };
      const result = evaluateCondition(condition, profile);
      expect(result.met).toBe(false);
    });

    it("handles OR: met when any sub-condition is met", () => {
      const condition: AchievementCondition = {
        type: "compound",
        operator: "or",
        conditions: [
          { type: "count", action: "cook_complete", threshold: 100 },
          { type: "count", action: "recipe_create", threshold: 5 },
        ],
      };
      const profile = {
        ...baseProfile,
        actionCounts: { cook_complete: 3, recipe_create: 5 },
      };
      const result = evaluateCondition(condition, profile);
      expect(result.met).toBe(true);
    });

    it("handles OR: returns best progress when none met", () => {
      const condition: AchievementCondition = {
        type: "compound",
        operator: "or",
        conditions: [
          { type: "count", action: "cook_complete", threshold: 100 },
          { type: "count", action: "recipe_create", threshold: 10 },
        ],
      };
      const profile = {
        ...baseProfile,
        actionCounts: { cook_complete: 50, recipe_create: 8 },
      };
      const result = evaluateCondition(condition, profile);
      expect(result.met).toBe(false);
      // recipe_create is 8/10 = 80% vs cook_complete 50/100 = 50%
      expect(result.progress).toBe(8);
      expect(result.total).toBe(10);
    });

    it("handles empty conditions array", () => {
      const condition: AchievementCondition = {
        type: "compound",
        operator: "and",
        conditions: [],
      };
      const result = evaluateCondition(condition, baseProfile);
      expect(result.met).toBe(true); // every() on empty array is true
    });
  });

  describe("unknown condition type", () => {
    it("returns not met for unknown type", () => {
      const condition = { type: "unknown" as any };
      const result = evaluateCondition(condition, baseProfile);
      expect(result.met).toBe(false);
      expect(result.progress).toBe(0);
      expect(result.total).toBe(1);
    });
  });
});

// ==================== getYesterday ====================

describe("getYesterday", () => {
  it("returns the previous date", () => {
    expect(getYesterday("2026-02-28")).toBe("2026-02-27");
  });

  it("handles month boundary", () => {
    expect(getYesterday("2026-03-01")).toBe("2026-02-28");
  });

  it("handles year boundary", () => {
    expect(getYesterday("2026-01-01")).toBe("2025-12-31");
  });

  it("handles leap year", () => {
    expect(getYesterday("2024-03-01")).toBe("2024-02-29");
  });
});

// ==================== getTodayDateString ====================

describe("getTodayDateString", () => {
  it("returns a string in YYYY-MM-DD format", () => {
    const result = getTodayDateString();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

// ==================== calculateStreakUpdate ====================

describe("calculateStreakUpdate", () => {
  it("returns no change when already tracked today", () => {
    const result = calculateStreakUpdate(5, 10, "2026-02-28", "2026-02-28");
    expect(result.currentStreak).toBe(5);
    expect(result.longestStreak).toBe(10);
  });

  it("continues streak when last activity was yesterday", () => {
    const result = calculateStreakUpdate(5, 10, "2026-02-27", "2026-02-28");
    expect(result.currentStreak).toBe(6);
    expect(result.longestStreak).toBe(10);
    expect(result.lastActivityDate).toBe("2026-02-28");
  });

  it("updates longestStreak when current exceeds it", () => {
    const result = calculateStreakUpdate(10, 10, "2026-02-27", "2026-02-28");
    expect(result.currentStreak).toBe(11);
    expect(result.longestStreak).toBe(11);
  });

  it("resets streak when gap is more than 1 day", () => {
    const result = calculateStreakUpdate(5, 10, "2026-02-25", "2026-02-28");
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(10);
  });

  it("resets streak and preserves longestStreak", () => {
    const result = calculateStreakUpdate(2, 2, "2026-02-20", "2026-02-28");
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(2);
  });

  it("starts streak at 1 when no previous activity", () => {
    const result = calculateStreakUpdate(0, 0, undefined, "2026-02-28");
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(1);
    expect(result.lastActivityDate).toBe("2026-02-28");
  });
});

// ==================== getStreakBonusXP ====================

describe("getStreakBonusXP", () => {
  it("returns 0 when no milestone crossed", () => {
    expect(getStreakBonusXP(5, 4)).toBe(0);
  });

  it("returns 100 when crossing 7-day milestone", () => {
    expect(getStreakBonusXP(7, 6)).toBe(100);
  });

  it("returns 500 when crossing 30-day milestone", () => {
    expect(getStreakBonusXP(30, 29)).toBe(500);
  });

  it("returns 0 when already past 7-day milestone", () => {
    expect(getStreakBonusXP(8, 7)).toBe(0);
  });

  it("returns 0 when already past 30-day milestone", () => {
    expect(getStreakBonusXP(31, 30)).toBe(0);
  });

  it("stacks both milestones if crossing both", () => {
    // Edge case: jumping from 6 to 30 in one update (shouldn't happen normally)
    expect(getStreakBonusXP(30, 6)).toBe(600); // 100 + 500
  });

  it("returns 0 when streak hasn't changed", () => {
    expect(getStreakBonusXP(7, 7)).toBe(0);
  });
});
