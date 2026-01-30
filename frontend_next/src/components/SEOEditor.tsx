'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, X, Eye, EyeOff } from 'lucide-react';
import SEOPreview from './SEOPreview';
import { validateSEOFields, generateSEOPreview } from '@/lib/seo-helpers';
import { SEOSettings } from '@/lib/seo-metadata';
import { SocialMediaImageOptimizer } from '@/lib/social-media-optimization';

export interface SEOData {
  seo_title?: string;
  seo_description?: string;
  seo_image?: string;
}

interface SEOEditorProps {
  initialData: SEOData;
  contentTitle: string;
  contentDescription: string;
  contentUrl: string;
  globalSettings?: SEOSettings | null;
  onSave: (seoData: SEOData) => void;
  onImageUpload?: (file: File) => Promise<string>;
  showPreview?: boolean;
  disabled?: boolean;
}

/**
 * SEO Editor Component
 * Provides interface for editing SEO metadata with live preview
 */
export default function SEOEditor({
  initialData,
  contentTitle,
  contentDescription,
  contentUrl,
  globalSettings,
  onSave,
  onImageUpload,
  showPreview = true,
  disabled = false
}: SEOEditorProps) {
  const [seoData, setSeoData] = useState<SEOData>(initialData);
  const [showPreviewPanel, setShowPreviewPanel] = useState(showPreview);
  const [_imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Generate preview data
  const previewData = generateSEOPreview({
    seo_title: seoData.seo_title,
    seo_description: seoData.seo_description,
    title: contentTitle,
    description: contentDescription,
    globalSettings
  });

  // Handle form changes
  const handleChange = (field: keyof SEOData, value: string) => {
    const newData = { ...seoData, [field]: value };
    setSeoData(newData);
    
    // Validate fields
    const validation = validateSEOFields(newData);
    setErrors(validation.errors);
  };

  // Handle image upload
  const handleImageUpload = async (file: File) => {
    if (!onImageUpload) return;

    setUploading(true);
    setErrors([]);

    try {
      // Validate image for different platforms
      const platforms = ['openGraph', 'twitter', 'facebook'] as const;
      const validationErrors: string[] = [];

      for (const platform of platforms) {
        const validation = SocialMediaImageOptimizer.validateImageForPlatform(file, platform);
        if (!validation.isValid) {
          validationErrors.push(...validation.errors);
        }
      }

      // Check image dimensions
      const dimensionValidation = await SocialMediaImageOptimizer.validateImageDimensions(file, 'openGraph');
      if (!dimensionValidation.isValid) {
        validationErrors.push(...dimensionValidation.errors);
      }

      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        return;
      }

      // Upload image
      const imageUrl = await onImageUpload(file);
      
      setSeoData(prev => ({ ...prev, seo_image: imageUrl }));
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      
    } catch (error) {
      setErrors(['Ошибка при загрузке изображения']);
      console.error('Image upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  // Handle image removal
  const handleImageRemove = () => {
    setSeoData(prev => ({ ...prev, seo_image: undefined }));
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
  };

  // Handle save
  const handleSave = () => {
    const validation = validateSEOFields(seoData);
    if (validation.isValid) {
      onSave(seoData);
    } else {
      setErrors(validation.errors);
    }
  };

  // Cleanup image preview on unmount
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  return (
    <div className="space-y-6">
      <Tabs value="editor" onValueChange={() => {}} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="editor">Редактор SEO</TabsTrigger>
          <TabsTrigger value="preview" disabled={!showPreview}>
            Предварительный просмотр
          </TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>SEO Метаданные</CardTitle>
                {showPreview && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPreviewPanel(!showPreviewPanel)}
                  >
                    {showPreviewPanel ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {showPreviewPanel ? 'Скрыть превью' : 'Показать превью'}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* SEO Title */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="seo_title">SEO Заголовок</Label>
                  <Badge variant={previewData.titleWarning ? 'destructive' : 'default'}>
                    {previewData.titleLength}/60
                  </Badge>
                </div>
                <Input
                  id="seo_title"
                  value={seoData.seo_title || ''}
                  onChange={(e) => handleChange('seo_title', e.target.value)}
                  placeholder={`Оставьте пустым для автогенерации: "${contentTitle} | ${globalSettings?.site_title || 'NIK Studio'}"`}
                  disabled={disabled}
                  className={previewData.titleWarning ? 'border-red-500' : ''}
                />
                <p className="text-sm text-gray-600">
                  Эффективный заголовок: {previewData.title}
                </p>
              </div>

              {/* SEO Description */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="seo_description">SEO Описание</Label>
                  <Badge variant={previewData.descriptionWarning ? 'destructive' : 'default'}>
                    {previewData.descriptionLength}/160
                  </Badge>
                </div>
                <Textarea
                  id="seo_description"
                  value={seoData.seo_description || ''}
                  onChange={(e) => handleChange('seo_description', e.target.value)}
                  placeholder={`Оставьте пустым для автогенерации: "${contentDescription || globalSettings?.site_description || 'Комплексные решения для промышленных компаний'}"`}
                  disabled={disabled}
                  rows={3}
                  className={previewData.descriptionWarning ? 'border-red-500' : ''}
                />
                <p className="text-sm text-gray-600">
                  Эффективное описание: {previewData.description}
                </p>
              </div>

              {/* SEO Image */}
              <div className="space-y-2">
                <Label>SEO Изображение</Label>
                <div className="space-y-4">
                  {(seoData.seo_image || imagePreview) && (
                    <div className="relative inline-block">
                      <img
                        src={imagePreview || seoData.seo_image}
                        alt="SEO изображение"
                        className="w-32 h-16 object-cover rounded border"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 w-6 h-6 p-0"
                        onClick={handleImageRemove}
                        disabled={disabled}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                  
                  {onImageUpload && (
                    <div>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file);
                        }}
                        disabled={disabled || uploading}
                        className="hidden"
                        id="seo-image-upload"
                      />
                      <Label
                        htmlFor="seo-image-upload"
                        className="inline-flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
                      >
                        <Upload className="w-4 h-4" />
                        {uploading ? 'Загрузка...' : 'Загрузить изображение'}
                      </Label>
                    </div>
                  )}
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Рекомендуемые размеры:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>Open Graph: 1200×630px (соотношение 1.91:1)</li>
                      <li>Twitter Card: 1200×675px (соотношение 16:9)</li>
                      <li>Форматы: JPG, PNG, WebP</li>
                      <li>Максимальный размер: 8MB</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Error Messages */}
              {errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-800 mb-2">Ошибки валидации:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Save Button */}
              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={disabled || errors.length > 0}>
                  Сохранить SEO данные
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview">
          {showPreview && (
            <SEOPreview
              title={previewData.title}
              description={previewData.description}
              image={seoData.seo_image}
              url={contentUrl}
              globalSettings={globalSettings}
              showPlatforms={['google', 'facebook', 'twitter', 'linkedin']}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}