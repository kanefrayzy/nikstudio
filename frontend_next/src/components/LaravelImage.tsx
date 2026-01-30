"use client";
import Image from "next/image";
import { useState } from "react";

interface LaravelImageProps {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  priority?: boolean;
  quality?: number;
  loading?: "lazy" | "eager";
  onLoad?: () => void;
  onError?: () => void;
}

export default function LaravelImage({
  src,
  alt,
  className = "",
  fill = false,
  width,
  height,
  priority = false,
  quality = 75,
  loading,
  onLoad,
  onError
}: LaravelImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState(src);

  // console.log('🖼️ LaravelImage рендер:', { src, alt, fill, width, height });

  const handleLoad = () => {
    console.log('✅ LaravelImage загружено:', imageSrc);
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    console.error('❌ LaravelImage ошибка:', imageSrc);
    setIsLoading(false);
    setHasError(true);
    setImageSrc('/images/placeholder.svg');
    onError?.();
  };

  // Для Laravel изображений используем обычный img тег, чтобы избежать Next.js Image API
  if (src.includes('localhost:8000') || src.includes('/storage/') || src.startsWith('http://') || src.startsWith('https://')) {
    // console.log('🔄 Используем обычный img для Laravel изображения:', src);
    
    // Определяем стили для изображения
    const imageStyle: React.CSSProperties = {};
    if (fill) {
      imageStyle.width = '100%';
      imageStyle.height = '100%';
      imageStyle.objectFit = 'cover';
    } else if (width && height && width > 0 && height > 0) {
      imageStyle.width = width;
      imageStyle.height = height;
    }
    
    return (
      <div className={`relative ${fill ? 'w-full h-full' : ''}`}>
        {/* Loading skeleton */}
        {isLoading && (
          <div className={`absolute inset-0 bg-gray-800 animate-pulse ${fill ? 'w-full h-full' : width && height && width > 0 && height > 0 ? `w-[${width}px] h-[${height}px]` : 'w-full h-64'}`} />
        )}
        
        {/* Regular img tag for Laravel images */}
        <img
          src={imageSrc}
          alt={alt}
          className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
          style={imageStyle}
          onLoad={handleLoad}
          onError={handleError}
          loading={loading || (priority ? 'eager' : 'lazy')}
        />
        
        {/* Error state */}
        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-gray-400 text-sm">
            Изображение недоступно
          </div>
        )}
      </div>
    );
  }

  // Для локальных изображений используем Next.js Image
  // console.log('🔄 Используем Next.js Image для локального изображения:', src);
  
  const imageProps = {
    src: imageSrc,
    alt,
    className: `${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`,
    onLoad: handleLoad,
    onError: handleError,
    priority,
    quality,
    ...(fill ? { fill: true } : { width, height })
  };

  return (
    <div className="relative">
      {/* Loading skeleton */}
      {isLoading && (
        <div className={`absolute inset-0 bg-gray-800 animate-pulse ${fill ? '' : `w-[${width}px] h-[${height}px]`}`} />
      )}
      
      {/* Next.js optimized image */}
      <Image {...imageProps} />
      
      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-gray-400 text-sm">
          Изображение недоступно
        </div>
      )}
    </div>
  );
}