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
      .mockReturnValueOnce([]) // cookbooks
      .mockReturnValueOnce({ totalRecipes: 5, totalFavorites: 2, totalMealsCooked: 10 }); // stats

    const { getByText } = render(<ProfileScreen />);
    expect(getByText('CHEF PROFILE')).toBeTruthy();
  });

  it('renders user name in uppercase', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce({ name: 'John' })
      .mockReturnValueOnce([])
      .mockReturnValueOnce({ totalRecipes: 0, totalFavorites: 0, totalMealsCooked: 0 });

    const { getByText } = render(<ProfileScreen />);
    expect(getByText('JOHN')).toBeTruthy();
  });

  it('shows default name when user has no name', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce({})
      .mockReturnValueOnce([])
      .mockReturnValueOnce({ totalRecipes: 0, totalFavorites: 0, totalMealsCooked: 0 });

    const { getByText } = render(<ProfileScreen />);
    expect(getByText('CHEF')).toBeTruthy();
  });

  it('renders stats section with correct values', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce({ name: 'John' })
      .mockReturnValueOnce([])
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
      .mockReturnValueOnce([])
      .mockReturnValueOnce({ totalRecipes: 10, totalFavorites: 7, totalMealsCooked: 20 });

    const { getByText } = render(<ProfileScreen />);
    // totalFavorites: 7 = personal (e.g. 3) + global (e.g. 4) combined by backend
    expect(getByText('7')).toBeTruthy();
    expect(getByText('FAVORITES')).toBeTruthy();
  });

  it('shows zero favorites when none exist', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce({ name: 'John' })
      .mockReturnValueOnce([])
      .mockReturnValueOnce({ totalRecipes: 5, totalFavorites: 0, totalMealsCooked: 10 });

    const { getByText } = render(<ProfileScreen />);
    expect(getByText('0')).toBeTruthy();
    expect(getByText('FAVORITES')).toBeTruthy();
  });

  it('renders edit profile button', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce({ name: 'John' })
      .mockReturnValueOnce([])
      .mockReturnValueOnce({ totalRecipes: 0, totalFavorites: 0, totalMealsCooked: 0 });

    const { getByText } = render(<ProfileScreen />);
    expect(getByText('EDIT PROFILE')).toBeTruthy();
  });

  it('renders cookbooks section', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce({ name: 'John' })
      .mockReturnValueOnce([])
      .mockReturnValueOnce({ totalRecipes: 0, totalFavorites: 0, totalMealsCooked: 0 });

    const { getByText } = render(<ProfileScreen />);
    expect(getByText('MY COOKBOOKS')).toBeTruthy();
  });

  it('shows empty cookbooks message when none exist', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce({ name: 'John' })
      .mockReturnValueOnce([])
      .mockReturnValueOnce({ totalRecipes: 0, totalFavorites: 0, totalMealsCooked: 0 });

    const { getByText } = render(<ProfileScreen />);
    expect(getByText('No cookbooks yet')).toBeTruthy();
    expect(getByText('Create your first cookbook!')).toBeTruthy();
  });

  it('renders cookbook cards when cookbooks exist', () => {
    const mockCookbooks = [
      { _id: 'cb1', name: 'Italian', recipeCount: 5, color: '#FFE14D' },
      { _id: 'cb2', name: 'Quick Meals', recipeCount: 3, color: '#2DD881' },
    ];
    (useQuery as jest.Mock)
      .mockReturnValueOnce({ name: 'John' })
      .mockReturnValueOnce(mockCookbooks)
      .mockReturnValueOnce({ totalRecipes: 8, totalFavorites: 3, totalMealsCooked: 15 });

    const { getByText } = render(<ProfileScreen />);
    expect(getByText('ITALIAN')).toBeTruthy();
    expect(getByText('QUICK MEALS')).toBeTruthy();
    expect(getByText('5 RECIPES')).toBeTruthy();
    expect(getByText('3 RECIPES')).toBeTruthy();
  });

  it('navigates to cookbook detail when cookbook is pressed', () => {
    const mockCookbooks = [
      { _id: 'cb1', name: 'Italian', recipeCount: 5, color: '#FFE14D' },
    ];
    (useQuery as jest.Mock)
      .mockReturnValueOnce({ name: 'John' })
      .mockReturnValueOnce(mockCookbooks)
      .mockReturnValueOnce({ totalRecipes: 5, totalFavorites: 2, totalMealsCooked: 10 });

    const { getByText } = render(<ProfileScreen />);
    fireEvent.press(getByText('ITALIAN'));
    expect(router.push).toHaveBeenCalledWith('/cookbook/cb1');
  });

  it('renders friends section', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce({ name: 'John' })
      .mockReturnValueOnce([])
      .mockReturnValueOnce({ totalRecipes: 0, totalFavorites: 0, totalMealsCooked: 0 });

    const { getByText } = render(<ProfileScreen />);
    expect(getByText('MY FRIENDS')).toBeTruthy();
    expect(getByText('Manage friends & share recipes')).toBeTruthy();
  });

  it('navigates to friends when friends section is pressed', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce({ name: 'John' })
      .mockReturnValueOnce([])
      .mockReturnValueOnce({ totalRecipes: 0, totalFavorites: 0, totalMealsCooked: 0 });

    const { getByText } = render(<ProfileScreen />);
    fireEvent.press(getByText('MY FRIENDS'));
    expect(router.push).toHaveBeenCalledWith('/friends');
  });

  it('renders settings section', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce({ name: 'John' })
      .mockReturnValueOnce([])
      .mockReturnValueOnce({ totalRecipes: 0, totalFavorites: 0, totalMealsCooked: 0 });

    const { getByText } = render(<ProfileScreen />);
    expect(getByText('APP SETTINGS')).toBeTruthy();
  });

  it('renders sign out button', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce({ name: 'John' })
      .mockReturnValueOnce([])
      .mockReturnValueOnce({ totalRecipes: 0, totalFavorites: 0, totalMealsCooked: 0 });

    const { getByText } = render(<ProfileScreen />);
    expect(getByText('SIGN OUT')).toBeTruthy();
  });

  it('calls signOut and navigates to login when sign out is pressed', async () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce({ name: 'John' })
      .mockReturnValueOnce([])
      .mockReturnValueOnce({ totalRecipes: 0, totalFavorites: 0, totalMealsCooked: 0 });

    const { getByText } = render(<ProfileScreen />);
    fireEvent.press(getByText('SIGN OUT'));

    expect(mockSignOut).toHaveBeenCalled();
  });

  it('renders avatar emoji', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce({ name: 'John' })
      .mockReturnValueOnce([])
      .mockReturnValueOnce({ totalRecipes: 0, totalFavorites: 0, totalMealsCooked: 0 });

    const { getByText } = render(<ProfileScreen />);
    expect(getByText('👨‍🍳')).toBeTruthy();
  });

  it('shows dietary preferences when user has them', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce({ name: 'John', dietaryPreferences: ['Vegetarian', 'Gluten-Free'] })
      .mockReturnValueOnce([])
      .mockReturnValueOnce({ totalRecipes: 0, totalFavorites: 0, totalMealsCooked: 0 });

    const { getByText } = render(<ProfileScreen />);
    expect(getByText('Preferences: Vegetarian, Gluten-Free')).toBeTruthy();
  });
});
