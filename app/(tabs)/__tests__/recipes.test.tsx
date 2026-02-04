import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { useQuery } from 'convex/react';
import { router } from 'expo-router';
import RecipesScreen from '../recipes';

describe('RecipesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state when recipes are undefined', () => {
    (useQuery as jest.Mock).mockReturnValue(undefined);

    const { getByText } = render(<RecipesScreen />);
    expect(getByText('Loading recipes...')).toBeTruthy();
  });

  it('renders header with title', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce([]) // allRecipes
      .mockReturnValueOnce(undefined) // searchResults (skipped)
      .mockReturnValueOnce([]); // favoriteRecipes

    const { getByText } = render(<RecipesScreen />);
    expect(getByText('Recipes')).toBeTruthy();
  });

  it('renders filter chips', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce([])
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce([]);

    const { getByText } = render(<RecipesScreen />);
    expect(getByText('All')).toBeTruthy();
    expect(getByText('My Recipes')).toBeTruthy();
    expect(getByText('Breakfast')).toBeTruthy();
    expect(getByText('Lunch')).toBeTruthy();
    expect(getByText('Dinner')).toBeTruthy();
    expect(getByText('Favorites')).toBeTruthy();
  });

  it('shows empty state when no recipes exist', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce([])
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce([]);

    const { getByText } = render(<RecipesScreen />);
    expect(getByText('No recipes found')).toBeTruthy();
    expect(getByText('0 recipes')).toBeTruthy();
  });

  it('renders recipe list items', () => {
    const mockRecipes = [
      {
        _id: 'recipe1',
        title: 'Spaghetti',
        description: 'Classic pasta dish',
        prepTime: 10,
        cookTime: 20,
        servings: 4,
        difficulty: 'easy',
        isFavorite: false,
        tags: ['dinner'],
        ingredients: [],
        steps: [],
      },
    ];
    (useQuery as jest.Mock)
      .mockReturnValueOnce(mockRecipes)
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce([]);

    const { getByText } = render(<RecipesScreen />);
    expect(getByText('Spaghetti')).toBeTruthy();
    expect(getByText('Classic pasta dish')).toBeTruthy();
    expect(getByText('30 min')).toBeTruthy();
    expect(getByText('4 servings')).toBeTruthy();
    expect(getByText('1 recipe')).toBeTruthy();
  });

  it('shows recipe count correctly for multiple recipes', () => {
    const mockRecipes = [
      { _id: 'r1', title: 'Recipe 1', servings: 2, tags: [], ingredients: [], steps: [] },
      { _id: 'r2', title: 'Recipe 2', servings: 4, tags: [], ingredients: [], steps: [] },
      { _id: 'r3', title: 'Recipe 3', servings: 6, tags: [], ingredients: [], steps: [] },
    ];
    (useQuery as jest.Mock)
      .mockReturnValueOnce(mockRecipes)
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce([]);

    const { getByText } = render(<RecipesScreen />);
    expect(getByText('3 recipes')).toBeTruthy();
  });

  it('navigates to recipe detail when a recipe is pressed', () => {
    const mockRecipes = [
      {
        _id: 'recipe1',
        title: 'Spaghetti',
        servings: 4,
        tags: [],
        ingredients: [],
        steps: [],
      },
    ];
    (useQuery as jest.Mock)
      .mockReturnValueOnce(mockRecipes)
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce([]);

    const { getByText } = render(<RecipesScreen />);
    fireEvent.press(getByText('Spaghetti'));
    expect(router.push).toHaveBeenCalledWith('/recipe/recipe1');
  });

  it('navigates to import when add button is pressed', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce([])
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce([]);

    const { getByTestId } = render(<RecipesScreen />);
    fireEvent.press(getByTestId('icon-add'));
    expect(router.push).toHaveBeenCalledWith('/import');
  });

  it('renders search input', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce([])
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce([]);

    const { getByPlaceholderText } = render(<RecipesScreen />);
    expect(getByPlaceholderText('Search recipes...')).toBeTruthy();
  });

  it('shows tags on recipe items', () => {
    const mockRecipes = [
      {
        _id: 'r1',
        title: 'Pasta',
        servings: 4,
        tags: ['dinner', 'Italian'],
        ingredients: [],
        steps: [],
      },
    ];
    (useQuery as jest.Mock)
      .mockReturnValueOnce(mockRecipes)
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce([]);

    const { getByText } = render(<RecipesScreen />);
    expect(getByText('dinner')).toBeTruthy();
    expect(getByText('Italian')).toBeTruthy();
  });

  it('shows global badge for global recipes', () => {
    const mockRecipes = [
      {
        _id: 'r1',
        title: 'Global Recipe',
        servings: 4,
        isGlobal: true,
        tags: [],
        ingredients: [],
        steps: [],
      },
    ];
    (useQuery as jest.Mock)
      .mockReturnValueOnce(mockRecipes)
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce([]);

    const { getByText } = render(<RecipesScreen />);
    expect(getByText('GLOBAL')).toBeTruthy();
  });
});
