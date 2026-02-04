import { render, RenderOptions } from '@testing-library/react-native';
import React, { ReactElement } from 'react';

/**
 * Custom render function that wraps components with necessary providers.
 * Extend this as needed when adding more providers (theme, navigation, etc.)
 */
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { ...options });
}

// Re-export everything from testing-library
export * from '@testing-library/react-native';

// Override render with custom render
export { customRender as render };

/**
 * Helper to wait for async operations in tests
 */
export const waitForAsync = (ms: number = 0) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Helper to create a mock press event
 */
export const createMockPressEvent = () => ({
  nativeEvent: {
    changedTouches: [],
    identifier: 0,
    locationX: 0,
    locationY: 0,
    pageX: 0,
    pageY: 0,
    target: 0,
    timestamp: Date.now(),
    touches: [],
  },
});
