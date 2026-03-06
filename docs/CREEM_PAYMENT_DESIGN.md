# Creem Payment Integration — Technical Design

> **Status**: Design
> **Date**: 2026-03-04
> **Scope**: EUR 8/month subscription with 7-day free trial via Creem.io MoR

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Expo)                          │
│                                                                 │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────────────┐    │
│  │ Paywall  │  │ useSubscript │  │  Deep Link Handler     │    │
│  │ Screen   │  │ ion() hook   │  │  _layout.tsx           │    │
│  └────┬─────┘  └──────┬───────┘  └──────────┬─────────────┘    │
│       │               │                      │                  │
└───────┼───────────────┼──────────────────────┼──────────────────┘
        │               │                      │
        ▼               ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CONVEX BACKEND                             │
│                                                                 │
│  ┌──────────────┐  ┌───────────────┐  ┌────────────────────┐   │
│  │ payments.ts  │  │ http.ts       │  │ lib/subscription.ts│   │
│  │              │  │               │  │                    │   │
│  │ createCheck  │  │ POST /creem-  │  │ isPremiumUser()    │   │
│  │ out (action) │  │ webhook       │  │ getSubscription()  │   │
│  │              │  │ (HMAC verify) │  │ checkFeatureLimit()│   │
│  │ verifyCheck  │  │               │  │                    │   │
│  │ out (action) │  │ Event routing │  │                    │   │
│  └──────┬───────┘  └───────┬───────┘  └────────────────────┘   │
│         │                  │                                    │
│         ▼                  ▼                                    │
│  ┌──────────────────────────────────────────┐                   │
│  │          subscriptions table             │                   │
│  │          users.subscriptionStatus        │                   │
│  └──────────────────────────────────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
        │                  ▲
        ▼                  │
┌──────────────────────────────────┐
│         CREEM.IO API             │
│                                  │
│  POST /v1/checkouts              │
│  GET  /v1/checkouts/{id}         │
│  GET  /v1/subscriptions/{id}     │
│  Webhook events                  │
│                                  │
│  Test: https://test-api.creem.io │
│  Live: https://api.creem.io      │
└──────────────────────────────────┘
```

---

## 2. Database Schema Changes

### 2.1 New Table: `subscriptions`

```typescript
// convex/schema.ts — add to defineSchema

subscriptions: defineTable({
  userId: v.id("users"),
  creemSubscriptionId: v.string(),    // Creem's subscription ID (sub_xxx)
  creemCustomerId: v.string(),        // Creem's customer ID (cus_xxx)
  status: v.union(
    v.literal("trialing"),
    v.literal("active"),
    v.literal("past_due"),
    v.literal("canceled"),
    v.literal("expired")
  ),
  plan: v.literal("pro"),             // Single plan for now, extensible later
  currentPeriodStart: v.number(),     // Unix timestamp ms
  currentPeriodEnd: v.number(),       // Unix timestamp ms
  trialEnd: v.optional(v.number()),   // Unix timestamp ms (null if no trial)
  cancelAtPeriodEnd: v.boolean(),     // True if user canceled but still active
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_creem_subscription", ["creemSubscriptionId"])
  .index("by_status", ["status"]),
```

### 2.2 Users Table: Add `subscriptionStatus` field

```typescript
// Add to existing users table definition:
subscriptionStatus: v.optional(
  v.union(
    v.literal("free"),
    v.literal("trialing"),
    v.literal("pro"),
    v.literal("past_due"),
    v.literal("expired")
  )
),
```

**Default**: `undefined` treated as `"free"` in app logic.

### 2.3 New Table: `webhookEvents` (idempotency)

```typescript
webhookEvents: defineTable({
  eventId: v.string(),      // Creem webhook event ID
  eventType: v.string(),    // e.g. "checkout.completed"
  processedAt: v.number(),
})
  .index("by_event_id", ["eventId"]),
```

This prevents duplicate processing when Creem retries webhooks.

---

## 3. Backend Components

### 3.1 `convex/payments.ts` — Checkout & Verification Actions

```
┌─────────────────────────────────────────────────────────┐
│ createCheckout (action)                                 │
│ ─────────────────────────────────────────────────────── │
│ Input:  none (uses authenticated user)                  │
│ Steps:                                                  │
│   1. Get current user (auth required)                   │
│   2. Check if user already has active subscription      │
│   3. POST to Creem /v1/checkouts with:                  │
│      - product_id: env.CREEM_PRODUCT_ID                 │
│      - success_url: everydayfoodapp://payment-success   │
│      - customer.email: user.email                       │
│      - metadata: { userId: user._id }                   │
│   4. Return { checkoutUrl, checkoutId }                 │
│ Output: { checkoutUrl: string, checkoutId: string }     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ verifyCheckout (action)                                 │
│ ─────────────────────────────────────────────────────── │
│ Input:  { checkoutId: string }                          │
│ Steps:                                                  │
│   1. GET Creem /v1/checkouts/{checkoutId}               │
│   2. Verify status === "completed"                      │
│   3. If completed, call internal mutation to             │
│      create/update subscription record                  │
│   4. Return subscription status                         │
│ Output: { status: string, subscription?: object }       │
│ Note:  Primarily a fallback — webhooks are the          │
│        primary mechanism for subscription updates        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ getSubscriptionStatus (query)                           │
│ ─────────────────────────────────────────────────────── │
│ Input:  none (uses authenticated user)                  │
│ Steps:                                                  │
│   1. Get current user                                   │
│   2. Query subscriptions table by userId                │
│   3. Return subscription details or "free"              │
│ Output: { status, plan, trialEnd?, cancelAtPeriodEnd,   │
│           currentPeriodEnd }                             │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ createCustomerPortal (action)                           │
│ ─────────────────────────────────────────────────────── │
│ Input:  none (uses authenticated user)                  │
│ Steps:                                                  │
│   1. Get user's subscription                            │
│   2. POST to Creem /v1/billing-portal with              │
│      subscription_id                                    │
│   3. Return portal URL                                  │
│ Output: { portalUrl: string }                           │
│ Note:  For managing billing, canceling, etc.            │
└─────────────────────────────────────────────────────────┘
```

### 3.2 `convex/http.ts` — Webhook Endpoint

```
┌─────────────────────────────────────────────────────────────┐
│ POST /creem-webhook                                         │
│ ─────────────────────────────────────────────────────────── │
│ 1. Read raw body                                            │
│ 2. Extract X-Creem-Signature header                         │
│ 3. Verify HMAC-SHA256(body, CREEM_WEBHOOK_SECRET)           │
│    → 401 if invalid                                         │
│ 4. Parse JSON body → extract event type + data              │
│ 5. Check webhookEvents table for duplicate eventId          │
│    → 200 OK if already processed (idempotent)               │
│ 6. Route by event type:                                     │
│                                                             │
│    checkout.completed                                       │
│    ├─ Extract userId from metadata                          │
│    ├─ Create subscription record (status: trialing/active)  │
│    └─ Update user.subscriptionStatus                        │
│                                                             │
│    subscription.active                                      │
│    ├─ Update subscription status → "active"                 │
│    └─ Update user.subscriptionStatus → "pro"                │
│                                                             │
│    subscription.paid                                        │
│    ├─ Update currentPeriodStart/End                         │
│    └─ Ensure status = "active"                              │
│                                                             │
│    subscription.canceled                                    │
│    ├─ Set cancelAtPeriodEnd = true                          │
│    └─ Keep status "active" until period ends                │
│                                                             │
│    subscription.past_due                                    │
│    ├─ Update status → "past_due"                            │
│    └─ Update user.subscriptionStatus → "past_due"           │
│                                                             │
│    subscription.expired                                     │
│    ├─ Update status → "expired"                             │
│    └─ Update user.subscriptionStatus → "expired"            │
│                                                             │
│ 7. Record event in webhookEvents table                      │
│ 8. Return 200 OK                                            │
└─────────────────────────────────────────────────────────────┘
```

**HMAC Verification Logic:**

```typescript
// Pseudocode for webhook signature verification
const signature = request.headers.get("x-creem-signature");
const body = await request.text();
const expectedSignature = hmacSHA256(body, process.env.CREEM_WEBHOOK_SECRET);
if (signature !== expectedSignature) {
  return new Response("Invalid signature", { status: 401 });
}
```

### 3.3 `convex/lib/subscription.ts` — Feature Gating Helpers

```typescript
// isPremiumUser(ctx, userId) → boolean
//   Checks user.subscriptionStatus is "pro" or "trialing"
//   Fast path: reads denormalized field on users table

// getSubscription(ctx, userId) → Subscription | null
//   Full subscription record from subscriptions table

// checkFeatureLimit(ctx, userId, feature) → { allowed: boolean, current: number, limit: number }
//   Feature-specific limit checks (see Section 5)

// requirePremium(ctx, userId) → void (throws if not premium)
//   Guard for premium-only mutations
```

---

## 4. Frontend Components

### 4.1 New Route: `app/paywall.tsx`

```
┌────────────────────────────────────────┐
│           EVERYDAY FOOD PRO            │
│                                        │
│          ┌────────────────┐            │
│          │   👨‍🍳 PRO      │            │
│          │   crown icon    │            │
│          └────────────────┘            │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │ ✓ Unlimited recipes              │  │
│  │ ✓ Unlimited meal planning        │  │
│  │ ✓ Unlimited recipe imports       │  │
│  │ ✓ Unlimited shopping lists       │  │
│  │ ✓ Unlimited recipe sharing       │  │
│  │ ✓ Detailed nutrition breakdown   │  │
│  │ ✓ Exclusive achievements         │  │
│  │ ✓ Ad-free experience             │  │
│  └──────────────────────────────────┘  │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │    START 7-DAY FREE TRIAL        │  │
│  │    Then EUR 8/month              │  │
│  └──────────────────────────────────┘  │
│                                        │
│       Already subscribed? Restore      │
│                                        │
│           Cancel anytime               │
└────────────────────────────────────────┘
```

**Behavior:**
1. Tapping "START FREE TRIAL" calls `createCheckout` action
2. Receives `checkoutUrl` from Convex
3. Opens URL via `Linking.openURL(checkoutUrl)`
4. After payment, Creem redirects to `everydayfoodapp://payment-success?checkout_id=ch_xxx`
5. App intercepts deep link, navigates to success screen
6. Calls `verifyCheckout` as fallback (webhook is primary)

### 4.2 New Route: `app/payment-success.tsx`

Simple success confirmation screen:
- Shows success animation/checkmark
- "Welcome to Pro!" message
- "Start Cooking" CTA → navigates to `/(tabs)/`
- Polls `getSubscriptionStatus` briefly if webhook hasn't arrived yet

### 4.3 `src/hooks/useSubscription.ts`

```typescript
// Hook API:
const {
  status,        // "free" | "trialing" | "pro" | "past_due" | "expired"
  isPro,         // boolean — true if "pro" or "trialing"
  isTrialing,    // boolean
  daysLeftInTrial, // number | null
  subscription,  // full subscription object | null
  openPaywall,   // () => void — navigate to paywall
  openBilling,   // () => void — open Creem billing portal
} = useSubscription();
```

**Implementation:**
- Uses `useQuery(api.payments.getSubscriptionStatus)`
- Derives computed values from subscription record
- `openPaywall` navigates to `/paywall`
- `openBilling` calls `createCustomerPortal` action + `Linking.openURL`

### 4.4 Deep Link Handling in `app/_layout.tsx`

```
Add to RootLayoutNav:
  1. Import useURL from expo-linking
  2. useEffect watching URL changes
  3. If URL matches everydayfoodapp://payment-success:
     - Extract checkout_id query param
     - Navigate to /payment-success?checkout_id=xxx
```

### 4.5 Profile Screen Updates

Add between gamification section and stats section in [profile.tsx](app/(tabs)/profile.tsx):

```
┌──────────────────────────────────────────┐
│  ⭐ EVERYDAY FOOD PRO                    │
│                                          │
│  Status: PRO (or FREE / TRIALING)        │
│  [MANAGE SUBSCRIPTION]  or  [UPGRADE]    │
└──────────────────────────────────────────┘
```

- If `free` → shows "UPGRADE TO PRO" button → navigates to `/paywall`
- If `trialing` → shows "TRIAL — X days left" + manage button
- If `pro` → shows "PRO" badge + manage subscription button
- If `past_due` → shows warning + "Update Payment" button
- If `expired` → shows "Resubscribe" button → navigates to `/paywall`

### 4.6 Feature Gate Component

```typescript
// Usage pattern throughout the app:
<PremiumGate feature="unlimited_recipes" current={recipeCount}>
  {/* Premium content */}
  <Button onPress={createRecipe}>CREATE RECIPE</Button>
</PremiumGate>

// If limit reached and user is free:
// Shows inline upgrade prompt instead of children
```

---

## 5. Feature Limits Configuration

```typescript
// convex/lib/featureLimits.ts

export const FEATURE_LIMITS = {
  free: {
    recipes: 15,
    mealPlanDays: 3,
    importsPerMonth: 3,
    activeShoppingLists: 1,
    shareRecipesWith: 3,
  },
  pro: {
    recipes: Infinity,
    mealPlanDays: Infinity,
    importsPerMonth: Infinity,
    activeShoppingLists: Infinity,
    shareRecipesWith: Infinity,
  },
} as const;
```

**Enforcement points** (backend mutations):
| Feature | Enforced in | Check |
|---------|-------------|-------|
| Recipe count | `recipes.createManual` | Count user's recipes |
| Meal plan days | `mealPlans.addMeal` | Check date distance from today |
| Import count | `importJobs` (create) | Count imports this month |
| Shopping lists | `shoppingLists.create` | Count active lists |
| Recipe sharing | `recipeShares.share` | Count unique share recipients |

---

## 6. Environment Variables

```bash
# .env.local (Convex environment variables)
CREEM_API_KEY=creem_test_xxx          # Test mode key
CREEM_WEBHOOK_SECRET=whsec_xxx        # Webhook signing secret
CREEM_PRODUCT_ID=prod_xxx             # "Everyday Food Pro" product ID
CREEM_API_BASE_URL=https://test-api.creem.io/v1  # Switch to api.creem.io for production
```

Set in Convex via:
```bash
npx convex env set CREEM_API_KEY creem_test_xxx
npx convex env set CREEM_WEBHOOK_SECRET whsec_xxx
npx convex env set CREEM_PRODUCT_ID prod_xxx
npx convex env set CREEM_API_BASE_URL https://test-api.creem.io/v1
```

---

## 7. Checkout Flow — Sequence Diagram

```
User          App (RN)         Convex            Creem API
 │               │                │                  │
 │  Tap Subscribe│                │                  │
 │──────────────>│                │                  │
 │               │ createCheckout │                  │
 │               │───────────────>│                  │
 │               │                │  POST /checkouts │
 │               │                │─────────────────>│
 │               │                │  { checkout_url } │
 │               │                │<─────────────────│
 │               │  { checkoutUrl }                  │
 │               │<───────────────│                  │
 │               │                │                  │
 │  Linking.openURL(checkoutUrl)  │                  │
 │<──────────────│                │                  │
 │               │                │                  │
 │  [User completes payment in browser]              │
 │               │                │                  │
 │  Deep link: everydayfoodapp://payment-success     │
 │──────────────>│                │                  │
 │               │                │                  │
 │               │  (Meanwhile)   │  Webhook POST    │
 │               │                │<─────────────────│
 │               │                │  verify HMAC     │
 │               │                │  update DB       │
 │               │                │  return 200      │
 │               │                │─────────────────>│
 │               │                │                  │
 │               │ verifyCheckout │                  │
 │               │───────────────>│ (fallback check) │
 │               │  { status: ok }│                  │
 │               │<───────────────│                  │
 │               │                │                  │
 │  Success screen                │                  │
 │<──────────────│                │                  │
```

---

## 8. Webhook Security

1. **HMAC-SHA256 verification** — Every webhook must be verified against `CREEM_WEBHOOK_SECRET`
2. **Idempotency** — `webhookEvents` table prevents duplicate processing on retries
3. **No trust of client data** — `verifyCheckout` action fetches from Creem API server-side, never trusts client-provided subscription status
4. **Metadata binding** — `userId` in checkout metadata links Creem subscription to our user, verified server-side

---

## 9. Implementation Phases

### Phase 1: Backend Foundation (Now — Sandbox)
1. Add `subscriptions` + `webhookEvents` tables to schema
2. Add `subscriptionStatus` field to `users` table
3. Create `convex/payments.ts` with `createCheckout`, `verifyCheckout`, `getSubscriptionStatus`
4. Create `convex/lib/subscription.ts` with `isPremiumUser`, `getSubscription`
5. Create `convex/lib/featureLimits.ts` with limits config
6. Add webhook endpoint to `convex/http.ts` with HMAC verification
7. Set Convex env vars for test mode

### Phase 2: Feature Gating Logic
8. Add `checkFeatureLimit` to subscription helpers
9. Add limit checks to existing mutations (recipes, meal plans, imports, shopping lists, shares)
10. Create `createCustomerPortal` action

### Phase 3: Frontend — Paywall & Subscription UI
11. Create `src/hooks/useSubscription.ts`
12. Create `app/paywall.tsx` screen
13. Create `app/payment-success.tsx` screen
14. Add deep link handler in `app/_layout.tsx`
15. Add subscription badge/card to profile screen
16. Create `PremiumGate` component for inline upgrade prompts

### Phase 4: Polish & Testing
17. Register `paywall` and `payment-success` routes in `_layout.tsx` Stack
18. Test full flow with Creem test cards
19. Add unit tests for subscription helpers and webhook handler
20. Run `npm test` — ensure all tests pass

### Phase 5: Go Live
21. Switch env vars to production Creem keys
22. Verify webhook URL is registered in Creem dashboard (live mode)
23. End-to-end test with real card
24. Ship

---

## 10. Files to Create / Modify

| Action | File | Description |
|--------|------|-------------|
| **Modify** | `convex/schema.ts` | Add `subscriptions`, `webhookEvents` tables; add `subscriptionStatus` to users |
| **Create** | `convex/payments.ts` | Checkout, verification, subscription status actions/queries |
| **Create** | `convex/lib/subscription.ts` | `isPremiumUser`, `getSubscription`, `checkFeatureLimit` helpers |
| **Create** | `convex/lib/featureLimits.ts` | Free vs Pro limits config |
| **Modify** | `convex/http.ts` | Add `/creem-webhook` POST endpoint |
| **Modify** | `convex/recipes.ts` | Add recipe count limit check in `createManual` |
| **Modify** | `convex/mealPlans.ts` | Add meal plan days limit check |
| **Modify** | `convex/shoppingLists.ts` | Add active list limit check |
| **Modify** | `convex/recipeShares.ts` | Add share recipient limit check |
| **Create** | `src/hooks/useSubscription.ts` | Subscription status hook |
| **Create** | `src/components/PremiumGate.tsx` | Feature gate wrapper component |
| **Create** | `app/paywall.tsx` | Paywall/upgrade screen |
| **Create** | `app/payment-success.tsx` | Post-payment success screen |
| **Modify** | `app/_layout.tsx` | Add deep link handler + new Stack routes |
| **Modify** | `app/(tabs)/profile.tsx` | Add subscription badge/card |

---

## 11. Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Webhook-first** | Webhooks are primary, verifyCheckout is fallback | More reliable than client-side polling; handles all lifecycle events |
| **Denormalized status on users** | `user.subscriptionStatus` | Avoids join for every feature gate check; kept in sync by webhooks |
| **Single `pro` plan** | No plan tiers | Simplicity. Add tiers later if needed |
| **Server-side limit enforcement** | Mutations check limits, not just UI | Security — can't bypass limits by calling API directly |
| **Hosted checkout (not in-app)** | `Linking.openURL` to Creem | No native SDK available; hosted checkout handles PCI compliance |
| **Idempotent webhooks** | `webhookEvents` dedup table | Creem retries at 30s, 1m, 5m, 1h — must handle duplicates |
| **Apple IAP risk** | Web checkout via `Linking.openURL` | MoR model; monitor Apple policy. May need iOS-specific handling later |

---

## 12. Risk Mitigations

| Risk | Mitigation |
|------|------------|
| Apple IAP enforcement | Start with Android + Web. For iOS, consider "reader app" exemption or web-only checkout |
| Webhook delivery failure | `verifyCheckout` action as fallback; Creem retries for 1+ hour |
| Race condition (webhook vs deep link) | Deep link triggers `verifyCheckout` which is idempotent; if webhook already processed, no-op |
| Trial abuse (multiple accounts) | Link trials to email; Creem handles at product level |
| Stale subscription status | Webhook keeps it current; app queries on mount as safety net |
