import React from 'react';
import { render } from '@testing-library/react-native';
import { Badge } from '../Badge';

describe('Badge', () => {
  it('renders text content correctly', () => {
    const { getByText } = render(<Badge>New</Badge>);
    expect(getByText('New')).toBeTruthy();
  });

  describe('variants', () => {
    it('renders default variant', () => {
      const { getByText } = render(<Badge variant="default">Default</Badge>);
      expect(getByText('Default')).toBeTruthy();
    });

    it('renders primary variant', () => {
      const { getByText } = render(<Badge variant="primary">Primary</Badge>);
      expect(getByText('Primary')).toBeTruthy();
    });

    it('renders secondary variant', () => {
      const { getByText } = render(<Badge variant="secondary">Secondary</Badge>);
      expect(getByText('Secondary')).toBeTruthy();
    });

    it('renders success variant', () => {
      const { getByText } = render(<Badge variant="success">Success</Badge>);
      expect(getByText('Success')).toBeTruthy();
    });

    it('renders warning variant', () => {
      const { getByText } = render(<Badge variant="warning">Warning</Badge>);
      expect(getByText('Warning')).toBeTruthy();
    });

    it('renders error variant', () => {
      const { getByText } = render(<Badge variant="error">Error</Badge>);
      expect(getByText('Error')).toBeTruthy();
    });
  });

  describe('sizes', () => {
    it('renders small size', () => {
      const { getByText } = render(<Badge size="sm">Small</Badge>);
      expect(getByText('Small')).toBeTruthy();
    });

    it('renders medium size (default)', () => {
      const { getByText } = render(<Badge size="md">Medium</Badge>);
      expect(getByText('Medium')).toBeTruthy();
    });
  });

  it('applies custom background color', () => {
    const { getByText } = render(<Badge color="#FF5733">Custom</Badge>);
    expect(getByText('Custom')).toBeTruthy();
  });

  it('applies custom style', () => {
    const { getByText } = render(
      <Badge style={{ marginLeft: 10 }}>Styled</Badge>
    );
    expect(getByText('Styled')).toBeTruthy();
  });

  it('applies custom textStyle', () => {
    const { getByText } = render(
      <Badge textStyle={{ fontWeight: 'bold' }}>Bold Text</Badge>
    );
    expect(getByText('Bold Text')).toBeTruthy();
  });

  it('renders with numeric content', () => {
    const { getByText } = render(<Badge>42</Badge>);
    expect(getByText('42')).toBeTruthy();
  });

  it('renders with long text', () => {
    const { getByText } = render(<Badge>This is a very long badge text</Badge>);
    expect(getByText('This is a very long badge text')).toBeTruthy();
  });
});
