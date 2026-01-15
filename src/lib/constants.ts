export const QUOTAS = {
  guest: 3,
  user: 10,
} as const;

export const MODES = ["Standard", "Savage", "Rizz"] as const;
export type Mode = (typeof MODES)[number];

export type Plan = "guest" | "user" | "pro";

export type QuotaStatus = {
  plan: Plan;
  limit: number | null;
  remaining: number | null;
  isPro: boolean;
};
