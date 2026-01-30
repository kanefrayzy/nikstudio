'use client';

import { useState, useEffect } from 'react';

// Принудительно делаем страницу динамической для продакшн сборки
export const dynamic = 'force-dynamic'
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Save, Settings, Globe, Twitter, Facebook } from "lucide-react";
import { SEOSettings, SEOMetadataGenerator } from "@/lib/seo-metadata";
import GlobalSEOPreview from "@/components/GlobalSEOPreview";

interface GlobalSEOFormData {
  site_title: string;
  site_description: string;
  default_image: File | null;
  twitter_card_type: 'summary' | 'summary_large_image';
  facebook_app_id: string;
}

export default function GlobalSEOSettingsPage() {
  const [_settings, setSettings] = useState<SEOSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<GlobalSEOFormData>({
    site_title: '',
    site_description: '',
    default_image: null,
    twitter_card_type: 'summary_large_image',
    facebook_app_id: ''
  });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [currentImageUrl, setCurrentImageUrl] = useState<string>('');

  // Load current settings
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/seo/settings`, {
        cache: 'no-cache' // Используем no-cache вместо no-store для админки
      });
      
      if (!response.ok) {
        throw new Error('Ошибка загрузки настроек');
      }

      const data = await response.json();
      if (data.success) {
        setSettings(data.data);
        setFormData({
          site_title: data.data.site_title || '',
          site_description: data.data.site_description || '',
          default_image: null,
          twitter_card_type: data.data.twitter_card_type || 'summary_large_image',
          facebook_app_id: data.data.facebook_app_id || ''
        });
        setCurrentImageUrl(data.data.default_image || '');
      }
    } catch (error) {
      console.error('Ошибка загрузки настроек:', error);
      const errorToast = toast.error('Ошибка загрузки настроек SEO');
      setTimeout(() => toast.dismiss(errorToast), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof GlobalSEOFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: []
      }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (2MB max)
      if (file.size > 2 * 1024 * 1024) {
        const errorToast = toast.error('Размер изображения не должен превышать 2MB');
        setTimeout(() => toast.dismiss(errorToast), 3000);
        return;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        const errorToast = toast.error('Поддерживаются только форматы: JPEG, PNG, JPG, GIF, WebP');
        setTimeout(() => toast.dismiss(errorToast), 3000);
        return;
      }

      setFormData(prev => ({
        ...prev,
        default_image: file
      }));

      // Clear image error
      if (errors.default_image) {
        setErrors(prev => ({
          ...prev,
          default_image: []
        }));
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string[]> = {};

    if (!formData.site_title.trim()) {
      newErrors.site_title = ['Заголовок сайта обязателен'];
    } else if (formData.site_title.length > 60) {
      newErrors.site_title = ['Заголовок не должен превышать 60 символов'];
    }

    if (!formData.site_description.trim()) {
      newErrors.site_description = ['Описание сайта обязательно'];
    } else if (formData.site_description.length > 160) {
      newErrors.site_description = ['Описание не должно превышать 160 символов'];
    }

    if (formData.facebook_app_id && formData.facebook_app_id.length > 100) {
      newErrors.facebook_app_id = ['Facebook App ID не должен превышать 100 символов'];
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Пожалуйста, исправьте ошибки в форме');
      return;
    }

    try {
      setSaving(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      
      const submitData = new FormData();
      submitData.append('site_title', formData.site_title);
      submitData.append('site_description', formData.site_description);
      submitData.append('twitter_card_type', formData.twitter_card_type);
      submitData.append('facebook_app_id', formData.facebook_app_id);
      
      if (formData.default_image) {
        submitData.append('default_image', formData.default_image);
      }

      const response = await fetch(`${apiUrl}/api/seo/settings`, {
        method: 'POST',
        body: submitData
      });

      const data = await response.json();

      if (response.status === 413) {
        toast.error('Размер файла слишком большой. Максимальный размер: 2MB');
        return;
      }

      if (!response.ok) {
        if (data.errors) {
          setErrors(data.errors);
          toast.error('Ошибка валидации данных');
        } else {
          throw new Error(data.message || 'Ошибка сохранения настроек');
        }
        return;
      }

      if (data.success) {
        setSettings(data.data);
        setCurrentImageUrl(data.data.default_image || '');
        setFormData(prev => ({ ...prev, default_image: null }));
        
        // Invalidate SEO cache when global settings are updated
        SEOMetadataGenerator.invalidateGlobalCache();
        
        const successToast = toast.success('Настройки SEO успешно сохранены');
        setTimeout(() => toast.dismiss(successToast), 3000);
      }
    } catch (error) {
      console.error('Ошибка сохранения настроек:', error);
      toast.error('Ошибка сохранения настроек SEO');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Глобальные настройки SEO
        </h1>
        <p className="text-muted-foreground mt-2">
          Управление общими настройками SEO для всего сайта
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Column */}
        <div>
          <form onSubmit={handleSubmit} className="space-y-6">
        {/* Основные настройки */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Основные настройки
            </CardTitle>
            <CardDescription>
              Базовые SEO настройки для всего сайта
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="site_title">
                Заголовок сайта *
                <span className="text-sm text-muted-foreground ml-2">
                  ({formData.site_title.length}/60)
                </span>
              </Label>
              <Input
                id="site_title"
                value={formData.site_title}
                onChange={(e) => handleInputChange('site_title', e.target.value)}
                placeholder="NIK Studio - Промышленный дизайн"
                maxLength={60}
                className={errors.site_title ? 'border-red-500' : ''}
              />
              {errors.site_title && (
                <p className="text-sm text-red-500">{errors.site_title[0]}</p>
              )}
              {formData.site_title.length > 50 && (
                <p className="text-sm text-yellow-600">
                  Предупреждение: заголовок близок к максимальной длине
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="site_description">
                Описание сайта *
                <span className="text-sm text-muted-foreground ml-2">
                  ({formData.site_description.length}/160)
                </span>
              </Label>
              <Textarea
                id="site_description"
                value={formData.site_description}
                onChange={(e) => handleInputChange('site_description', e.target.value)}
                placeholder="Комплексные решения для промышленных компаний. Превращаем сложные технологии в понятный визуал."
                maxLength={160}
                rows={3}
                className={errors.site_description ? 'border-red-500' : ''}
              />
              {errors.site_description && (
                <p className="text-sm text-red-500">{errors.site_description[0]}</p>
              )}
              {formData.site_description.length > 140 && (
                <p className="text-sm text-yellow-600">
                  Предупреждение: описание близко к максимальной длине
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="default_image">
                Изображение по умолчанию
              </Label>
              <Input
                id="default_image"
                type="file"
                accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
                onChange={handleImageChange}
                className={errors.default_image ? 'border-red-500' : ''}
              />
              {errors.default_image && (
                <p className="text-sm text-red-500">{errors.default_image[0]}</p>
              )}
              <p className="text-sm text-muted-foreground">
                Максимальный размер: 2MB. Форматы: JPEG, PNG, JPG, GIF, WebP
              </p>
              {currentImageUrl && (
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground mb-2">Текущее изображение:</p>
                  <div className="relative w-full max-w-xs h-48">
                    <Image
                      src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${currentImageUrl}`}
                      alt="Текущее изображение по умолчанию"
                      fill
                      className="object-contain border rounded"
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Настройки социальных сетей */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Twitter className="h-5 w-5" />
              Социальные сети
            </CardTitle>
            <CardDescription>
              Настройки для социальных сетей и мессенджеров
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="twitter_card_type">
                Тип Twitter Card *
              </Label>
              <Select
                value={formData.twitter_card_type}
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
                Summary Large Image рекомендуется для лучшего отображения
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="facebook_app_id" className="flex items-center gap-2">
                <Facebook className="h-4 w-4" />
                Facebook App ID
              </Label>
              <Input
                id="facebook_app_id"
                value={formData.facebook_app_id}
                onChange={(e) => handleInputChange('facebook_app_id', e.target.value)}
                placeholder="123456789012345"
                maxLength={100}
                className={errors.facebook_app_id ? 'border-red-500' : ''}
              />
              {errors.facebook_app_id && (
                <p className="text-sm text-red-500">{errors.facebook_app_id[0]}</p>
              )}
              <p className="text-sm text-muted-foreground">
                Необязательно. Используется для Facebook Analytics
              </p>
            </div>
          </CardContent>
        </Card>

            {/* Кнопка сохранения */}
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={saving}
                className="min-w-[120px]"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Сохранить
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Preview Column */}
        <div className="lg:sticky lg:top-6">
          {formData.site_title && formData.site_description && (
            <GlobalSEOPreview
              siteTitle={formData.site_title}
              siteDescription={formData.site_description}
              defaultImage={currentImageUrl}
              twitterCardType={formData.twitter_card_type}
            />
          )}
        </div>
      </div>
    </div>
  );
}