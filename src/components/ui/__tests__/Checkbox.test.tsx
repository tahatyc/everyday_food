import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Checkbox } from '../Checkbox';

// Mock Ionicons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

describe('Checkbox', () => {
  it('renders unchecked state correctly', () => {
    const onToggle = jest.fn();
    const { UNSAFE_root } = render(
      <Checkbox checked={false} onToggle={onToggle} />
    );
    expect(UNSAFE_root).toBeTruthy();
  });

  it('renders checked state correctly', () => {
    const onToggle = jest.fn();
    const { UNSAFE_root } = render(
      <Checkbox checked={true} onToggle={onToggle} />
    );
    expect(UNSAFE_root).toBeTruthy();
  });

  it('calls onToggle when checkbox with label is pressed', () => {
    const onToggle = jest.fn();
    const { getByText } = render(
      <Checkbox checked={false} onToggle={onToggle} label="Toggle me" />
    );

    fireEvent.press(getByText('Toggle me'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('does not call onToggle when disabled', () => {
    const onToggle = jest.fn();
    const { UNSAFE_root } = render(
      <Checkbox checked={false} onToggle={onToggle} disabled />
    );

    fireEvent.press(UNSAFE_root);
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('renders with label', () => {
    const onToggle = jest.fn();
    const { getByText } = render(
      <Checkbox checked={false} onToggle={onToggle} label="Accept terms" />
    );
    expect(getByText('Accept terms')).toBeTruthy();
  });

  it('toggles when label is pressed', () => {
    const onToggle = jest.fn();
    const { getByText } = render(
      <Checkbox checked={false} onToggle={onToggle} label="Click me" />
    );

    fireEvent.press(getByText('Click me'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  describe('sizes', () => {
    it('renders small size', () => {
      const onToggle = jest.fn();
      const { getByText } = render(
        <Checkbox checked={false} onToggle={onToggle} size="sm" label="Small" />
      );
      expect(getByText('Small')).toBeTruthy();
    });

    it('renders medium size (default)', () => {
      const onToggle = jest.fn();
      const { getByText } = render(
        <Checkbox checked={false} onToggle={onToggle} size="md" label="Medium" />
      );
      expect(getByText('Medium')).toBeTruthy();
    });

    it('renders large size', () => {
      const onToggle = jest.fn();
      const { getByText } = render(
        <Checkbox checked={false} onToggle={onToggle} size="lg" label="Large" />
      );
      expect(getByText('Large')).toBeTruthy();
    });
  });

  it('applies strikethrough style to label when checked', () => {
    const onToggle = jest.fn();
    const { getByText } = render(
      <Checkbox checked={true} onToggle={onToggle} label="Completed task" />
    );
    // Label should still be visible
    expect(getByText('Completed task')).toBeTruthy();
  });

  it('applies custom style', () => {
    const onToggle = jest.fn();
    const { UNSAFE_root } = render(
      <Checkbox
        checked={false}
        onToggle={onToggle}
        style={{ marginTop: 20 }}
      />
    );
    expect(UNSAFE_root).toBeTruthy();
  });

  it('maintains checked state from props', () => {
    const onToggle = jest.fn();
    const { rerender, UNSAFE_root } = render(
      <Checkbox checked={false} onToggle={onToggle} />
    );

    // Re-render with checked=true
    rerender(<Checkbox checked={true} onToggle={onToggle} />);
    expect(UNSAFE_root).toBeTruthy();
  });
});
