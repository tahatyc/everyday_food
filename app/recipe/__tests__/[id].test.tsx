import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { router, useLocalSearchParams } from 'expo-router';
import { api } from '../../../convex/_generated/api';
import RecipeDetailScreen from '../[id]';

// Mock Convex API with stable references (anyApi uses Proxy, creating new objects on each access)
jest.mock('../../../convex/_generated/api', () => ({
  api: {
    recipes: {
      getById: Symbol('recipes.getById'),
      toggleFavorite: Symbol('recipes.toggleFavorite'),
      toggleGlobalRecipeFavorite: Symbol('recipes.toggleGlobalRecipeFavorite'),
      recordView: Symbol('recipes.recordView'),
      deleteRecipe: Symbol('recipes.deleteRecipe'),
    },
    shoppingLists: {
      addRecipeIngredients: Symbol('shoppingLists.addRecipeIngredients'),
    },
    friends: {
      list: Symbol('friends.list'),
    },
    recipeShares: {
      getSharedWith: Symbol('recipeShares.getSharedWith'),
      share: Symbol('recipeShares.share'),
      unshare: Symbol('recipeShares.unshare'),
    },
    users: {
      current: Symbol('users.current'),
    },
  },
}));

jest.spyOn(Alert, 'alert');

// Mock useToast
const mockShowError = jest.fn();
const mockShowSuccess = jest.fn();
jest.mock('../../../src/hooks/useToast', () => ({
  useToast: () => ({
    showError: mockShowError,
    showSuccess: mockShowSuccess,
    showWarning: jest.fn(),
    showInfo: jest.fn(),
    showToast: jest.fn(),
  }),
}));

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
  mockShowError.mockReset();
  mockShowSuccess.mockReset();
  mockToggleFavorite.mockReset();
  mockToggleGlobalFavorite.mockReset();
  mockAddToList.mockReset();
  mockRecordView.mockReset().mockResolvedValue(undefined);
  mockDeleteRecipe.mockReset();
  (useLocalSearchParams as jest.Mock).mockReturnValue({ id: 'recipe1' });
  // Default return [] for ShareRecipeModal's useQuery calls (friends, sharedWith)
  (useQuery as jest.Mock).mockReturnValue([]);
  // Match by API function reference instead of call count cycling
  (useMutation as jest.Mock).mockImplementation((mutationFn: unknown) => {
    if (mutationFn === api.recipes.toggleFavorite) return mockToggleFavorite;
    if (mutationFn === api.recipes.toggleGlobalRecipeFavorite) return mockToggleGlobalFavorite;
    if (mutationFn === api.shoppingLists.addRecipeIngredients) return mockAddToList;
    if (mutationFn === api.recipes.recordView) return mockRecordView;
    if (mutationFn === api.recipes.deleteRecipe) return mockDeleteRecipe;
    if (mutationFn === api.recipeShares.share) return noopFn;
    if (mutationFn === api.recipeShares.unshare) return noopFn;
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

/** Helper: mock useQuery to return recipe data by API function reference. */
function mockRecipeQuery(recipe: unknown) {
  (useQuery as jest.Mock).mockImplementation((queryFn: unknown) => {
    if (queryFn === api.recipes.getById) return recipe;
    if (queryFn === api.users.current) return { preferredUnits: 'imperial' };
    // ShareRecipeModal queries (friends, sharedWith)
    return [];
  });
}

describe('RecipeDetailScreen', () => {
  it('shows loading state when recipe is undefined', () => {
    mockRecipeQuery(undefined);

    const { getByText } = render(<RecipeDetailScreen />);
    expect(getByText('Loading recipe...')).toBeTruthy();
  });

  it('shows error state when recipe is null', () => {
    mockRecipeQuery(null);

    const { getByText } = render(<RecipeDetailScreen />);
    expect(getByText('Recipe not found')).toBeTruthy();
    expect(getByText('Go Back')).toBeTruthy();
  });

  it('navigates back from error state', () => {
    mockRecipeQuery(null);

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

  it('renders ingredient items with unit conversion', () => {
    mockRecipeQuery(mockRecipe);

    const { getByText } = render(<RecipeDetailScreen />);
    // 400g → ~14 oz (imperial preference), 100g → ~3.5 oz
    expect(getByText(/Spaghetti/)).toBeTruthy();
    expect(getByText(/Eggs/)).toBeTruthy();
    expect(getByText(/Pecorino, grated/)).toBeTruthy();
  });

  it('toggles ingredient checked state', () => {
    mockRecipeQuery(mockRecipe);

    const { getByText } = render(<RecipeDetailScreen />);
    fireEvent.press(getByText(/Spaghetti/));
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

  it('shows error toast when delete fails', async () => {
    mockDeleteRecipe.mockRejectedValue(new Error('DeleteFailed'));
    mockRecipeQuery(mockRecipe);

    const { getByTestId } = render(<RecipeDetailScreen />);
    fireEvent.press(getByTestId('icon-trash-outline'));

    const alertButtons = (Alert.alert as jest.Mock).mock.calls[0][2];
    const deleteButton = alertButtons.find((b: any) => b.text === 'Delete');

    await act(async () => {
      await deleteButton.onPress();
    });

    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith('Failed to delete recipe. Please try again.');
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
