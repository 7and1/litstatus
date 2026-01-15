import { Redis } from "@upstash/redis";
import { createClient } from "redis";
import type { User } from "@supabase/ssr";
import { createSupabaseAdmin } from "./supabaseAdmin";
import { QUOTAS, type Plan, type QuotaStatus } from "./constants";

const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const redisUrl = process.env.REDIS_URL;

const upstash =
  upstashUrl && upstashToken
    ? new Redis({ url: upstashUrl, token: upstashToken })
    : null;
type NodeRedisClient = ReturnType<typeof createClient>;

const nodeRedis = redisUrl ? createClient({ url: redisUrl }) : null;
let nodeRedisReady: Promise<NodeRedisClient | null> | null = null;

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

async function getNodeRedis() {
  if (!nodeRedis) return null;
  if (!nodeRedisReady) {
    nodeRedisReady = nodeRedis.connect().then(
      () => nodeRedis,
      () => {
        nodeRedisReady = null;
        return null;
      },
    );
  }
  return nodeRedisReady;
}

async function getGuestCount(ip: string) {
  const key = `quota:guest:${ip}`;
  const client = await getNodeRedis();
  if (client) {
    const raw = await client.get(key);
    const count = raw ? Number(raw) : 0;
    return Number.isNaN(count) ? 0 : count;
  }
  if (upstash) {
    const count = await upstash.get<number>(key);
    return count ?? 0;
  }
  return getFallback(key);
}

async function incrementGuestCount(ip: string) {
  const key = `quota:guest:${ip}`;
  const client = await getNodeRedis();
  if (client) {
    const count = await client.incr(key);
    if (count === 1) {
      await client.expire(key, 60 * 60 * 24);
    }
    return count;
  }
  if (upstash) {
    const count = await upstash.incr(key);
    if (count === 1) {
      await upstash.expire(key, 60 * 60 * 24);
    }
    return count;
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
  const supabase = createSupabaseAdmin();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id,email,is_pro,daily_usage_count,last_reset_time")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;

  if (profile) return profile;

  const { data: inserted, error: insertError } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      email: user.email,
      is_pro: false,
      daily_usage_count: 0,
      last_reset_time: new Date().toISOString(),
    })
    .select("id,email,is_pro,daily_usage_count,last_reset_time")
    .single();

  if (insertError) throw insertError;
  return inserted;
}

async function resetProfileIfNeeded(profile: Profile): Promise<Profile> {
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
  return data;
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
}: {
  user: User | null;
  ip: string | null;
}): Promise<QuotaStatus> {
  if (!user) {
    const count = ip ? await getGuestCount(ip) : 0;
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
}: {
  user: User | null;
  ip: string | null;
}): Promise<{ allowed: boolean; status: QuotaStatus }> {
  if (!user) {
    if (!ip) {
      return {
        allowed: false,
        status: buildStatus("guest", QUOTAS.guest, false),
      };
    }

    const count = await getGuestCount(ip);
    if (count >= QUOTAS.guest) {
      return { allowed: false, status: buildStatus("guest", count, false) };
    }

    const next = await incrementGuestCount(ip);
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

  return {
    allowed: true,
    status: buildStatus("user", data.daily_usage_count ?? count + 1, false),
  };
}
