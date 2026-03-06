# Creem.io Payment Integration Analysis

> **Date**: 2026-03-04
> **Status**: Requirements Discovery & Feasibility Assessment
> **Plan**: EUR 8/month subscription with 7-day free trial

---

## 1. Executive Summary

Creem.io is a **Merchant of Record (MoR)** payment platform designed for software companies. It handles payments, taxes, compliance, and revenue splits across 190+ countries. It offers a **fully isolated sandbox/test environment**, making it suitable for development and staging.

**Verdict: Yes, you can start integrating now.** Creem has a complete test mode with test API keys, test card numbers, and isolated data — no real money is processed during development.

---

## 2. Sandbox / Test Mode

### Available: YES

Creem provides a **completely isolated test environment**:

| Feature                 | Details                                    |
| ----------------------- | ------------------------------------------ |
| **Test API Base URL**   | `https://test-api.creem.io/v1`             |
| **Test API Key Prefix** | `creem_test_*`                             |
| **Live API Base URL**   | `https://api.creem.io/v1`                  |
| **Live API Key Prefix** | `creem_*`                                  |
| **Data Isolation**      | Test and production are fully separated    |
| **Dashboard Toggle**    | Switch between Test/Live in the top navbar |

### Test Card Numbers

| Card Number           | Scenario           |
| --------------------- | ------------------ |
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 0002` | Card declined      |
| `4000 0000 0000 9995` | Insufficient funds |
| `4000 0000 0000 0127` | Incorrect CVC      |
| `4000 0000 0000 0069` | Expired card       |

All test cards work with **any future expiration date, any CVV, and any billing info**.

---

## 3. Current App State (Payment Readiness)

| Aspect                             | Status                                       |
| ---------------------------------- | -------------------------------------------- |
| Existing payment code              | **None** — clean slate                       |
| Subscription tables in DB          | **None**                                     |
| Premium/Pro feature gating         | **None**                                     |
| Payment SDK installed              | **None**                                     |
| Environment variables for payments | **None**                                     |
| Gamification system                | **Exists** — can tie into premium perks      |
| User table                         | **Extensible** — can add subscription fields |
| Profile screen                     | **Has room** — can add subscription badge    |

---

## 4. Integration Architecture for Everyday Food

### 4.1 Checkout Flow (React Native + Expo)

Since Creem uses a **hosted checkout page** (no native SDK for React Native), the flow is:

```
User taps "Subscribe"
    → App calls Convex action (server-side)
        → Convex calls Creem API: POST /v1/checkouts
            → Returns checkout URL
    → App opens URL via Linking.openURL()
    → User completes payment in browser
    → Creem redirects to deep link: everydayfoodapp://payment-success?checkout_id=ch_xxx
    → App intercepts deep link, navigates to success screen
    → App calls Convex action to verify checkout status
    → Convex updates user subscription in database
```

### 4.2 Webhook Flow (Subscription Lifecycle)

```
Creem fires webhook event
    → Convex HTTP endpoint receives it
    → Verify HMAC-SHA256 signature
    → Process event:
        - checkout.completed     → Create subscription record
        - subscription.active    → Activate premium features
        - subscription.trialing  → Start 7-day trial
        - subscription.paid      → Extend subscription period
        - subscription.canceled  → Revoke at period end
        - subscription.past_due  → Grace period / notify user
        - subscription.expired   → Revoke premium features
    → Update user record + subscription table
```

### 4.3 Product Configuration

```
Product: "Everyday Food Pro"
Price: EUR 8.00 / month (800 cents)
Currency: EUR
Billing Type: recurring
Billing Period: every-month
Trial: 7 days free
Tax Category: saas
```

Created via Creem CLI or API:

```bash
creem products create \
  --name "Everyday Food Pro" \
  --description "Premium meal planning & cooking features" \
  --price 800 \
  --currency EUR \
  --billing-type recurring \
  --billing-period every-month \
  --tax-category saas
```

Trial period is configured at the product level in the Creem dashboard.

---

## 5. What Needs to Be Built

### 5.1 Backend (Convex)

| Component                         | Description                                                                                                                                         |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Schema: `subscriptions` table** | userId, creemSubscriptionId, creemCustomerId, status, plan, currentPeriodStart, currentPeriodEnd, trialEnd, cancelAtPeriodEnd, createdAt, updatedAt |
| **Schema: `users` table update**  | Add `subscriptionStatus` field (free/trialing/pro/expired)                                                                                          |
| **`convex/payments.ts`**          | Actions: `createCheckout`, `verifyCheckout`, `getSubscriptionStatus`                                                                                |
| **`convex/http.ts` update**       | Add webhook endpoint: `POST /creem-webhook` with HMAC verification                                                                                  |
| **`convex/lib/subscription.ts`**  | Helper: `isPremiumUser(userId)` for feature gating                                                                                                  |

### 5.2 Frontend (React Native / Expo)

| Component                         | Description                                                                |
| --------------------------------- | -------------------------------------------------------------------------- |
| **Paywall Screen**                | New route `/paywall` — subscription pitch with features list, price, CTA   |
| **Profile Subscription Badge**    | Show current plan (Free/Trial/Pro) on profile                              |
| **Settings Subscription Section** | Manage subscription, view billing, cancel                                  |
| **Deep Link Handler**             | Handle `everydayfoodapp://payment-success` in `_layout.tsx`                |
| **Feature Gates**                 | Conditional UI for premium-only features                                   |
| **`useSubscription` hook**        | Query subscription status, expose `isPro`, `isTrialing`, `daysLeftInTrial` |

### 5.3 Configuration

| Item                      | Description                                                 |
| ------------------------- | ----------------------------------------------------------- |
| **Environment Variables** | `CREEM_API_KEY`, `CREEM_WEBHOOK_SECRET`, `CREEM_PRODUCT_ID` |
| **Deep Link Scheme**      | Already configured: `everydayfoodapp://` in app.json        |
| **Convex HTTP Route**     | Register webhook endpoint                                   |

---

## 6. Premium Features to Gate (Suggestions)

These are potential features to put behind the paywall:

| Feature              | Free Tier          | Pro Tier (EUR 8/mo)                 |
| -------------------- | ------------------ | ----------------------------------- |
| Recipes saved        | Up to 15           | Unlimited                           |
| Meal plan days ahead | 3 days             | Unlimited                           |
| Recipe import (URL)  | 3/month            | Unlimited                           |
| Shopping lists       | 1 active           | Unlimited                           |
| Share recipes        | Up to 3 friends    | Unlimited                           |
| Nutrition info       | Basic              | Detailed breakdown                  |
| Cook mode            | Available          | Available                           |
| Gamification         | Basic achievements | All achievements + exclusive badges |
| Ad-free experience   | No                 | Yes                                 |

> **Note**: These are suggestions. Decide which features to gate based on your user research and business goals.

---

## 7. Pricing & Fees

| Item                              | Amount                                     |
| --------------------------------- | ------------------------------------------ |
| **Your subscription price**       | EUR 8.00/month                             |
| **Creem transaction fee**         | 3.9% + EUR 0.40 per transaction            |
| **Your net per transaction**      | ~EUR 7.29 (EUR 8.00 - EUR 0.31 - EUR 0.40) |
| **Monthly fees from Creem**       | EUR 0                                      |
| **Annual revenue per subscriber** | ~EUR 87.48 net                             |

---

## 8. Should You Integrate Now?

### Arguments FOR Starting Now

1. **Sandbox is fully available** — You can build and test without any real money
2. **Clean codebase** — No conflicting payment code to work around
3. **Gamification is fresh** — Perfect time to tie premium perks into the XP/achievement system
4. **Deep link scheme exists** — `everydayfoodapp://` is already configured
5. **Convex supports HTTP endpoints** — Webhook handling is straightforward
6. **React Native demo exists** — [Reference implementation](https://github.com/arihantagarwal/creem-react-native-demo) available

### Arguments for WAITING

1. **No premium features defined yet** — Need to decide what's free vs paid before building the paywall
2. **User base size** — If you have very few users, focus on retention first
3. **App Store considerations** — Apple requires in-app purchases for digital goods/services on iOS. Using Creem as MoR may bypass this, but verify Apple's latest policies for your use case
4. **Feature completeness** — Some core features (achievements screen, edit-profile) are still in progress

### Recommendation

**Start the backend integration now (sandbox mode), defer the paywall UI until premium features are defined.**

Specifically:

1. **Phase 1 (Now)**: Set up Creem test account, create test product, build Convex subscription schema + webhook handler + checkout action. All in sandbox mode.
2. **Phase 2 (Soon)**: Define premium feature tiers, implement feature gating logic with `isPremiumUser()` helper.
3. **Phase 3 (When ready)**: Build paywall UI, subscription management screens, and profile badges.
4. **Phase 4 (Launch)**: Switch from test to live API keys, test end-to-end, ship.

---

## 9. Risk Assessment

| Risk                    | Severity | Mitigation                                                                                                                                                                                                           |
| ----------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Apple IAP policy**    | HIGH     | Creem is MoR, but Apple may still require IAP for iOS digital subscriptions. Research Apple's policy on "reader apps" and "external purchases" for your category. Consider offering web-only checkout for iOS users. |
| **Webhook reliability** | MEDIUM   | Creem retries at 30s, 1m, 5m, 1h. Implement idempotent webhook handlers with deduplication.                                                                                                                          |
| **Trial abuse**         | MEDIUM   | Creem handles trial management at product level. Consider linking trials to email/device fingerprint.                                                                                                                |
| **Payment failures**    | LOW      | Creem has smart dunning and payment recovery built in. Handle `past_due` status gracefully.                                                                                                                          |
| **SDK maturity**        | LOW      | TypeScript SDK is official and maintained. REST API is stable.                                                                                                                                                       |

---

## 10. Technical References

| Resource            | URL                                                       |
| ------------------- | --------------------------------------------------------- |
| Creem Documentation | https://docs.creem.io                                     |
| Creem API Reference | https://docs.creem.io/api-reference/introduction          |
| TypeScript SDK      | https://github.com/armitage-labs/creem-sdk                |
| React Native Demo   | https://github.com/arihantagarwal/creem-react-native-demo |
| Creem + Better Auth | https://better-auth.com/docs/plugins/creem                |
| Creem Dashboard     | https://www.creem.io (toggle Test Mode in navbar)         |

---

## 11. Next Steps

- [ ] Create Creem account and activate Test Mode
- [ ] Create test product: "Everyday Food Pro" — EUR 8/mo, 7-day trial
- [ ] Add `CREEM_API_KEY` and `CREEM_WEBHOOK_SECRET` to `.env.local`
- [ ] Design subscription schema in `convex/schema.ts`
- [ ] Implement webhook handler in `convex/http.ts`
- [ ] Build `createCheckout` action in `convex/payments.ts`
- [ ] Define premium vs free feature boundaries
- [ ] Build paywall screen and subscription management UI
- [ ] Test full flow with test cards
- [ ] Review Apple/Google IAP policies for your app category
- [ ] Switch to live API keys when ready to launch
