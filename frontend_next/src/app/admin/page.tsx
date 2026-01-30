"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from "lucide-react";

// Принудительно делаем админку динамической для продакшн сборки
export const dynamic = 'force-dynamic'

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    // Перенаправляем на страницу редактора главной страницы
    router.replace('/admin/homepage-editor');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">Перенаправление...</p>
      </div>
    </div>
  )
} 