import React from 'react';
import { render, fireEvent, waitFor, within } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { router } from 'expo-router';
import MealPlanScreen from '../(tabs)/meal-plan';

const mockAddMeal = jest.fn();
const mockRemoveMeal = jest.fn();
const mockChangeMeal = jest.fn();
const mockUpdateServings = jest.fn();

// Mock useToast
const mockShowError = jest.fn();
const mockShowSuccess = jest.fn();
jest.mock('../../src/hooks/useToast', () => ({
  useToast: () => ({
    showError: mockShowError,
    showSuccess: mockShowSuccess,
    showWarning: jest.fn(),
    showInfo: jest.fn(),
    showToast: jest.fn(),
  }),
}));

// Spy on Alert.alert for long-press context menu tests
const alertSpy = jest.spyOn(Alert, 'alert');

beforeEach(() => {
  jest.clearAllMocks();
  mockShowError.mockReset();
  mockShowSuccess.mockReset();
  (useMutation as jest.Mock)
    .mockReturnValueOnce(mockAddMeal)
    .mockReturnValueOnce(mockRemoveMeal)
    .mockReturnValueOnce(mockChangeMeal)
    .mockReturnValueOnce(mockUpdateServings);
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

const makeMealPlan = (mealType: string, title: string, id = 'mp1', servings = 2) => ({
  _id: id,
  mealType,
  servings,
  recipe: {
    _id: `recipe-${mealType}`,
    title,
    prepTime: 10,
    cookTime: 20,
    servings,
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

  it('shows long-press context menu with meal options', () => {
    setupCyclingMocks({
      mealPlans: [makeMealPlan('breakfast', 'Pancakes')],
    });

    const { getByText } = render(<MealPlanScreen />);
    fireEvent(getByText('PANCAKES'), 'onLongPress');

    expect(alertSpy).toHaveBeenCalledWith(
      'Meal Options',
      'Pancakes',
      expect.arrayContaining([
        expect.objectContaining({ text: 'View Recipe' }),
        expect.objectContaining({ text: 'Change Meal' }),
        expect.objectContaining({ text: 'Adjust Servings' }),
        expect.objectContaining({ text: 'Remove', style: 'destructive' }),
        expect.objectContaining({ text: 'Cancel', style: 'cancel' }),
      ])
    );
  });

  it('calls removeMeal via long-press Remove option', async () => {
    mockRemoveMeal.mockResolvedValue({ success: true });
    setupCyclingMocks({
      mealPlans: [makeMealPlan('breakfast', 'Pancakes', 'mp-breakfast')],
    });

    const { getByText } = render(<MealPlanScreen />);
    fireEvent(getByText('PANCAKES'), 'onLongPress');

    // Find and press the "Remove" option from Alert
    const alertOptions = alertSpy.mock.calls[0][2] as any[];
    const removeOption = alertOptions.find((o: any) => o.text === 'Remove');
    removeOption.onPress();

    await waitFor(() => {
      expect(mockRemoveMeal).toHaveBeenCalledWith({ mealPlanId: 'mp-breakfast' });
    });
  });

  it('calls changeMeal via long-press Change Meal option', async () => {
    mockChangeMeal.mockResolvedValue({ success: true });
    const recipes = [
      makeRecipe('r1', 'Oatmeal', ['breakfast']),
      makeRecipe('r2', 'Eggs', ['breakfast']),
    ];
    setupCyclingMocks({
      mealPlans: [makeMealPlan('breakfast', 'Pancakes')],
      allRecipes: recipes,
    });

    const { getByText } = render(<MealPlanScreen />);
    fireEvent(getByText('PANCAKES'), 'onLongPress');

    const alertOptions = alertSpy.mock.calls[0][2] as any[];
    const changeOption = alertOptions.find((o: any) => o.text === 'Change Meal');
    changeOption.onPress();

    await waitFor(() => {
      expect(mockChangeMeal).toHaveBeenCalledWith(
        expect.objectContaining({
          mealPlanId: 'mp1',
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

    expect(router.push).toHaveBeenCalledWith('/recipe/recipe-breakfast?servings=2&fromMealPlan=1');
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

  it('does not call changeMeal via long-press when no matching recipes', async () => {
    const recipes = [
      makeRecipe('r1', 'Pasta', ['dinner']),
    ];
    setupCyclingMocks({
      mealPlans: [makeMealPlan('breakfast', 'Pancakes')],
      allRecipes: recipes,
    });

    const { getByText } = render(<MealPlanScreen />);
    fireEvent(getByText('PANCAKES'), 'onLongPress');

    const alertOptions = alertSpy.mock.calls[0][2] as any[];
    const changeOption = alertOptions.find((o: any) => o.text === 'Change Meal');
    changeOption.onPress();

    await waitFor(() => {
      expect(mockChangeMeal).not.toHaveBeenCalled();
    });
  });

  it('shows error toast when change pressed but no alternative recipes exist', async () => {
    const recipes = [
      makeRecipe('recipe-breakfast', 'Pancakes', ['breakfast']),
    ];
    setupCyclingMocks({
      mealPlans: [makeMealPlan('breakfast', 'Pancakes')],
      allRecipes: recipes,
    });

    const { getByText } = render(<MealPlanScreen />);
    fireEvent(getByText('PANCAKES'), 'onLongPress');

    const alertOptions = alertSpy.mock.calls[0][2] as any[];
    const changeOption = alertOptions.find((o: any) => o.text === 'Change Meal');
    changeOption.onPress();

    await waitFor(() => {
      expect(mockChangeMeal).not.toHaveBeenCalled();
      expect(mockShowError).toHaveBeenCalledWith('No other breakfast recipes available to swap.');
    });
  });

  it('calls changeMeal when allRecipes also contains the current recipe alongside alternatives', async () => {
    mockChangeMeal.mockResolvedValue({ success: true });
    const recipes = [
      makeRecipe('recipe-breakfast', 'Pancakes', ['breakfast']),
      makeRecipe('r-alt', 'Oatmeal', ['breakfast']),
    ];
    setupCyclingMocks({
      mealPlans: [makeMealPlan('breakfast', 'Pancakes')],
      allRecipes: recipes,
    });

    const { getByText } = render(<MealPlanScreen />);
    fireEvent(getByText('PANCAKES'), 'onLongPress');

    const alertOptions = alertSpy.mock.calls[0][2] as any[];
    const changeOption = alertOptions.find((o: any) => o.text === 'Change Meal');
    changeOption.onPress();

    await waitFor(() => {
      expect(mockChangeMeal).toHaveBeenCalledWith(
        expect.objectContaining({
          mealPlanId: 'mp1',
          recipeId: 'r-alt',
        })
      );
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

  it('handles remove meal error gracefully via long-press', async () => {
    mockRemoveMeal.mockRejectedValue(new Error('Remove failed'));
    setupCyclingMocks({
      mealPlans: [makeMealPlan('breakfast', 'Pancakes', 'mp-breakfast')],
    });

    const { getByText } = render(<MealPlanScreen />);
    fireEvent(getByText('PANCAKES'), 'onLongPress');

    const alertOptions = alertSpy.mock.calls[0][2] as any[];
    const removeOption = alertOptions.find((o: any) => o.text === 'Remove');
    removeOption.onPress();

    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith('Failed to remove meal. Please try again.');
    });
  });

  it('shows no toast when all generate random plan slots fail silently', async () => {
    mockAddMeal.mockRejectedValue(new Error('Failed'));
    const recipes = [makeRecipe('r1', 'Oatmeal', ['breakfast'])];
    setupCyclingMocks({ allRecipes: recipes });

    const { getByText } = render(<MealPlanScreen />);
    fireEvent.press(getByText('GENERATE RANDOM PLAN'));

    await waitFor(() => {
      expect(mockShowSuccess).not.toHaveBeenCalled();
    });
    expect(mockShowError).not.toHaveBeenCalled();
  });

  // --- Daily Nutrition Summary ---

  it('shows daily nutrition summary when meals are planned', () => {
    setupCyclingMocks({
      mealPlans: [makeMealPlan('breakfast', 'Pancakes', 'mp1', 2)],
    });

    const { getByText } = render(<MealPlanScreen />);
    // 400 cal * 2 servings = 800 KCAL total
    expect(getByText('800')).toBeTruthy();
    expect(getByText('KCAL')).toBeTruthy();
    expect(getByText('PROTEIN')).toBeTruthy();
    expect(getByText('CARBS')).toBeTruthy();
  });

  it('does not show daily nutrition summary when no meals planned', () => {
    setupCyclingMocks();

    const { queryByText } = render(<MealPlanScreen />);
    expect(queryByText('PROTEIN')).toBeNull();
  });

  // --- Section header + button ---

  it('shows section header with just meal type label (no calorie total)', () => {
    setupCyclingMocks({
      mealPlans: [makeMealPlan('breakfast', 'Pancakes')],
    });

    const { getByText, queryByText } = render(<MealPlanScreen />);
    expect(getByText('BREAKFAST')).toBeTruthy();
    // Calorie total is no longer in the section header
    expect(queryByText('BREAKFAST — 400 KCAL')).toBeNull();
  });

  it('shows + button in section header when slot has fewer than 3 meals', () => {
    setupCyclingMocks({
      mealPlans: [makeMealPlan('breakfast', 'Pancakes')],
    });

    const { getAllByTestId } = render(<MealPlanScreen />);
    // + icon buttons in section headers (one per section that can add)
    const addIcons = getAllByTestId('icon-add');
    expect(addIcons.length).toBeGreaterThanOrEqual(3); // all 3 sections have < 3 meals
  });

  it('hides + button in section header when slot has 3 meals', () => {
    setupCyclingMocks({
      mealPlans: [
        makeMealPlan('breakfast', 'Meal 1', 'mp1'),
        { _id: 'mp2', mealType: 'breakfast', recipe: { _id: 'r2', title: 'Meal 2', tags: ['breakfast'], prepTime: 10, cookTime: 20, nutritionPerServing: { calories: 300, protein: 10, carbs: 20, fat: 10 } } },
        { _id: 'mp3', mealType: 'breakfast', recipe: { _id: 'r3', title: 'Meal 3', tags: ['breakfast'], prepTime: 10, cookTime: 20, nutritionPerServing: { calories: 350, protein: 12, carbs: 22, fat: 12 } } },
      ],
    });

    const { getAllByTestId } = render(<MealPlanScreen />);
    // When breakfast has 3 meals, only lunch and dinner headers + empty states show add icons
    // Empty state has an "add" icon too, so we check there are fewer add icons
    const addIcons = getAllByTestId('icon-add');
    // lunch empty (1 icon in header + 1 in empty card) + dinner empty (1 + 1) = 4
    // breakfast has NO header add icon = 0
    expect(addIcons.length).toBe(4);
  });

  // --- Servings ---

  it('displays servings badge on meal card', () => {
    setupCyclingMocks({
      mealPlans: [makeMealPlan('breakfast', 'Pancakes', 'mp1', 2)],
    });

    const { getByText } = render(<MealPlanScreen />);
    expect(getByText('2 SERVINGS')).toBeTruthy();
  });

  it('shows singular SERVING when servings is 1', () => {
    setupCyclingMocks({
      mealPlans: [makeMealPlan('breakfast', 'Pancakes', 'mp1', 1)],
    });

    const { getByText } = render(<MealPlanScreen />);
    expect(getByText('1 SERVING')).toBeTruthy();
  });

  it('opens servings bottom sheet when badge is tapped', () => {
    setupCyclingMocks({
      mealPlans: [makeMealPlan('breakfast', 'Pancakes', 'mp1', 2)],
    });

    const { getByText } = render(<MealPlanScreen />);
    fireEvent.press(getByText('2 SERVINGS'), mockPressEvent);

    expect(getByText('ADJUST SERVINGS')).toBeTruthy();
    expect(getByText('This will update your grocery list quantities')).toBeTruthy();
  });

  it('calls updateServings when SAVE is pressed in bottom sheet with changed value', async () => {
    mockUpdateServings.mockResolvedValue('mp1');
    setupCyclingMocks({
      mealPlans: [makeMealPlan('breakfast', 'Pancakes', 'mp1', 2)],
    });

    const { getByText } = render(<MealPlanScreen />);

    // Open the bottom sheet
    fireEvent.press(getByText('2 SERVINGS'), mockPressEvent);

    // Find the increment button scoped to the bottom sheet area
    // The sheet title "ADJUST SERVINGS" is our anchor
    const sheetTitle = getByText('ADJUST SERVINGS');
    const sheetContainer = sheetTitle.parent?.parent; // Animated.View > Pressable (sheetContent)
    if (sheetContainer) {
      const sheetView = within(sheetContainer);
      const addBtn = sheetView.getAllByTestId('icon-add');
      fireEvent.press(addBtn[0]);
    }

    // Save
    fireEvent.press(getByText('SAVE'));

    await waitFor(() => {
      expect(mockUpdateServings).toHaveBeenCalledWith({
        mealPlanId: 'mp1',
        servings: 3,
      });
    });
  });

  it('does not call updateServings when CANCEL is pressed in bottom sheet', async () => {
    setupCyclingMocks({
      mealPlans: [makeMealPlan('breakfast', 'Pancakes', 'mp1', 2)],
    });

    const { getByText } = render(<MealPlanScreen />);
    fireEvent.press(getByText('2 SERVINGS'), mockPressEvent);
    fireEvent.press(getByText('CANCEL'));

    expect(mockUpdateServings).not.toHaveBeenCalled();
  });
});
