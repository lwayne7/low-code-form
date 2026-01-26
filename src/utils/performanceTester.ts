import type { ComponentSchema } from '../types';
import { useStore } from '../store';
import {
  countComponents,
  findComponentById,
  flattenComponents,
} from './componentHelpers';

type PerformanceMemory = {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
};

export type PerformanceReport = {
  timestamp: string;
  componentCount: number;
  flattenedCount: number;
  maxDepth: number;
  memoryUsageMB?: number;
  fps?: number;
  sampleMs: {
    flattenComponents: number;
    findDeepComponent: number;
    countComponents: number;
  };
};

export type StressTestResult = {
  targetFps: number;
  reachedComponents: number;
  lastFps?: number;
};

export type PerformanceTestApi = {
  generateTestComponents: (count: number) => { durationMs: number; componentCount: number };
  generateNestedStructure: (depth: number, breadth: number) => {
    durationMs: number;
    componentCount: number;
    maxDepth: number;
  };
  generatePerformanceReport: (options?: { sampleFpsMs?: number }) => Promise<PerformanceReport>;
  stressTest: (
    targetFps?: number,
    options?: {
      step?: number;
      maxComponents?: number;
      sampleFpsMs?: number;
      settleMs?: number;
    }
  ) => Promise<StressTestResult>;
};

type InputSchema = Extract<ComponentSchema, { type: 'Input' }>;
type ContainerSchema = Extract<ComponentSchema, { type: 'Container' }>;

function createTestInput(id: string): InputSchema {
  return {
    id,
    type: 'Input',
    props: {
      label: `Input ${id}`,
      placeholder: '',
    },
  };
}

function createTestContainer(id: string, children: ComponentSchema[]): ContainerSchema {
  return {
    id,
    type: 'Container',
    props: {
      label: `Container ${id}`,
      direction: 'vertical',
      columns: 1,
      gutter: 8,
    },
    children,
  };
}

function buildFlatInputs(count: number, offset = 0): InputSchema[] {
  const components: InputSchema[] = [];
  for (let index = 0; index < count; index++) {
    components.push(createTestInput(`input-${offset + index}`));
  }
  return components;
}

function buildNestedStructure(depth: number, breadth: number): ComponentSchema[] {
  const safeDepth = Math.max(1, Math.floor(depth));
  const safeBreadth = Math.max(1, Math.floor(breadth));

  const buildContainer = (level: number, path: string): ComponentSchema => {
    if (level <= 1) {
      const children = Array.from({ length: safeBreadth }, (_, index) =>
        createTestInput(`input-${path}-${index}`)
      );
      return createTestContainer(`container-${path}`, children);
    }

    const children: ComponentSchema[] = [];
    for (let index = 0; index < safeBreadth; index++) {
      children.push(buildContainer(level - 1, `${path}-${index}`));
    }
    return createTestContainer(`container-${path}`, children);
  };

  return [buildContainer(safeDepth, 'root')];
}

function getMaxDepth(components: ComponentSchema[], currentDepth = 0): number {
  let maxDepth = currentDepth;
  for (const component of components) {
    const nextDepth = currentDepth + 1;
    maxDepth = Math.max(maxDepth, nextDepth);
    if (component.children && component.children.length > 0) {
      maxDepth = Math.max(maxDepth, getMaxDepth(component.children, nextDepth));
    }
  }
  return maxDepth;
}

function getMemoryUsageMB(): number | undefined {
  const memory = (performance as unknown as { memory?: PerformanceMemory }).memory;
  if (!memory) return undefined;
  return Math.round(memory.usedJSHeapSize / 1024 / 1024);
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function sampleFps(sampleMs: number): Promise<number> {
  const durationMs = Math.max(200, Math.floor(sampleMs));

  return new Promise((resolve) => {
    let frames = 0;
    const start = performance.now();

    const tick = (now: number) => {
      frames++;
      const elapsed = now - start;
      if (elapsed >= durationMs) {
        resolve(Math.round((frames * 1000) / elapsed));
        return;
      }
      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  });
}

function resetCanvasState() {
  const { resetCanvas } = useStore.getState();
  resetCanvas();
  useStore.setState({
    selectedIds: [],
    history: { past: [], future: [] },
    formValues: {},
    validationErrors: {},
  });
}

export function registerPerformanceTest(): PerformanceTestApi {
  const api: PerformanceTestApi = {
    generateTestComponents: (count) => {
      const safeCount = Math.max(0, Math.floor(count));
      resetCanvasState();

      const start = performance.now();
      const components = buildFlatInputs(safeCount);
      useStore.setState({ components, selectedIds: [] });
      const end = performance.now();

      const durationMs = Math.round(end - start);
      console.log('[performanceTest] generateTestComponents', { count: safeCount, durationMs });
      return { durationMs, componentCount: safeCount };
    },

    generateNestedStructure: (depth, breadth) => {
      resetCanvasState();

      const start = performance.now();
      const components = buildNestedStructure(depth, breadth);
      useStore.setState({ components, selectedIds: [] });
      const end = performance.now();

      const durationMs = Math.round(end - start);
      const componentCount = countComponents(components);
      const maxDepth = getMaxDepth(components);

      console.log('[performanceTest] generateNestedStructure', {
        depth,
        breadth,
        componentCount,
        maxDepth,
        durationMs,
      });

      return { durationMs, componentCount, maxDepth };
    },

    generatePerformanceReport: async (options) => {
      const { components } = useStore.getState();
      const sampleFpsMs = options?.sampleFpsMs ?? 1000;

      const flattenStart = performance.now();
      const flattened = flattenComponents(components);
      const flattenEnd = performance.now();

      const deepTargetId =
        flattened.length > 0 ? flattened[flattened.length - 1].id : 'non-existent';
      const findStart = performance.now();
      findComponentById(components, deepTargetId);
      const findEnd = performance.now();

      const countStart = performance.now();
      countComponents(components);
      const countEnd = performance.now();

      const report: PerformanceReport = {
        timestamp: new Date().toISOString(),
        componentCount: components.length,
        flattenedCount: flattened.length,
        maxDepth: getMaxDepth(components),
        memoryUsageMB: getMemoryUsageMB(),
        fps: await sampleFps(sampleFpsMs),
        sampleMs: {
          flattenComponents: Math.round(flattenEnd - flattenStart),
          findDeepComponent: Math.round(findEnd - findStart),
          countComponents: Math.round(countEnd - countStart),
        },
      };

      console.log('[performanceTest] generatePerformanceReport', report);
      return report;
    },

    stressTest: async (targetFps = 30, options) => {
      const safeTargetFps = Math.max(1, Math.floor(targetFps));
      const step = Math.max(10, Math.floor(options?.step ?? 100));
      const maxComponents = Math.max(step, Math.floor(options?.maxComponents ?? 5000));
      const sampleFpsMs = Math.max(200, Math.floor(options?.sampleFpsMs ?? 1000));
      const settleMs = Math.max(0, Math.floor(options?.settleMs ?? 200));

      resetCanvasState();

      let reachedComponents = 0;
      let lastFps: number | undefined;

      while (reachedComponents < maxComponents) {
        reachedComponents += step;
        const components = buildFlatInputs(reachedComponents);
        useStore.setState({ components, selectedIds: [] });

        if (settleMs > 0) {
          await wait(settleMs);
        }

        lastFps = await sampleFps(sampleFpsMs);
        console.log('[performanceTest] stressTest', {
          reachedComponents,
          fps: lastFps,
          targetFps: safeTargetFps,
        });

        if (lastFps < safeTargetFps) break;
      }

      const result: StressTestResult = {
        targetFps: safeTargetFps,
        reachedComponents,
        lastFps,
      };

      console.log('[performanceTest] stressTest result', result);
      return result;
    },
  };

  window.performanceTest = api;
  return api;
}
