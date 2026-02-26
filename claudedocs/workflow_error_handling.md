# Error Handling Implementation Plan
**Feature**: Unified Error Handling + Neo-Brutalist Toast System
**Status**: Ready for implementation
**Generated**: 2026-02-26
**Based on**: `/sc:design` analysis — full codebase audit of 12 screens

---

## Problem Summary

1. **Login bug**: Raw Convex auth error codes (e.g. `InvalidAccountId`) displayed verbatim to users via `Alert.alert()`
2. **Silent failures**: `meal-plan.tsx`, `edit-profile.tsx`, `grocery-list.tsx` silently swallow errors with only `console.error`
3. **Inconsistent UX**: Mix of `Alert.alert()` (blocking, platform-styled) vs no feedback at all
4. **No toast system**: No non-blocking notification mechanism — everything is either a modal alert or nothing

---

## Architecture Overview

```
src/
  lib/
    errors.ts                  ← Phase 1: Error normalization (no UI)
  components/
    ui/
      Toast.tsx                ← Phase 2: Visual toast component
  providers/
    ToastProvider.tsx          ← Phase 3: Zustand store + container
  hooks/
    useToast.ts                ← Phase 3: Convenience hook
app/
  _layout.tsx                  ← Phase 4: Wire ToastContainer to root
  (auth)/
    login.tsx                  ← Phase 5: Fix login bug
    register.tsx               ← Phase 5: Fix register
  (tabs)/
    meal-plan.tsx              ← Phase 6: Replace silent failures
    profile.tsx                ← Phase 6
    recipes.tsx                ← Phase 6
  friends.tsx                  ← Phase 6: Replace Alert with toasts
  grocery-list.tsx             ← Phase 6: Replace silent failures
  manual-recipe.tsx            ← Phase 6: Inline validation + toast for submit
  recipe/[id].tsx              ← Phase 6
  cook-mode/[id].tsx           ← Phase 6
  select-recipe.tsx            ← Phase 6
  settings.tsx                 ← Phase 6
```

**No new npm dependencies.** Uses existing: `react-native-reanimated` (animations), `zustand` (state).

---

## Two Core Rules (Applied Throughout)

| Situation | Solution | Example |
|-----------|----------|---------|
| Validation before submit | Inline `Input error={...}` prop | Empty field, bad email format |
| Async operation result | Toast (`showError` / `showSuccess`) | Login failed, recipe saved |
| Destructive confirmation | Keep `Alert.alert()` | "Delete this recipe?" |

---

## Phase 1 — Error Normalization

**File**: `src/lib/errors.ts`
**Dependencies**: None
**Tests to update**: None (new utility, add unit tests)

### What to build

A pure utility — no React, no UI. Maps raw Convex/server error codes to user-friendly strings.

```typescript
// Convex Password provider error codes
const AUTH_ERROR_MAP: Record<string, string> = {
  InvalidAccountId: "No account found with this email. Check your email or sign up.",
  InvalidSecret: "Incorrect password. Please try again.",
  TooManyFailedAttempts: "Too many failed attempts. Please try again later.",
  AccountAlreadyExists: "An account with this email already exists. Please sign in instead.",
  InvalidFlow: "Something went wrong. Please try again.",
};

export function parseAuthError(error: unknown): string
export function parseMutationError(error: unknown, fallback: string): string
```

### Decision logic for `parseAuthError`
1. Check if `error.message` contains a known auth code → return mapped friendly string
2. If message contains spaces and is < 120 chars → it's human-readable, return as-is
3. Otherwise → return generic fallback

### Checkpoint
- [ ] `parseAuthError(new Error("InvalidAccountId"))` returns account-not-found message
- [ ] `parseAuthError(new Error("Invalid email or password"))` returns the message as-is
- [ ] `parseAuthError("random garbage code")` returns generic fallback

---

## Phase 2 — Toast Component

**File**: `src/components/ui/Toast.tsx`
**Dependencies**: `react-native-reanimated` (already installed), `@expo/vector-icons` (already installed)
**Design tokens**: All from `src/styles/neobrutalism.ts`

### Visual spec

```
┌──────────────────────────────────────────────┐
│  ●  No account found with this email.   [✕]  │
│     Check your email or sign up.             │
└──────────────────────────────────────────────┘
  borderWidth: 3px (borders.regular)
  shadowOffset: 4px (shadows.md)
  borderRadius: 12px (borderRadius.md)
```

### Type → Color mapping (design system colors)

| Type | Background | Text | Icon |
|------|-----------|------|------|
| `error` | `colors.error` (#FF4757) | `colors.textLight` | `alert-circle` |
| `success` | `colors.success` (#2DD881) | `colors.text` | `checkmark-circle` |
| `warning` | `colors.warning` (#FFB800) | `colors.text` | `warning` |
| `info` | `colors.info` (#00D4FF) | `colors.text` | `information-circle` |

### Animation (Reanimated)
```typescript
entering={SlideInUp.duration(300).springify().damping(15)}
exiting={FadeOut.duration(200)}
```

### Props interface
```typescript
interface ToastProps {
  id: string;
  type: "success" | "error" | "warning" | "info";
  message: string;
  onDismiss: (id: string) => void;
  duration?: number;  // default 3500ms
}
```

### Checkpoint
- [ ] All 4 types render with correct background colors
- [ ] Slides in from top on mount, fades out on dismiss
- [ ] Auto-dismisses after `duration` ms
- [ ] Tap ✕ button dismisses immediately
- [ ] Long messages wrap correctly without overflow

---

## Phase 3 — Toast Provider & Hook

### File 1: `src/providers/ToastProvider.tsx`

Zustand store (global, no React context needed for state):

```typescript
interface ToastItem {
  id: string;          // nanoid or Date.now().toString()
  type: ToastType;
  message: string;
  duration?: number;
}

const useToastStore = create<{
  toasts: ToastItem[];
  add: (toast: Omit<ToastItem, "id">) => void;
  remove: (id: string) => void;
}>((set) => ({
  toasts: [],
  add: (toast) => set((s) => ({
    toasts: [...s.toasts.slice(-2), { ...toast, id: Date.now().toString() }]
    // Cap at 3 toasts max to prevent overflow
  })),
  remove: (id) => set((s) => ({ toasts: s.toasts.filter(t => t.id !== id) })),
}));
```

`ToastContainer` component (renders at app root):
```typescript
export function ToastContainer() {
  const toasts = useToastStore(s => s.toasts);
  const remove = useToastStore(s => s.remove);

  return (
    <View
      style={[StyleSheet.absoluteFill, styles.container]}
      pointerEvents="box-none"   // ← allows touches to pass through to content below
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onDismiss={remove} />
      ))}
    </View>
  );
}
```

Positioning: `top: 60` (below status bar / notch), `paddingHorizontal: spacing.lg`, stacked vertically with `gap: 8`.

### File 2: `src/hooks/useToast.ts`

```typescript
export function useToast() {
  const add = useToastStore(s => s.add);

  return {
    showToast: (opts: Omit<ToastItem, "id">) => add(opts),
    showError: (message: string) => add({ type: "error", message }),
    showSuccess: (message: string) => add({ type: "success", message }),
    showWarning: (message: string) => add({ type: "warning", message }),
    showInfo: (message: string) => add({ type: "info", message }),
  };
}
```

### Checkpoint
- [ ] Multiple toasts stack (max 3, oldest drops off)
- [ ] Toasts from anywhere in the app tree appear correctly
- [ ] `pointerEvents="box-none"` — taps pass through to content when no toast shown
- [ ] No re-render of unrelated components when toast state changes

---

## Phase 4 — Wire to App Root

**File**: `app/_layout.tsx`

Add `<ToastContainer />` as a sibling to the `<Stack>` navigator, inside `ConvexProvider`:

```tsx
// Inside RootLayoutNav return:
<>
  <Stack>
    {/* existing screens */}
  </Stack>
  <ToastContainer />   {/* ← add this */}
</>
```

### Checkpoint
- [ ] Toast appears on top of navigation stack, modals, and tab bar
- [ ] Toast appears on auth screens (login/register) — same root
- [ ] No layout shift or flicker on initial render

---

## Phase 5 — Fix Auth Screens (Priority: HIGH — the reported bug)

### `app/(auth)/login.tsx`

**Remove**: `import { Alert } from "react-native"` (only used for errors)
**Add**: `import { useToast } from "@/src/hooks/useToast"` and `import { parseAuthError } from "@/src/lib/errors"`

**Before:**
```typescript
} catch (error: any) {
  Alert.alert("Error", error.message || "Failed to sign in");
  setLoading(false);
}
```

**After:**
```typescript
} catch (error) {
  showError(parseAuthError(error));
  setLoading(false);
}
```

Also convert empty-field validation to **inline errors** (not alert):
```typescript
// State:
const [emailError, setEmailError] = useState("");
const [passwordError, setPasswordError] = useState("");

// Before submit:
if (!email) { setEmailError("Email is required"); return; }
if (!password) { setPasswordError("Password is required"); return; }

// On Input:
<Input error={emailError} onChangeText={(v) => { setEmail(v); setEmailError(""); }} />
```

### `app/(auth)/register.tsx`

Same pattern as login. Additional mappings:
- Password mismatch → `setConfirmPasswordError("Passwords do not match")`
- Password too short → `setPasswordError("Password must be at least 8 characters")`
- Submit failure → `showError(parseAuthError(error))`

### Checkpoint
- [ ] Logging in with non-existent account shows: "No account found with this email. Check your email or sign up."
- [ ] Wrong password shows: "Incorrect password. Please try again."
- [ ] Empty field shows inline red error text on the Input, not a blocking modal
- [ ] Toast appears at top and auto-dismisses, does not block the form

---

## Phase 6 — Update Remaining Screens

Work through each screen. For each: **replace `Alert.alert` errors with `showError`**, **replace silent `console.error` with `showError`**, **add `showSuccess` where meaningful**.

### `app/friends.tsx`

| Action | Current | New |
|--------|---------|-----|
| Send request success | `Alert.alert("Success", ...)` | `showSuccess("Friend request sent!")` |
| Send request fail | `Alert.alert("Error", ...)` | `showError(parseMutationError(e, "Failed to send request"))` |
| Accept request fail | `Alert.alert("Error", ...)` | `showError(parseMutationError(e, "Failed to accept request"))` |
| Remove friend fail | `Alert.alert("Error", ...)` | `showError(parseMutationError(e, "Failed to remove friend"))` |

### `app/(tabs)/meal-plan.tsx`

| Action | Current | New |
|--------|---------|-----|
| Remove meal fail | `console.error` | `showError("Failed to remove meal. Please try again.")` |
| Change meal fail | `console.error` | `showError("Failed to update meal.")` |
| Generate plan fail | `console.error` | `showError("Failed to generate meal plan.")` |
| Generate plan success | nothing | `showSuccess("Meal plan generated!")` |

### `app/edit-profile.tsx`

| Action | Current | New |
|--------|---------|-----|
| Save fail | silent catch | `showError("Failed to save changes. Please try again.")` |
| Save success | `router.back()` | `showSuccess("Profile saved!")` then `router.back()` |

### `app/grocery-list.tsx`

| Action | Current | New |
|--------|---------|-----|
| Create list fail | `.catch(console.error)` | `showError("Failed to create grocery list.")` |

### `app/manual-recipe.tsx`

Keep `Alert.alert` for validation (it already uses step-based validation in `validateStep()`). Convert to inline `Input error={...}` where possible. For submit failure:
```typescript
} catch (error) {
  showError(parseMutationError(error, "Failed to save recipe. Please try again."));
}
```

For submit success:
```typescript
showSuccess("Recipe created!");
router.back();
```

### `app/recipe/[id].tsx`, `app/cook-mode/[id].tsx`, `app/(tabs)/recipes.tsx`, `app/select-recipe.tsx`, `app/settings.tsx`

Audit each file for `Alert.alert` or silent error catches. Apply same pattern: errors → `showError`, successes → `showSuccess`, validation → inline.

### Checkpoint for Phase 6
- [ ] No remaining `Alert.alert("Error", ...)` calls in non-destructive contexts
- [ ] All silent `console.error` in user-facing paths replaced
- [ ] Success feedback added to meaningful operations (friend request, recipe saved, meal added)

---

## Phase 7 — Export Toast from UI Index

**File**: `src/components/ui/index.ts`

Add `Toast` and `ToastContainer` to the barrel export so they're importable from `@/src/components/ui`.

---

## Phase 8 — Tests

### Update existing tests

Tests that mock `Alert.alert` will need updating:
- `app/__tests__/login.test.tsx`
- `app/__tests__/register.test.tsx`
- `app/__tests__/friends.test.tsx`

Replace `Alert.alert` spy with Zustand toast store spy or check for toast component render.

### New unit tests

| Test file | Covers |
|-----------|--------|
| `src/lib/__tests__/errors.test.ts` | `parseAuthError` — all branches |
| `src/components/ui/__tests__/Toast.test.tsx` | Renders, auto-dismiss, type variants |

### Run

```bash
npm test
```

Coverage thresholds: branches 35%, functions 35%, lines 40%, statements 40% — must pass.

---

## Implementation Order Summary

```
Phase 1  →  src/lib/errors.ts
Phase 2  →  src/components/ui/Toast.tsx
Phase 3  →  src/providers/ToastProvider.tsx
             src/hooks/useToast.ts
Phase 4  →  app/_layout.tsx  (wire ToastContainer)
Phase 5  →  app/(auth)/login.tsx         ← fixes the reported bug
             app/(auth)/register.tsx
Phase 6  →  app/friends.tsx
             app/(tabs)/meal-plan.tsx
             app/edit-profile.tsx
             app/grocery-list.tsx
             app/manual-recipe.tsx
             app/recipe/[id].tsx
             app/cook-mode/[id].tsx
             app/(tabs)/recipes.tsx
             app/select-recipe.tsx
             app/settings.tsx
Phase 7  →  src/components/ui/index.ts  (barrel export)
Phase 8  →  Update + add tests, run npm test
```

**Total new files**: 4
**Modified files**: ~13
**New npm packages**: 0

---

## Next Step

Run `/sc:implement` to execute this plan phase by phase.
