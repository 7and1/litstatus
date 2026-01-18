"use client";

import { useEffect, useRef, ReactNode, cloneElement, isValidElement } from "react";

// Visually hidden but accessible to screen readers
interface VisuallyHiddenProps {
  children: ReactNode;
  focusable?: boolean;
}

export function VisuallyHidden({ children, focusable = false }: VisuallyHiddenProps) {
  return (
    <span
      className="sr-only"
      style={focusable ? {} : undefined}
      data-focusable={focusable ? "true" : undefined}
    >
      {children}
    </span>
  );
}

// Live region for dynamic content announcements
interface LiveRegionProps {
  message: string;
  role?: "status" | "alert";
  politeness?: "polite" | "assertive";
  ariaLive?: "polite" | "assertive" | "off";
}

export function LiveRegion({
  message,
  politeness = "polite",
}: LiveRegionProps) {
  const previousMessageRef = useRef<string | null>(null);

  useEffect(() => {
    if (message !== previousMessageRef.current) {
      previousMessageRef.current = message;
    }
  }, [message]);

  return (
    <div
      role={politeness === "assertive" ? "alert" : "status"}
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}

// Focus management hook
interface FocusManagerOptions {
  autoFocus?: boolean;
  restoreFocus?: boolean;
  trapFocus?: boolean;
}

export function useFocusManager(options: FocusManagerOptions = {}) {
  const containerRef = useRef<HTMLElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  const { autoFocus = true, restoreFocus = true, trapFocus = false } = options;

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    // Store previously focused element
    if (restoreFocus) {
      previousActiveElementRef.current = document.activeElement as HTMLElement;
    }

    // Auto focus first focusable element
    if (autoFocus) {
      const focusable = container.querySelector<HTMLElement>(
        "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
      );
      focusable?.focus();
    }

    // Handle tab trapping if enabled
    if (trapFocus) {
      const handleTab = (e: KeyboardEvent) => {
        if (e.key !== "Tab") return;

        const focusable = Array.from(
          container.querySelectorAll<HTMLElement>(
            "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
          )
        );

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      };

      container.addEventListener("keydown", handleTab);
      return () => {
        container.removeEventListener("keydown", handleTab);

        // Restore focus when unmounting
        if (restoreFocus && previousActiveElementRef.current) {
          previousActiveElementRef.current.focus();
        }
      };
    }

    return () => {
      if (restoreFocus && previousActiveElementRef.current) {
        previousActiveElementRef.current.focus();
      }
    };
  }, [autoFocus, restoreFocus, trapFocus]);

  return containerRef;
}

// Announcer for screen reader messages
let announcerId = 0;

export function useAnnouncer() {
  const [message, setMessage] = React.useState("");
  const [politeness, setPoliteness] = React.useState<"polite" | "assertive">("polite");

  const announce = React.useCallback(
    (msg: string, assertive = false) => {
      setPoliteness(assertive ? "assertive" : "polite");
      setMessage(msg);

      // Clear message after announcement
      setTimeout(() => {
        setMessage("");
      }, 1000);
    },
    []
  );

  const Announcer = () => (
    <div
      role={politeness === "assertive" ? "alert" : "status"}
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
      id={`announcer-${announcerId++}`}
    >
      {message}
    </div>
  );

  return { announce, Announcer };
}

// Add ARIA props to children
interface WithAriaProps {
  children: ReactNode;
  label?: string;
  describedBy?: string;
  labelledBy?: string;
  role?: string;
}

export function WithAria({ children, label, describedBy, labelledBy, role }: WithAriaProps) {
  if (!isValidElement(children)) {
    return <>{children}</>;
  }

  const ariaProps: Record<string, string | undefined> = {
    "aria-label": label,
    "aria-describedby": describedBy,
    "aria-labelledby": labelledBy,
    role,
  };

  return cloneElement(children, {
    ...(typeof children.props === "object" ? children.props : {}),
    ...ariaProps,
  } as React.HTMLAttributes<HTMLElement>);
}

// Skip links for accessibility
interface SkipLinksProps {
  links: Array<{ href: string; label: string }>;
  className?: string;
}

export function SkipLinks({ links, className = "" }: SkipLinksProps) {
  return (
    <div className={className}>
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className="skip-link"
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}

import React from "react";

// Heading level component for maintaining hierarchy
interface HeadingProps {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: ReactNode;
  className?: string;
}

export function Heading({ level, children, className = "" }: HeadingProps) {
  const Tag = `h${level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  return (
    <Tag className={className}>
      {children}
    </Tag>
  );
}

// Landmark region component
interface LandmarkProps {
  role: "banner" | "navigation" | "main" | "complementary" | "contentinfo" | "form" | "search" | "region";
  label?: string;
  children: ReactNode;
  className?: string;
}

export function Landmark({ role, label, children, className = "" }: LandmarkProps) {
  return (
    <div role={role} aria-label={label} className={className}>
      {children}
    </div>
  );
}

// Indicator component for loading states
interface LoadingIndicatorProps {
  isLoading: boolean;
  message?: string;
}

export function LoadingIndicator({ isLoading, message = "Loading" }: LoadingIndicatorProps) {
  return (
    <>
      {isLoading && (
        <div className="inline-flex items-center gap-2" role="status" aria-live="polite">
          <span
            className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden="true"
          />
          <span className="sr-only">{message}</span>
        </div>
      )}
    </>
  );
}
