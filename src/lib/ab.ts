import { useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics";

export type Variant = "A" | "B";

export function getVariant(storageKey: string): Variant {
  if (typeof window === "undefined") return "A";
  const existing = window.localStorage.getItem(storageKey);
  if (existing === "A" || existing === "B") return existing;
  const next: Variant = Math.random() < 0.5 ? "A" : "B";
  window.localStorage.setItem(storageKey, next);
  return next;
}

export function useABVariant(storageKey: string) {
  const [variant] = useState<Variant>(() => getVariant(storageKey));

  useEffect(() => {
    trackEvent("ab_exposure", { test: storageKey, variant });
  }, [storageKey, variant]);

  return variant;
}
