import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST } from "@/app/api/wishlist/route";

// Mock dependencies
vi.mock("@/lib/auth", () => ({
  getUserFromRequest: vi.fn(),
}));

vi.mock("@/lib/supabaseAdmin", () => ({
  createSupabaseAdmin: vi.fn(() => ({
    from: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
  })),
}));

import { getUserFromRequest } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

describe("POST /api/wishlist", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequestBody = (email = "test@example.com", extra = {}) => {
    return JSON.stringify({
      email,
      note: "Test note",
      variant: "A",
      lang: "en",
      ...extra,
    });
  };

  it("should accept valid wishlist submission with email", async () => {
    vi.mocked(getUserFromRequest).mockResolvedValue({
      id: "user-123",
      email: "user@example.com",
    });

    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: null }),
    };
    vi.mocked(createSupabaseAdmin).mockReturnValue(mockSupabase as any);

    // Mock fetch to prevent actual Resend API calls
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response)
    );

    const request = new Request("https://litstatus.com/api/wishlist", {
      method: "POST",
      body: createRequestBody(),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.ok).toBe(true);
  });

  it("should accept user email when not provided in body", async () => {
    vi.mocked(getUserFromRequest).mockResolvedValue({
      id: "user-123",
      email: "user@example.com",
    });

    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: null }),
    };
    vi.mocked(createSupabaseAdmin).mockReturnValue(mockSupabase as any);

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response)
    );

    const request = new Request("https://litstatus.com/api/wishlist", {
      method: "POST",
      body: JSON.stringify({ lang: "en" }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
  });

  it("should reject invalid email address", async () => {
    vi.mocked(getUserFromRequest).mockResolvedValue(null);

    const request = new Request("https://litstatus.com/api/wishlist", {
      method: "POST",
      body: JSON.stringify({
        email: "not-an-email",
        lang: "en",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toContain("email");
  });

  it("should reject when no email provided", async () => {
    vi.mocked(getUserFromRequest).mockResolvedValue(null);

    const request = new Request("https://litstatus.com/api/wishlist", {
      method: "POST",
      body: JSON.stringify({ lang: "en" }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toContain("email");
  });

  it("should sanitize email input", async () => {
    vi.mocked(getUserFromRequest).mockResolvedValue(null);

    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: null }),
    };
    vi.mocked(createSupabaseAdmin).mockReturnValue(mockSupabase as any);

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response)
    );

    const request = new Request("https://litstatus.com/api/wishlist", {
      method: "POST",
      body: JSON.stringify({
        email: "  test@example.com  ",
        lang: "en",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    const insertCall = mockSupabase.insert.mock.calls[0][0];
    expect(insertCall.email).toBe("test@example.com");
  });

  it("should handle Chinese language requests", async () => {
    vi.mocked(getUserFromRequest).mockResolvedValue(null);

    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: null }),
    };
    vi.mocked(createSupabaseAdmin).mockReturnValue(mockSupabase as any);

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response)
    );

    const request = new Request("https://litstatus.com/api/wishlist", {
      method: "POST",
      body: JSON.stringify({
        email: "test@example.com",
        lang: "zh",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    const insertCall = mockSupabase.insert.mock.calls[0][0];
    expect(insertCall.lang).toBe("zh");
  });

  it("should limit note length", async () => {
    vi.mocked(getUserFromRequest).mockResolvedValue(null);

    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: null }),
    };
    vi.mocked(createSupabaseAdmin).mockReturnValue(mockSupabase as any);

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response)
    );

    const longNote = "A".repeat(600);

    const request = new Request("https://litstatus.com/api/wishlist", {
      method: "POST",
      body: JSON.stringify({
        email: "test@example.com",
        note: longNote,
        lang: "en",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    const insertCall = mockSupabase.insert.mock.calls[0][0];
    expect(insertCall.note.length).toBeLessThanOrEqual(500);
  });

  it("should include security headers", async () => {
    vi.mocked(getUserFromRequest).mockResolvedValue({
      id: "user-123",
      email: "user@example.com",
    });

    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: null }),
    };
    vi.mocked(createSupabaseAdmin).mockReturnValue(mockSupabase as any);

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response)
    );

    const request = new Request("https://litstatus.com/api/wishlist", {
      method: "POST",
      body: createRequestBody(),
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

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response)
    );

    const request = new Request("https://litstatus.com/api/wishlist", {
      method: "POST",
      body: createRequestBody(),
    });

    const response = await POST(request);

    expect(response.status).toBe(500);
  });
});
