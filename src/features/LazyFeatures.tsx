import { lazy, Suspense } from 'react';

const LazyPreviewModalComponent = lazy(() =>
  import('./Preview/PreviewModal').then((m) => ({ default: m.PreviewModal }))
);

export const LazyPreviewModal: React.FC<React.ComponentProps<typeof LazyPreviewModalComponent>> = (
  props
) => (
  <Suspense fallback={null}>
    <LazyPreviewModalComponent {...props} />
  </Suspense>
);
