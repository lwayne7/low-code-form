// 渲染追踪（供 PerformancePanel 和其他组件使用）

let globalRenderCount = 0;
const componentRenderCounts = new Map<string, number>();

export function trackRender(componentName: string) {
  globalRenderCount++;
  componentRenderCounts.set(
    componentName,
    (componentRenderCounts.get(componentName) || 0) + 1
  );
}

export function resetRenderTracking() {
  globalRenderCount = 0;
  componentRenderCounts.clear();
}

export function getRenderTrackingSnapshot() {
  return {
    renderCount: globalRenderCount,
    componentRenderCounts: new Map(componentRenderCounts),
  };
}

