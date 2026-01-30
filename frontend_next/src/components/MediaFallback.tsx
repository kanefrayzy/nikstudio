'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ImageOff, Video, AlertTriangle } from 'lucide-react';

interface MediaFallbackProps {
  src: string;
  alt: string;
  type: 'image' | 'video';
  width?: number;
  height?: number;
  className?: string;
  poster?: string;
  fill?: boolean;
}

export const MediaFallback: React.FC<MediaFallbackProps> = ({
  src,
  alt,
  type,
  width,
  height,
  className = '',
  poster,
  fill = false
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  // Fallback UI для поврежденных медиа
  const FallbackContent = () => (
    <div className={`flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 ${className}`}>
      <div className="text-center p-4">
        {type === 'image' ? (
          <ImageOff className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        ) : (
          <Video className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        )}
        <p className="text-sm text-gray-500">
          {type === 'image' ? 'Изображение недоступно' : 'Видео недоступно'}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {alt}
        </p>
      </div>
    </div>
  );

  // Loading placeholder
  const LoadingContent = () => (
    <div className={`flex items-center justify-center bg-gray-50 animate-pulse ${className}`}>
      <div className="text-center p-4">
        {type === 'image' ? (
          <ImageOff className="w-6 h-6 text-gray-300 mx-auto mb-2" />
        ) : (
          <Video className="w-6 h-6 text-gray-300 mx-auto mb-2" />
        )}
        <p className="text-xs text-gray-400">Загрузка...</p>
      </div>
    </div>
  );

  if (hasError) {
    return <FallbackContent />;
  }

  if (type === 'image') {
    return (
      <>
        {isLoading && <LoadingContent />}
        <Image
          src={src}
          alt={alt}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          fill={fill}
          className={`${className} ${isLoading ? 'hidden' : ''}`}
          onError={handleError}
          onLoad={handleLoad}
          onLoadingComplete={handleLoad}
        />
      </>
    );
  }

  if (type === 'video') {
    return (
      <>
        {isLoading && <LoadingContent />}
        <video
          src={src}
          poster={poster}
          className={`${className} ${isLoading ? 'hidden' : ''}`}
          controls
          controlsList="nodownload"
          preload="metadata"
          onError={handleError}
          onLoadedData={handleLoad}
          onCanPlay={handleLoad}
        >
          <source src={src} type="video/mp4" />
          <source src={src} type="video/webm" />
          Ваш браузер не поддерживает воспроизведение видео.
        </video>
      </>
    );
  }

  return <FallbackContent />;
};

// Компонент для отображения ошибок загрузки медиа в админ-панели
export const AdminMediaError: React.FC<{ error: string }> = ({ error }) => (
  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
    <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
    <p className="text-sm text-red-700">{error}</p>
  </div>
);

export default MediaFallback;