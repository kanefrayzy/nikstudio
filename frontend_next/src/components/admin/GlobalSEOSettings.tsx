'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Globe, Save, Upload, X, AlertCircle, CheckCircle } from "lucide-react";
import { post } from '@/lib/api';

interface GlobalSEOSettingsProps {
  initialSettings?: any;
  onUpdate?: () => void;
}

interface SEOSettings {
  site_title: string;
  site_description: string;
  twitter_card_type: 'summary' | 'summary_large_image';
  facebook_app_id: string;
  default_image: File | null;
}

export function GlobalSEOSettings({ initialSettings, onUpdate }: GlobalSEOSettingsProps) {
  const [settings, setSettings] = useState<SEOSettings>({
    site_title: '',
    site_description: '',
    twitter_card_type: 'summary_large_image',
    facebook_app_id: '',
    default_image: null,
  });
  
  const [currentImageUrl, setCurrentImageUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialSettings) {
      setSettings({
        site_title: initialSettings.site_title || '',
        site_description: initialSettings.site_description || '',
        twitter_card_type: initialSettings.twitter_card_type || 'summary_large_image',
        facebook_app_id: initialSettings.facebook_app_id || '',
        default_image: null,
      });
      
      if (initialSettings.default_image) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        setCurrentImageUrl(`${apiUrl}/storage/${initialSettings.default_image}`);
      }
    }
  }, [initialSettings]);

  // Auto-clear messages
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleInputChange = (field: keyof SEOSettings, value: string) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (2MB max)
      if (file.size > 2 * 1024 * 1024) {
        setError('Размер изображения не должен превышать 2 МБ');
        return;
      }

      // Validate file type
      if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type)) {
        setError('Поддерживаются только форматы: JPG, PNG, WEBP');
        return;
      }

      setSettings(prev => ({
        ...prev,
        default_image: file
      }));

      // Preview image
      const reader = new FileReader();
      reader.onload = (e) => {
        setCurrentImageUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSettings(prev => ({
      ...prev,
      default_image: null
    }));
    setCurrentImageUrl('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Debug: проверяем наличие токена
      const token = document.cookie.split(';').find(c => c.trim().startsWith('admin-token='));
      console.log('[GlobalSEOSettings] Token exists:', !!token);
      if (!token) {
        throw new Error('Токен авторизации не найден. Пожалуйста, войдите в систему.');
      }

      const formData = new FormData();
      formData.append('site_title', settings.site_title);
      formData.append('site_description', settings.site_description);
      formData.append('twitter_card_type', settings.twitter_card_type);
      formData.append('facebook_app_id', settings.facebook_app_id);
      
      if (settings.default_image) {
        formData.append('default_image', settings.default_image);
      }

      console.log('[GlobalSEOSettings] Отправка запроса на /api/seo/settings');
      const result = await post<{ success: boolean; message?: string; data?: any }>('/api/seo/settings', formData);
      console.log('[GlobalSEOSettings] Ответ получен:', result);
      console.log('[GlobalSEOSettings] result?.success:', result?.success);
      console.log('[GlobalSEOSettings] typeof result:', typeof result);

      if (result?.success) {
        console.log('[GlobalSEOSettings] Успех! Устанавливаем success message');
        setSuccess('Глобальные SEO-настройки успешно сохранены');
        if (onUpdate) {
          onUpdate();
        }
      } else {
        console.log('[GlobalSEOSettings] Ошибка! result:', result);
        throw new Error(result?.message || 'Ошибка при сохранении настроек');
      }
    } catch (err: any) {
      console.error('Ошибка при сохранении глобальных SEO-настроек:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Неизвестная ошибка';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5" />
          Глобальные SEO-настройки
        </CardTitle>
        <CardDescription>
          Основные SEO-настройки, которые применяются ко всему сайту
        </CardDescription>
      </CardHeader>
      <CardContent>
        {success && (
          <Alert className="mb-4">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
        
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Site Title */}
          <div className="space-y-2">
            <Label htmlFor="site_title">Название сайта *</Label>
            <Input
              id="site_title"
              value={settings.site_title}
              onChange={(e) => handleInputChange('site_title', e.target.value)}
              placeholder="NIK Studio"
              required
              maxLength={255}
            />
            <p className="text-sm text-muted-foreground">
              Основное название сайта, используется в заголовках страниц
            </p>
          </div>

          {/* Site Description */}
          <div className="space-y-2">
            <Label htmlFor="site_description">Описание сайта *</Label>
            <Textarea
              id="site_description"
              value={settings.site_description}
              onChange={(e) => handleInputChange('site_description', e.target.value)}
              placeholder="Комплексные решения для промышленных компаний. Превращаем сложные технологии в понятный визуал."
              required
              maxLength={500}
              rows={3}
            />
            <p className="text-sm text-muted-foreground">
              Описание сайта по умолчанию, используется в мета-тегах ({settings.site_description.length}/500)
            </p>
          </div>

          {/* Twitter Card Type */}
          <div className="space-y-2">
            <Label htmlFor="twitter_card_type">Тип Twitter Card</Label>
            <Select
              value={settings.twitter_card_type}
              onValueChange={(value) => 
                handleInputChange('twitter_card_type', value as 'summary' | 'summary_large_image')
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="summary">Summary</SelectItem>
                <SelectItem value="summary_large_image">Summary Large Image</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Тип карточки для отображения в Twitter
            </p>
          </div>

          {/* Facebook App ID */}
          <div className="space-y-2">
            <Label htmlFor="facebook_app_id">Facebook App ID</Label>
            <Input
              id="facebook_app_id"
              value={settings.facebook_app_id}
              onChange={(e) => handleInputChange('facebook_app_id', e.target.value)}
              placeholder="123456789012345"
              maxLength={255}
            />
            <p className="text-sm text-muted-foreground">
              ID приложения Facebook для аналитики (необязательно)
            </p>
          </div>

          {/* Default Image */}
          <div className="space-y-2">
            <Label>Изображение по умолчанию</Label>
            
            {currentImageUrl && (
              <div className="relative inline-block">
                <img 
                  src={currentImageUrl} 
                  alt="Изображение по умолчанию" 
                  className="w-48 h-32 object-cover rounded-lg border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                  onClick={removeImage}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
            
            <div className="flex items-center gap-4">
              <Input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.svg"
                onChange={handleImageChange}
                className="hidden"
                id="default_image"
              />
              <Label 
                htmlFor="default_image"
                className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <Upload className="w-4 h-4" />
                Выбрать изображение
              </Label>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Изображение по умолчанию для социальных сетей. Максимальный размер: 2 МБ. 
              Форматы: JPG, PNG, WEBP. Рекомендуемый размер: 1200x630px
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={loading} className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              {loading ? 'Сохранение...' : 'Сохранить настройки'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}