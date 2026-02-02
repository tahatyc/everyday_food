System Design Validation Results
✅ Strengths Found
Excellent architecture: Clean Expo Router structure, proper TypeScript, Convex integration
Strong design system: Neo-brutalist tokens consistently applied across all components
Good schema design: Well-normalized with proper indexing
⚠️ Critical Issues Found
Issue Severity
Cookbook access control missing - anyone can read/modify any cookbook Critical
Meal plan/shopping list authorization gaps Critical
N+1 query patterns in recipe fetching High
User enumeration in friend search Medium
Architecture Score: 7.5/10
Feature Implementation Plan
Based on FEATURES.md, I recommend this order:

Phase 0: Security hardening (fix authorization gaps first)
Phase 1: Recipe scaling with smart rounding
Phase 6: Unit conversion toggle
Phase 5: Cook mode improvements (wake lock, larger targets)
Phase 2: Ingredient substitutions
Phase 3: Pantry/leftover tracking
Phase 4: Offline mode (largest effort)
The full plan with schema changes, file modifications, and verification steps is in the plan file.

Claude’s Plan
System Design Validation & Feature Implementation Plan
Executive Summary
The Everyday Food app demonstrates solid architectural foundations with proper separation of concerns, a comprehensive design system, and well-structured Convex backend. However, there are critical security gaps and performance concerns that should be addressed before implementing new features.

Part 1: System Design Validation
✅ Strengths (Good Practices)
Architecture
Clean file organization: Expo Router file-based routing in app/, components in src/components/, backend in convex/
Type safety: TypeScript throughout with Convex auto-generated types
Provider pattern: Proper ConvexProvider wrapping with auth persistence
No state management bloat: Leverages Convex real-time queries instead of Redux/Zustand
Design System
Comprehensive tokens: neobrutalism.ts covers colors, spacing, borders, shadows, typography
Consistent neo-brutalist aesthetic: Bold borders, offset shadows, vibrant colors
Reusable components: Button, Card, Badge, Input, Checkbox, IconButton with variants
Animation patterns: Staggered FadeIn animations with consistent timing
Backend (Convex)
Well-normalized schema: Proper separation of recipes, ingredients, steps, tags
Comprehensive indexing: Query-driven indexes for common patterns
Centralized auth: accessControl.ts for authorization logic
Social features: Bidirectional friendships, recipe sharing, public share links
⚠️ Critical Issues Found

1. Security Vulnerabilities (HIGH PRIORITY)
   Issue Location Risk
   Cookbook access control missing cookbooks.ts getById(), addRecipe(), removeRecipe() Anyone can read/modify any cookbook if they know the ID
   Meal plan authorization gap mealPlans.ts removeMeal() Can delete other users' meal plans
   Shopping list authorization gap shoppingLists.ts toggleItem() Can modify other users' shopping items
   User enumeration friends.ts searchUsers() Loads ALL users into memory, exposes user count
   Recommended Fix: Add getCurrentUserId() checks and verify ownership before mutations.

2. Performance Issues (MEDIUM PRIORITY)
   Issue Location Impact
   N+1 queries recipes.ts list(), getById() For each recipe: 3+ queries (ingredients, steps, tags)
   No pagination Multiple files Large datasets will degrade performance
   In-memory filtering friends.ts searchUsers() Doesn't scale
   Recommended Fix: Batch queries, add cursor-based pagination, use search indexes.

3. Data Consistency (LOW PRIORITY)
   Issue Location Impact
   Dual favorite tracking recipes.isFavorite + userRecipeInteractions.isFavorite Potential race conditions
   Bidirectional friendship records friends.ts 2 writes per operation, manual sync required
   📊 Architecture Score: 7.5/10
   Category Score Notes
   Code Organization 9/10 Excellent file structure, clear separation
   Type Safety 8/10 Strong typing, Convex generates types
   Security 5/10 Critical authorization gaps
   Performance 6/10 N+1 queries, no pagination
   UI Consistency 9/10 Design system well applied
   Maintainability 8/10 Clean patterns, some code duplication
   Part 2: Feature Implementation Plan
   Based on FEATURES.md priorities and current architecture state:

Phase 0: Security Hardening (Do First)
Files to modify:

convex/cookbooks.ts
convex/mealPlans.ts
convex/shoppingLists.ts
convex/friends.ts
Tasks:

Add ownership verification to all cookbook mutations
Add user check to mealPlans.removeMeal()
Add list ownership check to shoppingLists.toggleItem()
Add pagination to searchUsers() with search index
Estimated changes: ~50 lines across 4 files

Phase 1: Recipe Scaling with Smart Rounding (Priority: High)
Why first: Foundation for other features (substitutions, nutrition tracking)

Schema changes: None needed (recipes already have servings)

New files:

src/utils/recipeScaling.ts - Scaling logic and smart rounding
src/components/ServingsSelector.tsx - UI component
Files to modify:

app/recipe/[id].tsx - Add scaling UI
app/cook-mode/[id].tsx - Apply scaling to steps
Implementation:

1. Create scaling utility with fraction display (⅓, ½, ¾)
2. Implement smart rounding (2.67 eggs → "3 eggs")
3. Add servings slider/stepper to recipe detail
4. Pass multiplier to cook mode
5. Scale ingredient display in real-time
   Phase 2: Ingredient Substitutions (Priority: High)
   Schema additions:

// convex/schema.ts
substitutions: defineTable({
ingredientName: v.string(), // e.g., "buttermilk"
substituteName: v.string(), // e.g., "milk + lemon juice"
ratio: v.string(), // e.g., "1 cup = 1 cup milk + 1 tbsp lemon juice"
context: v.optional(v.string()), // "baking" | "cooking" | "both"
isUserContributed: v.boolean(),
userId: v.optional(v.id("users")),
})
New files:

convex/substitutions.ts - Queries and mutations
src/components/SubstitutionSuggestion.tsx - UI component
convex/seed-substitutions.ts - Common substitution data
Files to modify:

app/recipe/[id].tsx - Show substitution hints
app/cook-mode/[id].tsx - "Out of X?" prompt
Phase 3: Pantry/Leftover Tracking (Priority: High)
Schema additions:

// convex/schema.ts
pantryItems: defineTable({
userId: v.id("users"),
name: v.string(),
quantity: v.optional(v.number()),
unit: v.optional(v.string()),
expirationDate: v.optional(v.string()), // ISO date
category: v.string(), // "dairy", "produce", etc.
lowStockThreshold: v.optional(v.number()),
}).index("by_user", ["userId"])
.index("by_user_and_category", ["userId", "category"])
.index("by_expiration", ["userId", "expirationDate"])
New files:

convex/pantry.ts - CRUD operations
app/pantry.tsx - Pantry screen
src/components/PantryItem.tsx - Item display component
Files to modify:

app/(tabs)/\_layout.tsx - Add pantry tab or menu item
convex/shoppingLists.ts - Check pantry before adding
app/grocery-list.tsx - "Already have" checkbox
Phase 4: Offline Mode (Priority: Critical)
Dependencies: Requires significant architectural change

Approach: Use Convex's offline support + local caching

New packages:

npm install @react-native-async-storage/async-storage expo-file-system
New files:

src/services/offlineStorage.ts - Local recipe caching
src/hooks/useOfflineRecipe.ts - Hook for offline-first access
src/components/OfflineIndicator.tsx - Network status badge
Files to modify:

app/recipe/[id].tsx - Add "Save offline" button
app/cookbook/[id].tsx - Download entire cookbook
convex/recipes.ts - Add downloadForOffline query
Implementation approach:

Store pinned recipes in AsyncStorage
Download images to expo-file-system
Queue mutations while offline
Sync when back online with conflict resolution
Phase 5: Cook Mode Improvements (Priority: Medium)
New features:

Screen wake lock
Larger touch targets
Voice commands (optional)
New packages:

npm install expo-keep-awake expo-speech
Files to modify:

app/cook-mode/[id].tsx - Main implementation
Implementation:

1. Add useKeepAwake() hook to prevent screen sleep
2. Enlarge step display and touch targets (minimum 64px)
3. Add "tap anywhere to advance" gesture
4. Optional: Add expo-speech for step read-aloud
5. Add photo upload per step (future)
   Phase 6: Unit Conversion Toggle (Priority: High)
   New files:

src/utils/unitConversion.ts - Conversion logic
src/components/UnitToggle.tsx - Toggle component
Files to modify:

app/recipe/[id].tsx - Add toggle to header
convex/users.ts - Save preference
Conversion tables needed:

Volume: cups ↔ ml, tbsp ↔ ml, tsp ↔ ml
Weight: oz ↔ g, lb ↔ kg
Temperature: °F ↔ °C
Implementation Order
Phase Feature Dependencies Effort
0 Security Hardening None Small
1 Recipe Scaling None Small
2 Ingredient Substitutions Phase 1 Medium
3 Pantry Tracking None Medium
4 Offline Mode None Large
5 Cook Mode Improvements None Small
6 Unit Conversion Phase 1 Small
Recommended sequence: 0 → 1 → 6 → 5 → 2 → 3 → 4

Verification Plan
Security Fixes
Test cookbook CRUD as different users
Attempt to delete another user's meal plan
Verify searchUsers returns paginated results
Recipe Scaling
Scale recipe to 0.5x, 2x, 4x servings
Verify fraction display (½, ⅓, ¾)
Check smart rounding for eggs, tablespoons
Unit Conversion
Toggle between metric/imperial
Verify conversions are accurate
Check preference persists
Offline Mode
Pin recipe while online
Enable airplane mode
Verify recipe displays correctly
Make changes offline, verify sync on reconnect
Files Summary
Critical files to review/modify:

convex/schema.ts - Schema additions
convex/cookbooks.ts - Security fix
convex/mealPlans.ts - Security fix
convex/shoppingLists.ts - Security fix + pantry integration
app/recipe/[id].tsx - Scaling, conversion, substitutions UI
app/cook-mode/[id].tsx - Improvements
New files to create:

src/utils/recipeScaling.ts
src/utils/unitConversion.ts
convex/substitutions.ts
convex/pantry.ts
app/pantry.tsx
src/services/offlineStorage.ts
