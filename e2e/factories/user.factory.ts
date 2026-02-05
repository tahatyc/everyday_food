/**
 * User test data factory
 * Generates test data for user-related E2E tests
 */

export interface TestUser {
  name: string;
  email: string;
  password: string;
}

/**
 * Default test user (matches auth fixture)
 */
export const DEFAULT_TEST_USER: TestUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'Password123!',
};

/**
 * Secondary test user for friend/sharing tests
 */
export const SECONDARY_TEST_USER: TestUser = {
  name: 'Friend User',
  email: 'friend@example.com',
  password: 'Password123!',
};

/**
 * Generate a unique test user
 */
export function createTestUser(overrides: Partial<TestUser> = {}): TestUser {
  const timestamp = Date.now();
  return {
    name: `Test User ${timestamp}`,
    email: `testuser${timestamp}@example.com`,
    password: 'Password123!',
    ...overrides,
  };
}

/**
 * Generate a user with invalid email format
 */
export function createInvalidEmailUser(): TestUser {
  return {
    name: 'Invalid Email User',
    email: 'not-an-email',
    password: 'Password123!',
  };
}

/**
 * Generate a user with weak password
 */
export function createWeakPasswordUser(): TestUser {
  return {
    name: 'Weak Password User',
    email: `weakpass${Date.now()}@example.com`,
    password: '123',
  };
}

/**
 * Generate multiple test users (for friend list tests)
 */
export function createTestUsers(count: number): TestUser[] {
  const timestamp = Date.now();
  return Array.from({ length: count }, (_, i) => ({
    name: `Test User ${i + 1}`,
    email: `testuser${timestamp}${i}@example.com`,
    password: 'Password123!',
  }));
}

/**
 * User credentials for login tests
 */
export const LOGIN_CREDENTIALS = {
  valid: {
    email: DEFAULT_TEST_USER.email,
    password: DEFAULT_TEST_USER.password,
  },
  invalidEmail: {
    email: 'nonexistent@example.com',
    password: 'anypassword123',
  },
  wrongPassword: {
    email: DEFAULT_TEST_USER.email,
    password: 'wrongpassword',
  },
  emptyFields: {
    email: '',
    password: '',
  },
};
