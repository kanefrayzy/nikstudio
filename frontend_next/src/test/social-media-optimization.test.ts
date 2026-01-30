import { describe, it, expect, vi } from 'vitest';
import { 
  SocialMediaImageOptimizer, 
  generateSocialMediaMetaTags,
  SOCIAL_MEDIA_SPECS
} from '@/lib/social-media-optimization';

// Mock environment variables
vi.mock('process', () => ({
  env: {
    NEXT_PUBLIC_API_URL: 'http://localhost:8000',
    NEXT_PUBLIC_SITE_URL: 'https://nikstudio.com'
  }
}));

describe('Social Media Optimization', () => {
  describe('SocialMediaImageOptimizer', () => {
    it('should generate optimized Open Graph image URL', () => {
      const imagePath = '/storage/images/test.jpg';
      const optimizedUrl = SocialMediaImageOptimizer.generateOpenGraphImage(imagePath);
      
      expect(optimizedUrl).toContain('api/images/optimize');
      expect(optimizedUrl).toContain('w=1200');
      expect(optimizedUrl).toContain('h=630');
      expect(optimizedUrl).toContain('q=85');
      expect(optimizedUrl).toContain('f=jpg');
    });

    it('should generate optimized Twitter image URL for large card', () => {
      const imagePath = '/storage/images/test.jpg';
      const optimizedUrl = SocialMediaImageOptimizer.generateTwitterImage(imagePath, 'summary_large_image');
      
      expect(optimizedUrl).toContain('api/images/optimize');
      expect(optimizedUrl).toContain('w=1200');
      expect(optimizedUrl).toContain('h=675');
    });

    it('should generate optimized Twitter image URL for summary card', () => {
      const imagePath = '/storage/images/test.jpg';
      const optimizedUrl = SocialMediaImageOptimizer.generateTwitterImage(imagePath, 'summary');
      
      expect(optimizedUrl).toContain('api/images/optimize');
      expect(optimizedUrl).toContain('w=300');
      expect(optimizedUrl).toContain('h=300');
    });

    it('should generate all platform images', () => {
      const imagePath = '/storage/images/test.jpg';
      const allImages = SocialMediaImageOptimizer.generateAllPlatformImages(imagePath);
      
      expect(allImages).toHaveProperty('openGraph');
      expect(allImages).toHaveProperty('twitter');
      expect(allImages).toHaveProperty('facebook');
      expect(allImages).toHaveProperty('linkedin');
      
      expect(allImages.openGraph).toContain('w=1200');
      expect(allImages.openGraph).toContain('h=630');
    });

    it('should handle external URLs correctly', () => {
      const externalUrl = 'https://example.com/image.jpg';
      const optimizedUrl = SocialMediaImageOptimizer.generateOpenGraphImage(externalUrl);
      
      expect(optimizedUrl).toBe(externalUrl);
    });

    it('should normalize image paths correctly', () => {
      const testCases = [
        {
          input: '/storage/images/test.jpg',
          expectedPath: 'images/test.jpg'
        },
        {
          input: '/images/test.jpg',
          expectedPath: 'images/test.jpg'
        },
        {
          input: 'images/test.jpg',
          expectedPath: 'images/test.jpg'
        }
      ];

      testCases.forEach(({ input, expectedPath }) => {
        const optimized = SocialMediaImageOptimizer.generateOpenGraphImage(input);
        expect(optimized).toContain('api/images/optimize');
        expect(optimized).toContain(`path=${encodeURIComponent(expectedPath)}`);
      });
    });
  });

  describe('generateSocialMediaMetaTags', () => {
    const mockData = {
      title: 'Test Title',
      description: 'Test Description',
      image: '/storage/images/test.jpg',
      url: 'https://nikstudio.com/test',
      siteName: 'NIK Studio'
    };

    it('should generate Open Graph tags', () => {
      const tags = generateSocialMediaMetaTags(mockData);
      
      expect(tags.openGraph).toEqual(
        expect.arrayContaining([
          { property: 'og:title', content: 'Test Title' },
          { property: 'og:description', content: 'Test Description' },
          { property: 'og:url', content: 'https://nikstudio.com/test' },
          { property: 'og:site_name', content: 'NIK Studio' },
          { property: 'og:locale', content: 'ru_RU' },
          { property: 'og:type', content: 'website' }
        ])
      );
    });

    it('should generate Twitter Card tags', () => {
      const tags = generateSocialMediaMetaTags(mockData);
      
      expect(tags.twitter).toEqual(
        expect.arrayContaining([
          { name: 'twitter:card', content: 'summary_large_image' },
          { name: 'twitter:title', content: 'Test Title' },
          { name: 'twitter:description', content: 'Test Description' }
        ])
      );
    });

    it('should include image tags when image is provided', () => {
      const tags = generateSocialMediaMetaTags(mockData);
      
      const ogImageTag = tags.openGraph.find(tag => tag.property === 'og:image');
      const twitterImageTag = tags.twitter.find(tag => tag.name === 'twitter:image');
      
      expect(ogImageTag).toBeDefined();
      expect(twitterImageTag).toBeDefined();
      expect(ogImageTag?.content).toContain('api/images/optimize');
    });

    it('should handle optional metadata', () => {
      const dataWithOptional = {
        ...mockData,
        publishedTime: '2024-01-01T00:00:00Z',
        modifiedTime: '2024-01-02T00:00:00Z',
        author: 'Test Author',
        section: 'Test Section',
        tags: ['tag1', 'tag2'],
        facebookAppId: '123456789'
      };

      const tags = generateSocialMediaMetaTags(dataWithOptional);
      
      expect(tags.openGraph).toEqual(
        expect.arrayContaining([
          { property: 'og:published_time', content: '2024-01-01T00:00:00Z' },
          { property: 'og:modified_time', content: '2024-01-02T00:00:00Z' },
          { property: 'og:author', content: 'Test Author' },
          { property: 'og:section', content: 'Test Section' },
          { property: 'og:tag', content: 'tag1' },
          { property: 'og:tag', content: 'tag2' }
        ])
      );

      expect(tags.facebook).toEqual(
        expect.arrayContaining([
          { property: 'fb:app_id', content: '123456789' }
        ])
      );
    });

    it('should handle different Twitter card types', () => {
      const summaryTags = generateSocialMediaMetaTags({
        ...mockData,
        twitterCardType: 'summary'
      });

      const largeTags = generateSocialMediaMetaTags({
        ...mockData,
        twitterCardType: 'summary_large_image'
      });

      expect(summaryTags.twitter).toEqual(
        expect.arrayContaining([
          { name: 'twitter:card', content: 'summary' }
        ])
      );

      expect(largeTags.twitter).toEqual(
        expect.arrayContaining([
          { name: 'twitter:card', content: 'summary_large_image' }
        ])
      );
    });
  });

  describe('validateImageForPlatform', () => {
    it('should validate file size for different platforms', () => {
      // Create mock files with different sizes
      const smallFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(smallFile, 'size', { value: 1024 * 1024 }); // 1MB

      const largeFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(largeFile, 'size', { value: 10 * 1024 * 1024 }); // 10MB

      const openGraphValidation = SocialMediaImageOptimizer.validateImageForPlatform(smallFile, 'openGraph');
      expect(openGraphValidation.isValid).toBe(true);

      const twitterValidation = SocialMediaImageOptimizer.validateImageForPlatform(largeFile, 'twitter');
      expect(twitterValidation.isValid).toBe(false);
      expect(twitterValidation.errors).toContain('Размер файла превышает 5.0MB для twitter');
    });

    it('should validate file formats for different platforms', () => {
      const jpgFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const gifFile = new File([''], 'test.gif', { type: 'image/gif' });

      const facebookJpgValidation = SocialMediaImageOptimizer.validateImageForPlatform(jpgFile, 'facebook');
      expect(facebookJpgValidation.isValid).toBe(true);

      const facebookGifValidation = SocialMediaImageOptimizer.validateImageForPlatform(gifFile, 'facebook');
      expect(facebookGifValidation.isValid).toBe(false);
      expect(facebookGifValidation.errors).toContain('Формат gif не поддерживается для facebook. Поддерживаемые форматы: jpg, png');

      const twitterGifValidation = SocialMediaImageOptimizer.validateImageForPlatform(gifFile, 'twitter');
      expect(twitterGifValidation.isValid).toBe(true);
    });
  });

  describe('SOCIAL_MEDIA_SPECS', () => {
    it('should have correct specifications for all platforms', () => {
      expect(SOCIAL_MEDIA_SPECS.openGraph).toEqual({
        width: 1200,
        height: 630,
        aspectRatio: '1.91:1',
        minWidth: 600,
        maxFileSize: 8 * 1024 * 1024,
        formats: ['jpg', 'png', 'webp']
      });

      expect(SOCIAL_MEDIA_SPECS.twitter).toEqual({
        width: 1200,
        height: 675,
        aspectRatio: '16:9',
        minWidth: 300,
        maxFileSize: 5 * 1024 * 1024,
        formats: ['jpg', 'png', 'webp', 'gif']
      });

      expect(SOCIAL_MEDIA_SPECS.facebook).toEqual({
        width: 1200,
        height: 630,
        aspectRatio: '1.91:1',
        minWidth: 600,
        maxFileSize: 8 * 1024 * 1024,
        formats: ['jpg', 'png']
      });

      expect(SOCIAL_MEDIA_SPECS.linkedin).toEqual({
        width: 1200,
        height: 627,
        aspectRatio: '1.91:1',
        minWidth: 520,
        maxFileSize: 5 * 1024 * 1024,
        formats: ['jpg', 'png']
      });
    });
  });
});