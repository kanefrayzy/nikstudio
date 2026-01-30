'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  MediaFormatSupport, 
  // MediaFallbackStrategy,
  getMediaFormatSupport,
  getOptimalImageFormat,
  getOptimalVideoFormat,
  getSupportedVideoFormats,
  supportsWebP,
  supportsAVIF
} from '@/lib/media-compatibility';

interface UseMediaCompatibilityReturn {
  support: MediaFormatSupport | null;
  isLoading: boolean;
  error: string | null;
  supportsWebP: boolean | null;
  supportsAVIF: boolean | null;
  supportedVideoFormats: string[];
  getOptimalImageFormat: (formats: string[]) => Promise<string>;
  getOptimalVideoFormat: (formats: string[]) => string | null;
  generateFallbackUrls: (baseUrl: string, formats: string[]) => string[];
  checkMediaSupport: () => Promise<void>;
}

export const useMediaCompatibility = (): UseMediaCompatibilityReturn => {
  const [support, setSupport] = useState<MediaFormatSupport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [webpSupport, setWebpSupport] = useState<boolean | null>(null);
  const [avifSupport, setAvifSupport] = useState<boolean | null>(null);
  const [supportedVideoFormats, setSupportedVideoFormats] = useState<string[]>([]);

  const checkMediaSupport = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get comprehensive support information
      const formatSupport = await getMediaFormatSupport();
      setSupport(formatSupport);

      // Get individual format support
      const webp = await supportsWebP();
      const avif = await supportsAVIF();
      const videoFormats = getSupportedVideoFormats();

      setWebpSupport(webp);
      setAvifSupport(avif);
      setSupportedVideoFormats(videoFormats);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to detect media compatibility';
      setError(errorMessage);
      console.error('Media compatibility check failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateFallbackUrls = useCallback((baseUrl: string, formats: string[]): string[] => {
    // Remove file extension from base URL
    const urlWithoutExt = baseUrl.replace(/\.[^/.]+$/, '');
    
    // Generate URLs for each format
    return formats.map(format => `${urlWithoutExt}.${format}`);
  }, []);

  const getOptimalImageFormatWrapper = useCallback(async (formats: string[]): Promise<string> => {
    return await getOptimalImageFormat(formats);
  }, []);

  const getOptimalVideoFormatWrapper = useCallback((formats: string[]): string | null => {
    return getOptimalVideoFormat(formats);
  }, []);

  useEffect(() => {
    checkMediaSupport();
  }, [checkMediaSupport]);

  return {
    support,
    isLoading,
    error,
    supportsWebP: webpSupport,
    supportsAVIF: avifSupport,
    supportedVideoFormats,
    getOptimalImageFormat: getOptimalImageFormatWrapper,
    getOptimalVideoFormat: getOptimalVideoFormatWrapper,
    generateFallbackUrls,
    checkMediaSupport
  };
};

interface UseMediaErrorHandlingReturn {
  handleImageError: (img: HTMLImageElement, fallbackUrls: string[]) => void;
  handleVideoError: (video: HTMLVideoElement, fallbackUrls: string[]) => void;
  createErrorHandler: (element: HTMLImageElement | HTMLVideoElement, fallbacks: string[]) => () => void;
}

export const useMediaErrorHandling = (): UseMediaErrorHandlingReturn => {
  const handleImageError = useCallback((img: HTMLImageElement, fallbackUrls: string[]) => {
    let currentIndex = 0;
    
    const tryNextFallback = () => {
      if (currentIndex >= fallbackUrls.length) {
        console.error('All image fallbacks failed');
        return;
      }
      
      const nextUrl = fallbackUrls[currentIndex];
      currentIndex++;
      
      const errorHandler = () => {
        img.removeEventListener('error', errorHandler);
        tryNextFallback();
      };
      
      const loadHandler = () => {
        img.removeEventListener('error', errorHandler);
        img.removeEventListener('load', loadHandler);
      };
      
      img.addEventListener('error', errorHandler);
      img.addEventListener('load', loadHandler);
      img.src = nextUrl;
    };
    
    tryNextFallback();
  }, []);

  const handleVideoError = useCallback((video: HTMLVideoElement, fallbackUrls: string[]) => {
    let currentIndex = 0;
    
    const tryNextFallback = () => {
      if (currentIndex >= fallbackUrls.length) {
        console.error('All video fallbacks failed');
        return;
      }
      
      const nextUrl = fallbackUrls[currentIndex];
      currentIndex++;
      
      const errorHandler = () => {
        video.removeEventListener('error', errorHandler);
        tryNextFallback();
      };
      
      const loadHandler = () => {
        video.removeEventListener('error', errorHandler);
        video.removeEventListener('loadeddata', loadHandler);
      };
      
      video.addEventListener('error', errorHandler);
      video.addEventListener('loadeddata', loadHandler);
      video.src = nextUrl;
    };
    
    tryNextFallback();
  }, []);

  const createErrorHandler = useCallback((
    element: HTMLImageElement | HTMLVideoElement, 
    fallbacks: string[]
  ) => {
    return () => {
      if (element instanceof HTMLImageElement) {
        handleImageError(element, fallbacks);
      } else if (element instanceof HTMLVideoElement) {
        handleVideoError(element, fallbacks);
      }
    };
  }, [handleImageError, handleVideoError]);

  return {
    handleImageError,
    handleVideoError,
    createErrorHandler
  };
};