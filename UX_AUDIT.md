# UX Audit Report — Everyday Food

**Date:** 2026-03-08
**Platform:** React Native (Expo) — iOS, Android, Web
**Design System:** Neo-brutalism
**Screens Audited:** 15 screens, 9 components, 1 design token file

---

## Executive Summary

The app has **strong visual identity** with its neo-brutalist design and **good animation foundations**. However, it has **critical accessibility gaps**, **undersized touch targets**, **missing error states**, and **color contrast failures** that must be addressed before production release.

| Severity | Count | Impact |
|----------|-------|--------|
| Critical | 12 | Blocks accessibility compliance, causes user failures |
| High | 14 | Significant friction, poor mobile UX |
| Medium | 11 | Polish issues, inconsistencies |
| Low | 6 | Nice-to-have improvements |

---

## 1. UX Problems

### 1.1 No Error Recovery on Failed Queries

**Severity: CRITICAL**
**Screens:** Home, Recipes, Profile

When Convex queries fail (network error, server error), the app shows a loading spinner indefinitely. There is no:
- Error state UI
- Retry button
- Timeout detection
- Offline indicator

**Files affected:**
- `app/(tabs)/index.tsx` — no error handling for `recentlyViewed` query
- `app/(tabs)/recipes.tsx` — no error handling for `search` query
- `app/(tabs)/profile.tsx` — no error handling for user data query

**Fix:** Add error boundary wrapper + per-query error states with retry buttons.

```tsx
// Pattern to implement on every screen
if (error) {
  return (
    <View style={styles.errorContainer}>
      <Ionicons name="cloud-offline-outline" size={48} />
      <Text>Something went wrong</Text>
      <Button title="Try Again" onPress={retry} />
    </View>
  );
}
```

---

### 1.2 Silent Failures in Meal Plan

**Severity: CRITICAL**
**Screen:** Meal Plan (`app/(tabs)/meal-plan.tsx`)

Several catch blocks silently swallow errors without user feedback:
- `handleChangeMeal` — fails silently
- `handleGeneratePlan` — partial error handling
- `handleRemoveMeal` — has toast (good), but other operations don't

**Fix:** Replace all empty catch blocks with toast error messages.

---

### 1.3 Servings Controls Require Excessive Tapping

**Severity: HIGH**
**Screens:** Meal Plan, Recipe Detail, Select Recipe

To change servings from 2 to 8, users must tap the `+` button 6 times. There is no:
- Direct number input
- Long-press for rapid increment
- Number picker/slider

**Fix:** Add long-press handler for rapid increment, or add a tappable number that opens a picker.

---

### 1.4 Search Provides No Context in Empty State

**Severity: MEDIUM**
**Screen:** Recipes (`app/(tabs)/recipes.tsx`)

When search returns no results, the empty state says "No recipes found" but doesn't show what was searched. Users lose context.

**Fix:** Show "No recipes found for '{searchTerm}'" in the empty state.

---

### 1.5 No Skeleton Screens

**Severity: MEDIUM**
**Screens:** All

Every screen uses a generic `ActivityIndicator` spinner. This hurts perceived performance — skeleton screens would show layout structure while loading.

**Fix:** Create skeleton components matching card layouts for recipe cards, meal cards, and list items.

---

### 1.6 New User Onboarding Gap

**Severity: MEDIUM**
**Screen:** Home (`app/(tabs)/index.tsx`)

A brand-new user with zero recipes and zero meal plans sees a mostly empty home screen. There's no:
- Welcome message
- Quick-start guide
- Sample recipes prompt
- First-action suggestion

**Fix:** Add a first-time user empty state with onboarding CTAs.

---

## 2. Usability Issues

### 2.1 Undersized Touch Targets (Below 44x44px Minimum)

**Severity: CRITICAL**

Per Apple HIG and Material Design guidelines, minimum touch target is 44x44pt. Multiple violations found:

| Element | Actual Size | Location | Risk |
|---------|-------------|----------|------|
| Servings +/- buttons | 24x24px | Meal Plan | Users miss taps constantly |
| Meal arrow navigation | 32x32px | Home | Hard to tap while scrolling |
| Ingredient checkboxes | 24x24px | Recipe Detail | Frustrating in kitchen with wet hands |
| Grocery checkboxes | 28x28px | Grocery List | Same kitchen context |
| Friend action buttons | 36x36px | Friends | Accept/reject hard to tap |
| Unshare button | ~20x20px | ShareRecipeModal | Nearly impossible to tap |
| IconButton (sm variant) | 32x32px | Multiple | Used across the app |
| Tab icon container | 40x40px | BottomTabBar | Close but below minimum |
| Input right icon | 36x36px | Input component | Password toggle hard to hit |
| Modal close button | 40x40px | ShareRecipeModal | Frustrating to dismiss |
| Button (sm variant) | ~32px height | Button component | Below minimum |

**Fix:** Set minimum 44x44px for all interactive elements. Use `hitSlop` as a fallback where visual size must stay small.

---

### 2.2 Keyboard Handling Gaps

**Severity: HIGH**

| Issue | Screens |
|-------|---------|
| No `returnKeyType` on inputs | Login, Register, Search, Manual Recipe |
| No `onSubmitEditing` to advance focus | Login, Register, Manual Recipe |
| Keyboard not dismissed after actions | Select Recipe search, Friends search |
| No `textContentType` for autofill | Login, Register (breaks iOS password autofill) |

**Fix per screen:**
- Login/Register: Add `returnKeyType="next"` on all fields except last (`"done"`), chain `onSubmitEditing` to focus next input, add `textContentType` for autofill
- Search inputs: Dismiss keyboard on result selection
- Manual Recipe: Chain focus through form fields

---

### 2.3 Confirm Password Missing Show/Hide Toggle

**Severity: HIGH**
**Screen:** Register (`app/(auth)/register.tsx`)

The password field has a show/hide toggle, but the "Confirm Password" field does not. Users cannot verify their confirmation matches without toggling the first password field.

**Fix:** Add identical show/hide toggle to confirm password field.

---

### 2.4 No Pull-to-Refresh

**Severity: MEDIUM**
**Screens:** Recipes, Meal Plan, Friends, Grocery List

Mobile users expect pull-to-refresh on list screens. Currently none of the ScrollView/FlatList components implement `refreshControl`.

**Fix:** Add `RefreshControl` to all scrollable list screens.

---

### 2.5 No Confirmation Before Destructive Actions

**Severity: HIGH**

| Action | Screen | Has Confirmation? |
|--------|--------|-------------------|
| Remove meal | Meal Plan | No |
| Delete recipe | Recipe Detail | No |
| Finish cooking | Cook Mode | No |
| Clear checked items | Shopping/Grocery | No |
| Remove friend | Friends | Yes (good) |

**Fix:** Add `Alert.alert` confirmation dialogs for all destructive/irreversible actions.

---

### 2.6 Import URL Has No Validation Feedback

**Severity: MEDIUM**
**Screen:** Import (`app/import.tsx`)

The URL input accepts any text with no format validation. Users can type "hello" and hit import — the button becomes enabled. The clipboard paste button appears non-functional.

**Fix:** Validate URL format before enabling import button, show inline error for invalid URLs, implement clipboard paste.

---

### 2.7 Manual Recipe Form — No Auto-Save

**Severity: MEDIUM**
**Screen:** Manual Recipe (`app/manual-recipe.tsx`)

A 4-step form with no auto-save. If the user navigates away or the app crashes, all progress is lost.

**Fix:** Persist form state to AsyncStorage on each step change.

---

## 3. Accessibility Problems

### 3.1 Missing Accessibility Labels Throughout

**Severity: CRITICAL**

Icon-only buttons across the app lack `accessibilityLabel`. Screen reader users cannot navigate the app.

**Screens with missing labels:**

| Screen | Elements Missing Labels |
|--------|----------------------|
| Home | Notification button, import button, meal navigation arrows |
| Meal Plan | Week navigation buttons, day selector items, servings +/-, add meal buttons |
| Profile | Back button, settings button |
| Recipes | Clear filters button |
| Shopping | Clear checked button |
| Cook Mode | Voice/speaker button, screen-always-on toggle |
| Friends | Pending count badge, ellipsis menu button |
| Grocery List | Category headers, trash/clear button |
| BottomTabBar | All tab items (no `accessibilityRole` or `accessibilityLabel`), FAB button |
| ShareRecipeModal | Close button, friend items, unshare button, share button |

**Fix:** Audit every `Pressable`, `TouchableOpacity`, and `IconButton` — add `accessibilityLabel` describing the action (e.g., "Remove meal", "Go to next week", "Toggle favorite").

---

### 3.2 Color Contrast Failures (WCAG AA)

**Severity: CRITICAL**

Calculated contrast ratios against `#FAFAFA` background and `#FFFFFF` surface:

| Color | Hex | On Background | On Surface | WCAG AA (4.5:1) |
|-------|-----|---------------|------------|-----------------|
| textMuted | #8A8A8A | ~3.5:1 | ~3.2:1 | **FAIL** |
| primary (as text) | #2DD881 | ~2.2:1 | ~2.0:1 | **FAIL** |
| secondary (as text) | #FFE14D | ~1.5:1 | ~1.4:1 | **FAIL** |
| info/cyan (as text) | #00D4FF | ~2.3:1 | ~2.1:1 | **FAIL** |
| fat label (yellow) | #FFE14D | ~1.5:1 | ~1.4:1 | **FAIL** |
| textSecondary | #4A4A4A | ~8.5:1 | ~7.8:1 | PASS |
| text | #1A1A1A | ~16:1 | ~15:1 | PASS |
| error | #FF4757 | ~3.8:1 | ~3.5:1 | **FAIL** (normal text) |

**Most impacted areas:**
- `textMuted` is used extensively for meta text, timestamps, descriptions
- `primary` (#2DD881) used as text for links, active states, "Already shared" labels
- `secondary` (#FFE14D) used for fat nutrition label — invisible on white
- Tab labels at 11px + primary color = double failure (small + low contrast)

**Fix:**
- Darken `textMuted` from `#8A8A8A` to at least `#6B6B6B` (4.5:1 on white)
- Never use `primary`, `secondary`, `info`, or `cyan` as text on light backgrounds
- For colored text on light bg, use the accent variants (e.g., `lunchAccent` #FFB800 → darken to ~#996E00)
- For nutrition labels, use dark text on colored badge backgrounds instead

---

### 3.3 Custom Controls Lack Semantic Accessibility

**Severity: HIGH**

| Element | Issue |
|---------|-------|
| Cook Mode "Screen Always On" toggle | Custom dot UI (12x12) with no `accessibilityRole="switch"` or state |
| Grocery list checkbox | Custom circle, no `accessibilityRole="checkbox"` wrapper |
| Aisle/Recipe view toggle | No `accessibilityRole="tablist"` / `accessibilityState.selected` |
| Step progress indicator | No `accessibilityValue` for current step |
| Manual recipe step dots | No semantic meaning for screen readers |

**Fix:** Wrap all custom controls with appropriate `accessibilityRole`, `accessibilityState`, and `accessibilityValue` props.

---

### 3.4 No Focus Management in Modals

**Severity: HIGH**
**Components:** ShareRecipeModal, Unit Picker (manual recipe), Servings picker

When modals open:
- Focus does not move to the modal content
- No focus trap (tab key can reach elements behind the modal)
- When modal closes, focus doesn't return to the trigger element

**Fix:** Use `accessibilityViewIsModal={true}` on modal containers and manage focus with `ref.focus()`.

---

### 3.5 No `prefers-reduced-motion` Support

**Severity: MEDIUM**

The app uses staggered `FadeInDown`, `FadeInRight`, spring animations, and scale transforms throughout. Users with motion sensitivity have no way to disable animations.

**Fix:** Check `AccessibilityInfo.isReduceMotionEnabled` and conditionally disable/simplify animations.

---

### 3.6 Images and Emojis Without Alt Text

**Severity: MEDIUM**

Emojis are used as visual indicators (meal type icons, empty states) without `accessibilityLabel`. Recipe images in cards don't consistently have `accessible` + `accessibilityLabel` props.

**Fix:** Add `accessibilityLabel` to all `Image` components and wrap emoji `Text` elements with labels.

---

## 4. Mobile UX Best Practices Violations

### 4.1 No Haptic Feedback

**Severity: MEDIUM**

Modern mobile apps use haptic feedback for:
- Button presses (light impact)
- Destructive actions (warning notification)
- Success states (success notification)
- Toggle switches (selection)

The app has zero haptic feedback despite using `expo-haptics` being trivial to add.

**Fix:** Add `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)` to primary actions, `Medium` for toggles, `Heavy` for destructive confirmations.

---

### 4.2 Cook Mode Missing Critical Kitchen Features

**Severity: HIGH**
**Screen:** Cook Mode (`app/cook-mode/[id].tsx`)

Good: Screen keep-awake is implemented.
Missing:
- **No timer functionality** — shows "Est. X mins" but no actual timer
- **No screen brightness boost** — kitchens often have glare
- **No voice commands** — hands may be dirty/wet
- **Text-to-speech lacks visual captions** — hearing-impaired users have no alternative
- **No accidental finish protection** — one tap completes cooking, no undo

**Fix:** Priority order: (1) Add confirmation on finish, (2) Add step timer, (3) Increase button sizes for wet-hand use.

---

### 4.3 Inconsistent Press Feedback Patterns

**Severity: LOW**

Different press feedback styles used across the app:

| Pattern | Where Used |
|---------|-----------|
| `translateX/Y: 2` + `shadows.pressed` | Cards, buttons (most common) |
| `opacity: 0.7` + `scale: 0.95` | Favorite heart button |
| `backgroundColor` change | Filter chips, friend items |
| Spring `scale: 1.05` | Tab bar items |
| No feedback | Checkbox, Input right icon, Unshare button |

**Fix:** Standardize on 2-3 feedback patterns: (1) translateX/Y for buttons/cards, (2) opacity for toggles, (3) background color for selections. Ensure every interactive element has at least one.

---

### 4.4 Bottom Spacing Hardcoded

**Severity: MEDIUM**

Multiple screens use `paddingBottom: 150` or `paddingBottom: 170` to account for the tab bar. This is device-dependent and will break on:
- Devices without home indicator (older iPhones, most Androids)
- Tablets
- Landscape orientation

**Fix:** Calculate bottom padding dynamically using `useBottomTabBarHeight()` or `useSafeAreaInsets().bottom + TAB_BAR_HEIGHT`.

---

### 4.5 No Offline State Handling

**Severity: HIGH**

The app has no awareness of network state. When offline:
- Queries spin forever
- Mutations fail silently
- No cached data shown
- No "You're offline" banner

**Fix:** Use `@react-native-community/netinfo` to detect connectivity, show an offline banner, and cache recent data with Convex's offline support.

---

### 4.6 No Auto-Focus on Entry Screens

**Severity: LOW**
**Screens:** Login, Register, Search, Import

None of the primary input screens auto-focus the first field. Users must manually tap to begin typing.

**Fix:** Add `autoFocus={true}` to the first input on Login, Register, Import, and Search screens.

---

## 5. Actionable Improvements — Prioritized Roadmap

### P0 — Critical (Fix Before Release)

| # | Issue | Effort | Files |
|---|-------|--------|-------|
| 1 | Add `accessibilityLabel` to all icon buttons/pressables | 2-3h | All screens + components |
| 2 | Fix touch targets below 44x44px (servings, checkboxes, friend buttons, unshare, IconButton sm) | 2-3h | 8+ files |
| 3 | Fix color contrast — darken `textMuted` to `#6B6B6B`, stop using `primary`/`secondary`/`cyan` as text on light backgrounds | 1-2h | `neobrutalism.ts` + screens using colored text |
| 4 | Add error states with retry buttons to all query-dependent screens | 3-4h | Home, Recipes, Profile, Meal Plan |
| 5 | Replace silent catch blocks with error toasts | 1h | `meal-plan.tsx` |
| 6 | Add confirmation dialogs for destructive actions (remove meal, delete recipe, finish cooking, clear items) | 1-2h | 4 screens |
| 7 | Add `textContentType` to Login/Register inputs for autofill | 15min | `login.tsx`, `register.tsx` |
| 8 | Add show/hide toggle to Confirm Password field | 15min | `register.tsx` |

### P1 — High Priority (Fix Within First Sprint)

| # | Issue | Effort | Files |
|---|-------|--------|-------|
| 9 | Add `returnKeyType` and `onSubmitEditing` focus chains to all forms | 1-2h | Login, Register, Manual Recipe, Import |
| 10 | Keyboard dismiss on search result selection | 30min | `select-recipe.tsx`, `friends.tsx` |
| 11 | Add `accessibilityRole`/`accessibilityState` to custom controls (toggles, checkboxes, progress) | 2h | Cook Mode, Grocery List, Manual Recipe |
| 12 | Add `accessibilityViewIsModal` and focus management to modals | 1h | ShareRecipeModal, unit picker |
| 13 | Implement offline state detection and banner | 2-3h | `_layout.tsx` + new component |
| 14 | Add pull-to-refresh on list screens | 1h | Recipes, Meal Plan, Friends, Grocery |
| 15 | Add direct number input option for servings (long-press or tappable number) | 2h | Meal Plan, Recipe Detail, Select Recipe |
| 16 | Cook Mode: Add finish confirmation + larger button targets | 1h | `cook-mode/[id].tsx` |
| 17 | Dynamic bottom padding instead of hardcoded 150/170px | 1h | All tab screens |

### P2 — Medium Priority (Next Release)

| # | Issue | Effort | Files |
|---|-------|--------|-------|
| 18 | Implement skeleton loading screens for recipe/meal cards | 3-4h | New component + all screens |
| 19 | Add haptic feedback to buttons, toggles, destructive actions | 1-2h | Button, Checkbox, IconButton + screens |
| 20 | Add `prefers-reduced-motion` check to disable/simplify animations | 1h | All screens with animations |
| 21 | Search empty state: show the search term in message | 15min | `recipes.tsx` |
| 22 | URL validation on import screen + fix clipboard paste | 1h | `import.tsx` |
| 23 | Auto-save form state in Manual Recipe | 2h | `manual-recipe.tsx` |
| 24 | New user onboarding empty state on Home | 2h | `index.tsx` |
| 25 | Standardize press feedback patterns across all components | 2h | All components |
| 26 | Add `accessibilityLabel` to emoji decorators and images | 1h | All screens |

### P3 — Low Priority (Polish)

| # | Issue | Effort | Files |
|---|-------|--------|-------|
| 27 | Auto-focus first input on Login, Register, Import, Search | 15min | 4 screens |
| 28 | Cook Mode: Add step timer functionality | 4-6h | `cook-mode/[id].tsx` |
| 29 | Cook Mode: Screen brightness boost option | 1h | `cook-mode/[id].tsx` |
| 30 | Add captions/transcript for text-to-speech in Cook Mode | 2h | `cook-mode/[id].tsx` |
| 31 | Horizontal scroll "peek" indicators for recipe card lists | 1h | Home screen |
| 32 | Input character limits with visual counter | 1h | Input component + screens |

---

## Design System Recommendations

### Color Tokens to Add/Modify

```typescript
// In neobrutalism.ts — proposed fixes
export const colors = {
  // ...existing colors...

  // FIX: Darken textMuted for WCAG AA compliance (4.5:1 on white)
  textMuted: "#6B6B6B",    // was #8A8A8A (3.2:1) → now ~4.7:1

  // ADD: Dark variants for colored text on light backgrounds
  primaryDark: "#1B8A52",   // for green text on light bg (4.5:1+)
  warningDark: "#996E00",   // for yellow/warning text on light bg
  errorDark: "#CC2233",     // for red text on light bg (4.5:1+)
  infoDark: "#007A99",      // for cyan/info text on light bg
};
```

### Touch Target Constants to Add

```typescript
// In neobrutalism.ts
export const touchTargets = {
  minimum: 44,       // Apple HIG / Material minimum
  comfortable: 48,   // Recommended for primary actions
  large: 56,         // For imprecise contexts (kitchen/cooking)
};
```

### Accessibility Helpers to Create

```typescript
// New file: src/lib/accessibility.ts
import { AccessibilityInfo } from 'react-native';

export const useReducedMotion = () => {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduced);
    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged', setReduced
    );
    return () => sub.remove();
  }, []);
  return reduced;
};
```

---

## Testing Checklist

Before shipping fixes, verify:

- [ ] VoiceOver (iOS): Navigate every screen using swipe gestures
- [ ] TalkBack (Android): Navigate every screen using explore-by-touch
- [ ] All interactive elements announced with meaningful labels
- [ ] Color contrast: Use Accessibility Inspector (Xcode) to verify ratios
- [ ] Touch targets: Tap every button in "worst case" (phone in one hand, thumb reach)
- [ ] Keyboard: Tab through all forms, verify focus order matches visual order
- [ ] Reduced motion: Enable "Reduce Motion" in device settings, verify no jarring animations
- [ ] Offline: Enable airplane mode, verify graceful degradation
- [ ] Screen reader + modal: Verify focus trapped inside modals
- [ ] Dynamic type: Increase system font size to max, verify text doesn't clip

---

*Generated by UX Audit — Everyday Food v1.0*
