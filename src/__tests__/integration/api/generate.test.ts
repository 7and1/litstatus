import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST } from "@/app/api/generate/route";
import { NextRequest } from "next/server";

// Mock dependencies
vi.mock("@/lib/auth", () => ({
  getUserFromRequest: vi.fn(),
}));

vi.mock("@/lib/ip", () => ({
  getClientIp: vi.fn(() => "127.0.0.1"),
}));

vi.mock("@/lib/openai", () => ({
  getOpenAIClient: vi.fn(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  caption: "Test caption",
                  hashtags: "#test #hashtag",
                  detected_object: null,
                  affiliate_category: null,
                }),
              },
            },
          ],
        }),
      },
    },
  })),
  withCircuitBreaker: vi.fn((_, fn) => fn()),
  getCircuitBreakerStats: vi.fn(() => ({ isOpen: false })),
}));

vi.mock("@/lib/redis", () => ({
  getRedisClient: vi.fn(() => null),
}));

vi.mock("@/lib/securityEvents", () => ({
  logSecurityEvent: vi.fn(),
}));

vi.mock("@/lib/errors", () => ({
  logError: vi.fn(),
}));

import { getUserFromRequest } from "@/lib/auth";
import { getOpenAIClient } from "@/lib/openai";

describe("POST /api/generate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createFormData = (text: string, mode = "Standard") => {
    const formData = new FormData();
    formData.append("text", text);
    formData.append("mode", mode);
    formData.append("lang", "en");
    return formData;
  };

  it("should return 400 when unable to identify request", async () => {
    vi.mocked(getUserFromRequest).mockResolvedValue(null);

    const request = new NextRequest("https://litstatus.com/api/generate", {
      method: "POST",
      body: createFormData("test input"),
    });

    // Mock getClientIp to return null
    const { getClientIp } = await import("@/lib/ip");
    vi.mocked(getClientIp).mockReturnValue(null);

    const response = await POST(request as unknown as Request);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toContain("identify");
  });

  it("should return 400 when neither text nor image is provided", async () => {
    vi.mocked(getUserFromRequest).mockResolvedValue(null);

    const request = new NextRequest("https://litstatus.com/api/generate", {
      method: "POST",
      body: new FormData(),
    });

    const response = await POST(request as unknown as Request);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBeDefined();
  });

  it("should return 400 when text exceeds max length", async () => {
    vi.mocked(getUserFromRequest).mockResolvedValue(null);

    const formData = new FormData();
    formData.append("text", "a".repeat(2001));
    formData.append("mode", "Standard");
    formData.append("lang", "en");

    const request = new NextRequest("https://litstatus.com/api/generate", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request as unknown as Request);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toContain("long");
  });

  it("should return 403 when non-pro user tries Creative mode", async () => {
    vi.mocked(getUserFromRequest).mockResolvedValue({
      id: "user-123",
      email: "test@example.com",
    });

    // Mock quota to return non-pro user
    const { getQuotaStatus } = await import("@/lib/quota");
    vi.spyOn(await import("@/lib/quota"), "getQuotaStatus").mockResolvedValue({
      plan: "user",
      limit: 20,
      remaining: 10,
      isPro: false,
    });

    // Mock consumeQuota to succeed
    vi.spyOn(await import("@/lib/quota"), "consumeQuota").mockResolvedValue({
      allowed: true,
      status: { plan: "user", limit: 20, remaining: 9, isPro: false },
    });

    const formData = new FormData();
    formData.append("text", "test");
    formData.append("mode", "Creative");
    formData.append("lang", "en");

    const request = new NextRequest("https://litstatus.com/api/generate", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request as unknown as Request);

    expect(response.status).toBe(403);
  });

  it("should return 403 when non-pro user uploads image", async () => {
    vi.mocked(getUserFromRequest).mockResolvedValue({
      id: "user-123",
      email: "test@example.com",
    });

    vi.spyOn(await import("@/lib/quota"), "getQuotaStatus").mockResolvedValue({
      plan: "user",
      limit: 20,
      remaining: 10,
      isPro: false,
    });

    const formData = new FormData();
    formData.append("text", "test");
    formData.append("mode", "Standard");
    formData.append("lang", "en");

    const imageFile = new File(["test"], "test.jpg", { type: "image/jpeg" });
    Object.defineProperty(imageFile, "size", { value: 1024 });
    formData.append("image", imageFile);

    const request = new NextRequest("https://litstatus.com/api/generate", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request as unknown as Request);

    expect(response.status).toBe(403);
  });

  it("should return 429 when quota is exhausted", async () => {
    vi.mocked(getUserFromRequest).mockResolvedValue(null);

    vi.spyOn(await import("@/lib/quota"), "getQuotaStatus").mockResolvedValue({
      plan: "guest",
      limit: 3,
      remaining: 0,
      isPro: false,
    });

    const request = new NextRequest("https://litstatus.com/api/generate", {
      method: "POST",
      body: createFormData("test input"),
    });

    const response = await POST(request as unknown as Request);

    expect(response.status).toBe(429);
    const json = await response.json();
    expect(json.quota).toBeDefined();
  });

  it("should return 429 when rate limited", async () => {
    vi.mocked(getUserFromRequest).mockResolvedValue(null);

    // Mock rate limit to be exceeded
    const { checkRateLimit } = await import("@/lib/security");
    vi.spyOn(await import("@/lib/security"), "checkRateLimit").mockResolvedValue({
      allowed: false,
      limit: 40,
      remaining: 0,
      resetAt: Date.now() + 60000,
    });

    vi.spyOn(await import("@/lib/quota"), "getQuotaStatus").mockResolvedValue({
      plan: "guest",
      limit: 3,
      remaining: 3,
      isPro: false,
    });

    const request = new NextRequest("https://litstatus.com/api/generate", {
      method: "POST",
      body: createFormData("test input"),
    });

    const response = await POST(request as unknown as Request);

    expect(response.status).toBe(429);
    const json = await response.json();
    expect(json.error).toContain("retry");
  });

  it("should generate caption for valid text input", async () => {
    vi.mocked(getUserFromRequest).mockResolvedValue(null);

    vi.spyOn(await import("@/lib/quota"), "getQuotaStatus").mockResolvedValue({
      plan: "guest",
      limit: 3,
      remaining: 3,
      isPro: false,
    });

    vi.spyOn(await import("@/lib/quota"), "consumeQuota").mockResolvedValue({
      allowed: true,
      status: { plan: "guest", limit: 3, remaining: 2, isPro: false },
    });

    const request = new NextRequest("https://litstatus.com/api/generate", {
      method: "POST",
      body: createFormData("Beautiful sunset at the beach"),
    });

    const response = await POST(request as unknown as Request);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.caption).toBeDefined();
    expect(json.hashtags).toBeDefined();
    expect(json.quota).toBeDefined();
  });

  it("should include security headers in response", async () => {
    vi.mocked(getUserFromRequest).mockResolvedValue(null);

    vi.spyOn(await import("@/lib/quota"), "getQuotaStatus").mockResolvedValue({
      plan: "guest",
      limit: 3,
      remaining: 3,
      isPro: false,
    });

    vi.spyOn(await import("@/lib/quota"), "consumeQuota").mockResolvedValue({
      allowed: true,
      status: { plan: "guest", limit: 3, remaining: 2, isPro: false },
    });

    const request = new NextRequest("https://litstatus.com/api/generate", {
      method: "POST",
      body: createFormData("test"),
    });

    const response = await POST(request as unknown as Request);

    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("X-Frame-Options")).toBe("DENY");
    expect(response.headers.get("Content-Security-Policy")).toContain("default-src");
  });

  it("should handle Chinese language requests", async () => {
    vi.mocked(getUserFromRequest).mockResolvedValue(null);

    vi.spyOn(await import("@/lib/quota"), "getQuotaStatus").mockResolvedValue({
      plan: "guest",
      limit: 3,
      remaining: 3,
      isPro: false,
    });

    vi.spyOn(await import("@/lib/quota"), "consumeQuota").mockResolvedValue({
      allowed: true,
      status: { plan: "guest", limit: 3, remaining: 2, isPro: false },
    });

    // Mock OpenAI to return Chinese response
    const mockOpenAI = vi.mocked(getOpenAIClient());
    mockOpenAI.mockReturnValue({
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    caption: "中文测试文案",
                    hashtags: "#中文 #标签",
                    detected_object: null,
                    affiliate_category: null,
                  }),
                },
              },
            ],
          }),
        },
      },
    } as any);

    const formData = new FormData();
    formData.append("text", "测试输入");
    formData.append("mode", "Standard");
    formData.append("lang", "zh");

    const request = new NextRequest("https://litstatus.com/api/generate", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request as unknown as Request);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.caption).toBeDefined();
  });

  it("should return 500 on service error", async () => {
    vi.mocked(getUserFromRequest).mockResolvedValue(null);

    // Mock OpenAI to throw error
    vi.mocked(getOpenAIClient).mockImplementation(() => {
      throw new Error("Service unavailable");
    });

    vi.spyOn(await import("@/lib/quota"), "getQuotaStatus").mockResolvedValue({
      plan: "guest",
      limit: 3,
      remaining: 3,
      isPro: false,
    });

    vi.spyOn(await import("@/lib/quota"), "consumeQuota").mockResolvedValue({
      allowed: true,
      status: { plan: "guest", limit: 3, remaining: 2, isPro: false },
    });

    const request = new NextRequest("https://litstatus.com/api/generate", {
      method: "POST",
      body: createFormData("test"),
    });

    const response = await POST(request as unknown as Request);

    expect(response.status).toBe(500);
  });
});
