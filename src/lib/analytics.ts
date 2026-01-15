export type AnalyticsProps = Record<string, string | number | boolean | null>;

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: AnalyticsProps }) => void;
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(event: string, props?: AnalyticsProps) {
  if (typeof window === "undefined") return;

  if (window.plausible) {
    window.plausible(event, props ? { props } : undefined);
  }

  if (window.gtag) {
    window.gtag("event", event, props ?? {});
  }
}
