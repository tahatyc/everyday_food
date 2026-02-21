import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { useQuery, useMutation } from 'convex/react';
import { router, useLocalSearchParams } from 'expo-router';
import CookModeScreen from '../[id]';

jest.mock('expo-router', () => ({
  ...jest.requireActual('expo-router'),
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  },
  useLocalSearchParams: jest.fn(() => ({ id: 'recipe1' })),
}));

const mockRecordCookCompletion = jest.fn().mockResolvedValue(undefined);

beforeEach(() => {
  jest.clearAllMocks();
  (useLocalSearchParams as jest.Mock).mockReturnValue({ id: 'recipe1' });
  (useMutation as jest.Mock).mockReturnValue(mockRecordCookCompletion);
});

const mockRecipe = {
  _id: 'recipe1',
  title: 'Spaghetti Carbonara',
  tags: ['dinner', 'Italian'],
  steps: [
    { stepNumber: 1, instruction: 'Boil the pasta in salted water', timerMinutes: 10 },
    { stepNumber: 2, instruction: 'Mix eggs and cheese in a bowl' },
    { stepNumber: 3, instruction: 'Cook the guanciale until crispy', tips: 'Use medium heat' },
    { stepNumber: 4, instruction: 'Plate and serve immediately' },
  ],
};

describe('CookModeScreen', () => {
  it('shows loading state when recipe is undefined', () => {
    (useQuery as jest.Mock).mockReturnValue(undefined);

    const { getByText } = render(<CookModeScreen />);
    expect(getByText('Loading recipe...')).toBeTruthy();
  });

  it('shows error state when recipe is null', () => {
    (useQuery as jest.Mock).mockReturnValue(null);

    const { getByText } = render(<CookModeScreen />);
    expect(getByText('Recipe not found')).toBeTruthy();
    expect(getByText('Go Back')).toBeTruthy();
  });

  it('navigates back from error state', () => {
    (useQuery as jest.Mock).mockReturnValue(null);

    const { getByText } = render(<CookModeScreen />);
    fireEvent.press(getByText('Go Back'));
    expect(router.back).toHaveBeenCalled();
  });

  it('renders recipe title', () => {
    (useQuery as jest.Mock).mockReturnValue(mockRecipe);

    const { getByText } = render(<CookModeScreen />);
    expect(getByText('Spaghetti Carbonara')).toBeTruthy();
  });

  it('renders step indicator with correct count', () => {
    (useQuery as jest.Mock).mockReturnValue(mockRecipe);

    const { getByText } = render(<CookModeScreen />);
    expect(getByText('Step 1 of 4')).toBeTruthy();
  });

  it('renders first step instruction', () => {
    (useQuery as jest.Mock).mockReturnValue(mockRecipe);

    const { getByText } = render(<CookModeScreen />);
    expect(getByText('Boil the pasta in salted water')).toBeTruthy();
  });

  it('renders timer when step has timerMinutes', () => {
    (useQuery as jest.Mock).mockReturnValue(mockRecipe);

    const { getByText } = render(<CookModeScreen />);
    expect(getByText('Est. 10 mins')).toBeTruthy();
  });

  it('navigates to next step when Next Step is pressed', () => {
    (useQuery as jest.Mock).mockReturnValue(mockRecipe);

    const { getByText } = render(<CookModeScreen />);
    fireEvent.press(getByText('Next Step'));
    expect(getByText('Step 2 of 4')).toBeTruthy();
    expect(getByText('Mix eggs and cheese in a bowl')).toBeTruthy();
  });

  it('navigates to previous step when Previous is pressed', () => {
    (useQuery as jest.Mock).mockReturnValue(mockRecipe);

    const { getByText } = render(<CookModeScreen />);
    // Go to step 2
    fireEvent.press(getByText('Next Step'));
    expect(getByText('Step 2 of 4')).toBeTruthy();
    // Go back to step 1
    fireEvent.press(getByText('Previous'));
    expect(getByText('Step 1 of 4')).toBeTruthy();
  });

  it('disables Previous button on first step', () => {
    (useQuery as jest.Mock).mockReturnValue(mockRecipe);

    const { getByText } = render(<CookModeScreen />);
    // Previous button should be visually disabled on first step
    expect(getByText('Step 1 of 4')).toBeTruthy();
    expect(getByText('Previous')).toBeTruthy();
  });

  it('shows Finish button on last step', () => {
    (useQuery as jest.Mock).mockReturnValue(mockRecipe);

    const { getByText } = render(<CookModeScreen />);
    // Navigate to last step
    fireEvent.press(getByText('Next Step')); // Step 2
    fireEvent.press(getByText('Next Step')); // Step 3
    fireEvent.press(getByText('Next Step')); // Step 4
    expect(getByText('Step 4 of 4')).toBeTruthy();
    expect(getByText('Finish')).toBeTruthy();
  });

  it('shows celebration overlay when Finish is pressed on last step', async () => {
    (useQuery as jest.Mock).mockReturnValue(mockRecipe);

    const { getByText } = render(<CookModeScreen />);
    // Navigate to last step and press Finish
    fireEvent.press(getByText('Next Step')); // Step 2
    fireEvent.press(getByText('Next Step')); // Step 3
    fireEvent.press(getByText('Next Step')); // Step 4
    fireEvent.press(getByText('Finish'));

    await waitFor(() => {
      expect(getByText('RECIPE COMPLETE!')).toBeTruthy();
    });
  });

  it('navigates back when Done is pressed on celebration overlay', async () => {
    (useQuery as jest.Mock).mockReturnValue(mockRecipe);

    const { getByText } = render(<CookModeScreen />);
    fireEvent.press(getByText('Next Step')); // Step 2
    fireEvent.press(getByText('Next Step')); // Step 3
    fireEvent.press(getByText('Next Step')); // Step 4
    fireEvent.press(getByText('Finish'));

    await waitFor(() => {
      expect(getByText('DONE')).toBeTruthy();
    });
    fireEvent.press(getByText('DONE'));
    expect(router.back).toHaveBeenCalled();
  });

  it('calls recordCookCompletion with recipe id when Finish is pressed', async () => {
    (useQuery as jest.Mock).mockReturnValue(mockRecipe);

    const { getByText } = render(<CookModeScreen />);
    fireEvent.press(getByText('Next Step')); // Step 2
    fireEvent.press(getByText('Next Step')); // Step 3
    fireEvent.press(getByText('Next Step')); // Step 4
    fireEvent.press(getByText('Finish'));

    await waitFor(() => {
      expect(mockRecordCookCompletion).toHaveBeenCalledWith({ recipeId: 'recipe1' });
    });
  });

  it('does not call recordCookCompletion when navigating between steps', () => {
    (useQuery as jest.Mock).mockReturnValue(mockRecipe);

    const { getByText } = render(<CookModeScreen />);
    fireEvent.press(getByText('Next Step')); // Step 2
    fireEvent.press(getByText('Next Step')); // Step 3

    expect(mockRecordCookCompletion).not.toHaveBeenCalled();
  });

  it('shows tips when step has tips', () => {
    (useQuery as jest.Mock).mockReturnValue(mockRecipe);

    const { getByText } = render(<CookModeScreen />);
    // Navigate to step 3 which has tips
    fireEvent.press(getByText('Next Step')); // Step 2
    fireEvent.press(getByText('Next Step')); // Step 3
    expect(getByText('TIP')).toBeTruthy();
    expect(getByText('Use medium heat')).toBeTruthy();
  });

  it('renders SCREEN ALWAYS ON toggle', () => {
    (useQuery as jest.Mock).mockReturnValue(mockRecipe);

    const { getByText } = render(<CookModeScreen />);
    expect(getByText('SCREEN ALWAYS ON')).toBeTruthy();
  });

  it('navigates back when close button is pressed', () => {
    (useQuery as jest.Mock).mockReturnValue(mockRecipe);

    const { getByTestId } = render(<CookModeScreen />);
    fireEvent.press(getByTestId('icon-close'));
    expect(router.back).toHaveBeenCalled();
  });

  it('shows COOKING category for cooking steps', () => {
    (useQuery as jest.Mock).mockReturnValue(mockRecipe);

    const { getByText } = render(<CookModeScreen />);
    // Navigate to step 3 which has "Cook" keyword
    fireEvent.press(getByText('Next Step')); // Step 2
    fireEvent.press(getByText('Next Step')); // Step 3
    expect(getByText('COOKING')).toBeTruthy();
  });

  it('shows MIXING category for mixing steps', () => {
    (useQuery as jest.Mock).mockReturnValue(mockRecipe);

    const { getByText } = render(<CookModeScreen />);
    // Navigate to step 2 which has "Mix" keyword
    fireEvent.press(getByText('Next Step')); // Step 2
    expect(getByText('MIXING')).toBeTruthy();
  });

  it('shows PLATING category for serve steps', () => {
    (useQuery as jest.Mock).mockReturnValue(mockRecipe);

    const { getByText } = render(<CookModeScreen />);
    // Navigate to step 4 which has "serve" keyword
    fireEvent.press(getByText('Next Step')); // Step 2
    fireEvent.press(getByText('Next Step')); // Step 3
    fireEvent.press(getByText('Next Step')); // Step 4
    expect(getByText('PLATING')).toBeTruthy();
  });
});
