"use client";

import React from "react";
import { logError } from "@/lib/errors";

interface AsyncError {
  message: string;
  code?: string;
  statusCode?: number;
}

interface Props {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: AsyncError; retry: () => void }>;
}

interface State {
  error: AsyncError | null;
}

export class AsyncErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: AsyncError): State {
    return { error };
  }

  componentDidCatch(error: AsyncError) {
    logError(error as unknown as Error, {
      asyncBoundary: true,
      code: error.code,
      statusCode: error.statusCode,
    });
  }

  handleError = (error: AsyncError) => {
    this.setState({ error });
    logError(error as unknown as Error, { asyncBoundary: true });
  };

  handleRetry = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultAsyncErrorFallback;
      return <FallbackComponent error={this.state.error} retry={this.handleRetry} />;
    }

    return (
      <AsyncErrorContext.Provider value={this.handleError}>
        {this.props.children}
      </AsyncErrorContext.Provider>
    );
  }
}

const AsyncErrorContext = React.createContext<(error: AsyncError) => void>(() => {});

export function useAsyncError() {
  return React.useContext(AsyncErrorContext);
}

function DefaultAsyncErrorFallback({ error, retry }: { error: AsyncError; retry: () => void }) {
  return (
    <div className="flex items-center justify-center rounded-lg border border-[#f6b73c]/30 bg-[#f6b73c]/10 p-4">
      <div className="text-center">
        <p className="text-sm font-medium text-[#f6b73c]">
          {error.message || "Something went wrong"}
        </p>
        <button
          onClick={retry}
          className="mt-2 text-xs text-zinc-400 underline hover:text-white"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
