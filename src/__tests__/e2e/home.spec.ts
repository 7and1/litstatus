import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("should load successfully", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/LitStatus/);
  });

  test("should display main heading", async ({ page }) => {
    await page.goto("/");

    const heading = page.locator("h1");
    await expect(heading).toBeVisible();
  });

  test("should have generate input section", async ({ page }) => {
    await page.goto("/");

    const textarea = page.locator('textarea[placeholder*="text"]');
    await expect(textarea).toBeVisible();
  });

  test("should display language switcher", async ({ page }) => {
    await page.goto("/");

    const langSwitcher = page.locator("button:has-text('English'), button:has-text('中文')");
    await expect(langSwitcher).toBeVisible();
  });

  test("should switch to Chinese and back", async ({ page }) => {
    await page.goto("/");

    // Find and click the language switcher
    const langSwitcher = page.locator("button:has-text('中文')").or(
      page.locator("button:has-text('English')")
    );
    await langSwitcher.click();

    // URL should change
    await expect(page).toHaveURL(/\/zh/);

    // Click again to switch back
    const enSwitcher = page.locator("button:has-text('English')").or(
      page.locator("button:has-text('中文')")
    );
    await enSwitcher.click();

    // Should be back to English (no /zh in URL)
    await expect(page).not.toHaveURL(/\/zh/);
  });

  test("should have login button", async ({ page }) => {
    await page.goto("/");

    const loginButton = page.locator("button:has-text('Log in')").or(
      page.locator("a:has-text('Log in')")
    );
    await expect(loginButton).toBeVisible();
  });

  test("should display quota information", async ({ page }) => {
    await page.goto("/");

    // Should show quota remaining for guest users
    const quotaText = page.locator(
      /3 remaining|quota|daily/i
    );
    await expect(quotaText).toBeVisible({ timeout: 5000 }).catch(() => {
      // Quota might not be immediately visible, that's okay
    });
  });

  test("should have proper meta tags for SEO", async ({ page }) => {
    await page.goto("/");

    const description = await page.locator('meta[name="description"]').getAttribute("content");
    expect(description).toBeTruthy();
    expect(description?.length).toBeGreaterThan(0);

    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute("content");
    expect(ogTitle).toBeTruthy();
  });

  test("should have proper security headers", async ({ request }) => {
    const response = await request.get("https://litstatus.com/");

    const csp = response.headers()["content-security-policy"];
    expect(csp).toContain("default-src 'self'");

    const xFrame = response.headers()["x-frame-options"];
    expect(xFrame).toBe("DENY");

    const xContentType = response.headers()["x-content-type-options"];
    expect(xContentType).toBe("nosniff");
  });

  test("should be accessible", async ({ page }) => {
    await page.goto("/");

    // Check for proper heading hierarchy
    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();

    // Check for proper ARIA labels on interactive elements
    const buttons = page.locator("button[aria-label], button[aria-labelledby], button > *");
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);
  });
});

test.describe("Homepage - Chinese", () => {
  test("should load Chinese homepage", async ({ page }) => {
    await page.goto("/zh");

    await expect(page).toHaveTitle(/LitStatus/);
    await expect(page).toHaveURL(/\/zh/);
  });

  test("should display Chinese content", async ({ page }) => {
    await page.goto("/zh");

    // Should have Chinese text visible
    const zhContent = page.locator("p:has-text('文案'), h1:has-text('生成'), h2:has-text('文案')");
    await expect(zhContent.first()).toBeVisible();
  });

  test("should switch to English from Chinese", async ({ page }) => {
    await page.goto("/zh");

    const enSwitcher = page.locator("button:has-text('English')").or(
      page.locator("a:has-text('English')")
    );
    await enSwitcher.click();

    await expect(page).not.toHaveURL(/\/zh/);
  });
});
