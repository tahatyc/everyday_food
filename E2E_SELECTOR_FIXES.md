# E2E Selector Fixes

This document outlines the selector mismatches found between the Playwright page objects and the actual React Native app code.

## Summary

- **ManualRecipePage.ts**: 9 critical selector issues
- **ImportRecipePage.ts**: 1 minor issue
- **RecipesPage.ts**: No issues found

---

## ManualRecipePage.ts

**File**: `e2e/pages/ManualRecipePage.ts`
**App File**: `app/manual-recipe.tsx`

### Critical: Multi-Step Form Navigation

The manual recipe screen uses a **4-step wizard** that requires clicking "NEXT" to navigate between steps:

| Step | Content | Button to Proceed |
|------|---------|-------------------|
| 1 | Basic Info (title, servings, prep/cook time) | NEXT |
| 2 | Ingredients | NEXT |
| 3 | Cooking Steps | NEXT |
| 4 | Extras (description, cuisine, privacy) | SAVE RECIPE |

**Impact**: Tests cannot access ingredients/steps fields without first completing step 1 and clicking NEXT.

### Selector Mismatches

#### 1. Title Input
```typescript
// Current (WRONG)
this.titleInput = page.getByPlaceholder('Recipe Title');

// Fix
this.titleInput = page.getByPlaceholder("e.g., Grandma's Apple Pie");
```
**Location**: `app/manual-recipe.tsx:229`

#### 2. Servings Input
```typescript
// Current (WRONG)
this.servingsInput = page.getByPlaceholder('Servings');

// Fix
this.servingsInput = page.getByPlaceholder('4');
```
**Location**: `app/manual-recipe.tsx:240`

#### 3. Prep Time Input
```typescript
// Current (WRONG)
this.prepTimeInput = page.getByPlaceholder('Prep Time');

// Fix
this.prepTimeInput = page.getByPlaceholder('15');
```
**Location**: `app/manual-recipe.tsx:254`

#### 4. Cook Time Input
```typescript
// Current (WRONG)
this.cookTimeInput = page.getByPlaceholder('Cook Time');

// Fix
this.cookTimeInput = page.getByPlaceholder('30');
```
**Location**: `app/manual-recipe.tsx:266`

#### 5. Add Ingredient Button
```typescript
// Current (WRONG - case mismatch)
this.addIngredientButton = page.getByText('Add Ingredient');

// Fix (use regex for case-insensitivity)
this.addIngredientButton = page.getByText(/add ingredient/i);
// Or exact match
this.addIngredientButton = page.getByText('ADD INGREDIENT');
```
**Location**: `app/manual-recipe.tsx:358`

#### 6. Add Step Button
```typescript
// Current (WRONG - case mismatch)
this.addStepButton = page.getByText('Add Step');

// Fix
this.addStepButton = page.getByText(/add step/i);
// Or exact match
this.addStepButton = page.getByText('ADD STEP');
```
**Location**: `app/manual-recipe.tsx:404`

#### 7. Save Recipe Button
```typescript
// Current (WRONG - case mismatch)
this.saveRecipeButton = page.getByText('Save Recipe');

// Fix
this.saveRecipeButton = page.getByText(/save recipe/i);
// Or exact match
this.saveRecipeButton = page.getByText('SAVE RECIPE');
```
**Location**: `app/manual-recipe.tsx:567`

#### 8. Verify Manual Recipe Screen
```typescript
// Current (WRONG)
async verifyManualRecipeScreen() {
  await expect(this.page.getByText('Recipe Title')).toBeVisible();
}

// Fix - check for step title or label
async verifyManualRecipeScreen() {
  await expect(this.page.getByText('BASIC INFO')).toBeVisible();
}
```
**Location**: `app/manual-recipe.tsx:222`

#### 9. Add Step Method - Placeholder Selector
```typescript
// Current (WRONG - placeholder doesn't contain "step")
async addStep(step: string) {
  const inputs = this.page.locator('textarea[placeholder*="step" i], input[placeholder*="step" i]');
  // ...
}

// Fix - use actual placeholder text
async addStep(step: string) {
  const inputs = this.page.locator('input[placeholder="Describe this step..."], textarea[placeholder="Describe this step..."]');
  // Or more flexible
  const inputs = this.page.getByPlaceholder(/describe this step/i);
  // ...
}
```
**Location**: `app/manual-recipe.tsx:379`

### Required: Add Navigation Method

Add a method to navigate between wizard steps:

```typescript
/**
 * Click Next to proceed to next step
 */
async clickNext() {
  await this.page.getByText('NEXT').click();
}

/**
 * Navigate to ingredients step (step 2)
 */
async goToIngredientsStep() {
  await this.clickNext(); // From step 1 to step 2
}

/**
 * Navigate to steps step (step 3)
 */
async goToStepsStep() {
  await this.clickNext(); // From step 2 to step 3
}

/**
 * Navigate to extras step (step 4)
 */
async goToExtrasStep() {
  await this.clickNext(); // From step 3 to step 4
}
```

---

## ImportRecipePage.ts

**File**: `e2e/pages/ImportRecipePage.ts`
**App File**: `app/import.tsx`

### Minor Issue: Paste Link Section

```typescript
// Current (may have matching issues due to newline)
this.pasteLinkSection = page.getByText('PASTE A LINK');

// Fix - use regex to handle multiline text
this.pasteLinkSection = page.getByText(/paste a link/i);
```
**Location**: `app/import.tsx:97-98` - Text contains `"PASTE A LINK\nTO COOK."`

### All Other Selectors - OK

| Selector | Value | Status |
|----------|-------|--------|
| `pageTitle` | `'Import & Sync'` | OK |
| `urlLabel` | `'RECIPE URL'` | OK |
| `urlInput` | `'TikTok, YouTube, or Blog URL...'` | OK |
| `importButton` | `'IMPORT RECIPE'` | OK |
| `createManuallyButton` | `'MANUAL'` | OK |
| `syncingIndicator` | `'SYNCING...'` | OK |

---

## RecipesPage.ts

**File**: `e2e/pages/RecipesPage.ts`
**App File**: `app/(tabs)/recipes.tsx`

### All Selectors - OK

The filter chip labels in the page object match the app code:

| Filter | Page Object | App Code | Status |
|--------|-------------|----------|--------|
| All | `'All'` | `'All'` | OK |
| My Recipes | `'My Recipes'` | `'My Recipes'` | OK |
| Favorites | `'Favorites'` | `'Favorites'` | OK |
| Breakfast | `'Breakfast'` | `'Breakfast'` | OK |
| Lunch | `'Lunch'` | `'Lunch'` | OK |
| Dinner | `'Dinner'` | `'Dinner'` | OK |

---

## Test Flow Updates Required

### create-recipe.spec.ts

The test needs to be updated to navigate through the wizard steps:

```typescript
test('should create a recipe manually', async ({ authenticatedPage: page }) => {
  // ... navigate to manual recipe screen ...

  // Step 1: Basic Info
  await manualRecipePage.enterTitle('Test Pasta Recipe');
  await manualRecipePage.enterServings('4');
  await manualRecipePage.enterPrepTime('15');
  await manualRecipePage.enterCookTime('25');
  await manualRecipePage.clickNext(); // NEW: Navigate to step 2

  // Step 2: Ingredients
  await manualRecipePage.addIngredient('Pasta');
  await manualRecipePage.addIngredient('Tomato Sauce');
  await manualRecipePage.clickNext(); // NEW: Navigate to step 3

  // Step 3: Steps
  await manualRecipePage.addStep('Boil pasta in salted water');
  await manualRecipePage.addStep('Add sauce and serve');
  await manualRecipePage.clickNext(); // NEW: Navigate to step 4

  // Step 4: Extras (optional) - can skip directly to save
  await manualRecipePage.clickSaveRecipe();

  // Verify
  await manualRecipePage.verifyRecipeCreated('Test Pasta Recipe');
});
```

---

## Recommended Selector Strategy

Use case-insensitive regex patterns for text matching to handle React Native's text rendering:

```typescript
// Instead of exact match
page.getByText('ADD INGREDIENT');

// Use case-insensitive regex
page.getByText(/add ingredient/i);
```

This provides resilience against case changes in the UI while still being specific enough to match the intended elements.
