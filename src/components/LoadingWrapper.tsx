"use client";

import { Suspense, lazy, ComponentType } from "react";
import { Skeleton } from "./Skeleton";

interface LoadingWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function LoadingWrapper({ children, fallback }: LoadingWrapperProps) {
  return (
    <Suspense
      fallback={
        fallback || (
          <div className="flex items-center justify-center p-8">
            <div className="flex flex-col items-center gap-4">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2ceef0] border-t-transparent" />
              <p className="text-sm text-zinc-500">Loading...</p>
            </div>
          </div>
        )
      }
    >
      {children}
    </Suspense>
  );
}

interface WithLoadingProps {
  isLoading: boolean;
  error?: Error | null;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  onRetry?: () => void;
}

export function WithLoading({
  isLoading,
  error,
  children,
  fallback,
  errorFallback: ErrorFallback,
  onRetry,
}: WithLoadingProps) {
  if (error) {
    if (ErrorFallback && onRetry) {
      return <ErrorFallback error={error} retry={onRetry} />;
    }
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="mb-4 text-4xl text-[#f6b73c]" aria-hidden="true">
            <svg
              className="mx-auto h-12 w-12"
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
          <p className="text-sm text-[#f6b73c]">Something went wrong</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-4 rounded-lg border border-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/5"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      fallback || (
        <div className="flex items-center justify-center p-8">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2ceef0] border-t-transparent" />
            <p className="text-sm text-zinc-500">Loading...</p>
          </div>
        </div>
      )
    );
  }

  return <>{children}</>;
}

// HOC for lazy loading components
export function withLoading<P extends object>(
  Component: ComponentType<P>,
  fallback?: React.ReactNode
) {
  function WithLoadingComponent(props: P) {
    return (
      <LoadingWrapper fallback={fallback}>
        <Component {...props} />
      </LoadingWrapper>
    );
  }
  WithLoadingComponent.displayName = `withLoading(${Component.displayName || Component.name})`;
  return WithLoadingComponent;
}

// Skeleton variants for different content types
interface TextSkeletonProps {
  lines?: number;
  className?: string;
}

export function TextSkeleton({ lines = 3, className = "" }: TextSkeletonProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          width={i === lines - 1 ? "60%" : "100%"}
        />
      ))}
    </div>
  );
}

interface CardSkeletonProps {
  count?: number;
  className?: string;
}

export function CardSkeleton({ count = 1, className = "" }: CardSkeletonProps) {
  return (
    <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-white/10 bg-white/5 p-5"
        >
          <Skeleton variant="text" width="60%" />
          <div className="mt-4 space-y-2">
            <Skeleton variant="text" />
            <Skeleton variant="text" width="80%" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface ListSkeletonProps {
  items?: number;
  className?: string;
}

export function ListSkeleton({ items = 3, className = "" }: ListSkeletonProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-4">
          <Skeleton variant="circular" width={40} height={40} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="70%" />
            <Skeleton variant="text" width="40%" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Inline loading spinner with options
interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: "primary" | "white" | "zinc";
  className?: string;
}

const sizeStyles = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-2",
  lg: "h-12 w-12 border-3",
};

const colorStyles = {
  primary: "border-[#2ceef0] border-t-transparent",
  white: "border-white border-t-transparent",
  zinc: "border-zinc-500 border-t-transparent",
};

export function LoadingSpinner({
  size = "md",
  color = "primary",
  className = "",
}: LoadingSpinnerProps) {
  return (
    <div
      className={`animate-spin rounded-full ${sizeStyles[size]} ${colorStyles[color]} ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

// Page transition wrapper
interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageTransition({ children, className = "" }: PageTransitionProps) {
  return (
    <div
      className={`animate-fade-in ${className}`}
      style={{
        animationDuration: "0.3s",
        animationFillMode: "both",
      }}
    >
      {children}
    </div>
  );
}
