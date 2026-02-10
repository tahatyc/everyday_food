import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { useQuery, useMutation } from 'convex/react';
import { router } from 'expo-router';
import MealPlanScreen from '../meal-plan';

const mockAddMeal = jest.fn();
const mockRemoveMeal = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (useMutation as jest.Mock)
    .mockReturnValueOnce(mockAddMeal)
    .mockReturnValueOnce(mockRemoveMeal);
});

describe('MealPlanScreen', () => {
  it('shows loading state when data is undefined', () => {
    (useQuery as jest.Mock).mockReturnValue(undefined);

    const { getByText } = render(<MealPlanScreen />);
    expect(getByText('Loading meal plan...')).toBeTruthy();
  });

  it('renders header with title', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce([]) // mealPlansData
      .mockReturnValueOnce([]); // allRecipes

    const { getByText } = render(<MealPlanScreen />);
    expect(getByText('WEEKLY PLANNER')).toBeTruthy();
  });

  it('renders day selector with 7 days', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce([])
      .mockReturnValueOnce([]);

    const { getByText } = render(<MealPlanScreen />);

    // Current day should be visible
    const today = new Date();
    expect(getByText(today.getDate().toString())).toBeTruthy();
  });

  it('renders meal sections for breakfast, lunch, and dinner', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce([])
      .mockReturnValueOnce([]);

    const { getByText } = render(<MealPlanScreen />);
    expect(getByText('BREAKFAST')).toBeTruthy();
    expect(getByText('LUNCH')).toBeTruthy();
    expect(getByText('DINNER')).toBeTruthy();
  });

  it('shows empty meal card with "Add a meal" text', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce([])
      .mockReturnValueOnce([]);

    const { getAllByText } = render(<MealPlanScreen />);
    const addMealTexts = getAllByText('Add a meal');
    expect(addMealTexts.length).toBe(3);
  });

  it('renders generate random plan button', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce([])
      .mockReturnValueOnce([]);

    const { getByText } = render(<MealPlanScreen />);
    expect(getByText('GENERATE RANDOM PLAN')).toBeTruthy();
  });

  it('renders grocery list link', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce([])
      .mockReturnValueOnce([]);

    const { getByText } = render(<MealPlanScreen />);
    expect(getByText('GROCERY LIST')).toBeTruthy();
    expect(getByText('View items for this week')).toBeTruthy();
  });

  it('navigates to grocery list when pressed', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce([])
      .mockReturnValueOnce([]);

    const { getByText } = render(<MealPlanScreen />);
    fireEvent.press(getByText('GROCERY LIST'));
    expect(router.push).toHaveBeenCalledWith('/grocery-list');
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
    (useQuery as jest.Mock)
      .mockReturnValueOnce(mockMealPlans)
      .mockReturnValueOnce([]);

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
    (useQuery as jest.Mock)
      .mockReturnValueOnce(mockMealPlans)
      .mockReturnValueOnce([]);

    const { getByText } = render(<MealPlanScreen />);
    expect(getByText('CHANGE')).toBeTruthy();
  });

  it('navigates to select-recipe when adding a meal', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce([])
      .mockReturnValueOnce([]);

    const { getAllByText } = render(<MealPlanScreen />);
    const addButtons = getAllByText('Add a meal');
    fireEvent.press(addButtons[0]); // Breakfast slot

    expect(router.push).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/select-recipe',
      })
    );
  });

  it('navigates back when back button is pressed', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce([])
      .mockReturnValueOnce([]);

    const { getByTestId } = render(<MealPlanScreen />);
    fireEvent.press(getByTestId('icon-arrow-back'));
    expect(router.back).toHaveBeenCalled();
  });

  it('fetches recipes with includeGlobal flag', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce([])
      .mockReturnValueOnce([]);

    render(<MealPlanScreen />);

    // Third useQuery call is for recipes.list — should include global recipes
    const calls = (useQuery as jest.Mock).mock.calls;
    const recipesListCall = calls[2];
    expect(recipesListCall[1]).toEqual({ includeGlobal: true });
  });

  it('navigates to select-recipe with date and mealType params', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce([])
      .mockReturnValueOnce([]);

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
    (useQuery as jest.Mock)
      .mockReturnValueOnce([])
      .mockReturnValueOnce([]);

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
    (useQuery as jest.Mock)
      .mockReturnValueOnce([])
      .mockReturnValueOnce([]);

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
    (useQuery as jest.Mock)
      .mockReturnValueOnce(mockMealPlans)
      .mockReturnValueOnce([]);

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
    (useQuery as jest.Mock)
      .mockReturnValueOnce(mockMealPlans)
      .mockReturnValueOnce([]);

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
    (useQuery as jest.Mock)
      .mockReturnValueOnce(mockMealPlans)
      .mockReturnValueOnce([]);

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
    (useQuery as jest.Mock)
      .mockReturnValueOnce(mockMealPlans)
      .mockReturnValueOnce([]);

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
    (useQuery as jest.Mock)
      .mockReturnValueOnce(mockMealPlans)
      .mockReturnValueOnce([]);

    const { getByText } = render(<MealPlanScreen />);
    // No meal type tag, so falls back to lunch slot emoji
    expect(getByText('🥗')).toBeTruthy();
  });
});
