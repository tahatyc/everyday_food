import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { useQuery, useMutation } from 'convex/react';
import { router, useLocalSearchParams } from 'expo-router';
import SelectRecipeScreen from '../select-recipe';

// Mock Stack.Screen since select-recipe uses it
jest.mock('expo-router', () => {
  const actual = jest.requireActual('expo-router');
  return {
    ...actual,
    router: {
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
      canGoBack: jest.fn(() => true),
    },
    useRouter: () => ({
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
      canGoBack: jest.fn(() => true),
    }),
    useLocalSearchParams: jest.fn(() => ({
      date: '2026-02-07',
      mealType: 'breakfast',
    })),
    useSegments: () => [],
    usePathname: () => '/',
    Link: 'Link',
    Redirect: 'Redirect',
    Stack: {
      Screen: () => null,
    },
  };
});

const mockAddMeal = jest.fn();

const mockRecipes = [
  {
    _id: 'r1',
    title: 'Pancakes',
    description: 'Fluffy pancakes',
    prepTime: 10,
    cookTime: 15,
    servings: 4,
    difficulty: 'easy',
    tags: ['breakfast'],
  },
  {
    _id: 'r2',
    title: 'Caesar Salad',
    description: 'Classic salad',
    prepTime: 15,
    cookTime: 0,
    servings: 2,
    difficulty: 'easy',
    tags: ['lunch'],
  },
  {
    _id: 'r3',
    title: 'Spaghetti Bolognese',
    description: 'Italian classic',
    prepTime: 15,
    cookTime: 45,
    servings: 4,
    difficulty: 'medium',
    tags: ['dinner'],
    isGlobal: true,
  },
];

beforeEach(() => {
  jest.clearAllMocks();
  (useMutation as jest.Mock).mockReturnValue(mockAddMeal);
  (useLocalSearchParams as jest.Mock).mockReturnValue({
    date: '2026-02-07',
    mealType: 'breakfast',
  });
});

describe('SelectRecipeScreen', () => {
  it('shows loading state when recipes are undefined', () => {
    (useQuery as jest.Mock).mockReturnValue(undefined);

    const { getByText } = render(<SelectRecipeScreen />);
    expect(getByText('Loading recipes...')).toBeTruthy();
  });

  it('renders header with meal type', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce(mockRecipes) // allRecipes
      .mockReturnValueOnce(undefined);  // searchResults (skipped)

    const { getByText } = render(<SelectRecipeScreen />);
    expect(getByText('SELECT BREAKFAST')).toBeTruthy();
  });

  it('renders header with date subtitle', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce(mockRecipes)
      .mockReturnValueOnce(undefined);

    const { getByText } = render(<SelectRecipeScreen />);
    // Date "2026-02-07" should render as a formatted date
    expect(getByText(/Feb/)).toBeTruthy();
  });

  it('fetches recipes with includeGlobal flag', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce(mockRecipes)
      .mockReturnValueOnce(undefined);

    render(<SelectRecipeScreen />);

    // First useQuery call is for recipes.list — should include global recipes
    const firstCall = (useQuery as jest.Mock).mock.calls[0];
    expect(firstCall[1]).toEqual({ includeGlobal: true });
  });

  it('displays all recipes when "All" filter is active', () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      date: '2026-02-07',
      mealType: 'all',
    });
    (useQuery as jest.Mock)
      .mockReturnValueOnce(mockRecipes)
      .mockReturnValueOnce(undefined);

    const { getByText } = render(<SelectRecipeScreen />);
    expect(getByText('Pancakes')).toBeTruthy();
    expect(getByText('Caesar Salad')).toBeTruthy();
    expect(getByText('Spaghetti Bolognese')).toBeTruthy();
  });

  it('shows correct recipe count', () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      date: '2026-02-07',
      mealType: 'all',
    });
    (useQuery as jest.Mock)
      .mockReturnValueOnce(mockRecipes)
      .mockReturnValueOnce(undefined);

    const { getByText } = render(<SelectRecipeScreen />);
    expect(getByText('3 recipes available')).toBeTruthy();
  });

  it('filters recipes by meal type tag', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce(mockRecipes)
      .mockReturnValueOnce(undefined);

    const { getByText, queryByText } = render(<SelectRecipeScreen />);
    // Active filter defaults to mealType param ('breakfast')
    expect(getByText('Pancakes')).toBeTruthy();
    expect(queryByText('Caesar Salad')).toBeNull();
    expect(queryByText('Spaghetti Bolognese')).toBeNull();
  });

  it('shows filter chips', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce(mockRecipes)
      .mockReturnValueOnce(undefined);

    const { getByText } = render(<SelectRecipeScreen />);
    expect(getByText('All')).toBeTruthy();
    expect(getByText('Breakfast')).toBeTruthy();
    expect(getByText('Lunch')).toBeTruthy();
    expect(getByText('Dinner')).toBeTruthy();
    expect(getByText('Snack')).toBeTruthy();
  });

  it('switches filter when chip is pressed', () => {
    // Use mockReturnValue so re-renders from state changes still get data
    (useQuery as jest.Mock).mockImplementation((queryRef: any, args: any) => {
      if (args === 'skip') return undefined;
      return mockRecipes;
    });

    const { getByText } = render(<SelectRecipeScreen />);

    // Press "All" filter to show all recipes
    fireEvent.press(getByText('All'));
    expect(getByText('Pancakes')).toBeTruthy();
    expect(getByText('Caesar Salad')).toBeTruthy();
    expect(getByText('Spaghetti Bolognese')).toBeTruthy();
  });

  it('displays recipe metadata (time, servings)', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce(mockRecipes)
      .mockReturnValueOnce(undefined);

    const { getByText } = render(<SelectRecipeScreen />);
    // Pancakes: 10 + 15 = 25 min
    expect(getByText('25 min')).toBeTruthy();
    expect(getByText('4 servings')).toBeTruthy();
  });

  it('calls addMeal mutation and navigates back on recipe select', async () => {
    mockAddMeal.mockResolvedValue(undefined);
    (useQuery as jest.Mock)
      .mockReturnValueOnce(mockRecipes)
      .mockReturnValueOnce(undefined);

    const { getByText } = render(<SelectRecipeScreen />);
    fireEvent.press(getByText('Pancakes'));

    await waitFor(() => {
      expect(mockAddMeal).toHaveBeenCalledWith({
        date: '2026-02-07',
        mealType: 'breakfast',
        recipeId: 'r1',
      });
      expect(router.back).toHaveBeenCalled();
    });
  });

  it('shows empty state when no recipes match filter', () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      date: '2026-02-07',
      mealType: 'snack',
    });
    (useQuery as jest.Mock)
      .mockReturnValueOnce(mockRecipes)
      .mockReturnValueOnce(undefined);

    const { getByText } = render(<SelectRecipeScreen />);
    expect(getByText('No recipes found')).toBeTruthy();
  });

  it('navigates back when close button is pressed', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce(mockRecipes)
      .mockReturnValueOnce(undefined);

    const { getByTestId } = render(<SelectRecipeScreen />);
    fireEvent.press(getByTestId('icon-close'));
    expect(router.back).toHaveBeenCalled();
  });

  it('adds recipe to correct slot even when filter is changed', async () => {
    // User clicked "Add meal" on dinner slot, but changes filter to show all recipes
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      date: '2026-02-07',
      mealType: 'dinner',
    });
    mockAddMeal.mockResolvedValue(undefined);
    (useQuery as jest.Mock).mockImplementation((queryRef: any, args: any) => {
      if (args === 'skip') return undefined;
      return mockRecipes;
    });

    const { getByText } = render(<SelectRecipeScreen />);

    // Change filter to "All" to see all recipes including breakfast
    fireEvent.press(getByText('All'));

    // Select a breakfast-tagged recipe (Pancakes)
    fireEvent.press(getByText('Pancakes'));

    await waitFor(() => {
      // Should still use mealType 'dinner' (the slot), not 'breakfast' (the recipe's tag)
      expect(mockAddMeal).toHaveBeenCalledWith({
        date: '2026-02-07',
        mealType: 'dinner',
        recipeId: 'r1',
      });
      expect(router.back).toHaveBeenCalled();
    });
  });

  it('shows global recipes alongside personal recipes', () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      date: '2026-02-07',
      mealType: 'all',
    });
    const recipesWithGlobal = [
      { _id: 'r1', title: 'My Recipe', tags: ['dinner'], servings: 2 },
      { _id: 'r2', title: 'Global Recipe', tags: ['dinner'], servings: 4, isGlobal: true },
    ];
    (useQuery as jest.Mock)
      .mockReturnValueOnce(recipesWithGlobal)
      .mockReturnValueOnce(undefined);

    const { getByText } = render(<SelectRecipeScreen />);
    expect(getByText('My Recipe')).toBeTruthy();
    expect(getByText('Global Recipe')).toBeTruthy();
  });
});
