# E-commerce Category Management UI Tests

This directory contains UI integration tests for the E-commerce Category Management system using Playwright.

## Overview

These tests focus on verifying the UI functionality, including:

- Category CRUD operations (Create, Read, Update, Delete)
- UI state handling (loading, error states)
- Authentication flow (not mocked, but testing UI elements)

## Running the Tests

You can run the tests using the following npm scripts:

```bash
# Run all tests headlessly
npm run test

# Run tests with UI mode (shows a UI to inspect and debug tests)
npm run test:ui

# Run tests in debug mode (opens browser and shows step-by-step execution)
npm run test:debug
```

## Test Files

1. `category-management.spec.ts` - Tests for the main category management features
2. `auth.spec.ts` - Tests for authentication-related UI flows
3. `ui-states.spec.ts` - Tests for loading states, error handling, and other UI states

## Authentication Note

Most tests will redirect to the authentication page if you're not logged in. To fully run these tests:

1. Sign in to the application first in a browser
2. Use the storage state option in Playwright to save and reuse your authentication cookies
3. Or modify `playwright.config.ts` to use stored auth credentials

## Creating Storage State for Auth

You can save your authentication state with this command:

```bash
npx playwright chromium --save-storage=auth.json
```

Then add to the Playwright config:

```ts
use: {
  // Other config...
  storageState: 'auth.json',
},
```

## Tips for Testing

- Tests try to handle authentication gracefully with try/catch blocks
- When running in debug mode, you can see exactly where test failures occur
- For CI environments, tests will attempt graceful failures when auth is required 