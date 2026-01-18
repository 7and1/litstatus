import type { User } from "./auth";
import { createSupabaseAdmin } from "./supabaseAdmin";
import { getRedisClient } from "./redis";
import { QUOTAS, type Plan, type QuotaStatus } from "./constants";
import { withTiming } from "./performance";

// Edge Runtime compatible in-memory quota store (fallback only)
const fallbackStore = new Map<string, { count: number; expiresAt: number }>();

function dateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function getFallback(key: string) {
  const entry = fallbackStore.get(key);
  if (!entry) return 0;
  if (entry.expiresAt <= Date.now()) {
    fallbackStore.delete(key);
    return 0;
  }
  return entry.count;
}

function incrementFallback(key: string) {
  const now = Date.now();
  const entry = fallbackStore.get(key);
  if (!entry || entry.expiresAt <= now) {
    fallbackStore.set(key, { count: 1, expiresAt: now + 86400 * 1000 });
    return 1;
  }
  entry.count += 1;
  return entry.count;
}

async function getGuestCount(identifier: string, dateKey: string) {
  return withTiming("quota.getGuestCount", async () => {
    const redis = getRedisClient();
    const key = `quota:guest:${identifier}:${dateKey}`;

    if (redis) {
      try {
        const count = await redis.get<number>(key);
        return count ?? 0;
      } catch {
        // Fall back to in-memory
      }
    }
    return getFallback(key);
  }, { identifier, dateKey });
}

async function incrementGuestCount(identifier: string, dateKey: string) {
  const redis = getRedisClient();
  const key = `quota:guest:${identifier}:${dateKey}`;

  if (redis) {
    try {
      const newCount = await redis.incr(key);
      if (newCount === 1) {
        // Set expiration at end of day (UTC)
        const now = new Date();
        const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
        const ttl = Math.max(1, Math.floor((endOfDay.getTime() - now.getTime()) / 1000));
        await redis.expire(key, ttl);
      }
      return newCount;
    } catch {
      // Fall back to in-memory
    }
  }
  return incrementFallback(key);
}

type Profile = {
  id: string;
  email: string | null;
  is_pro: boolean;
  daily_usage_count: number | null;
  last_reset_time: string | null;
};

async function getOrCreateProfile(user: User): Promise<Profile> {
  return withTiming("quota.getOrCreateProfile", async () => {
    const redis = getRedisClient();
    const cacheKey = `quota:profile:${user.id}`;
    const CACHE_TTL = 60; // 60 seconds

    // Try cache first
    if (redis) {
      try {
        const cached = await redis.get<Profile>(cacheKey);
        if (cached) {
          return cached;
        }
      } catch {
        // Continue to DB
      }
    }

    const supabase = createSupabaseAdmin();
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id,email,is_pro,daily_usage_count,last_reset_time")
      .eq("id", user.id)
      .maybeSingle();

    if (error) throw error;

    if (profile) {
      // Cache the profile
      if (redis) {
        try {
          await redis.set(cacheKey, profile, { ex: CACHE_TTL });
        } catch {
          // Ignore cache errors
        }
      }
      return profile;
    }

    const { data: inserted, error: insertError } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        email: user.email ?? null,
        is_pro: false,
        daily_usage_count: 0,
        last_reset_time: new Date().toISOString(),
      })
      .select("id,email,is_pro,daily_usage_count,last_reset_time")
      .single();

    if (insertError) throw insertError;

    // Cache the new profile
    if (redis) {
      try {
        await redis.set(cacheKey, inserted, { ex: CACHE_TTL });
      } catch {
        // Ignore cache errors
      }
    }

    return inserted;
  }, { userId: user.id });
}

async function resetProfileIfNeeded(profile: Profile): Promise<Profile> {
  return withTiming("quota.resetProfileIfNeeded", async () => {
    const redis = getRedisClient();
    const cacheKey = `quota:profile:${profile.id}`;
    const CACHE_TTL = 60; // 60 seconds

    const supabase = createSupabaseAdmin();
    const lastReset = profile.last_reset_time
      ? new Date(profile.last_reset_time)
      : null;
    const nowKey = dateKey();
    const lastKey = lastReset ? dateKey(lastReset) : null;

    if (lastKey && lastKey === nowKey) return profile;

    const { data, error } = await supabase
      .from("profiles")
      .update({ daily_usage_count: 0, last_reset_time: new Date().toISOString() })
      .eq("id", profile.id)
      .select("id,email,is_pro,daily_usage_count,last_reset_time")
      .single();

    if (error) throw error;

    // Update cache
    if (redis) {
      try {
        await redis.set(cacheKey, data, { ex: CACHE_TTL });
      } catch {
        // Ignore cache errors
      }
    }

    return data;
  }, { profileId: profile.id });
}

function buildStatus(plan: Plan, count: number, isPro: boolean): QuotaStatus {
  if (isPro) {
    return { plan: "pro", limit: null, remaining: null, isPro: true };
  }

  const limit = plan === "guest" ? QUOTAS.guest : QUOTAS.user;
  return {
    plan,
    limit,
    remaining: Math.max(limit - count, 0),
    isPro: false,
  };
}

export async function getQuotaStatus({
  user,
  ip,
  fingerprint,
}: {
  user: User | null;
  ip: string | null;
  fingerprint?: string;
}): Promise<QuotaStatus> {
  if (!user) {
    // Use device fingerprint as primary identifier, IP as fallback
    const identifier = fingerprint || ip || "unknown";
    const key = dateKey();
    const count = await getGuestCount(identifier, key);
    return buildStatus("guest", count, false);
  }

  let profile = await getOrCreateProfile(user);
  profile = await resetProfileIfNeeded(profile);

  if (profile.is_pro) {
    return buildStatus("pro", 0, true);
  }

  return buildStatus("user", profile.daily_usage_count ?? 0, false);
}

export async function consumeQuota({
  user,
  ip,
  fingerprint,
}: {
  user: User | null;
  ip: string | null;
  fingerprint?: string;
}): Promise<{ allowed: boolean; status: QuotaStatus }> {
  if (!user) {
    // Use device fingerprint as primary identifier, IP as fallback
    const identifier = fingerprint || ip || "unknown";
    const key = dateKey();

    const count = await getGuestCount(identifier, key);
    if (count >= QUOTAS.guest) {
      return { allowed: false, status: buildStatus("guest", count, false) };
    }

    const next = await incrementGuestCount(identifier, key);
    return { allowed: true, status: buildStatus("guest", next, false) };
  }

  let profile = await getOrCreateProfile(user);
  profile = await resetProfileIfNeeded(profile);

  if (profile.is_pro) {
    return { allowed: true, status: buildStatus("pro", 0, true) };
  }

  const count = profile.daily_usage_count ?? 0;
  if (count >= QUOTAS.user) {
    return { allowed: false, status: buildStatus("user", count, false) };
  }

  const supabase = createSupabaseAdmin();
  const redis = getRedisClient();
  const cacheKey = `quota:profile:${profile.id}`;
  const CACHE_TTL = 60; // 60 seconds

  const { data, error } = await supabase
    .from("profiles")
    .update({
      daily_usage_count: count + 1,
      last_reset_time: new Date().toISOString(),
    })
    .eq("id", profile.id)
    .select("id,email,is_pro,daily_usage_count,last_reset_time")
    .single();

  if (error) throw error;

  // Update cache
  if (redis) {
    try {
      await redis.set(cacheKey, data, { ex: CACHE_TTL });
    } catch {
      // Ignore cache errors
    }
  }

  return {
    allowed: true,
    status: buildStatus("user", data.daily_usage_count ?? count + 1, false),
  };
}
