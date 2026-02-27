import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { useMutation, useQuery } from 'convex/react';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Alert } from 'react-native';
import { api } from '../../convex/_generated/api';
import ManualRecipeScreen from '../manual-recipe';

// Mock Convex API with stable references (anyApi uses Proxy, creating new objects on each access)
jest.mock('../../convex/_generated/api', () => ({
  api: {
    users: { current: Symbol('users.current') },
    recipes: {
      getById: Symbol('recipes.getById'),
      createManual: Symbol('recipes.createManual'),
      updateManual: Symbol('recipes.updateManual'),
    },
  },
}));

// Mock useToast (Alert spy kept for step validation which still uses Alert.alert)
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

// Add Stack to the global expo-router mock from jest.setup.js
jest.mock('expo-router', () => ({
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
  useLocalSearchParams: jest.fn(() => ({})),
  useSegments: () => [],
  usePathname: () => '/',
  Link: 'Link',
  Redirect: 'Redirect',
  Stack: {
    Screen: () => null,
  },
}));

jest.spyOn(Alert, 'alert');

const mockCreateRecipe = jest.fn();
const mockUpdateRecipe = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mockShowError.mockReset();
  mockShowSuccess.mockReset();
  (useLocalSearchParams as jest.Mock).mockReturnValue({});
  // Match by API function reference instead of call count cycling
  (useQuery as jest.Mock).mockImplementation((queryFn: unknown, args?: unknown) => {
    if (queryFn === api.users.current) return undefined; // no preference
    if (queryFn === api.recipes.getById) return undefined; // not in edit mode
    return undefined;
  });
  (useMutation as jest.Mock).mockImplementation((mutationFn: unknown) => {
    if (mutationFn === api.recipes.createManual) return mockCreateRecipe;
    if (mutationFn === api.recipes.updateManual) return mockUpdateRecipe;
    return jest.fn();
  });
});

const mockExistingRecipe = {
  _id: 'recipe1',
  title: 'Existing Recipe',
  servings: 2,
  prepTime: 10,
  cookTime: 20,
  difficulty: 'easy' as const,
  description: 'A test description',
  cuisine: 'Italian',
  isOwner: true,
  ownerName: 'User',
  tags: [],
  ingredients: [
    { _id: 'ing1', name: 'Flour', amount: 200, unit: 'g', sortOrder: 0 },
  ],
  steps: [
    { stepNumber: 1, instruction: 'Mix it all together', tips: 'Stir gently' },
  ],
  nutritionPerServing: {
    calories: 350,
    protein: 12,
    carbs: 45,
    fat: 8,
    fiber: 3,
    sugar: 5,
    sodium: 200,
  },
};

describe('ManualRecipeScreen', () => {
  it('renders form with all required fields on step 1', () => {
    const { getByText, getByPlaceholderText } = render(<ManualRecipeScreen />);

    expect(getByText('BASIC INFO')).toBeTruthy();
    expect(getByText('RECIPE TITLE *')).toBeTruthy();
    expect(getByText('SERVINGS *')).toBeTruthy();
    expect(getByText('PREP TIME (MIN)')).toBeTruthy();
    expect(getByText('COOK TIME (MIN)')).toBeTruthy();
    expect(getByText('DIFFICULTY')).toBeTruthy();
    expect(getByPlaceholderText("e.g., Grandma's Apple Pie")).toBeTruthy();
    expect(getByText('NEXT')).toBeTruthy();
  });

  it('can input recipe title and servings', () => {
    const { getByPlaceholderText } = render(<ManualRecipeScreen />);

    const titleInput = getByPlaceholderText("e.g., Grandma's Apple Pie");
    fireEvent.changeText(titleInput, 'My Test Recipe');
    expect(titleInput.props.value).toBe('My Test Recipe');

    const servingsInput = getByPlaceholderText('4');
    fireEvent.changeText(servingsInput, '6');
    expect(servingsInput.props.value).toBe('6');
  });

  it('shows validation error for empty title on step 1', () => {
    const { getByText, getByPlaceholderText } = render(<ManualRecipeScreen />);

    // Clear the default servings and set title empty
    fireEvent.changeText(getByPlaceholderText("e.g., Grandma's Apple Pie"), '');

    fireEvent.press(getByText('NEXT'));

    expect(Alert.alert).toHaveBeenCalledWith('Required', 'Please enter a recipe title');
  });

  it('shows validation error for invalid servings on step 1', () => {
    const { getByText, getByPlaceholderText } = render(<ManualRecipeScreen />);

    fireEvent.changeText(getByPlaceholderText("e.g., Grandma's Apple Pie"), 'My Recipe');
    fireEvent.changeText(getByPlaceholderText('4'), '0');

    fireEvent.press(getByText('NEXT'));

    expect(Alert.alert).toHaveBeenCalledWith('Required', 'Please enter valid servings');
  });

  it('navigates to step 2 (ingredients) when step 1 is valid', () => {
    const { getByText, getByPlaceholderText } = render(<ManualRecipeScreen />);

    fireEvent.changeText(getByPlaceholderText("e.g., Grandma's Apple Pie"), 'My Recipe');

    fireEvent.press(getByText('NEXT'));

    expect(getByText('INGREDIENTS')).toBeTruthy();
    expect(getByText("Add what you'll need")).toBeTruthy();
    expect(getByText('ADD INGREDIENT')).toBeTruthy();
  });

  it('can add an ingredient row', () => {
    const { getByText, getByPlaceholderText, getAllByPlaceholderText } = render(<ManualRecipeScreen />);

    // Navigate to step 2
    fireEvent.changeText(getByPlaceholderText("e.g., Grandma's Apple Pie"), 'My Recipe');
    fireEvent.press(getByText('NEXT'));

    // Should have 1 ingredient row initially
    expect(getAllByPlaceholderText('Ingredient name')).toHaveLength(1);

    // Add another ingredient
    fireEvent.press(getByText('ADD INGREDIENT'));
    expect(getAllByPlaceholderText('Ingredient name')).toHaveLength(2);
  });

  it('can remove an ingredient row (when more than one)', () => {
    const { getByText, getByPlaceholderText, getAllByPlaceholderText, getAllByText } = render(<ManualRecipeScreen />);

    // Navigate to step 2
    fireEvent.changeText(getByPlaceholderText("e.g., Grandma's Apple Pie"), 'My Recipe');
    fireEvent.press(getByText('NEXT'));

    // Add another ingredient
    fireEvent.press(getByText('ADD INGREDIENT'));
    expect(getAllByPlaceholderText('Ingredient name')).toHaveLength(2);

    // Remove one ingredient (close icon)
    const closeIcons = getAllByText('close');
    fireEvent.press(closeIcons[0]);
    expect(getAllByPlaceholderText('Ingredient name')).toHaveLength(1);
  });

  it('can add a cooking step', () => {
    const { getByText, getByPlaceholderText, getAllByPlaceholderText } = render(<ManualRecipeScreen />);

    // Navigate to step 2, then step 3
    fireEvent.changeText(getByPlaceholderText("e.g., Grandma's Apple Pie"), 'My Recipe');
    fireEvent.press(getByText('NEXT'));

    // Fill in at least one ingredient to pass validation
    fireEvent.changeText(getByPlaceholderText('Ingredient name'), 'Flour');
    fireEvent.press(getByText('NEXT'));

    expect(getByText('COOKING STEPS')).toBeTruthy();
    expect(getAllByPlaceholderText('Describe this step...')).toHaveLength(1);

    fireEvent.press(getByText('ADD STEP'));
    expect(getAllByPlaceholderText('Describe this step...')).toHaveLength(2);
  });

  it('can remove a cooking step (when more than one)', () => {
    const { getByText, getByPlaceholderText, getAllByPlaceholderText, getAllByText } = render(<ManualRecipeScreen />);

    // Navigate to step 3
    fireEvent.changeText(getByPlaceholderText("e.g., Grandma's Apple Pie"), 'My Recipe');
    fireEvent.press(getByText('NEXT'));
    fireEvent.changeText(getByPlaceholderText('Ingredient name'), 'Flour');
    fireEvent.press(getByText('NEXT'));

    // Add a second step
    fireEvent.press(getByText('ADD STEP'));
    expect(getAllByPlaceholderText('Describe this step...')).toHaveLength(2);

    // Remove one step
    const closeIcons = getAllByText('close');
    fireEvent.press(closeIcons[0]);
    expect(getAllByPlaceholderText('Describe this step...')).toHaveLength(1);
  });

  it('can set prep time and cook time', () => {
    const { getByPlaceholderText } = render(<ManualRecipeScreen />);

    const prepTimeInput = getByPlaceholderText('15');
    fireEvent.changeText(prepTimeInput, '20');
    expect(prepTimeInput.props.value).toBe('20');

    const cookTimeInput = getByPlaceholderText('30');
    fireEvent.changeText(cookTimeInput, '45');
    expect(cookTimeInput.props.value).toBe('45');
  });

  it('can select difficulty level', () => {
    const { getByText } = render(<ManualRecipeScreen />);

    expect(getByText('EASY')).toBeTruthy();
    expect(getByText('MEDIUM')).toBeTruthy();
    expect(getByText('HARD')).toBeTruthy();

    // Pressing a difficulty option should work without errors
    fireEvent.press(getByText('MEDIUM'));
  });

  it('submits form successfully with valid data', async () => {
    mockCreateRecipe.mockResolvedValue({ recipeId: 'recipe-123' });

    const { getByText, getByPlaceholderText } = render(<ManualRecipeScreen />);

    // Step 1: Basic Info
    fireEvent.changeText(getByPlaceholderText("e.g., Grandma's Apple Pie"), 'Test Recipe');
    fireEvent.press(getByText('NEXT'));

    // Step 2: Ingredients
    fireEvent.changeText(getByPlaceholderText('Ingredient name'), 'Flour');
    fireEvent.changeText(getByPlaceholderText('Qty'), '200');
    fireEvent.press(getByText('NEXT'));

    // Step 3: Steps
    fireEvent.changeText(getByPlaceholderText('Describe this step...'), 'Mix ingredients');
    fireEvent.press(getByText('NEXT'));

    // Step 4: Extras - shows SAVE RECIPE button
    expect(getByText('EXTRAS')).toBeTruthy();
    expect(getByText('SAVE RECIPE')).toBeTruthy();

    fireEvent.press(getByText('SAVE RECIPE'));

    await waitFor(() => {
      expect(mockCreateRecipe).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Recipe',
          servings: 4,
          isPublic: false,
          ingredients: expect.arrayContaining([
            expect.objectContaining({ name: 'Flour', amount: 200 }),
          ]),
          steps: expect.arrayContaining([
            expect.objectContaining({ instruction: 'Mix ingredients' }),
          ]),
        })
      );
    });

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/recipe/recipe-123');
    });
  });

  it('cancel/back navigation works on step 1', () => {
    const { getByText } = render(<ManualRecipeScreen />);

    // Back button contains arrow-back icon
    fireEvent.press(getByText('arrow-back'));

    expect(router.back).toHaveBeenCalled();
  });

  it('back navigation goes to previous step on step 2+', () => {
    const { getByText, getByPlaceholderText } = render(<ManualRecipeScreen />);

    // Navigate to step 2
    fireEvent.changeText(getByPlaceholderText("e.g., Grandma's Apple Pie"), 'My Recipe');
    fireEvent.press(getByText('NEXT'));
    expect(getByText('INGREDIENTS')).toBeTruthy();

    // Go back to step 1
    fireEvent.press(getByText('arrow-back'));
    expect(getByText('BASIC INFO')).toBeTruthy();
  });

  it('shows error toast when save fails', async () => {
    mockCreateRecipe.mockRejectedValue(new Error('SaveFailed'));

    const { getByText, getByPlaceholderText } = render(<ManualRecipeScreen />);

    // Navigate through all steps
    fireEvent.changeText(getByPlaceholderText("e.g., Grandma's Apple Pie"), 'Test Recipe');
    fireEvent.press(getByText('NEXT'));
    fireEvent.changeText(getByPlaceholderText('Ingredient name'), 'Flour');
    fireEvent.press(getByText('NEXT'));
    fireEvent.changeText(getByPlaceholderText('Describe this step...'), 'Mix');
    fireEvent.press(getByText('NEXT'));

    fireEvent.press(getByText('SAVE RECIPE'));

    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith('Failed to save recipe. Please try again.');
    });
  });

  describe('Step tips', () => {
    const navigateToStepThree = (utils: ReturnType<typeof render>) => {
      const { getByText, getByPlaceholderText } = utils;
      fireEvent.changeText(getByPlaceholderText("e.g., Grandma's Apple Pie"), 'My Recipe');
      fireEvent.press(getByText('NEXT'));
      fireEvent.changeText(getByPlaceholderText('Ingredient name'), 'Flour');
      fireEvent.press(getByText('NEXT'));
    };

    it('renders tip input for each step on step 3', () => {
      const utils = render(<ManualRecipeScreen />);
      navigateToStepThree(utils);

      expect(utils.getByPlaceholderText('Add a tip (optional)...')).toBeTruthy();
    });

    it('can type a tip into a step', () => {
      const utils = render(<ManualRecipeScreen />);
      navigateToStepThree(utils);

      const tipInput = utils.getByPlaceholderText('Add a tip (optional)...');
      fireEvent.changeText(tipInput, 'Make sure not to overmix');
      expect(tipInput.props.value).toBe('Make sure not to overmix');
    });

    it('each added step has its own tip input', () => {
      const utils = render(<ManualRecipeScreen />);
      navigateToStepThree(utils);

      fireEvent.press(utils.getByText('ADD STEP'));

      expect(utils.getAllByPlaceholderText('Add a tip (optional)...')).toHaveLength(2);
    });

    it('submits step tip when provided', async () => {
      mockCreateRecipe.mockResolvedValue({ recipeId: 'recipe-456' });

      const utils = render(<ManualRecipeScreen />);

      // Step 1
      fireEvent.changeText(utils.getByPlaceholderText("e.g., Grandma's Apple Pie"), 'Tip Recipe');
      fireEvent.press(utils.getByText('NEXT'));

      // Step 2
      fireEvent.changeText(utils.getByPlaceholderText('Ingredient name'), 'Sugar');
      fireEvent.press(utils.getByText('NEXT'));

      // Step 3: fill instruction and tip
      fireEvent.changeText(utils.getByPlaceholderText('Describe this step...'), 'Stir well');
      fireEvent.changeText(utils.getByPlaceholderText('Add a tip (optional)...'), 'Use a wooden spoon');
      fireEvent.press(utils.getByText('NEXT'));

      // Step 4: save
      fireEvent.press(utils.getByText('SAVE RECIPE'));

      await waitFor(() => {
        expect(mockCreateRecipe).toHaveBeenCalledWith(
          expect.objectContaining({
            steps: expect.arrayContaining([
              expect.objectContaining({
                instruction: 'Stir well',
                tips: 'Use a wooden spoon',
              }),
            ]),
          })
        );
      });
    });

    it('omits tips from payload when tip is empty', async () => {
      mockCreateRecipe.mockResolvedValue({ recipeId: 'recipe-789' });

      const utils = render(<ManualRecipeScreen />);

      // Step 1
      fireEvent.changeText(utils.getByPlaceholderText("e.g., Grandma's Apple Pie"), 'No Tip Recipe');
      fireEvent.press(utils.getByText('NEXT'));

      // Step 2
      fireEvent.changeText(utils.getByPlaceholderText('Ingredient name'), 'Eggs');
      fireEvent.press(utils.getByText('NEXT'));

      // Step 3: fill instruction only, leave tip blank
      fireEvent.changeText(utils.getByPlaceholderText('Describe this step...'), 'Beat the eggs');
      fireEvent.press(utils.getByText('NEXT'));

      // Step 4: save
      fireEvent.press(utils.getByText('SAVE RECIPE'));

      await waitFor(() => {
        expect(mockCreateRecipe).toHaveBeenCalledWith(
          expect.objectContaining({
            steps: [expect.objectContaining({ instruction: 'Beat the eggs', tips: undefined })],
          })
        );
      });
    });

    it('tip input is independent per step', () => {
      const utils = render(<ManualRecipeScreen />);
      navigateToStepThree(utils);

      // Add a second step
      fireEvent.press(utils.getByText('ADD STEP'));

      const tipInputs = utils.getAllByPlaceholderText('Add a tip (optional)...');
      expect(tipInputs).toHaveLength(2);

      fireEvent.changeText(tipInputs[0], 'First step tip');
      fireEvent.changeText(tipInputs[1], 'Second step tip');

      expect(tipInputs[0].props.value).toBe('First step tip');
      expect(tipInputs[1].props.value).toBe('Second step tip');
    });
  });

  describe('Nutrition fields', () => {
    const navigateToStepFour = (utils: ReturnType<typeof render>) => {
      const { getByText, getByPlaceholderText } = utils;
      fireEvent.changeText(getByPlaceholderText("e.g., Grandma's Apple Pie"), 'My Recipe');
      fireEvent.press(getByText('NEXT'));
      fireEvent.changeText(getByPlaceholderText('Ingredient name'), 'Flour');
      fireEvent.press(getByText('NEXT'));
      fireEvent.changeText(getByPlaceholderText('Describe this step...'), 'Mix well');
      fireEvent.press(getByText('NEXT'));
    };

    it('renders nutrition section on step 4', () => {
      const utils = render(<ManualRecipeScreen />);
      navigateToStepFour(utils);

      expect(utils.getByText('NUTRITION PER SERVING (OPTIONAL)')).toBeTruthy();
      expect(utils.getByText('CALORIES (kcal)')).toBeTruthy();
      expect(utils.getByText('PROTEIN (g)')).toBeTruthy();
      expect(utils.getByText('CARBS (g)')).toBeTruthy();
      expect(utils.getByText('FAT (g)')).toBeTruthy();
      expect(utils.getByText('FIBER (g)')).toBeTruthy();
      expect(utils.getByText('SUGAR (g)')).toBeTruthy();
      expect(utils.getByText('SODIUM (mg)')).toBeTruthy();
    });

    it('can type into each nutrition field', () => {
      const utils = render(<ManualRecipeScreen />);
      navigateToStepFour(utils);

      const caloriesInput = utils.getByPlaceholderText('e.g., 350');
      const proteinInput = utils.getByPlaceholderText('e.g., 25');
      const carbsInput = utils.getByPlaceholderText('e.g., 45');
      const fatInput = utils.getByPlaceholderText('e.g., 10');
      const fiberInput = utils.getByPlaceholderText('e.g., 5');
      const sugarInput = utils.getByPlaceholderText('e.g., 8');
      const sodiumInput = utils.getByPlaceholderText('e.g., 400');

      fireEvent.changeText(caloriesInput, '300');
      fireEvent.changeText(proteinInput, '20');
      fireEvent.changeText(carbsInput, '40');
      fireEvent.changeText(fatInput, '12');
      fireEvent.changeText(fiberInput, '4');
      fireEvent.changeText(sugarInput, '6');
      fireEvent.changeText(sodiumInput, '500');

      expect(caloriesInput.props.value).toBe('300');
      expect(proteinInput.props.value).toBe('20');
      expect(carbsInput.props.value).toBe('40');
      expect(fatInput.props.value).toBe('12');
      expect(fiberInput.props.value).toBe('4');
      expect(sugarInput.props.value).toBe('6');
      expect(sodiumInput.props.value).toBe('500');
    });

    it('submits nutritionPerServing when all required fields are filled', async () => {
      mockCreateRecipe.mockResolvedValue({ recipeId: 'recipe-nutrition' });

      const utils = render(<ManualRecipeScreen />);
      navigateToStepFour(utils);

      fireEvent.changeText(utils.getByPlaceholderText('e.g., 350'), '300');
      fireEvent.changeText(utils.getByPlaceholderText('e.g., 25'), '20');
      fireEvent.changeText(utils.getByPlaceholderText('e.g., 45'), '40');
      fireEvent.changeText(utils.getByPlaceholderText('e.g., 10'), '12');

      fireEvent.press(utils.getByText('SAVE RECIPE'));

      await waitFor(() => {
        expect(mockCreateRecipe).toHaveBeenCalledWith(
          expect.objectContaining({
            nutritionPerServing: expect.objectContaining({
              calories: 300,
              protein: 20,
              carbs: 40,
              fat: 12,
            }),
          })
        );
      });
    });

    it('includes optional fiber, sugar, sodium when provided', async () => {
      mockCreateRecipe.mockResolvedValue({ recipeId: 'recipe-full-nutrition' });

      const utils = render(<ManualRecipeScreen />);
      navigateToStepFour(utils);

      fireEvent.changeText(utils.getByPlaceholderText('e.g., 350'), '350');
      fireEvent.changeText(utils.getByPlaceholderText('e.g., 25'), '12');
      fireEvent.changeText(utils.getByPlaceholderText('e.g., 45'), '45');
      fireEvent.changeText(utils.getByPlaceholderText('e.g., 10'), '8');
      fireEvent.changeText(utils.getByPlaceholderText('e.g., 5'), '3');
      fireEvent.changeText(utils.getByPlaceholderText('e.g., 8'), '5');
      fireEvent.changeText(utils.getByPlaceholderText('e.g., 400'), '200');

      fireEvent.press(utils.getByText('SAVE RECIPE'));

      await waitFor(() => {
        expect(mockCreateRecipe).toHaveBeenCalledWith(
          expect.objectContaining({
            nutritionPerServing: {
              calories: 350,
              protein: 12,
              carbs: 45,
              fat: 8,
              fiber: 3,
              sugar: 5,
              sodium: 200,
            },
          })
        );
      });
    });

    it('omits nutritionPerServing when required fields are left blank', async () => {
      mockCreateRecipe.mockResolvedValue({ recipeId: 'recipe-no-nutrition' });

      const utils = render(<ManualRecipeScreen />);
      navigateToStepFour(utils);

      // Leave all nutrition fields empty
      fireEvent.press(utils.getByText('SAVE RECIPE'));

      await waitFor(() => {
        expect(mockCreateRecipe).toHaveBeenCalledWith(
          expect.objectContaining({
            nutritionPerServing: undefined,
          })
        );
      });
    });

    it('omits nutritionPerServing when only some required fields are filled', async () => {
      mockCreateRecipe.mockResolvedValue({ recipeId: 'recipe-partial-nutrition' });

      const utils = render(<ManualRecipeScreen />);
      navigateToStepFour(utils);

      // Fill only calories and protein, leave carbs and fat empty
      fireEvent.changeText(utils.getByPlaceholderText('e.g., 350'), '300');
      fireEvent.changeText(utils.getByPlaceholderText('e.g., 25'), '20');

      fireEvent.press(utils.getByText('SAVE RECIPE'));

      await waitFor(() => {
        expect(mockCreateRecipe).toHaveBeenCalledWith(
          expect.objectContaining({
            nutritionPerServing: undefined,
          })
        );
      });
    });
  });

  describe('Ingredient unit selection', () => {
    const navigateToIngredients = (utils: ReturnType<typeof render>) => {
      fireEvent.changeText(utils.getByPlaceholderText("e.g., Grandma's Apple Pie"), 'My Recipe');
      fireEvent.press(utils.getByText('NEXT'));
    };

    it('shows "g" as default unit for new ingredients', () => {
      const utils = render(<ManualRecipeScreen />);
      navigateToIngredients(utils);
      expect(utils.getByTestId('unit-text-1').props.children).toBe('g');
    });

    it('unit picker contains metric, imperial, and count groups', () => {
      const utils = render(<ManualRecipeScreen />);
      navigateToIngredients(utils);
      fireEvent.press(utils.getByTestId('unit-button-1'));
      expect(utils.getByText('SELECT UNIT')).toBeTruthy();
      expect(utils.getByText('METRIC')).toBeTruthy();
      expect(utils.getByText('IMPERIAL')).toBeTruthy();
      expect(utils.getByText('COUNT')).toBeTruthy();
    });

    it('can select a metric unit (ml)', () => {
      const utils = render(<ManualRecipeScreen />);
      navigateToIngredients(utils);
      fireEvent.press(utils.getByTestId('unit-button-1'));
      fireEvent.press(utils.getAllByText('ml')[0]);
      expect(utils.getByTestId('unit-text-1').props.children).toBe('ml');
    });

    it('can select an imperial unit (oz)', () => {
      const utils = render(<ManualRecipeScreen />);
      navigateToIngredients(utils);
      fireEvent.press(utils.getByTestId('unit-button-1'));
      fireEvent.press(utils.getAllByText('oz')[0]);
      expect(utils.getByTestId('unit-text-1').props.children).toBe('oz');
    });

    it('can select a count unit (pcs)', () => {
      const utils = render(<ManualRecipeScreen />);
      navigateToIngredients(utils);
      fireEvent.press(utils.getByTestId('unit-button-1'));
      fireEvent.press(utils.getAllByText('pcs')[0]);
      expect(utils.getByTestId('unit-text-1').props.children).toBe('pcs');
    });

    it('can select "to taste" unit', () => {
      const utils = render(<ManualRecipeScreen />);
      navigateToIngredients(utils);
      fireEvent.press(utils.getByTestId('unit-button-1'));
      fireEvent.press(utils.getAllByText('to taste')[0]);
      expect(utils.getByTestId('unit-text-1').props.children).toBe('to taste');
    });

    it('submits selected unit in the payload', async () => {
      mockCreateRecipe.mockResolvedValue({ recipeId: 'recipe-unit' });
      const utils = render(<ManualRecipeScreen />);

      // Step 1
      fireEvent.changeText(utils.getByPlaceholderText("e.g., Grandma's Apple Pie"), 'Unit Test Recipe');
      fireEvent.press(utils.getByText('NEXT'));

      // Step 2: fill ingredient and change unit to ml
      fireEvent.changeText(utils.getByPlaceholderText('Ingredient name'), 'Water');
      fireEvent.changeText(utils.getByPlaceholderText('Qty'), '250');
      fireEvent.press(utils.getByTestId('unit-button-1'));
      fireEvent.press(utils.getAllByText('ml')[0]);
      fireEvent.press(utils.getByText('NEXT'));

      // Step 3
      fireEvent.changeText(utils.getByPlaceholderText('Describe this step...'), 'Add water');
      fireEvent.press(utils.getByText('NEXT'));

      // Step 4: save
      fireEvent.press(utils.getByText('SAVE RECIPE'));

      await waitFor(() => {
        expect(mockCreateRecipe).toHaveBeenCalledWith(
          expect.objectContaining({
            ingredients: expect.arrayContaining([
              expect.objectContaining({ name: 'Water', amount: 250, unit: 'ml' }),
            ]),
          })
        );
      });
    });

    it('defaults to "g" unit in submitted payload when not changed', async () => {
      mockCreateRecipe.mockResolvedValue({ recipeId: 'recipe-default-unit' });
      const utils = render(<ManualRecipeScreen />);

      fireEvent.changeText(utils.getByPlaceholderText("e.g., Grandma's Apple Pie"), 'Default Unit Recipe');
      fireEvent.press(utils.getByText('NEXT'));
      fireEvent.changeText(utils.getByPlaceholderText('Ingredient name'), 'Flour');
      fireEvent.changeText(utils.getByPlaceholderText('Qty'), '100');
      fireEvent.press(utils.getByText('NEXT'));
      fireEvent.changeText(utils.getByPlaceholderText('Describe this step...'), 'Mix');
      fireEvent.press(utils.getByText('NEXT'));
      fireEvent.press(utils.getByText('SAVE RECIPE'));

      await waitFor(() => {
        expect(mockCreateRecipe).toHaveBeenCalledWith(
          expect.objectContaining({
            ingredients: expect.arrayContaining([
              expect.objectContaining({ name: 'Flour', unit: 'g' }),
            ]),
          })
        );
      });
    });

    it('can close the unit picker with the CLOSE button', () => {
      const utils = render(<ManualRecipeScreen />);
      navigateToIngredients(utils);
      fireEvent.press(utils.getByTestId('unit-button-1'));
      // Unit should not have changed
      expect(utils.getByTestId('unit-text-1').props.children).toBe('g');
      fireEvent.press(utils.getByText('CLOSE'));
      // Unit should still be 'g' after closing without selecting
      expect(utils.getByTestId('unit-text-1').props.children).toBe('g');
    });

    it('unit picker shows all groups when no preference is set', () => {
      // Default mock returns undefined for users.current (no preference)
      const utils = render(<ManualRecipeScreen />);
      navigateToIngredients(utils);
      fireEvent.press(utils.getByTestId('unit-button-1'));
      expect(utils.getByText('METRIC')).toBeTruthy();
      expect(utils.getByText('IMPERIAL')).toBeTruthy();
      expect(utils.getByText('COUNT')).toBeTruthy();
    });
  });

  describe('Unit preference filtering', () => {
    const navigateToIngredients = (utils: ReturnType<typeof render>) => {
      fireEvent.changeText(utils.getByPlaceholderText("e.g., Grandma's Apple Pie"), 'My Recipe');
      fireEvent.press(utils.getByText('NEXT'));
    };

    const setupPreference = (preference: 'metric' | 'imperial') => {
      (useQuery as jest.Mock).mockImplementation((queryFn: unknown) => {
        if (queryFn === api.users.current) return { preferredUnits: preference };
        if (queryFn === api.recipes.getById) return undefined;
        return undefined;
      });
    };

    it('hides IMPERIAL group and shows METRIC group for metric users', () => {
      setupPreference('metric');
      const utils = render(<ManualRecipeScreen />);
      navigateToIngredients(utils);
      fireEvent.press(utils.getByTestId('unit-button-1'));
      expect(utils.getByText('METRIC')).toBeTruthy();
      expect(utils.queryByText('IMPERIAL')).toBeNull();
    });

    it('hides METRIC group and shows IMPERIAL group for imperial users', () => {
      setupPreference('imperial');
      const utils = render(<ManualRecipeScreen />);
      navigateToIngredients(utils);
      fireEvent.press(utils.getByTestId('unit-button-1'));
      expect(utils.getByText('IMPERIAL')).toBeTruthy();
      expect(utils.queryByText('METRIC')).toBeNull();
    });

    it('always shows COUNT group for metric users', () => {
      setupPreference('metric');
      const utils = render(<ManualRecipeScreen />);
      navigateToIngredients(utils);
      fireEvent.press(utils.getByTestId('unit-button-1'));
      expect(utils.getByText('COUNT')).toBeTruthy();
    });

    it('always shows COUNT group for imperial users', () => {
      setupPreference('imperial');
      const utils = render(<ManualRecipeScreen />);
      navigateToIngredients(utils);
      fireEvent.press(utils.getByTestId('unit-button-1'));
      expect(utils.getByText('COUNT')).toBeTruthy();
    });

    it('metric units (g, kg, ml) are available for metric users', () => {
      setupPreference('metric');
      const utils = render(<ManualRecipeScreen />);
      navigateToIngredients(utils);
      fireEvent.press(utils.getByTestId('unit-button-1'));
      expect(utils.getAllByText('g')[0]).toBeTruthy();
      expect(utils.getAllByText('ml')[0]).toBeTruthy();
      expect(utils.getAllByText('kg')[0]).toBeTruthy();
    });

    it('imperial units (oz, lb) are NOT available in the picker for metric users', () => {
      setupPreference('metric');
      const utils = render(<ManualRecipeScreen />);
      navigateToIngredients(utils);
      fireEvent.press(utils.getByTestId('unit-button-1'));
      expect(utils.queryByText('oz')).toBeNull();
      expect(utils.queryByText('lb')).toBeNull();
    });

    it('imperial units (oz, lb) are available for imperial users', () => {
      setupPreference('imperial');
      const utils = render(<ManualRecipeScreen />);
      navigateToIngredients(utils);
      fireEvent.press(utils.getByTestId('unit-button-1'));
      expect(utils.getAllByText('oz')[0]).toBeTruthy();
      expect(utils.getAllByText('lb')[0]).toBeTruthy();
    });

    it('metric units (g, kg, ml) are NOT available in the picker for imperial users', () => {
      setupPreference('imperial');
      const utils = render(<ManualRecipeScreen />);
      navigateToIngredients(utils);
      fireEvent.press(utils.getByTestId('unit-button-1'));
      expect(utils.queryByText('g')).toBeNull();
      expect(utils.queryByText('ml')).toBeNull();
      expect(utils.queryByText('kg')).toBeNull();
    });

    it('new ingredients added by imperial users default to "oz"', async () => {
      setupPreference('imperial');
      const utils = render(<ManualRecipeScreen />);
      navigateToIngredients(utils);
      fireEvent.press(utils.getByText('ADD INGREDIENT'));
      // The second ingredient's id is Date.now().toString() — find by querying all unit texts
      await waitFor(() => {
        const unitTexts = utils.getAllByText('oz');
        expect(unitTexts.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('initial ingredient syncs to "oz" for imperial users', async () => {
      setupPreference('imperial');
      const utils = render(<ManualRecipeScreen />);
      navigateToIngredients(utils);
      await waitFor(() => {
        expect(utils.getByTestId('unit-text-1').props.children).toBe('oz');
      });
    });

    it('initial ingredient stays "g" for metric users', async () => {
      setupPreference('metric');
      const utils = render(<ManualRecipeScreen />);
      navigateToIngredients(utils);
      await waitFor(() => {
        expect(utils.getByTestId('unit-text-1').props.children).toBe('g');
      });
    });
  });

  describe('Edit mode', () => {
    beforeEach(() => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({ recipeId: 'recipe1' });
      (useQuery as jest.Mock).mockImplementation((queryFn: unknown) => {
        if (queryFn === api.users.current) return undefined; // no preference in edit mode
        if (queryFn === api.recipes.getById) return mockExistingRecipe;
        return undefined;
      });
    });

    it('pre-fills title from existing recipe', async () => {
      const { getByDisplayValue } = render(<ManualRecipeScreen />);

      await waitFor(() => {
        expect(getByDisplayValue('Existing Recipe')).toBeTruthy();
      });
    });

    it('pre-fills servings from existing recipe', async () => {
      const { getByDisplayValue } = render(<ManualRecipeScreen />);

      await waitFor(() => {
        expect(getByDisplayValue('2')).toBeTruthy();
      });
    });

    it('pre-fills prep and cook times from existing recipe', async () => {
      const { getByDisplayValue } = render(<ManualRecipeScreen />);

      await waitFor(() => {
        expect(getByDisplayValue('10')).toBeTruthy();
        expect(getByDisplayValue('20')).toBeTruthy();
      });
    });

    it('shows UPDATE RECIPE button on step 4 in edit mode', async () => {
      const { getByText } = render(<ManualRecipeScreen />);

      // Navigate through all steps (form is pre-filled so validation passes)
      await waitFor(() => expect(getByText('NEXT')).toBeTruthy());
      fireEvent.press(getByText('NEXT'));
      fireEvent.press(getByText('NEXT'));
      fireEvent.press(getByText('NEXT'));

      expect(getByText('UPDATE RECIPE')).toBeTruthy();
    });

    it('calls updateManual instead of createManual in edit mode', async () => {
      mockUpdateRecipe.mockResolvedValue({ recipeId: 'recipe1' });

      const { getByText } = render(<ManualRecipeScreen />);

      await waitFor(() => expect(getByText('NEXT')).toBeTruthy());
      fireEvent.press(getByText('NEXT'));
      fireEvent.press(getByText('NEXT'));
      fireEvent.press(getByText('NEXT'));

      fireEvent.press(getByText('UPDATE RECIPE'));

      await waitFor(() => {
        expect(mockUpdateRecipe).toHaveBeenCalledWith(
          expect.objectContaining({
            recipeId: 'recipe1',
            title: 'Existing Recipe',
            servings: 2,
          })
        );
        expect(mockCreateRecipe).not.toHaveBeenCalled();
      });
    });

    it('navigates back (not replace) after successful update', async () => {
      mockUpdateRecipe.mockResolvedValue({ recipeId: 'recipe1' });

      const { getByText } = render(<ManualRecipeScreen />);

      await waitFor(() => expect(getByText('NEXT')).toBeTruthy());
      fireEvent.press(getByText('NEXT'));
      fireEvent.press(getByText('NEXT'));
      fireEvent.press(getByText('NEXT'));

      fireEvent.press(getByText('UPDATE RECIPE'));

      await waitFor(() => {
        expect(router.back).toHaveBeenCalled();
        expect(router.replace).not.toHaveBeenCalled();
      });
    });

    it('shows error toast when update fails', async () => {
      mockUpdateRecipe.mockRejectedValue(new Error('SaveFailed'));

      const { getByText } = render(<ManualRecipeScreen />);

      await waitFor(() => expect(getByText('NEXT')).toBeTruthy());
      fireEvent.press(getByText('NEXT'));
      fireEvent.press(getByText('NEXT'));
      fireEvent.press(getByText('NEXT'));

      fireEvent.press(getByText('UPDATE RECIPE'));

      await waitFor(() => {
        expect(mockShowError).toHaveBeenCalledWith('Failed to save recipe. Please try again.');
      });
    });

    it('pre-fills ingredient data from existing recipe', async () => {
      const { getByText, getByPlaceholderText } = render(<ManualRecipeScreen />);

      // Navigate to ingredients step
      await waitFor(() => expect(getByText('NEXT')).toBeTruthy());
      fireEvent.press(getByText('NEXT'));

      await waitFor(() => {
        expect(getByText('INGREDIENTS')).toBeTruthy();
      });

      const ingredientInput = getByPlaceholderText('Ingredient name');
      expect(ingredientInput.props.value).toBe('Flour');
    });

    it('pre-fills nutrition data from existing recipe on step 4', async () => {
      const { getByText, getByDisplayValue } = render(<ManualRecipeScreen />);

      // Navigate through all steps
      await waitFor(() => expect(getByText('NEXT')).toBeTruthy());
      fireEvent.press(getByText('NEXT'));
      fireEvent.press(getByText('NEXT'));
      fireEvent.press(getByText('NEXT'));

      await waitFor(() => {
        expect(getByDisplayValue('350')).toBeTruthy(); // calories
        expect(getByDisplayValue('12')).toBeTruthy();  // protein
        expect(getByDisplayValue('45')).toBeTruthy();  // carbs
        expect(getByDisplayValue('8')).toBeTruthy();   // fat
        expect(getByDisplayValue('3')).toBeTruthy();   // fiber
        expect(getByDisplayValue('5')).toBeTruthy();   // sugar
        expect(getByDisplayValue('200')).toBeTruthy(); // sodium
      });
    });

    it('pre-fills step instructions from existing recipe', async () => {
      const { getByText, getByPlaceholderText } = render(<ManualRecipeScreen />);

      // Navigate to steps
      await waitFor(() => expect(getByText('NEXT')).toBeTruthy());
      fireEvent.press(getByText('NEXT'));
      fireEvent.press(getByText('NEXT'));

      await waitFor(() => {
        expect(getByText('COOKING STEPS')).toBeTruthy();
      });

      const stepInput = getByPlaceholderText('Describe this step...');
      expect(stepInput.props.value).toBe('Mix it all together');
    });
  });
});
