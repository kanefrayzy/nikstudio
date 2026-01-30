'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    // Проверяем, что мы на клиентской стороне
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('admin-token='))
      ?.split('=')[1];
    
    setIsAuthenticated(token === 'authenticated');
    setLoading(false);
  };

  const login = (username: string, password: string): boolean => {
    // Проверяем, что мы на клиентской стороне
    if (typeof window === 'undefined') {
      return false;
    }

    // Простая проверка (в реальном проекте через API)
    if (username === 'admin' && password === 'MLCdJIqUJyvFwV1') {
      document.cookie = 'admin-token=authenticated; path=/; max-age=86400'; // 24 часа
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    // Проверяем, что мы на клиентской стороне
    if (typeof window !== 'undefined') {
      document.cookie = 'admin-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    }
    setIsAuthenticated(false);
    router.push('/admin/login');
  };

  return {
    isAuthenticated,
    loading,
    login,
    logout,
    checkAuth
  };
}