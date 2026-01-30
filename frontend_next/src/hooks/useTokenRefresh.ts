'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import apiClient, { getTokenFromCookie, removeTokenFromCookie } from '@/lib/api';

/**
 * Hook для автоматического обновления токенов авторизации
 * Проверяет время истечения токена каждые 5 минут
 * Обновляет токен за 30 минут до истечения
 */
export function useTokenRefresh() {
  const router = useRouter();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);

  /**
   * Извлекает время истечения токена из cookie или localStorage
   * @returns Date объект с временем истечения или null
   */
  const getTokenExpiration = (): Date | null => {
    if (typeof window === 'undefined') return null;

    // Сначала пробуем получить из localStorage
    const expiresAtStr = localStorage.getItem('admin-token-expires-at');
    
    if (expiresAtStr) {
      try {
        const expiresAt = new Date(expiresAtStr);
        if (!isNaN(expiresAt.getTime())) {
          return expiresAt;
        }
      } catch (error) {
        console.error('Ошибка парсинга expires_at из localStorage:', error);
      }
    }

    // Если в localStorage нет, пробуем получить из cookie
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'admin-token-expires-at') {
        try {
          const expiresAt = new Date(decodeURIComponent(value));
          if (!isNaN(expiresAt.getTime())) {
            // Сохраняем в localStorage для следующих проверок
            localStorage.setItem('admin-token-expires-at', expiresAt.toISOString());
            return expiresAt;
          }
        } catch (error) {
          console.error('Ошибка парсинга expires_at из cookie:', error);
        }
      }
    }

    return null;
  };

  /**
   * Сохраняет время истечения токена в localStorage и cookie
   * @param expiresAt - время истечения токена
   */
  const saveTokenExpiration = (expiresAt: Date): void => {
    if (typeof window === 'undefined') return;

    const expiresAtStr = expiresAt.toISOString();
    
    // Сохраняем в localStorage
    localStorage.setItem('admin-token-expires-at', expiresAtStr);
    
    // Сохраняем в cookie
    const maxAge = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
    if (maxAge > 0) {
      document.cookie = `admin-token-expires-at=${encodeURIComponent(expiresAtStr)}; path=/; max-age=${maxAge}`;
    }
  };

  /**
   * Проверяет, нужно ли обновить токен
   * @returns true если токен нужно обновить (осталось менее 30 минут)
   */
  const shouldRefreshToken = (): boolean => {
    const expiresAt = getTokenExpiration();
    
    if (!expiresAt) {
      return false;
    }

    const now = new Date();
    const timeUntilExpiration = expiresAt.getTime() - now.getTime();
    const thirtyMinutesInMs = 30 * 60 * 1000; // 30 минут в миллисекундах

    // Обновляем токен если осталось менее 30 минут
    return timeUntilExpiration > 0 && timeUntilExpiration <= thirtyMinutesInMs;
  };

  /**
   * Обновляет токен через API
   */
  const refreshToken = async (): Promise<void> => {
    // Предотвращаем множественные одновременные запросы на обновление
    if (isRefreshingRef.current) {
      console.log('🔄 Обновление токена уже в процессе, пропускаем');
      return;
    }

    const token = getTokenFromCookie();
    
    if (!token) {
      console.log('🚫 Токен не найден, перенаправление на страницу входа');
      removeTokenFromCookie();
      localStorage.removeItem('admin-token-expires-at');
      router.push('/admin/login');
      return;
    }

    try {
      isRefreshingRef.current = true;
      console.log('🔄 Начинаем обновление токена...');

      // Делаем запрос к любому защищённому endpoint для получения нового токена
      // Backend middleware автоматически вернёт новый токен в заголовке X-New-Token
      const response = await apiClient.get('/api/admin/me');

      // Проверяем, получили ли новый токен в заголовке
      const newToken = response.headers['x-new-token'];
      const newExpiresAt = response.headers['x-token-expires-at'];
      
      if (newToken) {
        console.log('✅ Токен успешно обновлён');
        
        // Токен уже сохранён в cookie через response interceptor в api.ts
        // Обновляем время истечения
        let expiresAt: Date;
        
        if (newExpiresAt) {
          // Используем время истечения из backend
          expiresAt = new Date(newExpiresAt);
        } else {
          // Fallback: 8 часов по умолчанию
          expiresAt = new Date();
          expiresAt.setHours(expiresAt.getHours() + 8);
        }
        
        saveTokenExpiration(expiresAt);
      } else {
        console.log('ℹ️ Новый токен не получен, текущий токен ещё действителен');
      }
    } catch (error) {
      console.error('❌ Ошибка при обновлении токена:', error);
      
      // Если получили 401, перенаправляем на страницу входа
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status: number } };
        if (axiosError.response?.status === 401) {
          console.log('🚫 Токен недействителен, перенаправление на страницу входа');
          removeTokenFromCookie();
          localStorage.removeItem('admin-token-expires-at');
          router.push('/admin/login');
        }
      }
    } finally {
      isRefreshingRef.current = false;
    }
  };

  /**
   * Проверяет токен и обновляет его при необходимости
   */
  const checkAndRefreshToken = async (): Promise<void> => {
    const token = getTokenFromCookie();
    
    // Если токена нет, не делаем ничего (пользователь не авторизован)
    if (!token) {
      return;
    }

    const expiresAt = getTokenExpiration();
    
    if (!expiresAt) {
      console.log('⚠️ Время истечения токена не найдено');
      return;
    }

    const now = new Date();
    
    // Проверяем, не истёк ли токен
    if (now >= expiresAt) {
      console.log('⏰ Токен истёк, перенаправление на страницу входа');
      removeTokenFromCookie();
      localStorage.removeItem('admin-token-expires-at');
      router.push('/admin/login');
      return;
    }

    // Проверяем, нужно ли обновить токен
    if (shouldRefreshToken()) {
      console.log('🔄 Токен скоро истечёт, начинаем обновление');
      await refreshToken();
    }
  };

  useEffect(() => {
    // Проверяем токен сразу при монтировании
    checkAndRefreshToken();

    // Устанавливаем интервал проверки каждые 5 минут
    intervalRef.current = setInterval(() => {
      checkAndRefreshToken();
    }, 5 * 60 * 1000); // 5 минут

    // Очищаем интервал при размонтировании
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [router]);

  return {
    refreshToken,
    checkAndRefreshToken,
    getTokenExpiration,
    saveTokenExpiration,
  };
}
