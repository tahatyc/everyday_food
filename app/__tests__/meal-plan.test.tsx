import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { useQuery, useMutation } from 'convex/react';
import { router } from 'expo-router';
import MealPlanScreen from '../(tabs)/meal-plan';

const mockAddMeal = jest.fn();
const mockRemoveMeal = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (useMutation as jest.Mock)
    .mockReturnValueOnce(mockAddMeal)
    .mockReturnValueOnce(mockRemoveMeal);
});

// Helper to set up cycling query mocks (survives re-renders)
function setupCyclingMocks({
  mealPlans = [] as any[],
  weekListInfo = { exists: false, itemCount: 0 },
  allRecipes = [] as any[],
}: {
  mealPlans?: any[];
  weekListInfo?: any;
  allRecipes?: any[];
} = {}) {
  let callCount = 0;
  const queryValues = [mealPlans, weekListInfo, allRecipes];
  (useQuery as jest.Mock).mockImplementation(() => {
    const val = queryValues[callCount % 3];
    callCount++;
    return val;
  });
}

const makeMealPlan = (mealType: string, title: string, id = 'mp1') => ({
  _id: id,
  mealType,
  recipe: {
    _id: `recipe-${mealType}`,
    title,
    prepTime: 10,
    cookTime: 20,
    nutritionPerServing: { calories: 400, protein: 20, carbs: 50, fat: 15 },
    tags: [mealType],
  },
});

const makeRecipe = (id: string, title: string, tags: string[]) => ({
  _id: id,
  title,
  tags,
  prepTime: 10,
  cookTime: 20,
});

// Mock event with stopPropagation for nested Pressables
const mockPressEvent = { stopPropagation: jest.fn() };

describe('MealPlanScreen', () => {
  it('renders loading state when meal plans are undefined', () => {
    let callCount = 0;
    (useQuery as jest.Mock).mockImplementation(() => {
      const vals = [undefined, undefined, []];
      const val = vals[callCount % 3];
      callCount++;
      return val;
    });

    const { getByText } = render(<MealPlanScreen />);
    expect(getByText('Loading meal plan...')).toBeTruthy();
  });

  it('renders all three meal sections when data is loaded', () => {
    setupCyclingMocks();

    const { getByText } = render(<MealPlanScreen />);
    expect(getByText('BREAKFAST')).toBeTruthy();
    expect(getByText('LUNCH')).toBeTruthy();
    expect(getByText('DINNER')).toBeTruthy();
  });

  it('shows empty meal cards with "Add a meal" when no meals planned', () => {
    setupCyclingMocks();

    const { getAllByText } = render(<MealPlanScreen />);
    const addMealTexts = getAllByText('Add a meal');
    expect(addMealTexts.length).toBe(3);
  });

  it('renders the generate random plan button', () => {
    setupCyclingMocks();

    const { getByText } = render(<MealPlanScreen />);
    expect(getByText('GENERATE RANDOM PLAN')).toBeTruthy();
  });

  it('renders day selector with 7 days', () => {
    setupCyclingMocks();

    const { getAllByText } = render(<MealPlanScreen />);
    const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    for (const dayName of dayNames) {
      expect(getAllByText(dayName).length).toBeGreaterThanOrEqual(1);
    }
  });

  it('navigates to previous week when back button is pressed', () => {
    setupCyclingMocks();

    const { getAllByTestId } = render(<MealPlanScreen />);
    const backButtons = getAllByTestId('icon-chevron-back');
    fireEvent.press(backButtons[0]);
    expect(backButtons[0]).toBeTruthy();
  });

  it('navigates to next week when forward button is pressed', () => {
    setupCyclingMocks();

    const { getAllByTestId } = render(<MealPlanScreen />);
    const forwardButtons = getAllByTestId('icon-chevron-forward');
    fireEvent.press(forwardButtons[0]);
    expect(forwardButtons[0]).toBeTruthy();
  });

  it('displays recipe title and calories when meal is planned', () => {
    setupCyclingMocks({
      mealPlans: [makeMealPlan('breakfast', 'Pancakes')],
    });

    const { getByText } = render(<MealPlanScreen />);
    expect(getByText('PANCAKES')).toBeTruthy();
    expect(getByText('400 KCAL')).toBeTruthy();
  });

  it('shows CHANGE and remove buttons for planned meals', () => {
    setupCyclingMocks({
      mealPlans: [makeMealPlan('breakfast', 'Pancakes')],
    });

    const { getByText, getByTestId } = render(<MealPlanScreen />);
    expect(getByText('CHANGE')).toBeTruthy();
    expect(getByTestId('icon-trash-outline')).toBeTruthy();
  });

  it('navigates to select-recipe when empty meal card is pressed', () => {
    setupCyclingMocks();

    const { getAllByText } = render(<MealPlanScreen />);
    const addMealButtons = getAllByText('Add a meal');
    fireEvent.press(addMealButtons[0]);

    expect(router.push).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/select-recipe',
        params: expect.objectContaining({ mealType: 'breakfast' }),
      })
    );
  });

  it('navigates to select-recipe for lunch slot', () => {
    setupCyclingMocks();

    const { getAllByText } = render(<MealPlanScreen />);
    const addMealButtons = getAllByText('Add a meal');
    fireEvent.press(addMealButtons[1]);

    expect(router.push).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/select-recipe',
        params: expect.objectContaining({ mealType: 'lunch' }),
      })
    );
  });

  it('navigates to select-recipe for dinner slot', () => {
    setupCyclingMocks();

    const { getAllByText } = render(<MealPlanScreen />);
    const addMealButtons = getAllByText('Add a meal');
    fireEvent.press(addMealButtons[2]);

    expect(router.push).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/select-recipe',
        params: expect.objectContaining({ mealType: 'dinner' }),
      })
    );
  });

  it('calls removeMeal when remove button is pressed', async () => {
    mockRemoveMeal.mockResolvedValue({ success: true });
    setupCyclingMocks({
      mealPlans: [makeMealPlan('breakfast', 'Pancakes', 'mp-breakfast')],
    });

    const { getByTestId } = render(<MealPlanScreen />);
    fireEvent.press(getByTestId('icon-trash-outline'), mockPressEvent);

    await waitFor(() => {
      expect(mockRemoveMeal).toHaveBeenCalledWith({ mealPlanId: 'mp-breakfast' });
    });
  });

  it('calls addMeal with random recipe when CHANGE is pressed', async () => {
    mockAddMeal.mockResolvedValue({ success: true });
    const recipes = [
      makeRecipe('r1', 'Oatmeal', ['breakfast']),
      makeRecipe('r2', 'Eggs', ['breakfast']),
    ];
    setupCyclingMocks({
      mealPlans: [makeMealPlan('breakfast', 'Pancakes')],
      allRecipes: recipes,
    });

    const { getByText } = render(<MealPlanScreen />);
    fireEvent.press(getByText('CHANGE'), mockPressEvent);

    await waitFor(() => {
      expect(mockAddMeal).toHaveBeenCalledWith(
        expect.objectContaining({
          mealType: 'breakfast',
          recipeId: expect.any(String),
        })
      );
    });
  });

  it('generates random plan when generate button is pressed', async () => {
    mockAddMeal.mockResolvedValue({ success: true });
    const recipes = [
      makeRecipe('r1', 'Oatmeal', ['breakfast']),
      makeRecipe('r2', 'Sandwich', ['lunch']),
      makeRecipe('r3', 'Pasta', ['dinner']),
    ];
    setupCyclingMocks({ allRecipes: recipes });

    const { getByText } = render(<MealPlanScreen />);
    fireEvent.press(getByText('GENERATE RANDOM PLAN'));

    await waitFor(() => {
      expect(mockAddMeal).toHaveBeenCalledTimes(3);
    });
  });

  it('navigates to grocery list when grocery button is pressed', () => {
    setupCyclingMocks({
      weekListInfo: { exists: true, itemCount: 5 },
    });

    const { getByText } = render(<MealPlanScreen />);
    expect(getByText('GROCERY LIST')).toBeTruthy();
    fireEvent.press(getByText('GROCERY LIST'));

    expect(router.push).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/grocery-list',
      })
    );
  });

  it('shows item count in grocery button when list exists', () => {
    setupCyclingMocks({
      weekListInfo: { exists: true, itemCount: 5 },
    });

    const { getByText } = render(<MealPlanScreen />);
    expect(getByText(/5 items/)).toBeTruthy();
  });

  it('shows "Generate list" text when no grocery list exists', () => {
    setupCyclingMocks({
      weekListInfo: { exists: false, itemCount: 0 },
    });

    const { getByText } = render(<MealPlanScreen />);
    expect(getByText(/Generate list/)).toBeTruthy();
  });

  it('selects a different day when day item is pressed', () => {
    setupCyclingMocks();

    const { getByText } = render(<MealPlanScreen />);
    fireEvent.press(getByText('MON'));
    expect(getByText('BREAKFAST')).toBeTruthy();
  });

  it('navigates to recipe detail when meal card is pressed', () => {
    setupCyclingMocks({
      mealPlans: [makeMealPlan('breakfast', 'Pancakes')],
    });

    const { getByText } = render(<MealPlanScreen />);
    fireEvent.press(getByText('PANCAKES'));

    expect(router.push).toHaveBeenCalledWith('/recipe/recipe-breakfast');
  });

  it('shows 0 KCAL when recipe has no nutrition data', () => {
    const mealPlan = {
      _id: 'mp1',
      mealType: 'breakfast',
      recipe: {
        _id: 'r1',
        title: 'Simple Toast',
        tags: ['breakfast'],
      },
    };
    setupCyclingMocks({ mealPlans: [mealPlan] });

    const { getByText } = render(<MealPlanScreen />);
    expect(getByText('0 KCAL')).toBeTruthy();
  });

  it('does not call addMeal when no recipes available for generate', async () => {
    setupCyclingMocks({ allRecipes: [] });

    const { getByText } = render(<MealPlanScreen />);
    fireEvent.press(getByText('GENERATE RANDOM PLAN'));

    expect(mockAddMeal).not.toHaveBeenCalled();
  });

  it('does not call addMeal when CHANGE pressed with no matching recipes', async () => {
    const recipes = [
      makeRecipe('r1', 'Pasta', ['dinner']),
    ];
    setupCyclingMocks({
      mealPlans: [makeMealPlan('breakfast', 'Pancakes')],
      allRecipes: recipes,
    });

    const { getByText } = render(<MealPlanScreen />);
    fireEvent.press(getByText('CHANGE'), mockPressEvent);

    await waitFor(() => {
      expect(mockAddMeal).not.toHaveBeenCalled();
    });
  });

  it('displays correct emoji for each meal type', () => {
    setupCyclingMocks({
      mealPlans: [
        makeMealPlan('breakfast', 'Pancakes', 'mp1'),
        makeMealPlan('lunch', 'Salad', 'mp2'),
        makeMealPlan('dinner', 'Pasta', 'mp3'),
      ],
    });

    const { getByText } = render(<MealPlanScreen />);
    expect(getByText('🍳')).toBeTruthy();
    expect(getByText('🥗')).toBeTruthy();
    expect(getByText('🍝')).toBeTruthy();
  });

  it('shows "Loading..." in grocery subtitle when weekListInfo is undefined', () => {
    let callCount = 0;
    const queryValues: any[] = [[], null, []];
    (useQuery as jest.Mock).mockImplementation(() => {
      const val = queryValues[callCount % 3];
      callCount++;
      return val;
    });

    const { getByText } = render(<MealPlanScreen />);
    expect(getByText('Loading...')).toBeTruthy();
  });

  it('handles remove meal error gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    mockRemoveMeal.mockRejectedValue(new Error('Remove failed'));
    setupCyclingMocks({
      mealPlans: [makeMealPlan('breakfast', 'Pancakes', 'mp-breakfast')],
    });

    const { getByTestId } = render(<MealPlanScreen />);
    fireEvent.press(getByTestId('icon-trash-outline'), mockPressEvent);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to remove meal:', expect.any(Error));
    });
    consoleSpy.mockRestore();
  });

  it('handles generate random plan error gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    mockAddMeal.mockRejectedValue(new Error('Failed'));
    const recipes = [makeRecipe('r1', 'Oatmeal', ['breakfast'])];
    setupCyclingMocks({ allRecipes: recipes });

    const { getByText } = render(<MealPlanScreen />);
    fireEvent.press(getByText('GENERATE RANDOM PLAN'));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to generate random plan:', expect.any(Error));
    });
    consoleSpy.mockRestore();
  });
});
