# Everyday Food

Recipe management and meal planning app for iOS, Android, and Web.

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

- **Framework**: Expo 54 + React Native 0.81 + React 19
- **Routing**: Expo Router 6 (file-based)
- **Backend**: Convex (BaaS with real-time database)
- **Auth**: @convex-dev/auth
- **State**: Zustand
- **Animations**: react-native-reanimated

## Project Structure

```
app/                    # Expo Router pages
  (auth)/               # Auth screens (login, register)
  (tabs)/               # Tab navigation
    index.tsx           # Home screen
    recipes.tsx         # Recipe browser
    meal-plan.tsx       # Meal planner
    profile.tsx         # User profile
  recipe/[id].tsx       # Recipe detail (dynamic)
  cookbook/[id].tsx     # Cookbook view (dynamic)
  cook-mode/[id].tsx    # Step-by-step cooking
  grocery-list.tsx      # Shopping list
  import.tsx            # Recipe import modal

src/
  components/ui/        # Reusable components (Button, Card, Badge, etc.)
  styles/neobrutalism.ts # Design system tokens
  providers/            # Convex provider setup

convex/                 # Backend functions
  schema.ts             # Database schema
  recipes.ts            # Recipe queries/mutations
  cookbooks.ts          # Cookbook functions
  shoppingLists.ts      # Shopping list functions
  users.ts              # User functions
  _generated/           # Auto-generated types
```

## Database Schema (Convex)

| Table | Purpose |
|-------|---------|
| users | User profiles, preferences |
| recipes | Recipe metadata, nutrition |
| ingredients | Recipe ingredients (by_recipe index) |
| steps | Cooking steps (by_recipe index) |
| cookbooks | Recipe collections |
| cookbookRecipes | Many-to-many: cookbooks <-> recipes |
| tags | Meal type, cuisine, diet tags |
| recipeTags | Many-to-many: recipes <-> tags |
| mealPlans | Scheduled meals by date |
| shoppingLists | Shopping list headers |
| shoppingItems | Shopping list items |
| cookingSessions | Active cooking state |

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
