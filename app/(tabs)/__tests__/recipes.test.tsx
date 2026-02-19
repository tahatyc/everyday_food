import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { useMutation, useQuery } from 'convex/react';
import { router } from 'expo-router';
import RecipesScreen from '../recipes';

describe('RecipesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state when recipes are undefined', () => {
    (useQuery as jest.Mock).mockReturnValue(undefined);

    const { getByText } = render(<RecipesScreen />);
    expect(getByText('Loading recipes...')).toBeTruthy();
  });

  it('renders header with title', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce([]) // allRecipes
      .mockReturnValueOnce(undefined) // searchResults (skipped)
      .mockReturnValueOnce([]); // favoriteRecipes

    const { getByText } = render(<RecipesScreen />);
    expect(getByText('Recipes')).toBeTruthy();
  });

  it('renders filter chips', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce([])
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce([]);

    const { getByText } = render(<RecipesScreen />);
    expect(getByText('All')).toBeTruthy();
    expect(getByText('My Recipes')).toBeTruthy();
    expect(getByText('Breakfast')).toBeTruthy();
    expect(getByText('Lunch')).toBeTruthy();
    expect(getByText('Dinner')).toBeTruthy();
    expect(getByText('Favorites')).toBeTruthy();
  });

  it('shows empty state when no recipes exist', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce([])
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce([]);

    const { getByText } = render(<RecipesScreen />);
    expect(getByText('No recipes found')).toBeTruthy();
    expect(getByText('0 recipes')).toBeTruthy();
  });

  it('renders recipe list items', () => {
    const mockRecipes = [
      {
        _id: 'recipe1',
        title: 'Spaghetti',
        description: 'Classic pasta dish',
        prepTime: 10,
        cookTime: 20,
        servings: 4,
        difficulty: 'easy',
        isFavorite: false,
        tags: ['dinner'],
        ingredients: [],
        steps: [],
      },
    ];
    (useQuery as jest.Mock)
      .mockReturnValueOnce(mockRecipes)
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce([]);

    const { getByText } = render(<RecipesScreen />);
    expect(getByText('Spaghetti')).toBeTruthy();
    expect(getByText('Classic pasta dish')).toBeTruthy();
    expect(getByText('30 min')).toBeTruthy();
    expect(getByText('4 servings')).toBeTruthy();
    expect(getByText('1 recipe')).toBeTruthy();
  });

  it('shows recipe count correctly for multiple recipes', () => {
    const mockRecipes = [
      { _id: 'r1', title: 'Recipe 1', servings: 2, tags: [], ingredients: [], steps: [] },
      { _id: 'r2', title: 'Recipe 2', servings: 4, tags: [], ingredients: [], steps: [] },
      { _id: 'r3', title: 'Recipe 3', servings: 6, tags: [], ingredients: [], steps: [] },
    ];
    (useQuery as jest.Mock)
      .mockReturnValueOnce(mockRecipes)
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce([]);

    const { getByText } = render(<RecipesScreen />);
    expect(getByText('3 recipes')).toBeTruthy();
  });

  it('navigates to recipe detail when a recipe is pressed', () => {
    const mockRecipes = [
      {
        _id: 'recipe1',
        title: 'Spaghetti',
        servings: 4,
        tags: [],
        ingredients: [],
        steps: [],
      },
    ];
    (useQuery as jest.Mock)
      .mockReturnValueOnce(mockRecipes)
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce([]);

    const { getByText } = render(<RecipesScreen />);
    fireEvent.press(getByText('Spaghetti'));
    expect(router.push).toHaveBeenCalledWith('/recipe/recipe1');
  });

  it('navigates to import when add button is pressed', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce([])
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce([]);

    const { getByTestId } = render(<RecipesScreen />);
    fireEvent.press(getByTestId('icon-add'));
    expect(router.push).toHaveBeenCalledWith('/import');
  });

  it('renders search input', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce([])
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce([]);

    const { getByPlaceholderText } = render(<RecipesScreen />);
    expect(getByPlaceholderText('Search recipes...')).toBeTruthy();
  });

  it('shows tags on recipe items', () => {
    const mockRecipes = [
      {
        _id: 'r1',
        title: 'Pasta',
        servings: 4,
        tags: ['dinner', 'Italian'],
        ingredients: [],
        steps: [],
      },
    ];
    (useQuery as jest.Mock)
      .mockReturnValueOnce(mockRecipes)
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce([]);

    const { getByText } = render(<RecipesScreen />);
    expect(getByText('dinner')).toBeTruthy();
    expect(getByText('Italian')).toBeTruthy();
  });

  it('shows favorite recipes when Favorites filter is selected', () => {
    const mockRecipes = [
      {
        _id: 'r1',
        title: 'Personal Fav',
        servings: 2,
        isFavorite: true,
        tags: [],
        ingredients: [],
        steps: [],
      },
      {
        _id: 'r2',
        title: 'Non-Fav',
        servings: 4,
        isFavorite: false,
        tags: [],
        ingredients: [],
        steps: [],
      },
    ];
    const mockFavorites = [
      {
        _id: 'r1',
        title: 'Personal Fav',
        servings: 2,
        isFavorite: true,
        tags: [],
        ingredients: [],
        steps: [],
      },
      {
        _id: 'r3',
        title: 'Global Fav Recipe',
        servings: 4,
        isGlobal: true,
        tags: ['dinner'],
        ingredients: [],
        steps: [],
      },
    ];
    let callCount = 0;
    (useQuery as jest.Mock).mockImplementation(() => {
      callCount++;
      const idx = ((callCount - 1) % 3) + 1;
      if (idx === 1) return mockRecipes;  // allRecipes
      if (idx === 2) return undefined;     // searchResults
      return mockFavorites;                // favoriteRecipes
    });

    const { getByText } = render(<RecipesScreen />);
    fireEvent.press(getByText('Favorites'));
    expect(getByText('Personal Fav')).toBeTruthy();
    expect(getByText('Global Fav Recipe')).toBeTruthy();
    expect(getByText('2 recipes')).toBeTruthy();
  });

  it('shows global favorites in Favorites filter (not just personal)', () => {
    const mockFavorites = [
      {
        _id: 'r3',
        title: 'Global Favorite',
        servings: 2,
        isGlobal: true,
        tags: [],
        ingredients: [],
        steps: [],
      },
    ];
    let callCount = 0;
    (useQuery as jest.Mock).mockImplementation(() => {
      callCount++;
      const idx = ((callCount - 1) % 3) + 1;
      if (idx === 1) return [];          // allRecipes
      if (idx === 2) return undefined;    // searchResults
      return mockFavorites;               // favoriteRecipes
    });

    const { getByText } = render(<RecipesScreen />);
    fireEvent.press(getByText('Favorites'));
    expect(getByText('Global Favorite')).toBeTruthy();
    expect(getByText('1 recipe')).toBeTruthy();
  });

  it('shows empty state when no favorites exist', () => {
    let callCount = 0;
    (useQuery as jest.Mock).mockImplementation(() => {
      callCount++;
      const idx = ((callCount - 1) % 3) + 1;
      if (idx === 1) return [];          // allRecipes
      if (idx === 2) return undefined;    // searchResults
      return [];                          // favoriteRecipes
    });

    const { getByText } = render(<RecipesScreen />);
    fireEvent.press(getByText('Favorites'));
    expect(getByText('No recipes found')).toBeTruthy();
  });

  it('shows global badge for global recipes', () => {
    const mockRecipes = [
      {
        _id: 'r1',
        title: 'Global Recipe',
        servings: 4,
        isGlobal: true,
        tags: [],
        ingredients: [],
        steps: [],
      },
    ];
    (useQuery as jest.Mock)
      .mockReturnValueOnce(mockRecipes)
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce([]);

    const { getByText } = render(<RecipesScreen />);
    expect(getByText('GLOBAL')).toBeTruthy();
  });
});

// Helper: create a stable mock that always returns the same data across re-renders
function setupStableMock(recipes: any[], favorites: any[] = []) {
  (useQuery as jest.Mock).mockImplementation((_queryFn: any, args: any) => {
    // searchResults query is called with "skip" when no search query
    if (args === 'skip') return undefined;
    // Distinguish by args shape - getFavorites has no args
    if (args === undefined) return favorites;
    // recipes.list has includeGlobal/globalOnly args
    if (args && 'includeGlobal' in args) return recipes;
    // recipes.search has query arg
    if (args && 'query' in args) return recipes;
    return recipes;
  });
}

describe('RecipesScreen - Advanced Filters', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockRecipes = [
    {
      _id: 'r1',
      title: 'Quick Salad',
      description: 'Fresh and fast',
      prepTime: 5,
      cookTime: 5,
      servings: 2,
      difficulty: 'easy',
      tags: ['lunch', 'Vegetarian', 'Mediterranean'],
      ingredients: [],
      steps: [],
    },
    {
      _id: 'r2',
      title: 'Beef Stew',
      description: 'Slow cooked',
      prepTime: 20,
      cookTime: 120,
      servings: 6,
      difficulty: 'hard',
      tags: ['dinner', 'American'],
      ingredients: [],
      steps: [],
    },
    {
      _id: 'r3',
      title: 'Pasta Carbonara',
      description: 'Italian classic',
      prepTime: 10,
      cookTime: 15,
      servings: 4,
      difficulty: 'medium',
      tags: ['dinner', 'Italian'],
      ingredients: [],
      steps: [],
    },
    {
      _id: 'r4',
      title: 'Smoothie Bowl',
      description: 'Healthy breakfast',
      prepTime: 5,
      cookTime: 0,
      servings: 1,
      difficulty: 'easy',
      tags: ['breakfast', 'Vegan', 'Gluten-Free'],
      ingredients: [],
      steps: [],
    },
  ];

  it('opens filter sheet when filter icon is pressed', () => {
    setupStableMock(mockRecipes);

    const { getByTestId, getByText } = render(<RecipesScreen />);
    fireEvent.press(getByTestId('icon-options-outline'));

    expect(getByText('FILTER RECIPES')).toBeTruthy();
    expect(getByText('RESET')).toBeTruthy();
  });

  it('shows all filter sections in the sheet', () => {
    setupStableMock(mockRecipes);

    const { getByTestId, getByText } = render(<RecipesScreen />);
    fireEvent.press(getByTestId('icon-options-outline'));

    expect(getByText('COOK TIME')).toBeTruthy();
    expect(getByText('DIFFICULTY')).toBeTruthy();
    expect(getByText('CUISINE')).toBeTruthy();
    expect(getByText('DIETARY')).toBeTruthy();
  });

  it('shows cook time options in the filter sheet', () => {
    setupStableMock(mockRecipes);

    const { getByTestId, getByText } = render(<RecipesScreen />);
    fireEvent.press(getByTestId('icon-options-outline'));

    expect(getByText('< 15 min')).toBeTruthy();
    expect(getByText('< 30 min')).toBeTruthy();
    expect(getByText('< 60 min')).toBeTruthy();
    expect(getByText('Any')).toBeTruthy();
  });

  it('shows difficulty options in the filter sheet', () => {
    setupStableMock(mockRecipes);

    const { getByTestId, getByText } = render(<RecipesScreen />);
    fireEvent.press(getByTestId('icon-options-outline'));

    expect(getByText('Easy')).toBeTruthy();
    expect(getByText('Medium')).toBeTruthy();
    expect(getByText('Hard')).toBeTruthy();
  });

  it('shows dietary options in the filter sheet', () => {
    setupStableMock(mockRecipes);

    const { getByTestId, getAllByText, getByText } = render(<RecipesScreen />);
    fireEvent.press(getByTestId('icon-options-outline'));

    // Vegetarian/Vegan/Gluten-Free appear both as recipe tags and filter chips
    expect(getAllByText('Vegetarian').length).toBeGreaterThanOrEqual(2);
    expect(getAllByText('Vegan').length).toBeGreaterThanOrEqual(2);
    expect(getAllByText('Gluten-Free').length).toBeGreaterThanOrEqual(2);
    // Keto only appears as a filter chip (no recipes have it)
    expect(getByText('Keto')).toBeTruthy();
  });

  it('shows apply button with recipe count', () => {
    setupStableMock(mockRecipes);

    const { getByTestId, getByText } = render(<RecipesScreen />);
    fireEvent.press(getByTestId('icon-options-outline'));

    expect(getByText('APPLY FILTERS (4)')).toBeTruthy();
  });

  it('updates apply button count when selecting cook time filter', () => {
    setupStableMock(mockRecipes);

    const { getByTestId, getByText } = render(<RecipesScreen />);
    fireEvent.press(getByTestId('icon-options-outline'));

    // Select "< 15 min" — only Quick Salad (10min) and Smoothie Bowl (5min) match
    fireEvent.press(getByText('< 15 min'));
    expect(getByText('APPLY FILTERS (2)')).toBeTruthy();
  });

  it('updates apply button count when selecting difficulty filter', () => {
    setupStableMock(mockRecipes);

    const { getByTestId, getByText } = render(<RecipesScreen />);
    fireEvent.press(getByTestId('icon-options-outline'));

    // Select "Hard" — only Beef Stew matches
    fireEvent.press(getByText('Hard'));
    expect(getByText('APPLY FILTERS (1)')).toBeTruthy();
  });

  it('filters recipes by cook time when applied', () => {
    setupStableMock(mockRecipes);

    const { getByTestId, getByText, queryByText } = render(<RecipesScreen />);

    // Open filter sheet
    fireEvent.press(getByTestId('icon-options-outline'));

    // Select "< 15 min"
    fireEvent.press(getByText('< 15 min'));

    // Apply
    fireEvent.press(getByText('APPLY FILTERS (2)'));

    // Quick Salad (10min) and Smoothie Bowl (5min) should show
    expect(getByText('Quick Salad')).toBeTruthy();
    expect(getByText('Smoothie Bowl')).toBeTruthy();

    // Beef Stew (140min) and Pasta Carbonara (25min) should be hidden
    expect(queryByText('Beef Stew')).toBeNull();
    expect(queryByText('Pasta Carbonara')).toBeNull();

    // Should show filtered indicator
    expect(getByText('2 recipes (filtered)')).toBeTruthy();
  });

  it('filters recipes by difficulty when applied', () => {
    setupStableMock(mockRecipes);

    const { getByTestId, getByText, queryByText } = render(<RecipesScreen />);

    fireEvent.press(getByTestId('icon-options-outline'));
    fireEvent.press(getByText('Easy'));
    fireEvent.press(getByText('APPLY FILTERS (2)'));

    // Quick Salad and Smoothie Bowl are easy
    expect(getByText('Quick Salad')).toBeTruthy();
    expect(getByText('Smoothie Bowl')).toBeTruthy();
    expect(queryByText('Beef Stew')).toBeNull();
    expect(queryByText('Pasta Carbonara')).toBeNull();
  });

  it('supports multi-select for difficulty filter', () => {
    setupStableMock(mockRecipes);

    const { getByTestId, getByText } = render(<RecipesScreen />);

    fireEvent.press(getByTestId('icon-options-outline'));

    // Select both Easy and Medium
    fireEvent.press(getByText('Easy'));
    fireEvent.press(getByText('Medium'));

    // Quick Salad (easy), Smoothie Bowl (easy), Pasta Carbonara (medium) = 3
    expect(getByText('APPLY FILTERS (3)')).toBeTruthy();
  });

  it('filters recipes by dietary tag when applied', () => {
    setupStableMock(mockRecipes);

    const { getByTestId, getAllByText, getByText, queryByText } = render(<RecipesScreen />);

    fireEvent.press(getByTestId('icon-options-outline'));
    // "Vegan" appears as both a recipe tag and filter chip — press the last one (filter chip)
    const veganElements = getAllByText('Vegan');
    fireEvent.press(veganElements[veganElements.length - 1]);
    fireEvent.press(getByText('APPLY FILTERS (1)'));

    // Only Smoothie Bowl has Vegan tag
    expect(getByText('Smoothie Bowl')).toBeTruthy();
    expect(queryByText('Quick Salad')).toBeNull();
    expect(queryByText('Beef Stew')).toBeNull();
  });

  it('resets all pending filters when RESET is pressed', () => {
    setupStableMock(mockRecipes);

    const { getByTestId, getByText } = render(<RecipesScreen />);

    fireEvent.press(getByTestId('icon-options-outline'));

    // Select some filters
    fireEvent.press(getByText('< 15 min'));
    fireEvent.press(getByText('Hard'));
    expect(getByText('APPLY FILTERS (0)')).toBeTruthy();

    // Reset
    fireEvent.press(getByText('RESET'));

    // Should show full count again
    expect(getByText('APPLY FILTERS (4)')).toBeTruthy();
  });

  it('shows active filter badge on filter icon after applying', () => {
    setupStableMock(mockRecipes);

    const { getByTestId, getByText } = render(<RecipesScreen />);

    fireEvent.press(getByTestId('icon-options-outline'));
    fireEvent.press(getByText('Easy'));
    fireEvent.press(getByText('< 30 min'));
    fireEvent.press(getByText('APPLY FILTERS (2)'));

    // Badge should show 2 (1 difficulty + 1 cook time)
    expect(getByText('2')).toBeTruthy();
  });

  it('shows CLEAR FILTERS button in empty state when filters produce no results', () => {
    setupStableMock(mockRecipes);

    const { getByTestId, getByText } = render(<RecipesScreen />);

    // Apply filter that matches nothing: Keto (no recipes have Keto tag)
    fireEvent.press(getByTestId('icon-options-outline'));
    fireEvent.press(getByText('Keto'));
    fireEvent.press(getByText('APPLY FILTERS (0)'));

    expect(getByText('No recipes match your filters')).toBeTruthy();
    expect(getByText('CLEAR FILTERS')).toBeTruthy();
  });

  it('clears filters when CLEAR FILTERS button is pressed in empty state', () => {
    setupStableMock(mockRecipes);

    const { getByTestId, getByText } = render(<RecipesScreen />);

    // Apply filter that matches nothing
    fireEvent.press(getByTestId('icon-options-outline'));
    fireEvent.press(getByText('Keto'));
    fireEvent.press(getByText('APPLY FILTERS (0)'));

    // Press CLEAR FILTERS
    fireEvent.press(getByText('CLEAR FILTERS'));

    // Should show all recipes again
    expect(getByText('4 recipes')).toBeTruthy();
    expect(getByText('Quick Salad')).toBeTruthy();
  });

  it('toggles cook time filter off when pressed twice', () => {
    setupStableMock(mockRecipes);

    const { getByTestId, getByText } = render(<RecipesScreen />);
    fireEvent.press(getByTestId('icon-options-outline'));

    // Select then deselect "< 15 min"
    fireEvent.press(getByText('< 15 min'));
    expect(getByText('APPLY FILTERS (2)')).toBeTruthy();

    fireEvent.press(getByText('< 15 min'));
    expect(getByText('APPLY FILTERS (4)')).toBeTruthy();
  });

  it('toggles difficulty off when pressed twice (multi-select deselect)', () => {
    setupStableMock(mockRecipes);

    const { getByTestId, getByText } = render(<RecipesScreen />);
    fireEvent.press(getByTestId('icon-options-outline'));

    fireEvent.press(getByText('Hard'));
    expect(getByText('APPLY FILTERS (1)')).toBeTruthy();

    // Deselect
    fireEvent.press(getByText('Hard'));
    expect(getByText('APPLY FILTERS (4)')).toBeTruthy();
  });

  it('preserves applied filters when reopening the sheet', () => {
    setupStableMock(mockRecipes);

    const { getByTestId, getByText } = render(<RecipesScreen />);

    // Apply a cook time filter
    fireEvent.press(getByTestId('icon-options-outline'));
    fireEvent.press(getByText('< 30 min'));
    fireEvent.press(getByText('APPLY FILTERS (3)'));

    // Confirm filter was applied
    expect(getByText('3 recipes (filtered)')).toBeTruthy();

    // Reopen sheet — should show the previously applied filter state
    fireEvent.press(getByTestId('icon-options-outline'));
    // The count should still reflect the same pending state
    expect(getByText('APPLY FILTERS (3)')).toBeTruthy();
  });

  it('combines multiple filter types (cook time + difficulty)', () => {
    setupStableMock(mockRecipes);

    const { getByTestId, getByText, queryByText } = render(<RecipesScreen />);

    fireEvent.press(getByTestId('icon-options-outline'));

    // < 30 min AND easy
    fireEvent.press(getByText('< 30 min'));
    fireEvent.press(getByText('Easy'));

    // Quick Salad (10min, easy) and Smoothie Bowl (5min, easy) match both
    // Pasta Carbonara (25min, medium) fails difficulty
    expect(getByText('APPLY FILTERS (2)')).toBeTruthy();

    fireEvent.press(getByText('APPLY FILTERS (2)'));

    expect(getByText('Quick Salad')).toBeTruthy();
    expect(getByText('Smoothie Bowl')).toBeTruthy();
    expect(queryByText('Pasta Carbonara')).toBeNull();
    expect(queryByText('Beef Stew')).toBeNull();
  });
});

// ─── Meal-Type Filter Chips (BUG-4 fix: case-insensitive tag matching) ─────────

describe('RecipesScreen - Meal Type Filter Chips', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const allRecipes = [
    {
      _id: 'b1',
      title: 'Scrambled Eggs',
      servings: 2,
      tags: ['breakfast'],
      ingredients: [],
      steps: [],
    },
    {
      _id: 'b2',
      title: 'Oatmeal',
      servings: 1,
      tags: ['Breakfast'], // uppercase — BUG-4: must match case-insensitively
      ingredients: [],
      steps: [],
    },
    {
      _id: 'l1',
      title: 'Caesar Salad',
      servings: 2,
      tags: ['lunch'],
      ingredients: [],
      steps: [],
    },
    {
      _id: 'd1',
      title: 'Beef Stew',
      servings: 4,
      tags: ['dinner', 'American'],
      ingredients: [],
      steps: [],
    },
    {
      _id: 'd2',
      title: 'Pasta Carbonara',
      servings: 4,
      tags: ['Dinner', 'Italian'], // uppercase — BUG-4 fix covers this too
      ingredients: [],
      steps: [],
    },
  ];

  function setupMealTypeMock(recipes = allRecipes, favorites: any[] = []) {
    (useQuery as jest.Mock).mockImplementation((_queryFn: any, args: any) => {
      if (args === 'skip') return undefined;
      if (args === undefined) return favorites;
      return recipes;
    });
  }

  // Helper to press a filter chip by label (chips appear before recipe tag badges)
  function pressFilterChip(getAllByText: (text: string) => any[], label: string) {
    const elements = getAllByText(label);
    fireEvent.press(elements[0]);
  }

  it('shows only breakfast recipes when Breakfast chip is pressed', () => {
    setupMealTypeMock();

    const { getAllByText, queryByText } = render(<RecipesScreen />);
    pressFilterChip(getAllByText, 'Breakfast');

    expect(getAllByText('Scrambled Eggs').length).toBeGreaterThanOrEqual(1);
    expect(getAllByText('Oatmeal').length).toBeGreaterThanOrEqual(1);
    expect(queryByText('Caesar Salad')).toBeNull();
    expect(queryByText('Beef Stew')).toBeNull();
    expect(queryByText('Pasta Carbonara')).toBeNull();
  });

  it('matches breakfast tags case-insensitively (BUG-4 fix)', () => {
    // Both 'breakfast' and 'Breakfast' tags should match when Breakfast chip is active
    setupMealTypeMock();

    const { getAllByText } = render(<RecipesScreen />);
    pressFilterChip(getAllByText, 'Breakfast');

    // Both lowercase 'breakfast' and uppercase 'Breakfast' tags must match
    expect(getAllByText('Scrambled Eggs').length).toBeGreaterThanOrEqual(1); // tag: 'breakfast'
    expect(getAllByText('Oatmeal').length).toBeGreaterThanOrEqual(1);        // tag: 'Breakfast'
    expect(getAllByText('2 recipes').length).toBeGreaterThanOrEqual(1);
  });

  it('shows only lunch recipes when Lunch chip is pressed', () => {
    setupMealTypeMock();

    const { getAllByText, getByText, queryByText } = render(<RecipesScreen />);
    pressFilterChip(getAllByText, 'Lunch');

    expect(getByText('Caesar Salad')).toBeTruthy();
    expect(queryByText('Scrambled Eggs')).toBeNull();
    expect(queryByText('Beef Stew')).toBeNull();
    expect(getByText('1 recipe')).toBeTruthy();
  });

  it('shows only dinner recipes when Dinner chip is pressed', () => {
    setupMealTypeMock();

    const { getAllByText, queryByText } = render(<RecipesScreen />);
    pressFilterChip(getAllByText, 'Dinner');

    expect(getAllByText('Beef Stew').length).toBeGreaterThanOrEqual(1);
    expect(getAllByText('Pasta Carbonara').length).toBeGreaterThanOrEqual(1); // tag: 'Dinner' (uppercase)
    expect(queryByText('Scrambled Eggs')).toBeNull();
    expect(queryByText('Caesar Salad')).toBeNull();
    expect(getAllByText('2 recipes').length).toBeGreaterThanOrEqual(1);
  });

  it('matches dinner tags case-insensitively (BUG-4 fix)', () => {
    setupMealTypeMock();

    const { getAllByText } = render(<RecipesScreen />);
    pressFilterChip(getAllByText, 'Dinner');

    // 'dinner' (lowercase) and 'Dinner' (uppercase) both match
    expect(getAllByText('Beef Stew').length).toBeGreaterThanOrEqual(1);       // tag: 'dinner'
    expect(getAllByText('Pasta Carbonara').length).toBeGreaterThanOrEqual(1); // tag: 'Dinner'
  });

  it('shows all recipes when All chip is pressed after a meal filter', () => {
    setupMealTypeMock();

    const { getAllByText, getByText } = render(<RecipesScreen />);
    pressFilterChip(getAllByText, 'Breakfast');
    expect(getAllByText('2 recipes').length).toBeGreaterThanOrEqual(1);

    fireEvent.press(getByText('All'));
    expect(getByText('5 recipes')).toBeTruthy();
  });

  it('shows empty state when no recipes match selected meal type', () => {
    // Only breakfast recipes — Lunch chip should show empty state
    setupMealTypeMock([
      { _id: 'b1', title: 'Pancakes', servings: 2, tags: ['breakfast'], ingredients: [], steps: [] },
    ]);

    const { getAllByText, getByText } = render(<RecipesScreen />);
    pressFilterChip(getAllByText, 'Lunch');

    expect(getByText('No recipes found')).toBeTruthy();
  });

  it('shows correct count label in header after filtering by meal type', () => {
    setupMealTypeMock();

    const { getAllByText, getByText } = render(<RecipesScreen />);

    pressFilterChip(getAllByText, 'Breakfast');
    expect(getAllByText('2 recipes').length).toBeGreaterThanOrEqual(1);

    pressFilterChip(getAllByText, 'Lunch');
    expect(getByText('1 recipe')).toBeTruthy();

    pressFilterChip(getAllByText, 'Dinner');
    expect(getAllByText('2 recipes').length).toBeGreaterThanOrEqual(1);
  });
});

// ─── Favorite Toggle ─────────────────────────────────────────────────────────

describe('RecipesScreen - Favorite Toggle', () => {
  // Stable mock function references — call history is cleared by jest.clearAllMocks()
  const mockToggleFavorite = jest.fn();
  const mockToggleGlobalFavorite = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // RecipeListItem calls useMutation in this order:
    //   1st call → toggleFavorite
    //   2nd call → toggleGlobalRecipeFavorite
    (useMutation as jest.Mock)
      .mockReturnValueOnce(mockToggleFavorite)
      .mockReturnValueOnce(mockToggleGlobalFavorite);
  });

  function setupWithRecipe(recipe: any) {
    (useQuery as jest.Mock).mockImplementation((_queryFn: any, args: any) => {
      if (args === 'skip') return undefined;
      if (args === undefined) return []; // favoriteRecipes
      return [recipe];                   // allRecipes / searchResults
    });
  }

  it('renders heart-outline icon for an unfavorited recipe', () => {
    setupWithRecipe({
      _id: 'r1', title: 'Pasta', servings: 4,
      isFavorite: false, tags: [], ingredients: [], steps: [],
    });

    const { getByTestId } = render(<RecipesScreen />);
    expect(getByTestId('icon-heart-outline')).toBeTruthy();
  });

  it('renders filled heart icon for a favorited recipe', () => {
    setupWithRecipe({
      _id: 'r1', title: 'Pasta', servings: 4,
      isFavorite: true, tags: [], ingredients: [], steps: [],
    });

    const { getByTestId } = render(<RecipesScreen />);
    expect(getByTestId('icon-heart')).toBeTruthy();
  });

  it('calls toggleFavorite with recipeId when heart is pressed on a personal recipe', () => {
    setupWithRecipe({
      _id: 'r1', title: 'My Pasta', servings: 4,
      isFavorite: false, isGlobal: false,
      tags: [], ingredients: [], steps: [],
    });

    const { getByTestId } = render(<RecipesScreen />);
    fireEvent.press(getByTestId('icon-heart-outline'));

    expect(mockToggleFavorite).toHaveBeenCalledWith({ recipeId: 'r1' });
    expect(mockToggleGlobalFavorite).not.toHaveBeenCalled();
  });

  it('calls toggleGlobalRecipeFavorite with recipeId when heart is pressed on a global recipe', () => {
    setupWithRecipe({
      _id: 'g1', title: 'Global Pasta', servings: 4,
      isFavorite: false, isGlobal: true,
      tags: [], ingredients: [], steps: [],
    });

    const { getByTestId } = render(<RecipesScreen />);
    fireEvent.press(getByTestId('icon-heart-outline'));

    expect(mockToggleGlobalFavorite).toHaveBeenCalledWith({ recipeId: 'g1' });
    expect(mockToggleFavorite).not.toHaveBeenCalled();
  });

  it('does not navigate to recipe detail when heart button is pressed', () => {
    setupWithRecipe({
      _id: 'r1', title: 'Pasta', servings: 4,
      isFavorite: false, tags: [], ingredients: [], steps: [],
    });

    const { getByTestId } = render(<RecipesScreen />);
    fireEvent.press(getByTestId('icon-heart-outline'));

    expect(router.push).not.toHaveBeenCalled();
  });

  it('calls toggleGlobalRecipeFavorite to unfavorite an already-favorited global recipe', () => {
    setupWithRecipe({
      _id: 'g1', title: 'Global Pasta', servings: 4,
      isFavorite: true, isGlobal: true,
      tags: [], ingredients: [], steps: [],
    });

    const { getByTestId } = render(<RecipesScreen />);
    fireEvent.press(getByTestId('icon-heart'));

    expect(mockToggleGlobalFavorite).toHaveBeenCalledWith({ recipeId: 'g1' });
    expect(mockToggleFavorite).not.toHaveBeenCalled();
  });
});
