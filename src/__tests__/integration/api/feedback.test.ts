import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST } from "@/app/api/feedback/route";

// Mock dependencies
vi.mock("@/lib/auth", () => ({
  getUserFromRequest: vi.fn(),
}));

vi.mock("@/lib/supabaseAdmin", () => ({
  createSupabaseAdmin: vi.fn(() => ({
    from: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: { id: "feedback-123" },
      error: null,
    }),
  })),
}));

vi.mock("@/lib/errors", () => ({
  logError: vi.fn(),
}));

import { getUserFromRequest } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

describe("POST /api/feedback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequestBody = (rating: number | string, extra = {}) => {
    return JSON.stringify({
      rating,
      mode: "Standard",
      caption: "Test caption",
      hashtags: "#test",
      detected_object: null,
      variant: "A",
      lang: "en",
      ...extra,
    });
  };

  it("should accept valid feedback with rating 1", async () => {
    vi.mocked(getUserFromRequest).mockResolvedValue({
      id: "user-123",
      email: "test@example.com",
    });

    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: null }),
    };
    vi.mocked(createSupabaseAdmin).mockReturnValue(mockSupabase as any);

    const request = new Request("https://litstatus.com/api/feedback", {
      method: "POST",
      body: createRequestBody(1),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.ok).toBe(true);
  });

  it("should accept valid feedback with rating -1", async () => {
    vi.mocked(getUserFromRequest).mockResolvedValue(null);

    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: null }),
    };
    vi.mocked(createSupabaseAdmin).mockReturnValue(mockSupabase as any);

    const request = new Request("https://litstatus.com/api/feedback", {
      method: "POST",
      body: createRequestBody(-1),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
  });

  it("should reject invalid rating", async () => {
    vi.mocked(getUserFromRequest).mockResolvedValue(null);

    const request = new Request("https://litstatus.com/api/feedback", {
      method: "POST",
      body: createRequestBody(5),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toContain("rating");
  });

  it("should handle Chinese language requests", async () => {
    vi.mocked(getUserFromRequest).mockResolvedValue(null);

    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: null }),
    };
    vi.mocked(createSupabaseAdmin).mockReturnValue(mockSupabase as any);

    const request = new Request("https://litstatus.com/api/feedback", {
      method: "POST",
      body: JSON.stringify({
        rating: 1,
        lang: "zh",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
  });

  it("should sanitize caption input", async () => {
    vi.mocked(getUserFromRequest).mockResolvedValue(null);

    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: null }),
    };
    vi.mocked(createSupabaseAdmin).mockReturnValue(mockSupabase as any);

    const request = new Request("https://litstatus.com/api/feedback", {
      method: "POST",
      body: JSON.stringify({
        rating: 1,
        caption: "  \x00Test caption\x00  ",
        lang: "en",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    const insertCall = mockSupabase.insert.mock.calls[0][0];
    expect(insertCall.caption).not.toContain("\x00");
  });

  it("should limit caption length", async () => {
    vi.mocked(getUserFromRequest).mockResolvedValue(null);

    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: null }),
    };
    vi.mocked(createSupabaseAdmin).mockReturnValue(mockSupabase as any);

    const longCaption = "A".repeat(6000);

    const request = new Request("https://litstatus.com/api/feedback", {
      method: "POST",
      body: JSON.stringify({
        rating: 1,
        caption: longCaption,
        lang: "en",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    const insertCall = mockSupabase.insert.mock.calls[0][0];
    expect(insertCall.caption.length).toBeLessThanOrEqual(5000);
  });

  it("should include security headers", async () => {
    vi.mocked(getUserFromRequest).mockResolvedValue(null);

    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: null }),
    };
    vi.mocked(createSupabaseAdmin).mockReturnValue(mockSupabase as any);

    const request = new Request("https://litstatus.com/api/feedback", {
      method: "POST",
      body: createRequestBody(1),
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

    const request = new Request("https://litstatus.com/api/feedback", {
      method: "POST",
      body: createRequestBody(1),
    });

    const response = await POST(request);

    expect(response.status).toBe(500);
  });
});
