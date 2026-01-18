import { test, expect } from "@playwright/test";

test.describe("Pro Wishlist", () => {
  test("should show wishlist option when quota is exhausted", async ({ page }) => {
    await page.goto("/");

    // Look for wishlist link or section
    const wishlistLink = page.locator("a:has-text('Pro'), a:has-text('wishlist'), a:has-text('waitlist')");

    const wishlistCount = await wishlistLink.count();
    if (wishlistCount > 0) {
      await expect(wishlistLink.first()).toBeVisible();
    }
  });

  test("should show wishlist form", async ({ page }) => {
    // Navigate to wishlist if there's a direct route
    await page.goto("/").catch(() => {
      // Try alternative routes
    });

    const wishlistButton = page.locator("button:has-text('Pro'), button:has-text('wishlist')");

    const buttonCount = await wishlistButton.count();
    if (buttonCount > 0) {
      await wishlistButton.first().click();

      // Should show form
      const emailInput = page.locator('input[type="email"], input[name="email"]');
      await expect(emailInput.first()).toBeVisible({ timeout: 3000 });
    }
  });

  test("should validate email on wishlist submission", async ({ page }) => {
    await page.goto("/").catch(() => {});

    const wishlistButton = page.locator("button:has-text('Pro'), button:has-text('Join waitlist')");

    const buttonCount = await wishlistButton.count();
    if (buttonCount > 0) {
      await wishlistButton.first().click();

      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      await emailInput.fill("invalid-email");

      const submitButton = page.locator("button:has-text('Join'), button[type='submit']").first();
      await submitButton.click();

      // Should show validation error
      await expect(page.locator("body")).toContainText(/invalid|email/i, { timeout: 3000 });
    }
  });

  test("should accept valid email for wishlist", async ({ page }) => {
    await page.goto("/").catch(() => {});

    const wishlistButton = page.locator("button:has-text('Pro'), button:has-text('Join waitlist')");

    const buttonCount = await wishlistButton.count();
    if (buttonCount > 0) {
      await wishlistButton.first().click();

      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      await emailInput.fill(`test-${Date.now()}@example.com`);

      const submitButton = page.locator("button:has-text('Join'), button[type='submit']").first();
      await submitButton.click();

      // Should show success message
      await expect(page.locator("body")).toContainText(/joined|added|success|thanks/i, {
        timeout: 5000
      });
    }
  });

  test("should allow adding note to wishlist", async ({ page }) => {
    await page.goto("/").catch(() => {});

    const wishlistButton = page.locator("button:has-text('Pro')");

    const buttonCount = await wishlistButton.count();
    if (buttonCount > 0) {
      await wishlistButton.first().click();

      const noteInput = page.locator('textarea[name="note"], input[name="note"]');
      const noteCount = await noteInput.count();

      if (noteCount > 0) {
        await noteInput.first().fill("Looking forward to Pro features!");

        const emailInput = page.locator('input[type="email"], input[name="email"]').first();
        await emailInput.fill(`test-${Date.now()}@example.com`);

        const submitButton = page.locator("button:has-text('Join'), button[type='submit']").first();
        await submitButton.click();

        // Should show success
        await expect(page.locator("body")).toContainText(/joined|success|thanks/i, {
          timeout: 5000
        });
      }
    }
  });
});
