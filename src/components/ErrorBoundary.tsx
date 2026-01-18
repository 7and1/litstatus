"use client";

import React, { useEffect, useCallback } from "react";
import { logError } from "@/lib/errors";

interface Props {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void; reset: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReset = () => {
    // Full page reload for unrecoverable errors
    window.location.reload();
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error} retry={this.handleRetry} reset={this.handleReset} />;
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error;
  retry: () => void;
  reset: () => void;
}

function DefaultErrorFallback({ error, retry, reset }: ErrorFallbackProps) {
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      retry();
    }
  }, [retry]);

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-[#0b0b0f] px-4"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className="max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
        <div className="mb-4 text-4xl" aria-hidden="true">
          <svg
            className="mx-auto h-12 w-12 text-[#f6b73c]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h1 className="mb-2 text-xl font-semibold text-white">
          Something went wrong
        </h1>
        <p className="mb-6 text-sm text-zinc-400">
          We encountered an unexpected error. Please try again or refresh the page.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={retry}
            onKeyDown={handleKeyDown}
            className="rounded-full bg-[#2ceef0] px-6 py-2.5 text-sm font-semibold text-black transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[#2ceef0] focus:ring-offset-2 focus:ring-offset-[#0b0b0f]"
          >
            Try Again
          </button>
          <button
            onClick={reset}
            className="rounded-full border border-white/10 px-6 py-2.5 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#0b0b0f]"
          >
            Refresh Page
          </button>
        </div>
        <details className="mt-6 text-left">
          <summary className="cursor-pointer text-xs text-zinc-500 hover:text-zinc-400">
            Error details
          </summary>
          <pre className="mt-2 overflow-auto rounded-lg bg-black/50 p-3 text-[10px] text-zinc-600">
            {error.name}: {error.message}
          </pre>
        </details>
      </div>
    </div>
  );
}

// Hook for manual error handling in functional components
export function useErrorHandler() {
  return useCallback((error: Error) => {
    logError(error, { manualHandler: true });
    throw error;
  }, []);
}
