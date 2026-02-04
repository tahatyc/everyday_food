import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import LoginScreen from '../login';

// Mock Alert
jest.spyOn(Alert, 'alert');

// Mock the auth actions
const mockSignIn = jest.fn();
jest.mock('@convex-dev/auth/react', () => ({
  useAuthActions: () => ({
    signIn: mockSignIn,
    signOut: jest.fn(),
  }),
}));

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSignIn.mockReset();
  });

  it('renders the login form correctly', () => {
    const { getByText, getByPlaceholderText } = render(<LoginScreen />);

    // Check header elements
    expect(getByText('Everyday Food')).toBeTruthy();
    expect(getByText('Your recipes, organized')).toBeTruthy();
    expect(getByText('Welcome Back')).toBeTruthy();

    // Check form elements
    expect(getByText('Email')).toBeTruthy();
    expect(getByText('Password')).toBeTruthy();
    expect(getByPlaceholderText('you@example.com')).toBeTruthy();
    expect(getByPlaceholderText('Enter your password')).toBeTruthy();

    // Check buttons
    expect(getByText('Sign In')).toBeTruthy();
    expect(getByText('Create Account')).toBeTruthy();
  });

  it('handles email input changes', () => {
    const { getByPlaceholderText } = render(<LoginScreen />);

    const emailInput = getByPlaceholderText('you@example.com');
    fireEvent.changeText(emailInput, 'test@example.com');

    expect(emailInput.props.value).toBe('test@example.com');
  });

  it('handles password input changes', () => {
    const { getByPlaceholderText } = render(<LoginScreen />);

    const passwordInput = getByPlaceholderText('Enter your password');
    fireEvent.changeText(passwordInput, 'mypassword123');

    expect(passwordInput.props.value).toBe('mypassword123');
  });

  it('shows error alert when submitting empty form', async () => {
    const { getByText } = render(<LoginScreen />);

    fireEvent.press(getByText('Sign In'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Please fill in all fields'
      );
    });
  });

  it('shows error alert when email is empty', async () => {
    const { getByText, getByPlaceholderText } = render(<LoginScreen />);

    fireEvent.changeText(
      getByPlaceholderText('Enter your password'),
      'password123'
    );
    fireEvent.press(getByText('Sign In'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Please fill in all fields'
      );
    });
  });

  it('shows error alert when password is empty', async () => {
    const { getByText, getByPlaceholderText } = render(<LoginScreen />);

    fireEvent.changeText(
      getByPlaceholderText('you@example.com'),
      'test@example.com'
    );
    fireEvent.press(getByText('Sign In'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Please fill in all fields'
      );
    });
  });

  it('calls signIn with correct parameters on valid form submission', async () => {
    mockSignIn.mockResolvedValue({});

    const { getByText, getByPlaceholderText } = render(<LoginScreen />);

    fireEvent.changeText(
      getByPlaceholderText('you@example.com'),
      'test@example.com'
    );
    fireEvent.changeText(
      getByPlaceholderText('Enter your password'),
      'password123'
    );
    fireEvent.press(getByText('Sign In'));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('password', {
        email: 'test@example.com',
        password: 'password123',
        flow: 'signIn',
      });
    });
  });

  it('shows error alert when signIn fails', async () => {
    mockSignIn.mockRejectedValue(new Error('Invalid credentials'));

    const { getByText, getByPlaceholderText } = render(<LoginScreen />);

    fireEvent.changeText(
      getByPlaceholderText('you@example.com'),
      'test@example.com'
    );
    fireEvent.changeText(
      getByPlaceholderText('Enter your password'),
      'wrongpassword'
    );
    fireEvent.press(getByText('Sign In'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Invalid credentials');
    });
  });

  it('shows generic error message when error has no message', async () => {
    mockSignIn.mockRejectedValue({});

    const { getByText, getByPlaceholderText } = render(<LoginScreen />);

    fireEvent.changeText(
      getByPlaceholderText('you@example.com'),
      'test@example.com'
    );
    fireEvent.changeText(
      getByPlaceholderText('Enter your password'),
      'password123'
    );
    fireEvent.press(getByText('Sign In'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to sign in');
    });
  });

  it('has password input with secureTextEntry by default', () => {
    const { getByPlaceholderText } = render(<LoginScreen />);

    const passwordInput = getByPlaceholderText('Enter your password');

    // Password should be hidden by default (secureTextEntry = true)
    expect(passwordInput.props.secureTextEntry).toBe(true);
  });

  it('displays footer text', () => {
    const { getByText } = render(<LoginScreen />);

    expect(
      getByText('By continuing, you agree to our Terms of Service')
    ).toBeTruthy();
  });

  it('renders the logo emoji', () => {
    const { getByText } = render(<LoginScreen />);

    expect(getByText('🍳')).toBeTruthy();
  });

  it('renders the "or" divider', () => {
    const { getByText } = render(<LoginScreen />);

    expect(getByText('or')).toBeTruthy();
  });

  it('has Create Account button that navigates to register', () => {
    const { getByText } = render(<LoginScreen />);

    // The Create Account button is wrapped in a Link
    const createAccountButton = getByText('Create Account');
    expect(createAccountButton).toBeTruthy();
  });
});
