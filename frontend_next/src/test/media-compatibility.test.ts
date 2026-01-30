import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  mediaCompatibility,
  supportsWebP,
  supportsAVIF,
  getSupportedVideoFormats,
  getOptimalVideoFormat,
  getOptimalImageFormat,
  getMediaFormatSupport
} from '@/lib/media-compatibility';

// Mock DOM elements
const mockImage = () => {
  const img = {
    onload: null as (() => void) | null,
    onerror: null as (() => void) | null,
    src: '',
    height: 0,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  };
  return img as unknown as HTMLImageElement;
};

const mockVideo = () => {
  const video = {
    canPlayType: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    src: ''
  };
  return video as unknown as HTMLVideoElement;
};

// Mock document.createElement
const originalCreateElement = document.createElement;

beforeEach(() => {
  vi.clearAllMocks();
  
  document.createElement = vi.fn((tagName: string) => {
    if (tagName === 'img') {
      return mockImage();
    } else if (tagName === 'video') {
      return mockVideo();
    }
    return originalCreateElement.call(document, tagName);
  });
});

afterEach(() => {
  document.createElement = originalCreateElement;
});

describe('Media Compatibility System', () => {
  describe('WebP Support Detection', () => {
    it('should detect WebP support correctly', async () => {
      const mockImg = mockImage();
      document.createElement = vi.fn(() => mockImg);

      const promise = supportsWebP();
      
      // Simulate WebP support
      mockImg.height = 2;
      mockImg.onload?.();

      const result = await promise;
      expect(result).toBe(true);
    });

    it('should detect lack of WebP support', async () => {
      // Clear cache first
      (mediaCompatibility as any).supportCache = {};
      
      const mockImg = mockImage();
      document.createElement = vi.fn(() => mockImg);

      const promise = supportsWebP();
      
      // Simulate no WebP support
      mockImg.height = 0;
      mockImg.onerror?.();

      const result = await promise;
      expect(result).toBe(false);
    });

    it('should cache WebP support detection result', async () => {
      // Clear cache first
      (mediaCompatibility as any).supportCache = {};
      
      const createElementSpy = vi.spyOn(document, 'createElement');
      
      // First call
      const mockImg1 = mockImage();
      createElementSpy.mockReturnValueOnce(mockImg1);
      const promise1 = supportsWebP();
      mockImg1.height = 2;
      mockImg1.onload?.();
      await promise1;
      
      const firstCallCount = createElementSpy.mock.calls.length;
      
      // Second call should use cache
      await supportsWebP();
      const secondCallCount = createElementSpy.mock.calls.length;
      
      expect(secondCallCount).toBe(firstCallCount);
    });
  });

  describe('AVIF Support Detection', () => {
    it('should detect AVIF support correctly', async () => {
      // Clear cache first
      (mediaCompatibility as any).supportCache = {};
      
      const mockImg = mockImage();
      document.createElement = vi.fn(() => mockImg);

      const promise = supportsAVIF();
      
      // Simulate AVIF support
      mockImg.height = 2;
      mockImg.onload?.();

      const result = await promise;
      expect(result).toBe(true);
    });

    it('should detect lack of AVIF support', async () => {
      // Clear cache first
      (mediaCompatibility as any).supportCache = {};
      
      const mockImg = mockImage();
      document.createElement = vi.fn(() => mockImg);

      const promise = supportsAVIF();
      
      // Simulate no AVIF support
      mockImg.height = 0;
      mockImg.onerror?.();

      const result = await promise;
      expect(result).toBe(false);
    });
  });

  describe('Video Format Support', () => {
    it('should detect supported video formats', () => {
      const mockVid = mockVideo();
      mockVid.canPlayType = vi.fn((type: string) => {
        if (type.includes('mp4')) return 'probably';
        if (type.includes('webm')) return 'maybe';
        return '';
      });
      
      document.createElement = vi.fn(() => mockVid);

      const formats = getSupportedVideoFormats();
      expect(formats).toContain('mp4');
      expect(formats).toContain('webm');
    });

    it('should return optimal video format from available options', () => {
      const mockVid = mockVideo();
      mockVid.canPlayType = vi.fn((type: string) => {
        if (type.includes('webm') && type.includes('vp9')) return 'probably';
        if (type.includes('mp4')) return 'maybe';
        return '';
      });
      
      document.createElement = vi.fn(() => mockVid);

      const optimal = getOptimalVideoFormat(['mp4', 'webm', 'ogg']);
      expect(optimal).toBe('webm');
    });

    it('should return null when no formats are supported', () => {
      const mockVid = mockVideo();
      mockVid.canPlayType = vi.fn(() => '');
      
      document.createElement = vi.fn(() => mockVid);

      const optimal = getOptimalVideoFormat(['mp4', 'webm']);
      expect(optimal).toBe(null);
    });
  });

  describe('Image Format Optimization', () => {
    it('should prefer AVIF over WebP when both are supported', async () => {
      // Mock both formats as supported
      vi.spyOn(mediaCompatibility, 'supportsAVIF').mockResolvedValue(true);
      vi.spyOn(mediaCompatibility, 'supportsWebP').mockResolvedValue(true);

      const optimal = await getOptimalImageFormat(['jpeg', 'webp', 'avif']);
      expect(optimal).toBe('avif');
    });

    it('should prefer WebP over JPEG when WebP is supported', async () => {
      vi.spyOn(mediaCompatibility, 'supportsAVIF').mockResolvedValue(false);
      vi.spyOn(mediaCompatibility, 'supportsWebP').mockResolvedValue(true);

      const optimal = await getOptimalImageFormat(['jpeg', 'webp']);
      expect(optimal).toBe('webp');
    });

    it('should fallback to JPEG when modern formats are not supported', async () => {
      vi.spyOn(mediaCompatibility, 'supportsAVIF').mockResolvedValue(false);
      vi.spyOn(mediaCompatibility, 'supportsWebP').mockResolvedValue(false);

      const optimal = await getOptimalImageFormat(['jpeg', 'webp', 'avif']);
      expect(optimal).toBe('jpeg');
    });
  });

  describe('Comprehensive Format Support', () => {
    it('should return complete media format support information', async () => {
      const mockVid = mockVideo();
      mockVid.canPlayType = vi.fn((type: string) => {
        if (type.includes('mp4')) return 'probably';
        if (type.includes('webm')) return 'maybe';
        return '';
      });
      
      document.createElement = vi.fn((tagName: string) => {
        if (tagName === 'video') return mockVid;
        return mockImage();
      });

      const support = await getMediaFormatSupport();
      
      expect(support).toHaveProperty('webp');
      expect(support).toHaveProperty('avif');
      expect(support).toHaveProperty('jpeg', true);
      expect(support).toHaveProperty('png', true);
      expect(support).toHaveProperty('mp4');
      expect(support).toHaveProperty('webm');
      expect(support).toHaveProperty('ogg');
      expect(support).toHaveProperty('h264');
      expect(support).toHaveProperty('vp8');
      expect(support).toHaveProperty('vp9');
      expect(support).toHaveProperty('av1');
    });
  });

  describe('Error Handling', () => {
    it('should handle media loading errors with fallbacks', () => {
      const mockImg = mockImage();
      const fallbackUrls = ['fallback1.jpg', 'fallback2.jpg'];
      
      mediaCompatibility.handleMediaError(mockImg, fallbackUrls);
      
      expect(mockImg.addEventListener).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockImg.addEventListener).toHaveBeenCalledWith('load', expect.any(Function));
    });

    it('should try all fallback URLs before giving up', () => {
      const mockImg = mockImage();
      const fallbackUrls = ['fallback1.jpg', 'fallback2.jpg'];
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      mediaCompatibility.handleMediaError(mockImg, fallbackUrls, fallbackUrls.length);
      
      expect(consoleSpy).toHaveBeenCalledWith('All media fallbacks failed to load');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Fallback Strategy Generation', () => {
    it('should generate appropriate image fallback strategy', () => {
      const strategy = mediaCompatibility.generateFallbackStrategy('webp', 'image');
      
      expect(strategy.originalFormat).toBe('webp');
      expect(strategy.fallbackFormats).toContain('jpeg');
      expect(strategy.fallbackFormats).toContain('png');
      expect(strategy.reason).toContain('webp');
    });

    it('should generate appropriate video fallback strategy', () => {
      const strategy = mediaCompatibility.generateFallbackStrategy('webm', 'video');
      
      expect(strategy.originalFormat).toBe('webm');
      expect(strategy.fallbackFormats).toContain('mp4');
      expect(strategy.fallbackFormats).toContain('ogg');
      expect(strategy.fallbackFormats).not.toContain('webm');
      expect(strategy.reason).toContain('webm');
    });
  });
});