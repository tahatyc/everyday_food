import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert, Linking } from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { router } from 'expo-router';
import SettingsScreen from '../settings';

jest.spyOn(Alert, 'alert');
jest.spyOn(Linking, 'openURL').mockResolvedValue(true as any);

const mockUpdateProfile = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (useMutation as jest.Mock).mockReturnValue(mockUpdateProfile);
});

const mockUser = {
  _id: 'user1',
  name: 'Test Chef',
  email: 'test@test.com',
  defaultServings: 4,
  preferredUnits: 'imperial' as const,
  dietaryPreferences: ['Vegetarian'],
  weekStartDay: 'sunday',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  tokenIdentifier: 'token1',
};

describe('SettingsScreen', () => {
  it('renders header with title', () => {
    (useQuery as jest.Mock).mockReturnValue(mockUser);
    const { getByText } = render(<SettingsScreen />);
    expect(getByText('SETTINGS')).toBeTruthy();
  });

  it('shows loading state when user is undefined', () => {
    (useQuery as jest.Mock).mockReturnValue(undefined);
    const { queryByText } = render(<SettingsScreen />);
    expect(queryByText('SETTINGS')).toBeNull();
  });

  it('navigates back when back button is pressed', () => {
    (useQuery as jest.Mock).mockReturnValue(mockUser);
    const { getByTestId } = render(<SettingsScreen />);

    fireEvent.press(getByTestId('back-button'));
    expect(router.back).toHaveBeenCalled();
  });

  it('renders cooking section with correct values', () => {
    (useQuery as jest.Mock).mockReturnValue(mockUser);
    const { getByText } = render(<SettingsScreen />);

    expect(getByText('COOKING')).toBeTruthy();
    expect(getByText('Week starts on')).toBeTruthy();
    expect(getByText('Sunday')).toBeTruthy();
    expect(getByText('Measurement units')).toBeTruthy();
    expect(getByText('Imperial')).toBeTruthy();
  });

  it('toggles week start day', async () => {
    mockUpdateProfile.mockResolvedValue({});
    (useQuery as jest.Mock).mockReturnValue(mockUser);
    const { getByTestId } = render(<SettingsScreen />);

    fireEvent.press(getByTestId('week-start-row'));

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith({ weekStartDay: 'monday' });
    });
  });

  it('toggles measurement units', async () => {
    mockUpdateProfile.mockResolvedValue({});
    (useQuery as jest.Mock).mockReturnValue(mockUser);
    const { getByTestId } = render(<SettingsScreen />);

    fireEvent.press(getByTestId('units-row'));

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith({ preferredUnits: 'metric' });
    });
  });

  it('renders dietary preferences section', () => {
    (useQuery as jest.Mock).mockReturnValue(mockUser);
    const { getByText } = render(<SettingsScreen />);

    expect(getByText('DIETARY PREFERENCES')).toBeTruthy();
    expect(getByText('Vegetarian')).toBeTruthy();
    expect(getByText('Vegan')).toBeTruthy();
    expect(getByText('Gluten-Free')).toBeTruthy();
  });

  it('toggles dietary preference on', async () => {
    mockUpdateProfile.mockResolvedValue({});
    (useQuery as jest.Mock).mockReturnValue(mockUser);
    const { getByText } = render(<SettingsScreen />);

    fireEvent.press(getByText('Vegan'));

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith({
        dietaryPreferences: ['Vegetarian', 'Vegan'],
      });
    });
  });

  it('toggles dietary preference off', async () => {
    mockUpdateProfile.mockResolvedValue({});
    (useQuery as jest.Mock).mockReturnValue(mockUser);
    const { getByText } = render(<SettingsScreen />);

    fireEvent.press(getByText('Vegetarian'));

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith({
        dietaryPreferences: [],
      });
    });
  });

  it('renders data section with dangerous actions', () => {
    (useQuery as jest.Mock).mockReturnValue(mockUser);
    const { getByText } = render(<SettingsScreen />);

    expect(getByText('DATA')).toBeTruthy();
    expect(getByText('Export my recipes')).toBeTruthy();
    expect(getByText('Clear cooking history')).toBeTruthy();
    expect(getByText('Delete account')).toBeTruthy();
  });

  it('shows confirmation alert for clear history', () => {
    (useQuery as jest.Mock).mockReturnValue(mockUser);
    const { getByTestId } = render(<SettingsScreen />);

    fireEvent.press(getByTestId('clear-history-row'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Clear Cooking History',
      expect.any(String),
      expect.arrayContaining([
        expect.objectContaining({ text: 'Cancel' }),
        expect.objectContaining({ text: 'Clear', style: 'destructive' }),
      ])
    );
  });

  it('shows coming soon alert for export recipes', () => {
    (useQuery as jest.Mock).mockReturnValue(mockUser);
    const { getByTestId } = render(<SettingsScreen />);

    fireEvent.press(getByTestId('export-recipes-row'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Coming Soon',
      expect.any(String)
    );
  });

  it('shows confirmation alert for delete account', () => {
    (useQuery as jest.Mock).mockReturnValue(mockUser);
    const { getByTestId } = render(<SettingsScreen />);

    fireEvent.press(getByTestId('delete-account-row'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Delete Account',
      expect.any(String),
      expect.arrayContaining([
        expect.objectContaining({ text: 'Cancel' }),
        expect.objectContaining({ text: 'Delete', style: 'destructive' }),
      ])
    );
  });

  it('renders about section with version', () => {
    (useQuery as jest.Mock).mockReturnValue(mockUser);
    const { getByText } = render(<SettingsScreen />);

    expect(getByText('ABOUT')).toBeTruthy();
    expect(getByText('Version')).toBeTruthy();
    expect(getByText('1.0.0')).toBeTruthy();
  });

  it('opens feedback link', () => {
    (useQuery as jest.Mock).mockReturnValue(mockUser);
    const { getByTestId } = render(<SettingsScreen />);

    fireEvent.press(getByTestId('feedback-row'));
    expect(Linking.openURL).toHaveBeenCalledWith('mailto:feedback@everydayfood.app');
  });

  it('opens privacy policy link', () => {
    (useQuery as jest.Mock).mockReturnValue(mockUser);
    const { getByTestId } = render(<SettingsScreen />);

    fireEvent.press(getByTestId('privacy-row'));
    expect(Linking.openURL).toHaveBeenCalledWith('https://everydayfood.app/privacy');
  });

  it('opens terms of service link', () => {
    (useQuery as jest.Mock).mockReturnValue(mockUser);
    const { getByTestId } = render(<SettingsScreen />);

    fireEvent.press(getByTestId('terms-row'));
    expect(Linking.openURL).toHaveBeenCalledWith('https://everydayfood.app/terms');
  });

  it('shows Monday when weekStartDay is monday', () => {
    (useQuery as jest.Mock).mockReturnValue({ ...mockUser, weekStartDay: 'monday' });
    const { getByText } = render(<SettingsScreen />);
    expect(getByText('Monday')).toBeTruthy();
  });

  it('shows Metric when preferredUnits is metric', () => {
    (useQuery as jest.Mock).mockReturnValue({ ...mockUser, preferredUnits: 'metric' });
    const { getByText } = render(<SettingsScreen />);
    expect(getByText('Metric')).toBeTruthy();
  });
});
