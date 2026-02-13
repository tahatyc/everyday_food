import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { useMutation } from 'convex/react';
import { router } from 'expo-router';
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
  useLocalSearchParams: () => ({}),
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

beforeEach(() => {
  jest.clearAllMocks();
  (useMutation as jest.Mock).mockReturnValue(mockCreateRecipe);
});

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
});
