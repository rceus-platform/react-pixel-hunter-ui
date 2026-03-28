/**
 * Global Test Setup Module
 *
 * Responsibilities:
 * - Configure the testing environment (React Testing Library, DOM mocks)
 * - Provide global test utilities and cleanup logic
 *
 * Boundaries:
 * - No feature-specific tests
 */

import '@testing-library/jest-dom';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
});
