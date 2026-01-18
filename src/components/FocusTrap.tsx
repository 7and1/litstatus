"use client";

import { useEffect, useRef, useCallback } from "react";

interface FocusTrapProps {
  children: React.ReactNode;
  enabled?: boolean;
  autoFocus?: boolean;
  restoreFocus?: boolean;
}

export function FocusTrap({
  children,
  enabled = true,
  autoFocus = true,
  restoreFocus = true,
}: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];

    const focusableSelectors = [
      "a[href]",
      "button:not([disabled])",
      "textarea:not([disabled])",
      'input:not([type="hidden"]):not([disabled])',
      "select:not([disabled])",
      "[tabindex]:not([tabindex='-1'])",
      "[contenteditable]",
    ].join(", ");

    return Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(focusableSelectors)
    ).filter((el) => {
      return el.getAttribute("aria-hidden") !== "true" &&
             el.style.display !== "none" &&
             el.style.visibility !== "hidden";
    });
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled || event.key !== "Tab") return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    },
    [enabled, getFocusableElements]
  );

  const setFocusToFirstElement = useCallback(() => {
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }, [getFocusableElements]);

  useEffect(() => {
    if (!enabled) return;

    // Store the previously focused element
    if (restoreFocus) {
      previousActiveElementRef.current = document.activeElement as HTMLElement;
    }

    // Focus the first element
    if (autoFocus) {
      // Small delay to ensure the modal is rendered
      const timeoutId = setTimeout(() => {
        setFocusToFirstElement();
      }, 50);

      return () => clearTimeout(timeoutId);
    }

    return () => {
      // Restore focus when trap is disabled
      if (restoreFocus && previousActiveElementRef.current) {
        previousActiveElementRef.current.focus();
      }
    };
  }, [enabled, autoFocus, restoreFocus, setFocusToFirstElement]);

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, handleKeyDown]);

  return <div ref={containerRef}>{children}</div>;
}

interface useFocusTrapOptions {
  enabled?: boolean;
  autoFocus?: boolean;
}

export function useFocusTrap({
  enabled = true,
  autoFocus = true,
}: useFocusTrapOptions = {}) {
  const containerRef = useRef<HTMLElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];

    const focusableSelectors = [
      "a[href]",
      "button:not([disabled])",
      "textarea:not([disabled])",
      'input:not([type="hidden"]):not([disabled])',
      "select:not([disabled])",
      "[tabindex]:not([tabindex='-1'])",
      "[contenteditable]",
    ].join(", ");

    return Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(focusableSelectors)
    );
  }, []);

  const trapFocus = useCallback((event: KeyboardEvent) => {
    if (!enabled || event.key !== "Tab") return;

    const focusableElements = getFocusableElements();
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }, [enabled, getFocusableElements]);

  const activate = useCallback(() => {
    if (!containerRef.current) return;

    previousActiveElementRef.current = document.activeElement as HTMLElement;

    if (autoFocus) {
      const focusableElements = getFocusableElements();
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    }

    document.addEventListener("keydown", trapFocus);
  }, [autoFocus, getFocusableElements, trapFocus]);

  const deactivate = useCallback(() => {
    document.removeEventListener("keydown", trapFocus);

    if (previousActiveElementRef.current) {
      previousActiveElementRef.current.focus();
    }
  }, [trapFocus]);

  useEffect(() => {
    if (enabled) {
      activate();
    } else {
      deactivate();
    }

    return deactivate;
  }, [enabled, activate, deactivate]);

  return { containerRef, activate, deactivate };
}
