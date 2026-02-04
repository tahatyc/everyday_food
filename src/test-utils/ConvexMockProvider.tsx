import React from 'react';

// Mock Convex client for testing
const mockClient = {
  query: jest.fn(),
  mutation: jest.fn(),
  action: jest.fn(),
};

interface ConvexMockProviderProps {
  children: React.ReactNode;
}

/**
 * Mock provider for wrapping components that use Convex hooks in tests.
 * Since we mock convex/react globally in jest.setup.js, this provider
 * is mainly for structural consistency and future extensibility.
 */
export function ConvexMockProvider({ children }: ConvexMockProviderProps) {
  return <>{children}</>;
}

/**
 * Helper to set up mock return values for useQuery
 */
export function mockUseQuery<T>(returnValue: T) {
  const { useQuery } = require('convex/react');
  (useQuery as jest.Mock).mockReturnValue(returnValue);
}

/**
 * Helper to set up mock return values for useMutation
 */
export function mockUseMutation(mockFn?: jest.Mock) {
  const { useMutation } = require('convex/react');
  const mutationFn = mockFn || jest.fn();
  (useMutation as jest.Mock).mockReturnValue(mutationFn);
  return mutationFn;
}

/**
 * Reset all Convex mocks between tests
 */
export function resetConvexMocks() {
  const { useQuery, useMutation, useAction } = require('convex/react');
  (useQuery as jest.Mock).mockReset();
  (useMutation as jest.Mock).mockReset().mockReturnValue(jest.fn());
  (useAction as jest.Mock).mockReset().mockReturnValue(jest.fn());
}

export { mockClient };
