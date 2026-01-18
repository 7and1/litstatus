export type AttributionProps = {
  session_id: string;
  source: string;
  medium: string;
  campaign: string | null;
  content: string | null;
  term: string | null;
  referrer: string | null;
  landing_path: string;
  current_path: string;
};

const ATTRIBUTION_KEY = "litstatus_attribution";
const SESSION_KEY = "litstatus_session_id";

function safeRandomId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `ls_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

function getSessionId() {
  if (typeof window === "undefined") return "server";
  const existing = window.localStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const next = safeRandomId();
  window.localStorage.setItem(SESSION_KEY, next);
  return next;
}

function parseAttribution(): Omit<AttributionProps, "session_id" | "current_path"> {
  if (typeof window === "undefined") {
    return {
      source: "server",
      medium: "server",
      campaign: null,
      content: null,
      term: null,
      referrer: null,
      landing_path: "/",
    };
  }

  const params = new URLSearchParams(window.location.search);
  const utmSource = params.get("utm_source");
  const utmMedium = params.get("utm_medium");
  const utmCampaign = params.get("utm_campaign");
  const utmContent = params.get("utm_content");
  const utmTerm = params.get("utm_term");
  const landingPath = window.location.pathname || "/";

  let referrer: string | null = null;
  try {
    referrer = document.referrer ? new URL(document.referrer).host : null;
  } catch {
    referrer = document.referrer || null;
  }

  const source = utmSource || referrer || "direct";
  const medium = utmMedium || (referrer ? "referral" : "direct");

  return {
    source,
    medium,
    campaign: utmCampaign,
    content: utmContent,
    term: utmTerm,
    referrer,
    landing_path: landingPath,
  };
}

export function getAttributionProps(): AttributionProps {
  if (typeof window === "undefined") {
    return {
      session_id: "server",
      source: "server",
      medium: "server",
      campaign: null,
      content: null,
      term: null,
      referrer: null,
      landing_path: "/",
      current_path: "/",
    };
  }

  const sessionId = getSessionId();
  const stored = window.localStorage.getItem(ATTRIBUTION_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as Omit<
        AttributionProps,
        "session_id" | "current_path"
      >;
      return {
        ...parsed,
        session_id: sessionId,
        current_path: window.location.pathname || "/",
      };
    } catch {
      // fall through
    }
  }

  const attribution = parseAttribution();
  window.localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(attribution));

  return {
    ...attribution,
    session_id: sessionId,
    current_path: window.location.pathname || "/",
  };
}
