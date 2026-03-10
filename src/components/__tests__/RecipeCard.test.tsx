import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { RecipeCard, RecipeCardData } from '../RecipeCard';

const baseRecipe: RecipeCardData = {
  _id: 'r1' as any,
  title: 'Test Recipe',
  description: 'A delicious test recipe',
  prepTime: 10,
  cookTime: 20,
  servings: 4,
  difficulty: 'easy',
  isFavorite: false,
  isGlobal: false,
  tags: ['dinner', 'Italian'],
};

describe('RecipeCard', () => {
  it('renders recipe title and description', () => {
    const { getByText } = render(
      <RecipeCard
        recipe={baseRecipe}
        action={{ type: 'favorite', onPress: jest.fn() }}
      />
    );
    expect(getByText('Test Recipe')).toBeTruthy();
    expect(getByText('A delicious test recipe')).toBeTruthy();
  });

  it('renders total time (prep + cook)', () => {
    const { getByText } = render(
      <RecipeCard
        recipe={baseRecipe}
        action={{ type: 'favorite', onPress: jest.fn() }}
      />
    );
    expect(getByText('30 min')).toBeTruthy();
  });

  it('renders servings count', () => {
    const { getByText } = render(
      <RecipeCard
        recipe={baseRecipe}
        action={{ type: 'favorite', onPress: jest.fn() }}
      />
    );
    expect(getByText('4 servings')).toBeTruthy();
  });

  it('renders difficulty badge', () => {
    const { getByText } = render(
      <RecipeCard
        recipe={baseRecipe}
        action={{ type: 'favorite', onPress: jest.fn() }}
      />
    );
    expect(getByText('easy')).toBeTruthy();
  });

  it('renders up to 3 tags', () => {
    const recipeWith4Tags = {
      ...baseRecipe,
      tags: ['dinner', 'Italian', 'Pasta', 'Quick'],
    };
    const { getByText, queryByText } = render(
      <RecipeCard
        recipe={recipeWith4Tags}
        action={{ type: 'favorite', onPress: jest.fn() }}
      />
    );
    expect(getByText('dinner')).toBeTruthy();
    expect(getByText('Italian')).toBeTruthy();
    expect(getByText('Pasta')).toBeTruthy();
    expect(queryByText('Quick')).toBeNull();
  });

  it('shows GLOBAL badge for global recipes', () => {
    const globalRecipe = { ...baseRecipe, isGlobal: true };
    const { getByText } = render(
      <RecipeCard
        recipe={globalRecipe}
        action={{ type: 'favorite', onPress: jest.fn() }}
      />
    );
    expect(getByText('GLOBAL')).toBeTruthy();
  });

  it('does not show GLOBAL badge for personal recipes', () => {
    const { queryByText } = render(
      <RecipeCard
        recipe={baseRecipe}
        action={{ type: 'favorite', onPress: jest.fn() }}
      />
    );
    expect(queryByText('GLOBAL')).toBeNull();
  });

  // Favorite action tests
  it('renders heart-outline icon when not favorited', () => {
    const { getByTestId } = render(
      <RecipeCard
        recipe={{ ...baseRecipe, isFavorite: false }}
        action={{ type: 'favorite', onPress: jest.fn() }}
      />
    );
    expect(getByTestId('icon-heart-outline')).toBeTruthy();
  });

  it('renders filled heart icon when favorited', () => {
    const { getByTestId } = render(
      <RecipeCard
        recipe={{ ...baseRecipe, isFavorite: true }}
        action={{ type: 'favorite', onPress: jest.fn() }}
      />
    );
    expect(getByTestId('icon-heart')).toBeTruthy();
  });

  it('calls favorite action onPress with recipe when heart is pressed', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <RecipeCard
        recipe={baseRecipe}
        action={{ type: 'favorite', onPress }}
      />
    );
    fireEvent.press(getByTestId('icon-heart-outline'));
    expect(onPress).toHaveBeenCalledWith(baseRecipe);
  });

  // Add action tests
  it('renders add icon button for add action type', () => {
    const { getByTestId } = render(
      <RecipeCard
        recipe={baseRecipe}
        action={{ type: 'add', onPress: jest.fn() }}
      />
    );
    expect(getByTestId('icon-add')).toBeTruthy();
  });

  it('calls add action onPress when plus button is pressed', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <RecipeCard
        recipe={baseRecipe}
        action={{ type: 'add', onPress }}
      />
    );
    fireEvent.press(getByTestId('icon-add'));
    expect(onPress).toHaveBeenCalledWith(baseRecipe);
  });

  it('calls onCardPress (not add) when card is tapped with onCardPress provided', () => {
    const onAdd = jest.fn();
    const onCardPress = jest.fn();
    const { getByText } = render(
      <RecipeCard
        recipe={baseRecipe}
        action={{ type: 'add', onPress: onAdd }}
        onCardPress={onCardPress}
      />
    );
    fireEvent.press(getByText('Test Recipe'));
    expect(onCardPress).toHaveBeenCalledWith(baseRecipe);
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('falls back to add onPress on card tap when no onCardPress', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <RecipeCard
        recipe={baseRecipe}
        action={{ type: 'add', onPress }}
      />
    );
    fireEvent.press(getByText('Test Recipe'));
    expect(onPress).toHaveBeenCalledWith(baseRecipe);
  });

  // Card press tests
  it('calls onCardPress when card is pressed', () => {
    const onCardPress = jest.fn();
    const { getByText } = render(
      <RecipeCard
        recipe={baseRecipe}
        action={{ type: 'favorite', onPress: jest.fn() }}
        onCardPress={onCardPress}
      />
    );
    fireEvent.press(getByText('Test Recipe'));
    expect(onCardPress).toHaveBeenCalledWith(baseRecipe);
  });

  it('does not render description when not provided', () => {
    const noDescRecipe = { ...baseRecipe, description: undefined };
    const { queryByText } = render(
      <RecipeCard
        recipe={noDescRecipe}
        action={{ type: 'favorite', onPress: jest.fn() }}
      />
    );
    expect(queryByText('A delicious test recipe')).toBeNull();
  });

  it('does not render difficulty badge when not provided', () => {
    const noDiffRecipe = { ...baseRecipe, difficulty: undefined };
    const { queryByText } = render(
      <RecipeCard
        recipe={noDiffRecipe}
        action={{ type: 'favorite', onPress: jest.fn() }}
      />
    );
    expect(queryByText('easy')).toBeNull();
  });
});
