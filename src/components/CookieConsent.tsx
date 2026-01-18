"use client";

import { useEffect, useState, useCallback } from "react";
import type { Lang } from "@/lib/i18n";

const COOKIE_CONSENT_KEY = "litstatus_cookie_consent";
const CONSENT_VALUES = {
  ACCEPTED: "accepted",
  DECLINED: "declined",
} as const;

type ConsentValue = typeof CONSENT_VALUES[keyof typeof CONSENT_VALUES] | null;

const COOKIE_COPY: Record<
  Lang,
  {
    title: string;
    description: string;
    accept: string;
    decline: string;
    privacyLink: string;
  }
> = {
  en: {
    title: "Cookie Notice",
    description:
      "We use essential cookies for site functionality and analytics cookies to help us improve. Your data is never sold. Read more in our",
    accept: "Accept",
    decline: "Decline",
    privacyLink: "Privacy Policy",
  },
  zh: {
    title: "Cookie 提示",
    description: "我们使用必要 cookie 保持网站功能，并使用分析 cookie 帮助改进。您的数据绝不出售。了解更多请阅读",
    accept: "接受",
    decline: "拒绝",
    privacyLink: "隐私政策",
  },
};

type CookieConsentProps = {
  lang: Lang;
};

export default function CookieConsent({ lang }: CookieConsentProps) {
  const [consent, setConsent] = useState<ConsentValue>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check for existing consent
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (stored === CONSENT_VALUES.ACCEPTED || stored === CONSENT_VALUES.DECLINED) {
      setConsent(stored);
    } else {
      // No consent found, show banner
      setIsVisible(true);
    }
  }, []);

  const handleAccept = useCallback(() => {
    localStorage.setItem(COOKIE_CONSENT_KEY, CONSENT_VALUES.ACCEPTED);
    setConsent(CONSENT_VALUES.ACCEPTED);
    setIsVisible(false);
    // Trigger analytics initialization
    window.dispatchEvent(new CustomEvent("cookie-consent-accepted"));
  }, []);

  const handleDecline = useCallback(() => {
    localStorage.setItem(COOKIE_CONSENT_KEY, CONSENT_VALUES.DECLINED);
    setConsent(CONSENT_VALUES.DECLINED);
    setIsVisible(false);
  }, []);

  if (!isVisible || consent !== null) {
    return null;
  }

  const copy = COOKIE_COPY[lang];

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#0b0b0f]/95 backdrop-blur-sm p-4 sm:p-6"
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-description"
    >
      <div className="mx-auto max-w-5xl flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <h2 id="cookie-consent-title" className="text-sm font-semibold text-white sm:text-base">
            {copy.title}
          </h2>
          <p id="cookie-consent-description" className="mt-1 text-xs text-zinc-400 sm:text-sm">
            {copy.description}{" "}
            <a
              href={lang === "zh" ? "/zh/privacy-policy" : "/privacy-policy"}
              className="text-white underline hover:text-zinc-300"
            >
              {copy.privacyLink}
            </a>
            .
          </p>
        </div>
        <div className="flex gap-2 sm:flex-shrink-0">
          <button
            type="button"
            onClick={handleDecline}
            className="btn-press rounded-full border border-white/10 px-4 py-2 text-xs text-zinc-300 transition hover:border-white/20 hover:bg-white/5 sm:text-sm"
            aria-label={copy.decline}
          >
            {copy.decline}
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="btn-press rounded-full bg-white px-4 py-2 text-xs text-black transition hover:bg-zinc-200 sm:text-sm"
            aria-label={copy.accept}
          >
            {copy.accept}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to check if user has accepted cookies
 */
export function useCookieConsent(): {
  consent: ConsentValue;
  hasConsented: boolean;
  accept: () => void;
  decline: () => void;
} {
  const [consent, setConsent] = useState<ConsentValue>(null);

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (stored === CONSENT_VALUES.ACCEPTED || stored === CONSENT_VALUES.DECLINED) {
      setConsent(stored);
    }
  }, []);

  const accept = useCallback(() => {
    localStorage.setItem(COOKIE_CONSENT_KEY, CONSENT_VALUES.ACCEPTED);
    setConsent(CONSENT_VALUES.ACCEPTED);
  }, []);

  const decline = useCallback(() => {
    localStorage.setItem(COOKIE_CONSENT_KEY, CONSENT_VALUES.DECLINED);
    setConsent(CONSENT_VALUES.DECLINED);
  }, []);

  return {
    consent,
    hasConsented: consent === CONSENT_VALUES.ACCEPTED,
    accept,
    decline,
  };
}
