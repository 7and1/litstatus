"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { Toast } from "./Toast";

interface OptimisticState<T> {
  data: T | null;
  isPending: boolean;
  error: Error | null;
}

interface OptimisticMutationOptions<T, P> {
  mutateFn: (params: P) => Promise<T>;
  optimisticUpdate?: (currentData: T | null, params: P) => T;
  rollbackData?: T;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export function useOptimisticMutation<T, P>({
  mutateFn,
  optimisticUpdate,
  rollbackData,
  onSuccess,
  onError,
}: OptimisticMutationOptions<T, P>) {
  const [state, setState] = useState<OptimisticState<T>>({
    data: null,
    isPending: false,
    error: null,
  });

  const previousDataRef = useRef<T | null>(null);

  const mutate = useCallback(
    async (params: P) => {
      // Store previous data for rollback
      previousDataRef.current = state.data;

      // Apply optimistic update if provided
      if (optimisticUpdate && state.data !== null) {
        const optimisticData = optimisticUpdate(state.data, params);
        setState({ data: optimisticData, isPending: true, error: null });
      } else {
        setState({ data: state.data, isPending: true, error: null });
      }

      try {
        const result = await mutateFn(params);
        setState({ data: result, isPending: false, error: null });
        onSuccess?.(result);
        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        // Rollback to previous data
        setState({
          data: rollbackData ?? previousDataRef.current,
          isPending: false,
          error: err,
        });
        onError?.(err);
        throw err;
      }
    },
    [mutateFn, optimisticUpdate, rollbackData, onSuccess, onError, state.data]
  );

  const reset = useCallback(() => {
    setState({ data: null, isPending: false, error: null });
  }, []);

  return { ...state, mutate, reset };
}

interface OptimisticFormOptions<T, V> {
  submitFn: (values: V) => Promise<T>;
  initialValues: V;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  onSuccessMessage?: string;
  onErrorMessage?: string;
}

export function useOptimisticForm<T, V>({
  submitFn,
  initialValues,
  onSuccess,
  onError,
  onSuccessMessage,
  onErrorMessage = "Submission failed. Please try again.",
}: OptimisticFormOptions<T, V>) {
  const [values, setValues] = useState<V>(initialValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const optimisticDataRef = useRef<T | null>(null);

  const handleChange = useCallback(<K extends keyof V>(field: K, value: V[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setError(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await submitFn(values);
      optimisticDataRef.current = result;
      setValues(initialValues);
      setSuccessMessage(onSuccessMessage || null);
      onSuccess?.(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : onErrorMessage;
      setError(message);
      onError?.(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [submitFn, values, initialValues, onSuccessMessage, onSuccess, onError, onErrorMessage]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(false);
  }, [initialValues]);

  return {
    values,
    handleChange,
    handleSubmit,
    isSubmitting,
    error,
    successMessage,
    reset,
    optimisticData: optimisticDataRef.current,
  };
}

interface QueuedAction<T = unknown> {
  id: string;
  fn: () => Promise<T>;
  retryCount?: number;
  maxRetries?: number;
}

export function useOfflineQueue() {
  const [isOnline, setIsOnline] = useState(true);
  const [queue, setQueue] = useState<QueuedAction[]>([]);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    // Set initial online status
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Load queue from localStorage
    try {
      const saved = localStorage.getItem("offline_queue");
      if (saved) {
        const parsed = JSON.parse(saved);
        setQueue(parsed);
        setPendingCount(parsed.length);
      }
    } catch {
      // Ignore storage errors
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Persist queue to localStorage
  useEffect(() => {
    if (queue.length > 0) {
      try {
        localStorage.setItem("offline_queue", JSON.stringify(queue));
      } catch {
        // Ignore storage errors
      }
    } else {
      try {
        localStorage.removeItem("offline_queue");
      } catch {
        // Ignore storage errors
      }
    }
  }, [queue]);

  // Process queue when coming back online
  useEffect(() => {
    if (isOnline && queue.length > 0) {
      processQueue();
    }
  }, [isOnline]);

  const processQueue = async () => {
    if (!isOnline || queue.length === 0) return;

    const [action, ...remaining] = queue;
    setQueue(remaining);
    setPendingCount((prev) => Math.max(0, prev - 1));

    try {
      await action.fn();
    } catch (error) {
      // Retry logic
      const retryCount = (action.retryCount ?? 0) + 1;
      const maxRetries = action.maxRetries ?? 3;

      if (retryCount < maxRetries) {
        setQueue((prev) => [
          { ...action, retryCount },
          ...prev,
        ]);
        setPendingCount((prev) => prev + 1);
      }
    }
  };

  const queueAction = useCallback(<T = unknown>(
    fn: () => Promise<T>,
    options?: { maxRetries?: number }
  ) => {
    const action: QueuedAction<T> = {
      id: crypto.randomUUID(),
      fn,
      maxRetries: options?.maxRetries ?? 3,
    };

    setQueue((prev) => [...prev, action]);
    setPendingCount((prev) => prev + 1);

    if (isOnline) {
      processQueue();
    }

    return action.id;
  }, [isOnline]);

  const removeAction = useCallback((id: string) => {
    setQueue((prev) => {
      const filtered = prev.filter((a) => a.id !== id);
      setPendingCount(filtered.length);
      return filtered;
    });
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
    setPendingCount(0);
    try {
      localStorage.removeItem("offline_queue");
    } catch {
      // Ignore storage errors
    }
  }, []);

  return {
    isOnline,
    queueAction,
    removeAction,
    clearQueue,
    pendingCount,
    queueSize: queue.length,
  };
}

// Re-export Toast type for convenience
export type { Toast };
