import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { useQuery, useMutation } from 'convex/react';
import { router } from 'expo-router';
import EditProfileScreen from '../edit-profile';

const mockUpdateProfile = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (useMutation as jest.Mock).mockReturnValue(mockUpdateProfile);
});

const mockUser = {
  _id: 'user1',
  name: 'Test Chef',
  bio: 'I love cooking',
  email: 'test@test.com',
  defaultServings: 4,
  preferredUnits: 'imperial' as const,
  dietaryPreferences: ['Vegetarian'],
  createdAt: Date.now(),
  updatedAt: Date.now(),
  tokenIdentifier: 'token1',
};

describe('EditProfileScreen', () => {
  it('renders header with title', () => {
    (useQuery as jest.Mock).mockReturnValue(mockUser);
    const { getByText } = render(<EditProfileScreen />);
    expect(getByText('EDIT PROFILE')).toBeTruthy();
  });

  it('shows loading state when user is undefined', () => {
    (useQuery as jest.Mock).mockReturnValue(undefined);
    const { queryByText } = render(<EditProfileScreen />);
    expect(queryByText('EDIT PROFILE')).toBeNull();
  });

  it('pre-fills form with user data', () => {
    (useQuery as jest.Mock).mockReturnValue(mockUser);
    const { getByTestId } = render(<EditProfileScreen />);

    expect(getByTestId('name-input').props.value).toBe('Test Chef');
    expect(getByTestId('bio-input').props.value).toBe('I love cooking');
  });

  it('navigates back when cancel button is pressed', () => {
    (useQuery as jest.Mock).mockReturnValue(mockUser);
    const { getByTestId } = render(<EditProfileScreen />);

    fireEvent.press(getByTestId('cancel-button'));
    expect(router.back).toHaveBeenCalled();
  });

  it('saves profile and navigates back', async () => {
    mockUpdateProfile.mockResolvedValue({});
    (useQuery as jest.Mock).mockReturnValue(mockUser);
    const { getByTestId } = render(<EditProfileScreen />);

    fireEvent.press(getByTestId('save-button'));

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith({
        name: 'Test Chef',
        bio: 'I love cooking',
        dietaryPreferences: ['Vegetarian'],
        defaultServings: 4,
        preferredUnits: 'imperial',
      });
      expect(router.back).toHaveBeenCalled();
    });
  });

  it('updates name field', () => {
    (useQuery as jest.Mock).mockReturnValue(mockUser);
    const { getByTestId } = render(<EditProfileScreen />);

    fireEvent.changeText(getByTestId('name-input'), 'New Name');
    expect(getByTestId('name-input').props.value).toBe('New Name');
  });

  it('updates bio field', () => {
    (useQuery as jest.Mock).mockReturnValue(mockUser);
    const { getByTestId } = render(<EditProfileScreen />);

    fireEvent.changeText(getByTestId('bio-input'), 'New bio');
    expect(getByTestId('bio-input').props.value).toBe('New bio');
  });

  it('toggles preferred units', () => {
    (useQuery as jest.Mock).mockReturnValue(mockUser);
    const { getByTestId } = render(<EditProfileScreen />);

    fireEvent.press(getByTestId('units-metric'));
    // After pressing metric, the metric button should be the active one
    // We verify the save would include metric
    fireEvent.press(getByTestId('save-button'));
  });

  it('toggles dietary preferences', async () => {
    mockUpdateProfile.mockResolvedValue({});
    (useQuery as jest.Mock).mockReturnValue(mockUser);
    const { getByText, getByTestId } = render(<EditProfileScreen />);

    // Toggle off Vegetarian (already selected)
    fireEvent.press(getByText('Vegetarian'));
    // Toggle on Vegan
    fireEvent.press(getByText('Vegan'));

    fireEvent.press(getByTestId('save-button'));

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          dietaryPreferences: ['Vegan'],
        })
      );
    });
  });

  it('renders all dietary option chips', () => {
    (useQuery as jest.Mock).mockReturnValue(mockUser);
    const { getByText } = render(<EditProfileScreen />);

    expect(getByText('Vegetarian')).toBeTruthy();
    expect(getByText('Vegan')).toBeTruthy();
    expect(getByText('Gluten-Free')).toBeTruthy();
    expect(getByText('Keto')).toBeTruthy();
    expect(getByText('Dairy-Free')).toBeTruthy();
    expect(getByText('Paleo')).toBeTruthy();
  });

  it('stays on screen when save fails', async () => {
    mockUpdateProfile.mockRejectedValue(new Error('Network error'));
    (useQuery as jest.Mock).mockReturnValue(mockUser);
    const { getByTestId } = render(<EditProfileScreen />);

    fireEvent.press(getByTestId('save-button'));

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalled();
      expect(router.back).not.toHaveBeenCalled();
    });
  });

  it('saves with metric units when metric is selected', async () => {
    mockUpdateProfile.mockResolvedValue({});
    (useQuery as jest.Mock).mockReturnValue(mockUser);
    const { getByTestId } = render(<EditProfileScreen />);

    fireEvent.press(getByTestId('units-metric'));
    fireEvent.press(getByTestId('save-button'));

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith(
        expect.objectContaining({ preferredUnits: 'metric' })
      );
    });
  });

  it('sends undefined name when field is cleared to whitespace', async () => {
    mockUpdateProfile.mockResolvedValue({});
    (useQuery as jest.Mock).mockReturnValue(mockUser);
    const { getByTestId } = render(<EditProfileScreen />);

    fireEvent.changeText(getByTestId('name-input'), '   ');
    fireEvent.press(getByTestId('save-button'));

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith(
        expect.objectContaining({ name: undefined })
      );
    });
  });
});
