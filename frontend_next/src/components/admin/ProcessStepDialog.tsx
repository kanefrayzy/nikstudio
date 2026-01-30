'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import apiClient from '@/lib/api';
import { 
  Save, 
  AlertCircle, 
  Upload,
  X,
  Image as ImageIcon
} from "lucide-react";

interface ProcessStep {
  id: number;
  step_number: string;
  title: string;
  subtitle: string;
  image_path: string;
  description_left: string;
  description_right: string;
  order: number;
}

interface ProcessStepDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  processStep?: ProcessStep | null;
  onSave: () => void;
}

interface FormData {
  step_number: string;
  title: string;
  subtitle: string;
  description_left: string;
  description_right: string;
  image: File | null;
}

const validateFileSize = (file: File, _type: 'image'): boolean => {
  const maxSize = 2 * 1024 * 1024; // 2MB
  return file.size <= maxSize;
};

export function ProcessStepDialog({ 
  open, 
  onOpenChange, 
  processStep, 
  onSave 
}: ProcessStepDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState<FormData>({
    step_number: '',
    title: '',
    subtitle: '',
    description_left: '',
    description_right: '',
    image: null
  });
  
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [currentImagePath, setCurrentImagePath] = useState<string | null>(null);

  // Reset form when dialog opens/closes or processStep changes
  useEffect(() => {
    if (open) {
      if (processStep) {
        // Editing existing process step
        setFormData({
          step_number: processStep.step_number,
          title: processStep.title,
          subtitle: processStep.subtitle,
          description_left: processStep.description_left,
          description_right: processStep.description_right,
          image: null
        });
        setCurrentImagePath(processStep.image_path);
        setImagePreview(null);
      } else {
        // Creating new process step
        setFormData({
          step_number: '',
          title: '',
          subtitle: '',
          description_left: '',
          description_right: '',
          image: null
        });
        setCurrentImagePath(null);
        setImagePreview(null);
      }
      setError(null);
      setFieldErrors({});
    }
  }, [open, processStep]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Файл должен быть изображением');
      return;
    }

    // Validate file format
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Изображение должно быть в формате: jpg, jpeg, png, webp');
      return;
    }

    // Validate file size
    if (!validateFileSize(file, 'image')) {
      setError('Размер изображения не должен превышать 2MB');
      return;
    }

    setFormData(prev => ({ ...prev, image: file }));
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, image: null }));
    setImagePreview(null);
    setCurrentImagePath(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('[ProcessStepDialog] ===== handleSubmit STARTED =====');
    console.log('[ProcessStepDialog] processStep:', processStep);
    console.log('[ProcessStepDialog] formData:', formData);
    
    // Client-side validation
    const errors: Record<string, string> = {};
    
    if (!formData.step_number.trim()) {
      errors.step_number = 'Номер шага обязателен для заполнения';
    } else if (formData.step_number.length > 10) {
      errors.step_number = 'Номер шага не должен превышать 10 символов';
    }
    
    if (!formData.title.trim()) {
      errors.title = 'Заголовок обязателен для заполнения';
    } else if (formData.title.length > 255) {
      errors.title = 'Заголовок не должен превышать 255 символов';
    }
    
    if (!formData.subtitle.trim()) {
      errors.subtitle = 'Подзаголовок обязателен для заполнения';
    } else if (formData.subtitle.length > 255) {
      errors.subtitle = 'Подзаголовок не должен превышать 255 символов';
    }
    
    if (!formData.description_left.trim()) {
      errors.description_left = 'Левое описание обязательно для заполнения';
    } else if (formData.description_left.length > 1000) {
      errors.description_left = 'Левое описание не должно превышать 1000 символов';
    }
    
    if (!formData.description_right.trim()) {
      errors.description_right = 'Правое описание обязательно для заполнения';
    } else if (formData.description_right.length > 1000) {
      errors.description_right = 'Правое описание не должно превышать 1000 символов';
    }
    
    // For new process steps, image is required
    if (!processStep && !formData.image) {
      errors.image = 'Изображение обязательно для загрузки';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setFieldErrors({});

      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const formDataToSend = new FormData();
      
      formDataToSend.append('step_number', formData.step_number.trim());
      formDataToSend.append('title', formData.title.trim());
      formDataToSend.append('subtitle', formData.subtitle.trim());
      formDataToSend.append('description_left', formData.description_left.trim());
      formDataToSend.append('description_right', formData.description_right.trim());
      
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }

      const url = processStep 
        ? `${apiUrl}/api/admin/media-process-steps/${processStep.id}`
        : `${apiUrl}/api/admin/media-process-steps`;
      
      // For PUT requests, we need to add _method field for Laravel
      if (processStep) {
        formDataToSend.append('_method', 'PUT');
      }

      // Логирование для отладки
      console.log('[ProcessStepDialog] URL:', url);
      console.log('[ProcessStepDialog] apiClient:', apiClient);
      console.log('[ProcessStepDialog] Cookies:', document.cookie);
      console.log('[ProcessStepDialog] FormData entries:', Array.from(formDataToSend.entries()).map(([k, v]) => [k, v instanceof File ? `File: ${v.name}` : v]));

      const response = await apiClient.post<{ success: boolean; message?: string; data?: any }>(url, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('[ProcessStepDialog] Response:', response);

      const data = response.data;

      if (data.success) {
        onSave();
        onOpenChange(false);
      } else {
        throw new Error(data.message || 'Ошибка при сохранении шага процесса');
      }
    } catch (err: any) {
      console.error('Ошибка при сохранении шага процесса:', err);
      
      if (err.response?.status === 413) {
        setError('Размер изображения превышает 2MB');
        return;
      }
      
      if (err.response?.data?.errors) {
        setFieldErrors(err.response.data.errors);
        return;
      }
      
      setError(err.response?.data?.message || err.message || 'Неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (imagePath: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    return `${apiUrl}/storage/${imagePath}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {processStep ? 'Редактировать шаг процесса' : 'Добавить шаг процесса'}
          </DialogTitle>
          <DialogDescription>
            {processStep 
              ? 'Измените данные шага процесса и сохраните изменения'
              : 'Заполните все поля для создания нового шага процесса'
            }
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step Number and Title Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Step Number */}
            <div className="space-y-2">
              <Label htmlFor="step_number">Номер шага *</Label>
              <Input
                id="step_number"
                value={formData.step_number}
                onChange={(e) => handleInputChange('step_number', e.target.value)}
                placeholder="01"
                maxLength={10}
                className={fieldErrors.step_number ? 'border-red-500' : ''}
              />
              {fieldErrors.step_number && (
                <p className="text-sm text-red-500">{fieldErrors.step_number}</p>
              )}
              <p className="text-sm text-muted-foreground">
                {formData.step_number.length}/10 символов
              </p>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Заголовок *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Введите заголовок шага"
                maxLength={255}
                className={fieldErrors.title ? 'border-red-500' : ''}
              />
              {fieldErrors.title && (
                <p className="text-sm text-red-500">{fieldErrors.title}</p>
              )}
              <p className="text-sm text-muted-foreground">
                {formData.title.length}/255 символов
              </p>
            </div>
          </div>

          {/* Subtitle */}
          <div className="space-y-2">
            <Label htmlFor="subtitle">Подзаголовок *</Label>
            <Input
              id="subtitle"
              value={formData.subtitle}
              onChange={(e) => handleInputChange('subtitle', e.target.value)}
              placeholder="Введите подзаголовок шага"
              maxLength={255}
              className={fieldErrors.subtitle ? 'border-red-500' : ''}
            />
            {fieldErrors.subtitle && (
              <p className="text-sm text-red-500">{fieldErrors.subtitle}</p>
            )}
            <p className="text-sm text-muted-foreground">
              {formData.subtitle.length}/255 символов
            </p>
          </div>

          {/* Dual Description Areas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Description */}
            <div className="space-y-2">
              <Label htmlFor="description_left">Левое описание *</Label>
              <Textarea
                id="description_left"
                value={formData.description_left}
                onChange={(e) => handleInputChange('description_left', e.target.value)}
                placeholder="Введите описание для левой части"
                maxLength={1000}
                rows={6}
                className={fieldErrors.description_left ? 'border-red-500' : ''}
              />
              {fieldErrors.description_left && (
                <p className="text-sm text-red-500">{fieldErrors.description_left}</p>
              )}
              <p className="text-sm text-muted-foreground">
                {formData.description_left.length}/1000 символов
              </p>
            </div>

            {/* Right Description */}
            <div className="space-y-2">
              <Label htmlFor="description_right">Правое описание *</Label>
              <Textarea
                id="description_right"
                value={formData.description_right}
                onChange={(e) => handleInputChange('description_right', e.target.value)}
                placeholder="Введите описание для правой части"
                maxLength={1000}
                rows={6}
                className={fieldErrors.description_right ? 'border-red-500' : ''}
              />
              {fieldErrors.description_right && (
                <p className="text-sm text-red-500">{fieldErrors.description_right}</p>
              )}
              <p className="text-sm text-muted-foreground">
                {formData.description_right.length}/1000 символов
              </p>
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label htmlFor="image">
              Изображение {!processStep && '*'}
            </Label>
            
            {/* Current or preview image */}
            {(imagePreview || currentImagePath) && (
              <div className="relative inline-block">
                <img
                  src={imagePreview || (currentImagePath ? getImageUrl(currentImagePath) : '')}
                  alt="Предварительный просмотр"
                  className="w-48 h-32 object-cover rounded-lg border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 h-6 w-6 p-0"
                  onClick={removeImage}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            )}
            
            {/* Upload button */}
            {!imagePreview && !currentImagePath && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-600 mb-2">
                  Перетащите изображение сюда или нажмите для выбора
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  Поддерживаемые форматы: JPG, PNG, WebP (макс. 2MB)
                </p>
                <Button type="button" variant="outline" asChild>
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <Upload className="w-4 h-4 mr-2" />
                    Выбрать файл
                  </label>
                </Button>
              </div>
            )}
            
            {/* Change image button */}
            {(imagePreview || currentImagePath) && (
              <Button type="button" variant="outline" asChild>
                <label htmlFor="image-upload" className="cursor-pointer">
                  <Upload className="w-4 h-4 mr-2" />
                  Изменить изображение
                </label>
              </Button>
            )}
            
            <input
              id="image-upload"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleImageChange}
              className="hidden"
            />
            
            {fieldErrors.image && (
              <p className="text-sm text-red-500">{fieldErrors.image}</p>
            )}
            
            <p className="text-sm text-muted-foreground">
              Максимальный размер файла: 2MB. Форматы: JPG, PNG, WebP
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Сохранение...' : (processStep ? 'Сохранить изменения' : 'Создать шаг')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}