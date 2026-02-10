import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { useQuery } from 'convex/react';
import { router } from 'expo-router';
import ProfileScreen from '../(tabs)/profile';

beforeEach(() => {
  jest.clearAllMocks();
});

const mockUser = {
  _id: 'user1',
  name: 'Test Chef',
  email: 'test@test.com',
  defaultServings: 4,
  preferredUnits: 'imperial' as const,
  dietaryPreferences: ['Vegetarian'],
  createdAt: Date.now(),
  updatedAt: Date.now(),
  tokenIdentifier: 'token1',
};

const mockStats = {
  totalRecipes: 5,
  totalFavorites: 3,
  totalMealsCooked: 12,
};

describe('ProfileScreen', () => {
  it('renders profile header', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce(mockUser)
      .mockReturnValueOnce(mockStats);
    const { getByText } = render(<ProfileScreen />);
    expect(getByText('CHEF PROFILE')).toBeTruthy();
  });

  it('shows loading state when data is undefined', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce(undefined);
    const { getByText } = render(<ProfileScreen />);
    expect(getByText('Loading profile...')).toBeTruthy();
  });

  it('displays user name', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce(mockUser)
      .mockReturnValueOnce(mockStats);
    const { getByText } = render(<ProfileScreen />);
    expect(getByText('TEST CHEF')).toBeTruthy();
  });

  it('displays stats', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce(mockUser)
      .mockReturnValueOnce(mockStats);
    const { getByText } = render(<ProfileScreen />);
    expect(getByText('5')).toBeTruthy();
    expect(getByText('3')).toBeTruthy();
    expect(getByText('12')).toBeTruthy();
  });

  it('navigates to edit profile when Edit Profile button is pressed', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce(mockUser)
      .mockReturnValueOnce(mockStats);
    const { getByText } = render(<ProfileScreen />);

    fireEvent.press(getByText('EDIT PROFILE'));
    expect(router.push).toHaveBeenCalledWith('/edit-profile');
  });

  it('navigates to settings when APP SETTINGS card is pressed', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce(mockUser)
      .mockReturnValueOnce(mockStats);
    const { getByText } = render(<ProfileScreen />);

    fireEvent.press(getByText('APP SETTINGS'));
    expect(router.push).toHaveBeenCalledWith('/settings');
  });

  it('navigates to settings when header gear icon is pressed', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce(mockUser)
      .mockReturnValueOnce(mockStats);
    const { getAllByTestId } = render(<ProfileScreen />);

    // First settings-outline icon is the header gear
    const settingsIcons = getAllByTestId('icon-settings-outline');
    fireEvent.press(settingsIcons[0]);
    expect(router.push).toHaveBeenCalledWith('/settings');
  });

  it('navigates to friends when MY FRIENDS card is pressed', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce(mockUser)
      .mockReturnValueOnce(mockStats);
    const { getByText } = render(<ProfileScreen />);

    fireEvent.press(getByText('MY FRIENDS'));
    expect(router.push).toHaveBeenCalledWith('/friends');
  });

  it('navigates to recipes when MY RECIPES card is pressed', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce(mockUser)
      .mockReturnValueOnce(mockStats);
    const { getByText } = render(<ProfileScreen />);

    fireEvent.press(getByText('MY RECIPES'));
    expect(router.push).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/(tabs)/recipes' })
    );
  });
});
