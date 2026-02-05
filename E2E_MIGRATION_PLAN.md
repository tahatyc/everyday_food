# E2E Test Migration Plan: Maestro to Playwright

## Executive Summary

**Objective**: Migrate 14 Maestro E2E tests to Playwright for better cross-platform testing, CI/CD integration, and maintainability.

**Current State**: 14 Maestro YAML test files across 6 test domains
**Target State**: Playwright TypeScript test suite with Page Object Model architecture

---

## Epic Breakdown

### EPIC 1: Infrastructure Setup
**Priority**: P0 (Blocking)
**Delegated to**: `/sc:implement`

| Story | Tasks | Dependencies |
|-------|-------|--------------|
| **1.1 Install Playwright** | Install @playwright/test, configure tsconfig | None |
| **1.2 Configure Playwright** | Create playwright.config.ts for web target | 1.1 |
| **1.3 Setup Test Structure** | Create e2e/ directory, fixtures, helpers | 1.2 |
| **1.4 CI/CD Integration** | Add Playwright to npm scripts, GitHub Actions | 1.3 |

**Deliverables**:
- `playwright.config.ts` - Playwright configuration
- `e2e/` - Test directory structure
- `e2e/fixtures/` - Test fixtures and helpers
- `package.json` - Updated scripts

---

### EPIC 2: Core Test Infrastructure
**Priority**: P0 (Blocking)
**Delegated to**: `/sc:implement`

| Story | Tasks | Dependencies |
|-------|-------|--------------|
| **2.1 Auth Fixtures** | Create authenticated user fixture, login helper | Epic 1 |
| **2.2 Page Object Models** | Base page class, common actions | Epic 1 |
| **2.3 Test Data Factories** | Recipe, user, meal plan test data generators | 2.1 |
| **2.4 Custom Matchers** | Recipe-specific assertions, UI state checks | 2.2 |

**Deliverables**:
- `e2e/fixtures/auth.fixture.ts` - Authentication helpers
- `e2e/pages/BasePage.ts` - Base page object
- `e2e/factories/` - Test data factories
- `e2e/matchers/` - Custom test matchers

---

### EPIC 3: Page Object Models
**Priority**: P1
**Delegated to**: `/sc:implement`

| Page Object | Maestro Source | Key Selectors/Actions |
|-------------|---------------|----------------------|
| **LoginPage** | auth/login.yaml | email input, password input, sign in button |
| **RegisterPage** | auth/register.yaml | name, email, password, confirm, create account |
| **HomePage** | common across tests | "HELLO, CHEF!", import recipe, navigation |
| **RecipesPage** | recipes/*.yaml | search, filters (All, My Recipes, Favorites), recipe cards |
| **RecipeDetailPage** | recipes/view-recipe.yaml | ingredients, steps, share button, start cooking |
| **ImportRecipePage** | recipes/import-recipe.yaml | URL input, import button, syncing state |
| **ManualRecipePage** | recipes/create-recipe.yaml | title, servings, prep/cook time, ingredients, steps |
| **ShareRecipeModal** | recipes/share-recipe.yaml | friends tab, link tab, create link, active links |
| **MealPlanPage** | meal-plan/*.yaml | day selector, meal slots, add meal, generate plan |
| **SelectRecipePage** | meal-plan/add-meal.yaml | recipe selection, filters |
| **GroceryListPage** | grocery-list/*.yaml | items list, aisle/recipe view, add item, toggle |
| **FriendsPage** | friends/manage-friends.yaml | search, friends list, pending requests |
| **CookModePage** | cook-mode/walkthrough.yaml | step navigation, swipe gestures |
| **ProfilePage** | friends/manage-friends.yaml | chef profile, my friends link |

**Deliverables**: 14 Page Object classes in `e2e/pages/`

---

### EPIC 4: Test Migration
**Priority**: P1
**Delegated to**: `/sc:implement`

#### 4.1 Auth Tests (2 tests)
| Maestro File | Playwright Test | Actions to Migrate |
|--------------|-----------------|-------------------|
| `auth/login.yaml` | `auth/login.spec.ts` | launchApp, assertVisible, tapOn, inputText |
| `auth/register.yaml` | `auth/register.spec.ts` | form fill, index-based tap, timeout assertions |

**Maestro → Playwright Mapping**:
```
launchApp (clearState) → page.goto() + clear storage
assertVisible → expect(locator).toBeVisible()
tapOn (text) → page.getByText().click()
tapOn (id) → page.getByTestId().click()
tapOn (index) → locator.nth(index).click()
inputText → locator.fill()
```

#### 4.2 Recipe Tests (5 tests)
| Maestro File | Playwright Test | Complexity |
|--------------|-----------------|------------|
| `recipes/view-recipe.yaml` | `recipes/view-recipe.spec.ts` | Medium - search, filters, optional assertions |
| `recipes/create-recipe.yaml` | `recipes/create-recipe.spec.ts` | High - scrolling, multiple inputs |
| `recipes/import-recipe.yaml` | `recipes/import-recipe.spec.ts` | Medium - async state (syncing) |
| `recipes/favorite-recipe.yaml` | `recipes/favorite-recipe.spec.ts` | Low - navigation, filter toggle |
| `recipes/share-recipe.yaml` | `recipes/share-recipe.spec.ts` | Medium - modal, tabs, dynamic content |

#### 4.3 Meal Plan Tests (2 tests)
| Maestro File | Playwright Test | Complexity |
|--------------|-----------------|------------|
| `meal-plan/add-meal.yaml` | `meal-plan/add-meal.spec.ts` | Medium - nested navigation |
| `meal-plan/generate-plan.yaml` | `meal-plan/generate-plan.spec.ts` | Low - button click, state verification |

#### 4.4 Grocery List Tests (2 tests)
| Maestro File | Playwright Test | Complexity |
|--------------|-----------------|------------|
| `grocery-list/view-grocery.yaml` | `grocery-list/view-grocery.spec.ts` | Medium - view toggles, navigation |
| `grocery-list/generate-list.yaml` | `grocery-list/generate-list.spec.ts` | Medium - cross-page flow |

#### 4.5 Social Tests (1 test)
| Maestro File | Playwright Test | Complexity |
|--------------|-----------------|------------|
| `friends/manage-friends.yaml` | `friends/manage-friends.spec.ts` | Medium - search, scroll |

#### 4.6 Cook Mode Tests (1 test)
| Maestro File | Playwright Test | Complexity |
|--------------|-----------------|------------|
| `cook-mode/walkthrough.yaml` | `cook-mode/walkthrough.spec.ts` | High - swipe gestures → keyboard/click |

---

### EPIC 5: Validation & Cleanup
**Priority**: P2
**Delegated to**: `/sc:test` + `/sc:troubleshoot`

| Story | Tasks | Dependencies |
|-------|-------|--------------|
| **5.1 Run All Tests** | Execute full Playwright suite | Epic 4 |
| **5.2 Fix Flaky Tests** | Identify and stabilize timing issues | 5.1 |
| **5.3 Coverage Report** | Generate test coverage documentation | 5.2 |
| **5.4 Remove Maestro** | Delete .maestro/ directory, update scripts | 5.3 |

---

## Technical Specifications

### Playwright Configuration
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:8081', // Expo web
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
  ],
  webServer: {
    command: 'npm run web',
    url: 'http://localhost:8081',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Directory Structure
```
e2e/
├── fixtures/
│   ├── auth.fixture.ts      # Authenticated user setup
│   └── test-data.fixture.ts # Test data generators
├── pages/
│   ├── BasePage.ts          # Common page actions
│   ├── LoginPage.ts
│   ├── RegisterPage.ts
│   ├── HomePage.ts
│   ├── RecipesPage.ts
│   ├── RecipeDetailPage.ts
│   ├── ImportRecipePage.ts
│   ├── ManualRecipePage.ts
│   ├── ShareRecipeModal.ts
│   ├── MealPlanPage.ts
│   ├── SelectRecipePage.ts
│   ├── GroceryListPage.ts
│   ├── FriendsPage.ts
│   ├── CookModePage.ts
│   └── ProfilePage.ts
├── auth/
│   ├── login.spec.ts
│   └── register.spec.ts
├── recipes/
│   ├── view-recipe.spec.ts
│   ├── create-recipe.spec.ts
│   ├── import-recipe.spec.ts
│   ├── favorite-recipe.spec.ts
│   └── share-recipe.spec.ts
├── meal-plan/
│   ├── add-meal.spec.ts
│   └── generate-plan.spec.ts
├── grocery-list/
│   ├── view-grocery.spec.ts
│   └── generate-list.spec.ts
├── friends/
│   └── manage-friends.spec.ts
└── cook-mode/
    └── walkthrough.spec.ts
```

### Maestro → Playwright Command Mapping

| Maestro Command | Playwright Equivalent |
|-----------------|----------------------|
| `launchApp` | `await page.goto('/')` |
| `launchApp: { clearState: true }` | `await context.clearCookies()` + `page.goto('/')` |
| `assertVisible: "text"` | `await expect(page.getByText('text')).toBeVisible()` |
| `assertVisible: { text, timeout }` | `await expect(page.getByText('text')).toBeVisible({ timeout })` |
| `tapOn: "text"` | `await page.getByText('text').click()` |
| `tapOn: { id: "..." }` | `await page.getByTestId('...').click()` |
| `tapOn: { index: N }` | `await page.locator('...').nth(N).click()` |
| `inputText: "value"` | `await locator.fill('value')` |
| `clearInput` | `await locator.clear()` |
| `clearText` | `await locator.clear()` |
| `scrollUntilVisible` | `await locator.scrollIntoViewIfNeeded()` |
| `swipeLeft` | `await page.keyboard.press('ArrowRight')` or custom swipe |
| `swipeRight` | `await page.keyboard.press('ArrowLeft')` or custom swipe |
| `back` | `await page.goBack()` |
| `extendedWaitUntil` | `await expect(locator).toBeVisible({ timeout })` |
| `waitForAnimationToEnd` | `await page.waitForTimeout(300)` or animation selector |

---

## Execution Order

```
Phase 1: Infrastructure (Epic 1 + 2)
├── 1.1 Install Playwright
├── 1.2 Configure playwright.config.ts
├── 1.3 Create directory structure
├── 2.1 Create auth fixtures
└── 2.2 Create BasePage

Phase 2: Page Objects (Epic 3)
├── LoginPage, RegisterPage
├── HomePage, RecipesPage, RecipeDetailPage
├── ImportRecipePage, ManualRecipePage, ShareRecipeModal
├── MealPlanPage, SelectRecipePage
├── GroceryListPage, FriendsPage
└── CookModePage, ProfilePage

Phase 3: Test Migration (Epic 4)
├── Auth tests (login, register)
├── Recipe tests (5 files)
├── Meal plan tests (2 files)
├── Grocery list tests (2 files)
├── Friends tests (1 file)
└── Cook mode tests (1 file)

Phase 4: Validation (Epic 5)
├── Run full suite
├── Fix flaky tests
├── Generate coverage report
└── Remove Maestro artifacts
```

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Expo Web compatibility issues | Medium | High | Test on Expo web early, use web-compatible selectors |
| Swipe gestures not translating | Medium | Medium | Use keyboard navigation or button alternatives |
| Test data dependencies | Low | Medium | Create isolated test fixtures with Convex seeding |
| CI/CD flakiness | Medium | Medium | Add retries, proper waits, screenshot on failure |

---

## Success Criteria

- [ ] All 14 Maestro tests migrated to Playwright
- [ ] Tests pass on local development
- [ ] Tests pass in CI/CD pipeline
- [ ] Test execution under 5 minutes total
- [ ] Page Object Model architecture implemented
- [ ] Documentation updated (CLAUDE.md, README)
- [ ] Maestro artifacts removed

---

## npm Scripts (To Add)

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:report": "playwright show-report"
  }
}
```

---

## Next Steps

To begin implementation, run:
```
/sc:implement "Setup Playwright infrastructure for E2E tests"
```

This plan delegates execution to:
- `/sc:implement` - All code implementation tasks
- `/sc:test` - Test validation and coverage
- `/sc:troubleshoot` - Flaky test debugging
