'use client';

import dynamic from 'next/dynamic';

const QASection = dynamic(() => import('./QASection'), {
  ssr: false,
  loading: () => (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      Loading questions...
    </div>
  ),
});

interface QASectionLazyProps {
  pageType: 'flight-route' | 'airline-route' | 'airline-airport' | 'airport' | 'airline' | 'general';
  pageSlug: string;
  pageUrl: string;
}

export default function QASectionLazy(props: QASectionLazyProps) {
  return <QASection {...props} />;
}
