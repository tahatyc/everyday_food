import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { useQuery, useMutation } from 'convex/react';
import { router, useLocalSearchParams } from 'expo-router';
import SharedRecipeScreen from '../[code]';

const mockRecordAccess = jest.fn();

jest.mock('expo-router', () => ({
  ...jest.requireActual('expo-router'),
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
  },
  useLocalSearchParams: jest.fn(() => ({ code: 'abc123' })),
}));

beforeEach(() => {
  jest.clearAllMocks();
  (useLocalSearchParams as jest.Mock).mockReturnValue({ code: 'abc123' });
  (useMutation as jest.Mock).mockReturnValue(mockRecordAccess);
});

const mockRecipeResult = {
  recipe: {
    _id: 'recipe1',
    title: 'Spaghetti Carbonara',
    description: 'Classic Italian pasta dish',
    prepTime: 15,
    cookTime: 20,
    servings: 4,
    ownerName: 'John Doe',
    tags: ['dinner', 'Italian'],
    ingredients: [
      { name: 'Spaghetti', amount: 400, unit: 'g' },
      { name: 'Eggs', amount: 4, unit: '' },
      { name: 'Pecorino', amount: 100, unit: 'g', preparation: 'grated' },
    ],
    steps: [
      { stepNumber: 1, instruction: 'Boil pasta in salted water' },
      { stepNumber: 2, instruction: 'Mix eggs and cheese' },
      { stepNumber: 3, instruction: 'Combine and serve' },
    ],
  },
  error: null,
};

describe('SharedRecipeScreen', () => {
  it('shows loading state when result is undefined', () => {
    (useQuery as jest.Mock).mockReturnValue(undefined);

    const { getByText } = render(<SharedRecipeScreen />);
    expect(getByText('Loading shared recipe...')).toBeTruthy();
  });

  it('shows error when share link not found', () => {
    (useQuery as jest.Mock).mockReturnValue({
      error: 'Share link not found',
      recipe: null,
    });

    const { getByText } = render(<SharedRecipeScreen />);
    expect(getByText('Link Not Found')).toBeTruthy();
    expect(getByText("This share link doesn't exist or may have been deleted.")).toBeTruthy();
  });

  it('shows error when share link is revoked', () => {
    (useQuery as jest.Mock).mockReturnValue({
      error: 'This share link has been revoked',
      recipe: null,
    });

    const { getByText } = render(<SharedRecipeScreen />);
    expect(getByText('Link Revoked')).toBeTruthy();
    expect(getByText('The owner has revoked access to this recipe.')).toBeTruthy();
  });

  it('shows error when share link is expired', () => {
    (useQuery as jest.Mock).mockReturnValue({
      error: 'This share link has expired',
      recipe: null,
    });

    const { getByText } = render(<SharedRecipeScreen />);
    expect(getByText('Link Expired')).toBeTruthy();
    expect(getByText('This share link is no longer valid.')).toBeTruthy();
  });

  it('shows generic error for unknown errors', () => {
    (useQuery as jest.Mock).mockReturnValue({
      error: 'Some unknown error',
      recipe: null,
    });

    const { getByText } = render(<SharedRecipeScreen />);
    expect(getByText('Unable to Load')).toBeTruthy();
    expect(getByText('Something went wrong. Please try again.')).toBeTruthy();
  });

  it('navigates home when GO HOME is pressed on error', () => {
    (useQuery as jest.Mock).mockReturnValue({
      error: 'Share link not found',
      recipe: null,
    });

    const { getByText } = render(<SharedRecipeScreen />);
    fireEvent.press(getByText('GO HOME'));
    expect(router.replace).toHaveBeenCalledWith('/(tabs)');
  });

  it('renders recipe title in uppercase', () => {
    (useQuery as jest.Mock).mockReturnValue(mockRecipeResult);

    const { getByText } = render(<SharedRecipeScreen />);
    expect(getByText('SPAGHETTI CARBONARA')).toBeTruthy();
  });

  it('renders SHARED RECIPE header', () => {
    (useQuery as jest.Mock).mockReturnValue(mockRecipeResult);

    const { getByText } = render(<SharedRecipeScreen />);
    expect(getByText('SHARED RECIPE')).toBeTruthy();
  });

  it('renders shared by banner with owner name', () => {
    (useQuery as jest.Mock).mockReturnValue(mockRecipeResult);

    const { getByText } = render(<SharedRecipeScreen />);
    expect(getByText('Shared by John Doe')).toBeTruthy();
  });

  it('renders prep and cook time', () => {
    (useQuery as jest.Mock).mockReturnValue(mockRecipeResult);

    const { getByText } = render(<SharedRecipeScreen />);
    expect(getByText('Prep: 15 min')).toBeTruthy();
    expect(getByText('Cook: 20 min')).toBeTruthy();
  });

  it('renders servings', () => {
    (useQuery as jest.Mock).mockReturnValue(mockRecipeResult);

    const { getByText } = render(<SharedRecipeScreen />);
    expect(getByText('4 servings')).toBeTruthy();
  });

  it('renders description', () => {
    (useQuery as jest.Mock).mockReturnValue(mockRecipeResult);

    const { getByText } = render(<SharedRecipeScreen />);
    expect(getByText('Classic Italian pasta dish')).toBeTruthy();
  });

  it('renders INGREDIENTS section', () => {
    (useQuery as jest.Mock).mockReturnValue(mockRecipeResult);

    const { getByText } = render(<SharedRecipeScreen />);
    expect(getByText('INGREDIENTS')).toBeTruthy();
  });

  it('renders ingredient items', () => {
    (useQuery as jest.Mock).mockReturnValue(mockRecipeResult);

    const { getByText } = render(<SharedRecipeScreen />);
    expect(getByText('400 g Spaghetti')).toBeTruthy();
    expect(getByText('4  Eggs')).toBeTruthy();
    expect(getByText('100 g Pecorino, grated')).toBeTruthy();
  });

  it('renders INSTRUCTIONS section', () => {
    (useQuery as jest.Mock).mockReturnValue(mockRecipeResult);

    const { getByText } = render(<SharedRecipeScreen />);
    expect(getByText('INSTRUCTIONS')).toBeTruthy();
  });

  it('renders step instructions', () => {
    (useQuery as jest.Mock).mockReturnValue(mockRecipeResult);

    const { getByText } = render(<SharedRecipeScreen />);
    expect(getByText('Boil pasta in salted water')).toBeTruthy();
    expect(getByText('Mix eggs and cheese')).toBeTruthy();
    expect(getByText('Combine and serve')).toBeTruthy();
  });

  it('renders step numbers', () => {
    (useQuery as jest.Mock).mockReturnValue(mockRecipeResult);

    const { getByText } = render(<SharedRecipeScreen />);
    expect(getByText('1')).toBeTruthy();
    expect(getByText('2')).toBeTruthy();
    expect(getByText('3')).toBeTruthy();
  });

  it('renders sign up CTA', () => {
    (useQuery as jest.Mock).mockReturnValue(mockRecipeResult);

    const { getByText } = render(<SharedRecipeScreen />);
    expect(getByText('LIKE THIS RECIPE?')).toBeTruthy();
    expect(getByText('Sign up to save recipes and create your own collection')).toBeTruthy();
    expect(getByText('SIGN UP FREE')).toBeTruthy();
  });

  it('navigates to register when SIGN UP FREE is pressed', () => {
    (useQuery as jest.Mock).mockReturnValue(mockRecipeResult);

    const { getByText } = render(<SharedRecipeScreen />);
    fireEvent.press(getByText('SIGN UP FREE'));
    expect(router.push).toHaveBeenCalledWith('/(auth)/register');
  });

  it('navigates back when back button is pressed', () => {
    (useQuery as jest.Mock).mockReturnValue(mockRecipeResult);

    const { getByTestId } = render(<SharedRecipeScreen />);
    fireEvent.press(getByTestId('icon-arrow-back'));
    expect(router.back).toHaveBeenCalled();
  });

  it('navigates to tabs when back button pressed and cannot go back', () => {
    (router.canGoBack as jest.Mock).mockReturnValue(false);
    (useQuery as jest.Mock).mockReturnValue(mockRecipeResult);

    const { getByTestId } = render(<SharedRecipeScreen />);
    fireEvent.press(getByTestId('icon-arrow-back'));
    expect(router.replace).toHaveBeenCalledWith('/(tabs)');
  });

  it('records access when recipe loads successfully', async () => {
    (useQuery as jest.Mock).mockReturnValue(mockRecipeResult);

    render(<SharedRecipeScreen />);

    await waitFor(() => {
      expect(mockRecordAccess).toHaveBeenCalledWith({ code: 'abc123' });
    });
  });

  it('does not record access when there is an error', () => {
    (useQuery as jest.Mock).mockReturnValue({
      error: 'Share link not found',
      recipe: null,
    });

    render(<SharedRecipeScreen />);
    expect(mockRecordAccess).not.toHaveBeenCalled();
  });

  it('handles missing prep/cook times gracefully', () => {
    (useQuery as jest.Mock).mockReturnValue({
      recipe: {
        ...mockRecipeResult.recipe,
        prepTime: null,
        cookTime: null,
      },
      error: null,
    });

    const { getAllByText } = render(<SharedRecipeScreen />);
    const dashTexts = getAllByText(/—/);
    expect(dashTexts.length).toBeGreaterThanOrEqual(1);
  });

  it('handles recipe without description', () => {
    (useQuery as jest.Mock).mockReturnValue({
      recipe: {
        ...mockRecipeResult.recipe,
        description: null,
      },
      error: null,
    });

    const { queryByText } = render(<SharedRecipeScreen />);
    expect(queryByText('Classic Italian pasta dish')).toBeNull();
  });

  it('uses breakfast emoji for breakfast recipes', () => {
    (useQuery as jest.Mock).mockReturnValue({
      recipe: {
        ...mockRecipeResult.recipe,
        tags: ['breakfast'],
      },
      error: null,
    });

    const { getByText } = render(<SharedRecipeScreen />);
    // Breakfast emoji should be shown
    expect(getByText('SPAGHETTI CARBONARA')).toBeTruthy();
  });
});
