'use client';

import dynamic from 'next/dynamic';

const Breadcrumbs = dynamic(() => import('./Breadcrumbs'), {
  ssr: false,
  loading: () => null,
});

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbsLazyProps {
  items?: BreadcrumbItem[];
}

export default function BreadcrumbsLazy(props: BreadcrumbsLazyProps) {
  return <Breadcrumbs {...props} />;
}
