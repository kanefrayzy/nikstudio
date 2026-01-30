'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface AdminWrapperProps {
  children: React.ReactNode;
}

export function AdminWrapper({ children }: AdminWrapperProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Проверяем аутентификацию только на клиентской стороне
    const checkAuth = () => {
      if (typeof window === 'undefined') return;

      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('admin-token='))
        ?.split('=')[1];
      
      const authenticated = token === 'authenticated';
      setIsAuthenticated(authenticated);
      setLoading(false);

      // Если не аутентифицирован и не на странице логина, перенаправляем
      if (!authenticated && pathname !== '/admin/login') {
        router.push('/admin/login');
      }
    };

    checkAuth();
  }, [pathname, router]);

  // Если это страница логина, показываем её без проверки
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // Показываем загрузку
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Проверка доступа...</span>
        </div>
      </div>
    );
  }

  // Если не аутентифицирован, показываем заглушку
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Перенаправление...
          </h2>
          <p className="text-gray-600">
            Проверка доступа к админ-панели
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}