'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Save, 
  Upload, 
  X, 
  AlertCircle, 
  CheckCircle, 
  Home, 
  Briefcase,
  Plus,
  // Trash2,
  Image
} from "lucide-react";
import { post } from '@/lib/api';

interface PageSEOSettingsProps {
  pageTypes: Record<string, string>;
  initialSettings: Record<string, any>;
  onUpdate?: () => void;
}

interface PageSEOData {
  seo_title: string;
  seo_description: string;
  seo_keywords: string[];
  canonical_url: string;
  seo_image: File | null;
  is_active: boolean;
}

export function PageSEOSettings({ pageTypes, initialSettings, onUpdate }: PageSEOSettingsProps) {
  const [selectedPageType, setSelectedPageType] = useState<string>('');
  const [pageData, setPageData] = useState<PageSEOData>({
    seo_title: '',
    seo_description: '',
    seo_keywords: [],
    canonical_url: '',
    seo_image: null,
    is_active: true,
  });
  
  const [currentImageUrl, setCurrentImageUrl] = useState<string>('');
  const [newKeyword, setNewKeyword] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  // Load data when page type changes
  useEffect(() => {
    if (selectedPageType && initialSettings[selectedPageType]) {
      const settings = initialSettings[selectedPageType];
      setPageData({
        seo_title: settings.seo_title || '',
        seo_description: settings.seo_description || '',
        seo_keywords: settings.seo_keywords || [],
        canonical_url: settings.canonical_url || '',
        seo_image: null,
        is_active: settings.is_active ?? true,
      });
      
      if (settings.seo_image) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        setCurrentImageUrl(`${apiUrl}/storage/${settings.seo_image}`);
      } else {
        setCurrentImageUrl('');
      }
    } else if (selectedPageType) {
      // Reset form for new page type
      setPageData({
        seo_title: '',
        seo_description: '',
        seo_keywords: [],
        canonical_url: '',
        seo_image: null,
        is_active: true,
      });
      setCurrentImageUrl('');
    }
  }, [selectedPageType, initialSettings]);

  const handleInputChange = (field: keyof PageSEOData, value: string | boolean) => {
    setPageData(prev => ({
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

      setPageData(prev => ({
        ...prev,
        seo_image: file
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
    setPageData(prev => ({
      ...prev,
      seo_image: null
    }));
    setCurrentImageUrl('');
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !pageData.seo_keywords.includes(newKeyword.trim())) {
      setPageData(prev => ({
        ...prev,
        seo_keywords: [...prev.seo_keywords, newKeyword.trim()]
      }));
      setNewKeyword('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setPageData(prev => ({
      ...prev,
      seo_keywords: prev.seo_keywords.filter(k => k !== keyword)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPageType) {
      setError('Выберите тип страницы');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Debug: проверяем наличие токена
      const token = document.cookie.split(';').find(c => c.trim().startsWith('admin-token='));
      console.log('[PageSEOSettings] Token exists:', !!token);
      if (!token) {
        throw new Error('Токен авторизации не найден. Пожалуйста, войдите в систему.');
      }

      const formData = new FormData();
      formData.append('seo_title', pageData.seo_title);
      formData.append('seo_description', pageData.seo_description);
      formData.append('canonical_url', pageData.canonical_url);
      formData.append('is_active', pageData.is_active ? 'true' : 'false');
      
      // Add keywords as array
      pageData.seo_keywords.forEach((keyword, index) => {
        formData.append(`seo_keywords[${index}]`, keyword);
      });
      
      if (pageData.seo_image) {
        formData.append('seo_image', pageData.seo_image);
      }

      console.log('[PageSEOSettings] Отправка данных на:', `/api/seo/pages/${selectedPageType}`);
      console.log('[PageSEOSettings] FormData содержит:', {
        seo_title: pageData.seo_title,
        seo_description: pageData.seo_description,
        canonical_url: pageData.canonical_url,
        is_active: pageData.is_active,
        seo_keywords: pageData.seo_keywords,
        has_image: !!pageData.seo_image
      });
      
      const result = await post<{ success: boolean; message?: string }>(`/api/seo/pages/${selectedPageType}`, formData);
      console.log('[PageSEOSettings] Ответ получен:', result);

      if (result?.success) {
        setSuccess(`SEO-настройки для страницы "${pageTypes[selectedPageType]}" успешно сохранены`);
        if (onUpdate) {
          onUpdate();
        }
      } else {
        throw new Error(result?.message || 'Ошибка при сохранении настроек');
      }
    } catch (err: any) {
      console.error('Ошибка при сохранении SEO-настроек страницы:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Неизвестная ошибка';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getPageIcon = (pageType: string) => {
    switch (pageType) {
      case 'home':
        return <Home className="w-4 h-4" />;
      case 'projects_list':
        return <Briefcase className="w-4 h-4" />;
      case 'blog_list':
        return <FileText className="w-4 h-4" />;
      case 'media':
        return <Image className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            SEO-настройки страниц
          </CardTitle>
          <CardDescription>
            Настройка SEO для страниц списков (главная, проекты, блог, медиа)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(pageTypes).map(([type, name]) => (
              <Card 
                key={type}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedPageType === type ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                }`}
                onClick={() => setSelectedPageType(type)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {getPageIcon(type)}
                    <div className="flex-1">
                      <h3 className="font-medium">{name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {initialSettings[type] ? (
                          <Badge variant="default" className="text-xs">
                            Настроено
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            Не настроено
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* SEO Form */}
      {selectedPageType && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getPageIcon(selectedPageType)}
              SEO для страницы: {pageTypes[selectedPageType]}
            </CardTitle>
            <CardDescription>
              Настройте SEO-параметры для этой страницы
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
              {/* SEO Title */}
              <div className="space-y-2">
                <Label htmlFor="seo_title">SEO Заголовок</Label>
                <Input
                  id="seo_title"
                  value={pageData.seo_title}
                  onChange={(e) => handleInputChange('seo_title', e.target.value)}
                  placeholder="Уникальный заголовок для этой страницы"
                  maxLength={255}
                />
                <p className="text-sm text-muted-foreground">
                  Заголовок страницы в поисковых системах ({pageData.seo_title.length}/255)
                </p>
              </div>

              {/* SEO Description */}
              <div className="space-y-2">
                <Label htmlFor="seo_description">SEO Описание</Label>
                <Textarea
                  id="seo_description"
                  value={pageData.seo_description}
                  onChange={(e) => handleInputChange('seo_description', e.target.value)}
                  placeholder="Описание страницы для поисковых систем"
                  maxLength={500}
                  rows={3}
                />
                <p className="text-sm text-muted-foreground">
                  Описание страницы в поисковых системах ({pageData.seo_description.length}/500)
                </p>
              </div>

              {/* Keywords */}
              <div className="space-y-2">
                <Label>Ключевые слова</Label>
                <div className="flex gap-2">
                  <Input
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    placeholder="Добавить ключевое слово"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addKeyword();
                      }
                    }}
                  />
                  <Button type="button" onClick={addKeyword} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                
                {pageData.seo_keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {pageData.seo_keywords.map((keyword, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {keyword}
                        <button
                          type="button"
                          onClick={() => removeKeyword(keyword)}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                
                <p className="text-sm text-muted-foreground">
                  Ключевые слова для поисковой оптимизации
                </p>
              </div>

              {/* Canonical URL */}
              <div className="space-y-2">
                <Label htmlFor="canonical_url">Канонический URL</Label>
                <Input
                  id="canonical_url"
                  type="url"
                  value={pageData.canonical_url}
                  onChange={(e) => handleInputChange('canonical_url', e.target.value)}
                  placeholder="https://nikstudio.pro/projects"
                />
                <p className="text-sm text-muted-foreground">
                  Основной URL страницы (необязательно)
                </p>
              </div>

              {/* SEO Image */}
              <div className="space-y-2">
                <Label>SEO Изображение</Label>
                
                {currentImageUrl && (
                  <div className="relative inline-block">
                    <img 
                      src={currentImageUrl} 
                      alt="SEO изображение" 
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
                    id="seo_image"
                  />
                  <Label 
                    htmlFor="seo_image"
                    className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    <Upload className="w-4 h-4" />
                    Выбрать изображение
                  </Label>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  Изображение для социальных сетей. Максимальный размер: 2 МБ. 
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
      )}
    </div>
  );
}