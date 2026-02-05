/**
 * Shopping list test data factory
 * Generates test data for grocery list E2E tests
 */

export interface TestShoppingItem {
  name: string;
  quantity: string;
  unit: string;
  aisle: string;
  isChecked?: boolean;
}

export interface TestShoppingList {
  name: string;
  items: TestShoppingItem[];
  isActive: boolean;
}

/**
 * Common aisles for grocery items
 */
export const AISLES = {
  produce: 'Produce',
  dairy: 'Dairy',
  meat: 'Meat & Seafood',
  bakery: 'Bakery',
  frozen: 'Frozen',
  canned: 'Canned Goods',
  beverages: 'Beverages',
  snacks: 'Snacks',
  condiments: 'Condiments',
  spices: 'Spices & Seasonings',
  other: 'Other',
};

/**
 * Generate a test shopping item
 */
export function createTestShoppingItem(overrides: Partial<TestShoppingItem> = {}): TestShoppingItem {
  return {
    name: `Item ${Date.now()}`,
    quantity: '1',
    unit: 'piece',
    aisle: AISLES.other,
    isChecked: false,
    ...overrides,
  };
}

/**
 * Generate a produce item
 */
export function createProduceItem(name: string, quantity = '1', unit = 'lb'): TestShoppingItem {
  return {
    name,
    quantity,
    unit,
    aisle: AISLES.produce,
    isChecked: false,
  };
}

/**
 * Generate a dairy item
 */
export function createDairyItem(name: string, quantity = '1', unit = 'container'): TestShoppingItem {
  return {
    name,
    quantity,
    unit,
    aisle: AISLES.dairy,
    isChecked: false,
  };
}

/**
 * Generate a meat item
 */
export function createMeatItem(name: string, quantity = '1', unit = 'lb'): TestShoppingItem {
  return {
    name,
    quantity,
    unit,
    aisle: AISLES.meat,
    isChecked: false,
  };
}

/**
 * Generate a bakery item
 */
export function createBakeryItem(name: string, quantity = '1', unit = 'loaf'): TestShoppingItem {
  return {
    name,
    quantity,
    unit,
    aisle: AISLES.bakery,
    isChecked: false,
  };
}

/**
 * Generate multiple shopping items
 */
export function createShoppingItems(count: number): TestShoppingItem[] {
  return Array.from({ length: count }, (_, i) => ({
    name: `Item ${i + 1}`,
    quantity: String(i + 1),
    unit: 'piece',
    aisle: Object.values(AISLES)[i % Object.values(AISLES).length],
    isChecked: false,
  }));
}

/**
 * Generate a test shopping list
 */
export function createTestShoppingList(overrides: Partial<TestShoppingList> = {}): TestShoppingList {
  return {
    name: `Shopping List ${Date.now()}`,
    items: [
      createProduceItem('Tomatoes', '4', 'medium'),
      createProduceItem('Onions', '2', 'large'),
      createDairyItem('Milk', '1', 'gallon'),
      createDairyItem('Cheese', '1', 'block'),
      createMeatItem('Chicken', '2', 'lbs'),
      createBakeryItem('Bread', '1', 'loaf'),
    ],
    isActive: true,
    ...overrides,
  };
}

/**
 * Generate an empty shopping list
 */
export function createEmptyShoppingList(name?: string): TestShoppingList {
  return {
    name: name ?? `Empty List ${Date.now()}`,
    items: [],
    isActive: true,
  };
}

/**
 * Generate a shopping list from recipe ingredients
 */
export function createListFromRecipe(
  recipeTitle: string,
  ingredients: { name: string; amount: string; unit: string }[]
): TestShoppingList {
  return {
    name: `List for ${recipeTitle}`,
    items: ingredients.map((ing) => ({
      name: ing.name,
      quantity: ing.amount,
      unit: ing.unit,
      aisle: AISLES.other,
      isChecked: false,
    })),
    isActive: true,
  };
}

/**
 * Partially checked list (for testing clear checked functionality)
 */
export function createPartiallyCheckedList(): TestShoppingList {
  const list = createTestShoppingList();
  return {
    ...list,
    items: list.items.map((item, i) => ({
      ...item,
      isChecked: i % 2 === 0, // Every other item is checked
    })),
  };
}
