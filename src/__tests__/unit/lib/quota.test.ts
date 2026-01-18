import { describe, it, expect, beforeEach, vi } from "vitest";
import { getQuotaStatus, consumeQuota, dateKey } from "@/lib/quota";
import type { User } from "@/lib/auth";
import { QUOTAS } from "@/lib/constants";

// Mock dependencies
vi.mock("@/lib/supabaseAdmin", () => ({
  createSupabaseAdmin: vi.fn(),
}));

vi.mock("@/lib/redis", () => ({
  getRedisClient: vi.fn(() => null), // Disable Redis for tests
}));

vi.mock("@/lib/performance", () => ({
  withTiming: vi.fn((name, fn) => fn()),
  perfMonitor: {
    getMetrics: vi.fn(() => []),
  },
}));

import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

const mockCreateSupabaseAdmin = vi.mocked(createSupabaseAdmin);

describe("quota.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset in-memory fallback store
    const quotaModule = await import("@/lib/quota");
    // Force module reset by clearing require cache if needed
  });

  describe("dateKey", () => {
    it("should format date as YYYY-MM-DD", () => {
      const date = new Date("2024-01-15T12:30:00Z");
      const key = dateKey(date);
      expect(key).toBe("2024-01-15");
    });

    it("should use current date when not provided", () => {
      const key = dateKey();
      expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe("getQuotaStatus for guests", () => {
    it("should return guest quota with zero usage for new guest", async () => {
      const uniqueId = `guest-test-${Date.now()}`;

      const status = await getQuotaStatus({
        user: null,
        ip: uniqueId,
      });

      expect(status.plan).toBe("guest");
      expect(status.limit).toBe(QUOTAS.guest);
      expect(status.remaining).toBe(QUOTAS.guest);
      expect(status.isPro).toBe(false);
    });
  });

  describe("consumeQuota for guests", () => {
    it("should allow consuming within guest quota", async () => {
      const uniqueId = `guest-consume-${Date.now()}`;

      const result1 = await consumeQuota({
        user: null,
        ip: uniqueId,
      });

      expect(result1.allowed).toBe(true);
      expect(result1.status.plan).toBe("guest");
      expect(result1.status.remaining).toBe(QUOTAS.guest - 1);
    });

    it("should deny when guest quota is exhausted", async () => {
      const uniqueId = `guest-exhaust-${Date.now()}`;

      // Consume all quota
      for (let i = 0; i < QUOTAS.guest; i++) {
        await consumeQuota({ user: null, ip: uniqueId });
      }

      const result = await consumeQuota({ user: null, ip: uniqueId });
      expect(result.allowed).toBe(false);
      expect(result.status.remaining).toBe(0);
    });
  });

  describe("getQuotaStatus for authenticated users", () => {
    it("should fetch user quota from database", async () => {
      const mockUser: User = { id: "user-123", email: "test@example.com" };
      const mockProfile = {
        id: "user-123",
        email: "test@example.com",
        is_pro: false,
        daily_usage_count: 5,
        last_reset_time: new Date().toISOString(),
      };

      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
      };

      mockCreateSupabaseAdmin.mockReturnValue(mockSupabase as any);

      const status = await getQuotaStatus({ user: mockUser, ip: null });

      expect(status.plan).toBe("user");
      expect(status.limit).toBe(QUOTAS.user);
      expect(status.remaining).toBe(QUOTAS.user - 5);
      expect(status.isPro).toBe(false);
    });

    it("should return pro quota for pro users", async () => {
      const mockUser: User = { id: "user-pro", email: "pro@example.com" };
      const mockProfile = {
        id: "user-pro",
        email: "pro@example.com",
        is_pro: true,
        daily_usage_count: 1000,
        last_reset_time: new Date().toISOString(),
      };

      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
      };

      mockCreateSupabaseAdmin.mockReturnValue(mockSupabase as any);

      const status = await getQuotaStatus({ user: mockUser, ip: null });

      expect(status.plan).toBe("pro");
      expect(status.limit).toBeNull();
      expect(status.remaining).toBeNull();
      expect(status.isPro).toBe(true);
    });

    it("should create new profile if not exists", async () => {
      const mockUser: User = { id: "new-user", email: "new@example.com" };

      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        insert: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: "new-user",
            email: "new@example.com",
            is_pro: false,
            daily_usage_count: 0,
            last_reset_time: new Date().toISOString(),
          },
          error: null,
        }),
      };

      mockCreateSupabaseAdmin.mockReturnValue(mockSupabase as any);

      const status = await getQuotaStatus({ user: mockUser, ip: null });

      expect(status.plan).toBe("user");
      expect(status.remaining).toBe(QUOTAS.user);
      expect(mockSupabase.insert).toHaveBeenCalled();
    });
  });

  describe("consumeQuota for authenticated users", () => {
    it("should increment user quota consumption", async () => {
      const mockUser: User = { id: "user-inc", email: "inc@example.com" };
      const mockProfile = {
        id: "user-inc",
        email: "inc@example.com",
        is_pro: false,
        daily_usage_count: 5,
        last_reset_time: new Date().toISOString(),
      };

      let currentCount = 5;
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: mockProfile,
          error: null,
        }),
        update: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: "user-inc",
            email: "inc@example.com",
            is_pro: false,
            daily_usage_count: ++currentCount,
            last_reset_time: new Date().toISOString(),
          },
          error: null,
        }),
      };

      mockCreateSupabaseAdmin.mockReturnValue(mockSupabase as any);

      const result = await consumeQuota({ user: mockUser, ip: null });

      expect(result.allowed).toBe(true);
      expect(result.status.remaining).toBe(QUOTAS.user - 6);
      expect(mockSupabase.update).toHaveBeenCalled();
    });

    it("should allow unlimited consumption for pro users", async () => {
      const mockUser: User = { id: "user-pro-unlimited", email: "pro@example.com" };
      const mockProfile = {
        id: "user-pro-unlimited",
        email: "pro@example.com",
        is_pro: true,
        daily_usage_count: 9999,
        last_reset_time: new Date().toISOString(),
      };

      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: mockProfile,
          error: null,
        }),
      };

      mockCreateSupabaseAdmin.mockReturnValue(mockSupabase as any);

      const result = await consumeQuota({ user: mockUser, ip: null });

      expect(result.allowed).toBe(true);
      expect(result.status.isPro).toBe(true);
      expect(result.status.remaining).toBeNull();
    });

    it("should deny when user quota is exhausted", async () => {
      const mockUser: User = { id: "user-full", email: "full@example.com" };
      const mockProfile = {
        id: "user-full",
        email: "full@example.com",
        is_pro: false,
        daily_usage_count: QUOTAS.user,
        last_reset_time: new Date().toISOString(),
      };

      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: mockProfile,
          error: null,
        }),
      };

      mockCreateSupabaseAdmin.mockReturnValue(mockSupabase as any);

      const result = await consumeQuota({ user: mockUser, ip: null });

      expect(result.allowed).toBe(false);
      expect(result.status.remaining).toBe(0);
    });

    it("should reset quota when day changes", async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const mockUser: User = { id: "user-reset", email: "reset@example.com" };
      const mockProfile = {
        id: "user-reset",
        email: "reset@example.com",
        is_pro: false,
        daily_usage_count: QUOTAS.user,
        last_reset_time: yesterday.toISOString(),
      };

      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: mockProfile,
          error: null,
        }),
        update: vi.fn().mockReturnThis(),
        single: vi.fn()
          .mockResolvedValueOnce({
            // For reset
            data: {
              id: "user-reset",
              email: "reset@example.com",
              is_pro: false,
              daily_usage_count: 0,
              last_reset_time: new Date().toISOString(),
            },
            error: null,
          })
          .mockResolvedValueOnce({
            // For consume
            data: {
              id: "user-reset",
              email: "reset@example.com",
              is_pro: false,
              daily_usage_count: 1,
              last_reset_time: new Date().toISOString(),
            },
            error: null,
          }),
      };

      mockCreateSupabaseAdmin.mockReturnValue(mockSupabase as any);

      const result = await consumeQuota({ user: mockUser, ip: null });

      expect(result.allowed).toBe(true);
      expect(result.status.remaining).toBe(QUOTAS.user - 1);
    });
  });

  describe("fingerprint handling", () => {
    it("should use fingerprint when provided for guests", async () => {
      const fingerprint = `fp-test-${Date.now()}`;

      const status = await getQuotaStatus({
        user: null,
        ip: null,
        fingerprint,
      });

      expect(status.plan).toBe("guest");
    });

    it("should prefer fingerprint over IP", async () => {
      const fingerprint = `fp-pref-${Date.now()}`;
      const ip = "192.168.1.1";

      const status1 = await getQuotaStatus({
        user: null,
        ip,
        fingerprint,
      });

      const status2 = await getQuotaStatus({
        user: null,
        ip: "different-ip",
        fingerprint,
      });

      // Same fingerprint should track same quota
      expect(status1.remaining).toBe(status2.remaining);
    });
  });
});
