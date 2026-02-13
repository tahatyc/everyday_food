import React from 'react';
import { render } from '@testing-library/react-native';
import ModalScreen from '../modal';

// Mock the Themed components
jest.mock('@/components/Themed', () => {
  const { View, Text } = require('react-native');
  return {
    Text: ({ children, ...props }: any) =>
      require('react').createElement(Text, props, children),
    View: ({ children, ...props }: any) =>
      require('react').createElement(View, props, children),
  };
});

// Mock EditScreenInfo
jest.mock('@/components/EditScreenInfo', () => {
  const { Text } = require('react-native');
  return {
    __esModule: true,
    default: ({ path }: { path: string }) =>
      require('react').createElement(Text, {}, `EditScreenInfo: ${path}`),
  };
});

// Mock expo-status-bar
jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

describe('ModalScreen', () => {
  it('renders children correctly', () => {
    const { getByText } = render(<ModalScreen />);

    expect(getByText('Modal')).toBeTruthy();
    expect(getByText('EditScreenInfo: app/modal.tsx')).toBeTruthy();
  });

  it('renders with proper container structure', () => {
    const { getByText, toJSON } = render(<ModalScreen />);

    // Verify the modal title is rendered
    const modalTitle = getByText('Modal');
    expect(modalTitle).toBeTruthy();

    // Verify the component tree renders without errors
    const tree = toJSON();
    expect(tree).toBeTruthy();
  });
});
