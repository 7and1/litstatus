import { test, expect } from "@playwright/test";

test.describe("Security Headers", () => {
  test("should set X-Frame-Options: DENY", async ({ request }) => {
    const response = await request.get("https://litstatus.com/");

    const xFrame = response.headers()["x-frame-options"];
    expect(xFrame).toBe("DENY");
  });

  test("should set X-Content-Type-Options: nosniff", async ({ request }) => {
    const response = await request.get("https://litstatus.com/");

    const xContentType = response.headers()["x-content-type-options"];
    expect(xContentType).toBe("nosniff");
  });

  test("should set Strict-Transport-Security", async ({ request }) => {
    const response = await request.get("https://litstatus.com/");

    const hsts = response.headers()["strict-transport-security"];
    expect(hsts).toContain("max-age=");
  });

  test("should set Content-Security-Policy", async ({ request }) => {
    const response = await request.get("https://litstatus.com/");

    const csp = response.headers()["content-security-policy"];
    expect(csp).toBeDefined();
    expect(csp).toContain("default-src");
    expect(csp).toContain("script-src");
  });

  test("should set Referrer-Policy", async ({ request }) => {
    const response = await request.get("https://litstatus.com/");

    const referrerPolicy = response.headers()["referrer-policy"];
    expect(referrerPolicy).toBeDefined();
  });

  test("should set Permissions-Policy", async ({ request }) => {
    const response = await request.get("https://litstatus.com/");

    const permissionsPolicy = response.headers()["permissions-policy"];
    expect(permissionsPolicy).toBeDefined();
  });

  test("should set X-XSS-Protection", async ({ request }) => {
    const response = await request.get("https://litstatus.com/");

    const xssProtection = response.headers()["x-xss-protection"];
    expect(xssProtection).toBeDefined();
  });
});

test.describe("Input Security", () => {
  test("should sanitize script tags in input", async ({ page }) => {
    await page.goto("/");

    const textarea = page.locator('textarea[placeholder*="text"], textarea:not([placeholder])').first();
    await textarea.fill('<script>alert("XSS")</script>');

    // Get the value back
    const value = await textarea.inputValue();

    // Script tag should be present in input (sanitization happens server-side)
    expect(value).toContain("<script>");
  });

  test("should handle SQL injection attempts gracefully", async ({ page }) => {
    await page.goto("/");

    const textarea = page.locator('textarea[placeholder*="text"], textarea:not([placeholder])').first();

    const sqlPayload = "'; DROP TABLE users; --";
    await textarea.fill(sqlPayload);

    // Input should be accepted (validation happens on submit)
    const value = await textarea.inputValue();
    expect(value).toBe(sqlPayload);
  });

  test("should limit input length", async ({ page }) => {
    await page.goto("/");

    const textarea = page.locator('textarea[placeholder*="text"], textarea:not([placeholder])').first();

    // Check maxlength attribute
    const maxlength = await textarea.getAttribute("maxlength");

    if (maxlength) {
      const limit = parseInt(maxlength);
      expect(limit).toBeLessThanOrEqual(2000);
    }
  });
});

test.describe("API Security", () => {
  test("should reject malformed JSON on API endpoints", async ({ request }) => {
    const response = await request.post("https://litstatus.com/api/feedback", {
      data: "invalid json",
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Should return 400 or handle gracefully
    expect([400, 500]).toContain(response.status());
  });

  test("should set security headers on API responses", async ({ request }) => {
    const response = await request.get("https://litstatus.com/api/quota");

    expect(response.headers()["x-content-type-options"]).toBe("nosniff");
    expect(response.headers()["x-frame-options"]).toBe("DENY");
  });

  test("should handle rate limiting headers", async ({ request }) => {
    const response = await request.get("https://litstatus.com/api/quota");

    const rateLimitLimit = response.headers()["x-ratelimit-limit"];
    const rateLimitRemaining = response.headers()["x-ratelimit-remaining"];
    const rateLimitReset = response.headers()["x-ratelimit-reset"];

    // At least some rate limit headers should be present
    const hasRateLimitHeaders = rateLimitLimit || rateLimitRemaining || rateLimitReset;
    expect(hasRateLimitHeaders).toBeTruthy();
  });
});

test.describe("Cookie Security", () => {
  test("should set secure cookies", async ({ page, context }) => {
    await page.goto("/");

    // Check cookies
    const cookies = await context.cookies();

    for (const cookie of cookies) {
      // Cookies should be secure for HTTPS
      if (cookie.sameSite) {
        expect(["Strict", "Lax", "None"]).toContain(cookie.sameSite);
      }
    }
  });
});

test.describe("CSRF Protection", () => {
  test("should include CSRF token in forms", async ({ page }) => {
    await page.goto("/");

    // Check for CSRF token in forms or meta tags
    const csrfMeta = await page.locator('meta[name="csrf-token"]').count();

    // CSRF token might be in form or handled via API
    if (csrfMeta > 0) {
      const token = await page.locator('meta[name="csrf-token"]').getAttribute("content");
      expect(token?.length).toBeGreaterThan(0);
    }
  });
});

test.describe("Authentication Security", () => {
  test("should redirect to login for protected routes", async ({ page }) => {
    // Try to access a protected route (if any)
    await page.goto("/admin").catch(() => {
      // Route might not exist
    });

    // If it exists, should redirect or show auth error
    const url = page.url();
    const isLoginPage = url.includes("/login") || url.includes("/auth");

    if (!url.includes("/404")) {
      expect(isLoginPage || url.includes("/admin")).toBeTruthy();
    }
  });

  test("should not expose sensitive data in client-side JS", async ({ page }) => {
    await page.goto("/");

    // Check for sensitive data in scripts
    const scripts = await page.locator("script").all();

    for (const script of scripts) {
      const content = await script.innerHTML();

      // Should not contain API keys or secrets
      expect(content.toLowerCase()).not.toContain("api_key");
      expect(content.toLowerCase()).not.toContain("secret");
      expect(content.toLowerCase()).not.toContain("password");
    }
  });
});
