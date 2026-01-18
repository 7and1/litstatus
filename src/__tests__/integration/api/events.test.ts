import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST } from "@/app/api/events/route";

// Mock dependencies
vi.mock("@/lib/auth", () => ({
  getUserFromRequest: vi.fn(),
}));

vi.mock("@/lib/ip", () => ({
  getClientIp: vi.fn(() => "127.0.0.1"),
}));

vi.mock("@/lib/supabaseAdmin", () => ({
  createSupabaseAdmin: vi.fn(() => ({
    from: vi.fn().mockReturnThis(),
    insert: vi.fn().mockResolvedValue({ error: null }),
  })),
}));

vi.mock("@/lib/security", () => ({
  SECURITY_HEADERS: {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
  },
  checkRateLimit: vi.fn(() =>
    Promise.resolve({
      allowed: true,
      limit: 120,
      remaining: 119,
      resetAt: Date.now() + 60000,
    })
  ),
  createRateLimitHeaders: vi.fn(() => ({
    "X-RateLimit-Limit": "120",
    "X-RateLimit-Remaining": "119",
    "X-RateLimit-Reset": `${Date.now() + 60000}`,
  })),
  sanitizeString: vi.fn((s: string) => s.trim()),
}));

import { getUserFromRequest } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { checkRateLimit } from "@/lib/security";
import { sanitizeString } from "@/lib/security";

describe("POST /api/events", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequestBody = (event: string, extra = {}) => {
    return JSON.stringify({
      event,
      session_id: "session-123",
      source: "google",
      medium: "organic",
      lang: "en",
      variant: "A",
      ...extra,
    });
  };

  it("should accept valid event", async () => {
    vi.mocked(getUserFromRequest).mockResolvedValue(null);

    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: null }),
    };
    vi.mocked(createSupabaseAdmin).mockReturnValue(mockSupabase as any);

    const request = new Request("https://litstatus.com/api/events", {
      method: "POST",
      body: createRequestBody("generate_success"),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.ok).toBe(true);
  });

  it("should accept all valid event types", async () => {
    vi.mocked(getUserFromRequest).mockResolvedValue(null);

    const validEvents = [
      "generate_success",
      "copy_caption",
      "copy_all",
      "feedback_up",
      "feedback_down",
      "wish_submit",
    ];

    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: null }),
    };
    vi.mocked(createSupabaseAdmin).mockReturnValue(mockSupabase as any);

    for (const event of validEvents) {
      const request = new Request("https://litstatus.com/api/events", {
        method: "POST",
        body: createRequestBody(event),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    }
  });

  it("should reject invalid event type", async () => {
    vi.mocked(getUserFromRequest).mockResolvedValue(null);

    const request = new Request("https://litstatus.com/api/events", {
      method: "POST",
      body: createRequestBody("invalid_event"),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toContain("Invalid event");
  });

  it("should rate limit requests", async () => {
    vi.mocked(getUserFromRequest).mockResolvedValue(null);

    vi.mocked(checkRateLimit).mockResolvedValue({
      allowed: false,
      limit: 120,
      remaining: 0,
      resetAt: Date.now() + 60000,
    });

    const request = new Request("https://litstatus.com/api/events", {
      method: "POST",
      body: createRequestBody("generate_success"),
    });

    const response = await POST(request);

    expect(response.status).toBe(429);
  });

  it("should sanitize string inputs", async () => {
    vi.mocked(getUserFromRequest).mockResolvedValue(null);

    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: null }),
    };
    vi.mocked(createSupabaseAdmin).mockReturnValue(mockSupabase as any);

    vi.mocked(sanitizeString).mockImplementation((s: string) => s.trim());

    const request = new Request("https://litstatus.com/api/events", {
      method: "POST",
      body: JSON.stringify({
        event: "generate_success",
        session_id: "  session-123  ",
        source: "  google  ",
        medium: "  organic  ",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(sanitizeString).toHaveBeenCalled();
  });

  it("should limit field lengths", async () => {
    vi.mocked(getUserFromRequest).mockResolvedValue(null);

    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: null }),
    };
    vi.mocked(createSupabaseAdmin).mockReturnValue(mockSupabase as any);

    vi.mocked(sanitizeString).mockImplementation((s: string) =>
      s.slice(0, 100)
    );

    const request = new Request("https://litstatus.com/api/events", {
      method: "POST",
      body: JSON.stringify({
        event: "generate_success",
        session_id: "A".repeat(200),
        source: "B".repeat(200),
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    // Verify sanitizeString was called and strings were limited
    const insertCall = mockSupabase.insert.mock.calls[0][0];
    expect(insertCall.session_id.length).toBeLessThanOrEqual(120);
  });

  it("should handle authenticated users", async () => {
    vi.mocked(getUserFromRequest).mockResolvedValue({
      id: "user-123",
      email: "test@example.com",
    });

    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: null }),
    };
    vi.mocked(createSupabaseAdmin).mockReturnValue(mockSupabase as any);

    const request = new Request("https://litstatus.com/api/events", {
      method: "POST",
      body: createRequestBody("generate_success"),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    const insertCall = mockSupabase.insert.mock.calls[0][0];
    expect(insertCall.user_id).toBe("user-123");
  });

  it("should handle has_image boolean flag", async () => {
    vi.mocked(getUserFromRequest).mockResolvedValue(null);

    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: null }),
    };
    vi.mocked(createSupabaseAdmin).mockReturnValue(mockSupabase as any);

    const request = new Request("https://litstatus.com/api/events", {
      method: "POST",
      body: JSON.stringify({
        event: "generate_success",
        has_image: true,
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    const insertCall = mockSupabase.insert.mock.calls[0][0];
    expect(insertCall.has_image).toBe(true);
  });

  it("should include security headers", async () => {
    vi.mocked(getUserFromRequest).mockResolvedValue(null);

    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: null }),
    };
    vi.mocked(createSupabaseAdmin).mockReturnValue(mockSupabase as any);

    const request = new Request("https://litstatus.com/api/events", {
      method: "POST",
      body: createRequestBody("generate_success"),
    });

    const response = await POST(request);

    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("X-Frame-Options")).toBe("DENY");
  });

  it("should return 500 on database error", async () => {
    vi.mocked(getUserFromRequest).mockResolvedValue(null);

    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({
        error: new Error("Database error"),
      }),
    };
    vi.mocked(createSupabaseAdmin).mockReturnValue(mockSupabase as any);

    const request = new Request("https://litstatus.com/api/events", {
      method: "POST",
      body: createRequestBody("generate_success"),
    });

    const response = await POST(request);

    expect(response.status).toBe(500);
  });
});
