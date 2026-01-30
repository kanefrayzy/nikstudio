'use client';

import React from 'react';
import { CompatibleImage } from './CompatibleImage';
import { CompatibleVideo } from './CompatibleVideo';
import { MediaCompatibilityProvider, useMediaCompatibility } from './MediaCompatibilityProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

const MediaSupportInfo: React.FC = () => {
  const { support, isLoading, error } = useMediaCompatibility();

  if (isLoading) {
    return <div className="animate-pulse bg-gray-200 h-32 rounded"></div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">Ошибка: {error}</div>;
  }

  if (!support) {
    return <div className="text-gray-500 p-4">Информация о поддержке недоступна</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Поддержка медиа-форматов</CardTitle>
        <CardDescription>
          Информация о поддерживаемых форматах в вашем браузере
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold mb-2">Изображения</h4>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant={support.webp ? "default" : "secondary"}>
                  WebP: {support.webp ? "✓" : "✗"}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={support.avif ? "default" : "secondary"}>
                  AVIF: {support.avif ? "✓" : "✗"}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="default">JPEG: ✓</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="default">PNG: ✓</Badge>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Видео</h4>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant={support.mp4 ? "default" : "secondary"}>
                  MP4: {support.mp4 ? "✓" : "✗"}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={support.webm ? "default" : "secondary"}>
                  WebM: {support.webm ? "✓" : "✗"}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={support.ogg ? "default" : "secondary"}>
                  OGG: {support.ogg ? "✓" : "✗"}
                </Badge>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <h4 className="font-semibold mb-2">Кодеки</h4>
          <div className="grid grid-cols-2 gap-2">
            <Badge variant={support.h264 ? "default" : "secondary"}>
              H.264: {support.h264 ? "✓" : "✗"}
            </Badge>
            <Badge variant={support.vp8 ? "default" : "secondary"}>
              VP8: {support.vp8 ? "✓" : "✗"}
            </Badge>
            <Badge variant={support.vp9 ? "default" : "secondary"}>
              VP9: {support.vp9 ? "✓" : "✗"}
            </Badge>
            <Badge variant={support.av1 ? "default" : "secondary"}>
              AV1: {support.av1 ? "✓" : "✗"}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const ImageCompatibilityDemo: React.FC = () => {
  const imageSources = {
    webp: '/demo/sample-image.webp',
    avif: '/demo/sample-image.avif',
    jpeg: '/demo/sample-image.jpg',
    png: '/demo/sample-image.png'
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Совместимость изображений</CardTitle>
        <CardDescription>
          Автоматический выбор оптимального формата изображения
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold mb-2">Одиночное изображение</h4>
            <CompatibleImage
              src="/demo/single-image.jpg"
              alt="Демо изображение"
              className="w-full h-32 object-cover rounded"
            />
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Множественные форматы</h4>
            <CompatibleImage
              src={imageSources}
              alt="Демо изображение с множественными форматами"
              className="w-full h-32 object-cover rounded"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const VideoCompatibilityDemo: React.FC = () => {
  const videoSources = {
    webm: '/demo/sample-video.webm',
    mp4: '/demo/sample-video.mp4',
    ogg: '/demo/sample-video.ogg'
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Совместимость видео</CardTitle>
        <CardDescription>
          Автоматический выбор оптимального формата видео
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold mb-2">Одиночное видео</h4>
            <CompatibleVideo
              src="/demo/single-video.mp4"
              poster="/demo/video-poster.jpg"
              className="w-full h-32 rounded"
              controls
              muted
            />
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Множественные форматы</h4>
            <CompatibleVideo
              src={videoSources}
              poster="/demo/video-poster.jpg"
              className="w-full h-32 rounded"
              controls
              muted
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const MediaCompatibilityDemo: React.FC = () => {
  return (
    <MediaCompatibilityProvider>
      <div className="container mx-auto p-6 space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Система совместимости медиа-форматов</h1>
          <p className="text-gray-600">
            Демонстрация автоматического определения и использования оптимальных медиа-форматов
          </p>
        </div>
        
        <MediaSupportInfo />
        <ImageCompatibilityDemo />
        <VideoCompatibilityDemo />
        
        <Card>
          <CardHeader>
            <CardTitle>Как это работает</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold">Определение поддержки форматов</h4>
                <p className="text-gray-600">
                  Система автоматически определяет, какие форматы изображений и видео поддерживает ваш браузер.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold">Автоматический выбор</h4>
                <p className="text-gray-600">
                  При загрузке медиа выбирается наиболее подходящий формат: современные форматы (WebP, AVIF) 
                  для поддерживающих браузеров, классические (JPEG, PNG) для остальных.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold">Обработка ошибок</h4>
                <p className="text-gray-600">
                  Если загрузка медиа не удалась, система автоматически пробует альтернативные форматы 
                  до тех пор, пока не найдет рабочий вариант.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MediaCompatibilityProvider>
  );
};