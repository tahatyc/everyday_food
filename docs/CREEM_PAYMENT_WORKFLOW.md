# Creem Payment Integration — Development Workflow

> **Generated**: 2026-03-04
> **Source**: CREEM_PAYMENT_DESIGN.md
> **Strategy**: Systematic (5 phases, 24 tasks)
> **Estimated Complexity**: Medium-High

---

## Phase 1: Backend Foundation (Sandbox)

> **Goal**: Database schema, Creem API integration, webhook handler — all in test mode
> **Dependencies**: Creem test account + product created in dashboard
> **Files touched**: 6

### Task 1.1 — Schema: Add subscription tables
- **File**: `convex/schema.ts`
- **Action**: MODIFY
- **Details**:
  - Add `subscriptions` table (userId, creemSubscriptionId, creemCustomerId, status, plan, currentPeriodStart, currentPeriodEnd, trialEnd, cancelAtPeriodEnd, createdAt, updatedAt)
  - Add `webhookEvents` table (eventId, eventType, processedAt)
  - Add `subscriptionStatus` optional field to `users` table
  - Add indexes: `by_user`, `by_creem_subscription`, `by_status`, `by_event_id`
- **Validation**: `npx convex dev` deploys without errors
- **Checkpoint**: Schema changes visible in Convex dashboard

### Task 1.2 — Create feature limits config
- **File**: `convex/lib/featureLimits.ts` (CREATE)
- **Action**: CREATE
- **Details**:
  - Export `FEATURE_LIMITS` const with `free` and `pro` tiers
  - Free: recipes=15, mealPlanDays=3, importsPerMonth=3, activeShoppingLists=1, shareRecipesWith=3
  - Pro: all Infinity
- **Validation**: File imports correctly, TypeScript compiles

### Task 1.3 — Create subscription helpers
- **File**: `convex/lib/subscription.ts` (CREATE)
- **Action**: CREATE
- **Details**:
  - `isPremiumUser(ctx, userId)` → boolean (checks user.subscriptionStatus is "pro" or "trialing")
  - `getSubscription(ctx, userId)` → Subscription | null
  - `requirePremium(ctx, userId)` → void (throws ConvexError if not premium)
- **Dependencies**: Task 1.1 (schema must exist)
- **Validation**: TypeScript compiles, functions are importable

### Task 1.4 — Create payments.ts actions & queries
- **File**: `convex/payments.ts` (CREATE)
- **Action**: CREATE
- **Details**:
  - `createCheckout` (action) — POST to Creem /v1/checkouts, returns { checkoutUrl, checkoutId }
  - `verifyCheckout` (action) — GET Creem /v1/checkouts/{id}, update subscription if completed
  - `getSubscriptionStatus` (query) — returns current user's subscription status
  - `createCustomerPortal` (action) — POST to Creem /v1/billing-portal, returns portalUrl
  - Internal mutations: `upsertSubscription`, `updateSubscriptionStatus`
- **Dependencies**: Task 1.1, Task 1.3
- **Validation**: Actions callable from Convex dashboard in test mode

### Task 1.5 — Webhook endpoint with HMAC verification
- **File**: `convex/http.ts` (MODIFY)
- **Action**: MODIFY
- **Details**:
  - Add `POST /creem-webhook` route
  - HMAC-SHA256 signature verification against `CREEM_WEBHOOK_SECRET`
  - Idempotency check via `webhookEvents` table
  - Event routing: checkout.completed, subscription.active, subscription.paid, subscription.canceled, subscription.past_due, subscription.expired
  - Each event updates `subscriptions` table + `user.subscriptionStatus`
  - Return 200 OK on success, 401 on invalid signature
- **Dependencies**: Task 1.1, Task 1.4 (internal mutations)
- **Validation**: Manual webhook test via curl or Creem dashboard test webhook

### Task 1.6 — Set environment variables
- **Action**: CONFIGURE
- **Details**:
  ```bash
  npx convex env set CREEM_API_KEY creem_test_xxx
  npx convex env set CREEM_WEBHOOK_SECRET whsec_xxx
  npx convex env set CREEM_PRODUCT_ID prod_xxx
  npx convex env set CREEM_API_BASE_URL https://test-api.creem.io/v1
  ```
- **Dependencies**: Creem test account created, product configured
- **Validation**: `npx convex env list` shows all 4 variables

### Phase 1 Checkpoint
- [ ] Schema deploys successfully
- [ ] `createCheckout` returns a valid Creem checkout URL
- [ ] Webhook endpoint accepts and verifies test payloads
- [ ] `getSubscriptionStatus` returns "free" for users without subscriptions

---

## Phase 2: Feature Gating Logic

> **Goal**: Enforce free-tier limits in backend mutations
> **Dependencies**: Phase 1 complete
> **Files touched**: 5

### Task 2.1 — Add checkFeatureLimit helper
- **File**: `convex/lib/subscription.ts` (MODIFY)
- **Action**: MODIFY
- **Details**:
  - Add `checkFeatureLimit(ctx, userId, feature)` → { allowed: boolean, current: number, limit: number }
  - Uses `FEATURE_LIMITS` from featureLimits.ts
  - Counts current usage per feature type
- **Dependencies**: Task 1.2, Task 1.3

### Task 2.2 — Gate recipe creation
- **File**: `convex/recipes.ts` (MODIFY)
- **Action**: MODIFY
- **Details**:
  - In `createManual` mutation, call `checkFeatureLimit(ctx, userId, "recipes")`
  - If `!allowed`, throw ConvexError with limit info
- **Dependencies**: Task 2.1

### Task 2.3 — Gate meal plan additions
- **File**: `convex/mealPlans.ts` (MODIFY)
- **Action**: MODIFY
- **Details**:
  - In `addMeal` mutation, check date distance from today against `mealPlanDays` limit
  - If exceeds limit, throw ConvexError
- **Dependencies**: Task 2.1

### Task 2.4 — Gate shopping list creation
- **File**: `convex/shoppingLists.ts` (MODIFY)
- **Action**: MODIFY
- **Details**:
  - In `create` mutation, count active lists, check against `activeShoppingLists` limit
- **Dependencies**: Task 2.1

### Task 2.5 — Gate recipe sharing
- **File**: `convex/recipeShares.ts` (MODIFY)
- **Action**: MODIFY
- **Details**:
  - In `share` / `shareWithMultiple` mutations, count unique recipients against `shareRecipesWith` limit
- **Dependencies**: Task 2.1

### Phase 2 Checkpoint
- [ ] Free-tier user hitting recipe limit gets clear error
- [ ] All gated mutations enforce limits correctly
- [ ] Pro/trialing users bypass all limits
- [ ] Run `npm test` — all existing tests pass

---

## Phase 3: Frontend — Paywall & Subscription UI

> **Goal**: User-facing subscription flow — paywall, success screen, subscription hook, feature gates
> **Dependencies**: Phase 1 complete (Phase 2 recommended but not blocking)
> **Files touched**: 7

### Task 3.1 — Create useSubscription hook
- **File**: `src/hooks/useSubscription.ts` (CREATE)
- **Action**: CREATE
- **Details**:
  - Uses `useQuery(api.payments.getSubscriptionStatus)`
  - Exposes: status, isPro, isTrialing, daysLeftInTrial, subscription, openPaywall, openBilling
  - `openPaywall` → `router.push("/paywall")`
  - `openBilling` → calls `createCustomerPortal` + `Linking.openURL`
- **Dependencies**: Task 1.4
- **Validation**: Hook returns correct status for free users

### Task 3.2 — Create paywall screen
- **File**: `app/paywall.tsx` (CREATE)
- **Action**: CREATE
- **Details**:
  - Neo-brutalist design matching app style
  - Features list (8 bullet points from design doc)
  - "START 7-DAY FREE TRIAL" CTA button → calls `createCheckout` → `Linking.openURL`
  - "Then EUR 8/month" subtitle
  - "Already subscribed? Restore" link
  - "Cancel anytime" footer text
  - Loading state while creating checkout
- **Dependencies**: Task 1.4, Task 3.1
- **Validation**: Screen renders, CTA triggers checkout flow

### Task 3.3 — Create payment success screen
- **File**: `app/payment-success.tsx` (CREATE)
- **Action**: CREATE
- **Details**:
  - Success checkmark animation (Reanimated)
  - "Welcome to Pro!" message
  - "Start Cooking" CTA → navigates to `/(tabs)/`
  - Receives `checkout_id` param, calls `verifyCheckout` as fallback
  - Brief polling of `getSubscriptionStatus` if webhook hasn't arrived
- **Dependencies**: Task 1.4, Task 3.1
- **Validation**: Screen renders with success state

### Task 3.4 — Deep link handler
- **File**: `app/_layout.tsx` (MODIFY)
- **Action**: MODIFY
- **Details**:
  - Import `useURL` from `expo-linking`
  - Add `useEffect` watching URL changes
  - Pattern match `everydayfoodapp://payment-success`
  - Extract `checkout_id` param
  - Navigate to `/payment-success?checkout_id=xxx`
  - Register `paywall` and `payment-success` in Stack navigator
- **Dependencies**: Task 3.3
- **Validation**: Deep link opens correct screen in development

### Task 3.5 — Profile subscription card
- **File**: `app/(tabs)/profile.tsx` (MODIFY)
- **Action**: MODIFY
- **Details**:
  - Add subscription card between gamification and stats sections
  - free → "UPGRADE TO PRO" button → `/paywall`
  - trialing → "TRIAL — X days left" + manage button
  - pro → "PRO" badge + "MANAGE SUBSCRIPTION" button
  - past_due → warning + "Update Payment" button
  - expired → "Resubscribe" button → `/paywall`
- **Dependencies**: Task 3.1
- **Validation**: Card renders correctly for each status

### Task 3.6 — PremiumGate component
- **File**: `src/components/PremiumGate.tsx` (CREATE)
- **Action**: CREATE
- **Details**:
  - Props: `feature` (limit key), `current` (current usage count), `children`
  - If user is pro or under limit → render children
  - If limit reached → render inline upgrade prompt with "UPGRADE" button
  - Uses `useSubscription` hook
- **Dependencies**: Task 3.1
- **Validation**: Component correctly gates content based on status

### Task 3.7 — Integrate PremiumGate in key screens
- **Files**: Various screens (recipes, meal-plan, etc.) (MODIFY)
- **Action**: MODIFY
- **Details**:
  - Wrap create/add actions with PremiumGate where limits apply
  - Show remaining counts to free users (e.g., "3/15 recipes")
- **Dependencies**: Task 3.6
- **Validation**: UI shows upgrade prompts when limits reached

### Phase 3 Checkpoint
- [ ] Full checkout flow works: paywall → Creem checkout → deep link → success screen
- [ ] Profile shows correct subscription status
- [ ] PremiumGate shows upgrade prompt for free users at limit
- [ ] Run `npm test` — all tests pass

---

## Phase 4: Testing & Polish

> **Goal**: Comprehensive testing, edge cases, UX polish
> **Dependencies**: Phase 1-3 complete
> **Files touched**: 3-5

### Task 4.1 — Unit tests for subscription helpers
- **File**: `convex/__tests__/subscription.test.ts` or similar (CREATE)
- **Action**: CREATE
- **Details**:
  - Test `isPremiumUser` for each status
  - Test `checkFeatureLimit` for free and pro tiers
  - Test `requirePremium` throws for non-premium users
- **Validation**: Tests pass

### Task 4.2 — Unit tests for webhook handler
- **File**: Tests for webhook HMAC verification and event routing
- **Action**: CREATE
- **Details**:
  - Test HMAC verification rejects invalid signatures
  - Test idempotency (duplicate events are no-ops)
  - Test each event type updates status correctly
- **Validation**: Tests pass

### Task 4.3 — Frontend component tests
- **Files**: Tests for paywall, PremiumGate, useSubscription
- **Action**: CREATE
- **Details**:
  - Paywall renders features list and CTA
  - PremiumGate shows/hides content based on subscription
  - useSubscription returns correct derived values
- **Validation**: Tests pass

### Task 4.4 — Full flow test with Creem test cards
- **Action**: MANUAL TEST
- **Details**:
  - Test successful checkout (4242 4242 4242 4242)
  - Test declined card (4000 0000 0000 0002)
  - Test webhook delivery and subscription activation
  - Test subscription cancellation via billing portal
  - Test trial expiration behavior
  - Test past_due and expired states
- **Validation**: All scenarios produce correct app state

### Task 4.5 — Run full test suite
- **Action**: RUN
- **Command**: `npm test`
- **Validation**: All tests pass, coverage thresholds met

### Phase 4 Checkpoint
- [ ] All unit tests pass
- [ ] Full checkout flow tested with test cards
- [ ] Edge cases handled (declined cards, duplicate webhooks, race conditions)
- [ ] `npm test` passes with coverage thresholds met

---

## Phase 5: Go Live

> **Goal**: Switch to production, final verification, ship
> **Dependencies**: Phase 4 complete
> **Files touched**: 0 (config only)

### Task 5.1 — Switch to production Creem keys
- **Action**: CONFIGURE
- **Details**:
  ```bash
  npx convex env set CREEM_API_KEY creem_xxx           # Live key
  npx convex env set CREEM_WEBHOOK_SECRET whsec_xxx    # Live webhook secret
  npx convex env set CREEM_PRODUCT_ID prod_xxx         # Live product ID
  npx convex env set CREEM_API_BASE_URL https://api.creem.io/v1
  ```
- **Validation**: Env vars updated

### Task 5.2 — Register live webhook URL
- **Action**: CONFIGURE (Creem Dashboard)
- **Details**:
  - In Creem dashboard (Live mode), register webhook URL pointing to your Convex HTTP endpoint
  - URL format: `https://<your-convex-deployment>.convex.site/creem-webhook`
- **Validation**: Creem dashboard shows webhook registered

### Task 5.3 — End-to-end test with real card
- **Action**: MANUAL TEST
- **Details**:
  - Complete real subscription purchase
  - Verify webhook fires and subscription activates
  - Test cancellation via billing portal
  - Verify subscription revokes at period end
- **Validation**: Real payment processed, subscription lifecycle works

### Task 5.4 — Ship
- **Action**: DEPLOY
- **Details**:
  - Merge to main branch
  - Deploy frontend (Expo build/update)
  - Monitor Convex logs for webhook errors
  - Monitor Creem dashboard for payment issues
- **Validation**: Users can subscribe successfully

### Phase 5 Checkpoint
- [ ] Live payments processing correctly
- [ ] Webhooks firing and processing
- [ ] Subscription lifecycle working end-to-end
- [ ] No errors in Convex or Creem dashboards

---

## Dependency Graph

```
Phase 1 (Backend Foundation)
  ├── 1.1 Schema ──────────┐
  ├── 1.2 Feature Limits   │
  ├── 1.6 Env Vars         │
  │                        ▼
  ├── 1.3 Sub Helpers ◄── 1.1
  ├── 1.4 Payments ◄───── 1.1, 1.3
  └── 1.5 Webhooks ◄───── 1.1, 1.4

Phase 2 (Feature Gating) ◄── Phase 1
  ├── 2.1 checkFeatureLimit ◄── 1.2, 1.3
  ├── 2.2 Gate recipes ◄────── 2.1
  ├── 2.3 Gate meal plans ◄─── 2.1
  ├── 2.4 Gate shopping ◄───── 2.1
  └── 2.5 Gate sharing ◄────── 2.1

Phase 3 (Frontend) ◄── Phase 1 (Phase 2 recommended)
  ├── 3.1 useSubscription ◄── 1.4
  ├── 3.2 Paywall ◄────────── 1.4, 3.1
  ├── 3.3 Success Screen ◄─── 1.4, 3.1
  ├── 3.4 Deep Links ◄─────── 3.3
  ├── 3.5 Profile Card ◄───── 3.1
  ├── 3.6 PremiumGate ◄────── 3.1
  └── 3.7 Integrate Gates ◄── 3.6

Phase 4 (Testing) ◄── Phase 1-3
  ├── 4.1-4.3 Unit tests (parallel)
  ├── 4.4 Flow test ◄── 4.1-4.3
  └── 4.5 Full suite ◄── 4.4

Phase 5 (Go Live) ◄── Phase 4
  ├── 5.1 Prod keys
  ├── 5.2 Live webhook
  ├── 5.3 Real test ◄── 5.1, 5.2
  └── 5.4 Ship ◄────── 5.3
```

---

## Parallelization Opportunities

| Parallel Group | Tasks | Rationale |
|---------------|-------|-----------|
| Schema + Config | 1.1 + 1.2 + 1.6 | Independent — schema, limits config, and env vars |
| Feature Gates | 2.2 + 2.3 + 2.4 + 2.5 | All depend on 2.1 but independent of each other |
| Frontend Core | 3.2 + 3.3 + 3.5 + 3.6 | All depend on 3.1 but independent of each other |
| Tests | 4.1 + 4.2 + 4.3 | Independent test suites |
| Go Live Config | 5.1 + 5.2 | Independent configuration steps |

---

## Files Summary

| Action | Count | Files |
|--------|-------|-------|
| CREATE | 8 | payments.ts, subscription.ts, featureLimits.ts, useSubscription.ts, PremiumGate.tsx, paywall.tsx, payment-success.tsx, test files |
| MODIFY | 7 | schema.ts, http.ts, recipes.ts, mealPlans.ts, shoppingLists.ts, recipeShares.ts, _layout.tsx, profile.tsx |
| CONFIG | 4 | Convex env vars (CREEM_API_KEY, CREEM_WEBHOOK_SECRET, CREEM_PRODUCT_ID, CREEM_API_BASE_URL) |

---

## Next Step

Run `/sc:implement` to begin executing Phase 1, starting with Task 1.1 (schema changes).
