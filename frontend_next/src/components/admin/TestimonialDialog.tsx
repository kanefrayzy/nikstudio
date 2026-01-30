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

interface Testimonial {
  id: number;
  company: string;
  quote: string;
  description: string;
  image_path: string;
  order: number;
}

interface TestimonialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  testimonial?: Testimonial | null;
  onSave: () => void;
}

interface FormData {
  company: string;
  quote: string;
  description: string;
  image: File | null;
}

const validateFileSize = (file: File, _type: 'image'): boolean => {
  const maxSize = 2 * 1024 * 1024; // 2MB
  return file.size <= maxSize;
};

export function TestimonialDialog({ 
  open, 
  onOpenChange, 
  testimonial, 
  onSave 
}: TestimonialDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState<FormData>({
    company: '',
    quote: '',
    description: '',
    image: null
  });
  
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [currentImagePath, setCurrentImagePath] = useState<string | null>(null);

  // Reset form when dialog opens/closes or testimonial changes
  useEffect(() => {
    if (open) {
      if (testimonial) {
        // Editing existing testimonial
        setFormData({
          company: testimonial.company,
          quote: testimonial.quote,
          description: testimonial.description,
          image: null
        });
        setCurrentImagePath(testimonial.image_path);
        setImagePreview(null);
      } else {
        // Creating new testimonial
        setFormData({
          company: '',
          quote: '',
          description: '',
          image: null
        });
        setCurrentImagePath(null);
        setImagePreview(null);
      }
      setError(null);
      setFieldErrors({});
    }
  }, [open, testimonial]);

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
    
    // Client-side validation
    const errors: Record<string, string> = {};
    
    if (!formData.company.trim()) {
      errors.company = 'Название компании обязательно для заполнения';
    } else if (formData.company.length > 255) {
      errors.company = 'Название компании не должно превышать 255 символов';
    }
    
    if (!formData.quote.trim()) {
      errors.quote = 'Цитата обязательна для заполнения';
    } else if (formData.quote.length > 500) {
      errors.quote = 'Цитата не должна превышать 500 символов';
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Описание обязательно для заполнения';
    } else if (formData.description.length > 1000) {
      errors.description = 'Описание не должно превышать 1000 символов';
    }
    
    // For new testimonials, image is required
    if (!testimonial && !formData.image) {
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
      
      formDataToSend.append('company', formData.company.trim());
      formDataToSend.append('quote', formData.quote.trim());
      formDataToSend.append('description', formData.description.trim());
      
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }

      const url = testimonial 
        ? `${apiUrl}/api/admin/media-testimonials/${testimonial.id}`
        : `${apiUrl}/api/admin/media-testimonials`;
      
      const _method = testimonial ? 'PUT' : 'POST';
      
      // For PUT requests, we need to add _method field for Laravel
      if (testimonial) {
        formDataToSend.append('_method', 'PUT');
      }

      const response = await apiClient.post<{ status: string; message?: string; data?: any }>(url, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = response.data;

      if (data.status === 'success') {
        onSave();
        onOpenChange(false);
      } else {
        throw new Error(data.message || 'Ошибка при сохранении отзыва');
      }
    } catch (err: any) {
      if (err.response?.status === 413) {
        setError('Размер изображения превышает 2MB');
        return;
      }
      
      if (err.response?.data?.errors) {
        setFieldErrors(err.response.data.errors);
        return;
      }
      console.error('Ошибка при сохранении отзыва:', err);
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (imagePath: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    // Если путь уже содержит /storage/, не добавляем его снова
    if (imagePath.startsWith('/storage/')) {
      return `${apiUrl}${imagePath}`;
    }
    return `${apiUrl}/storage/${imagePath}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {testimonial ? 'Редактировать отзыв' : 'Добавить отзыв'}
          </DialogTitle>
          <DialogDescription>
            {testimonial 
              ? 'Измените данные отзыва и сохраните изменения'
              : 'Заполните все поля для создания нового отзыва'
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
          {/* Company Name */}
          <div className="space-y-2">
            <Label htmlFor="company">Название компании *</Label>
            <Input
              id="company"
              value={formData.company}
              onChange={(e) => handleInputChange('company', e.target.value)}
              placeholder="Введите название компании"
              maxLength={255}
              className={fieldErrors.company ? 'border-red-500' : ''}
            />
            {fieldErrors.company && (
              <p className="text-sm text-red-500">{fieldErrors.company}</p>
            )}
            <p className="text-sm text-muted-foreground">
              {formData.company.length}/255 символов
            </p>
          </div>

          {/* Quote */}
          <div className="space-y-2">
            <Label htmlFor="quote">Цитата *</Label>
            <Textarea
              id="quote"
              value={formData.quote}
              onChange={(e) => handleInputChange('quote', e.target.value)}
              placeholder="Введите цитату клиента"
              maxLength={500}
              rows={3}
              className={fieldErrors.quote ? 'border-red-500' : ''}
            />
            {fieldErrors.quote && (
              <p className="text-sm text-red-500">{fieldErrors.quote}</p>
            )}
            <p className="text-sm text-muted-foreground">
              {formData.quote.length}/500 символов
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Описание *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Введите подробное описание отзыва"
              maxLength={1000}
              rows={4}
              className={fieldErrors.description ? 'border-red-500' : ''}
            />
            {fieldErrors.description && (
              <p className="text-sm text-red-500">{fieldErrors.description}</p>
            )}
            <p className="text-sm text-muted-foreground">
              {formData.description.length}/1000 символов
            </p>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label htmlFor="image">
              Изображение {!testimonial && '*'}
            </Label>
            
            {/* Current or preview image */}
            {(imagePreview || currentImagePath) && (
              <div className="relative inline-block">
                <img
                  src={imagePreview || (currentImagePath ? getImageUrl(currentImagePath) : '')}
                  alt="Предварительный просмотр"
                  className="w-32 h-32 object-cover rounded-lg border"
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
              {loading ? 'Сохранение...' : (testimonial ? 'Сохранить изменения' : 'Создать отзыв')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}