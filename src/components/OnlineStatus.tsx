"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface OnlineStatusProps {
  position?: "top" | "bottom";
  className?: string;
}

export function OnlineStatus({ position = "bottom", className = "" }: OnlineStatusProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    // Set initial status
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowToast(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (typeof window === "undefined") return null;

  const content = showToast && !isOnline ? (
    <div
      className={`fixed left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-lg border border-[#f6b73c]/30 bg-[#f6b73c]/10 px-4 py-3 text-sm text-[#f6b73c] shadow-lg transition-all duration-300 ${
        position === "top" ? "top-4" : "bottom-4"
      } ${className}`}
      role="status"
      aria-live="polite"
    >
      <svg
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
        />
      </svg>
      <span>You are offline. Some features may not work.</span>
    </div>
  ) : showToast && isOnline ? (
    <div
      className={`fixed left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-lg border border-[#2ceef0]/30 bg-[#2ceef0]/10 px-4 py-3 text-sm text-[#2ceef0] shadow-lg transition-all duration-300 ${
        position === "top" ? "top-4" : "bottom-4"
      } ${className}`}
      role="status"
      aria-live="polite"
    >
      <svg
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 13l4 4L19 7"
        />
      </svg>
      <span>You are back online.</span>
    </div>
  ) : null;

  return createPortal(content, document.body);
}

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}
