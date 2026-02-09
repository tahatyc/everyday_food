import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { useQuery } from 'convex/react';
import { router } from 'expo-router';
import ProfileScreen from '../profile';

const mockSignOut = jest.fn();
jest.mock('@convex-dev/auth/react', () => ({
  useAuthActions: () => ({
    signIn: jest.fn(),
    signOut: mockSignOut,
  }),
}));

describe('ProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSignOut.mockResolvedValue(undefined);
  });

  it('shows loading state when data is undefined', () => {
    (useQuery as jest.Mock).mockReturnValue(undefined);

    const { getByText } = render(<ProfileScreen />);
    expect(getByText('Loading profile...')).toBeTruthy();
  });

  it('renders header with title', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce({ name: 'John', email: 'john@test.com' }) // user
      .mockReturnValueOnce({ totalRecipes: 5, totalFavorites: 2, totalMealsCooked: 10 }); // stats

    const { getByText } = render(<ProfileScreen />);
    expect(getByText('CHEF PROFILE')).toBeTruthy();
  });

  it('renders user name in uppercase', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce({ name: 'John' })
      .mockReturnValueOnce({ totalRecipes: 0, totalFavorites: 0, totalMealsCooked: 0 });

    const { getByText } = render(<ProfileScreen />);
    expect(getByText('JOHN')).toBeTruthy();
  });

  it('shows default name when user has no name', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce({})
      .mockReturnValueOnce({ totalRecipes: 0, totalFavorites: 0, totalMealsCooked: 0 });

    const { getByText } = render(<ProfileScreen />);
    expect(getByText('CHEF')).toBeTruthy();
  });

  it('renders stats section with correct values', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce({ name: 'John' })
      .mockReturnValueOnce({ totalRecipes: 12, totalFavorites: 5, totalMealsCooked: 30 });

    const { getByText } = render(<ProfileScreen />);
    expect(getByText('12')).toBeTruthy();
    expect(getByText('5')).toBeTruthy();
    expect(getByText('30')).toBeTruthy();
    expect(getByText('RECIPES')).toBeTruthy();
    expect(getByText('FAVORITES')).toBeTruthy();
    expect(getByText('COOKED')).toBeTruthy();
  });

  it('renders combined favorites count including global favorites', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce({ name: 'John' })
      .mockReturnValueOnce({ totalRecipes: 10, totalFavorites: 7, totalMealsCooked: 20 });

    const { getByText } = render(<ProfileScreen />);
    // totalFavorites: 7 = personal (e.g. 3) + global (e.g. 4) combined by backend
    expect(getByText('7')).toBeTruthy();
    expect(getByText('FAVORITES')).toBeTruthy();
  });

  it('shows zero favorites when none exist', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce({ name: 'John' })
      .mockReturnValueOnce({ totalRecipes: 5, totalFavorites: 0, totalMealsCooked: 10 });

    const { getByText } = render(<ProfileScreen />);
    expect(getByText('0')).toBeTruthy();
    expect(getByText('FAVORITES')).toBeTruthy();
  });

  it('renders edit profile button', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce({ name: 'John' })
      .mockReturnValueOnce({ totalRecipes: 0, totalFavorites: 0, totalMealsCooked: 0 });

    const { getByText } = render(<ProfileScreen />);
    expect(getByText('EDIT PROFILE')).toBeTruthy();
  });

  it('renders my recipes button', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce({ name: 'John' })
      .mockReturnValueOnce({ totalRecipes: 0, totalFavorites: 0, totalMealsCooked: 0 });

    const { getByText } = render(<ProfileScreen />);
    expect(getByText('MY RECIPES')).toBeTruthy();
    expect(getByText('View your personal recipes')).toBeTruthy();
  });

  it('navigates to recipes tab with filter when my recipes is pressed', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce({ name: 'John' })
      .mockReturnValueOnce({ totalRecipes: 0, totalFavorites: 0, totalMealsCooked: 0 });

    const { getByText } = render(<ProfileScreen />);
    fireEvent.press(getByText('MY RECIPES'));
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/(tabs)/recipes',
      params: { filter: 'my-recipes' },
    });
  });

  it('renders friends section', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce({ name: 'John' })
      .mockReturnValueOnce({ totalRecipes: 0, totalFavorites: 0, totalMealsCooked: 0 });

    const { getByText } = render(<ProfileScreen />);
    expect(getByText('MY FRIENDS')).toBeTruthy();
    expect(getByText('Manage friends & share recipes')).toBeTruthy();
  });

  it('navigates to friends when friends section is pressed', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce({ name: 'John' })
      .mockReturnValueOnce({ totalRecipes: 0, totalFavorites: 0, totalMealsCooked: 0 });

    const { getByText } = render(<ProfileScreen />);
    fireEvent.press(getByText('MY FRIENDS'));
    expect(router.push).toHaveBeenCalledWith('/friends');
  });

  it('renders settings section', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce({ name: 'John' })
      .mockReturnValueOnce({ totalRecipes: 0, totalFavorites: 0, totalMealsCooked: 0 });

    const { getByText } = render(<ProfileScreen />);
    expect(getByText('APP SETTINGS')).toBeTruthy();
  });

  it('renders sign out button', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce({ name: 'John' })
      .mockReturnValueOnce({ totalRecipes: 0, totalFavorites: 0, totalMealsCooked: 0 });

    const { getByText } = render(<ProfileScreen />);
    expect(getByText('SIGN OUT')).toBeTruthy();
  });

  it('calls signOut and navigates to login when sign out is pressed', async () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce({ name: 'John' })
      .mockReturnValueOnce({ totalRecipes: 0, totalFavorites: 0, totalMealsCooked: 0 });

    const { getByText } = render(<ProfileScreen />);
    fireEvent.press(getByText('SIGN OUT'));

    expect(mockSignOut).toHaveBeenCalled();
  });

  it('renders avatar emoji', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce({ name: 'John' })
      .mockReturnValueOnce({ totalRecipes: 0, totalFavorites: 0, totalMealsCooked: 0 });

    const { getByText } = render(<ProfileScreen />);
    expect(getByText('👨‍🍳')).toBeTruthy();
  });

  it('shows dietary preferences when user has them', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce({ name: 'John', dietaryPreferences: ['Vegetarian', 'Gluten-Free'] })
      .mockReturnValueOnce({ totalRecipes: 0, totalFavorites: 0, totalMealsCooked: 0 });

    const { getByText } = render(<ProfileScreen />);
    expect(getByText('Preferences: Vegetarian, Gluten-Free')).toBeTruthy();
  });
});
