# Everyday Food - Business Panel Analysis

## Feature Evaluation for Business Value & Necessity

**Date**: February 2026
**App**: Everyday Food - Recipe Management & Meal Planning
**Analysis Type**: Multi-Expert Business Panel Discussion

---

## Feature 1: App Settings

### Current State

The Profile screen ([profile.tsx](app/(tabs)/profile.tsx#L219-L240)) has an "APP SETTINGS" button that is **non-functional** (no `onPress` handler). The subtitle reads "Preferences, notifications, sync" but leads nowhere. The database schema already supports `preferredUnits` (metric/imperial), `defaultServings`, and `dietaryPreferences` on the users table.

### Expert Perspectives

**Clayton Christensen (Jobs-to-be-Done)**:
The "job" users hire a recipe app for is deeply personal — cooking is cultural, dietary, and habitual. Settings let users tell the app *who they are as a cook*. Without settings, you're forcing every user into one mold. The Job-to-be-Done here is: "Help me cook *my way*, not a generic way."

**Peter Drucker (Management by Objectives)**:
Settings are infrastructure, not glamour. But they are the *foundation* for personalization, which is the single biggest differentiator in consumer apps. Without a functioning settings screen, your existing schema fields (`preferredUnits`, `defaultServings`, `dietaryPreferences`) are dead weight — you built the backend but left the front door locked.

**Seth Godin (Tribe Building)**:
Settings are where users *invest* in your product. The more they customize, the harder it is to leave. This is the IKEA effect applied to software — when users build their own experience, they value it more. A settings screen isn't just utility, it's a retention mechanism.

### Recommended Settings Sections

| Section | Settings | Business Value |
|---------|----------|----------------|
| **Cooking Preferences** | Default servings, preferred units (metric/imperial) | Reduces friction in every recipe view |
| **Dietary Profile** | Dietary preferences (vegetarian, vegan, gluten-free, keto, etc.) | Enables smart filtering, personalized recommendations |
| **Meal Planning** | Default meal times, week start day (Mon/Sun) | Makes planner feel tailored |
| **Display** | Theme (light/dark — future), font size | Accessibility and comfort |
| **Data & Account** | Clear data, export recipes, delete account | Trust & compliance (GDPR-like) |
| **About** | App version, feedback link, terms | Standard hygiene |

### Business Value Verdict

| Metric | Rating | Reasoning |
|--------|--------|-----------|
| User Retention | HIGH | Personalization = investment = stickiness |
| Development Effort | LOW-MEDIUM | Backend already supports key fields, just needs UI |
| Revenue Impact | MEDIUM | Prerequisite for premium features (themes, advanced dietary profiles) |
| User Expectation | CRITICAL | Users *expect* a working settings screen — a broken one signals abandonment |

### Recommendation: BUILD — Priority: HIGH

The backend is already built. You have `preferredUnits`, `defaultServings`, and `dietaryPreferences` in your schema with an `updateProfile` mutation ready. The settings button already exists in the UI. Not connecting it is leaving value on the table. **Estimated scope: 1 screen, wiring to existing mutation.**

---

## Feature 2: Calendar Button in Weekly Planner

### Current State

The Weekly Planner ([meal-plan.tsx](app/(tabs)/meal-plan.tsx#L443-L456)) header has a calendar icon button (`calendar-outline`) that is **non-functional** (no `onPress` handler). The planner currently only shows 7 days forward from today using `generateWeekDays()`. Users cannot navigate to past or future weeks.

### Expert Perspectives

**Michael Porter (Competitive Strategy)**:
Every serious meal planning app offers multi-week navigation. Mealime, Paprika, and Yummly all do. Without it, your planner is a *daily view with extra steps*. This is table-stakes functionality — not having it is a competitive disadvantage, not a feature gap.

**Donella Meadows (Systems Thinking)**:
The meal planner is the central loop of your app — recipes feed into plans, plans feed into grocery lists, grocery lists feed into cooking, cooking feeds back into recipes (via cook count and favorites). A calendar that only shows one week *breaks the reinforcing loop*. Users who meal prep for 2 weeks ahead or want to review last week's meals hit a dead end, and the entire system loses momentum.

**W. Chan Kim & Renee Mauborgne (Blue Ocean Strategy)**:
Instead of just a date picker, consider what competitors DON'T do: show a monthly overview with color-coded meal density. At a glance, users see which days are planned (green), partially planned (yellow), or empty (red). This turns the calendar from navigation into *motivation* — "I've only planned 3 days this week, let me fill the rest."

### Functionality Options

| Option | Description | Effort | Value |
|--------|-------------|--------|-------|
| **A. Simple Week Picker** | Navigate forward/back by week with arrows | LOW | Gets the job done |
| **B. Date Picker Modal** | Tap calendar icon, select any date, jump to that week | MEDIUM | Standard UX pattern |
| **C. Monthly Overview** | Calendar view showing planned vs. unplanned days with color density | HIGH | Differentiator, motivational |

### Business Value Verdict

| Metric | Rating | Reasoning |
|--------|--------|-----------|
| User Retention | HIGH | Meal planning is a weekly habit — lock-in grows with history |
| Development Effort | LOW (Option A) to MEDIUM (Option B) | Your `getByDateRange` query already supports arbitrary dates |
| Revenue Impact | MEDIUM | Power users who plan ahead are premium conversion candidates |
| User Expectation | HIGH | A calendar icon that does nothing is worse than no icon at all |

### Recommendation: BUILD — Priority: HIGH

Start with **Option A** (week navigation arrows) as the minimum, then upgrade to **Option B** (date picker). The backend already supports `getByDate` and `getByDateRange` for any date string. The only work is UI navigation logic. **A non-functional calendar icon actively damages trust.**

---

## Feature 3: Filters in Recipes Page

### Current State

The Recipes page ([recipes.tsx](app/(tabs)/recipes.tsx#L155-L293)) already has:
- A search bar with text search (connected to `api.recipes.search`)
- Filter chips: All, My Recipes, Global, Breakfast, Lunch, Dinner, Favorites
- A filter icon button (`options-outline`) that shows a **basic Alert dialog** saying "Use the category chips below" — essentially a dead end

The existing filter chips cover meal type and source, but there is **no filtering by**: difficulty, cook time, cuisine, ingredient count, dietary tags, or nutrition.

### Expert Perspectives

**Clayton Christensen (Jobs-to-be-Done)**:
Users search for recipes in two modes: *browsing* ("What sounds good?") and *solving* ("What can I make in 20 minutes with chicken?"). Your current filters serve browsing. The solving mode — which is the higher-urgency, higher-frequency job — needs constraint-based filters: time, ingredients on hand, dietary restrictions.

**Michael Porter (Five Forces)**:
Advanced filtering is where recipe apps differentiate. Your schema already stores `difficulty`, `prepTime`, `cookTime`, `cuisine`, and `nutritionPerServing`. Exposing these as filters costs UI effort only — the data layer is ready.

**Nassim Nicholas Taleb (Antifragility)**:
Don't over-engineer filters. Most users use 1-2 filters max. A complex filter panel that looks like an airline booking engine will scare casual users. Build filters that handle the 80% case elegantly, and let power users combine them.

### Recommended Filter Categories

| Filter | Data Source | UX Pattern | Priority |
|--------|-------------|------------|----------|
| **Cook Time** | `prepTime + cookTime` | Range slider or chips (< 15min, < 30min, < 60min) | HIGH — #1 requested filter in recipe apps |
| **Difficulty** | `difficulty` field | 3 chips: Easy, Medium, Hard | HIGH — already in schema |
| **Cuisine** | `cuisine` field | Multi-select chips | MEDIUM — data may be sparse |
| **Dietary** | `dietaryPreferences` / tags | Multi-select: Vegetarian, Vegan, Gluten-free | MEDIUM — ties into user settings |
| **Calories** | `nutritionPerServing.calories` | Range: < 300, 300-500, 500+ | LOW — nice to have for health-focused users |
| **Servings** | `servings` field | Range: 1-2, 3-4, 5+ | LOW — niche use |

### Implementation Approach

Replace the Alert dialog on the filter icon with a **bottom sheet/modal** containing filter options. The filter chips (meal type) can stay as quick-access top-level filters, while the filter icon opens advanced options.

### Business Value Verdict

| Metric | Rating | Reasoning |
|--------|--------|-----------|
| User Retention | HIGH | Finding the right recipe fast = satisfaction = return visits |
| Development Effort | MEDIUM | UI only — all data fields already exist in schema |
| Revenue Impact | MEDIUM | Advanced filters can be a premium feature gate |
| User Expectation | MEDIUM-HIGH | Current filter icon showing an Alert feels broken |

### Recommendation: BUILD — Priority: MEDIUM-HIGH

Start with **Cook Time** and **Difficulty** filters (both already in schema). Add as a bottom sheet from the existing filter icon. The current Alert dialog actively makes the app feel unfinished. **Minimum viable: replace Alert with 2-3 real filters in a bottom sheet.**

---

## Feature 4: Edit Profile Button Functionality

### Current State

The Profile screen ([profile.tsx](app/(tabs)/profile.tsx#L136-L144)) has an "EDIT PROFILE" button that is **non-functional** (no `onPress` handler). The profile currently displays:
- Avatar (hardcoded chef emoji)
- Display name (from `user.name` or "CHEF")
- Bio (from `dietaryPreferences` or default text)

The backend `updateProfile` mutation ([users.ts](convex/users.ts#L85-L112)) already accepts: `name`, `email`, `imageUrl`, `defaultServings`, `preferredUnits`, `dietaryPreferences`.

### Expert Perspectives

**Jim Collins (Good to Great)**:
Profile editing is a "flywheel" component. When users invest their identity into an app — their name, their photo, their dietary preferences — they build personal equity. Each edit makes the app more "theirs." This feeds into recipe recommendations, social features (friends see their profile), and ultimately makes them evangelists.

**Seth Godin (Permission Marketing)**:
A profile is a *declaration of intent*. When a user says "I'm vegetarian" or "I cook for 2," they're giving you permission to personalize their experience. That's the most valuable data you can collect — voluntarily given, high-signal, and directly actionable. But you must *deliver on it*. If they set dietary preferences and still see non-matching recipes everywhere, trust breaks.

**Peter Drucker**:
The edit profile functionality should overlap with settings where it makes sense. Don't create two places to set dietary preferences. Profile = identity (name, photo, bio). Settings = behavior (units, servings, notifications). Keep them distinct.

### Recommended Edit Profile Fields

| Field | Current State | Edit UX | Business Impact |
|-------|--------------|---------|-----------------|
| **Display Name** | Shows `user.name` | Text input | Social features, personalization |
| **Avatar/Photo** | Hardcoded emoji | Image picker or emoji selector | Identity investment, social profile |
| **Bio/Tagline** | Auto-generated from prefs | Text input (optional) | Social/sharing — friends see this |
| **Email** | Stored but not shown | Text input (read-only or editable) | Account recovery, notifications |
| **Dietary Preferences** | Shown as bio fallback | Multi-select chips | Recipe filtering, meal plan suggestions |

### Implementation Approach

Two viable patterns:
1. **Inline editing**: Tap fields on profile screen to edit in-place (simpler, mobile-native)
2. **Edit screen**: Navigate to a dedicated edit form (more structured, allows validation)

**Recommendation**: Dedicated edit screen (new route `/edit-profile`) — cleaner separation, easier to add fields later, better form validation.

### Business Value Verdict

| Metric | Rating | Reasoning |
|--------|--------|-----------|
| User Retention | HIGH | Identity investment = switching cost |
| Development Effort | LOW | Backend mutation exists, just needs form UI |
| Revenue Impact | LOW-MEDIUM | Prerequisite for social features and premium profiles |
| User Expectation | CRITICAL | A visible "EDIT PROFILE" button that does nothing is a UX failure |

### Recommendation: BUILD — Priority: HIGH

The mutation is already built. The button is already visible. Users tap it and nothing happens. **This is the lowest-effort, highest-trust-repair fix on this list.** Wire the button to a simple form with name, dietary preferences, and default servings. Avatar can be Phase 2.

---

## Feature 5: Notifications

### Current State

The Home screen ([index.tsx](app/(tabs)/index.tsx#L286-L288)) has a notification bell icon in the header that is **non-functional** (no `onPress` handler, no badge count). There is no notification infrastructure in the backend (no notifications table, no push notification setup).

### Expert Perspectives

**Clayton Christensen (Disruption Theory)**:
Notifications are a double-edged sword. Done right, they bring users back at the exact moment of need ("Time to start cooking dinner!"). Done wrong, they're the #1 reason users uninstall. For a meal planning app, notifications serve a *genuine job*: "Remind me about my plan so I don't default to takeout."

**Nassim Nicholas Taleb (Antifragility & Risk)**:
Notifications are asymmetric risk. Bad notifications (too frequent, irrelevant) cause uninstalls — a catastrophic, irreversible outcome. Good notifications are a modest retention boost. The downside is bigger than the upside. **Start with opt-in, minimal, high-value notifications only.** You can always add more; you can't undo an uninstall.

**Donella Meadows (Systems Thinking)**:
Notifications are a *feedback loop accelerator*. The meal planning loop (plan → shop → cook → enjoy → plan again) has natural time delays — users forget they planned meals. Notifications compress the delay: "You planned Chicken Tikka for tonight — start prepping at 6 PM." This is a high-leverage intervention point in the system.

**Seth Godin (Permission & Tribe)**:
Notifications are the ultimate permission asset. Users who opt in to your notifications are your *tribe*. But permission is fragile — one annoying notification and it's revoked forever. Make every notification feel like a *gift*, not an interruption.

### Notification Types by Business Value

| Notification Type | Trigger | Value | Priority |
|-------------------|---------|-------|----------|
| **Meal Reminder** | "Dinner planned: [Recipe]. Start cooking at [time]" | HIGH — core use case, prevents meal plan abandonment | P1 |
| **Cooking Timer** | "Your [step] timer is done!" (from Cook Mode) | HIGH — already have timer data in steps schema | P1 |
| **Shopping Reminder** | "You have [X] items on your grocery list" | MEDIUM — drives engagement with shopping feature | P2 |
| **Friend Activity** | "[Friend] shared a recipe with you" | MEDIUM — social engagement driver | P2 |
| **Weekly Planning** | "Plan your meals for next week" (Sunday prompt) | MEDIUM — habit formation trigger | P2 |
| **Streak/Achievement** | "You've cooked 5 meals this week!" | LOW — gamification, can feel hollow | P3 |
| **Recipe Suggestions** | "Based on your preferences, try [recipe]" | LOW — high risk of feeling spammy | P3 |

### Implementation Complexity

| Component | Description | Effort |
|-----------|-------------|--------|
| **Expo Notifications** | `expo-notifications` package for push notifications | MEDIUM |
| **Backend Table** | New `notifications` table in Convex schema | LOW |
| **Notification Center** | In-app screen listing past notifications | MEDIUM |
| **Permission Flow** | Opt-in prompt with clear value proposition | LOW |
| **Scheduling Logic** | Server-side triggers based on meal plans, timers | HIGH |
| **Push Token Management** | Store device tokens per user | MEDIUM |

### Business Value Verdict

| Metric | Rating | Reasoning |
|--------|--------|-----------|
| User Retention | VERY HIGH | #1 re-engagement tool in mobile apps |
| Development Effort | HIGH | Requires new infrastructure (push tokens, scheduling, backend table) |
| Revenue Impact | HIGH | Push notifications are the foundation for premium features |
| User Expectation | MEDIUM | Bell icon exists but users may not expect full notifications yet |

### Recommendation: BUILD IN PHASES — Priority: MEDIUM (Phase 1), HIGH (long-term)

**Phase 1 (NOW)**: Make the bell icon open a simple "Notifications coming soon" screen or remove the icon. A non-functional bell is confusing. Add a basic in-app notification for friend requests and recipe shares (you already have the data).

**Phase 2 (NEXT)**: Add `expo-notifications`, implement meal reminders and cooking timers. These are the highest-value, lowest-annoyance notifications.

**Phase 3 (LATER)**: Weekly planning prompts, shopping reminders, and social activity notifications.

---

## Consensus Summary

### Priority Matrix

| Feature | Build? | Priority | Effort | Trust Repair | Revenue Potential |
|---------|--------|----------|--------|--------------|-------------------|
| **Edit Profile** | YES | P1 - CRITICAL | LOW | CRITICAL — button exists, does nothing | Low-Medium |
| **App Settings** | YES | P1 - HIGH | LOW-MEDIUM | HIGH — button exists, does nothing | Medium |
| **Calendar Button** | YES | P1 - HIGH | LOW | HIGH — icon exists, does nothing | Medium |
| **Recipe Filters** | YES | P2 - MEDIUM-HIGH | MEDIUM | MEDIUM — filter icon shows Alert | Medium-High |
| **Notifications** | PHASED | P2-P3 | HIGH | LOW — no user expectation yet | Very High (long-term) |

### Key Consensus Point

All experts agree on one critical insight: **You have four UI elements (Edit Profile, App Settings, Calendar, Filter icon) that are visible to users but non-functional.** This is worse than not having them at all. Each broken button erodes trust. The highest-ROI work right now is wiring these existing buttons to real functionality — the backend is largely already built.

### Disagreements

**Taleb vs. Godin on Notifications**: Taleb argues for extreme caution (asymmetric downside risk of uninstalls), while Godin sees notifications as the tribe-building engine. **Resolution**: Both are right — start opt-in and minimal (Taleb's approach) to earn the right to expand (Godin's vision).

**Porter vs. Kim on Recipe Filters**: Porter says advanced filters are table stakes (competitors have them). Kim says they're a differentiation opportunity (monthly calendar view, visual meal density). **Resolution**: Build the table stakes first (time, difficulty), then explore unique filter experiences.

### Recommended Build Order

1. **Edit Profile** — Wire button to form, 1-2 days, immediate trust repair
2. **App Settings** — Wire button to settings screen, 2-3 days, backend ready
3. **Calendar Navigation** — Add week arrows + date picker, 1-2 days, backend ready
4. **Recipe Filters** — Bottom sheet with time/difficulty, 3-4 days, data ready
5. **Notifications Phase 1** — In-app notification center for shares/friends, 1 week
6. **Notifications Phase 2** — Push notifications for meal reminders, 2-3 weeks

---

*Analysis generated by Business Panel System — Everyday Food*
*Experts simulated: Christensen, Porter, Drucker, Godin, Kim & Mauborgne, Collins, Taleb, Meadows*
