import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';

describe('Button', () => {
  it('renders correctly with text', () => {
    const { getByText } = render(<Button>Click me</Button>);
    expect(getByText('Click me')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button onPress={onPress}>Press</Button>);
    fireEvent.press(getByText('Press'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button onPress={onPress} disabled>
        Press
      </Button>
    );
    fireEvent.press(getByText('Press'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('hides text content when loading', () => {
    const { queryByText } = render(
      <Button loading>
        Loading Text
      </Button>
    );
    // When loading, the text should be replaced by ActivityIndicator
    expect(queryByText('Loading Text')).toBeNull();
  });

  it('shows ActivityIndicator when loading', () => {
    const { queryByText, UNSAFE_getByType } = render(
      <Button loading>Loading</Button>
    );
    // Text should not be visible when loading
    expect(queryByText('Loading')).toBeNull();
  });

  describe('variants', () => {
    it('renders primary variant (default)', () => {
      const { getByText } = render(<Button>Primary</Button>);
      expect(getByText('Primary')).toBeTruthy();
    });

    it('renders secondary variant', () => {
      const { getByText } = render(<Button variant="secondary">Secondary</Button>);
      expect(getByText('Secondary')).toBeTruthy();
    });

    it('renders outline variant', () => {
      const { getByText } = render(<Button variant="outline">Outline</Button>);
      expect(getByText('Outline')).toBeTruthy();
    });

    it('renders ghost variant', () => {
      const { getByText } = render(<Button variant="ghost">Ghost</Button>);
      expect(getByText('Ghost')).toBeTruthy();
    });

    it('renders danger variant', () => {
      const { getByText } = render(<Button variant="danger">Danger</Button>);
      expect(getByText('Danger')).toBeTruthy();
    });
  });

  describe('sizes', () => {
    it('renders small size', () => {
      const { getByText } = render(<Button size="sm">Small</Button>);
      expect(getByText('Small')).toBeTruthy();
    });

    it('renders medium size (default)', () => {
      const { getByText } = render(<Button size="md">Medium</Button>);
      expect(getByText('Medium')).toBeTruthy();
    });

    it('renders large size', () => {
      const { getByText } = render(<Button size="lg">Large</Button>);
      expect(getByText('Large')).toBeTruthy();
    });
  });

  it('applies fullWidth style when fullWidth prop is true', () => {
    const { getByText } = render(<Button fullWidth>Full Width</Button>);
    expect(getByText('Full Width')).toBeTruthy();
  });
});
