# Everyday Food

Recipe management and meal planning app for iOS, Android, and Web.

## Mandatory Testing Rule

After every bug fix or feature implementation, ALWAYS run `npm test` before considering the task complete. If tests fail, fix them before finishing.

## Quick Start

```bash
# Start development server
npm start

# Platform-specific
npm run android
npm run ios
npm run web

# Convex backend (run in separate terminal)
npx convex dev
```

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Expo | 54.0 |
| UI | React Native | 0.81 |
| React | React | 19.1 |
| Routing | Expo Router | 6.0 |
| Backend | Convex | 1.31 |
| Auth | @convex-dev/auth | 0.0.90 |
| State | Zustand | 5.0 |
| Animations | react-native-reanimated | 4.1 |
| Dates | date-fns | 4.1 |
| Testing | Jest + jest-expo + @testing-library/react-native | 29.7 / 54.0 / 13.3 |

## Project Structure

```
everyday_food/
  app/                          # Expo Router pages (file-based routing)
    (auth)/                     # Auth screens (login, register)
    (tabs)/                     # Tab navigation (home, recipes, meal-plan, profile, shopping)
    recipe/[id].tsx             # Recipe detail (dynamic route)
    cook-mode/[id].tsx          # Step-by-step cooking mode
    friends.tsx                 # Friends management
    grocery-list.tsx            # Shopping list
    import.tsx                  # Recipe import modal
    manual-recipe.tsx           # Manual recipe creation
    select-recipe.tsx           # Recipe selection
    share/[code].tsx            # Shared recipe view (by share code)
  src/
    components/
      ui/                       # Reusable UI: Button, Card, Input, Badge, Checkbox, IconButton
      navigation/BottomTabBar.tsx  # Custom bottom tab bar
      ShareRecipeModal.tsx      # Recipe sharing modal
    providers/
      ConvexProvider.tsx        # Convex client setup
      convexStorage.ts          # Secure storage adapter
    styles/neobrutalism.ts      # Design system tokens (colors, shadows, typography)
    types/recipe.ts             # Recipe TypeScript types
    test-utils/                 # Test helpers (ConvexMockProvider, testUtils)
  convex/                       # Backend (Convex BaaS)
    schema.ts                   # Database schema (15 tables)
    recipes.ts                  # Recipe CRUD, search, favorites
    mealPlans.ts                # Meal planning by date
    shoppingLists.ts            # Shopping list management
    friends.ts                  # Friendships & social
    recipeShares.ts             # Direct recipe sharing
    shareLinks.ts               # Shareable link generation
    users.ts                    # User profiles & stats
    public.ts                   # Public/unauthenticated queries
    seed.ts                     # Database seeding
    auth.ts                     # Auth setup
    auth.config.ts              # Auth provider config
    http.ts                     # HTTP routes
    lib/accessControl.ts        # Auth helpers & permission checks
    _generated/                 # Auto-generated types (DO NOT EDIT)
```

### Entry Points

- **App**: `expo-router/entry` (configured in package.json `main`)
- **Root Layout**: `app/_layout.tsx` — ConvexProvider wrapper, auth redirect logic
- **Tab Layout**: `app/(tabs)/_layout.tsx` — 4 tabs (Home, Recipes, Plan, Profile)
- **Backend**: `convex/` directory auto-deployed by Convex

## Database Schema (15 tables)

| Table | Purpose | Key Indexes |
|-------|---------|-------------|
| users | User profiles | by_token, by_email, search_users |
| recipes | Recipe metadata, nutrition | by_user, by_global, search_recipes |
| ingredients | Recipe ingredients | by_recipe, by_recipe_and_order |
| steps | Cooking steps | by_recipe, by_recipe_and_step |
| tags | Meal/cuisine/diet tags | by_user_and_type, by_name |
| recipeTags | Recipe↔Tag junction | by_recipe, by_tag |
| mealPlans | Scheduled meals by date | by_user_and_date, by_user_date_meal |
| shoppingLists | Shopping list headers | by_user_and_active |
| shoppingItems | Shopping list items | by_list, by_list_and_aisle |
| shoppingListRecipes | List↔Recipe tracking | by_list |
| cookingSessions | Active cooking state | by_user, by_recipe |
| importJobs | Recipe import jobs | by_user, by_status |
| nutritionCache | Cached nutrition data | by_name, by_expiry |
| friendships | User friendships | by_user_and_status, by_user_and_friend |
| recipeShares | Direct recipe shares | by_recipe, by_shared_with |
| shareLinks | Shareable link codes | by_code, by_recipe |
| shareLinkAccesses | Link access tracking | by_link |
| userRecipeInteractions | Favorites/ratings per user | by_user_and_recipe, by_user_and_favorite |

## Backend API Surface

### recipes.ts
- `list` (query) — Get user/shared/global recipes
- `getById` (query) — Single recipe with ingredients, steps, tags
- `getByMealType` (query) — Filter by meal type tag
- `getFavorites` (query) — User's favorite recipes
- `search` (query) — Full-text search
- `getQuickRecipes` (query) — Recipes under time threshold
- `createManual` (mutation) — Create recipe with ingredients/steps
- `toggleFavorite` (mutation) — Toggle favorite status
- `toggleGlobalRecipeFavorite` (mutation) — Favorite a global recipe

### mealPlans.ts
- `getByDate`, `getByDateRange` (queries)
- `addMeal`, `removeMeal` (mutations)

### shoppingLists.ts
- `getActive`, `list` (queries)
- `create`, `addItem`, `addRecipeIngredients`, `removeItem`, `toggleItem`, `clearChecked` (mutations)

### friends.ts
- `list`, `getPending`, `searchUsers`, `getStats` (queries)
- `sendRequest`, `acceptRequest`, `rejectRequest`, `cancelRequest`, `removeFriend`, `blockUser` (mutations)

### recipeShares.ts
- `getSharedWith`, `getSharedWithMe`, `canShare` (queries)
- `share`, `shareWithMultiple`, `unshare`, `unshareAll` (mutations)

### shareLinks.ts
- `getByRecipe`, `getMyLinks` (queries)
- `create`, `revoke`, `reactivate`, `deleteLink`, `deleteAllForRecipe` (mutations)

### users.ts
- `current`, `getStats` (queries)
- `getOrCreateProfile`, `updateProfile` (mutations)

### public.ts (no auth required)
- `getRecipeByShareCode`, `validateShareCode` (queries)
- `recordShareLinkAccess` (mutation)

### seed.ts
- `seedDatabase`, `clearUserData` (mutations)

## App Screens

| Route | Screen | Description |
|-------|--------|-------------|
| `/(tabs)/` | Home | Dashboard, recent recipes, quick actions |
| `/(tabs)/recipes` | Recipes | Recipe browser with search/filter |
| `/(tabs)/meal-plan` | Meal Plan | Calendar-based meal planner |
| `/(tabs)/profile` | Profile | User settings, stats |
| `/(auth)/login` | Login | Authentication |
| `/(auth)/register` | Register | User registration |
| `/recipe/[id]` | Recipe Detail | Full recipe with ingredients, steps |
| `/cook-mode/[id]` | Cook Mode | Step-by-step cooking interface |
| `/friends` | Friends | Friend management, search users |
| `/grocery-list` | Grocery List | Shopping list |
| `/import` | Import | Recipe URL import (modal) |
| `/manual-recipe` | Manual Recipe | Create recipe from scratch (modal) |
| `/select-recipe` | Select Recipe | Pick recipe for meal plan |
| `/share/[code]` | Shared Recipe | View recipe via share link |

## UI Components (`src/components/`)

| Component | File | Purpose |
|-----------|------|---------|
| Button | ui/Button.tsx | Primary action button with press feedback |
| Card | ui/Card.tsx | Content container with neo-brutalist borders/shadows |
| Input | ui/Input.tsx | Text input field |
| Badge | ui/Badge.tsx | Status/category label |
| Checkbox | ui/Checkbox.tsx | Toggle checkbox |
| IconButton | ui/IconButton.tsx | Icon-only pressable button |
| BottomTabBar | navigation/BottomTabBar.tsx | Custom tab navigation bar |
| ShareRecipeModal | ShareRecipeModal.tsx | Recipe sharing dialog |

## Design System

Located in `src/styles/neobrutalism.ts`.

### Colors
```
primary: #2DD881 (green)
secondary: #FFE14D (yellow)
accent: #FF6B54 (coral)
text: #1A1A1A
background: #FAFAFA
surface: #FFFFFF
```

### Meal Type Colors
```
breakfast: #D4F5E0 (light mint)
lunch: #FFF4CC (light yellow)
dinner: #FFE8D4 (light peach)
snack: #E5FAFF (light cyan)
```

### Borders & Shadows
- Borders: 2-4px solid #1A1A1A
- Shadows: Offset-based (no blur)
  - `shadows.sm`: 3px offset
  - `shadows.md`: 4px offset
  - `shadows.pressed`: 1px (for press state)

### Typography
- Titles: uppercase, italic, black weight (900)
- Body: 15px, regular weight
- Small: 13px for metadata

## Code Conventions

### Styling
- Import tokens from `@/src/styles/neobrutalism`
- Use `StyleSheet.create()` at bottom of file
- Neo-brutalist: bold borders, offset shadows, vibrant colors
- Path alias: `@/` maps to project root

### Animations
```tsx
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";

// Staggered entry
<Animated.View entering={FadeInDown.delay(index * 100).duration(400)}>
```

### Press Feedback
```tsx
<Pressable
  style={({ pressed }) => [
    styles.base,
    pressed && styles.pressed,
  ]}
>

// In StyleSheet:
pressed: {
  transform: [{ translateX: 2 }, { translateY: 2 }],
  ...shadows.pressed,
}
```

### Navigation
```tsx
import { router } from "expo-router";
router.push("/recipe/123");
router.push("/(tabs)/recipes");
```

### Convex Queries
```tsx
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

const recipes = useQuery(api.recipes.list);
const toggleFavorite = useMutation(api.recipes.toggleFavorite);
```

### Key Patterns
- **Auth guard**: `app/_layout.tsx` redirects unauthenticated users to login
- **Access control**: `convex/lib/accessControl.ts` — `getCurrentUserId()`, `canReadRecipe()`, `canModifyRecipe()`

## Common Patterns

### Screen Template
```tsx
<SafeAreaView style={styles.container} edges={["top"]}>
  <ScrollView contentContainerStyle={styles.content}>
    {/* Content */}
  </ScrollView>
</SafeAreaView>
```

### Card Component
```tsx
<View style={[styles.card, { backgroundColor: colors.surface }]}>
  {/* 3px border, 4px offset shadow, 16px border radius */}
</View>
```

### Section Header
```tsx
<View style={styles.sectionHeader}>
  <Text style={styles.sectionTitle}>SECTION NAME</Text>
  <Pressable onPress={onViewAll}>
    <Text style={styles.sectionLink}>VIEW ALL</Text>
  </Pressable>
</View>
```

## Tests

### Unit Tests (19 files, Jest + @testing-library/react-native)

| Area | Files |
|------|-------|
| Auth | login.test.tsx, register.test.tsx |
| Tabs | index.test.tsx, recipes.test.tsx, meal-plan.test.tsx, profile.test.tsx, shopping.test.tsx |
| Features | friends.test.tsx, [id].test.tsx (recipe detail) |
| Components | ShareRecipeModal.test.tsx, BottomTabBar.test.tsx |
| UI | Button.test.tsx, Card.test.tsx, Badge.test.tsx, Checkbox.test.tsx, IconButton.test.tsx, Input.test.tsx |

### Coverage Thresholds
- Branches: 35%, Functions: 35%, Lines: 40%, Statements: 40%

### E2E Tests (Maestro)
- Scripts: auth, recipes, meal-plan, grocery flows

## Scripts

| Command | Action |
|---------|--------|
| `npm start` | Start Expo dev server |
| `npm run dev` | Start Expo + Convex concurrently |
| `npm run android/ios/web` | Platform-specific start |
| `npm run convex` | `convex dev` (backend hot reload) |
| `npm test` | Run Jest tests |
| `npm run test:coverage` | Jest with coverage report |
| `npm run test:e2e` | Run Maestro E2E tests |

## Configuration

| File | Purpose |
|------|---------|
| package.json | Dependencies, scripts |
| tsconfig.json | TypeScript (strict, @/ path alias) |
| app.json | Expo config (scheme: everydayfoodapp, typed routes) |
| jest.config.js | Test config (jest-expo preset, coverage thresholds) |
| jest.setup.js | Test setup |
| convex/auth.config.ts | Auth provider (Convex site URL) |
