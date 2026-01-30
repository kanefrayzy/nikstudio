"use client";
import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

interface HeroVideoSectionProps {
  videoUrl?: string;
  fallbackImage?: string;
  className?: string;
}

const HeroVideoSection: React.FC<HeroVideoSectionProps> = ({
  videoUrl,
  fallbackImage = "/images/home/hero-image.png",
  className = ""
}) => {
  const [hasVideoError, setHasVideoError] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [loadAttempts, setLoadAttempts] = useState(0);
  const [_errorDetails, setErrorDetails] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Reset error state when videoUrl changes
  useEffect(() => {
    if (videoUrl) {
      console.log('Video URL changed, resetting error state:', videoUrl);
      setHasVideoError(false);
      setIsVideoLoaded(false);
      setLoadAttempts(0);
      setErrorDetails(null);
    }
  }, [videoUrl]);

  const handleVideoError = (event: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const video = event.currentTarget;
    const error = video.error;
    
    let errorMessage = 'Unknown video error';
    let errorCode = 'UNKNOWN';
    
    if (error) {
      switch (error.code) {
        case MediaError.MEDIA_ERR_ABORTED:
          errorMessage = 'Video loading was aborted';
          errorCode = 'ABORTED';
          break;
        case MediaError.MEDIA_ERR_NETWORK:
          errorMessage = 'Network error while loading video';
          errorCode = 'NETWORK';
          break;
        case MediaError.MEDIA_ERR_DECODE:
          errorMessage = 'Video decoding error';
          errorCode = 'DECODE';
          break;
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          errorMessage = 'Video format not supported';
          errorCode = 'FORMAT';
          break;
        default:
          errorMessage = `Video error code: ${error.code}`;
          errorCode = `CODE_${error.code}`;
      }
    } else {
      // Handle case where error object is null/undefined
      errorMessage = 'Video error occurred but no error details available';
      errorCode = 'NO_ERROR_DETAILS';
    }

    // Only log if we have meaningful information to avoid empty object logs
    if (videoUrl || errorCode !== 'UNKNOWN' || errorMessage !== 'Unknown video error') {
      console.error('Video failed to load:', {
        url: videoUrl || 'No URL provided',
        errorCode,
        errorMessage,
        attempt: loadAttempts + 1,
        timestamp: new Date().toISOString(),
        videoElement: {
          readyState: video.readyState,
          networkState: video.networkState,
          currentSrc: video.currentSrc
        }
      });
    }

    setErrorDetails(`${errorCode}: ${errorMessage}`);
    setLoadAttempts(prev => prev + 1);
    
    // Try to reload the video once if it's a network error
    if (error?.code === MediaError.MEDIA_ERR_NETWORK && loadAttempts < 1) {
      console.log('Attempting to reload video due to network error');
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.load();
        }
      }, 2000);
    } else {
      setHasVideoError(true);
    }
  };

  const handleVideoLoaded = () => {
    console.log('Video loaded successfully:', videoUrl);
    setIsVideoLoaded(true);
    setErrorDetails(null);
  };

  const handleVideoCanPlay = () => {
    // Ensure video plays when it's ready
    if (videoRef.current) {
      console.log('Video can play, attempting autoplay');
      // Mark video as loaded when it can play
      setIsVideoLoaded(true);
      videoRef.current.play().catch((error) => {
        console.error('Video autoplay failed:', {
          error: error.message,
          url: videoUrl,
          timestamp: new Date().toISOString()
        });
        // Autoplay failure is not a critical error, video can still be played manually
      });
    }
  };

  const handleVideoLoadStart = () => {
    console.log('Video load started:', videoUrl);
  };

  const handleVideoProgress = () => {
    if (videoRef.current) {
      const buffered = videoRef.current.buffered;
      if (buffered.length > 0) {
        const bufferedEnd = buffered.end(buffered.length - 1);
        const duration = videoRef.current.duration;
        if (duration > 0) {
          const bufferedPercent = (bufferedEnd / duration) * 100;
          console.log(`Video buffered: ${bufferedPercent.toFixed(1)}%`);
        }
      }
    }
  };

  // Show fallback image if no video URL provided or video failed to load
  const shouldShowFallback = !videoUrl || hasVideoError;

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      {shouldShowFallback ? (
        // Fallback image
        <Image 
          src={fallbackImage}
          alt="Hero Image" 
          className="object-cover object-center w-full h-full"
          width={1787}
          height={1810}
          priority
          fetchPriority="high"
          quality={90}
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      ) : (
        <>
          {/* Video element */}
          <video
            ref={videoRef}
            className="object-cover object-center w-full h-full"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            onError={handleVideoError}
            onLoadedData={handleVideoLoaded}
            onCanPlay={handleVideoCanPlay}
            onLoadStart={handleVideoLoadStart}
            onProgress={handleVideoProgress}
            style={{
              aspectRatio: '16/9',
              minHeight: '100%',
              minWidth: '100%'
            }}
          >
            <source src={videoUrl} type="video/mp4" />
            <source src={videoUrl} type="video/webm" />
            <source src={videoUrl} type="video/ogg" />
            Your browser does not support the video tag.
          </video>

          {/* Loading state - show fallback image while video is loading */}
          {!isVideoLoaded && (
            <div className="absolute inset-0">
              <Image 
                src={fallbackImage}
                alt="Hero Image Loading" 
                className="object-cover object-center w-full h-full"
                width={1787}
                height={1810}
                priority
                fetchPriority="high"
                quality={90}
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default HeroVideoSection;