# Gamification System — Architectural Design

## Overview

A data-driven, extensible gamification engine for Everyday Food that rewards users for completing the full cooking loop: **Plan → Shop → Cook**. Designed as a standalone module (`convex/gamification.ts`) with minimal coupling to existing code.

---

## 1. Database Schema (6 New Tables)

### 1.1 `gamificationProfiles` — Per-User XP & Level State

```
gamificationProfiles
├── userId: Id<"users">          (1:1 with users table)
├── xp: number                   (lifetime XP total)
├── level: number                (computed chef level, 1-based)
├── currentStreak: number        (consecutive days with a cook completion)
├── longestStreak: number        (personal best streak)
├── lastActivityDate: string     (ISO "YYYY-MM-DD" — for streak calculation)
├── showcaseBadges: Id<"userAchievements">[]  (up to 5 pinned badges)
├── createdAt: number
└── updatedAt: number

Indexes:
  - by_user: [userId]
  - by_xp: [xp]                 (for leaderboard queries)
  - by_level: [level]
```

**Why a separate table?** Keeps gamification state decoupled from the auth-managed `users` table. Can be wiped/reset independently. No schema migration on the core user table.

### 1.2 `achievementDefinitions` — Server-Driven Achievement Registry

```
achievementDefinitions
├── key: string                  (unique slug: "first_flame", "world_traveler")
├── name: string                 ("First Flame")
├── description: string          ("Cook your first recipe in Cook Mode")
├── icon: string                 (Ionicons name or emoji)
├── category: "cooking" | "planning" | "social" | "exploration" | "streak" | "special"
├── tier: "bronze" | "silver" | "gold" | "platinum"
├── xpReward: number             (XP awarded on unlock)
├── condition: object            (JSON condition — see Section 4)
│   ├── type: "count" | "streak" | "unique_count" | "threshold" | "compound"
│   ├── action: string           (the trackable action key)
│   ├── threshold: number
│   └── filters?: object         (optional filters like cuisine, mealType, etc.)
├── sortOrder: number            (display ordering)
├── isActive: boolean            (can disable without deleting)
└── createdAt: number

Indexes:
  - by_key: [key]
  - by_category: [category]
  - by_active: [isActive]
```

**Why data-driven?** Add new achievements from the Convex dashboard or a future admin panel — zero app deploys needed.

### 1.3 `userAchievements` — Unlocked Achievements Per User

```
userAchievements
├── userId: Id<"users">
├── achievementId: Id<"achievementDefinitions">
├── unlockedAt: number
└── progress: number             (current count toward threshold, for in-progress display)

Indexes:
  - by_user: [userId]
  - by_user_and_achievement: [userId, achievementId]
  - by_achievement: [achievementId]
```

### 1.4 `challengeDefinitions` — Weekly/Seasonal Challenge Templates

```
challengeDefinitions
├── key: string                  (unique slug)
├── name: string                 ("Italian Week")
├── description: string          ("Cook 3 Italian recipes this week")
├── icon: string
├── type: "weekly" | "seasonal" | "special"
├── xpReward: number
├── condition: object            (same condition schema as achievements)
├── startsAt: number             (epoch — when challenge becomes active)
├── endsAt: number               (epoch — when challenge expires)
├── isActive: boolean
└── createdAt: number

Indexes:
  - by_active_and_dates: [isActive, startsAt]
  - by_type: [type]
  - by_key: [key]
```

### 1.5 `userChallenges` — User Enrollment & Progress in Challenges

```
userChallenges
├── userId: Id<"users">
├── challengeId: Id<"challengeDefinitions">
├── progress: number             (current count)
├── isCompleted: boolean
├── completedAt: optional<number>
├── enrolledAt: number

Indexes:
  - by_user: [userId]
  - by_user_and_challenge: [userId, challengeId]
  - by_challenge: [challengeId]
```

### 1.6 `activityLog` — Event Stream (Append-Only)

```
activityLog
├── userId: Id<"users">
├── action: string               (see Action Keys below)
├── metadata: object             (flexible payload — recipeId, cuisine, mealType, etc.)
├── xpEarned: number             (XP awarded for this action)
├── timestamp: number

Indexes:
  - by_user: [userId]
  - by_user_and_action: [userId, action]
  - by_user_and_timestamp: [userId, timestamp]
  - by_action: [action]
```

**Why an activity log?** This is the backbone of the engine. Every trackable action gets logged here. Achievement/challenge progress is computed by querying this table. This makes the system fully extensible — add a new achievement condition type and it can query against historical data.

---

## 2. Action Keys (Trackable Events)

These are the `action` values recorded in `activityLog`:

| Action Key                | Triggered By                                    | Metadata                                       |
| ------------------------- | ----------------------------------------------- | ---------------------------------------------- |
| `cook_complete`           | `recordCookCompletion` mutation                 | `{ recipeId, cuisine, difficulty, totalTime }` |
| `meal_plan_add`           | `mealPlans.addMeal` mutation                    | `{ mealType, date }`                           |
| `meal_plan_week_complete` | Internal check (all 7 days planned)             | `{ weekStartDate }`                            |
| `shopping_list_complete`  | All items checked off                           | `{ listId, itemCount }`                        |
| `recipe_create`           | `recipes.createManual` mutation                 | `{ recipeId }`                                 |
| `recipe_share`            | `recipeShares.share` mutation                   | `{ recipeId, sharedWithId }`                   |
| `recipe_favorite`         | `toggleFavorite` / `toggleGlobalRecipeFavorite` | `{ recipeId }`                                 |
| `friend_added`            | `friends.acceptRequest` mutation                | `{ friendId }`                                 |
| `share_link_created`      | `shareLinks.create` mutation                    | `{ recipeId }`                                 |
| `daily_login`             | App open (once per day)                         | `{}`                                           |

---

## 3. XP & Leveling System

### 3.1 XP Rewards Table

| Action                             | Base XP | Bonus Conditions                                 |
| ---------------------------------- | ------- | ------------------------------------------------ |
| Cook a recipe (Cook Mode complete) | 50      | +25 if new cuisine, +10 if hard difficulty       |
| Plan a meal                        | 10      | —                                                |
| Complete full week plan            | 100     | Bonus: triggers separately from individual plans |
| Complete shopping list             | 20      | —                                                |
| Create a recipe                    | 30      | —                                                |
| Share a recipe                     | 15      | —                                                |
| Add a friend                       | 10      | —                                                |
| Daily login                        | 5       | —                                                |
| 7-day cooking streak               | 100     | Bonus: awarded on top of daily cook XP           |
| 30-day cooking streak              | 500     | Bonus: awarded on top of 7-day bonus             |

### 3.2 Level Thresholds

Exponential curve — early levels are fast, later levels require commitment:

| Level | Title           | XP Required (Cumulative) |
| ----- | --------------- | ------------------------ |
| 1     | Home Cook       | 0                        |
| 2     | Kitchen Helper  | 100                      |
| 3     | Line Cook       | 300                      |
| 4     | Prep Chef       | 600                      |
| 5     | Station Chef    | 1,000                    |
| 6     | Sous Chef       | 1,500                    |
| 7     | Head Chef       | 2,200                    |
| 8     | Executive Chef  | 3,100                    |
| 9     | Master Chef     | 4,200                    |
| 10    | Culinary Legend | 5,500                    |

**Formula**: `XP_for_level(n) = round(50 * n * (n + 1) / 2)` — configurable via a helper function, not hardcoded per level.

### 3.3 Level Calculation

```typescript
// convex/lib/gamificationHelpers.ts
export function calculateLevel(xp: number): {
  level: number;
  title: string;
  xpForNext: number;
  xpProgress: number;
} {
  // Uses the formula to find current level from XP
  // Returns level number, title, XP needed for next level, current progress
}
```

Level is **computed from XP** — never stored separately. The `level` field in `gamificationProfiles` is a denormalized cache updated whenever XP changes, for efficient leaderboard queries.

---

## 4. Achievement Engine Architecture

### 4.1 Condition Schema

Conditions are stored as JSON in `achievementDefinitions.condition`:

```typescript
type AchievementCondition =
  | {
      type: "count";
      action: string;
      threshold: number;
      filters?: Record<string, string>;
    }
  | { type: "streak"; action: string; threshold: number }
  | { type: "unique_count"; action: string; field: string; threshold: number }
  | { type: "threshold"; field: string; threshold: number }
  | {
      type: "compound";
      operator: "and" | "or";
      conditions: AchievementCondition[];
    };
```

**Examples**:

| Achievement           | Condition                                                                                                                                                                |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| First Flame           | `{ type: "count", action: "cook_complete", threshold: 1 }`                                                                                                               |
| Iron Chef (100 cooks) | `{ type: "count", action: "cook_complete", threshold: 100 }`                                                                                                             |
| World Traveler        | `{ type: "unique_count", action: "cook_complete", field: "metadata.cuisine", threshold: 10 }`                                                                            |
| 7-Day Streak          | `{ type: "streak", action: "cook_complete", threshold: 7 }`                                                                                                              |
| Meal Prep Master      | `{ type: "count", action: "meal_plan_week_complete", threshold: 4 }`                                                                                                     |
| Social Butterfly      | `{ type: "compound", operator: "and", conditions: [{ type: "count", action: "recipe_share", threshold: 10 }, { type: "count", action: "friend_added", threshold: 5 }] }` |

### 4.2 Evaluation Flow

```
User Action → Existing Mutation
     │
     ├─→ 1. Log to activityLog
     ├─→ 2. Award base XP → update gamificationProfiles.xp
     ├─→ 3. Update streak (if cook_complete)
     └─→ 4. Check achievements:
           ├─ Query achievementDefinitions (active, not yet unlocked by user)
           ├─ For each, evaluate condition against activityLog
           ├─ If met → insert userAchievements + award bonus XP
           └─ Return newly unlocked achievements (for toast notification)
```

### 4.3 Integration Points (Minimal Coupling)

The gamification engine is called **at the end** of existing mutations via a single helper:

```typescript
// convex/lib/gamificationEngine.ts

export async function trackAction(
  ctx: MutationCtx,
  userId: Id<"users">,
  action: string,
  metadata: Record<string, any> = {},
): Promise<{
  xpEarned: number;
  newLevel: number | null; // non-null if leveled up
  newAchievements: string[]; // keys of newly unlocked achievements
  challengeProgress: Array<{ name: string; progress: number; total: number }>;
}>;
```

**Modified existing files** (additions only, ~3-5 lines per file):

| File                                         | Change                                                                            |
| -------------------------------------------- | --------------------------------------------------------------------------------- |
| `convex/recipes.ts` → `recordCookCompletion` | Add `await trackAction(ctx, userId, "cook_complete", { recipeId, ... })`          |
| `convex/recipes.ts` → `createManual`         | Add `await trackAction(ctx, userId, "recipe_create", { recipeId })`               |
| `convex/mealPlans.ts` → `addMeal`            | Add `await trackAction(ctx, userId, "meal_plan_add", { mealType, date })`         |
| `convex/shoppingLists.ts` → `toggleItem`     | Check if all items checked → `trackAction(ctx, userId, "shopping_list_complete")` |
| `convex/friends.ts` → `acceptRequest`        | Add `await trackAction(ctx, userId, "friend_added", { friendId })`                |
| `convex/recipeShares.ts` → `share`           | Add `await trackAction(ctx, userId, "recipe_share", { recipeId })`                |

No existing function signatures change. No existing return types change. Pure additions.

---

## 5. Challenge System

### 5.1 Lifecycle

```
Challenge Created (admin/seed) → Active window [startsAt, endsAt]
     │
     ├─→ User sees active challenges via query
     ├─→ User auto-enrolls on first relevant action (or manually)
     ├─→ Progress tracked via activityLog filtered by date range
     └─→ On completion → XP reward + completion flag
```

### 5.2 Weekly Challenge Rotation

A Convex cron job (or manual seed) creates new weekly challenges every Monday:

```typescript
// convex/crons.ts
crons.weekly(
  "rotate-challenges",
  { dayOfWeek: "monday", hourUTC: 0 },
  api.gamification.rotateWeeklyChallenges,
);
```

Challenge templates are stored in code (a `CHALLENGE_TEMPLATES` array) and rotated. This keeps it simple for Phase 1 while allowing future admin UI.

---

## 6. Backend API Surface

### New File: `convex/gamification.ts`

```typescript
// ==================== QUERIES ====================

getProfile(args: {})
  → { xp, level, title, xpForNext, xpProgress, currentStreak, longestStreak, showcaseBadges }

getAchievements(args: { category?: string })
  → Array<{ ...definition, isUnlocked, unlockedAt?, progress, progressPercent }>

getActiveChallenges(args: {})
  → Array<{ ...definition, userProgress, isCompleted, timeRemaining }>

getLeaderboard(args: { type: "friends" | "global", limit?: number })
  → Array<{ userId, name, imageUrl, xp, level, title }>

getActivityFeed(args: { limit?: number })
  → Array<{ action, metadata, xpEarned, timestamp }>  (recent activity)

getStats(args: {})
  → { totalXp, level, title, achievementsUnlocked, totalAchievements,
      currentStreak, longestStreak, cuisinesExplored, totalCooks,
      totalMealsPlanned, challengesCompleted }

// ==================== MUTATIONS ====================

trackAction(internal — called by other mutations, not exposed to client)

updateShowcaseBadges(args: { badgeIds: Id<"userAchievements">[] })
  → Updates which badges appear on profile (max 5)

enrollInChallenge(args: { challengeId: Id<"challengeDefinitions"> })
  → Enrolls user in a challenge

// ==================== INTERNAL ====================

rotateWeeklyChallenges(internal — called by cron)
  → Deactivates expired, creates new weekly challenges

seedAchievements(internal — one-time setup)
  → Populates achievementDefinitions with initial set
```

---

## 7. Frontend Architecture

### 7.1 New Files

```
app/
  achievements.tsx              # Full achievements grid screen
  leaderboard.tsx               # Friends leaderboard screen

src/
  components/
    gamification/
      XPProgressBar.tsx         # Level progress bar (reusable)
      AchievementBadge.tsx      # Single badge display (locked/unlocked states)
      AchievementGrid.tsx       # Grid of all achievements by category
      StreakCounter.tsx          # Flame icon + streak count
      LevelBadge.tsx            # Chef level indicator
      ChallengeCard.tsx         # Active challenge with progress bar
      XPToast.tsx               # "+50 XP!" popup notification
      LevelUpModal.tsx          # Full-screen celebration on level up

  hooks/
    useGamification.ts          # Convenience hook wrapping gamification queries
```

### 7.2 Integration into Existing Screens

| Screen                                                     | Addition                                                                                                                                             |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Profile** (`app/(tabs)/profile.tsx`)                     | Replace stats section with gamification stats: Level badge, XP bar, streak counter, showcase badges. Add "View Achievements" and "Leaderboard" links |
| **Home** (`app/(tabs)/index.tsx`)                          | Add streak counter in header. Show active challenges card. Show "Daily Progress" mini-widget                                                         |
| **Cook Mode Complete** (`app/cook-mode/[id].tsx`)          | After cook completion, show XP toast + any new achievement unlocks                                                                                   |
| **Tab Bar** (`src/components/navigation/BottomTabBar.tsx`) | Optional: subtle level indicator on profile tab                                                                                                      |

### 7.3 XP Toast Notification Flow

```
trackAction returns { xpEarned, newAchievements, newLevel }
     │
     ├─→ Show XPToast: "+50 XP" (auto-dismiss after 2s)
     ├─→ If newAchievements.length > 0 → Show AchievementToast
     └─→ If newLevel → Show LevelUpModal (celebration animation)
```

Implementation: Use Zustand for a global `gamificationStore` that holds pending notifications. The `XPToast` component is rendered in `app/_layout.tsx` (root) so it appears above all screens.

```typescript
// src/stores/gamificationStore.ts
interface GamificationStore {
  pendingXPToast: { amount: number; action: string } | null;
  pendingAchievements: string[];
  pendingLevelUp: { level: number; title: string } | null;
  showXPToast: (amount: number, action: string) => void;
  showAchievement: (key: string) => void;
  showLevelUp: (level: number, title: string) => void;
  dismiss: () => void;
}
```

---

## 8. Data Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     USER ACTION                          │
│  (cook recipe, plan meal, complete shopping, etc.)       │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│              EXISTING MUTATION                            │
│  (recordCookCompletion, addMeal, toggleItem, etc.)       │
│                                                          │
│  ... existing logic unchanged ...                        │
│                                                          │
│  + await trackAction(ctx, userId, action, metadata)  ◄── NEW LINE
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│              trackAction() ENGINE                        │
│                                                          │
│  1. Insert into activityLog                              │
│  2. Calculate & award XP → patch gamificationProfiles    │
│  3. Update streak (if applicable)                        │
│  4. Query uncompleted achievements                       │
│  5. Evaluate each condition against activityLog          │
│  6. Unlock met achievements → insert userAchievements    │
│  7. Check active challenges → update userChallenges      │
│  8. Return { xpEarned, newLevel, newAchievements }       │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│              CLIENT RESPONSE                             │
│                                                          │
│  Mutation returns existing data + gamification result     │
│  → Zustand store picks up notifications                  │
│  → XPToast / AchievementToast / LevelUpModal rendered    │
└─────────────────────────────────────────────────────────┘
```

---

## 9. Implementation Phases

### Phase 1 — Core Engine (MVP)

**New files:**

- `convex/gamification.ts` — queries + mutations
- `convex/lib/gamificationEngine.ts` — `trackAction()` + helpers
- `convex/lib/gamificationHelpers.ts` — level calc, condition evaluation
- Schema additions in `convex/schema.ts` (6 tables)
- `convex/seed.ts` update — seed initial achievements

**Modified files (minimal changes):**

- `convex/recipes.ts` — add `trackAction` call in `recordCookCompletion` + `createManual`
- `convex/mealPlans.ts` — add `trackAction` call in `addMeal`
- `convex/shoppingLists.ts` — add `trackAction` call in `toggleItem` (list completion check)
- `convex/friends.ts` — add `trackAction` call in `acceptRequest`
- `convex/recipeShares.ts` — add `trackAction` call in `share`

**New frontend files:**

- `src/components/gamification/XPProgressBar.tsx`
- `src/components/gamification/AchievementBadge.tsx`
- `src/components/gamification/StreakCounter.tsx`
- `src/components/gamification/LevelBadge.tsx`
- `src/components/gamification/XPToast.tsx`
- `src/stores/gamificationStore.ts`
- `src/hooks/useGamification.ts`

**Modified frontend files:**

- `app/(tabs)/profile.tsx` — add level + XP bar + streak + badge showcase
- `app/_layout.tsx` — render `XPToast` overlay
- `app/cook-mode/[id].tsx` — show XP earned after cook completion

### Phase 2 — Challenges & Social

- `challengeDefinitions` + `userChallenges` tables (already in schema)
- `convex/crons.ts` — weekly challenge rotation
- `app/achievements.tsx` — full achievements screen
- `app/leaderboard.tsx` — friends leaderboard
- `src/components/gamification/ChallengeCard.tsx`
- `src/components/gamification/LevelUpModal.tsx`
- Home screen integration (active challenges widget)

### Phase 3 — Polish & Engagement

- `src/components/gamification/AchievementGrid.tsx` — categorized grid
- Seasonal/special event challenges
- Stats heatmap (cooking calendar)
- Achievement sharing to friends
- Notification system for challenge expiration

---

## 10. Achievement Seed Data (Phase 1)

| Key                  | Name               | Category    | Tier     | Condition                                             | XP  |
| -------------------- | ------------------ | ----------- | -------- | ----------------------------------------------------- | --- |
| `first_flame`        | First Flame        | cooking     | bronze   | `count:cook_complete:1`                               | 25  |
| `five_star_cook`     | Five Star Cook     | cooking     | silver   | `count:cook_complete:5`                               | 50  |
| `iron_chef`          | Iron Chef          | cooking     | platinum | `count:cook_complete:100`                             | 500 |
| `speed_demon`        | Speed Demon        | cooking     | silver   | `count:cook_complete:5` + filter `totalTime<=30`      | 75  |
| `world_traveler`     | World Traveler     | exploration | gold     | `unique_count:cook_complete:cuisine:10`               | 200 |
| `recipe_creator`     | Recipe Creator     | cooking     | bronze   | `count:recipe_create:1`                               | 25  |
| `cookbook_author`    | Cookbook Author    | cooking     | gold     | `count:recipe_create:10`                              | 150 |
| `meal_planner`       | Meal Planner       | planning    | bronze   | `count:meal_plan_add:1`                               | 15  |
| `meal_prep_master`   | Meal Prep Master   | planning    | gold     | `count:meal_plan_week_complete:4`                     | 200 |
| `grocery_guru`       | Grocery Guru       | planning    | silver   | `count:shopping_list_complete:20`                     | 100 |
| `social_butterfly`   | Social Butterfly   | social      | silver   | `count:recipe_share:10`                               | 100 |
| `streak_starter`     | Streak Starter     | streak      | bronze   | `streak:cook_complete:3`                              | 50  |
| `week_warrior`       | Week Warrior       | streak      | silver   | `streak:cook_complete:7`                              | 100 |
| `monthly_master`     | Monthly Master     | streak      | gold     | `streak:cook_complete:30`                             | 500 |
| `breakfast_champion` | Breakfast Champion | cooking     | silver   | `count:meal_plan_add:7` + filter `mealType=breakfast` | 75  |

---

## 11. Performance Considerations

| Concern                                      | Mitigation                                                                                                                                                                   |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `trackAction` adds latency to every mutation | Achievement check queries are index-backed. Only checks achievements user hasn't unlocked yet (small set). Activity log queries use `by_user_and_action` index.              |
| `activityLog` grows unbounded                | Add a TTL/archival strategy in Phase 3. For Phase 1, Convex handles this fine — activity log rows are small (~200 bytes each).                                               |
| Leaderboard queries scan many users          | `by_xp` index on `gamificationProfiles`. Friends leaderboard filters to accepted friendships first (small set). Global leaderboard uses `.take(limit)`.                      |
| Streak calculation on every cook             | Streak is maintained incrementally (compare `lastActivityDate` to today). No historical scan needed.                                                                         |
| Achievement evaluation queries               | Each condition type maps to a single indexed query. `count` = count by user+action. `unique_count` = collect + dedupe on field. `streak` = read from profile (pre-computed). |

### 11.1 Solutions & Optimizations

#### 11.1.1 Async `trackAction` via Scheduler

Use `ctx.scheduler.runAfter(0, ...)` to call `trackAction` as an `internalMutation` instead of `await`. This makes gamification processing fire-and-forget — the parent mutation returns immediately while XP, achievements, and challenges are evaluated asynchronously.

```typescript
// In existing mutations (e.g., recordCookCompletion):
// BEFORE (blocking):
// await trackAction(ctx, userId, "cook_complete", metadata);

// AFTER (async, non-blocking):
await ctx.scheduler.runAfter(0, internal.gamification.processAction, {
  userId,
  action: "cook_complete",
  metadata,
});
```

Additionally, add an early-exit optimization: before querying achievement definitions, check if the action key matches any active achievement. Keep a lightweight mapping of `action → achievementKeys[]` to skip unnecessary work.

#### 11.1.2 Denormalize Action Counts into `gamificationProfiles`

Store running tallies directly in the profile to eliminate most `activityLog` queries during achievement evaluation:

```
gamificationProfiles (additional fields)
├── actionCounts: object        ({ cook_complete: 47, recipe_create: 5, ... })
├── uniqueSets: object          ({ cuisines: ["italian", "thai", ...], ... })
```

- **`count` conditions**: Compare `actionCounts[action] >= threshold` — zero activityLog queries.
- **`unique_count` conditions**: Compare `uniqueSets[field].length >= threshold` — zero activityLog queries.
- **`streak` conditions**: Already pre-computed in `currentStreak` — direct comparison.
- **`compound` conditions**: Evaluate sub-conditions using the same optimized paths. Short-circuit on `and` (fail-fast) and `or` (succeed-fast).

Update these counters atomically inside `trackAction` when inserting the activity log entry.

#### 11.1.3 Activity Log TTL & Archival

Prevent unbounded `activityLog` growth with a two-tier strategy:

**Tier 1 — TTL Cleanup Cron (Phase 1)**:

```typescript
// convex/crons.ts
crons.weekly(
  "cleanup-activity-log",
  { dayOfWeek: "sunday", hourUTC: 3 },
  internal.gamification.cleanupOldActivityLogs,
);

// Deletes activityLog entries older than 90 days.
// Safe because counts and streaks are already denormalized in gamificationProfiles.
```

**Tier 2 — Aggregate Rollup Table (Phase 3)**:

```
activitySummary
├── userId: Id<"users">
├── action: string
├── month: string              ("2026-02")
├── count: number
├── uniqueValues: string[]     (deduplicated metadata values)
├── totalXpEarned: number

Indexes:
  - by_user_and_action: [userId, action]
  - by_user_and_month: [userId, month]
```

The cron archives raw logs into monthly summaries before deleting them. Historical stats remain queryable through the summary table.

All reads against `activityLog` must use `.take(limit)` with appropriate indexes — never unbounded collection scans.

#### 11.1.4 Leaderboard Caching

**Friends leaderboard**: Query accepted friendships first (small set, typically 50–200 IDs), then batch-fetch their `gamificationProfiles` by userId. Never scan the full profiles table.

**Global leaderboard**: Cache the top-N in a singleton document updated by cron:

```
leaderboardCache
├── type: "global"
├── entries: Array<{ userId, name, imageUrl, xp, level, title }>
├── updatedAt: number

// Updated every 5 minutes by cron:
crons.interval("refresh-leaderboard", { minutes: 5 },
  internal.gamification.refreshLeaderboardCache
);
```

This reduces the global leaderboard query to a single document read.

#### 11.1.5 Timezone-Aware Streak Tracking

Prevent timezone edge cases where a user cooking at 11:55 PM loses their streak:

- **Pass the user's local date from the client** when calling mutations (e.g., `localDate: "2026-02-28"`). Use this for streak comparison instead of server UTC time.
- **Alternatively**, use a generous 48-hour window: if `lastActivityDate` is today or yesterday (in any timezone interpretation), the streak continues.
- **Future enhancement**: Add a "streak freeze" power-up (costs XP) that preserves the streak for one missed day, reducing churn from long streak losses.

```typescript
// Streak logic in trackAction:
function updateStreak(profile: GamificationProfile, localDate: string) {
  const lastDate = profile.lastActivityDate;
  if (lastDate === localDate) return; // Already tracked today

  const yesterday = getYesterday(localDate);
  if (lastDate === yesterday) {
    // Continue streak
    profile.currentStreak += 1;
    profile.longestStreak = Math.max(
      profile.longestStreak,
      profile.currentStreak,
    );
  } else {
    // Streak broken — reset
    profile.currentStreak = 1;
  }
  profile.lastActivityDate = localDate;
}
```

### 11.2 Performance Optimization Summary

| Optimization                                          | Impact                                                     | Effort | Phase |
| ----------------------------------------------------- | ---------------------------------------------------------- | ------ | ----- |
| `ctx.scheduler.runAfter(0, ...)` for async tracking   | Eliminates mutation latency entirely                       | Low    | 1     |
| Denormalize action counts into `gamificationProfiles` | Eliminates most activityLog queries for achievement checks | Low    | 1     |
| Activity log TTL cron (90-day retention)              | Prevents unbounded table growth                            | Low    | 1     |
| Client-side local date for streak tracking            | Prevents timezone-related streak loss                      | Low    | 1     |
| Leaderboard cache singleton + cron refresh            | Global leaderboard becomes single-doc read                 | Medium | 2     |
| Aggregate rollup table for archived data              | Preserves historical stats after log cleanup               | Medium | 3     |

The highest-impact, lowest-effort changes are making `trackAction` asynchronous and denormalizing counts into the profile — together these eliminate both the latency concern and most of the activityLog query pressure.

---

## 12. Extensibility Points

| Future Feature                            | How the Architecture Supports It                                      |
| ----------------------------------------- | --------------------------------------------------------------------- |
| New achievements                          | Insert row into `achievementDefinitions` — no code changes            |
| New action types                          | Add action key string + `trackAction` call in relevant mutation       |
| New condition types                       | Add evaluator function in `gamificationHelpers.ts`                    |
| Unlockable rewards (themes, recipe packs) | Add `rewardType` + `rewardData` fields to `achievementDefinitions`    |
| Admin panel                               | CRUD on `achievementDefinitions` + `challengeDefinitions` tables      |
| Push notifications                        | Subscribe to `activityLog` inserts via Convex reactive queries        |
| Cooking clubs/groups                      | New `groups` table + group-scoped leaderboard query                   |
| Custom user challenges                    | User-created entries in `challengeDefinitions` with `createdBy` field |

---

## 13. Files Summary

### New Files (Backend)

```
convex/gamification.ts              # Main gamification queries + mutations
convex/lib/gamificationEngine.ts    # trackAction() core engine
convex/lib/gamificationHelpers.ts   # Level calc, condition evaluation, XP tables
convex/lib/achievementEvaluator.ts  # Condition type evaluators
```

### New Files (Frontend)

```
src/components/gamification/XPProgressBar.tsx
src/components/gamification/AchievementBadge.tsx
src/components/gamification/AchievementGrid.tsx
src/components/gamification/StreakCounter.tsx
src/components/gamification/LevelBadge.tsx
src/components/gamification/ChallengeCard.tsx
src/components/gamification/XPToast.tsx
src/components/gamification/LevelUpModal.tsx
src/stores/gamificationStore.ts
src/hooks/useGamification.ts
app/achievements.tsx
app/leaderboard.tsx
```

### Modified Files (Minimal Changes)

```
convex/schema.ts                    # +6 table definitions
convex/recipes.ts                   # +2 trackAction calls
convex/mealPlans.ts                 # +1 trackAction call
convex/shoppingLists.ts             # +1 trackAction call (+completion check)
convex/friends.ts                   # +1 trackAction call
convex/recipeShares.ts              # +1 trackAction call
convex/seed.ts                      # +achievement seed data
app/(tabs)/profile.tsx              # Add gamification stats section
app/_layout.tsx                     # Render XPToast overlay
app/cook-mode/[id].tsx              # Show XP result after cook
```
