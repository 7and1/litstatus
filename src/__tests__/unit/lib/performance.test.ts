import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  perfMonitor,
  withTiming,
  withTimingSync,
  measurePerformance,
} from "@/lib/performance";
import type { PerformanceMetrics } from "@/lib/performance";

describe("performance.ts", () => {
  beforeEach(() => {
    perfMonitor.clear();
    vi.clearAllMocks();
  });

  describe("perfMonitor", () => {
    describe("record", () => {
      it("should record performance metrics", () => {
        perfMonitor.record("test-operation", 100, true);

        const metrics = perfMonitor.getMetrics();
        expect(metrics).toHaveLength(1);
        expect(metrics[0]).toEqual({
          operation: "test-operation",
          duration: 100,
          success: true,
          metadata: undefined,
        });
      });

      it("should record metadata when provided", () => {
        perfMonitor.record("test-operation", 100, true, { userId: "123" });

        const metrics = perfMonitor.getMetrics();
        expect(metrics[0].metadata).toEqual({ userId: "123" });
      });

      it("should keep buffer size under maxBufferSize", () => {
        const maxBufferSize = 100;

        // Record more than maxBufferSize metrics
        for (let i = 0; i < maxBufferSize + 10; i++) {
          perfMonitor.record(`operation-${i}`, 100, true);
        }

        const metrics = perfMonitor.getMetrics();
        expect(metrics.length).toBeLessThanOrEqual(maxBufferSize);
      });

      it("should shift old metrics when buffer is full", () => {
        perfMonitor.record("first-operation", 100, true);

        // Fill buffer
        for (let i = 0; i < 100; i++) {
          perfMonitor.record(`operation-${i}`, 100, true);
        }

        const metrics = perfMonitor.getMetrics();
        const operationNames = metrics.map((m) => m.operation);

        expect(operationNames).not.toContain("first-operation");
      });
    });

    describe("measure", () => {
      it("should measure async operation duration", async () => {
        const mockFn = vi.fn().mockResolvedValue("result");

        const result = await perfMonitor.measure("async-operation", mockFn);

        expect(result).toBe("result");
        expect(mockFn).toHaveBeenCalledOnce();

        const metrics = perfMonitor.getMetrics();
        expect(metrics).toHaveLength(1);
        expect(metrics[0].operation).toBe("async-operation");
        expect(metrics[0].success).toBe(true);
        expect(metrics[0].duration).toBeGreaterThan(0);
      });

      it("should record failed async operations", async () => {
        const mockFn = vi.fn().mockRejectedValue(new Error("Test error"));

        await expect(
          perfMonitor.measure("async-operation", mockFn)
        ).rejects.toThrow("Test error");

        const metrics = perfMonitor.getMetrics();
        expect(metrics).toHaveLength(1);
        expect(metrics[0].success).toBe(false);
        expect(metrics[0].metadata).toEqual({
          error: "Test error",
        });
      });

      it("should include metadata in measurements", async () => {
        const mockFn = vi.fn().mockResolvedValue("result");

        await perfMonitor.measure("async-operation", mockFn, { userId: "123" });

        const metrics = perfMonitor.getMetrics();
        expect(metrics[0].metadata).toEqual({ userId: "123" });
      });
    });

    describe("measureSync", () => {
      it("should measure sync operation duration", () => {
        const mockFn = vi.fn().mockReturnValue("result");

        const result = perfMonitor.measureSync("sync-operation", mockFn);

        expect(result).toBe("result");
        expect(mockFn).toHaveBeenCalledOnce();

        const metrics = perfMonitor.getMetrics();
        expect(metrics).toHaveLength(1);
        expect(metrics[0].operation).toBe("sync-operation");
        expect(metrics[0].success).toBe(true);
        expect(metrics[0].duration).toBeGreaterThan(0);
      });

      it("should record failed sync operations", () => {
        const mockFn = vi.fn().mockImplementation(() => {
          throw new Error("Sync error");
        });

        expect(() => perfMonitor.measureSync("sync-operation", mockFn)).toThrow(
          "Sync error"
        );

        const metrics = perfMonitor.getMetrics();
        expect(metrics).toHaveLength(1);
        expect(metrics[0].success).toBe(false);
        expect(metrics[0].metadata).toEqual({
          error: "Sync error",
        });
      });
    });

    describe("getMetrics", () => {
      it("should return copy of metrics", () => {
        perfMonitor.record("operation-1", 100, true);
        perfMonitor.record("operation-2", 200, true);

        const metrics1 = perfMonitor.getMetrics();
        const metrics2 = perfMonitor.getMetrics();

        expect(metrics1).toEqual(metrics2);
        expect(metrics1).not.toBe(metrics2);
      });

      it("should return empty array initially", () => {
        const metrics = perfMonitor.getMetrics();
        expect(metrics).toEqual([]);
      });
    });

    describe("getAverageDuration", () => {
      it("should calculate average duration for operation", () => {
        perfMonitor.record("operation-1", 100, true);
        perfMonitor.record("operation-1", 200, true);
        perfMonitor.record("operation-1", 300, true);

        const avg = perfMonitor.getAverageDuration("operation-1");
        expect(avg).toBe(200);
      });

      it("should return 0 for unknown operation", () => {
        const avg = perfMonitor.getAverageDuration("unknown-operation");
        expect(avg).toBe(0);
      });
    });

    describe("getSuccessRate", () => {
      it("should calculate success rate for operation", () => {
        perfMonitor.record("operation-1", 100, true);
        perfMonitor.record("operation-1", 100, true);
        perfMonitor.record("operation-1", 100, false);

        const rate = perfMonitor.getSuccessRate("operation-1");
        expect(rate).toBe(2 / 3);
      });

      it("should return 1 for unknown operation", () => {
        const rate = perfMonitor.getSuccessRate("unknown-operation");
        expect(rate).toBe(1);
      });
    });

    describe("clear", () => {
      it("should clear all metrics", () => {
        perfMonitor.record("operation-1", 100, true);
        perfMonitor.record("operation-2", 200, true);

        expect(perfMonitor.getMetrics()).toHaveLength(2);

        perfMonitor.clear();

        expect(perfMonitor.getMetrics()).toEqual([]);
      });
    });
  });

  describe("withTiming", () => {
    it("should measure async function execution time", async () => {
      const asyncFn = async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return "result";
      };

      const result = await withTiming("test-operation", asyncFn);

      expect(result).toBe("result");

      const metrics = perfMonitor.getMetrics();
      const testOpMetrics = metrics.filter((m) => m.operation === "test-operation");
      expect(testOpMetrics.length).toBeGreaterThan(0);
    });

    it("should include metadata in timing records", async () => {
      const asyncFn = async () => "result";

      await withTiming("test-operation", asyncFn, { key: "value" });

      const metrics = perfMonitor.getMetrics();
      const testOpMetric = metrics.find((m) => m.operation === "test-operation");
      expect(testOpMetric?.metadata).toEqual({ key: "value" });
    });
  });

  describe("withTimingSync", () => {
    it("should measure sync function execution time", () => {
      const syncFn = () => "result";

      const result = withTimingSync("test-operation", syncFn);

      expect(result).toBe("result");

      const metrics = perfMonitor.getMetrics();
      const testOpMetrics = metrics.filter((m) => m.operation === "test-operation");
      expect(testOpMetrics.length).toBeGreaterThan(0);
    });

    it("should include metadata in timing records", () => {
      const syncFn = () => "result";

      withTimingSync("test-operation", syncFn, { key: "value" });

      const metrics = perfMonitor.getMetrics();
      const testOpMetric = metrics.find((m) => m.operation === "test-operation");
      expect(testOpMetric?.metadata).toEqual({ key: "value" });
    });
  });

  describe("measurePerformance decorator", () => {
    it("should wrap method with performance measurement", async () => {
      class TestClass {
        @measurePerformance("test-class")
        async testMethod() {
          return "method result";
        }
      }

      const instance = new TestClass();
      const result = await instance.testMethod();

      expect(result).toBe("method result");

      const metrics = perfMonitor.getMetrics();
      const decoratedMetric = metrics.find((m) => m.operation === "test-class.testMethod");
      expect(decoratedMetric).toBeDefined();
    });
  });
});
