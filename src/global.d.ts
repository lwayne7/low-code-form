import type { PerformanceTestApi } from './utils/performanceTester';

declare global {
  interface Window {
    performanceTest?: PerformanceTestApi;
  }
}

export {};

