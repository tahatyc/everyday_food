import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { useQuery } from 'convex/react';
import { router } from 'expo-router';
import HomeScreen from '../index';

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state when data is undefined', () => {
    (useQuery as jest.Mock).mockReturnValue(undefined);

    const { getByText } = render(<HomeScreen />);
    expect(getByText('Loading...')).toBeTruthy();
  });

  it('renders header with greeting', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce([]) // recentlyViewed
      .mockReturnValueOnce([]); // todaysMealPlans

    const { getByText } = render(<HomeScreen />);
    expect(getByText('HELLO, CHEF!')).toBeTruthy();
  });

  it('renders import recipe button', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce([])
      .mockReturnValueOnce([]);

    const { getByText } = render(<HomeScreen />);
    expect(getByText('IMPORT RECIPE')).toBeTruthy();
  });

  it('navigates to import screen when import button is pressed', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce([])
      .mockReturnValueOnce([]);

    const { getByText } = render(<HomeScreen />);
    fireEvent.press(getByText('IMPORT RECIPE'));
    expect(router.push).toHaveBeenCalledWith('/import');
  });

  it("renders today's meals section", () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce([])
      .mockReturnValueOnce([]);

    const { getByText } = render(<HomeScreen />);
    expect(getByText("TODAY'S MEALS")).toBeTruthy();
  });

  it('renders three meal slots (breakfast, lunch, dinner)', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce([])
      .mockReturnValueOnce([]);

    const { getByText } = render(<HomeScreen />);
    expect(getByText('BREAKFAST')).toBeTruthy();
    expect(getByText('LUNCH')).toBeTruthy();
    expect(getByText('DINNER')).toBeTruthy();
  });

  it('shows placeholder text for empty meal slots', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce([])
      .mockReturnValueOnce([]);

    const { getAllByText } = render(<HomeScreen />);
    const placeholders = getAllByText('Tap to add a meal');
    expect(placeholders.length).toBe(3);
  });

  it('renders recent recipes section', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce([])
      .mockReturnValueOnce([]);

    const { getByText } = render(<HomeScreen />);
    expect(getByText('RECENT RECIPES')).toBeTruthy();
  });

  it('renders VIEW ALL link for recent recipes', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce([])
      .mockReturnValueOnce([]);

    const { getByText } = render(<HomeScreen />);
    expect(getByText('VIEW ALL')).toBeTruthy();
  });

  it('navigates to recipes tab when VIEW ALL is pressed', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce([])
      .mockReturnValueOnce([]);

    const { getByText } = render(<HomeScreen />);
    fireEvent.press(getByText('VIEW ALL'));
    expect(router.push).toHaveBeenCalledWith('/(tabs)/recipes');
  });

  it('renders recipe cards when recipes exist', () => {
    const mockRecipes = [
      {
        _id: 'recipe1',
        title: 'Pancakes',
        prepTime: 10,
        cookTime: 15,
        servings: 4,
        tags: ['breakfast'],
      },
    ];
    (useQuery as jest.Mock)
      .mockReturnValueOnce(mockRecipes)
      .mockReturnValueOnce([]);

    const { getByText } = render(<HomeScreen />);
    expect(getByText('Pancakes')).toBeTruthy();
    expect(getByText('25 MINS')).toBeTruthy();
  });

  it('renders meal plan data when meals are planned', () => {
    const mockMealPlans = [
      {
        mealType: 'breakfast',
        recipe: {
          _id: 'r1',
          title: 'French Toast',
          prepTime: 5,
          cookTime: 10,
          servings: 2,
          nutritionPerServing: { calories: 350, protein: 12, carbs: 45, fat: 14 },
          tags: ['breakfast'],
        },
      },
    ];
    (useQuery as jest.Mock)
      .mockReturnValueOnce([])
      .mockReturnValueOnce(mockMealPlans);

    const { getByText } = render(<HomeScreen />);
    expect(getByText('French Toast')).toBeTruthy();
  });

  it('shows current date in meals header', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce([])
      .mockReturnValueOnce([]);

    const { getByText } = render(<HomeScreen />);
    const now = new Date();
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const dateStr = `${months[now.getMonth()]} ${now.getDate()}`;
    expect(getByText(dateStr)).toBeTruthy();
  });

  // --- Issue 1: Empty meal slot navigation ---

  it('navigates to meal plan tab when an empty meal card is pressed', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce([])
      .mockReturnValueOnce([]);

    const { getAllByText } = render(<HomeScreen />);
    // Press the first empty placeholder
    fireEvent.press(getAllByText('Tap to add a meal')[0]);
    expect(router.push).toHaveBeenCalledWith('/(tabs)/meal-plan');
  });

  it('navigates to recipe detail when a single-recipe meal card is pressed', () => {
    const mockMealPlans = [
      {
        mealType: 'breakfast',
        recipe: { _id: 'r1', title: 'Oats', prepTime: 5, cookTime: 0, tags: [] },
      },
    ];
    (useQuery as jest.Mock)
      .mockReturnValueOnce([])
      .mockReturnValueOnce(mockMealPlans);

    const { getByText } = render(<HomeScreen />);
    fireEvent.press(getByText('Oats'));
    expect(router.push).toHaveBeenCalledWith('/recipe/r1');
  });

  // --- Issue 2: Multiple meals per type ---

  it('shows +N badge when a meal type has more than one recipe', () => {
    const mockMealPlans = [
      {
        mealType: 'breakfast',
        recipe: { _id: 'r1', title: 'Oats', prepTime: 5, cookTime: 0, tags: [] },
      },
      {
        mealType: 'breakfast',
        recipe: { _id: 'r2', title: 'Banana Pancakes', prepTime: 10, cookTime: 5, tags: [] },
      },
    ];
    (useQuery as jest.Mock)
      .mockReturnValueOnce([])
      .mockReturnValueOnce(mockMealPlans);

    const { getByText } = render(<HomeScreen />);
    expect(getByText('+1')).toBeTruthy();
  });

  it('navigates to meal plan tab when a multi-recipe meal card is pressed', () => {
    const mockMealPlans = [
      {
        mealType: 'lunch',
        recipe: { _id: 'r1', title: 'Salad', prepTime: 5, cookTime: 0, tags: [] },
      },
      {
        mealType: 'lunch',
        recipe: { _id: 'r2', title: 'Soup', prepTime: 10, cookTime: 15, tags: [] },
      },
    ];
    (useQuery as jest.Mock)
      .mockReturnValueOnce([])
      .mockReturnValueOnce(mockMealPlans);

    const { getByText } = render(<HomeScreen />);
    fireEvent.press(getByText('Salad'));
    expect(router.push).toHaveBeenCalledWith('/(tabs)/meal-plan');
  });

  it('shows the primary recipe title when multiple meals share the same type', () => {
    const mockMealPlans = [
      {
        mealType: 'dinner',
        recipe: { _id: 'r1', title: 'Pasta', prepTime: 10, cookTime: 20, tags: [] },
      },
      {
        mealType: 'dinner',
        recipe: { _id: 'r2', title: 'Steak', prepTime: 5, cookTime: 15, tags: [] },
      },
      {
        mealType: 'dinner',
        recipe: { _id: 'r3', title: 'Salad', prepTime: 5, cookTime: 0, tags: [] },
      },
    ];
    (useQuery as jest.Mock)
      .mockReturnValueOnce([])
      .mockReturnValueOnce(mockMealPlans);

    const { getByText } = render(<HomeScreen />);
    // First recipe shown as primary
    expect(getByText('Pasta')).toBeTruthy();
    // Badge shows the remaining two
    expect(getByText('+2')).toBeTruthy();
  });
});
