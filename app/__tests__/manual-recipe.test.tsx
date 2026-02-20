import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { useMutation, useQuery } from 'convex/react';
import { router, useLocalSearchParams } from 'expo-router';
import ManualRecipeScreen from '../manual-recipe';

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
  (useLocalSearchParams as jest.Mock).mockReturnValue({});
  (useQuery as jest.Mock).mockReturnValue(undefined);
  // Cycle between createManual (odd calls) and updateManual (even calls)
  // so re-renders always return the correct mock regardless of render count.
  let mutationCallCount = 0;
  (useMutation as jest.Mock).mockImplementation(() => {
    mutationCallCount++;
    return mutationCallCount % 2 === 1 ? mockCreateRecipe : mockUpdateRecipe;
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

  it('shows error alert when save fails', async () => {
    mockCreateRecipe.mockRejectedValue(new Error('Network error'));

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
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to save recipe. Please try again.');
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

  describe('Edit mode', () => {
    beforeEach(() => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({ recipeId: 'recipe1' });
      (useQuery as jest.Mock).mockReturnValue(mockExistingRecipe);
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

    it('shows error alert when update fails', async () => {
      mockUpdateRecipe.mockRejectedValue(new Error('Network error'));

      const { getByText } = render(<ManualRecipeScreen />);

      await waitFor(() => expect(getByText('NEXT')).toBeTruthy());
      fireEvent.press(getByText('NEXT'));
      fireEvent.press(getByText('NEXT'));
      fireEvent.press(getByText('NEXT'));

      fireEvent.press(getByText('UPDATE RECIPE'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to save recipe. Please try again.');
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
