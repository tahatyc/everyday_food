# Test Coverage Report

**Date:** 2026-02-11
**Test Suites:** 24 passed | **Tests:** 398 passed | **Runtime:** ~16s

---

## Overall Coverage

| Metric     | Coverage   | Threshold | Status |
|------------|------------|-----------|--------|
| Statements | **70.57%** | 40%       | PASS   |
| Branches   | **68.00%** | 35%       | PASS   |
| Functions  | **66.74%** | 35%       | PASS   |
| Lines      | **71.79%** | 40%       | PASS   |

All thresholds are comfortably exceeded.

---

## Coverage by File

### Excellent Coverage (90%+)

| File                        | Stmts  | Branch | Funcs  | Lines  |
|-----------------------------|--------|--------|--------|--------|
| `app/edit-profile.tsx`      | 97.5%  | 76.3%  | 94.1%  | 97.4%  |
| `app/share/[code].tsx`      | 96.3%  | 85.7%  | 100%   | 96.3%  |
| `app/(auth)/register.tsx`   | 96.0%  | 87.5%  | 66.7%  | 96.0%  |
| `app/(tabs)/shopping.tsx`   | 95.1%  | 85.0%  | 87.0%  | 94.4%  |
| `app/(tabs)/index.tsx`      | 94.9%  | 54.8%  | 89.5%  | 94.7%  |
| `app/(auth)/login.tsx`      | 94.1%  | 80.0%  | 66.7%  | 94.1%  |
| `app/cook-mode/[id].tsx`    | 92.3%  | 81.0%  | 90.0%  | 92.3%  |
| `app/select-recipe.tsx`     | 91.2%  | 81.6%  | 95.0%  | 92.6%  |
| `app/grocery-list.tsx`      | 91.1%  | 90.8%  | 93.3%  | 93.1%  |
| `app/settings.tsx`          | 90.7%  | 70.2%  | 88.9%  | 97.5%  |
| All `src/components/ui/*`   | **100%** | 93.9% | 100%  | 100%   |

### Moderate Coverage (70-89%)

| File                              | Stmts  | Branch | Funcs  | Lines  |
|-----------------------------------|--------|--------|--------|--------|
| `app/(tabs)/profile.tsx`          | 88.9%  | 61.5%  | 81.3%  | 88.9%  |
| `app/(tabs)/recipes.tsx`          | 84.8%  | 82.8%  | 78.2%  | 88.4%  |
| `src/components/nav/BottomTabBar` | 83.3%  | 65.4%  | 73.3%  | 85.4%  |
| `app/recipe/[id].tsx`             | 82.0%  | 78.0%  | 81.0%  | 82.0%  |

### Low Coverage (< 70%)

| File                               | Stmts  | Branch | Funcs  | Lines  |
|------------------------------------|--------|--------|--------|--------|
| `app/friends.tsx`                  | 62.5%  | 56.1%  | 57.7%  | 62.5%  |
| `app/(tabs)/meal-plan.tsx`         | 55.6%  | 52.0%  | 48.1%  | 58.8%  |
| `src/components/ShareRecipeModal`  | 43.5%  | 64.9%  | 45.0%  | 42.6%  |

### Zero Coverage (no tests at all)

| File                          | Description             |
|-------------------------------|-------------------------|
| `app/import.tsx`              | Recipe URL import       |
| `app/manual-recipe.tsx`       | Manual recipe creation  |
| `app/modal.tsx`               | Base modal component    |
| `app/(tabs)/two.tsx`          | Unused tab placeholder  |
| `src/providers/ConvexProvider`| Convex client setup     |

---

## Recommended Additional Tests

### Priority 1 — Zero-Coverage Screens (Biggest Impact)

#### 1. `app/import.tsx` — Recipe URL Import

| # | Test Case                                    |
|---|----------------------------------------------|
| 1 | Renders import form with URL input field     |
| 2 | Shows validation error for invalid URL       |
| 3 | Shows loading state while importing          |
| 4 | Displays success state after import          |
| 5 | Displays error state on import failure       |
| 6 | Navigates to recipe after successful import  |
| 7 | Cancel/dismiss returns to previous screen    |

#### 2. `app/manual-recipe.tsx` — Manual Recipe Creation

| # | Test Case                                         |
|---|---------------------------------------------------|
| 1 | Renders form with all required fields             |
| 2 | Can input recipe title and description             |
| 3 | Can add an ingredient row                          |
| 4 | Can remove an ingredient row                       |
| 5 | Can add a cooking step                             |
| 6 | Can remove a cooking step                          |
| 7 | Can reorder steps                                  |
| 8 | Shows validation errors for empty required fields  |
| 9 | Submits form successfully with valid data          |
| 10| Cancel/back navigation works                       |
| 11| Can add tags (meal type, cuisine, dietary)         |
| 12| Can set prep time and cook time                    |

#### 3. `app/modal.tsx` — Base Modal

| # | Test Case                      |
|---|--------------------------------|
| 1 | Renders children correctly     |
| 2 | Dismiss/close behavior works   |

---

### Priority 2 — Low-Coverage Screens (Most Complex Logic)

#### 4. `app/(tabs)/meal-plan.tsx` (55.6% -> target 85%)

| # | Test Case                                                   | Uncovered Lines     |
|---|-------------------------------------------------------------|---------------------|
| 1 | Navigate to next/previous week                              | 310-311, 323-327    |
| 2 | Add a meal to a breakfast slot                               | 341-366             |
| 3 | Add a meal to a lunch slot                                   | 341-366             |
| 4 | Add a meal to a dinner slot                                  | 341-366             |
| 5 | Add a meal to a snack slot                                   | 341-366             |
| 6 | Remove a meal from the plan                                  | 372-419             |
| 7 | Generate shopping list from meal plan                        | 435, 447-462        |
| 8 | Empty state for day with no meals                            | 484-490             |
| 9 | Today button navigates to current date                       | 517-536             |
| 10| Swipe/drag interaction on meal cards                         | 538-556             |
| 11| Meal type badge displays correct color                       | 205-206             |
| 12| Long-press on meal shows options                             | 261-262             |

#### 5. `app/friends.tsx` (62.5% -> target 85%)

| # | Test Case                                          | Uncovered Lines   |
|---|----------------------------------------------------|-------------------|
| 1 | Send a friend request                              | 211-216           |
| 2 | Accept a pending friend request                    | 224, 232          |
| 3 | Reject a pending friend request                    | 237-240           |
| 4 | Cancel an outgoing friend request                  | 245-248           |
| 5 | Remove an existing friend                          | 301-319           |
| 6 | Block a user                                       | 39-54             |
| 7 | Search for users by name                           | 364               |
| 8 | Empty state when no friends found                  | 394               |
| 9 | Tabs switch between friends/pending/blocked        | 176               |

#### 6. `src/components/ShareRecipeModal.tsx` (43.5% -> target 80%)

| # | Test Case                                          | Uncovered Lines   |
|---|----------------------------------------------------|-------------------|
| 1 | Search for friends to share with                   | 60-75             |
| 2 | Select a friend from search results                | 80-83             |
| 3 | Deselect a previously selected friend              | 88-97             |
| 4 | Confirm sharing with selected friends              | 102-104           |
| 5 | Generate a shareable link                          | 108-111           |
| 6 | Copy share link to clipboard                       | 116-122           |
| 7 | Display existing shares for a recipe               | 157               |
| 8 | Revoke an existing share                           | 234-258           |
| 9 | Error state when sharing fails                     | 381-393           |

---

### Priority 3 — Branch Coverage Gaps in Well-Tested Files

#### 7. `app/recipe/[id].tsx` (82% -> target 92%)

| # | Test Case                                          |
|---|---------------------------------------------------|
| 1 | Tap edit navigates to edit screen                 |
| 2 | Share recipe triggers share modal                 |
| 3 | Recipe with no nutrition data renders gracefully  |
| 4 | Recipe with no tags renders gracefully            |
| 5 | Delete recipe with confirmation dialog            |

#### 8. `app/(tabs)/recipes.tsx` (84.8% -> target 92%)

| # | Test Case                                          |
|---|---------------------------------------------------|
| 1 | Filter recipes by meal type (breakfast/lunch/etc) |
| 2 | Search with no matching results                   |
| 3 | Clear search resets to full list                  |
| 4 | Scroll/pagination loads more recipes              |
| 5 | Toggle between grid and list view (if applicable) |

#### 9. `src/components/navigation/BottomTabBar.tsx` (83.3% -> target 95%)

| # | Test Case                                          |
|---|---------------------------------------------------|
| 1 | Active tab shows highlighted state for Home       |
| 2 | Active tab shows highlighted state for Recipes    |
| 3 | Active tab shows highlighted state for Plan       |
| 4 | Active tab shows highlighted state for Profile    |
| 5 | Badge/notification indicator renders when present |

#### 10. `app/(tabs)/index.tsx` (94.9% stmts, 54.8% branches)

| # | Test Case                                          |
|---|---------------------------------------------------|
| 1 | Loading state while data is being fetched         |
| 2 | Empty state when user has no recipes              |
| 3 | Empty state when user has no meal plans           |
| 4 | Quick actions navigate to correct screens         |

---

## Estimated Impact

| Action                                  | Projected Line Coverage |
|-----------------------------------------|------------------------|
| Current                                 | **71.8%**              |
| + Priority 1 (zero-coverage screens)    | ~76%                   |
| + Priority 2 (low-coverage screens)     | ~83%                   |
| + Priority 3 (branch gap improvements)  | ~88%                   |

---

## Notes

- All UI components (`src/components/ui/`) have **100% coverage** — no action needed.
- `app/(tabs)/two.tsx` appears to be an unused placeholder — consider removing it.
- `src/providers/ConvexProvider.tsx` is a thin wrapper; testing it provides minimal value.
- Auth screens have high statement coverage but low function coverage (66.7%) — the untested functions are likely `onSubmit` error branches.
