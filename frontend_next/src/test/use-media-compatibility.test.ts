import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useMediaCompatibility, useMediaErrorHandling } from '@/hooks/use-media-compatibility';

// Mock the media compatibility functions
vi.mock('@/lib/media-compatibility', () => ({
  getMediaFormatSupport: vi.fn(),
  getOptimalImageFormat: vi.fn(),
  getOptimalVideoFormat: vi.fn(),
  getSupportedVideoFormats: vi.fn(),
  supportsWebP: vi.fn(),
  supportsAVIF: vi.fn()
}));

const {
  getMediaFormatSupport,
  getOptimalImageFormat,
  getOptimalVideoFormat,
  getSupportedVideoFormats,
  supportsWebP,
  supportsAVIF
} = await import('@/lib/media-compatibility');

describe('useMediaCompatibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    (getMediaFormatSupport as any).mockResolvedValue({
      webp: true,
      avif: false,
      jpeg: true,
      png: true,
      mp4: true,
      webm: true,
      ogg: false,
      h264: true,
      vp8: true,
      vp9: false,
      av1: false
    });
    
    (supportsWebP as any).mockResolvedValue(true);
    (supportsAVIF as any).mockResolvedValue(false);
    (getSupportedVideoFormats as any).mockReturnValue(['mp4', 'webm']);
    (getOptimalImageFormat as any).mockResolvedValue('webp');
    (getOptimalVideoFormat as any).mockReturnValue('mp4');
  });

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useMediaCompatibility());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.support).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it('should load media compatibility support on mount', async () => {
    const { result } = renderHook(() => useMediaCompatibility());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.support).toBeDefined();
    expect(result.current.supportsWebP).toBe(true);
    expect(result.current.supportsAVIF).toBe(false);
    expect(result.current.supportedVideoFormats).toEqual(['mp4', 'webm']);
  });

  it('should handle errors during compatibility check', async () => {
    const errorMessage = 'Failed to detect compatibility';
    (getMediaFormatSupport as any).mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useMediaCompatibility());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe(errorMessage);
    expect(result.current.support).toBe(null);
  });

  it('should provide optimal image format function', async () => {
    const { result } = renderHook(() => useMediaCompatibility());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const format = await result.current.getOptimalImageFormat(['jpeg', 'webp']);
    expect(format).toBe('webp');
    expect(getOptimalImageFormat).toHaveBeenCalledWith(['jpeg', 'webp']);
  });

  it('should provide optimal video format function', async () => {
    const { result } = renderHook(() => useMediaCompatibility());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const format = result.current.getOptimalVideoFormat(['mp4', 'webm']);
    expect(format).toBe('mp4');
    expect(getOptimalVideoFormat).toHaveBeenCalledWith(['mp4', 'webm']);
  });

  it('should generate fallback URLs correctly', async () => {
    const { result } = renderHook(() => useMediaCompatibility());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const fallbacks = result.current.generateFallbackUrls('/path/to/image.jpg', ['webp', 'png']);
    expect(fallbacks).toEqual(['/path/to/image.webp', '/path/to/image.png']);
  });

  it('should allow manual compatibility check', async () => {
    const { result } = renderHook(() => useMediaCompatibility());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Clear previous calls
    vi.clearAllMocks();

    await result.current.checkMediaSupport();

    expect(getMediaFormatSupport).toHaveBeenCalled();
    expect(supportsWebP).toHaveBeenCalled();
    expect(supportsAVIF).toHaveBeenCalled();
  });
});

describe('useMediaErrorHandling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle image error with fallbacks', () => {
    const { result } = renderHook(() => useMediaErrorHandling());

    const mockImg = {
      src: '',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    } as unknown as HTMLImageElement;

    const fallbacks = ['fallback1.jpg', 'fallback2.jpg'];

    result.current.handleImageError(mockImg, fallbacks);

    expect(mockImg.addEventListener).toHaveBeenCalledWith('error', expect.any(Function));
    expect(mockImg.addEventListener).toHaveBeenCalledWith('load', expect.any(Function));
  });

  it('should handle video error with fallbacks', () => {
    const { result } = renderHook(() => useMediaErrorHandling());

    const mockVideo = {
      src: '',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    } as unknown as HTMLVideoElement;

    const fallbacks = ['fallback1.mp4', 'fallback2.mp4'];

    result.current.handleVideoError(mockVideo, fallbacks);

    expect(mockVideo.addEventListener).toHaveBeenCalledWith('error', expect.any(Function));
    expect(mockVideo.addEventListener).toHaveBeenCalledWith('loadeddata', expect.any(Function));
  });

  it('should create error handler for image element', () => {
    const { result } = renderHook(() => useMediaErrorHandling());

    const mockImg = document.createElement('img') as HTMLImageElement;
    const fallbacks = ['fallback.jpg'];
    const errorHandler = result.current.createErrorHandler(mockImg, fallbacks);

    expect(typeof errorHandler).toBe('function');
    
    // Just verify the function can be called without errors
    expect(() => errorHandler()).not.toThrow();
  });

  it('should create error handler for video element', () => {
    const { result } = renderHook(() => useMediaErrorHandling());

    const mockVideo = document.createElement('video') as HTMLVideoElement;
    const fallbacks = ['fallback.mp4'];
    const errorHandler = result.current.createErrorHandler(mockVideo, fallbacks);

    expect(typeof errorHandler).toBe('function');
    
    // Just verify the function can be called without errors
    expect(() => errorHandler()).not.toThrow();
  });
});