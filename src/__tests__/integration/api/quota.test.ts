import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET } from "@/app/api/quota/route";

// Mock dependencies
vi.mock("@/lib/auth", () => ({
  getUserFromRequest: vi.fn(),
}));

vi.mock("@/lib/ip", () => ({
  getClientIp: vi.fn(() => "127.0.0.1"),
}));

vi.mock("@/lib/redis", () => ({
  getRedisClient: vi.fn(() => null),
}));

vi.mock("@/lib/quota", () => ({
  getQuotaStatus: vi.fn(),
}));

vi.mock("@/lib/errors", () => ({
  logError: vi.fn(),
}));

import { getUserFromRequest } from "@/lib/auth";
import { getQuotaStatus } from "@/lib/quota";

describe("GET /api/quota", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return guest quota for unauthenticated request", async () => {
    vi.mocked(getUserFromRequest).mockResolvedValue(null);
    vi.mocked(getQuotaStatus).mockResolvedValue({
      plan: "guest",
      limit: 3,
      remaining: 2,
      isPro: false,
    });

    const request = new Request("https://litstatus.com/api/quota");
    const response = await GET(request);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.quota).toEqual({
      plan: "guest",
      limit: 3,
      remaining: 2,
      isPro: false,
    });
  });

  it("should return user quota for authenticated request", async () => {
    vi.mocked(getUserFromRequest).mockResolvedValue({
      id: "user-123",
      email: "test@example.com",
    });

    vi.mocked(getQuotaStatus).mockResolvedValue({
      plan: "user",
      limit: 20,
      remaining: 15,
      isPro: false,
    });

    const request = new Request("https://litstatus.com/api/quota");
    const response = await GET(request);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.quota).toEqual({
      plan: "user",
      limit: 20,
      remaining: 15,
      isPro: false,
    });
  });

  it("should return pro quota for pro user", async () => {
    vi.mocked(getUserFromRequest).mockResolvedValue({
      id: "pro-user-123",
      email: "pro@example.com",
    });

    vi.mocked(getQuotaStatus).mockResolvedValue({
      plan: "pro",
      limit: null,
      remaining: null,
      isPro: true,
    });

    const request = new Request("https://litstatus.com/api/quota");
    const response = await GET(request);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.quota).toEqual({
      plan: "pro",
      limit: null,
      remaining: null,
      isPro: true,
    });
  });

  it("should include security headers", async () => {
    vi.mocked(getUserFromRequest).mockResolvedValue(null);
    vi.mocked(getQuotaStatus).mockResolvedValue({
      plan: "guest",
      limit: 3,
      remaining: 3,
      isPro: false,
    });

    const request = new Request("https://litstatus.com/api/quota");
    const response = await GET(request);

    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("X-Frame-Options")).toBe("DENY");
    expect(response.headers.get("Strict-Transport-Security")).toContain("max-age");
  });

  it("should return 500 on error", async () => {
    vi.mocked(getUserFromRequest).mockImplementation(() => {
      throw new Error("Database error");
    });

    const request = new Request("https://litstatus.com/api/quota");
    const response = await GET(request);

    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error).toBeDefined();
  });
});
