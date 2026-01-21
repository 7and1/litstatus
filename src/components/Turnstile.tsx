"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react";

type TurnstileTheme = "light" | "dark" | "auto";
type TurnstileSize = "normal" | "compact";

type TurnstileProps = {
  siteKey: string;
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  theme?: TurnstileTheme;
  size?: TurnstileSize;
};

export type TurnstileHandle = {
  reset: () => void;
};

type TurnstileRenderOptions = {
  sitekey: string;
  theme?: TurnstileTheme;
  size?: TurnstileSize;
  callback?: (token: string) => void;
  "expired-callback"?: () => void;
  "error-callback"?: () => void;
};

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
      reset: (widgetId?: string) => void;
      remove?: (widgetId: string) => void;
    };
  }
}

const TURNSTILE_SCRIPT_ID = "cf-turnstile-script";
const TURNSTILE_SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

const Turnstile = forwardRef<TurnstileHandle, TurnstileProps>(
  ({ siteKey, onVerify, onExpire, onError, theme = "dark", size = "normal" }, ref) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const widgetIdRef = useRef<string | null>(null);
    const latestCallbacks = useRef({ onVerify, onExpire, onError });

    useEffect(() => {
      latestCallbacks.current = { onVerify, onExpire, onError };
    }, [onVerify, onExpire, onError]);

    const renderWidget = useCallback(() => {
      if (!siteKey || !containerRef.current || !window.turnstile) return;
      if (widgetIdRef.current) return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme,
        size,
        callback: (token) => latestCallbacks.current.onVerify(token),
        "expired-callback": () => latestCallbacks.current.onExpire?.(),
        "error-callback": () => latestCallbacks.current.onError?.(),
      });
    }, [siteKey, theme, size]);

    useEffect(() => {
      if (!siteKey) return;
      if (window.turnstile) {
        renderWidget();
        return;
      }

      const existingScript = document.getElementById(
        TURNSTILE_SCRIPT_ID,
      ) as HTMLScriptElement | null;

      const handleLoad = () => {
        renderWidget();
      };

      if (existingScript) {
        existingScript.addEventListener("load", handleLoad);
        return () => existingScript.removeEventListener("load", handleLoad);
      }

      const script = document.createElement("script");
      script.id = TURNSTILE_SCRIPT_ID;
      script.src = TURNSTILE_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.addEventListener("load", handleLoad);
      document.body.appendChild(script);

      return () => script.removeEventListener("load", handleLoad);
    }, [siteKey, renderWidget]);

    useImperativeHandle(ref, () => ({
      reset: () => {
        if (widgetIdRef.current && window.turnstile?.reset) {
          window.turnstile.reset(widgetIdRef.current);
        }
      },
    }));

    useEffect(() => {
      return () => {
        if (widgetIdRef.current && window.turnstile?.remove) {
          window.turnstile.remove(widgetIdRef.current);
        }
        widgetIdRef.current = null;
      };
    }, []);

    return <div ref={containerRef} />;
  },
);

Turnstile.displayName = "Turnstile";

export default Turnstile;
