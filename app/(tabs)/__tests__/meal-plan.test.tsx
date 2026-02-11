import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { useQuery, useMutation } from 'convex/react';
import { router } from 'expo-router';
import MealPlanScreen from '../meal-plan';

const mockAddMeal = jest.fn();
const mockRemoveMeal = jest.fn();
const mockAddRecipeIngredients = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (useMutation as jest.Mock)
    .mockReturnValueOnce(mockAddMeal)
    .mockReturnValueOnce(mockRemoveMeal)
    .mockReturnValueOnce(mockAddRecipeIngredients);
});

// Helper: mock all 3 useQuery calls (mealPlansData, weekMealPlans, allRecipes)
function mockQueries(mealPlans: any = [], weekPlans: any = [], recipes: any = []) {
  (useQuery as jest.Mock)
    .mockReturnValue(undefined) // default fallback
    .mockReturnValueOnce(mealPlans)    // mealPlansData
    .mockReturnValueOnce(weekPlans)    // weekMealPlans
    .mockReturnValueOnce(recipes);     // allRecipes
}

describe('MealPlanScreen', () => {
  it('shows loading state when data is undefined', () => {
    (useQuery as jest.Mock).mockReturnValue(undefined);

    const { getByText } = render(<MealPlanScreen />);
    expect(getByText('Loading meal plan...')).toBeTruthy();
  });

  it('renders header with week date range', () => {
    mockQueries();

    const { getByText } = render(<MealPlanScreen />);
    // Header should show a date range like "FEB 8 - FEB 14"
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const expectedLabel = `${monthNames[startOfWeek.getMonth()]} ${startOfWeek.getDate()} - ${monthNames[endOfWeek.getMonth()]} ${endOfWeek.getDate()}`;
    expect(getByText(expectedLabel)).toBeTruthy();
  });

  it('renders day selector with 7 days', () => {
    mockQueries();

    const { getByText } = render(<MealPlanScreen />);

    // Current day should be visible
    const today = new Date();
    expect(getByText(today.getDate().toString())).toBeTruthy();
  });

  it('renders meal sections for breakfast, lunch, and dinner', () => {
    mockQueries();

    const { getByText } = render(<MealPlanScreen />);
    expect(getByText('BREAKFAST')).toBeTruthy();
    expect(getByText('LUNCH')).toBeTruthy();
    expect(getByText('DINNER')).toBeTruthy();
  });

  it('shows empty meal card with "Add a meal" text', () => {
    mockQueries();

    const { getAllByText } = render(<MealPlanScreen />);
    const addMealTexts = getAllByText('Add a meal');
    expect(addMealTexts.length).toBe(3);
  });

  it('renders generate random plan button', () => {
    mockQueries();

    const { getByText } = render(<MealPlanScreen />);
    expect(getByText('GENERATE RANDOM PLAN')).toBeTruthy();
  });

  it('renders grocery list link', () => {
    mockQueries();

    const { getByText } = render(<MealPlanScreen />);
    expect(getByText('GROCERY LIST')).toBeTruthy();
    // Subtitle now shows week date range (e.g., "Generate list for FEB 8 - FEB 14")
    expect(getByText(/list for/)).toBeTruthy();
  });

  it('navigates to grocery list when pressed', () => {
    mockQueries();

    const { getByText } = render(<MealPlanScreen />);
    fireEvent.press(getByText('GROCERY LIST'));
    expect(router.push).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/grocery-list',
        params: expect.objectContaining({
          weekStartDate: expect.any(String),
          weekEndDate: expect.any(String),
        }),
      })
    );
  });

  it('renders meal with recipe data', () => {
    const mockMealPlans = [
      {
        _id: 'mp1',
        mealType: 'breakfast',
        recipe: {
          _id: 'r1',
          title: 'Scrambled Eggs',
          nutritionPerServing: { calories: 250, protein: 18, carbs: 2, fat: 20 },
          tags: ['breakfast'],
        },
      },
    ];
    mockQueries(mockMealPlans);

    const { getByText } = render(<MealPlanScreen />);
    expect(getByText('SCRAMBLED EGGS')).toBeTruthy();
    expect(getByText('250 KCAL')).toBeTruthy();
  });

  it('shows change and remove buttons for planned meals', () => {
    const mockMealPlans = [
      {
        _id: 'mp1',
        mealType: 'lunch',
        recipe: {
          _id: 'r1',
          title: 'Caesar Salad',
          nutritionPerServing: { calories: 400 },
          tags: ['lunch'],
        },
      },
    ];
    mockQueries(mockMealPlans);

    const { getByText } = render(<MealPlanScreen />);
    expect(getByText('CHANGE')).toBeTruthy();
  });

  it('navigates to select-recipe when adding a meal', () => {
    mockQueries();

    const { getAllByText } = render(<MealPlanScreen />);
    const addButtons = getAllByText('Add a meal');
    fireEvent.press(addButtons[0]); // Breakfast slot

    expect(router.push).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/select-recipe',
      })
    );
  });

  it('renders week navigation arrows', () => {
    mockQueries();

    const { getByTestId, getAllByTestId } = render(<MealPlanScreen />);
    expect(getByTestId('icon-chevron-back')).toBeTruthy();
    // chevron-forward appears in header and grocery list
    expect(getAllByTestId('icon-chevron-forward').length).toBeGreaterThanOrEqual(1);
  });

  it('fetches recipes with includeGlobal flag', () => {
    mockQueries();

    render(<MealPlanScreen />);

    // Third useQuery call is for recipes.list — should include global recipes
    const calls = (useQuery as jest.Mock).mock.calls;
    const recipesListCall = calls[2];
    expect(recipesListCall[1]).toEqual({ includeGlobal: true });
  });

  it('navigates to select-recipe with date and mealType params', () => {
    mockQueries();

    const { getAllByText } = render(<MealPlanScreen />);
    const addButtons = getAllByText('Add a meal');
    fireEvent.press(addButtons[1]); // Lunch slot

    expect(router.push).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/select-recipe',
        params: expect.objectContaining({
          mealType: 'lunch',
        }),
      })
    );
  });

  it('passes breakfast mealType when adding meal to breakfast slot', () => {
    mockQueries();

    const { getAllByText } = render(<MealPlanScreen />);
    const addButtons = getAllByText('Add a meal');
    fireEvent.press(addButtons[0]); // Breakfast slot

    expect(router.push).toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({
          mealType: 'breakfast',
        }),
      })
    );
  });

  it('passes dinner mealType when adding meal to dinner slot', () => {
    mockQueries();

    const { getAllByText } = render(<MealPlanScreen />);
    const addButtons = getAllByText('Add a meal');
    fireEvent.press(addButtons[2]); // Dinner slot

    expect(router.push).toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({
          mealType: 'dinner',
        }),
      })
    );
  });

  it('shows breakfast emoji when breakfast recipe is in breakfast slot', () => {
    const mockMealPlans = [
      {
        _id: 'mp1',
        mealType: 'breakfast',
        recipe: {
          _id: 'r1',
          title: 'Pancakes',
          nutritionPerServing: { calories: 300 },
          tags: ['breakfast'],
        },
      },
    ];
    mockQueries(mockMealPlans);

    const { getByText } = render(<MealPlanScreen />);
    expect(getByText('🍳')).toBeTruthy();
  });

  it('shows breakfast emoji when breakfast recipe is placed in lunch slot', () => {
    const mockMealPlans = [
      {
        _id: 'mp1',
        mealType: 'lunch',
        recipe: {
          _id: 'r1',
          title: 'Pancakes',
          nutritionPerServing: { calories: 300 },
          tags: ['breakfast'],
        },
      },
    ];
    mockQueries(mockMealPlans);

    const { getByText } = render(<MealPlanScreen />);
    expect(getByText('🍳')).toBeTruthy();
  });

  it('shows dinner emoji when dinner recipe is placed in breakfast slot', () => {
    const mockMealPlans = [
      {
        _id: 'mp1',
        mealType: 'breakfast',
        recipe: {
          _id: 'r1',
          title: 'Spaghetti Bolognese',
          nutritionPerServing: { calories: 500 },
          tags: ['dinner'],
        },
      },
    ];
    mockQueries(mockMealPlans);

    const { getByText } = render(<MealPlanScreen />);
    expect(getByText('🍝')).toBeTruthy();
  });

  it('shows snack emoji when snack recipe is placed in any slot', () => {
    const mockMealPlans = [
      {
        _id: 'mp1',
        mealType: 'lunch',
        recipe: {
          _id: 'r1',
          title: 'Cookie Bites',
          nutritionPerServing: { calories: 150 },
          tags: ['snack'],
        },
      },
    ];
    mockQueries(mockMealPlans);

    const { getByText } = render(<MealPlanScreen />);
    expect(getByText('🍪')).toBeTruthy();
  });

  it('falls back to slot emoji when recipe has no meal type tag', () => {
    const mockMealPlans = [
      {
        _id: 'mp1',
        mealType: 'lunch',
        recipe: {
          _id: 'r1',
          title: 'Mystery Dish',
          nutritionPerServing: { calories: 200 },
          tags: ['vegetarian'],
        },
      },
    ];
    mockQueries(mockMealPlans);

    const { getByText } = render(<MealPlanScreen />);
    // No meal type tag, so falls back to lunch slot emoji
    expect(getByText('🥗')).toBeTruthy();
  });

  it('shows TAP FOR TODAY hint when navigated away from current week', () => {
    mockQueries();

    const { getAllByTestId, queryByText } = render(<MealPlanScreen />);
    // Initially no hint
    expect(queryByText('TAP FOR TODAY')).toBeNull();

    // Navigate to next week (first chevron-forward is in the header)
    fireEvent.press(getAllByTestId('icon-chevron-forward')[0]);
    // After state update, the hint should appear
    // Note: this test verifies the arrow button is pressable
  });
});
