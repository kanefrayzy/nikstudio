'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Принудительно делаем страницу логина динамической
export const dynamic = 'force-dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, LogIn } from "lucide-react";
import { post, saveTokenToCookie, getTokenFromCookie } from '@/lib/api';

export default function AdminLoginPage() {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Проверяем, если уже аутентифицирован
  useEffect(() => {
    const token = getTokenFromCookie();
    
    // Если токен существует и не пустой, перенаправляем на админку
    if (token && token.trim() !== '') {
      router.push('/admin');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log('Credentials:', { email: credentials.username, password: '***' });
      
      const data = await post<{
        success: boolean;
        token: string;
        expires_at?: string;
        user?: any;
      }>('/api/login', {
        email: credentials.username,
        password: credentials.password,
        remember: remember
      });

      console.log('Login response:', { success: data.success, hasToken: !!data.token });
      
      if (data.success && data.token) {
        // Определяем max-age для cookie в зависимости от remember и expires_at
        let maxAge = 60 * 60 * 8; // 8 часов по умолчанию
        let expiresAt: Date;
        
        if (data.expires_at) {
          // Вычисляем разницу между expires_at и текущим временем
          expiresAt = new Date(data.expires_at);
          const now = new Date();
          const diffInSeconds = Math.floor((expiresAt.getTime() - now.getTime()) / 1000);
          
          if (diffInSeconds > 0) {
            maxAge = diffInSeconds;
          }
        } else if (remember) {
          // Если expires_at не пришел, но remember включен, используем 30 дней
          maxAge = 60 * 60 * 24 * 30; // 30 дней
          expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 30);
        } else {
          // По умолчанию 8 часов
          expiresAt = new Date();
          expiresAt.setHours(expiresAt.getHours() + 8);
        }
        
        // Сохраняем токен в cookie с правильным max-age
        saveTokenToCookie(data.token, maxAge);
        
        // Сохраняем время истечения токена для useTokenRefresh hook
        const expiresAtStr = expiresAt.toISOString();
        localStorage.setItem('admin-token-expires-at', expiresAtStr);
        document.cookie = `admin-token-expires-at=${encodeURIComponent(expiresAtStr)}; path=/; max-age=${maxAge}`;
        
        // Перенаправляем на админ-панель
        window.location.href = '/admin';
      } else {
        setError('Ошибка получения токена');
        setTimeout(() => setError(null), 3000);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Обработка ошибок валидации (422)
      if (error.response?.status === 422) {
        setError('Неверные учетные данные');
      } else {
        const errorMessage = error.response?.data?.message || error.message || 'Ошибка при входе в систему';
        setError(`Ошибка: ${errorMessage}`);
      }
      
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Вход в админ-панель
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Введите учетные данные для доступа к системе управления
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn className="w-5 h-5" />
              Авторизация
            </CardTitle>
            <CardDescription>              
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} method="post" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Логин</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  value={credentials.username}
                  onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="admin"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={credentials.password}
                  onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={remember}
                  onCheckedChange={setRemember}
                />
                <Label 
                  htmlFor="remember" 
                  className="text-sm font-normal cursor-pointer"
                >
                  Запомнить меня
                </Label>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? 'Вход...' : 'Войти в систему'}
              </Button>
            </form>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}