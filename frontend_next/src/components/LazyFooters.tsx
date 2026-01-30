'use client';

import dynamic from 'next/dynamic';
import FooterSkeleton from '@/components/FooterSkeleton';
import FooterMobileSkeleton from '@/components/FooterMobileSkeleton';

// Lazy load footer components with skeleton loaders
const Footer = dynamic(() => import('@/components/Footer'), {
  loading: () => <FooterSkeleton />,
  ssr: false,
});

const FooterMobile = dynamic(() => import('@/components/Footer_mobile'), {
  loading: () => <FooterMobileSkeleton />,
  ssr: false,
});

export default function LazyFooters() {
  return (
    <>
      <Footer />
      <FooterMobile />
    </>
  );
}
