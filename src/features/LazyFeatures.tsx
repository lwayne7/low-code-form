import { lazy, Suspense } from 'react';
import { LoadingSpinner } from '../components/LazyComponents';

const LazyPreviewModalComponent = lazy(() =>
  import('./Preview/PreviewModal').then((m) => ({ default: m.PreviewModal }))
);

export const LazyPreviewModal: React.FC<React.ComponentProps<typeof LazyPreviewModalComponent>> = (props) => (
  <Suspense fallback={<LoadingSpinner tip="加载预览..." />}>
    <LazyPreviewModalComponent {...props} />
  </Suspense>
);
