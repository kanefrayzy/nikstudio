"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Video, Upload, Trash2, Loader2 } from "lucide-react";
import { VideoUploadForm } from "./VideoUploadForm";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { getVideoUrl, formatFileSize, getVideoFormat } from "@/lib/media-utils";
import { fileUploadUtils } from "@/lib/file-upload-compatibility";
import apiClient from "@/lib/api";

interface HomeContent {
  id: number;
  hero_video_url?: string;
  hero_video_original_name?: string;
  hero_video_size?: number;
  formatted_video_size?: string;
  hero_fallback_image_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ApiResponse {
  success: boolean;
  data?: HomeContent;
  message?: string;
  errors?: Record<string, string[]>;
}

// Network error retry configuration
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 2000; // 2 seconds

export const AdminHeroVideoManager: React.FC = () => {
  const [currentVideo, setCurrentVideo] = useState<HomeContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Fetch current hero video data with retry logic
  const fetchCurrentVideo = useCallback(async (attempt = 1) => {
    try {
      setLoading(true);
      console.log(`[AdminHeroVideoManager] Fetching current video data (attempt ${attempt})`);
      
      // Debug: проверяем наличие токена
      const token = document.cookie.split(';').find(c => c.trim().startsWith('admin-token='));
      console.log(`[AdminHeroVideoManager] Token exists:`, !!token);

      const axiosResponse = await apiClient.get<ApiResponse>('/api/home');
      const response = axiosResponse.data;
      
      setCurrentVideo(response.data || null);
      console.log('[AdminHeroVideoManager] Successfully fetched current video data:', response.data);
    } catch (err: any) {
      console.error(`[AdminHeroVideoManager] Error fetching current video (attempt ${attempt}):`, {
        status: err.response?.status,
        statusText: err.response?.statusText,
        message: err.message,
        data: err.response?.data
      });

      // Retry logic for network errors
      if (attempt < MAX_RETRY_ATTEMPTS && 
        (err.code === 'ECONNABORTED' || err.code === 'ERR_NETWORK' || err.message?.includes('network'))) {
        console.log(`Retrying in ${RETRY_DELAY}ms...`);
        setTimeout(() => {
          fetchCurrentVideo(attempt + 1);
        }, RETRY_DELAY);
        return;
      }

      // Set error message based on error type
      let errorMessage = 'Ошибка при загрузке данных о текущем видео';
      if (err.code === 'ECONNABORTED' || err.code === 'ERR_NETWORK') {
        errorMessage = 'Ошибка сети. Проверьте подключение к интернету';
      } else if (err.message?.includes('timeout')) {
        errorMessage = 'Превышено время ожидания. Попробуйте позже';
      } else if (err.response?.status === 404) {
        // 404 - это нормально, просто нет видео
        setCurrentVideo(null);
        return;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Upload new hero video with progress tracking and retry logic
  const handleVideoUpload = async (file: File, _onProgress?: (progress: number) => void) => {
    setUploading(true);
    setError(null);
    setSuccess(null);
    setUploadProgress(0);

    try {
      // Log upload attempt
      console.log('[AdminHeroVideoManager] Starting video upload:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        timestamp: new Date().toISOString()
      });
      
      // Debug: проверяем наличие токена
      const token = document.cookie.split(';').find(c => c.trim().startsWith('admin-token='));
      console.log('[AdminHeroVideoManager] Token exists for upload:', !!token);

      // Use compatibility service to create FormData
      const formData = fileUploadUtils.createFormData();
      formData.append('hero_video', file);

      // Upload using apiClient with progress tracking
      const axiosResponse = await apiClient.post<ApiResponse>('/api/home/hero-video', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 300000, // 5 minutes timeout
      } as any);

      // apiClient.post возвращает полный axios response, нужно взять data
      const response = axiosResponse.data;
      
      console.log('[AdminHeroVideoManager] Upload response:', response);

      if (response.success) {
        setSuccess('Видео успешно загружено!');
        await fetchCurrentVideo();

        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errorMessage = response.message || 'Ошибка при загрузке видео';
        if (response.errors) {
          const validationErrors = Object.entries(response.errors)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('; ');
          setError(`${errorMessage}. ${validationErrors}`);
        } else {
          setError(errorMessage);
        }
      }
    } catch (err: any) {
      console.error('[AdminHeroVideoManager] Upload error:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        message: err.message,
        data: err.response?.data,
        headers: err.response?.headers
      });

      // Handle HTTP error status codes
      let errorMessage = 'Ошибка при загрузке видео';

      if (err.response?.status === 413) {
        errorMessage = 'Файл слишком большой. Максимальный размер: 50 MB';
      } else if (err.response?.status === 422) {
        const data = err.response.data;
        errorMessage = data.message || 'Неверный формат файла';
        if (data.errors) {
          const validationErrors = Object.entries(data.errors)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('; ');
          errorMessage = `${errorMessage}. ${validationErrors}`;
        }
      } else if (err.response?.status >= 500) {
        errorMessage = 'Ошибка сервера. Попробуйте позже';
      } else if (err.code === 'ECONNABORTED' || err.code === 'ERR_NETWORK') {
        errorMessage = 'Ошибка сети при загрузке видео. Проверьте подключение к интернету';
      } else if (err.message?.includes('timeout')) {
        errorMessage = 'Превышено время ожидания загрузки. Попробуйте позже';
      }

      setError(errorMessage);
      throw err;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Delete current hero video
  const handleVideoDelete = async () => {
    try {
      setDeleting(true);
      setError(null);
      setSuccess(null);

      console.log('[AdminHeroVideoManager] Starting video deletion');
      
      // Debug: проверяем наличие токена
      const token = document.cookie.split(';').find(c => c.trim().startsWith('admin-token='));
      console.log('[AdminHeroVideoManager] Token exists for delete:', !!token);

      const axiosResponse = await apiClient.delete<ApiResponse>('/api/home/hero-video');
      const response = axiosResponse.data;

      if (response.success) {
        setSuccess('Видео успешно удалено!');
        setCurrentVideo(null);
        setDeleteDialogOpen(false);

        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(response.message || 'Ошибка при удалении видео');
      }
    } catch (err: any) {
      console.error('[AdminHeroVideoManager] Delete error:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        message: err.message,
        data: err.response?.data
      });
      const errorMessage = err.response?.data?.message || 'Произошла ошибка при удалении видео';
      setError(errorMessage);
    } finally {
      setDeleting(false);
    }
  };



  // Clear messages after timeout
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Load initial data
  useEffect(() => {
    fetchCurrentVideo();
  }, [fetchCurrentVideo]);

  return (
    <div className="space-y-6">
      {/* Success/Error alerts */}
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Current Video Display */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Video className="w-5 h-5" />
                Текущее видео
              </CardTitle>
              <CardDescription>
                Управление видео для главной страницы
              </CardDescription>
            </div>
            {currentVideo?.hero_video_url && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Удалить
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Загрузка...</p>
            </div>
          ) : currentVideo?.hero_video_url ? (
            <div className="space-y-4">
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden group relative">
                <video
                  src={getVideoUrl(currentVideo.hero_video_url)}
                  className="w-full h-full object-cover group-hover:controls"
                  preload="metadata"
                  onMouseEnter={(e) => {
                    e.currentTarget.setAttribute('controls', 'true');
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.removeAttribute('controls');
                  }}
                >
                  Ваш браузер не поддерживает воспроизведение видео.
                </video>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  <div className="bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm">
                    Наведите курсор для управления воспроизведением
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Имя файла:</span>
                  <p className="text-gray-600 break-all">{currentVideo.hero_video_original_name || 'Неизвестно'}</p>
                </div>
                <div>
                  <span className="font-medium">Размер файла:</span>
                  <p className="text-gray-600">
                    {currentVideo.formatted_video_size ||
                      (currentVideo.hero_video_size ? formatFileSize(currentVideo.hero_video_size) : 'Неизвестно')}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Формат видео:</span>
                  <p className="text-gray-600">{getVideoFormat(currentVideo.hero_video_original_name)}</p>
                </div>
                <div>
                  <span className="font-medium">Статус:</span>
                  <p className="text-gray-600">{currentVideo.is_active ? 'Активно' : 'Неактивно'}</p>
                </div>
                <div>
                  <span className="font-medium">Дата загрузки:</span>
                  <p className="text-gray-600">
                    {new Date(currentVideo.created_at).toLocaleDateString('ru-RU', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Последнее обновление:</span>
                  <p className="text-gray-600">
                    {new Date(currentVideo.updated_at).toLocaleDateString('ru-RU', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Видео не загружено</p>
              <p className="text-sm text-gray-500 mt-1">
                Загрузите видео, чтобы оно отображалось на главной странице
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Video Upload Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            {currentVideo?.hero_video_url ? 'Заменить видео' : 'Загрузить видео'}
          </CardTitle>
          <CardDescription>
            Загрузите новое видео для главной страницы. Максимальный размер: 50 MB
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VideoUploadForm
            onUpload={handleVideoUpload}
            uploading={uploading}
            uploadProgress={uploadProgress}
          />
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Подтвердите удаление</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Видео будет удалено навсегда.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleVideoDelete} disabled={deleting}>
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Удаление...
                </>
              ) : (
                'Удалить'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};