import { Metadata } from 'next';
import { SocialMediaImageOptimizer } from './social-media-optimization';
import { seoCache, seoCacheInvalidator } from './seo-cache';
import { seoPerformanceMonitor } from './seo-performance-monitor';

// SEO Data Types
export interface SEOSettings {
  id: number;
  site_title: string;
  site_description: string;
  default_image: string | null;
  twitter_card_type: 'summary' | 'summary_large_image';
  facebook_app_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SEOMetadata {
  title: string;
  description: string;
  image?: string;
  url: string;
  type: 'website' | 'article' | 'profile';
  publishedTime?: string;
  modifiedTime?: string;
}

export interface ContentWithSEO {
  seo_title?: string | null;
  seo_description?: string | null;
  seo_image?: string | null;
  title?: string;
  main_title?: string;
  description?: string;
  main_image?: string;
  created_at?: string;
  updated_at?: string;
  slug?: string;
}

export interface PageSeoSettings {
  id: number;
  page_type: string;
  seo_title: string | null;
  seo_description: string | null;
  seo_image: string | null;
  seo_keywords: string[] | null;
  canonical_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GenerateMetadataProps {
  content: ContentWithSEO | null;
  globalSettings: SEOSettings | null;
  pageSettings?: PageSeoSettings | null;
  pageType: 'project' | 'blog' | 'home' | 'projects_list' | 'blog_list' | 'media';
  slug?: string;
}

/**
 * SEO Metadata Generator Utility Class
 * Handles dynamic metadata generation for different content types
 */
export class SEOMetadataGenerator {
  private static readonly DEFAULT_SETTINGS: Partial<SEOSettings> = {
    site_title: 'NIK Studio',
    site_description: 'Комплексные решения для промышленных компаний. Превращаем сложные технологии в понятный визуал.',
    twitter_card_type: 'summary_large_image'
  };

  /**
   * Generate complete metadata for Next.js pages with caching
   */
  static generateMetadata(props: GenerateMetadataProps): Metadata {
    const endTiming = seoPerformanceMonitor.startTiming('metadata-generation');

    try {
      // Try to get cached metadata first
      const cachedMetadata = seoCache.getPageMetadata(props.pageType, props.slug);
      if (cachedMetadata) {
        seoPerformanceMonitor.recordCacheAccess('metadata', true);
        endTiming();
        return this.buildNextjsMetadata(
          cachedMetadata,
          props.globalSettings,
          props.pageSettings || null,
          props.pageType
        );
      }

      seoPerformanceMonitor.recordCacheAccess('metadata', false);
      const seoData = this.generateSEOData(props);

      // Cache the generated metadata
      seoCache.cachePageMetadata(props.pageType, props.slug, seoData);

      const result = this.buildNextjsMetadata(
        seoData,
        props.globalSettings,
        props.pageSettings || null,
        props.pageType
      );
      endTiming();
      return result;
    } catch (error) {
      endTiming();
      throw error;
    }
  }

  /**
   * Build Next.js Metadata object from SEO data
   */
  private static buildNextjsMetadata(
    seoData: SEOMetadata,
    globalSettings: SEOSettings | null,
    pageSettings: PageSeoSettings | null,
    pageType: string
  ): Metadata {
    const twitterCardType = this.getGlobalSetting(globalSettings, 'twitter_card_type') as 'summary' | 'summary_large_image';

    // Generate optimized images for different platforms
    const optimizedImages = seoData.image ? {
      openGraph: SocialMediaImageOptimizer.generateOpenGraphImage(seoData.image),
      twitter: SocialMediaImageOptimizer.generateTwitterImage(seoData.image, twitterCardType)
    } : null;

    return {
      title: seoData.title,
      description: seoData.description,
      keywords: this.generateKeywords(pageSettings, pageType),
      openGraph: {
        title: seoData.title,
        description: seoData.description,
        url: seoData.url,
        siteName: this.getGlobalSetting(globalSettings, 'site_title'),
        images: optimizedImages?.openGraph ? [
          {
            url: optimizedImages.openGraph,
            width: 1200,
            height: 630,
            alt: seoData.title,
          },
        ] : undefined,
        locale: 'ru_RU',
        type: seoData.type,
        publishedTime: seoData.publishedTime,
        modifiedTime: seoData.modifiedTime,
      },
      twitter: {
        card: twitterCardType,
        title: seoData.title,
        description: seoData.description,
        images: optimizedImages?.twitter ? [optimizedImages.twitter] : undefined,
      },
      alternates: {
        canonical: seoData.url
      },
      robots: {
        index: true,
        follow: true,
      },
      other: {
        // Add Facebook App ID if available
        ...(globalSettings?.facebook_app_id && {
          'fb:app_id': globalSettings.facebook_app_id
        })
      }
    };
  }

  /**
   * Generate SEO data object
   */
  private static generateSEOData(props: GenerateMetadataProps): SEOMetadata {
    const { content, globalSettings, pageSettings, pageType, slug } = props;
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nikstudio.com';

    // Generate title with fallback logic
    const title = this.generateTitle(content, globalSettings, pageSettings || null, pageType);

    // Generate description with fallback logic
    const description = this.generateDescription(content, globalSettings, pageSettings || null, pageType);

    // Generate image URL with fallback logic
    const image = this.generateImageUrl(content, globalSettings, pageSettings || null);

    // Generate page URL
    const url = this.generatePageUrl(baseUrl, pageType, slug);

    // Determine content type
    const type = this.getContentType(pageType);

    return {
      title,
      description,
      image,
      url,
      type,
      publishedTime: content?.created_at,
      modifiedTime: content?.updated_at,
    };
  }

  /**
   * Generate page title with fallback logic
   */
  private static generateTitle(
    content: ContentWithSEO | null,
    globalSettings: SEOSettings | null,
    pageSettings: PageSeoSettings | null,
    pageType: string
  ): string {
    const siteTitle = this.getGlobalSetting(globalSettings, 'site_title');

    // For list pages and special pages (home, media) use pageSettings
    if (pageSettings?.seo_title) {
      return pageSettings.seo_title;
    }

    // For individual content use content.seo_title
    if (content?.seo_title) {
      return content.seo_title;
    }

    // Fallback to content title (for individual content)
    const contentTitle = content?.title || content?.main_title;
    if (contentTitle) {
      return `${contentTitle} | ${siteTitle}`;
    }

    // Default titles by page type
    switch (pageType) {
      case 'project':
        return `Проект | ${siteTitle}`;
      case 'blog':
        return `Блог | ${siteTitle}`;
      case 'projects_list':
        return `Проекты | ${siteTitle}`;
      case 'blog_list':
        return `Блог | ${siteTitle}`;
      case 'media':
        return `Медиа | ${siteTitle}`;
      case 'home':
      default:
        return siteTitle;
    }
  }

  /**
   * Generate page description with fallback logic
   */
  private static generateDescription(
    content: ContentWithSEO | null,
    globalSettings: SEOSettings | null,
    pageSettings: PageSeoSettings | null,
    _pageType: string
  ): string {
    // For list pages and special pages (home, media) use pageSettings
    if (pageSettings?.seo_description) {
      return pageSettings.seo_description;
    }

    // For individual content use content.seo_description
    if (content?.seo_description) {
      return content.seo_description;
    }

    // Fallback to content description (for individual content)
    if (content?.description) {
      return content.description;
    }

    // Fallback to global settings
    const globalDescription = this.getGlobalSetting(globalSettings, 'site_description');
    return globalDescription;
  }

  /**
   * Generate image URL with fallback logic
   */
  private static generateImageUrl(
    content: ContentWithSEO | null,
    globalSettings: SEOSettings | null,
    pageSettings: PageSeoSettings | null
  ): string | undefined {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    // Use custom SEO image if available (for individual content)
    if (content?.seo_image) {
      return this.normalizeImageUrl(content.seo_image, baseUrl);
    }

    // Use page-specific SEO image (for list pages)
    if (pageSettings?.seo_image) {
      return this.normalizeImageUrl(pageSettings.seo_image, baseUrl);
    }

    // Fallback to content main image (for individual content)
    if (content?.main_image) {
      return this.normalizeImageUrl(content.main_image, baseUrl);
    }

    // Fallback to global default image
    if (globalSettings?.default_image) {
      return this.normalizeImageUrl(globalSettings.default_image, baseUrl);
    }

    return undefined;
  }

  /**
   * Normalize image URL to full URL
   */
  private static normalizeImageUrl(imagePath: string, baseUrl: string): string {
    if (!imagePath) return '';

    // If already a full URL, return as is
    if (imagePath.startsWith('http')) {
      return imagePath;
    }

    // If starts with /storage/, add base URL
    if (imagePath.startsWith('/storage/')) {
      return `${baseUrl}${imagePath}`;
    }

    // If starts with /, add base URL + storage
    if (imagePath.startsWith('/')) {
      return `${baseUrl}/storage${imagePath}`;
    }

    // Otherwise, add full storage path
    return `${baseUrl}/storage/${imagePath}`;
  }

  /**
   * Generate page URL
   */
  private static generatePageUrl(baseUrl: string, pageType: string, slug?: string): string {
    switch (pageType) {
      case 'project':
        return slug ? `${baseUrl}/projects/${slug}` : `${baseUrl}/projects`;
      case 'blog':
        return slug ? `${baseUrl}/blog/${slug}` : `${baseUrl}/blog`;
      case 'projects_list':
        return `${baseUrl}/projects`;
      case 'blog_list':
        return `${baseUrl}/blog`;
      case 'home':
      default:
        return baseUrl;
    }
  }

  /**
   * Get content type for Open Graph
   */
  private static getContentType(pageType: string): 'website' | 'article' | 'profile' {
    switch (pageType) {
      case 'blog':
        return 'article';
      case 'project':
        return 'article';
      case 'home':
      default:
        return 'website';
    }
  }

  /**
   * Generate keywords based on page type
   */
  private static generateKeywords(
    pageSettings: PageSeoSettings | null,
    pageType: string
  ): string[] {
    // Use keywords from pageSettings if available
    if (pageSettings?.seo_keywords && Array.isArray(pageSettings.seo_keywords)) {
      return pageSettings.seo_keywords;
    }

    // Fallback to default keywords
    const baseKeywords = ['NIK Studio', 'дизайн', 'брендинг', 'визуализация'];

    switch (pageType) {
      case 'project':
        return [...baseKeywords, 'проекты', 'портфолио', 'кейсы'];
      case 'blog':
      case 'blog_list':
        return [...baseKeywords, 'блог', 'статьи', 'новости'];
      case 'projects_list':
        return [...baseKeywords, 'проекты', 'портфолио', 'кейсы'];
      case 'media':
        return [...baseKeywords, 'медиа', 'галерея', 'видео'];
      case 'home':
      default:
        return [...baseKeywords, 'промышленный дизайн', '3д-анимация', 'видеопродакшн'];
    }
  }

  /**
   * Get global setting with fallback
   */
  private static getGlobalSetting<K extends keyof SEOSettings>(
    globalSettings: SEOSettings | null,
    key: K
  ): SEOSettings[K] {
    if (globalSettings && globalSettings[key] !== null && globalSettings[key] !== undefined) {
      return globalSettings[key];
    }

    return (this.DEFAULT_SETTINGS[key] as SEOSettings[K]) || '' as SEOSettings[K];
  }

  /**
   * Fetch global SEO settings from API with caching
   */
  static async fetchGlobalSettings(): Promise<SEOSettings | null> {
    const endTiming = seoPerformanceMonitor.startTiming('global-settings-fetch');

    try {
      // Try to get cached settings first
      const cachedSettings = seoCache.getGlobalSettings();
      if (cachedSettings) {
        seoPerformanceMonitor.recordCacheAccess('global-settings', true);
        endTiming();
        return cachedSettings;
      }

      seoPerformanceMonitor.recordCacheAccess('global-settings', false);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/seo/settings`, {
        next: { revalidate: 300 } // Кешируем на 5 минут вместо no-store
      });

      if (!response.ok) {
        console.warn('Failed to fetch global SEO settings, using defaults');
        endTiming();
        return null;
      }

      const data = await response.json();
      const settings = data.success ? data.data : null;

      // Cache the fetched settings
      if (settings) {
        seoCache.cacheGlobalSettings(settings);
      }

      endTiming();
      return settings;
    } catch (error) {
      console.warn('Error fetching global SEO settings:', error);
      endTiming();
      return null;
    }
  }

  /**
   * Invalidate cache when content is updated
   */
  static invalidateContentCache(contentType: 'project' | 'blog', slug: string): void {
    seoCacheInvalidator.onContentUpdate(contentType, slug);
  }

  /**
   * Fetch page SEO settings from API with caching
   */
  static async fetchPageSettings(pageType: string): Promise<PageSeoSettings | null> {
    const endTiming = seoPerformanceMonitor.startTiming('page-settings-fetch');

    try {
      // Try to get cached settings first
      // Note: Page settings caching not implemented yet
      const cachedSettings = null;
      if (cachedSettings) {
        seoPerformanceMonitor.recordCacheAccess('page-settings', true);
        endTiming();
        return cachedSettings;
      }

      seoPerformanceMonitor.recordCacheAccess('page-settings', false);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/seo/pages`, {
        next: { revalidate: 300 } // Кешируем на 5 минут вместо no-store
      });

      if (!response.ok) {
        console.warn('Failed to fetch page SEO settings, using defaults');
        endTiming();
        return null;
      }

      const data = await response.json();
      const allPageSettings = data.success ? data.data : {};
      const pageSettings = allPageSettings[pageType] || null;

      // Cache the fetched settings
      // Note: Page settings caching not implemented yet
      if (pageSettings) {
        // TODO: Implement page settings caching
      }

      endTiming();
      return pageSettings;
    } catch (error) {
      console.warn('Error fetching page SEO settings:', error);
      endTiming();
      return null;
    }
  }

  /**
   * Invalidate cache when global settings are updated
   */
  static invalidateGlobalCache(): void {
    seoCacheInvalidator.onGlobalSettingsUpdate();
  }

  /**
   * Invalidate cache when page settings are updated
   */
  static invalidatePageCache(_pageType: string): void {
    // Note: Page-specific cache invalidation not implemented yet
    // For now, invalidate all cache
    seoCacheInvalidator.onGlobalSettingsUpdate();
  }
}
