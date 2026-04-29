"use client"

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Trash2, Upload, Images } from "lucide-react";
import {
  uploadHomepageImage,
  getContentValue,
  type HomepageContent,
} from "@/lib/homepage-content";

interface GalleryPhoto {
  src: string;
  alt: string;
}

interface GalleryBoxSectionEditorProps {
  content: HomepageContent[];
  onChange: (key: string, value: string) => void;
}

function getApiImageUrl(src: string): string {
  if (!src) return '';
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('/')) return src;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
  return `${apiUrl}/storage/${src}`;
}

export const GalleryBoxSectionEditor: React.FC<GalleryBoxSectionEditorProps> = ({
  content,
  onChange,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Parse current photos from JSON stored in content_value
  const photosJson = getContentValue(content, 'gallery_box_photos', '[]');
  let photos: GalleryPhoto[] = [];
  try {
    photos = JSON.parse(photosJson);
    if (!Array.isArray(photos)) photos = [];
  } catch {
    photos = [];
  }

  const title = getContentValue(content, 'gallery_box_title', 'Наши работы в кадре');
  const description = getContentValue(content, 'gallery_box_description', 'Подборка фотографий из реализованных проектов. Нажмите, чтобы развернуть.');

  const savePhotos = useCallback((updated: GalleryPhoto[]) => {
    onChange('gallery_box_photos', JSON.stringify(updated));
  }, [onChange]);

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setIsUploading(true);
    try {
      const path = await uploadHomepageImage(file);
      const newPhoto: GalleryPhoto = { src: path, alt: file.name.replace(/\.[^.]+$/, '') };
      savePhotos([...photos, newPhoto]);
    } catch (err: any) {
      setUploadError(err?.message || 'Ошибка загрузки');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  }, [photos, savePhotos]);

  const handleDelete = useCallback((index: number) => {
    const updated = photos.filter((_, i) => i !== index);
    savePhotos(updated);
  }, [photos, savePhotos]);

  const handleAltChange = useCallback((index: number, alt: string) => {
    const updated = photos.map((p, i) => i === index ? { ...p, alt } : p);
    savePhotos(updated);
  }, [photos, savePhotos]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Images className="w-5 h-5" />
            Бокс с галереей — настройки
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="gallery_box_title">Заголовок</Label>
            <Input
              id="gallery_box_title"
              value={title}
              onChange={(e) => onChange('gallery_box_title', e.target.value)}
              placeholder="Наши работы в кадре"
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="gallery_box_description">Описание</Label>
            <Textarea
              id="gallery_box_description"
              value={description}
              onChange={(e) => onChange('gallery_box_description', e.target.value)}
              placeholder="Подборка фотографий..."
              rows={2}
              className="mt-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Photos */}
      <Card>
        <CardHeader>
          <CardTitle>Фотографии ({photos.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload button */}
          <div>
            <label
              htmlFor="gallery-upload"
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed cursor-pointer transition-colors
                ${isUploading
                  ? 'border-gray-300 bg-gray-50 text-gray-400 pointer-events-none'
                  : 'border-blue-400 bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {isUploading ? 'Загрузка...' : 'Добавить фото'}
            </label>
            <input
              id="gallery-upload"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={handleUpload}
              disabled={isUploading}
            />
            {uploadError && (
              <p className="mt-2 text-sm text-red-600">{uploadError}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">JPG, PNG, WEBP — до 2 МБ</p>
          </div>

          {/* Photo grid */}
          {photos.length === 0 ? (
            <div className="text-center py-10 text-gray-400 border rounded-lg">
              Фотографий пока нет. Загрузите первую фотографию.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((photo, idx) => (
                <div key={idx} className="flex flex-col gap-2 group relative">
                  <div className="relative aspect-square rounded-lg overflow-hidden border bg-gray-100">
                    <Image
                      src={getApiImageUrl(photo.src)}
                      alt={photo.alt || `Фото ${idx + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, 25vw"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 w-7 h-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDelete(idx)}
                      title="Удалить фото"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <Input
                    value={photo.alt}
                    onChange={(e) => handleAltChange(idx, e.target.value)}
                    placeholder={`Alt текст для фото ${idx + 1}`}
                    className="text-xs h-7"
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
