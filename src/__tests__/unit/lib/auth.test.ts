import { describe, it, expect, beforeEach, vi } from "vitest";
import { getUserFromRequest, getAuthResult, type User } from "@/lib/auth";

// Mock supabaseAdmin
vi.mock("@/lib/supabaseAdmin", () => ({
  createSupabaseAdmin: vi.fn(),
}));

import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

describe("auth.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getUserFromRequest", () => {
    it("should return null when no authorization header", async () => {
      const request = new Request("https://example.com");

      const user = await getUserFromRequest(request);

      expect(user).toBeNull();
      expect(createSupabaseAdmin).not.toHaveBeenCalled();
    });

    it("should return null when authorization header is empty", async () => {
      const request = new Request("https://example.com", {
        headers: { authorization: "" },
      });

      const user = await getUserFromRequest(request);

      expect(user).toBeNull();
    });

    it("should return null when token is missing after Bearer", async () => {
      const request = new Request("https://example.com", {
        headers: { authorization: "Bearer " },
      });

      const user = await getUserFromRequest(request);

      expect(user).toBeNull();
    });

    it("should return null when authorization format is invalid", async () => {
      const request = new Request("https://example.com", {
        headers: { authorization: "InvalidFormat token123" },
      });

      const user = await getUserFromRequest(request);

      expect(user).toBeNull();
    });

    it("should return null when Supabase returns error", async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: new Error("Invalid token"),
          }),
        },
      };

      vi.mocked(createSupabaseAdmin).mockReturnValue(mockSupabase as any);

      const request = new Request("https://example.com", {
        headers: { authorization: "Bearer valid-token" },
      });

      const user = await getUserFromRequest(request);

      expect(user).toBeNull();
    });

    it("should return null when Supabase returns no user", async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
      };

      vi.mocked(createSupabaseAdmin).mockReturnValue(mockSupabase as any);

      const request = new Request("https://example.com", {
        headers: { authorization: "Bearer expired-token" },
      });

      const user = await getUserFromRequest(request);

      expect(user).toBeNull();
    });

    it("should return user when token is valid", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
      };

      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      };

      vi.mocked(createSupabaseAdmin).mockReturnValue(mockSupabase as any);

      const request = new Request("https://example.com", {
        headers: { authorization: "Bearer valid-token" },
      });

      const user = await getUserFromRequest(request);

      expect(user).toEqual({ id: "user-123", email: "test@example.com" });
    });

    it("should handle lowercase bearer prefix", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
      };

      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      };

      vi.mocked(createSupabaseAdmin).mockReturnValue(mockSupabase as any);

      const request = new Request("https://example.com", {
        headers: { authorization: "bearer valid-token" },
      });

      const user = await getUserFromRequest(request);

      expect(user).toEqual({ id: "user-123", email: "test@example.com" });
    });

    it("should trim whitespace from token", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
      };

      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      };

      vi.mocked(createSupabaseAdmin).mockReturnValue(mockSupabase as any);

      const request = new Request("https://example.com", {
        headers: { authorization: "Bearer  valid-token  " },
      });

      const user = await getUserFromRequest(request);

      expect(user).toEqual({ id: "user-123", email: "test@example.com" });
    });
  });

  describe("getAuthResult", () => {
    it("should return success: false with missing_token error when no auth header", async () => {
      const request = new Request("https://example.com");

      const result = await getAuthResult(request);

      expect(result).toEqual({
        success: false,
        user: null,
        error: "missing_token",
      });
    });

    it("should return success: false with invalid_token error when token is invalid", async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: new Error("Invalid token"),
          }),
        },
      };

      vi.mocked(createSupabaseAdmin).mockReturnValue(mockSupabase as any);

      const request = new Request("https://example.com", {
        headers: { authorization: "Bearer invalid-token" },
      });

      const result = await getAuthResult(request);

      expect(result).toEqual({
        success: false,
        user: null,
        error: "invalid_token",
      });
    });

    it("should return success: true with user when token is valid", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
      };

      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      };

      vi.mocked(createSupabaseAdmin).mockReturnValue(mockSupabase as any);

      const request = new Request("https://example.com", {
        headers: { authorization: "Bearer valid-token" },
      });

      const result = await getAuthResult(request);

      expect(result).toEqual({
        success: true,
        user: { id: "user-123", email: "test@example.com" },
      });
    });

    it("should return missing_token when authorization header is empty string", async () => {
      const request = new Request("https://example.com", {
        headers: { authorization: "" },
      });

      const result = await getAuthResult(request);

      expect(result).toEqual({
        success: false,
        user: null,
        error: "missing_token",
      });
    });
  });
});
