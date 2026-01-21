"use client";

import { useState, useCallback, createElement } from "react";
import type { Toast } from "@/components/Toast";
import { ToastContainer } from "@/components/Toast";

export interface UseToastReturn {
  toasts: Toast[];
  showToast: (message: string, type?: Toast["type"], duration?: number) => string;
  success: (message: string, duration?: number) => string;
  error: (message: string, duration?: number) => string;
  warning: (message: string, duration?: number) => string;
  info: (message: string, duration?: number) => string;
  removeToast: (id: string) => void;
  ToastComponent: () => JSX.Element;
}

export function useToast(): UseToastReturn {
  const [items, setItems] = useState<Toast[]>([]);

  const showToast = useCallback(
    (message: string, type: Toast["type"] = "info", duration?: number) => {
      const id = crypto.randomUUID();
      const newToast: Toast = { id, message, type, duration };
      setItems((prev) => [...prev, newToast]);
      return id;
    },
    [],
  );

  const removeToast = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback(
    (message: string, duration?: number) => showToast(message, "success", duration),
    [showToast],
  );

  const error = useCallback(
    (message: string, duration?: number) => showToast(message, "error", duration),
    [showToast],
  );

  const warning = useCallback(
    (message: string, duration?: number) => showToast(message, "warning", duration),
    [showToast],
  );

  const info = useCallback(
    (message: string, duration?: number) => showToast(message, "info", duration),
    [showToast],
  );

  const ToastComponent = useCallback(
    () => {
      return createElement(ToastContainer, { toasts: items, onClose: removeToast });
    },
    [items, removeToast],
  );

  return {
    toasts: items,
    showToast,
    success,
    error,
    warning,
    info,
    removeToast,
    ToastComponent,
  };
}
