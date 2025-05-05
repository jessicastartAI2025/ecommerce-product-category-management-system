/**
 * Authentication mock helper for Playwright tests
 * 
 * This helper intercepts Clerk authentication calls and simulates an authenticated state,
 * allowing tests to bypass authentication and access protected routes.
 */

import { Page } from '@playwright/test';

// Dummy user data that represents an authenticated user
const mockUserData = {
  id: 'test_user_id',
  firstName: 'Test',
  lastName: 'User',
  emailAddresses: [{ emailAddress: 'test@example.com' }],
  imageUrl: 'https://example.com/avatar.png'
};

// Default categories for testing
const mockCategories = [
  {
    id: "00000000-0000-4000-a000-000000000001",
    name: "Clothing",
    parentId: null,
    order: 0,
    children: [
      {
        id: "00000000-0000-4000-a000-000000000002",
        name: "Men's Wear",
        parentId: "00000000-0000-4000-a000-000000000001",
        order: 0
      },
      {
        id: "00000000-0000-4000-a000-000000000003",
        name: "Women's Wear",
        parentId: "00000000-0000-4000-a000-000000000001",
        order: 1
      }
    ]
  },
  {
    id: "00000000-0000-4000-a000-000000000016",
    name: "Electronics",
    parentId: null,
    order: 1,
    children: [
      {
        id: "00000000-0000-4000-a000-000000000017",
        name: "Computers",
        parentId: "00000000-0000-4000-a000-000000000016",
        order: 0
      },
      {
        id: "00000000-0000-4000-a000-000000000020",
        name: "Mobile Devices",
        parentId: "00000000-0000-4000-a000-000000000016",
        order: 1
      }
    ]
  },
  {
    id: "00000000-0000-4000-a000-000000000023",
    name: "Home & Garden",
    parentId: null,
    order: 2,
    children: [
      {
        id: "00000000-0000-4000-a000-000000000024",
        name: "Furniture",
        parentId: "00000000-0000-4000-a000-000000000023",
        order: 0
      },
      {
        id: "00000000-0000-4000-a000-000000000025",
        name: "Kitchen Appliances",
        parentId: "00000000-0000-4000-a000-000000000023",
        order: 1
      }
    ]
  }
];

/**
 * Setup authentication mocking for a page
 * 
 * This intercepts Clerk API calls and auth redirects, allowing tests to access 
 * protected routes without real authentication.
 */
export async function mockAuthentication(page: Page) {
  // Intercept Clerk API calls
  await page.route('**/api/clerk/**', async route => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({ 
        user: mockUserData,
        isSignedIn: true,
        isLoaded: true 
      })
    });
  });

  // Intercept API category calls - GET
  await page.route('**/api/categories', async route => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        body: JSON.stringify(mockCategories),
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      // For POST and other methods, just fulfill with success
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ success: true }),
        headers: { 'Content-Type': 'application/json' }
      });
    }
  });

  // Intercept individual category API calls
  await page.route('**/api/categories/**', async route => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({ success: true }),
      headers: { 'Content-Type': 'application/json' }
    });
  });

  // Add custom header that middleware can check for bypassing auth in test mode
  await page.setExtraHTTPHeaders({
    'x-playwright-test': 'true'
  });
  
  // Mock Clerk authentication directly in the browser context
  await page.addInitScript(() => {
    // Create a more comprehensive mock of Clerk
    const mockClerk = {
      // Methods
      load: () => Promise.resolve(),
      mountSignIn: () => Promise.resolve(),
      mountSignUp: () => Promise.resolve(),
      signOut: () => Promise.resolve(),
      openSignIn: () => {},
      openSignUp: () => {},
      
      // Properties
      isReady: true,
      isLoaded: true,
      isSignedIn: true,
      
      // User data
      user: {
        id: 'test_user_id',
        fullName: 'Test User',
        firstName: 'Test',
        lastName: 'User',
        imageUrl: 'https://example.com/avatar.png',
        primaryEmailAddress: { emailAddress: 'test@example.com' },
        emailAddresses: [{ emailAddress: 'test@example.com' }]
      },
      
      // Session
      session: {
        id: 'test_session_id',
        status: 'active',
        lastActiveAt: new Date(),
        expireAt: new Date(Date.now() + 86400000), // 24 hours from now
        abandon: () => Promise.resolve(),
        remove: () => Promise.resolve(),
        touch: () => Promise.resolve()
      }
    };
    
    // Assign to window
    Object.defineProperty(window, 'Clerk', {
      value: mockClerk,
      writable: false
    });
    
    // Also assign to global for server-side code
    // @ts-ignore
    if (typeof global !== 'undefined') {
      // @ts-ignore
      global.Clerk = mockClerk;
    }
    
    // Mock localStorage auth token
    localStorage.setItem('clerk-auth-token', 'mock-jwt-token');
    
    // Prevent redirects to sign-in
    const originalPush = window.history.pushState;
    window.history.pushState = function(state, title, url) {
      const urlString = typeof url === 'string' ? url : url?.toString();
      if (urlString && urlString.includes('sign-in')) {
        console.log('Intercepted redirect to sign-in');
        return;
      }
      return originalPush.apply(this, [state, title, url]);
    };
    
    console.log('Clerk auth mock initialized');
  });
} 