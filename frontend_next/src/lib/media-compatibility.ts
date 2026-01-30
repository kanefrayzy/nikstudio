/**
 * Media Format Compatibility System
 * Handles cross-browser media format detection and fallbacks
 */

export interface MediaFormatSupport {
  webp: boolean;
  avif: boolean;
  jpeg: boolean;
  png: boolean;
  mp4: boolean;
  webm: boolean;
  ogg: boolean;
  h264: boolean;
  vp8: boolean;
  vp9: boolean;
  av1: boolean;
}

export interface MediaCompatibilityConfig {
  imageFormats: {
    modern: string[];
    legacy: string[];
  };
  videoFormats: {
    primary: string[];
    fallback: string[];
  };
  videoCodecs: {
    h264: string;
    vp8: string;
    vp9: string;
    av1: string;
  };
}

export interface MediaFallbackStrategy {
  originalFormat: string;
  fallbackFormats: string[];
  reason: string;
}

class MediaCompatibilityService {
  private supportCache: Partial<MediaFormatSupport> = {};
  private config: MediaCompatibilityConfig;

  constructor() {
    this.config = {
      imageFormats: {
        modern: ['webp', 'avif'],
        legacy: ['jpeg', 'jpg', 'png']
      },
      videoFormats: {
        primary: ['webm', 'mp4'],
        fallback: ['mp4', 'ogg']
      },
      videoCodecs: {
        h264: 'video/mp4; codecs="avc1.42E01E"',
        vp8: 'video/webm; codecs="vp8"',
        vp9: 'video/webm; codecs="vp9"',
        av1: 'video/mp4; codecs="av01.0.05M.08"'
      }
    };
  }

  /**
   * Detect WebP image format support
   */
  async supportsWebP(): Promise<boolean> {
    if (this.supportCache.webp !== undefined) {
      return this.supportCache.webp;
    }

    return new Promise((resolve) => {
      const webP = new Image();
      webP.onload = webP.onerror = () => {
        const supported = webP.height === 2;
        this.supportCache.webp = supported;
        resolve(supported);
      };
      webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
  }

  /**
   * Detect AVIF image format support
   */
  async supportsAVIF(): Promise<boolean> {
    if (this.supportCache.avif !== undefined) {
      return this.supportCache.avif;
    }

    return new Promise((resolve) => {
      const avif = new Image();
      avif.onload = avif.onerror = () => {
        const supported = avif.height === 2;
        this.supportCache.avif = supported;
        resolve(supported);
      };
      avif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';
    });
  }

  /**
   * Detect video format support
   */
  supportsVideoFormat(format: string, codec?: string): boolean {
    const video = document.createElement('video');
    
    if (codec) {
      const mimeType = `video/${format}; codecs="${codec}"`;
      return video.canPlayType(mimeType) !== '';
    }
    
    const mimeType = `video/${format}`;
    return video.canPlayType(mimeType) !== '';
  }

  /**
   * Get supported video formats in order of preference
   */
  getSupportedVideoFormats(): string[] {
    const supported: string[] = [];
    
    // Check WebM with VP9
    if (this.supportsVideoFormat('webm', 'vp9')) {
      supported.push('webm');
    }
    // Check WebM with VP8
    else if (this.supportsVideoFormat('webm', 'vp8')) {
      supported.push('webm');
    }
    
    // Check MP4 with H.264
    if (this.supportsVideoFormat('mp4', 'avc1.42E01E')) {
      supported.push('mp4');
    }
    
    // Check OGG
    if (this.supportsVideoFormat('ogg')) {
      supported.push('ogg');
    }
    
    return supported;
  }

  /**
   * Get optimal video format from available formats
   */
  getOptimalVideoFormat(availableFormats: string[]): string | null {
    const supportedFormats = this.getSupportedVideoFormats();
    
    for (const format of supportedFormats) {
      if (availableFormats.includes(format)) {
        return format;
      }
    }
    
    return null;
  }

  /**
   * Get optimal image format based on browser support
   */
  async getOptimalImageFormat(availableFormats: string[]): Promise<string> {
    // Check for modern formats first
    if (availableFormats.includes('avif') && await this.supportsAVIF()) {
      return 'avif';
    }
    
    if (availableFormats.includes('webp') && await this.supportsWebP()) {
      return 'webp';
    }
    
    // Fallback to legacy formats
    const legacyFormats = ['jpeg', 'jpg', 'png'];
    for (const format of legacyFormats) {
      if (availableFormats.includes(format)) {
        return format;
      }
    }
    
    return availableFormats[0] || 'jpeg';
  }

  /**
   * Generate fallback strategy for unsupported media
   */
  generateFallbackStrategy(originalFormat: string, mediaType: 'image' | 'video'): MediaFallbackStrategy {
    if (mediaType === 'image') {
      const fallbacks = ['jpeg', 'png'];
      return {
        originalFormat,
        fallbackFormats: fallbacks,
        reason: `Browser doesn't support ${originalFormat} format`
      };
    } else {
      const fallbacks = ['mp4', 'webm', 'ogg'];
      return {
        originalFormat,
        fallbackFormats: fallbacks.filter(f => f !== originalFormat),
        reason: `Browser doesn't support ${originalFormat} video format`
      };
    }
  }

  /**
   * Get comprehensive media format support information
   */
  async getMediaFormatSupport(): Promise<MediaFormatSupport> {
    const support: MediaFormatSupport = {
      webp: await this.supportsWebP(),
      avif: await this.supportsAVIF(),
      jpeg: true, // Always supported
      png: true,  // Always supported
      mp4: this.supportsVideoFormat('mp4'),
      webm: this.supportsVideoFormat('webm'),
      ogg: this.supportsVideoFormat('ogg'),
      h264: this.supportsVideoFormat('mp4', 'avc1.42E01E'),
      vp8: this.supportsVideoFormat('webm', 'vp8'),
      vp9: this.supportsVideoFormat('webm', 'vp9'),
      av1: this.supportsVideoFormat('mp4', 'av01.0.05M.08')
    };

    // Cache the results
    this.supportCache = { ...this.supportCache, ...support };
    
    return support;
  }

  /**
   * Create optimized source elements for video
   */
  createVideoSources(videoUrls: { [format: string]: string }): HTMLSourceElement[] {
    const sources: HTMLSourceElement[] = [];
    const supportedFormats = this.getSupportedVideoFormats();
    
    // Add sources in order of browser preference
    for (const format of supportedFormats) {
      if (videoUrls[format]) {
        const source = document.createElement('source');
        source.src = videoUrls[format];
        source.type = `video/${format}`;
        sources.push(source);
      }
    }
    
    return sources;
  }

  /**
   * Handle media loading errors with fallback
   */
  handleMediaError(
    element: HTMLImageElement | HTMLVideoElement,
    fallbackUrls: string[],
    currentIndex: number = 0
  ): void {
    if (currentIndex >= fallbackUrls.length) {
      console.error('All media fallbacks failed to load');
      return;
    }

    const nextUrl = fallbackUrls[currentIndex];
    
    const errorHandler = () => {
      element.removeEventListener('error', errorHandler);
      this.handleMediaError(element, fallbackUrls, currentIndex + 1);
    };

    const loadHandler = () => {
      element.removeEventListener('load', loadHandler);
      element.removeEventListener('error', errorHandler);
    };

    element.addEventListener('error', errorHandler);
    element.addEventListener('load', loadHandler);
    
    if (element instanceof HTMLImageElement) {
      element.src = nextUrl;
    } else if (element instanceof HTMLVideoElement) {
      element.src = nextUrl;
    }
  }
}

// Export singleton instance
export const mediaCompatibility = new MediaCompatibilityService();

// Export utility functions
export const supportsWebP = () => mediaCompatibility.supportsWebP();
export const supportsAVIF = () => mediaCompatibility.supportsAVIF();
export const getSupportedVideoFormats = () => mediaCompatibility.getSupportedVideoFormats();
export const getOptimalVideoFormat = (formats: string[]) => mediaCompatibility.getOptimalVideoFormat(formats);
export const getOptimalImageFormat = (formats: string[]) => mediaCompatibility.getOptimalImageFormat(formats);
export const getMediaFormatSupport = () => mediaCompatibility.getMediaFormatSupport();
export const handleMediaError = (element: HTMLImageElement | HTMLVideoElement, fallbacks: string[]) => 
  mediaCompatibility.handleMediaError(element, fallbacks);