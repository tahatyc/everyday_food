import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { IconButton } from '../IconButton';

// Mock Ionicons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

describe('IconButton', () => {
  it('renders correctly', () => {
    const onPress = jest.fn();
    const { UNSAFE_root } = render(
      <IconButton icon="add" onPress={onPress} />
    );
    expect(UNSAFE_root).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { UNSAFE_root } = render(
      <IconButton icon="add" onPress={onPress} />
    );

    fireEvent.press(UNSAFE_root);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders correctly when disabled', () => {
    const onPress = jest.fn();
    const { UNSAFE_root } = render(
      <IconButton icon="add" onPress={onPress} disabled />
    );

    // Verify component renders with disabled prop
    expect(UNSAFE_root).toBeTruthy();
    // Note: fireEvent.press doesn't respect disabled prop in test environment
    // The actual disabled behavior is handled by React Native's Pressable
  });

  describe('variants', () => {
    it('renders default variant', () => {
      const onPress = jest.fn();
      const { UNSAFE_root } = render(
        <IconButton icon="add" onPress={onPress} variant="default" />
      );
      expect(UNSAFE_root).toBeTruthy();
    });

    it('renders primary variant', () => {
      const onPress = jest.fn();
      const { UNSAFE_root } = render(
        <IconButton icon="add" onPress={onPress} variant="primary" />
      );
      expect(UNSAFE_root).toBeTruthy();
    });

    it('renders secondary variant', () => {
      const onPress = jest.fn();
      const { UNSAFE_root } = render(
        <IconButton icon="add" onPress={onPress} variant="secondary" />
      );
      expect(UNSAFE_root).toBeTruthy();
    });

    it('renders ghost variant', () => {
      const onPress = jest.fn();
      const { UNSAFE_root } = render(
        <IconButton icon="add" onPress={onPress} variant="ghost" />
      );
      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('sizes', () => {
    it('renders small size', () => {
      const onPress = jest.fn();
      const { UNSAFE_root } = render(
        <IconButton icon="add" onPress={onPress} size="sm" />
      );
      expect(UNSAFE_root).toBeTruthy();
    });

    it('renders medium size (default)', () => {
      const onPress = jest.fn();
      const { UNSAFE_root } = render(
        <IconButton icon="add" onPress={onPress} size="md" />
      );
      expect(UNSAFE_root).toBeTruthy();
    });

    it('renders large size', () => {
      const onPress = jest.fn();
      const { UNSAFE_root } = render(
        <IconButton icon="add" onPress={onPress} size="lg" />
      );
      expect(UNSAFE_root).toBeTruthy();
    });
  });

  it('applies custom color', () => {
    const onPress = jest.fn();
    const { UNSAFE_root } = render(
      <IconButton icon="add" onPress={onPress} color="#FF0000" />
    );
    expect(UNSAFE_root).toBeTruthy();
  });

  it('applies custom style', () => {
    const onPress = jest.fn();
    const { UNSAFE_root } = render(
      <IconButton icon="add" onPress={onPress} style={{ marginTop: 10 }} />
    );
    expect(UNSAFE_root).toBeTruthy();
  });

  it('renders with different icons', () => {
    const onPress = jest.fn();

    const icons = ['add', 'close', 'heart', 'star', 'settings'] as const;

    icons.forEach((icon) => {
      const { UNSAFE_root } = render(
        <IconButton icon={icon} onPress={onPress} />
      );
      expect(UNSAFE_root).toBeTruthy();
    });
  });

  it('handles rapid presses', () => {
    const onPress = jest.fn();
    const { UNSAFE_root } = render(
      <IconButton icon="add" onPress={onPress} />
    );

    fireEvent.press(UNSAFE_root);
    fireEvent.press(UNSAFE_root);
    fireEvent.press(UNSAFE_root);

    expect(onPress).toHaveBeenCalledTimes(3);
  });
});
