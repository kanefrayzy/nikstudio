'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getOptimalImageFormat, handleMediaError } from '@/lib/media-compatibility';
import { getMediaUrl } from '@/lib/media-utils';

interface ImageSource {
  webp?: string;
  avif?: string;
  jpeg?: string;
  jpg?: string;
  png?: string;
}

interface CompatibleImageProps {
  src: string | ImageSource;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  onLoad?: () => void;
  onError?: (error: Event) => void;
  fallbackSrc?: string;
}

export const CompatibleImage: React.FC<CompatibleImageProps> = ({
  src,
  alt,
  className,
  width,
  height,
  priority = false,
  onLoad,
  onError,
  fallbackSrc = '/placeholder.jpg'
}) => {
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const loadOptimalImage = async () => {
      try {
        setIsLoading(true);
        setHasError(false);

        let imageSrc: string;

        if (typeof src === 'string') {
          // Simple string source
          imageSrc = getMediaUrl(src, fallbackSrc);
        } else {
          // Object with multiple format options
          const availableFormats = Object.keys(src).filter(format => src[format as keyof ImageSource]);
          
          if (availableFormats.length === 0) {
            imageSrc = fallbackSrc;
          } else {
            const optimalFormat = await getOptimalImageFormat(availableFormats);
            imageSrc = getMediaUrl(src[optimalFormat as keyof ImageSource] || '', fallbackSrc);
          }
        }

        setCurrentSrc(imageSrc);
      } catch (error) {
        console.error('Failed to determine optimal image format:', error);
        setCurrentSrc(typeof src === 'string' ? getMediaUrl(src, fallbackSrc) : fallbackSrc);
      }
    };

    loadOptimalImage();
  }, [src, fallbackSrc]);

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  };

  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setHasError(true);
    setIsLoading(false);
    
    // Try fallback URLs if available
    if (typeof src === 'object' && imgRef.current) {
      const fallbackUrls = Object.values(src)
        .filter(Boolean)
        .map(url => getMediaUrl(url!, fallbackSrc))
        .filter(url => url !== currentSrc);
      
      if (fallbackUrls.length > 0) {
        handleMediaError(imgRef.current, [...fallbackUrls, fallbackSrc]);
        return;
      }
    }
    
    // Final fallback
    if (currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      return;
    }
    
    onError?.(event.nativeEvent);
  };

  return (
    <div className={`relative ${className || ''}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />
      )}
      
      <img
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        width={width}
        height={height}
        className={`${className || ''} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading={priority ? 'eager' : 'lazy'}
      />
      
      {hasError && currentSrc === fallbackSrc && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500 text-sm">
          Изображение недоступно
        </div>
      )}
    </div>
  );
};