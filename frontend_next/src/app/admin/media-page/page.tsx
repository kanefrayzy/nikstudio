'use client';

import dynamicImport from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Принудительно делаем страницу динамической для продакшн сборки
export const dynamic = 'force-dynamic'

// Lazy load MediaPageAdmin component with loading state
const MediaPageAdmin = dynamicImport(
  () => import('@/components/admin/MediaPageAdmin').then(mod => ({ default: mod.MediaPageAdmin })),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Загрузка панели управления...</p>
        </div>
      </div>
    ),
    ssr: false
  }
);

export default function MediaPageAdminPage() {
  return <MediaPageAdmin />;
}