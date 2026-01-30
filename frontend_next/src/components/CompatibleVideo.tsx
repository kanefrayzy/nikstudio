'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getSupportedVideoFormats, getOptimalVideoFormat, handleMediaError } from '@/lib/media-compatibility';
import { getMediaUrl } from '@/lib/media-utils';
import { useComponentCompatibilityMonitoring } from '@/hooks/useCompatibilityMonitoring';

interface VideoSource {
  mp4?: string;
  webm?: string;
  ogg?: string;
}

interface CompatibleVideoProps {
  src: string | VideoSource;
  poster?: string;
  className?: string;
  width?: number;
  height?: number;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  playsInline?: boolean;
  onLoad?: () => void;
  onError?: (error: Event) => void;
  onCanPlay?: () => void;
  fallbackMessage?: string;
}

export const CompatibleVideo: React.FC<CompatibleVideoProps> = ({
  src,
  poster,
  className,
  width,
  height,
  autoPlay = false,
  loop = false,
  muted = false,
  controls = true,
  playsInline = true,
  onLoad,
  onError,
  onCanPlay,
  fallbackMessage = 'Ваш браузер не поддерживает воспроизведение видео.'
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [supportedFormats, setSupportedFormats] = useState<string[]>([]);
  const [optimalSrc, setOptimalSrc] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Initialize compatibility monitoring
  const monitoring = useComponentCompatibilityMonitoring('CompatibleVideo');

  useEffect(() => {
    const initializeVideo = async () => {
      const startTime = performance.now();
      
      try {
        setIsLoading(true);
        setHasError(false);

        // Get supported video formats with monitoring
        const formats = monitoring.trackFeatureDetection('video_formats', () => {
          return getSupportedVideoFormats();
        });
        setSupportedFormats(formats);

        // Track supported formats
        formats.forEach(format => {
          monitoring.trackComponentFeature(`video_format_${format}`);
        });

        let videoSrc: string;
        let selectedFormat: string = 'mp4';

        if (typeof src === 'string') {
          // Simple string source
          videoSrc = getMediaUrl(src);
        } else {
          // Object with multiple format options
          const availableFormats = Object.keys(src).filter(format => src[format as keyof VideoSource]);
          
          if (availableFormats.length === 0) {
            throw new Error('No video sources provided');
          }

          const optimalFormat = monitoring.trackFeatureDetection('optimal_video_format', () => {
            return getOptimalVideoFormat(availableFormats);
          });
          
          if (!optimalFormat) {
            // No supported format found, use first available
            const firstFormat = availableFormats[0] as keyof VideoSource;
            videoSrc = getMediaUrl(src[firstFormat] || '');
            selectedFormat = firstFormat;
            
            // Track fallback usage
            monitoring.trackComponentFeature('video_format_fallback', firstFormat);
          } else {
            videoSrc = getMediaUrl(src[optimalFormat as keyof VideoSource] || '');
            selectedFormat = optimalFormat;
            
            // Track optimal format selection
            monitoring.trackComponentFeature('video_format_optimal', optimalFormat);
          }
        }

        setOptimalSrc(videoSrc);
        
        // Track initialization performance
        const initTime = performance.now() - startTime;
        monitoring.trackComponentPerformance('video_initialization', initTime, 'detection');
        
        // Track selected format
        monitoring.trackComponentPerformance(`video_format_${selectedFormat}`, 1, 'detection');
        
      } catch (error) {
        console.error('Failed to initialize video:', error);
        
        // Track initialization error
        monitoring.trackComponentError('video_initialization', error instanceof Error ? error : new Error(String(error)), 'high');
        
        const initTime = performance.now() - startTime;
        monitoring.trackComponentPerformance('video_initialization_error', initTime, 'detection');
        
        setHasError(true);
        setIsLoading(false);
      }
    };

    initializeVideo();
  }, [src, monitoring]);

  const handleVideoLoad = () => {
    // Track successful video loading
    monitoring.trackComponentPerformance('video_load_success', 1, 'rendering');
    
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  };

  const handleVideoError = (event: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.error('Video loading error:', event);
    
    // Track video loading error
    const error = new Error(`Video loading failed: ${event.nativeEvent.type}`);
    monitoring.trackComponentError('video_loading', error, 'medium');
    
    // Try fallback URLs if available
    if (typeof src === 'object' && videoRef.current) {
      const fallbackUrls = Object.values(src)
        .filter(Boolean)
        .map(url => getMediaUrl(url!))
        .filter(url => url !== optimalSrc);
      
      if (fallbackUrls.length > 0) {
        // Track fallback attempt
        monitoring.trackComponentFeature('video_fallback_attempt');
        
        try {
          handleMediaError(videoRef.current, fallbackUrls);
          return;
        } catch (fallbackError) {
          monitoring.trackComponentError('video_fallback', fallbackError instanceof Error ? fallbackError : new Error(String(fallbackError)), 'high');
        }
      }
    }
    
    // Track final failure
    monitoring.trackComponentPerformance('video_load_failure', 1, 'rendering');
    
    setHasError(true);
    setIsLoading(false);
    onError?.(event.nativeEvent);
  };

  const handleCanPlay = () => {
    // Track when video is ready to play
    monitoring.trackComponentPerformance('video_can_play', 1, 'rendering');
    
    setIsLoading(false);
    onCanPlay?.();
  };

  // If no supported formats, show fallback message
  if (supportedFormats.length === 0 && !isLoading) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 text-gray-600 p-8 ${className || ''}`}>
        <div className="text-center">
          <p className="mb-2">{fallbackMessage}</p>
          <p className="text-sm text-gray-500">
            Попробуйте обновить браузер или использовать другой браузер.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className || ''}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded flex items-center justify-center">
          <div className="text-gray-500">Загрузка видео...</div>
        </div>
      )}
      
      {hasError ? (
        <div className="flex items-center justify-center bg-gray-100 text-gray-600 p-8 min-h-[200px]">
          <div className="text-center">
            <p className="mb-2">Не удалось загрузить видео</p>
            <p className="text-sm text-gray-500">{fallbackMessage}</p>
          </div>
        </div>
      ) : (
        <video
          ref={videoRef}
          className={`w-full h-full ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
          width={width}
          height={height}
          poster={poster ? getMediaUrl(poster) : undefined}
          autoPlay={autoPlay}
          loop={loop}
          muted={muted}
          controls={controls}
          playsInline={playsInline}
          onLoadedData={handleVideoLoad}
          onError={handleVideoError}
          onCanPlay={handleCanPlay}
        >
          {typeof src === 'object' ? (
            // Multiple source elements for different formats
            Object.entries(src)
              .filter(([_, url]) => url)
              .sort(([formatA], [formatB]) => {
                // Sort by browser preference
                const indexA = supportedFormats.indexOf(formatA);
                const indexB = supportedFormats.indexOf(formatB);
                if (indexA === -1 && indexB === -1) return 0;
                if (indexA === -1) return 1;
                if (indexB === -1) return -1;
                return indexA - indexB;
              })
              .map(([format, url]) => (
                <source
                  key={format}
                  src={getMediaUrl(url!)}
                  type={`video/${format}`}
                />
              ))
          ) : (
            <source src={optimalSrc} type="video/mp4" />
          )}
          
          {fallbackMessage}
        </video>
      )}
    </div>
  );
};