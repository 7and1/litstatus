// Performance monitoring utilities for P2 production optimization

interface PerformanceMetrics {
  operation: string;
  duration: number;
  success: boolean;
  metadata?: Record<string, unknown>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private maxBufferSize = 100;

  record(operation: string, duration: number, success: boolean, metadata?: Record<string, unknown>) {
    const metric: PerformanceMetrics = {
      operation,
      duration,
      success,
      metadata,
    };

    this.metrics.push(metric);

    // Keep buffer size under control
    if (this.metrics.length > this.maxBufferSize) {
      this.metrics.shift();
    }

    // Log slow operations
    if (duration > 1000) {
      console.warn(`[PERFORMANCE] Slow operation: ${operation} took ${duration}ms`, metadata);
    }

    // Log failed operations
    if (!success) {
      console.error(`[PERFORMANCE] Failed operation: ${operation} after ${duration}ms`, metadata);
    }
  }

  measure<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    const start = Date.now();
    return fn()
      .then((result) => {
        const duration = Date.now() - start;
        this.record(operation, duration, true, metadata);
        return result;
      })
      .catch((error) => {
        const duration = Date.now() - start;
        this.record(operation, duration, false, { ...metadata, error: error.message });
        throw error;
      });
  }

  measureSync<T>(
    operation: string,
    fn: () => T,
    metadata?: Record<string, unknown>
  ): T {
    const start = Date.now();
    try {
      const result = fn();
      const duration = Date.now() - start;
      this.record(operation, duration, true, metadata);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.record(operation, duration, false, { ...metadata, error: (error as Error).message });
      throw error;
    }
  }

  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  getAverageDuration(operation: string): number {
    const filtered = this.metrics.filter(m => m.operation === operation);
    if (filtered.length === 0) return 0;
    const sum = filtered.reduce((acc, m) => acc + m.duration, 0);
    return sum / filtered.length;
  }

  getSuccessRate(operation: string): number {
    const filtered = this.metrics.filter(m => m.operation === operation);
    if (filtered.length === 0) return 1;
    const successful = filtered.filter(m => m.success).length;
    return successful / filtered.length;
  }

  clear() {
    this.metrics = [];
  }
}

// Global instance
export const perfMonitor = new PerformanceMonitor();

// Decorator for async functions
export function measurePerformance(operation: string, metadata?: Record<string, unknown>) {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: unknown[]) {
      return perfMonitor.measure(
        `${operation}.${propertyKey}`,
        () => originalMethod.apply(this, args),
        metadata
      );
    };
    return descriptor;
  };
}

// Utility function for timing code blocks
export async function withTiming<T>(
  operation: string,
  fn: () => Promise<T>,
  metadata?: Record<string, unknown>
): Promise<T> {
  return perfMonitor.measure(operation, fn, metadata);
}

// Utility for synchronous timing
export function withTimingSync<T>(
  operation: string,
  fn: () => T,
  metadata?: Record<string, unknown>
): T {
  return perfMonitor.measureSync(operation, fn, metadata);
}
