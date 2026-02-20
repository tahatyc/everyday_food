import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { router, useLocalSearchParams } from 'expo-router';
import RecipeDetailScreen from '../[id]';

jest.spyOn(Alert, 'alert');

const mockToggleFavorite = jest.fn();
const mockToggleGlobalFavorite = jest.fn();
const mockAddToList = jest.fn();
const mockRecordView = jest.fn().mockResolvedValue(undefined);
const mockDeleteRecipe = jest.fn();

jest.mock('expo-router', () => ({
  ...jest.requireActual('expo-router'),
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  },
  useLocalSearchParams: jest.fn(() => ({ id: 'recipe1' })),
}));

const noopFn = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mockToggleFavorite.mockReset();
  mockToggleGlobalFavorite.mockReset();
  mockAddToList.mockReset();
  mockRecordView.mockReset().mockResolvedValue(undefined);
  mockDeleteRecipe.mockReset();
  (useLocalSearchParams as jest.Mock).mockReturnValue({ id: 'recipe1' });
  // Default return [] for ShareRecipeModal's useQuery calls (friends, sharedWith)
  (useQuery as jest.Mock).mockReturnValue([]);
  // RecipeDetailScreen mutations: toggleFavorite(1), toggleGlobalFavorite(2), addToList(3),
  //   recordView(4), deleteRecipe(5)
  // ShareRecipeModal mutations: shareWithFriend(6), unshare(7)
  let mutationCallCount = 0;
  (useMutation as jest.Mock).mockImplementation(() => {
    mutationCallCount++;
    const idx = ((mutationCallCount - 1) % 7) + 1;
    if (idx === 1) return mockToggleFavorite;
    if (idx === 2) return mockToggleGlobalFavorite;
    if (idx === 3) return mockAddToList;
    if (idx === 4) return mockRecordView;
    if (idx === 5) return mockDeleteRecipe;
    return noopFn;
  });
});

const mockRecipe = {
  _id: 'recipe1',
  title: 'Spaghetti Carbonara',
  description: 'Classic Italian pasta',
  prepTime: 15,
  cookTime: 20,
  servings: 4,
  isFavorite: false,
  isOwner: true,
  ownerName: 'John',
  sourceUrl: null,
  tags: ['dinner', 'Italian'],
  nutritionPerServing: {
    calories: 550,
    protein: 25,
    carbs: 60,
    fat: 22,
  },
  ingredients: [
    { _id: 'ing1', name: 'Spaghetti', amount: 400, unit: 'g', sortOrder: 0 },
    { _id: 'ing2', name: 'Eggs', amount: 4, unit: '', sortOrder: 1 },
    { _id: 'ing3', name: 'Pecorino', amount: 100, unit: 'g', preparation: 'grated', sortOrder: 2 },
  ],
  steps: [
    { stepNumber: 1, instruction: 'Boil pasta' },
    { stepNumber: 2, instruction: 'Mix eggs and cheese' },
  ],
};

/** Helper: mock useQuery to return recipe data for first call, [] for the rest.
 * Uses mockImplementation to persist across re-renders. */
function mockRecipeQuery(recipe: any) {
  let callCount = 0;
  (useQuery as jest.Mock).mockImplementation(() => {
    callCount++;
    // Every 3rd call starting from 1 is api.recipes.getById
    // Calls 2,3 are ShareRecipeModal queries (friends, sharedWith)
    if (callCount % 3 === 1) return recipe;
    return [];
  });
}

describe('RecipeDetailScreen', () => {
  it('shows loading state when recipe is undefined', () => {
    (useQuery as jest.Mock).mockReturnValueOnce(undefined);

    const { getByText } = render(<RecipeDetailScreen />);
    expect(getByText('Loading recipe...')).toBeTruthy();
  });

  it('shows error state when recipe is null', () => {
    (useQuery as jest.Mock).mockReturnValueOnce(null);

    const { getByText } = render(<RecipeDetailScreen />);
    expect(getByText('Recipe not found')).toBeTruthy();
    expect(getByText('Go Back')).toBeTruthy();
  });

  it('navigates back from error state', () => {
    (useQuery as jest.Mock).mockReturnValueOnce(null);

    const { getByText } = render(<RecipeDetailScreen />);
    fireEvent.press(getByText('Go Back'));
    expect(router.back).toHaveBeenCalled();
  });

  it('renders recipe title in uppercase', () => {
    mockRecipeQuery(mockRecipe);

    const { getByText } = render(<RecipeDetailScreen />);
    expect(getByText('SPAGHETTI CARBONARA')).toBeTruthy();
  });

  it('renders recipe header with RECIPE text', () => {
    mockRecipeQuery(mockRecipe);

    const { getByText } = render(<RecipeDetailScreen />);
    expect(getByText('RECIPE')).toBeTruthy();
  });

  it('renders prep and cook time', () => {
    mockRecipeQuery(mockRecipe);

    const { getByText } = render(<RecipeDetailScreen />);
    expect(getByText('Prep: 15 min')).toBeTruthy();
    expect(getByText('Cook: 20 min')).toBeTruthy();
  });

  it('renders servings', () => {
    mockRecipeQuery(mockRecipe);

    const { getByText } = render(<RecipeDetailScreen />);
    expect(getByText('4 servings')).toBeTruthy();
  });

  it('renders nutrition data', () => {
    mockRecipeQuery(mockRecipe);

    const { getByText } = render(<RecipeDetailScreen />);
    expect(getByText('CALORIES')).toBeTruthy();
    expect(getByText('PROTEIN')).toBeTruthy();
    expect(getByText('CARBS')).toBeTruthy();
    expect(getByText('FATS')).toBeTruthy();
    expect(getByText(/550/)).toBeTruthy();
    expect(getByText(/25/)).toBeTruthy();
    expect(getByText(/60/)).toBeTruthy();
    expect(getByText(/22/)).toBeTruthy();
  });

  it('renders START COOKING button', () => {
    mockRecipeQuery(mockRecipe);

    const { getByText } = render(<RecipeDetailScreen />);
    expect(getByText('START COOKING')).toBeTruthy();
  });

  it('navigates to cook mode when START COOKING is pressed', () => {
    mockRecipeQuery(mockRecipe);

    const { getByText } = render(<RecipeDetailScreen />);
    fireEvent.press(getByText('START COOKING'));
    expect(router.push).toHaveBeenCalledWith('/cook-mode/recipe1');
  });

  it('renders ingredients section', () => {
    mockRecipeQuery(mockRecipe);

    const { getByText } = render(<RecipeDetailScreen />);
    expect(getByText('INGREDIENTS')).toBeTruthy();
    expect(getByText('0/3')).toBeTruthy();
  });

  it('renders ingredient items', () => {
    mockRecipeQuery(mockRecipe);

    const { getByText } = render(<RecipeDetailScreen />);
    expect(getByText('400 g Spaghetti')).toBeTruthy();
    expect(getByText('4  Eggs')).toBeTruthy();
    expect(getByText('100 g Pecorino, grated')).toBeTruthy();
  });

  it('toggles ingredient checked state', () => {
    mockRecipeQuery(mockRecipe);

    const { getByText } = render(<RecipeDetailScreen />);
    fireEvent.press(getByText('400 g Spaghetti'));
    expect(getByText('1/3')).toBeTruthy();
  });

  it('navigates back when back button is pressed', () => {
    mockRecipeQuery(mockRecipe);

    const { getByTestId } = render(<RecipeDetailScreen />);
    fireEvent.press(getByTestId('icon-arrow-back'));
    expect(router.back).toHaveBeenCalled();
  });

  it('shows share button when user is owner', () => {
    mockRecipeQuery(mockRecipe);

    const { getByTestId } = render(<RecipeDetailScreen />);
    expect(getByTestId('icon-share-outline')).toBeTruthy();
  });

  it('shows edit button when user is owner', () => {
    mockRecipeQuery(mockRecipe);

    const { getByTestId } = render(<RecipeDetailScreen />);
    expect(getByTestId('icon-pencil-outline')).toBeTruthy();
  });

  it('shows delete button when user is owner', () => {
    mockRecipeQuery(mockRecipe);

    const { getByTestId } = render(<RecipeDetailScreen />);
    expect(getByTestId('icon-trash-outline')).toBeTruthy();
  });

  it('navigates to edit screen when edit button is pressed', () => {
    mockRecipeQuery(mockRecipe);

    const { getByTestId } = render(<RecipeDetailScreen />);
    fireEvent.press(getByTestId('icon-pencil-outline'));
    expect(router.push).toHaveBeenCalledWith('/manual-recipe?recipeId=recipe1');
  });

  it('shows delete confirmation alert when delete button is pressed', () => {
    mockRecipeQuery(mockRecipe);

    const { getByTestId } = render(<RecipeDetailScreen />);
    fireEvent.press(getByTestId('icon-trash-outline'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Delete Recipe',
      'Are you sure you want to delete this recipe? This action cannot be undone.',
      expect.arrayContaining([
        expect.objectContaining({ text: 'Cancel' }),
        expect.objectContaining({ text: 'Delete', style: 'destructive' }),
      ])
    );
  });

  it('calls deleteRecipe and navigates back when delete is confirmed', async () => {
    mockDeleteRecipe.mockResolvedValue({ success: true });
    mockRecipeQuery(mockRecipe);

    const { getByTestId } = render(<RecipeDetailScreen />);
    fireEvent.press(getByTestId('icon-trash-outline'));

    const alertButtons = (Alert.alert as jest.Mock).mock.calls[0][2];
    const deleteButton = alertButtons.find((b: any) => b.text === 'Delete');

    await act(async () => {
      await deleteButton.onPress();
    });

    expect(mockDeleteRecipe).toHaveBeenCalledWith({ recipeId: 'recipe1' });
    expect(router.back).toHaveBeenCalled();
  });

  it('shows error alert when delete fails', async () => {
    mockDeleteRecipe.mockRejectedValue(new Error('Network error'));
    mockRecipeQuery(mockRecipe);

    const { getByTestId } = render(<RecipeDetailScreen />);
    fireEvent.press(getByTestId('icon-trash-outline'));

    const alertButtons = (Alert.alert as jest.Mock).mock.calls[0][2];
    const deleteButton = alertButtons.find((b: any) => b.text === 'Delete');

    await act(async () => {
      await deleteButton.onPress();
    });

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Failed to delete recipe. Please try again.'
      );
    });
  });

  it('does not show edit/delete buttons for non-owners', () => {
    mockRecipeQuery({ ...mockRecipe, isOwner: false, ownerName: 'Alice' });

    const { queryByTestId } = render(<RecipeDetailScreen />);
    expect(queryByTestId('icon-pencil-outline')).toBeNull();
    expect(queryByTestId('icon-trash-outline')).toBeNull();
  });

  it('shows shared badge when user is not owner', () => {
    mockRecipeQuery({
      ...mockRecipe,
      isOwner: false,
      ownerName: 'Alice',
    });

    const { getByText } = render(<RecipeDetailScreen />);
    expect(getByText('Shared by Alice')).toBeTruthy();
  });

  it('toggles favorite state when heart is pressed', async () => {
    mockToggleFavorite.mockResolvedValue({ isFavorite: true });
    mockRecipeQuery(mockRecipe);

    const { getByTestId } = render(<RecipeDetailScreen />);
    fireEvent.press(getByTestId('icon-heart-outline'));

    await waitFor(() => {
      expect(mockToggleFavorite).toHaveBeenCalledWith({ recipeId: 'recipe1' });
    });
  });

  it('shows source badge when recipe has sourceUrl', () => {
    mockRecipeQuery({
      ...mockRecipe,
      sourceUrl: 'https://instagram.com/recipe123',
    });

    const { getByText } = render(<RecipeDetailScreen />);
    expect(getByText('INSTAGRAM IMPORT')).toBeTruthy();
  });

  it('uses toggleGlobalRecipeFavorite for global recipes', async () => {
    mockToggleGlobalFavorite.mockResolvedValue({ isFavorite: true });
    mockRecipeQuery({
      ...mockRecipe,
      isGlobal: true,
      isOwner: false,
      ownerName: 'System',
    });

    const { getByTestId } = render(<RecipeDetailScreen />);
    fireEvent.press(getByTestId('icon-heart-outline'));

    await waitFor(() => {
      expect(mockToggleGlobalFavorite).toHaveBeenCalledWith({ recipeId: 'recipe1' });
      expect(mockToggleFavorite).not.toHaveBeenCalled();
    });
  });

  it('uses toggleFavorite for non-global recipes', async () => {
    mockToggleFavorite.mockResolvedValue({ isFavorite: true });
    mockRecipeQuery(mockRecipe);

    const { getByTestId } = render(<RecipeDetailScreen />);
    fireEvent.press(getByTestId('icon-heart-outline'));

    await waitFor(() => {
      expect(mockToggleFavorite).toHaveBeenCalledWith({ recipeId: 'recipe1' });
      expect(mockToggleGlobalFavorite).not.toHaveBeenCalled();
    });
  });
});
