import { test, expect } from '@playwright/test';

/**
 * Authentication UI Tests
 * 
 * These tests focus on the auth flow UI elements.
 * Note: Since we don't mock Clerk, these tests will check for the presence of auth UI
 * elements but won't complete actual authentication.
 */

test.describe('Authentication UI', () => {
  test('should redirect to sign-in when accessing protected route', async ({ page }) => {
    // Navigate to root (which is protected)
    await page.goto('/');
    
    // Should redirect to sign-in page
    await expect(page).toHaveURL(/.*sign-in.*/);
    
    // Looking at the screenshot, we can see the exact text on the sign-in page
    // Check for the heading that contains both the product name and sign-in text
    await expect(page.locator('text=Sign in to ecommerce-product-category-management-system')).toBeVisible();
    
    // Check for the email field which is definitely visible
    await expect(page.locator('input[placeholder="Enter your email address"]')).toBeVisible();
    
    // Check for the continue button - using a more specific selector to avoid strict mode violation
    await expect(page.getByRole('button', { name: 'Continue', exact: true })).toBeVisible();
  });

  test('should show sign-up option on sign-in page', async ({ page }) => {
    // Go to sign-in page
    await page.goto('/sign-in');
    
    // Check only for the "Sign up" link
    await expect(page.getByRole('link', { name: 'Sign up' })).toBeVisible();
  });

  test('should navigate to sign-up page', async ({ page }) => {
    // Go to sign-in page
    await page.goto('/sign-in');
    
    // Find and click the sign-up link (using more specific selector)
    await page.getByRole('link', { name: 'Sign up' }).click();
    
    // Should now be on sign-up page
    await expect(page).toHaveURL(/.*sign-up.*/);
  });
}); 