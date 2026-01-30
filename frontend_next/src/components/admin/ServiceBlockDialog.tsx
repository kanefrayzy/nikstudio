'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { get, post, put, del } from '@/lib/api';

import { 
  Save, 
  AlertCircle, 
  CheckCircle, 
  Settings,
  List,
  Image as ImageIcon,
  Loader2
} from "lucide-react";

// Динамический импорт DndProvider для оптимизации bundle size
const DndProviderWrapper = dynamic(
  () => import('./DndProviderWrapper').then(mod => ({ default: mod.DndProviderWrapper })),
  {
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    ),
    ssr: false
  }
);

// Динамический импорт тяжелых компонентов с drag-and-drop
const ServiceFeaturesManager = dynamic(
  () => import('./ServiceFeaturesManager').then(mod => ({ default: mod.ServiceFeaturesManager })),
  {
    loading: () => (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    ),
    ssr: false
  }
);

const ServiceMediaManager = dynamic(
  () => import('./ServiceMediaManager').then(mod => ({ default: mod.ServiceMediaManager })),
  {
    loading: () => (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    ),
    ssr: false
  }
);

interface ServiceBlockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service?: MediaService | null;
  onSave: () => void;
}

interface MediaService {
  id?: number;
  title: string;
  description: string;
  dark_background: boolean;
  order?: number;
  features: ServiceFeature[];
  mediaItems?: MediaItem[];
}

interface ServiceFeature {
  id?: number;
  title: string;
  description: string[];
  order: number;
}

interface MediaItem {
  id?: number;
  group_id: number;
  media_type: 'main' | 'secondary';
  file_type: 'image' | 'video';
  file_path: string;
  poster_path?: string;
  alt_text: string;
  order: number;
}

export function ServiceBlockDialog({ open, onOpenChange, service, onSave }: ServiceBlockDialogProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('basic');

  // Form state
  const [formData, setFormData] = useState<MediaService>({
    title: '',
    description: '',
    dark_background: false,
    features: [],
    mediaItems: []
  });

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

  // Load media items for service
  const loadMediaItems = async (serviceId: number) => {
    try {
      const response = await get<{ success: boolean; data: any }>(`/api/media-services/${serviceId}/media`);
      
      if (response.success && response.data) {
        // Convert server response to MediaItem format
        const mediaItems: MediaItem[] = [];
        response.data.forEach((group: any) => {
          if (group.main) {
            mediaItems.push({
              id: group.main.id,
              group_id: group.group_id,
              media_type: 'main',
              file_type: group.main.file_type,
              file_path: group.main.file_path,
              poster_path: group.main.poster_path,
              alt_text: group.main.alt_text,
              order: group.order
            });
          }
          if (group.secondary) {
            mediaItems.push({
              id: group.secondary.id,
              group_id: group.group_id,
              media_type: 'secondary',
              file_type: group.secondary.file_type,
              file_path: group.secondary.file_path,
              poster_path: group.secondary.poster_path,
              alt_text: group.secondary.alt_text,
              order: group.order
            });
          }
        });
        return mediaItems;
      }
    } catch (error) {
      console.error('Ошибка при загрузке медиа-элементов:', error);
    }
    return [];
  };

  // Initialize form data when service changes
  useEffect(() => {
    const initializeFormData = async () => {
      if (service) {
        const mediaItems = service.id ? await loadMediaItems(service.id) : [];
        setFormData({
          ...service,
          features: service.features || [],
          mediaItems: mediaItems
        });
      } else {
        setFormData({
          title: '',
          description: '',
          dark_background: false,
          features: [],
          mediaItems: []
        });
      }
      setActiveTab('basic');
    };

    initializeFormData();
  }, [service, open]);

  const saveFeaturesForService = async (serviceId: number, features: ServiceFeature[]) => {
    const isEdit = service && service.id;
    
    // Сначала удаляем все существующие функции для этой услуги (только при редактировании)
    if (isEdit) {
      try {
        // Получаем существующие функции
        const existingResponse = await get<{ status: string; data: any[] }>(`/api/media-services/${serviceId}/features`);
        if (existingResponse.status === 'success' && existingResponse.data) {
          // Удаляем каждую существующую функцию
          for (const existingFeature of existingResponse.data) {
            await del(`/api/media-services/${serviceId}/features/${existingFeature.id}`);
          }
        }
      } catch (error) {
        console.warn('Ошибка при удалении существующих функций:', error);
      }
    }
    
    // Создаем новые функции
    for (let i = 0; i < features.length; i++) {
      const feature = features[i];
      try {
        await post(`/api/media-services/${serviceId}/features`, {
          title: feature.title,
          description: feature.description,
          order: i + 1
        });
      } catch (error) {
        console.error(`Ошибка при сохранении функции "${feature.title}":`, error);
        throw error;
      }
    }
  };

  const handleSubmit = async () => {
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const isEdit = service && service.id;
      const url = isEdit 
        ? `${apiUrl}/api/media-services/${service.id}`
        : `${apiUrl}/api/media-services`;

      const data = isEdit
        ? await put<any>(url, {
            title: formData.title,
            description: formData.description,
            dark_background: formData.dark_background
          })
        : await post<any>(url, {
            title: formData.title,
            description: formData.description,
            dark_background: formData.dark_background
          });

      if (data.status === 'success') {
        const savedService = data.data;
        const serviceId = savedService.id;

        // Сохраняем функции, если они есть
        if (formData.features && formData.features.length > 0) {
          try {
            await saveFeaturesForService(serviceId, formData.features);
          } catch (featuresError) {
            console.error('Ошибка при сохранении функций:', featuresError);
            // Показываем предупреждение, но не прерываем процесс
            setError(`Блок услуги сохранён, но возникла ошибка при сохранении функций: ${featuresError instanceof Error ? featuresError.message : 'Неизвестная ошибка'}`);
            onSave();
            return; // Не закрываем диалог, чтобы пользователь мог попробовать снова
          }
        }

        // Медиа-элементы сохраняются напрямую через MediaUploadGroup
        // Здесь мы не сохраняем медиа, так как они должны загружаться отдельно

        // Перезагружаем медиа-элементы после сохранения, чтобы синхронизировать с сервером
        if (savedService.id) {
          try {
            const updatedMediaItems = await loadMediaItems(savedService.id);
            setFormData(prev => ({ ...prev, mediaItems: updatedMediaItems }));
          } catch (error) {
            console.error('Ошибка при перезагрузке медиа-элементов:', error);
          }
        }

        setSuccess(isEdit ? 'Блок услуги успешно обновлён' : 'Блок услуги успешно создан');
        onSave();
        setTimeout(() => {
          onOpenChange(false);
        }, 1500);
      } else {
        throw new Error(data.message || 'Ошибка при сохранении блока услуги');
      }
    } catch (err: any) {
      console.error('Ошибка при сохранении блока услуги:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Неизвестная ошибка';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleFeaturesChange = (features: ServiceFeature[]) => {
    setFormData(prev => ({ ...prev, features }));
  };

  const handleMediaChange = (mediaItems: MediaItem[]) => {
    console.log('ServiceBlockDialog: Updating media items:', mediaItems);
    setFormData(prev => ({ ...prev, mediaItems }));
  };

  const isEdit = service && service.id;

  return (
    <DndProviderWrapper>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Редактировать блок услуги' : 'Создать блок услуги'}
          </DialogTitle>
        </DialogHeader>

        {/* Auto-dismissing notifications */}
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

        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Основное
              </TabsTrigger>
              <TabsTrigger value="features" className="flex items-center gap-2">
                <List className="w-4 h-4" />
                Функции
              </TabsTrigger>
              <TabsTrigger value="media" className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Медиа
              </TabsTrigger>
            </TabsList>

            {/* Basic Information Tab */}
            <TabsContent value="basic" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Основная информация</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="service_title">Заголовок *</Label>
                    <Input
                      id="service_title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Введите заголовок блока услуги"
                      required
                      maxLength={255}
                    />
                    <p className="text-sm text-muted-foreground">
                      Заголовок блока услуги ({formData.title.length}/255)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="service_description">Описание</Label>
                    <Textarea
                      id="service_description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Введите описание блока услуги"
                      rows={4}
                      maxLength={1000}
                    />
                    <p className="text-sm text-muted-foreground">
                      Описание блока услуги ({formData.description.length}/1000)
                    </p>
                  </div>
                  
                </CardContent>
              </Card>
            </TabsContent>

            {/* Features Tab */}
            <TabsContent value="features" className="space-y-6">
              <ServiceFeaturesManager
                features={formData.features}
                onFeaturesChange={handleFeaturesChange}
                serviceId={service?.id}
              />
            </TabsContent>

            {/* Media Tab */}
            <TabsContent value="media" className="space-y-6">
              <ServiceMediaManager
                mediaItems={formData.mediaItems || []}
                onMediaChange={handleMediaChange}
                serviceId={service?.id}
              />
            </TabsContent>
          </Tabs>

          {/* Form Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Отмена
            </Button>
            <Button 
              type="button"
              onClick={handleSubmit}
              disabled={loading || !formData.title.trim()}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Сохранение...' : (isEdit ? 'Обновить блок' : 'Создать блок')}
            </Button>
          </div>
        </div>
        </DialogContent>
      </Dialog>
    </DndProviderWrapper>
  );
}