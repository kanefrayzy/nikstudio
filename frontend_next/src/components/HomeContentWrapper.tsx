'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import with proper error handling
const HomeContentClient = dynamic(
  () => import('../app/HomeContentClient').catch(err => {
    console.error('Failed to load HomeContentClient:', err);
    // Return a fallback component
    return {
      default: () => (
        <div className="text-white text-center py-10">
          <p>Ошибка загрузки контента</p>
          <p className="text-sm text-white/60 mt-2">Попробуйте обновить страницу</p>
        </div>
      )
    };
  }),
  {
    loading: () => <div className="text-white text-center py-10">Загрузка контента...</div>,
    ssr: false
  }
);

export default function HomeContentWrapper() {
  return (
    <Suspense fallback={<div className="text-white text-center py-10">Загрузка...</div>}>
      <HomeContentClient />
    </Suspense>
  );
}