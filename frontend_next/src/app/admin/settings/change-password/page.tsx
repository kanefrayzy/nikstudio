'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Key } from "lucide-react";
import { post } from '@/lib/api';

// Принудительно делаем страницу динамической
export const dynamic = 'force-dynamic';

interface ChangePasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ValidationErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export default function ChangePasswordPage() {
  const [formData, setFormData] = useState<ChangePasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [success, setSuccess] = useState<string | null>(null);

  // Автоматическое скрытие success сообщения через 3 секунды
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Автоматическое скрытие error сообщения через 3 секунды
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Клиентская валидация
  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    let isValid = true;

    // Проверка текущего пароля
    if (!formData.currentPassword) {
      errors.currentPassword = 'Введите текущий пароль';
      isValid = false;
    }

    // Проверка нового пароля
    if (!formData.newPassword) {
      errors.newPassword = 'Введите новый пароль';
      isValid = false;
    } else if (formData.newPassword.length < 8) {
      errors.newPassword = 'Пароль должен содержать минимум 8 символов';
      isValid = false;
    }

    // Проверка подтверждения пароля
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Подтвердите новый пароль';
      isValid = false;
    } else if (formData.newPassword !== formData.confirmPassword) {
      errors.confirmPassword = 'Пароли не совпадают';
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Сбрасываем предыдущие ошибки
    setError(null);
    setValidationErrors({});
    setSuccess(null);

    // Клиентская валидация
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const data = await post<{
        success: boolean;
        message?: string;
      }>('/api/admin/change-password', {
        current_password: formData.currentPassword,
        new_password: formData.newPassword,
        new_password_confirmation: formData.confirmPassword
      });
      
      if (data.success) {
        setSuccess(data.message || 'Пароль успешно изменен');
        
        // Очищаем форму после успешной смены пароля
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        setError(data.message || 'Ошибка при смене пароля');
      }
    } catch (error: any) {
      console.error('Change password error:', error);
      
      // Обработка ошибок валидации (422)
      if (error.response?.status === 422 && error.response?.data?.errors) {
        const serverErrors: ValidationErrors = {};
        const errors = error.response.data.errors;
        
        if (errors.current_password) {
          serverErrors.currentPassword = errors.current_password[0];
        }
        if (errors.new_password) {
          serverErrors.newPassword = errors.new_password[0];
        }
        if (errors.new_password_confirmation) {
          serverErrors.confirmPassword = errors.new_password_confirmation[0];
        }
        
        setValidationErrors(serverErrors);
      } else {
        const errorMessage = error.response?.data?.message || error.message || 'Ошибка при смене пароля';
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ChangePasswordFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Очищаем ошибку для конкретного поля при изменении
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Смена пароля</h1>
        <p className="mt-2 text-sm text-gray-600">
          Обновите пароль для вашей учетной записи администратора
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Изменение пароля
          </CardTitle>
          <CardDescription>
            Введите текущий пароль и новый пароль для обновления
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success && (
            <Alert className="mb-4 border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Текущий пароль</Label>
              <Input
                id="currentPassword"
                name="current_password"
                type="password"
                autoComplete="current-password"
                value={formData.currentPassword}
                onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                placeholder="Введите текущий пароль"
                disabled={loading}
                className={validationErrors.currentPassword ? 'border-red-500' : ''}
              />
              {validationErrors.currentPassword && (
                <p className="text-sm text-red-600">{validationErrors.currentPassword}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Новый пароль</Label>
              <Input
                id="newPassword"
                name="new_password"
                type="password"
                autoComplete="new-password"
                value={formData.newPassword}
                onChange={(e) => handleInputChange('newPassword', e.target.value)}
                placeholder="Минимум 8 символов"
                disabled={loading}
                className={validationErrors.newPassword ? 'border-red-500' : ''}
              />
              {validationErrors.newPassword && (
                <p className="text-sm text-red-600">{validationErrors.newPassword}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Подтверждение нового пароля</Label>
              <Input
                id="confirmPassword"
                name="new_password_confirmation"
                type="password"
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                placeholder="Повторите новый пароль"
                disabled={loading}
                className={validationErrors.confirmPassword ? 'border-red-500' : ''}
              />
              {validationErrors.confirmPassword && (
                <p className="text-sm text-red-600">{validationErrors.confirmPassword}</p>
              )}
            </div>

            <div className="pt-4">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? 'Изменение пароля...' : 'Изменить пароль'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
