/**
 * Social Media Image Optimization Utility
 * Handles image optimization for different social media platforms
 */

// import { seoImageOptimizer } from './seo-image-optimizer';

export interface SocialMediaImageSpecs {
  width: number;
  height: number;
  aspectRatio: string;
  minWidth?: number;
  maxFileSize?: number; // in bytes
  formats: string[];
}

export interface PlatformSpecs {
  openGraph: SocialMediaImageSpecs;
  twitter: SocialMediaImageSpecs;
  facebook: SocialMediaImageSpecs;
  linkedin: SocialMediaImageSpecs;
}

/**
 * Social media platform image specifications
 */
export const SOCIAL_MEDIA_SPECS: PlatformSpecs = {
  openGraph: {
    width: 1200,
    height: 630,
    aspectRatio: '1.91:1',
    minWidth: 600,
    maxFileSize: 8 * 1024 * 1024, // 8MB
    formats: ['jpg', 'png', 'webp']
  },
  twitter: {
    width: 1200,
    height: 675,
    aspectRatio: '16:9',
    minWidth: 300,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    formats: ['jpg', 'png', 'webp', 'gif']
  },
  facebook: {
    width: 1200,
    height: 630,
    aspectRatio: '1.91:1',
    minWidth: 600,
    maxFileSize: 8 * 1024 * 1024, // 8MB
    formats: ['jpg', 'png']
  },
  linkedin: {
    width: 1200,
    height: 627,
    aspectRatio: '1.91:1',
    minWidth: 520,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    formats: ['jpg', 'png']
  }
};

/**
 * Generate optimized image URLs for different social media platforms
 */
export class SocialMediaImageOptimizer {
  private static readonly DEFAULT_QUALITY = 85;
  private static readonly API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  /**
   * Generate optimized image URL for Open Graph
   */
  static generateOpenGraphImage(imagePath: string, options?: {
    width?: number;
    height?: number;
    quality?: number;
  }): string {
    const specs = SOCIAL_MEDIA_SPECS.openGraph;
    return this.generateOptimizedImageUrl(imagePath, {
      width: options?.width || specs.width,
      height: options?.height || specs.height,
      quality: options?.quality || this.DEFAULT_QUALITY,
      format: 'jpg'
    });
  }

  /**
   * Generate optimized image URL for Twitter Cards
   */
  static generateTwitterImage(imagePath: string, cardType: 'summary' | 'summary_large_image' = 'summary_large_image'): string {
    const specs = SOCIAL_MEDIA_SPECS.twitter;
    
    if (cardType === 'summary') {
      // Square image for summary card
      return this.generateOptimizedImageUrl(imagePath, {
        width: 300,
        height: 300,
        quality: this.DEFAULT_QUALITY,
        format: 'jpg'
      });
    }
    
    // Large image for summary_large_image card
    return this.generateOptimizedImageUrl(imagePath, {
      width: specs.width,
      height: specs.height,
      quality: this.DEFAULT_QUALITY,
      format: 'jpg'
    });
  }

  /**
   * Generate optimized image URL for Facebook
   */
  static generateFacebookImage(imagePath: string): string {
    const specs = SOCIAL_MEDIA_SPECS.facebook;
    return this.generateOptimizedImageUrl(imagePath, {
      width: specs.width,
      height: specs.height,
      quality: this.DEFAULT_QUALITY,
      format: 'jpg'
    });
  }

  /**
   * Generate optimized image URL for LinkedIn
   */
  static generateLinkedInImage(imagePath: string): string {
    const specs = SOCIAL_MEDIA_SPECS.linkedin;
    return this.generateOptimizedImageUrl(imagePath, {
      width: specs.width,
      height: specs.height,
      quality: this.DEFAULT_QUALITY,
      format: 'jpg'
    });
  }

  /**
   * Generate multiple optimized images for all platforms
   */
  static generateAllPlatformImages(imagePath: string): {
    openGraph: string;
    twitter: string;
    facebook: string;
    linkedin: string;
  } {
    return {
      openGraph: this.generateOpenGraphImage(imagePath),
      twitter: this.generateTwitterImage(imagePath),
      facebook: this.generateFacebookImage(imagePath),
      linkedin: this.generateLinkedInImage(imagePath)
    };
  }

  /**
   * Generate optimized image URL with parameters
   */
  private static generateOptimizedImageUrl(imagePath: string, options: {
    width: number;
    height: number;
    quality: number;
    format: string;
  }): string {
    if (!imagePath) return '';

    // If it's already a full URL (external images), return as is
    if (imagePath.startsWith('http')) {
      return imagePath;
    }

    // For local images, add optimization parameters
    const { width, height, quality, format } = options;
    const baseUrl = this.API_URL;
    
    // Extract the path part for optimization
    let pathForOptimization = imagePath;
    if (imagePath.startsWith('/storage/')) {
      pathForOptimization = imagePath.replace('/storage/', '');
    } else if (imagePath.startsWith('/')) {
      pathForOptimization = imagePath.substring(1);
    }
    
    // Construct optimized image URL
    // This assumes the backend has image optimization endpoint
    const optimizedUrl = `${baseUrl}/api/images/optimize?` + new URLSearchParams({
      path: pathForOptimization,
      w: width.toString(),
      h: height.toString(),
      q: quality.toString(),
      f: format
    }).toString();

    return optimizedUrl;
  }

  /**
   * Normalize image path to full URL
   */
  private static normalizeImagePath(imagePath: string): string {
    if (!imagePath) return '';

    // If already a full URL, return as is
    if (imagePath.startsWith('http')) {
      return imagePath;
    }

    // If starts with /storage/, add base URL
    if (imagePath.startsWith('/storage/')) {
      return `${this.API_URL}${imagePath}`;
    }

    // If starts with /, add base URL + storage
    if (imagePath.startsWith('/')) {
      return `${this.API_URL}/storage${imagePath}`;
    }

    // Otherwise, add full storage path
    return `${this.API_URL}/storage/${imagePath}`;
  }

  /**
   * Validate image for social media requirements
   */
  static validateImageForPlatform(
    imageFile: File, 
    platform: keyof PlatformSpecs
  ): { isValid: boolean; errors: string[] } {
    const specs = SOCIAL_MEDIA_SPECS[platform];
    const errors: string[] = [];

    // Check file size
    if (specs.maxFileSize && imageFile.size > specs.maxFileSize) {
      const maxSizeMB = (specs.maxFileSize / (1024 * 1024)).toFixed(1);
      errors.push(`Размер файла превышает ${maxSizeMB}MB для ${platform}`);
    }

    // Check file format
    const fileExtension = imageFile.name.split('.').pop()?.toLowerCase();
    if (fileExtension && !specs.formats.includes(fileExtension)) {
      errors.push(`Формат ${fileExtension} не поддерживается для ${platform}. Поддерживаемые форматы: ${specs.formats.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get image dimensions from file
   */
  static getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight
        });
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Не удалось загрузить изображение'));
      };

      img.src = url;
    });
  }

  /**
   * Check if image dimensions are suitable for platform
   */
  static async validateImageDimensions(
    file: File,
    platform: keyof PlatformSpecs
  ): Promise<{ isValid: boolean; errors: string[]; dimensions?: { width: number; height: number } }> {
    try {
      const dimensions = await this.getImageDimensions(file);
      const specs = SOCIAL_MEDIA_SPECS[platform];
      const errors: string[] = [];

      // Check minimum width
      if (specs.minWidth && dimensions.width < specs.minWidth) {
        errors.push(`Минимальная ширина для ${platform}: ${specs.minWidth}px (текущая: ${dimensions.width}px)`);
      }

      // Check aspect ratio (with some tolerance)
      const currentRatio = dimensions.width / dimensions.height;
      const expectedRatio = specs.width / specs.height;
      const tolerance = 0.1;

      if (Math.abs(currentRatio - expectedRatio) > tolerance) {
        errors.push(`Рекомендуемое соотношение сторон для ${platform}: ${specs.aspectRatio} (текущее: ${currentRatio.toFixed(2)}:1)`);
      }

      return {
        isValid: errors.length === 0,
        errors,
        dimensions
      };
    } catch {
      return {
        isValid: false,
        errors: ['Не удалось определить размеры изображения']
      };
    }
  }
}

/**
 * Generate social media meta tags
 */
export interface SocialMediaMetaTags {
  openGraph: Array<{ property: string; content: string }>;
  twitter: Array<{ name: string; content: string }>;
  facebook: Array<{ property: string; content: string }>;
}

export function generateSocialMediaMetaTags(data: {
  title: string;
  description: string;
  image?: string;
  url: string;
  siteName: string;
  twitterCardType?: 'summary' | 'summary_large_image';
  facebookAppId?: string;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
}): SocialMediaMetaTags {
  const {
    title,
    description,
    image,
    url,
    siteName,
    twitterCardType = 'summary_large_image',
    facebookAppId,
    publishedTime,
    modifiedTime,
    author,
    section,
    tags
  } = data;

  // Generate optimized images if image is provided
  const optimizedImages = image ? SocialMediaImageOptimizer.generateAllPlatformImages(image) : null;

  // Open Graph tags
  const openGraph = [
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:url', content: url },
    { property: 'og:site_name', content: siteName },
    { property: 'og:locale', content: 'ru_RU' },
    { property: 'og:type', content: 'website' }
  ];

  if (optimizedImages?.openGraph) {
    openGraph.push(
      { property: 'og:image', content: optimizedImages.openGraph },
      { property: 'og:image:width', content: SOCIAL_MEDIA_SPECS.openGraph.width.toString() },
      { property: 'og:image:height', content: SOCIAL_MEDIA_SPECS.openGraph.height.toString() },
      { property: 'og:image:alt', content: title }
    );
  }

  if (publishedTime) {
    openGraph.push({ property: 'og:published_time', content: publishedTime });
  }

  if (modifiedTime) {
    openGraph.push({ property: 'og:modified_time', content: modifiedTime });
  }

  if (author) {
    openGraph.push({ property: 'og:author', content: author });
  }

  if (section) {
    openGraph.push({ property: 'og:section', content: section });
  }

  if (tags && tags.length > 0) {
    tags.forEach(tag => {
      openGraph.push({ property: 'og:tag', content: tag });
    });
  }

  // Twitter Card tags
  const twitter = [
    { name: 'twitter:card', content: twitterCardType },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description }
  ];

  if (optimizedImages?.twitter) {
    twitter.push({ name: 'twitter:image', content: optimizedImages.twitter });
  }

  // Facebook specific tags
  const facebook = [...openGraph];

  if (facebookAppId) {
    facebook.push({ property: 'fb:app_id', content: facebookAppId });
  }

  return {
    openGraph,
    twitter,
    facebook
  };
}