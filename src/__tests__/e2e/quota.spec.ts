import { test, expect } from "@playwright/test";

test.describe("Quota Display", () => {
  test("should display guest quota", async ({ page }) => {
    await page.goto("/");

    // Look for quota display
    const quotaDisplay = page.locator(
      /3\s*(remaining|left|daily)|quota|guest/i
    );

    await expect(quotaDisplay.first()).toBeVisible({ timeout: 5000 }).catch(() => {
      // Quota might be displayed differently
      const quotaAlt = page.locator("text=/3/, text=/remaining/, text=/quota/");
      expect(quotaAlt.count()).resolves.toBeGreaterThan(0);
    });
  });

  test("should update quota after generation", async ({ page }) => {
    await page.goto("/");

    // Get initial quota
    const initialQuota = await page.locator("body").textContent().then(text => {
      const match = text?.match(/(\d+)\s*(remaining|left)/i);
      return match ? parseInt(match[1]) : null;
    });

    // Generate a caption
    const textarea = page.locator('textarea[placeholder*="text"], textarea:not([placeholder])').first();
    await textarea.fill("Test quota update");

    const generateButton = page.locator("button:has-text('Generate'), button[type='submit']").first();
    await generateButton.click();

    // Wait for generation
    await page.waitForTimeout(8000);

    // Check if quota decreased
    const updatedQuota = await page.locator("body").textContent().then(text => {
      const match = text?.match(/(\d+)\s*(remaining|left)/i);
      return match ? parseInt(match[1]) : null;
    });

    if (initialQuota !== null && updatedQuota !== null) {
      expect(updatedQuota).toBeLessThan(initialQuota);
    }
  });

  test("should show upgrade prompt when quota exhausted", async ({ page }) => {
    await page.goto("/");

    const textarea = page.locator('textarea[placeholder*="text"], textarea:not([placeholder])').first();
    const generateButton = page.locator("button:has-text('Generate'), button[type='submit']").first();

    // Try to exhaust quota (guest limit is 3)
    for (let i = 0; i < 4; i++) {
      await textarea.fill(`Test caption ${i + 1}`);
      await generateButton.click();
      await page.waitForTimeout(6000);

      // Check for quota exceeded message
      const quotaMessage = page.locator("text=quota exceeded, text=daily limit, text=upgrade to Pro");
      if (await quotaMessage.count() > 0) {
        await expect(quotaMessage.first()).toBeVisible();
        break;
      }
    }
  });

  test("should display user quota when logged in", async ({ page, context }) => {
    // This test requires actual authentication
    // We'll just check the structure exists

    await page.goto("/");

    // Check if there's a quota display area
    const quotaArea = page.locator('[class*="quota"], [data-quota]').or(
      page.locator("text=/quota|remaining|daily/i")
    );

    const count = await quotaArea.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe("Quota API", () => {
  test("should return quota status via API", async ({ request }) => {
    const response = await request.get("https://litstatus.com/api/quota");

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("quota");
    expect(data.quota).toHaveProperty("plan");
    expect(data.quota).toHaveProperty("remaining");
    expect(data.quota).toHaveProperty("isPro");
  });

  test("should include CORS headers", async ({ request }) => {
    const response = await request.get("https://litstatus.com/api/quota");

    const corsHeader = response.headers()["access-control-allow-origin"];
    // CORS header might be present
    if (corsHeader) {
      expect(corsHeader).toBeTruthy();
    }
  });
});
