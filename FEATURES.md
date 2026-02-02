# Feature Ideas & Roadmap

This document tracks potential features and improvements for Everyday Food.

## Missing Features Worth Adding

### 1. Recipe Notes & Cook Logs
**Status:** Not Implemented
**Priority:** Medium

While the app tracks `cookCount` and `lastCookedAt`, users can't journal their cooking experiences for specific cooking sessions.

**What's Needed:**
- Session-specific notes (different from general recipe notes)
- Cook log history per recipe
- Example entries: "Doubled the garlic, kids loved it!", "Took 10 mins longer than expected"

---

### 2. Unit Conversion Toggle
**Status:** Not Implemented
**Priority:** High

The app has `preferredUnits` in user settings (metric/imperial), but no real-time conversion when viewing recipes.

**What's Needed:**
- Toggle button on recipe view to switch between metric/imperial
- Real-time conversion of all ingredient amounts
- Smart rounding (e.g., 236ml → "1 cup" instead of "0.998 cups")
- Useful for international recipes or travelers

---

### 3. Ingredient Substitutions
**Status:** Not Implemented
**Priority:** High

No substitution suggestions when ingredients are unavailable.

**What's Needed:**
- Database of common substitutions
- "Out of X? Use Y instead" suggestions
- Ratio calculations (e.g., "1 cup buttermilk = 1 cup milk + 1 tbsp lemon juice")
- Context-aware suggestions (baking vs cooking)
- User-contributed substitutions

---

### 4. Leftover/Pantry Tracking
**Status:** Not Implemented
**Priority:** High

Shopping list exists, but no way to track pantry inventory or mark "I already have this."

**What's Needed:**
- Pantry inventory system
- "Already have" checkbox on shopping items
- Expiration date tracking
- Low stock alerts
- Integration with recipe ingredients
- Prevent duplicate purchases

---

### 5. Recipe Scaling with Smart Rounding
**Status:** Partial (servings tracked, but no intelligent scaling)
**Priority:** High

The app tracks `servings` but doesn't intelligently scale ingredients.

**What's Needed:**
- Servings slider/multiplier on recipe view
- Smart rounding for awkward amounts:
  - "2.67 eggs" → suggest "3 eggs" or "2 eggs + 1 egg white"
  - "0.33 cup" → "⅓ cup"
- Visual fraction display
- Warn when scaling affects recipe quality (e.g., 10x batch of cookies)

---

### 6. Cook Mode Improvements
**Status:** Partial (basic cook mode exists)
**Priority:** Medium

Current cooking session tracking exists but lacks modern conveniences.

**What's Needed:**
- **Voice Commands:**
  - "Next step", "Previous step"
  - "Start timer", "How much time left?"
  - "Repeat step"
- **Hands-Free Mode:**
  - Screen wake lock (prevent auto-sleep)
  - Large touch targets for dirty hands
  - Tap anywhere to advance
- **Photo Upload Per Step:**
  - Let users photograph their results
  - Compare to example photos
  - Share progress with friends

---

### 7. Meal Prep Assistant
**Status:** Not Implemented
**Priority:** Medium

Meal plans exist, but no batch cooking optimizer.

**What's Needed:**
- **Batch Cooking Optimizer:**
  - Group recipes by shared ingredients
  - Group by prep techniques (all chopping together)
  - Suggest cooking order for efficiency
- **Storage Planning:**
  - Calculate containers needed
  - Label templates for meal prep containers
  - Reheating instructions per recipe
- **Prep Timeline:**
  - "Cook all chicken recipes Monday, pasta Tuesday"
  - Time estimates for batch prep sessions

---

### 8. Recipe Discovery Beyond Search
**Status:** Partial (basic search exists)
**Priority:** Medium

Current search is limited to title search.

**What's Needed:**
- **"Use What I Have" Search:**
  - Search by ingredients in pantry
  - "What can I make with chicken, rice, and broccoli?"
  - Rank by % match
- **Random Recipe Generator:**
  - With dietary filters
  - "Surprise me with dinner!"
  - Exclude recently cooked recipes
- **Similar Recipes:**
  - "If you liked X, try Y"
  - Based on ingredients, cuisine, tags
- **Seasonal/Trending:**
  - Suggest seasonal recipes
  - "Popular this week" section

---

### 9. Smart Shopping List Features
**Status:** Partial (basic shopping list exists)
**Priority:** Medium

Current shopping list is functional but lacks optimization features.

**What's Needed:**
- **Store Layout Customization:**
  - Custom aisle ordering per store
  - "My Kroger vs My Whole Foods"
  - Navigate efficiently through store
- **Price Tracking:**
  - Track item costs over time
  - Price history charts
  - Budget estimation for shopping trips
- **Auto-Categorization:**
  - Learn from past purchases
  - Auto-assign aisles to new items
- **Real-Time Sharing:**
  - Share list with household members
  - Live sync when someone checks items off
  - Multiple people shopping from same list

---

### 10. Social Features Enhancement
**Status:** Partial (friends/sharing recently added)
**Priority:** Low

Basic friend system and recipe sharing exists, but could be more engaging.

**What's Needed:**
- **Recipe Comments:**
  - Friends who tried it can comment
  - "I added paprika and it was amazing!"
  - Photo sharing in comments
- **Cook-Along Mode:**
  - Video call integration while cooking together
  - Synchronized step tracking
  - "Virtual cooking party"
- **Recipe Challenges:**
  - "Who can make the best pasta this week?"
  - Vote on results
  - Leaderboards
- **Public Cookbook Browsing:**
  - Discover other users' collections
  - "Top Rated Italian Cookbooks"
  - Follow favorite cookbook creators

---

### 11. Nutrition Tracking
**Status:** Partial (nutrition data exists per recipe)
**Priority:** Medium

Nutrition data exists but no tracking over time.

**What's Needed:**
- **Daily/Weekly Macro Tracking:**
  - Log meals consumed
  - Track calories, protein, carbs, fat
  - Visual charts and trends
- **Meal Plan Nutrition Totals:**
  - See total nutrition for the week
  - "This week: 12,000 cal, 450g protein"
- **Dietary Goal Progress:**
  - Set targets (e.g., "1500 cal/day")
  - Track adherence
  - Suggest recipes that fit goals

---

### 12. Kitchen Timer Hub
**Status:** Partial (timers exist per recipe)
**Priority:** Low

Recipes have step timers, but no global timer management.

**What's Needed:**
- **Global Timer View:**
  - See all active timers across recipes
  - Useful when cooking multiple dishes
  - "Pasta: 3 mins left, Chicken: 12 mins left"
- **Timer Notifications:**
  - Push notifications when timer ends
  - Custom sounds per timer
- **Timer Presets:**
  - Quick timers: "5 min", "10 min", "15 min"
  - Named presets: "Soft boiled egg", "Hard boiled egg"

---

### 13. Recipe Version History
**Status:** Not Implemented
**Priority:** Low

When users modify imported recipes, no way to track changes.

**What's Needed:**
- **Change Tracking:**
  - Save original imported version
  - Track user modifications
  - Timestamp each change
- **Compare Versions:**
  - Side-by-side diff view
  - "Original vs My Version"
- **Revert Capability:**
  - Undo changes
  - Restore original
  - Branch into new recipe variant

---

### 14. Offline Mode
**Status:** Not Implemented
**Priority:** Critical

No offline access - recipes unavailable without internet.

**What's Needed:**
- **Download Recipes:**
  - Pin recipes for offline access
  - Download entire cookbooks
  - Auto-download for upcoming meal plans
- **Offline Sync:**
  - Queue changes while offline
  - Sync when back online
  - Conflict resolution
- **Storage Management:**
  - Show storage used
  - Clear offline cache
  - Selective downloads

---

### 15. Recipe Print/Export
**Status:** Not Implemented
**Priority:** Medium

No way to export recipes outside the app.

**What's Needed:**
- **PDF Export:**
  - Formatted recipe cards
  - Print-friendly layout
  - Option to include/exclude photos
- **Email Recipe:**
  - Send to someone without the app
  - Formatted email template
  - Include link to install app
- **Recipe Book Printing:**
  - Export entire cookbook as PDF
  - Professional formatting
  - Table of contents, index
  - Custom cover page

---

## Top 5 Priority Recommendations

If implementing in order of impact:

1. **Ingredient Substitutions** - Huge quality-of-life improvement, solves real-time cooking problems
2. **Pantry Inventory/Leftover Tracking** - Solves duplicate purchase pain point, reduces food waste
3. **Recipe Scaling with Smart Rounding** - Essential for families and meal prep
4. **Offline Mode** - Critical for actual cooking (many kitchens have spotty wifi)
5. **Enhanced Cook Mode** (hands-free, voice, photos) - Makes the cooking experience magical

---

## Implementation Notes

### Recently Added Features
- ✅ Friends system (`friendships` table)
- ✅ Recipe sharing with friends (`recipeShares` table)
- ✅ Public share links (`shareLinks` table)
- ✅ User recipe interactions for global recipes (`userRecipeInteractions` table)

### Current Strong Points
- Comprehensive recipe management
- Cookbooks and organization
- Meal planning by date/meal type
- Shopping list generation
- Cooking sessions with timers
- Recipe import from URLs
- Nutrition tracking per recipe
- Tags and filtering system

### Areas for Improvement
The sharing/social features are a great recent addition. Next focus should be on enhancing the **actual cooking experience** - features users need while actively cooking (hands-free mode, substitutions, pantry tracking, offline access).

---

**Last Updated:** 2026-02-01
