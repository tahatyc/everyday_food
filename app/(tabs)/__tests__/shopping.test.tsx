import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ShoppingScreen from '../shopping';

describe('ShoppingScreen', () => {
  it('renders header with title', () => {
    const { getByText } = render(<ShoppingScreen />);
    expect(getByText('Shopping List')).toBeTruthy();
  });

  it('renders progress card', () => {
    const { getByText } = render(<ShoppingScreen />);
    expect(getByText('Progress')).toBeTruthy();
  });

  it('shows correct initial item count', () => {
    const { getByText } = render(<ShoppingScreen />);
    // 2 items are initially checked in SAMPLE_ITEMS
    expect(getByText('2 of 7 items')).toBeTruthy();
  });

  it('renders items grouped by aisle', () => {
    const { getByText } = render(<ShoppingScreen />);
    expect(getByText('Dairy')).toBeTruthy();
    expect(getByText('Pantry')).toBeTruthy();
    expect(getByText('Produce')).toBeTruthy();
    expect(getByText('Meat')).toBeTruthy();
  });

  it('renders individual shopping items', () => {
    const { getByText } = render(<ShoppingScreen />);
    expect(getByText('Eggs')).toBeTruthy();
    expect(getByText('Butter')).toBeTruthy();
    expect(getByText('All-purpose flour')).toBeTruthy();
    expect(getByText('Romaine lettuce')).toBeTruthy();
    expect(getByText('Chicken breast')).toBeTruthy();
  });

  it('shows item amounts', () => {
    const { getByText } = render(<ShoppingScreen />);
    expect(getByText('12 large')).toBeTruthy();
    expect(getByText('1 cup')).toBeTruthy();
    expect(getByText('2 cups')).toBeTruthy();
  });

  it('toggles item checked state when pressed', () => {
    const { getByText } = render(<ShoppingScreen />);

    // Initially 2 checked, toggle one more
    fireEvent.press(getByText('Eggs'));

    // Count should update to 3 of 7
    expect(getByText('3 of 7 items')).toBeTruthy();
  });

  it('shows clear checked items button when items are checked', () => {
    const { getByText } = render(<ShoppingScreen />);
    expect(getByText('Clear checked items')).toBeTruthy();
  });

  it('removes checked items when clear is pressed', () => {
    const { getByText, queryByText } = render(<ShoppingScreen />);

    fireEvent.press(getByText('Clear checked items'));

    // Checked items should be removed
    expect(queryByText('All-purpose flour')).toBeNull();
    expect(queryByText('Parmesan cheese')).toBeNull();

    // Unchecked items should remain
    expect(getByText('Eggs')).toBeTruthy();
    expect(getByText('Butter')).toBeTruthy();
  });

  it('shows add item input when add button is pressed', () => {
    const { getByTestId, getByPlaceholderText } = render(<ShoppingScreen />);

    fireEvent.press(getByTestId('icon-add'));
    expect(getByPlaceholderText('Add item...')).toBeTruthy();
  });

  it('adds new item when add button is submitted', () => {
    const { getByTestId, getByPlaceholderText, getByText } = render(
      <ShoppingScreen />
    );

    fireEvent.press(getByTestId('icon-add'));
    fireEvent.changeText(getByPlaceholderText('Add item...'), 'Bananas');
    fireEvent.press(getByText('Add'));

    expect(getByText('Bananas')).toBeTruthy();
  });

  it('cancels add item when cancel is pressed', () => {
    const { getByTestId, getByPlaceholderText, getByText, queryByPlaceholderText } =
      render(<ShoppingScreen />);

    fireEvent.press(getByTestId('icon-add'));
    expect(getByPlaceholderText('Add item...')).toBeTruthy();

    fireEvent.press(getByText('Cancel'));
    expect(queryByPlaceholderText('Add item...')).toBeNull();
  });

  it('renders generate from recipes button', () => {
    const { getByText } = render(<ShoppingScreen />);
    expect(getByText(/Generate from Recipes/)).toBeTruthy();
  });

  it('shows aisle section counts', () => {
    const { getAllByText } = render(<ShoppingScreen />);
    // Dairy has 3 items with 1 checked (Parmesan cheese)
    // Check that Badge components render counts
    expect(getAllByText(/\d+\/\d+/).length).toBeGreaterThan(0);
  });
});
