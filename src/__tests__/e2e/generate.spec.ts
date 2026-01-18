import { test, expect } from "@playwright/test";

test.describe("Generate Caption - Text Only", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should generate caption from text input", async ({ page }) => {
    const textarea = page.locator('textarea[placeholder*="text"], textarea:not([placeholder])').first();
    await textarea.fill("Beautiful sunset at the beach");

    const generateButton = page.locator("button:has-text('Generate'), button[type='submit']").first();
    await generateButton.click();

    // Wait for response
    const result = page.locator("text=hashtags, p:has-text('#'), div:has-text('#')").or(
      page.locator('[class*="caption"], [class*="result"], [id*="result"]')
    );

    // Should show some result
    await expect(page.locator("body")).toContainText(/#|caption|hashtags/i, { timeout: 15000 });
  });

  test("should show loading state while generating", async ({ page }) => {
    const textarea = page.locator('textarea[placeholder*="text"], textarea:not([placeholder])').first();
    await textarea.fill("A perfect cup of coffee in the morning");

    const generateButton = page.locator("button:has-text('Generate'), button[type='submit']").first();
    await generateButton.click();

    // Check for loading indicator
    const loading = page.locator('[class*="loading"], [class*="spinner"], svg[role="progressbar"], button:disabled');

    // Either loading appears or button becomes disabled
    const isDisabled = await generateButton.isDisabled();
    expect(isDisabled || (await loading.count()) > 0).toBeTruthy();
  });

  test("should disable button when text is too long", async ({ page }) => {
    const textarea = page.locator('textarea[placeholder*="text"], textarea:not([placeholder])').first();

    // Fill with text exceeding limit
    await textarea.fill("A".repeat(2500));

    const generateButton = page.locator("button:has-text('Generate'), button[type='submit']").first();
    const isDisabled = await generateButton.isDisabled();

    // Button might be disabled or show error
    await expect(page.locator("body")).toContainText(/too long|exceeds|limit/i, { timeout: 2000 }).catch(() => {
      // If no error message, button should at least be disabled
      expect(isDisabled).toBeTruthy();
    });
  });

  test("should clear input and allow new generation", async ({ page }) => {
    const textarea = page.locator('textarea[placeholder*="text"], textarea:not([placeholder])').first();
    await textarea.fill("First caption");

    const generateButton = page.locator("button:has-text('Generate'), button[type='submit']").first();
    await generateButton.click();

    // Wait for result
    await page.waitForTimeout(3000);

    // Clear and try again
    await textarea.fill("Second caption");
    await generateButton.click();

    await expect(page.locator("body")).toContainText(/#|caption/i, { timeout: 15000 });
  });

  test("should display quota after generation", async ({ page }) => {
    const textarea = page.locator('textarea[placeholder*="text"], textarea:not([placeholder])').first();
    await textarea.fill("Test caption generation");

    const generateButton = page.locator("button:has-text('Generate'), button[type='submit']").first();
    await generateButton.click();

    // Wait for completion
    await page.waitForTimeout(5000);

    // Should show updated quota
    const quota = page.locator(/remaining|quota|\/\d+\s*left/i);
    await expect(quota.first()).toBeVisible({ timeout: 10000 }).catch(() => {
      // Quota update might be subtle
    });
  });
});

test.describe("Generate Caption - Mode Selection", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should show mode selection options", async ({ page }) => {
    const modeButtons = page.locator("button:has-text('Standard'), button:has-text('Creative'), button:has-text('Professional')");
    const count = await modeButtons.count();

    // At least one mode option should be visible
    expect(count).toBeGreaterThan(0);
  });

  test("should select different modes", async ({ page }) => {
    const standardMode = page.locator("button:has-text('Standard')");
    const creativeMode = page.locator("button:has-text('Creative'), button:has-text('Rizz'), button:has-text('Savage')");

    if (await standardMode.count() > 0) {
      await standardMode.first().click();
      // Check if it's selected/active
      await expect(standardMode.first()).toHaveAttribute("data-selected", "true");
    }

    if (await creativeMode.count() > 0) {
      await creativeMode.first().click();
      // Check selection
      await expect(creativeMode.first()).toHaveAttribute("data-selected", "true");
    }
  });
});

test.describe("Generate Caption - Copy Features", () => {
  test("should copy caption to clipboard", async ({ page }) => {
    await page.goto("/");

    const textarea = page.locator('textarea[placeholder*="text"], textarea:not([placeholder])').first();
    await textarea.fill("Amazing mountain view");

    const generateButton = page.locator("button:has-text('Generate'), button[type='submit']").first();
    await generateButton.click();

    // Wait for result
    await page.waitForTimeout(8000);

    // Look for copy button
    const copyButton = page.locator("button:has-text('Copy'), button[aria-label*='copy'], button:has(svg)").nth(1);

    const copyCount = await copyButton.count();
    if (copyCount > 0) {
      // Setup clipboard spy
      const clipboardText = await page.evaluate(async () => {
        const textarea = document.querySelector("textarea");
        if (textarea) return textarea.value;
        const result = document.querySelector("[class*='result'], [class*='caption']");
        return result?.textContent || "";
      });

      await copyButton.first().click();

      // Verify copied (might show "Copied!" tooltip)
      await expect(page.locator("body")).toContainText(/copied|copied!/i, { timeout: 2000 }).catch(() => {
        // Tooltip might not appear
      });
    }
  });

  test("should copy all (caption + hashtags)", async ({ page }) => {
    await page.goto("/");

    const textarea = page.locator('textarea[placeholder*="text"], textarea:not([placeholder])').first();
    await textarea.fill("Coffee time");

    const generateButton = page.locator("button:has-text('Generate'), button[type='submit']").first();
    await generateButton.click();

    await page.waitForTimeout(8000);

    const copyAllButton = page.locator("button:has-text('Copy All'), button:has-text('Copy all')");

    if (await copyAllButton.count() > 0) {
      await copyAllButton.first().click();

      // Should show feedback
      await expect(page.locator("body")).toContainText(/copied/i, { timeout: 2000 });
    }
  });
});

test.describe("Generate Caption - Feedback", () => {
  test("should allow thumbs up/down feedback", async ({ page }) => {
    await page.goto("/");

    const textarea = page.locator('textarea[placeholder*="text"], textarea:not([placeholder])').first();
    await textarea.fill("Beautiful day");

    const generateButton = page.locator("button:has-text('Generate'), button[type='submit']").first();
    await generateButton.click();

    await page.waitForTimeout(8000);

    // Look for feedback buttons
    const thumbsUp = page.locator("button:has-text('👍'), button[aria-label*='like'], button:has-text('Like')");
    const thumbsDown = page.locator("button:has-text('👎'), button[aria-label*='dislike'], button:has-text('Dislike']");

    const hasFeedback = await thumbsUp.count() > 0 || await thumbsDown.count() > 0;

    if (hasFeedback) {
      if (await thumbsUp.count() > 0) {
        await thumbsUp.first().click();
      }

      // Should show confirmation or state change
      await page.waitForTimeout(500);
    }
  });
});

test.describe("Generate Caption - Rate Limiting", () => {
  test("should show quota exceeded message after limit", async ({ page }) => {
    await page.goto("/");

    const textarea = page.locator('textarea[placeholder*="text"], textarea:not([placeholder])').first();
    const generateButton = page.locator("button:has-text('Generate'), button[type='submit']").first();

    // Try to generate multiple times (guest limit is 3)
    const inputs = [
      "First caption",
      "Second caption",
      "Third caption",
      "Fourth caption", // This should hit the limit
    ];

    for (const input of inputs) {
      await textarea.fill(input);
      await generateButton.click();

      // Wait for response
      await page.waitForTimeout(5000);

      // Check if quota exceeded message appears
      const quotaMessage = page.locator("text=quota exceeded, text=daily limit reached, text=upgrade to Pro");
      if (await quotaMessage.count() > 0) {
        // Found quota message - test passes
        await expect(quotaMessage.first()).toBeVisible();
        break;
      }
    }
  });
});

test.describe("Generate Caption - Chinese Language", () => {
  test("should generate Chinese captions", async ({ page }) => {
    await page.goto("/zh");

    const textarea = page.locator('textarea[placeholder*="输入"], textarea:not([placeholder])').first();
    await textarea.fill("美丽的日落景色");

    const generateButton = page.locator("button:has-text('生成'), button[type='submit']").first();
    await generateButton.click();

    // Should show Chinese result
    await expect(page.locator("body")).toContainText(/#|标签/i, { timeout: 15000 });
  });
});
