"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastProps {
  toast: Toast;
  onClose: (id: string) => void;
  index: number;
}

function ToastItem({ toast, onClose, index }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const toastRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isPaused) return;

    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onClose(toast.id), 300);
    }, toast.duration || 4000);

    return () => clearTimeout(timer);
  }, [toast, onClose, isPaused]);

  // Focus management for new toasts
  useEffect(() => {
    if (index === 0 && !isExiting && toastRef.current) {
      closeButtonRef.current?.focus();
    }
  }, [index, isExiting]);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => onClose(toast.id), 300);
  }, [onClose, toast.id]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          handleClose();
          break;
        case "Enter":
        case " ":
          if (document.activeElement === closeButtonRef.current) {
            e.preventDefault();
            handleClose();
          }
          break;
      }
    },
    [handleClose]
  );

  const styles = {
    success: {
      bg: "bg-[#2ceef0]/10 border-[#2ceef0]/30",
      text: "text-[#2ceef0]",
      icon: (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    error: {
      bg: "bg-[#f6b73c]/10 border-[#f6b73c]/30",
      text: "text-[#f6b73c]",
      icon: (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    warning: {
      bg: "bg-orange-500/10 border-orange-500/30",
      text: "text-orange-500",
      icon: (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    info: {
      bg: "bg-blue-500/10 border-blue-500/30",
      text: "text-blue-500",
      icon: (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
  }[toast.type];

  return (
    <div
      ref={toastRef}
      className={`flex items-center gap-3 rounded-lg border ${styles.bg} px-4 py-3 shadow-lg transition-all duration-300 ${
        isExiting ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
      }`}
      role="alert"
      aria-live={toast.type === "error" ? "assertive" : "polite"}
      aria-atomic="true"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <span className={`shrink-0 ${styles.text}`} aria-hidden="true">
        {styles.icon}
      </span>
      <p className={`flex-1 text-sm ${styles.text}`}>{toast.message}</p>
      {toast.action && (
        <button
          onClick={toast.action.onClick}
          className="text-sm font-medium underline underline-offset-2 focus:outline-none focus:ring-2 focus:ring-[#2ceef0] focus:ring-offset-2 focus:ring-offset-[#0b0b0f]"
        >
          {toast.action.label}
        </button>
      )}
      <button
        ref={closeButtonRef}
        onClick={handleClose}
        className={`shrink-0 rounded p-1 ${styles.text} hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#2ceef0] focus:ring-offset-2 focus:ring-offset-[#0b0b0f]`}
        aria-label="Close notification"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left" | "top-center" | "bottom-center";
}

const positionStyles = {
  "top-right": "top-4 right-4",
  "top-left": "top-4 left-4",
  "bottom-right": "bottom-4 right-4",
  "bottom-left": "bottom-4 left-4",
  "top-center": "top-4 left-1/2 -translate-x-1/2",
  "bottom-center": "bottom-4 left-1/2 -translate-x-1/2",
};

export function ToastContainer({
  toasts,
  onClose,
  position = "bottom-right"
}: ToastContainerProps) {
  if (typeof window === "undefined") return null;

  return createPortal(
    <div
      className={`fixed z-50 flex flex-col gap-2 ${positionStyles[position]}`}
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      {toasts.map((toast, index) => (
        <ToastItem key={toast.id} toast={toast} onClose={onClose} index={index} />
      ))}
    </div>,
    document.body
  );
}

// Hook for managing toasts
interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((options: ToastOptions) => {
    const id = crypto.randomUUID();
    const newToast: Toast = {
      id,
      message: options.message,
      type: options.type || "info",
      duration: options.duration || 4000,
      action: options.action,
    };

    setToasts((prev) => [...prev, newToast]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback(
    (message: string, options?: Omit<ToastOptions, "message" | "type">) => {
      return addToast({ ...options, message, type: "success" });
    },
    [addToast]
  );

  const error = useCallback(
    (message: string, options?: Omit<ToastOptions, "message" | "type">) => {
      return addToast({ ...options, message, type: "error", duration: 6000 });
    },
    [addToast]
  );

  const warning = useCallback(
    (message: string, options?: Omit<ToastOptions, "message" | "type">) => {
      return addToast({ ...options, message, type: "warning" });
    },
    [addToast]
  );

  const info = useCallback(
    (message: string, options?: Omit<ToastOptions, "message" | "type">) => {
      return addToast({ ...options, message, type: "info" });
    },
    [addToast]
  );

  const clear = useCallback(() => {
    setToasts([]);
  }, []);

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
    clear,
  };
}
