import { useState } from 'react';

/**
 * Image optimization utilities for media page
 */

export interface ImageSizes {
  mobile: number;
  tablet: number;
  desktop: number;
  xl: number;
}

export interface OptimizedImageProps {
  src: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
}

/**
 * Generate responsive image sizes for different breakpoints
 */
export const getResponsiveImageSizes = (type: 'hero' | 'carousel' | 'testimonial' | 'process'): string => {
  const sizeConfigs = {
    hero: '(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 60vw',
    carousel: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 40vw',
    testimonial: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 50vw',
    process: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 50vw'
  };
  
  return sizeConfigs[type];
};

/**
 * Generate optimized image props with lazy loading
 */
export const getOptimizedImageProps = (
  src: string,
  alt: string,
  type: 'hero' | 'carousel' | 'testimonial' | 'process',
  priority: boolean = false
): OptimizedImageProps => {
  return {
    src: normalizeImagePath(src),
    alt,
    sizes: getResponsiveImageSizes(type),
    priority,
    quality: priority ? 90 : 75, // Higher quality for priority images
    placeholder: 'empty' as const,
  };
};

/**
 * Normalize image path for Next.js Image component
 */
export const normalizeImagePath = (path: string): string => {
  console.log('🔄 normalizeImagePath вызвана с путем:', path);
  
  if (!path) {
    console.warn('⚠️ Пустой путь к изображению, используем placeholder');
    return '/images/placeholder.svg';
  }
  
  // If path already starts with http/https, return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    console.log('🌐 Внешний URL изображения:', path);
    return path;
  }
  
  // If path starts with /images/ (static assets), return as is
  if (path.startsWith('/images/')) {
    console.log('📁 Статический ресурс:', path);
    return path;
  }
  
  // If path starts with /storage/ or is a storage file, use Laravel server
  if (path.startsWith('/storage/') || path.startsWith('storage/')) {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const fullUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${cleanPath}`;
    console.log('🖼️ Laravel storage URL (с префиксом):', fullUrl);
    return fullUrl;
  }
  
  // If path starts with /, return as is (for other static assets)
  if (path.startsWith('/')) {
    console.log('📂 Локальный статический путь:', path);
    return path;
  }
  
  // Add /storage/ prefix for Laravel storage files and use Laravel server
  const fullUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/storage/${path}`;
  console.log('🖼️ Laravel storage URL (без префикса):', fullUrl);
  return fullUrl;
};

/**
 * Generate blur placeholder for images
 */
export const generateBlurDataURL = (width: number = 10, height: number = 10): string => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  
  // Create a simple gradient blur effect
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#1a1a1a');
  gradient.addColorStop(1, '#2a2a2a');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  return canvas.toDataURL();
};

/**
 * Preload critical images for better performance
 */
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = normalizeImagePath(src);
  });
};

/**
 * Lazy load images with intersection observer
 */
export class LazyImageLoader {
  private observer: IntersectionObserver | null = null;
  private images: Set<HTMLImageElement> = new Set();

  constructor() {
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const img = entry.target as HTMLImageElement;
              this.loadImage(img);
              this.observer?.unobserve(img);
              this.images.delete(img);
            }
          });
        },
        {
          rootMargin: '50px 0px', // Start loading 50px before image enters viewport
          threshold: 0.1
        }
      );
    }
  }

  observe(img: HTMLImageElement) {
    if (this.observer && img) {
      this.images.add(img);
      this.observer.observe(img);
    }
  }

  private loadImage(img: HTMLImageElement) {
    const src = img.dataset.src;
    if (src) {
      img.src = normalizeImagePath(src);
      img.classList.add('loaded');
    }
  }

  disconnect() {
    if (this.observer) {
      this.observer.disconnect();
      this.images.clear();
    }
  }
}

/**
 * Image loading states for better UX
 */
export const useImageLoadingState = () => {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const setImageLoading = (src: string, loading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [src]: loading
    }));
  };

  const isImageLoading = (src: string): boolean => {
    return loadingStates[src] ?? true;
  };

  return { setImageLoading, isImageLoading };
};