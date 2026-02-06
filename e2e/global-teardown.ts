import { FullConfig } from '@playwright/test';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Global Teardown for E2E Tests
 *
 * This runs ONCE after all tests to:
 * 1. Clean up the E2E test user and associated data (optional, controlled by env var)
 * 2. Clean up auth state files
 *
 * By default, we DON'T clean up the test user to allow faster subsequent runs.
 * Set E2E_CLEANUP=true to fully clean up after tests.
 */

const CONVEX_URL = process.env.CONVEX_URL || process.env.EXPO_PUBLIC_CONVEX_URL;
const SHOULD_CLEANUP = process.env.E2E_CLEANUP === 'true';
const IS_CI = !!process.env.CI;

async function globalTeardown(_config: FullConfig) {
  console.log('\n[Global Teardown] Starting E2E test cleanup...');

  // Clean up auth state directory only in CI or when cleanup is enabled
  // This allows faster local runs by reusing auth state
  const authDir = path.join(__dirname, '.auth');
  if ((IS_CI || SHOULD_CLEANUP) && fs.existsSync(authDir)) {
    const files = fs.readdirSync(authDir);
    for (const file of files) {
      // Keep .gitkeep and user auth files (user.json, user-mobile.json) unless full cleanup
      const isAuthFile = file === 'user.json' || file === 'user-mobile.json';
      if (file !== '.gitkeep' && (!isAuthFile || SHOULD_CLEANUP)) {
        const filePath = path.join(authDir, file);
        try {
          fs.unlinkSync(filePath);
          console.log(`[Global Teardown] Removed auth state file: ${file}`);
        } catch (error) {
          console.log(`[Global Teardown] Warning: Could not remove ${file}:`, error);
        }
      }
    }
  } else {
    console.log('[Global Teardown] Keeping auth state files for faster subsequent runs');
  }

  // Optionally clean up test user from database
  if (SHOULD_CLEANUP && CONVEX_URL) {
    try {
      console.log('[Global Teardown] Cleaning up E2E test user from database...');
      const client = new ConvexHttpClient(CONVEX_URL);
      const result = await client.mutation(api.e2eSeed.clearE2ETestUser);
      console.log(`[Global Teardown] ${result.message}`);
    } catch (error) {
      console.log('[Global Teardown] Warning: Could not clean up test user:', error);
    }
  } else if (!SHOULD_CLEANUP) {
    console.log('[Global Teardown] Skipping database cleanup (set E2E_CLEANUP=true to enable)');
  }

  console.log('[Global Teardown] Cleanup complete\n');
}

export default globalTeardown;
