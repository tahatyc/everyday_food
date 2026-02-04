# Everyday Food - Testing Strategy

> Comprehensive testing plan for unit and E2E testing

## Current State Assessment

| Aspect | Status |
|--------|--------|
| Existing tests | ❌ None |
| Test framework | ❌ Not configured |
| E2E framework | ❌ Not installed |
| CI/CD pipeline | ❌ Not configured |

### Project Scope

- **23 screens** (auth, tabs, modals, dynamic routes)
- **8 UI components** (Button, Card, Input, Badge, Checkbox, IconButton, BottomTabBar, ShareRecipeModal)
- **14 Convex backend files** (recipes, cookbooks, mealPlans, shoppingLists, friends, users, auth, etc.)
- **Complex schema** with 20+ tables and relationships

---

## Phase 1: Unit Testing Setup

### 1.1 Install Dependencies

```bash
npm install --save-dev jest @testing-library/react-native @testing-library/jest-native jest-expo @types/jest
```

### 1.2 Jest Configuration

Create `jest.config.js`:

```javascript
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|convex)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testPathIgnorePatterns: ['/node_modules/', '/convex/_generated/'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'app/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
};
```

### 1.3 Test Setup File

Create `jest.setup.js`:

```javascript
import '@testing-library/jest-native/extend-expect';

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  },
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  useSegments: () => [],
  Link: 'Link',
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock Convex
jest.mock('convex/react', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(() => jest.fn()),
  useConvex: jest.fn(),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
```

### 1.4 Add Scripts to package.json

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --reporters=default --reporters=jest-junit"
  }
}
```

---

## Phase 2: Unit Test Implementation

### 2.1 UI Component Tests (Priority: HIGH)

Create `__tests__/` folders alongside components.

#### Example: Button.test.tsx

```typescript
// src/components/ui/__tests__/Button.test.tsx
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
    const { getByText } = render(<Button onPress={onPress} disabled>Press</Button>);
    fireEvent.press(getByText('Press'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows loading indicator when loading', () => {
    const { queryByText, UNSAFE_getByType } = render(
      <Button loading>Loading</Button>
    );
    expect(queryByText('Loading')).toBeNull();
  });

  it('applies variant styles correctly', () => {
    const { getByText } = render(<Button variant="danger">Danger</Button>);
    expect(getByText('Danger')).toBeTruthy();
  });
});
```

#### Component Test Checklist

| Component | Tests Needed |
|-----------|-------------|
| `Button` | Variants, sizes, disabled, loading, press handler |
| `Card` | Rendering, custom styles, children |
| `Input` | Value changes, validation, placeholder, error states |
| `Badge` | Text display, colors, sizes |
| `Checkbox` | Checked/unchecked, toggle, disabled |
| `IconButton` | Icon display, press handler, variants |
| `BottomTabBar` | Tab selection, navigation, active state |
| `ShareRecipeModal` | Open/close, share actions, copy link |

### 2.2 Screen Tests (Priority: MEDIUM)

#### Test Helper: ConvexMockProvider

```typescript
// __tests__/helpers/ConvexMockProvider.tsx
import React from 'react';
import { ConvexProvider } from 'convex/react';

const mockClient = {
  // Mock Convex client methods
};

export const ConvexMockProvider = ({ children }: { children: React.ReactNode }) => {
  return <ConvexProvider client={mockClient as any}>{children}</ConvexProvider>;
};
```

#### Screen Test Example: Login

```typescript
// app/(auth)/__tests__/login.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '../login';

jest.mock('convex/react', () => ({
  useMutation: () => jest.fn().mockResolvedValue({ success: true }),
  useQuery: () => null,
}));

describe('LoginScreen', () => {
  it('renders email and password inputs', () => {
    const { getByPlaceholderText } = render(<LoginScreen />);
    expect(getByPlaceholderText(/email/i)).toBeTruthy();
    expect(getByPlaceholderText(/password/i)).toBeTruthy();
  });

  it('shows validation error for invalid email', async () => {
    const { getByPlaceholderText, getByText, queryByText } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText(/email/i), 'invalid-email');
    fireEvent.press(getByText(/sign in/i));

    await waitFor(() => {
      expect(queryByText(/valid email/i)).toBeTruthy();
    });
  });

  it('navigates to register screen', () => {
    const { getByText } = render(<LoginScreen />);
    fireEvent.press(getByText(/create account/i));
    // Assert navigation was called
  });
});
```

### 2.3 Convex Backend Tests (Priority: HIGH)

#### Install Convex Test Utilities

```bash
npm install --save-dev convex-test
```

#### Example: Recipe Functions Test

```typescript
// convex/__tests__/recipes.test.ts
import { convexTest } from 'convex-test';
import { expect, test, describe } from 'vitest';
import { api } from '../_generated/api';
import schema from '../schema';

describe('recipes', () => {
  test('create recipe', async () => {
    const t = convexTest(schema);

    // Create test user
    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert('users', {
        tokenIdentifier: 'test-user',
        email: 'test@example.com',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    // Test recipe creation
    const recipeId = await t.mutation(api.recipes.create, {
      title: 'Test Recipe',
      servings: 4,
      prepTime: 15,
      cookTime: 30,
    });

    expect(recipeId).toBeDefined();

    // Verify recipe was created
    const recipe = await t.run(async (ctx) => {
      return await ctx.db.get(recipeId);
    });

    expect(recipe?.title).toBe('Test Recipe');
    expect(recipe?.servings).toBe(4);
  });

  test('toggle favorite', async () => {
    const t = convexTest(schema);

    // Setup: create user and recipe
    const { userId, recipeId } = await t.run(async (ctx) => {
      const userId = await ctx.db.insert('users', {
        tokenIdentifier: 'test-user',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      const recipeId = await ctx.db.insert('recipes', {
        userId,
        title: 'Test Recipe',
        servings: 4,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return { userId, recipeId };
    });

    // Test toggle
    await t.mutation(api.recipes.toggleFavorite, { recipeId });

    const recipe = await t.run(async (ctx) => ctx.db.get(recipeId));
    expect(recipe?.isFavorite).toBe(true);
  });
});
```

### 2.4 Zustand Store Tests (Priority: MEDIUM)

```typescript
// src/stores/__tests__/useAppStore.test.ts
import { renderHook, act } from '@testing-library/react-native';
import { useAppStore } from '../useAppStore';

describe('useAppStore', () => {
  beforeEach(() => {
    useAppStore.setState({ /* initial state */ });
  });

  it('updates user preferences', () => {
    const { result } = renderHook(() => useAppStore());

    act(() => {
      result.current.setPreferredUnits('metric');
    });

    expect(result.current.preferredUnits).toBe('metric');
  });
});
```

---

## Phase 3: E2E Testing Setup

### Option A: Maestro (Recommended)

Maestro is simpler, YAML-based, and works great with Expo.

#### 3.1 Install Maestro

```bash
# macOS
brew install maestro

# Windows (via WSL)
curl -Ls "https://get.maestro.mobile.dev" | bash

# Verify installation
maestro --version
```

#### 3.2 Create Maestro Tests

Create `.maestro/` folder in project root.

**`.maestro/auth/login.yaml`**:
```yaml
appId: com.everydayfood.app
---
- launchApp
- assertVisible: "Sign In"
- tapOn: "Email"
- inputText: "test@example.com"
- tapOn: "Password"
- inputText: "password123"
- tapOn: "Sign In"
- assertVisible: "Home"
```

**`.maestro/auth/register.yaml`**:
```yaml
appId: com.everydayfood.app
---
- launchApp
- tapOn: "Create Account"
- assertVisible: "Register"
- tapOn: "Name"
- inputText: "Test User"
- tapOn: "Email"
- inputText: "newuser@example.com"
- tapOn: "Password"
- inputText: "securepassword123"
- tapOn: "Create Account"
- assertVisible: "Home"
```

**`.maestro/recipes/create-recipe.yaml`**:
```yaml
appId: com.everydayfood.app
---
- launchApp
- tapOn: "Recipes"
- tapOn: "Add Recipe"
- tapOn: "Title"
- inputText: "Test Recipe"
- tapOn: "Servings"
- inputText: "4"
- tapOn: "Add Ingredient"
- inputText: "2 cups flour"
- tapOn: "Add Step"
- inputText: "Mix ingredients together"
- tapOn: "Save"
- assertVisible: "Test Recipe"
```

**`.maestro/meal-plan/add-meal.yaml`**:
```yaml
appId: com.everydayfood.app
---
- launchApp
- tapOn: "Meal Plan"
- tapOn: "Add Meal"
- tapOn: "Breakfast"
- assertVisible: "Select Recipe"
- tapOn:
    index: 0
- tapOn: "Add to Plan"
- assertVisible: "Breakfast"
```

#### 3.3 Run Maestro Tests

```bash
# Run single test
maestro test .maestro/auth/login.yaml

# Run all tests
maestro test .maestro/

# Run with recording
maestro test .maestro/auth/login.yaml --format junit --output results.xml
```

### Option B: Detox (More Comprehensive)

Detox is more mature but requires more setup.

#### 3.1 Install Detox

```bash
npm install --save-dev detox @types/detox jest-circus
brew tap wix/brew
brew install applesimutils  # macOS only
```

#### 3.2 Detox Configuration

Create `detox.config.js`:

```javascript
module.exports = {
  testRunner: {
    args: {
      $0: 'jest',
      config: 'e2e/jest.config.js',
    },
    jest: {
      setupTimeout: 120000,
    },
  },
  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/EverydayFood.app',
      build: 'xcodebuild -workspace ios/EverydayFood.xcworkspace -scheme EverydayFood -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build',
    },
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build: 'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug',
    },
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: { type: 'iPhone 15' },
    },
    emulator: {
      type: 'android.emulator',
      device: { avdName: 'Pixel_6_API_33' },
    },
  },
  configurations: {
    'ios.sim.debug': {
      device: 'simulator',
      app: 'ios.debug',
    },
    'android.emu.debug': {
      device: 'emulator',
      app: 'android.debug',
    },
  },
};
```

#### 3.3 Detox Test Example

```typescript
// e2e/auth.test.ts
import { device, element, by, expect } from 'detox';

describe('Authentication', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should login with valid credentials', async () => {
    await element(by.placeholder('Email')).typeText('test@example.com');
    await element(by.placeholder('Password')).typeText('password123');
    await element(by.text('Sign In')).tap();

    await expect(element(by.text('Home'))).toBeVisible();
  });

  it('should show error with invalid credentials', async () => {
    await element(by.placeholder('Email')).typeText('invalid@example.com');
    await element(by.placeholder('Password')).typeText('wrongpassword');
    await element(by.text('Sign In')).tap();

    await expect(element(by.text('Invalid credentials'))).toBeVisible();
  });
});
```

---

## Phase 4: Test Coverage Goals

### Coverage Targets

| Category | Target | Priority |
|----------|--------|----------|
| UI Components | 80% | HIGH |
| Convex Functions | 70% | HIGH |
| Screen Logic | 60% | MEDIUM |
| E2E Critical Paths | 100% | HIGH |
| Zustand Stores | 70% | MEDIUM |

### Critical User Flows (E2E)

| Flow | Priority |
|------|----------|
| User registration | HIGH |
| User login/logout | HIGH |
| Create recipe | HIGH |
| Add to meal plan | HIGH |
| Generate shopping list | HIGH |
| Share recipe | MEDIUM |
| Cook mode walkthrough | MEDIUM |
| Add/manage friends | LOW |

---

## Phase 5: CI/CD Integration

### GitHub Actions Workflow

Create `.github/workflows/test.yml`:

```yaml
name: Test

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:ci

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info

  e2e-tests:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install Maestro
        run: brew install maestro

      - name: Install dependencies
        run: npm ci

      - name: Build app
        run: npx expo prebuild && npx expo run:ios --configuration Release

      - name: Run E2E tests
        run: maestro test .maestro/ --format junit --output e2e-results.xml

      - name: Upload E2E results
        uses: actions/upload-artifact@v4
        with:
          name: e2e-results
          path: e2e-results.xml
```

---

## Implementation Timeline

### Week 1: Foundation
- [ ] Install unit testing dependencies
- [ ] Configure Jest for Expo
- [ ] Create mock providers and setup files
- [ ] Write tests for 2-3 UI components

### Week 2: Unit Tests
- [ ] Complete UI component tests (all 8 components)
- [ ] Set up Convex test utilities
- [ ] Write tests for core Convex functions (recipes, users)

### Week 3: E2E Setup
- [ ] Install Maestro
- [ ] Write E2E tests for auth flows
- [ ] Write E2E tests for recipe CRUD

### Week 4: Coverage & CI
- [ ] Write E2E tests for meal planning
- [ ] Set up GitHub Actions workflow
- [ ] Achieve 70% unit test coverage
- [ ] Document testing guidelines

---

## File Structure

```
everyday_food/
├── __tests__/
│   └── helpers/
│       ├── ConvexMockProvider.tsx
│       └── testUtils.ts
├── .maestro/
│   ├── auth/
│   │   ├── login.yaml
│   │   └── register.yaml
│   ├── recipes/
│   │   ├── create-recipe.yaml
│   │   └── view-recipe.yaml
│   └── meal-plan/
│       └── add-meal.yaml
├── src/
│   └── components/
│       └── ui/
│           └── __tests__/
│               ├── Button.test.tsx
│               ├── Card.test.tsx
│               └── Input.test.tsx
├── convex/
│   └── __tests__/
│       ├── recipes.test.ts
│       ├── mealPlans.test.ts
│       └── users.test.ts
├── jest.config.js
├── jest.setup.js
└── .github/
    └── workflows/
        └── test.yml
```

---

## Commands Reference

```bash
# Unit tests
npm test                    # Run all unit tests
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage report

# E2E tests (Maestro)
maestro test .maestro/      # Run all E2E tests
maestro studio              # Visual test builder

# Convex tests
npx vitest convex/          # Run Convex function tests
```

---

## Next Steps

1. **Start with Phase 1** - Get Jest configured and working
2. **Pick 2-3 components** to test first (Button, Input recommended)
3. **Install Maestro** and write your first E2E test
4. **Iterate** - Add more tests as you develop new features

---

*Generated by Quality Engineer Agent • 2026-02-03*
