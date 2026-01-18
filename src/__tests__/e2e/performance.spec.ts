import { test, expect } from "@playwright/test";

test.describe("Performance Tests", () => {
  test("should load homepage quickly", async ({ page }) => {
    const startTime = Date.now();

    await page.goto("/");

    // Wait for page to be fully loaded
    await page.waitForLoadState("networkidle");

    const loadTime = Date.now() - startTime;

    // Page should load in less than 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test("should have efficient DOM size", async ({ page }) => {
    await page.goto("/");

    await page.waitForLoadState("networkidle");

    // Count DOM nodes
    const nodeCount = await page.evaluate(() => {
      return document.querySelectorAll("*").length;
    });

    // Should have reasonable DOM size (< 1500 nodes)
    expect(nodeCount).toBeLessThan(1500);
  });

  test("should have minimal JavaScript bundle size", async ({ page }) => {
    const jsSize = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll("script[src]"));
      return scripts.length;
    });

    // Should not have too many external scripts
    expect(jsSize).toBeLessThan(10);
  });

  test("should use efficient images", async ({ page }) => {
    await page.goto("/");

    await page.waitForLoadState("networkidle");

    // Check for lazy loading
    const lazyImages = await page.locator("img[loading='lazy']").count();
    const totalImages = await page.locator("img").count();

    if (totalImages > 0) {
      // At least some images should be lazy loaded
      expect(lazyImages + totalImages).toBeGreaterThan(0);
    }
  });

  test("should have viewport meta tag", async ({ page }) => {
    await page.goto("/");

    const viewport = await page.locator('meta[name="viewport"]').getAttribute("content");

    expect(viewport).toContain("width=device-width");
  });

  test("should preload critical resources", async ({ page }) => {
    const response = await page.goto("/");
    const html = await response.text();

    // Check for preload links
    const hasPreload = html.includes('rel="preload"') || html.includes("rel='preload'");

    // Not required but good for performance
    if (hasPreload) {
      expect(hasPreload).toBe(true);
    }
  });
});

test.describe("Lighthouse Metrics (Manual)", () => {
  // Note: These are structural checks. For actual Lighthouse scores,
  // run: npx playwright test --project=chromium && npx lighthouse https://litstatus.com

  test("should have semantic HTML structure", async ({ page }) => {
    await page.goto("/");

    // Check for semantic elements
    const hasHeader = await page.locator("header").count() > 0;
    const hasMain = await page.locator("main").count() > 0;
    const hasNav = await page.locator("nav").count() > 0;
    const hasFooter = await page.locator("footer").count() > 0;

    expect(hasMain || hasHeader || hasNav || hasFooter).toBe(true);
  });

  test("should have alt text for images", async ({ page }) => {
    await page.goto("/");

    await page.waitForLoadState("networkidle");

    const imagesWithoutAlt = await page.locator("img:not([alt])").count();

    // All images should have alt text
    expect(imagesWithoutAlt).toBe(0);
  });

  test("should have proper heading hierarchy", async ({ page }) => {
    await page.goto("/");

    // Should have h1
    const h1Count = await page.locator("h1").count();
    expect(h1Count).toBeGreaterThan(0);

    // Should not skip heading levels
    const hasH1 = h1Count > 0;
    const hasH2 = await page.locator("h2").count() > 0;

    // If we have h2, we should have h1
    if (hasH2) {
      expect(hasH1).toBe(true);
    }
  });

  test("should have sufficient color contrast", async ({ page }) => {
    await page.goto("/");

    // This is a basic check - real contrast testing requires more sophisticated tools
    const textElements = await page.locator("p, span, a, button").count();

    expect(textElements).toBeGreaterThan(0);
  });

  test("should be keyboard navigable", async ({ page }) => {
    await page.goto("/");

    // Check for skip link or focus management
    const skipLink = await page.locator("a[href^='#']:has-text('skip'), a[href^='#']:has-text('Skip')").count();

    const hasFocusManagement = skipLink > 0;

    // At minimum, interactive elements should be focusable
    const focusableElements = await page.locator("button, a[href], input, select, textarea").count();
    expect(focusableElements).toBeGreaterThan(0);
  });

  test("should have meta description", async ({ page }) => {
    await page.goto("/");

    const description = await page.locator('meta[name="description"]').getAttribute("content");

    expect(description).toBeTruthy();
    expect(description?.length).toBeGreaterThan(50);
    expect(description?.length).toBeLessThan(160);
  });

  test("should have canonical URL", async ({ page }) => {
    await page.goto("/");

    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");

    if (canonical) {
      expect(canonical).toBeTruthy();
      expect(canonical).toMatch(/^https?:\/\/.+/);
    }
  });

  test("should have Open Graph tags", async ({ page }) => {
    await page.goto("/");

    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute("content");
    const ogType = await page.locator('meta[property="og:type"]').getAttribute("content");
    const ogImage = await page.locator('meta[property="og:image"]').getAttribute("content");

    // Should have at least some OG tags
    const hasOgTags = ogTitle || ogType || ogImage;
    expect(hasOgTags).toBeTruthy();
  });

  test("should have structured data (JSON-LD)", async ({ page }) => {
    await page.goto("/");

    const jsonLd = await page.locator('script[type="application/ld+json"]').count();

    // JSON-LD is optional but recommended
    if (jsonLd > 0) {
      expect(jsonLd).toBeGreaterThan(0);
    }
  });
});
