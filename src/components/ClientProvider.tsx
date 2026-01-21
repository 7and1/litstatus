"use client";

import { useEffect, useState } from "react";
import { ErrorBoundary } from "./ErrorBoundary";
import { OnlineStatus } from "./OnlineStatus";
// import { ToastContainer, useToast } from "./Toast";

interface ClientProviderProps {
  children: React.ReactNode;
}

// Global error tracking
if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    console.error("[Global Error Handler]", event.error);
  });

  window.addEventListener("unhandledrejection", (event) => {
    console.error("[Unhandled Promise Rejection]", event.reason);
  });
}

function ClientProviderContent({ children }: ClientProviderProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return null;
  }

  return (
    <>
      {children}
      <OnlineStatus />
    </>
  );
}

export function ClientProvider({ children }: ClientProviderProps) {
  return (
    <ErrorBoundary>
      <ClientProviderContent>
        {children}
      </ClientProviderContent>
    </ErrorBoundary>
  );
}
