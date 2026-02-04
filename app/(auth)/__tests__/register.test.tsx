import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import RegisterScreen from '../register';

jest.spyOn(Alert, 'alert');

const mockSignIn = jest.fn();
jest.mock('@convex-dev/auth/react', () => ({
  useAuthActions: () => ({
    signIn: mockSignIn,
    signOut: jest.fn(),
  }),
}));

describe('RegisterScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSignIn.mockReset();
  });

  it('renders the registration form correctly', () => {
    const { getByText, getAllByText, getByPlaceholderText } = render(<RegisterScreen />);

    expect(getByText('Join Everyday Food')).toBeTruthy();
    expect(getByText('Start organizing your recipes')).toBeTruthy();
    // "Create Account" appears as both the form title and button text
    expect(getAllByText('Create Account').length).toBeGreaterThanOrEqual(1);
    expect(getByText('Name')).toBeTruthy();
    expect(getByText('Email')).toBeTruthy();
    expect(getByText('Password')).toBeTruthy();
    expect(getByText('Confirm Password')).toBeTruthy();
    expect(getByPlaceholderText('Your name')).toBeTruthy();
    expect(getByPlaceholderText('you@example.com')).toBeTruthy();
    expect(getByPlaceholderText('Create a password')).toBeTruthy();
    expect(getByPlaceholderText('Confirm your password')).toBeTruthy();
  });

  it('handles name input changes', () => {
    const { getByPlaceholderText } = render(<RegisterScreen />);
    const nameInput = getByPlaceholderText('Your name');
    fireEvent.changeText(nameInput, 'John Doe');
    expect(nameInput.props.value).toBe('John Doe');
  });

  it('handles email input changes', () => {
    const { getByPlaceholderText } = render(<RegisterScreen />);
    const emailInput = getByPlaceholderText('you@example.com');
    fireEvent.changeText(emailInput, 'john@test.com');
    expect(emailInput.props.value).toBe('john@test.com');
  });

  it('shows error when fields are empty', async () => {
    const { getAllByText } = render(<RegisterScreen />);
    // There are two "Create Account" texts - the title and the button
    const buttons = getAllByText('Create Account');
    fireEvent.press(buttons[buttons.length - 1]);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please fill in all fields');
    });
  });

  it('shows error when passwords do not match', async () => {
    const { getByPlaceholderText, getAllByText } = render(<RegisterScreen />);

    fireEvent.changeText(getByPlaceholderText('Your name'), 'John');
    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'john@test.com');
    fireEvent.changeText(getByPlaceholderText('Create a password'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Confirm your password'), 'different123');

    const buttons = getAllByText('Create Account');
    fireEvent.press(buttons[buttons.length - 1]);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Passwords do not match');
    });
  });

  it('shows error when password is too short', async () => {
    const { getByPlaceholderText, getAllByText } = render(<RegisterScreen />);

    fireEvent.changeText(getByPlaceholderText('Your name'), 'John');
    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'john@test.com');
    fireEvent.changeText(getByPlaceholderText('Create a password'), 'short');
    fireEvent.changeText(getByPlaceholderText('Confirm your password'), 'short');

    const buttons = getAllByText('Create Account');
    fireEvent.press(buttons[buttons.length - 1]);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Password must be at least 8 characters'
      );
    });
  });

  it('calls signIn with correct parameters on valid submission', async () => {
    mockSignIn.mockResolvedValue({});

    const { getByPlaceholderText, getAllByText } = render(<RegisterScreen />);

    fireEvent.changeText(getByPlaceholderText('Your name'), 'John Doe');
    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'john@test.com');
    fireEvent.changeText(getByPlaceholderText('Create a password'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Confirm your password'), 'password123');

    const buttons = getAllByText('Create Account');
    fireEvent.press(buttons[buttons.length - 1]);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('password', {
        email: 'john@test.com',
        password: 'password123',
        name: 'John Doe',
        flow: 'signUp',
      });
    });
  });

  it('shows error alert when registration fails', async () => {
    mockSignIn.mockRejectedValue(new Error('Email already in use'));

    const { getByPlaceholderText, getAllByText } = render(<RegisterScreen />);

    fireEvent.changeText(getByPlaceholderText('Your name'), 'John Doe');
    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'john@test.com');
    fireEvent.changeText(getByPlaceholderText('Create a password'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Confirm your password'), 'password123');

    const buttons = getAllByText('Create Account');
    fireEvent.press(buttons[buttons.length - 1]);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Email already in use');
    });
  });

  it('shows generic error when error has no message', async () => {
    mockSignIn.mockRejectedValue({});

    const { getByPlaceholderText, getAllByText } = render(<RegisterScreen />);

    fireEvent.changeText(getByPlaceholderText('Your name'), 'John');
    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'j@t.com');
    fireEvent.changeText(getByPlaceholderText('Create a password'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Confirm your password'), 'password123');

    const buttons = getAllByText('Create Account');
    fireEvent.press(buttons[buttons.length - 1]);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to create account');
    });
  });

  it('has password fields with secureTextEntry by default', () => {
    const { getByPlaceholderText } = render(<RegisterScreen />);

    const passwordInput = getByPlaceholderText('Create a password');
    const confirmInput = getByPlaceholderText('Confirm your password');

    expect(passwordInput.props.secureTextEntry).toBe(true);
    expect(confirmInput.props.secureTextEntry).toBe(true);
  });

  it('shows helper text for password', () => {
    const { getByText } = render(<RegisterScreen />);
    expect(getByText('At least 8 characters')).toBeTruthy();
  });

  it('renders the logo emoji', () => {
    const { getByText } = render(<RegisterScreen />);
    expect(getByText('👨‍🍳')).toBeTruthy();
  });

  it('renders link to sign in page', () => {
    const { getByText } = render(<RegisterScreen />);
    expect(getByText('Already have an account? Sign In')).toBeTruthy();
  });

  it('renders footer text', () => {
    const { getByText } = render(<RegisterScreen />);
    expect(
      getByText(/By creating an account, you agree to our Terms/)
    ).toBeTruthy();
  });
});
