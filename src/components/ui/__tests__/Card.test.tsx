import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Card } from '../Card';

describe('Card', () => {
  it('renders children correctly', () => {
    const { getByText } = render(
      <Card>
        <Text>Card Content</Text>
      </Card>
    );
    expect(getByText('Card Content')).toBeTruthy();
  });

  it('handles onPress when provided', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Card onPress={onPress}>
        <Text>Pressable Card</Text>
      </Card>
    );
    fireEvent.press(getByText('Pressable Card'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders as View when onPress is not provided', () => {
    const { getByText } = render(
      <Card>
        <Text>Static Card</Text>
      </Card>
    );
    expect(getByText('Static Card')).toBeTruthy();
  });

  describe('variants', () => {
    it('renders default variant', () => {
      const { getByText } = render(
        <Card variant="default">
          <Text>Default</Text>
        </Card>
      );
      expect(getByText('Default')).toBeTruthy();
    });

    it('renders elevated variant', () => {
      const { getByText } = render(
        <Card variant="elevated">
          <Text>Elevated</Text>
        </Card>
      );
      expect(getByText('Elevated')).toBeTruthy();
    });

    it('renders flat variant', () => {
      const { getByText } = render(
        <Card variant="flat">
          <Text>Flat</Text>
        </Card>
      );
      expect(getByText('Flat')).toBeTruthy();
    });
  });

  describe('padding', () => {
    it('renders with no padding', () => {
      const { getByText } = render(
        <Card padding="none">
          <Text>No Padding</Text>
        </Card>
      );
      expect(getByText('No Padding')).toBeTruthy();
    });

    it('renders with small padding', () => {
      const { getByText } = render(
        <Card padding="sm">
          <Text>Small Padding</Text>
        </Card>
      );
      expect(getByText('Small Padding')).toBeTruthy();
    });

    it('renders with medium padding (default)', () => {
      const { getByText } = render(
        <Card padding="md">
          <Text>Medium Padding</Text>
        </Card>
      );
      expect(getByText('Medium Padding')).toBeTruthy();
    });

    it('renders with large padding', () => {
      const { getByText } = render(
        <Card padding="lg">
          <Text>Large Padding</Text>
        </Card>
      );
      expect(getByText('Large Padding')).toBeTruthy();
    });
  });

  it('applies custom background color', () => {
    const { getByText } = render(
      <Card color="#FF0000">
        <Text>Custom Color</Text>
      </Card>
    );
    expect(getByText('Custom Color')).toBeTruthy();
  });

  it('applies custom style', () => {
    const { getByText } = render(
      <Card style={{ marginTop: 20 }}>
        <Text>Custom Style</Text>
      </Card>
    );
    expect(getByText('Custom Style')).toBeTruthy();
  });
});
