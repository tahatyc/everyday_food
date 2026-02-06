Task Decomposition: E2E Test Authentication Fix
Problem Analysis
Root Cause Identified: Tests are stuck on login because the test user test@example.com doesn't exist in the database. The authentication fixture attempts login, but with no user registered, login fails silently and tests hang waiting for the home screen.

Key Issues:

No global setup to seed test user before tests run
No test user creation/registration in test database
Missing storageState for session reuse (performance)
Inadequate error handling when login fails
Epic: Fix E2E Test Authentication Pipeline
Strategy: Sequential (dependencies between setup → auth → tests)
Task Hierarchy
Story 1: Database & Test User Setup
Task Description Delegation Dependencies
1.1 Create Playwright globalSetup.ts to seed test database /sc:implement None
1.2 Add Convex seed mutation for E2E test user creation /sc:implement None
1.3 Configure playwright.config.ts with globalSetup /sc:implement 1.1
Story 2: Authentication State Management
Task Description Delegation Dependencies
2.1 Implement storageState for session persistence /sc:implement 1.1, 1.2
2.2 Create authenticated setup project in Playwright config /sc:implement 2.1
2.3 Update auth.fixture.ts to use stored auth state /sc:implement 2.2
Story 3: Error Handling & Resilience
Task Description Delegation Dependencies
3.1 Add login failure detection with meaningful errors /sc:implement 2.3
3.2 Add retry logic for flaky auth scenarios /sc:implement 3.1
3.3 Implement globalTeardown for cleanup /sc:implement 1.1
Story 4: Validation & Testing
Task Description Delegation Dependencies
4.1 Run E2E tests to verify fix /sc:test All above
4.2 Verify all test suites pass authentication /sc:test 4.1
Proposed Architecture

playwright.config.ts
├── globalSetup: './e2e/global-setup.ts' # Seed test user
├── globalTeardown: './e2e/global-teardown.ts' # Cleanup
└── projects:
├── 'setup' (runs first, creates auth state)
└── 'chromium' (depends on setup, uses storageState)

e2e/
├── global-setup.ts # NEW: Seed DB with test user
├── global-teardown.ts # NEW: Cleanup test data
├── auth-setup.ts # NEW: Auth setup project
├── .auth/
│ └── user.json # NEW: Stored auth state
└── fixtures/
└── auth.fixture.ts # UPDATED: Use stored state
Execution Order

[1] Global Setup (seed test user via Convex API)
↓
[2] Auth Setup Project (login + save storageState)
↓
[3] Test Projects (use saved auth, skip login)
↓
[4] Global Teardown (cleanup test data)
Next Steps
To execute this plan, run the following commands in order:

/sc:implement "Create global setup for E2E test user seeding"
/sc:implement "Add storageState auth persistence"
/sc:test "Verify E2E authentication fix"
Ready to proceed with implementation? I can start with Story 1 (Database & Test User Setup) using /sc:implement.
