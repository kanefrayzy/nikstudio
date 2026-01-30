"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import { getOptimizedImageProps, normalizeImagePath } from "@/utils/imageOptimization";

interface OptimizedImageProps {
  src: string;
  alt: string;
  type: 'hero' | 'carousel' | 'testimonial' | 'process';
  priority?: boolean;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  onLoad?: () => void;
  onError?: () => void;
}

export default function OptimizedImage({
  src,
  alt,
  type,
  priority = false,
  className = "",
  fill = false,
  width,
  height,
  onLoad,
  onError
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState(normalizeImagePath(src));

  const optimizedProps = getOptimizedImageProps(src, alt, type, priority);

  useEffect(() => {
    console.log('🖼️ OptimizedImage: обновление src:', src);
    const normalizedSrc = normalizeImagePath(src);
    console.log('🔄 OptimizedImage: нормализованный src:', normalizedSrc);
    setImageSrc(normalizedSrc);
    setIsLoading(true);
    setHasError(false);
  }, [src]);

  const handleLoad = () => {
    console.log('✅ Изображение загружено успешно:', imageSrc);
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    console.error('❌ Ошибка загрузки изображения:', imageSrc);
    setIsLoading(false);
    setHasError(true);
    // Fallback to placeholder image
    setImageSrc('/images/placeholder.svg');
    onError?.();
  };

  const imageProps = {
    src: imageSrc,
    alt: optimizedProps.alt,
    sizes: optimizedProps.sizes,
    priority: optimizedProps.priority,
    quality: optimizedProps.quality,
    placeholder: optimizedProps.placeholder,
    className: `${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`,
    onLoad: handleLoad,
    onError: handleError,
    ...(fill ? { fill: true } : { width, height })
  };

  return (
    <div className="relative">
      {/* Loading skeleton */}
      {isLoading && (
        <div className={`absolute inset-0 bg-gray-800 animate-pulse ${fill ? '' : `w-[${width}px] h-[${height}px]`}`} />
      )}
      
      {/* Optimized image */}
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