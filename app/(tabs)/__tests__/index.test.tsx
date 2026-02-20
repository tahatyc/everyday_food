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
      .mockReturnValueOnce([]) // allRecipes
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

  it('renders today\'s meals section', () => {
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
    // textTransform: "uppercase" is CSS-only, doesn't change text content in tests
    expect(getByText('Pancakes')).toBeTruthy();
    expect(getByText('25 MINS')).toBeTruthy();
  });

  it('renders meal plan data when meals are planned', () => {
    const mockRecipes = [];
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
      .mockReturnValueOnce(mockRecipes)
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
});
