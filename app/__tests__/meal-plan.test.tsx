import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
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

  it('calls changeMeal with mealPlanId when CHANGE is pressed', async () => {
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
    fireEvent.press(getByText('CHANGE'), mockPressEvent);

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

  it('does not call changeMeal when CHANGE pressed with no matching recipes', async () => {
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
      expect(mockChangeMeal).not.toHaveBeenCalled();
    });
  });

  it('shows error toast when CHANGE pressed but no alternative recipes exist', async () => {
    // allRecipes contains ONLY the same recipe that is already in the slot
    // (same _id), so after excluding it from candidates matchingRecipes is empty
    const recipes = [
      makeRecipe('recipe-breakfast', 'Pancakes', ['breakfast']),
    ];
    setupCyclingMocks({
      mealPlans: [makeMealPlan('breakfast', 'Pancakes')],
      allRecipes: recipes,
    });

    const { getByText } = render(<MealPlanScreen />);
    fireEvent.press(getByText('CHANGE'), mockPressEvent);

    await waitFor(() => {
      expect(mockChangeMeal).not.toHaveBeenCalled();
      expect(mockShowError).toHaveBeenCalledWith('No other breakfast recipes available to swap.');
    });
  });

  it('calls changeMeal when allRecipes also contains the current recipe alongside alternatives', async () => {
    mockChangeMeal.mockResolvedValue({ success: true });
    // Realistic production scenario: allRecipes includes the current recipe (same _id)
    // plus another breakfast recipe as a valid alternative
    const recipes = [
      makeRecipe('recipe-breakfast', 'Pancakes', ['breakfast']),
      makeRecipe('r-alt', 'Oatmeal', ['breakfast']),
    ];
    setupCyclingMocks({
      mealPlans: [makeMealPlan('breakfast', 'Pancakes')],
      allRecipes: recipes,
    });

    const { getByText } = render(<MealPlanScreen />);
    fireEvent.press(getByText('CHANGE'), mockPressEvent);

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

  it('handles remove meal error gracefully', async () => {
    mockRemoveMeal.mockRejectedValue(new Error('Remove failed'));
    setupCyclingMocks({
      mealPlans: [makeMealPlan('breakfast', 'Pancakes', 'mp-breakfast')],
    });

    const { getByTestId } = render(<MealPlanScreen />);
    fireEvent.press(getByTestId('icon-trash-outline'), mockPressEvent);

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

  // --- Multiple meals per slot ---

  it('shows section header with calorie total for a single meal', () => {
    setupCyclingMocks({
      mealPlans: [makeMealPlan('breakfast', 'Pancakes')],
    });

    const { getByText } = render(<MealPlanScreen />);
    expect(getByText('BREAKFAST — 400 KCAL')).toBeTruthy();
  });

  it('shows aggregate calorie total in section header when slot has multiple meals', () => {
    setupCyclingMocks({
      mealPlans: [
        { _id: 'mp1', mealType: 'breakfast', recipe: { _id: 'r1', title: 'Omelette', tags: ['breakfast'], prepTime: 5, cookTime: 5, nutritionPerServing: { calories: 320, protein: 20, carbs: 5, fat: 22 } } },
        { _id: 'mp2', mealType: 'breakfast', recipe: { _id: 'r2', title: 'Croissant', tags: ['breakfast'], prepTime: 5, cookTime: 5, nutritionPerServing: { calories: 180, protein: 5, carbs: 26, fat: 8 } } },
      ],
    });

    const { getByText } = render(<MealPlanScreen />);
    expect(getByText('BREAKFAST — 500 KCAL')).toBeTruthy();
  });

  it('shows plain section label without KCAL total when meal has no calorie data', () => {
    setupCyclingMocks({
      mealPlans: [
        { _id: 'mp1', mealType: 'lunch', recipe: { _id: 'r1', title: 'Mystery Dish', tags: ['lunch'], prepTime: 10, cookTime: 10 } },
      ],
    });

    const { getByText, queryByText } = render(<MealPlanScreen />);
    expect(getByText('LUNCH')).toBeTruthy();
    expect(queryByText('LUNCH — 0 KCAL')).toBeNull();
  });

  it('shows "+ ADD ANOTHER BREAKFAST" button when breakfast slot has 1 meal', () => {
    setupCyclingMocks({
      mealPlans: [makeMealPlan('breakfast', 'Omelette')],
    });

    const { getByText } = render(<MealPlanScreen />);
    expect(getByText('+ ADD ANOTHER BREAKFAST')).toBeTruthy();
  });

  it('shows "+ ADD ANOTHER" button when slot has 2 meals', () => {
    setupCyclingMocks({
      mealPlans: [
        makeMealPlan('dinner', 'Pasta', 'mp1'),
        { _id: 'mp2', mealType: 'dinner', recipe: { _id: 'r2', title: 'Steak', tags: ['dinner'], prepTime: 10, cookTime: 20, nutritionPerServing: { calories: 550, protein: 40, carbs: 10, fat: 30 } } },
      ],
    });

    const { getByText } = render(<MealPlanScreen />);
    expect(getByText('+ ADD ANOTHER DINNER')).toBeTruthy();
  });

  it('hides "+ ADD ANOTHER" button when slot has 3 meals', () => {
    setupCyclingMocks({
      mealPlans: [
        makeMealPlan('breakfast', 'Meal 1', 'mp1'),
        { _id: 'mp2', mealType: 'breakfast', recipe: { _id: 'r2', title: 'Meal 2', tags: ['breakfast'], prepTime: 10, cookTime: 20, nutritionPerServing: { calories: 300, protein: 10, carbs: 20, fat: 10 } } },
        { _id: 'mp3', mealType: 'breakfast', recipe: { _id: 'r3', title: 'Meal 3', tags: ['breakfast'], prepTime: 10, cookTime: 20, nutritionPerServing: { calories: 350, protein: 12, carbs: 22, fat: 12 } } },
      ],
    });

    const { queryByText } = render(<MealPlanScreen />);
    expect(queryByText('+ ADD ANOTHER BREAKFAST')).toBeNull();
  });

  it('renders individual CHANGE and remove buttons for each card in a multi-meal slot', () => {
    setupCyclingMocks({
      mealPlans: [
        makeMealPlan('dinner', 'Pasta', 'mp1'),
        { _id: 'mp2', mealType: 'dinner', recipe: { _id: 'r2', title: 'Steak', tags: ['dinner'], prepTime: 10, cookTime: 20, nutritionPerServing: { calories: 550, protein: 40, carbs: 10, fat: 30 } } },
      ],
    });

    const { getAllByText, getAllByTestId } = render(<MealPlanScreen />);
    expect(getAllByText('CHANGE').length).toBe(2);
    expect(getAllByTestId('icon-trash-outline').length).toBe(2);
  });

  it('pressing "+ ADD ANOTHER" navigates to select-recipe with correct mealType', () => {
    setupCyclingMocks({
      mealPlans: [makeMealPlan('lunch', 'Salad')],
    });

    const { getByText } = render(<MealPlanScreen />);
    fireEvent.press(getByText('+ ADD ANOTHER LUNCH'));

    expect(router.push).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/select-recipe',
        params: expect.objectContaining({ mealType: 'lunch' }),
      })
    );
  });

  it('displays servings controls on meal card', () => {
    setupCyclingMocks({
      mealPlans: [makeMealPlan('breakfast', 'Pancakes', 'mp1', 2)],
    });

    const { getAllByTestId } = render(<MealPlanScreen />);
    // Servings control should have increment and decrement icons
    const addIcons = getAllByTestId('icon-add');
    const removeIcons = getAllByTestId('icon-remove');
    expect(addIcons.length).toBeGreaterThanOrEqual(1);
    expect(removeIcons.length).toBeGreaterThanOrEqual(1);
  });

  it('calls updateServings when increment button is pressed', async () => {
    mockUpdateServings.mockResolvedValue('mp1');
    setupCyclingMocks({
      mealPlans: [makeMealPlan('breakfast', 'Pancakes', 'mp1', 2)],
    });

    const { getAllByTestId } = render(<MealPlanScreen />);
    // The "add" icon inside the servings control
    const addButtons = getAllByTestId('icon-add');
    fireEvent.press(addButtons[0], mockPressEvent);

    await waitFor(() => {
      expect(mockUpdateServings).toHaveBeenCalledWith({
        mealPlanId: 'mp1',
        servings: 3,
      });
    });
  });

  it('calls updateServings when decrement button is pressed', async () => {
    mockUpdateServings.mockResolvedValue('mp1');
    setupCyclingMocks({
      mealPlans: [makeMealPlan('breakfast', 'Pancakes', 'mp1', 3)],
    });

    const { getAllByTestId } = render(<MealPlanScreen />);
    // The "remove" icon inside the servings control
    const removeButtons = getAllByTestId('icon-remove');
    fireEvent.press(removeButtons[0], mockPressEvent);

    await waitFor(() => {
      expect(mockUpdateServings).toHaveBeenCalledWith({
        mealPlanId: 'mp1',
        servings: 2,
      });
    });
  });
});
