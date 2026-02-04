import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Input } from '../Input';

// Mock Ionicons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

describe('Input', () => {
  it('renders correctly with placeholder', () => {
    const { getByPlaceholderText } = render(
      <Input placeholder="Enter text" />
    );
    expect(getByPlaceholderText('Enter text')).toBeTruthy();
  });

  it('renders with label', () => {
    const { getByText } = render(
      <Input label="Email" placeholder="Enter email" />
    );
    expect(getByText('Email')).toBeTruthy();
  });

  it('handles text input changes', () => {
    const onChangeText = jest.fn();
    const { getByPlaceholderText } = render(
      <Input placeholder="Type here" onChangeText={onChangeText} />
    );

    fireEvent.changeText(getByPlaceholderText('Type here'), 'test@example.com');
    expect(onChangeText).toHaveBeenCalledWith('test@example.com');
  });

  it('displays value correctly', () => {
    const { getByDisplayValue } = render(
      <Input value="test value" onChangeText={() => {}} />
    );
    expect(getByDisplayValue('test value')).toBeTruthy();
  });

  it('displays error message', () => {
    const { getByText } = render(
      <Input error="This field is required" placeholder="Enter text" />
    );
    expect(getByText('This field is required')).toBeTruthy();
  });

  it('displays helper text', () => {
    const { getByText } = render(
      <Input helperText="Enter your email address" placeholder="Email" />
    );
    expect(getByText('Enter your email address')).toBeTruthy();
  });

  it('displays error over helper text when both provided', () => {
    const { getByText, queryByText } = render(
      <Input
        error="Invalid email"
        helperText="Enter your email"
        placeholder="Email"
      />
    );
    expect(getByText('Invalid email')).toBeTruthy();
    expect(queryByText('Enter your email')).toBeNull();
  });

  it('handles focus state', () => {
    const { getByPlaceholderText } = render(
      <Input placeholder="Focus me" />
    );

    const input = getByPlaceholderText('Focus me');
    fireEvent(input, 'focus');
    fireEvent(input, 'blur');
    // Component should not crash on focus/blur
    expect(input).toBeTruthy();
  });

  it('renders with left icon', () => {
    const { getByPlaceholderText } = render(
      <Input leftIcon="mail-outline" placeholder="Email" />
    );
    expect(getByPlaceholderText('Email')).toBeTruthy();
  });

  it('renders with right icon', () => {
    const { getByPlaceholderText } = render(
      <Input rightIcon="eye-outline" placeholder="Password" />
    );
    expect(getByPlaceholderText('Password')).toBeTruthy();
  });

  it('renders with right icon and onRightIconPress handler', () => {
    const onRightIconPress = jest.fn();
    const { getByPlaceholderText } = render(
      <Input
        rightIcon="eye-outline"
        placeholder="Password"
        onRightIconPress={onRightIconPress}
      />
    );

    // Verify the input renders with the right icon configuration
    expect(getByPlaceholderText('Password')).toBeTruthy();
  });

  it('handles secureTextEntry prop', () => {
    const { getByPlaceholderText } = render(
      <Input placeholder="Password" secureTextEntry />
    );
    const input = getByPlaceholderText('Password');
    expect(input.props.secureTextEntry).toBe(true);
  });

  it('applies custom containerStyle', () => {
    const { getByPlaceholderText } = render(
      <Input placeholder="Styled" containerStyle={{ marginTop: 20 }} />
    );
    expect(getByPlaceholderText('Styled')).toBeTruthy();
  });

  it('handles autoCapitalize and autoCorrect props', () => {
    const { getByPlaceholderText } = render(
      <Input
        placeholder="Email"
        autoCapitalize="none"
        autoCorrect={false}
      />
    );
    const input = getByPlaceholderText('Email');
    expect(input.props.autoCapitalize).toBe('none');
    expect(input.props.autoCorrect).toBe(false);
  });

  it('handles keyboardType prop', () => {
    const { getByPlaceholderText } = render(
      <Input placeholder="Email" keyboardType="email-address" />
    );
    const input = getByPlaceholderText('Email');
    expect(input.props.keyboardType).toBe('email-address');
  });
});
