import { ContentWithSEO, SEOSettings } from './seo-metadata';
import { SocialMediaImageOptimizer } from './social-media-optimization';

// Structured Data Schema Types
export interface OrganizationSchema {
  "@context": "https://schema.org";
  "@type": "Organization" | "Person";
  name: string;
  url: string;
  logo?: string;
  image?: string;
  sameAs?: string[];
  description?: string;
  contactPoint?: {
    "@type": "ContactPoint";
    contactType: string;
    email?: string;
    telephone?: string;
  };
  address?: {
    "@type": "PostalAddress";
    addressCountry: string;
    addressLocality?: string;
  };
}

export interface ArticleSchema {
  "@context": "https://schema.org";
  "@type": "Article";
  headline: string;
  description: string;
  image?: string;
  author: {
    "@type": "Person";
    name: string;
  };
  publisher: OrganizationSchema;
  datePublished: string;
  dateModified: string;
  url: string;
}

export interface CreativeWorkSchema {
  "@context": "https://schema.org";
  "@type": "CreativeWork";
  name: string;
  description: string;
  image?: string;
  creator: {
    "@type": "Person";
    name: string;
  };
  dateCreated: string;
  url: string;
}

export interface WebSiteSchema {
  "@context": "https://schema.org";
  "@type": "WebSite";
  name: string;
  url: string;
  description: string;
  potentialAction: {
    "@type": "SearchAction";
    target: string;
    "query-input": string;
  };
}

/**
 * Structured Data Generator for JSON-LD
 * Generates Schema.org structured data for different content types
 */
export class StructuredDataGenerator {
  private static readonly DEFAULT_AUTHOR = 'NIK Studio';
  private static readonly DEFAULT_ORGANIZATION = 'NIK Studio';

  /**
   * Generate Organization/Person schema for homepage
   */
  static generateOrganizationSchema(globalSettings?: SEOSettings | null): OrganizationSchema {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nikstudio.com';
    const siteName = globalSettings?.site_title || 'NIK Studio';
    const description = globalSettings?.site_description || 'Комплексные решения для промышленных компаний';
    
    // Generate optimized logo image
    const logoImage = globalSettings?.default_image ? 
      SocialMediaImageOptimizer.generateOpenGraphImage(globalSettings.default_image) : undefined;
    
    return {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: siteName,
      url: baseUrl,
      description,
      logo: logoImage,
      image: logoImage,
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer service",
        email: "info@nikstudio.com"
      },
      address: {
        "@type": "PostalAddress",
        addressCountry: "RU",
        addressLocality: "Москва"
      },
      sameAs: [
        // Add social media URLs here when available
        // "https://www.facebook.com/nikstudio",
        // "https://www.instagram.com/nikstudio",
        // "https://www.linkedin.com/company/nikstudio"
      ]
    };
  }

  /**
   * Generate WebSite schema for homepage
   */
  static generateWebSiteSchema(globalSettings?: SEOSettings | null): WebSiteSchema {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nikstudio.com';
    const siteName = globalSettings?.site_title || 'NIK Studio';
    const description = globalSettings?.site_description || 'Комплексные решения для промышленных компаний';

    return {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: siteName,
      url: baseUrl,
      description,
      potentialAction: {
        "@type": "SearchAction",
        target: `${baseUrl}/search?q={search_term_string}`,
        "query-input": "required name=search_term_string"
      }
    };
  }

  /**
   * Generate Article schema for blog posts
   */
  static generateArticleSchema(
    content: ContentWithSEO,
    globalSettings?: SEOSettings | null,
    slug?: string
  ): ArticleSchema {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nikstudio.com';
    const title = content.seo_title || content.title || content.main_title || 'Статья блога';
    const description = content.seo_description || content.description || '';
    const rawImage = this.getContentImage(content, globalSettings);
    
    // Generate optimized image for structured data
    const image = rawImage ? SocialMediaImageOptimizer.generateOpenGraphImage(rawImage) : undefined;
    
    const url = slug ? `${baseUrl}/blog/${slug}` : baseUrl;
    
    const publishedTime = content.created_at || new Date().toISOString();
    const modifiedTime = content.updated_at || publishedTime;

    return {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: title,
      description,
      image,
      author: {
        "@type": "Person",
        name: this.DEFAULT_AUTHOR
      },
      publisher: this.generateOrganizationSchema(globalSettings),
      datePublished: publishedTime,
      dateModified: modifiedTime,
      url
    };
  }

  /**
   * Generate CreativeWork schema for projects
   */
  static generateCreativeWorkSchema(
    content: ContentWithSEO,
    globalSettings?: SEOSettings | null,
    slug?: string
  ): CreativeWorkSchema {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nikstudio.com';
    const title = content.seo_title || content.title || content.main_title || 'Проект';
    const description = content.seo_description || content.description || '';
    const rawImage = this.getContentImage(content, globalSettings);
    
    // Generate optimized image for structured data
    const image = rawImage ? SocialMediaImageOptimizer.generateOpenGraphImage(rawImage) : undefined;
    
    const url = slug ? `${baseUrl}/projects/${slug}` : baseUrl;
    
    const createdTime = content.created_at || new Date().toISOString();

    return {
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      name: title,
      description,
      image,
      creator: {
        "@type": "Person",
        name: this.DEFAULT_AUTHOR
      },
      dateCreated: createdTime,
      url
    };
  }

  /**
   * Generate structured data based on content type
   */
  static generateStructuredData(
    contentType: 'home' | 'blog' | 'project',
    content?: ContentWithSEO | null,
    globalSettings?: SEOSettings | null,
    slug?: string
  ): object[] {
    const schemas: object[] = [];

    switch (contentType) {
      case 'home':
        schemas.push(this.generateOrganizationSchema(globalSettings));
        schemas.push(this.generateWebSiteSchema(globalSettings));
        break;
        
      case 'blog':
        if (content) {
          schemas.push(this.generateArticleSchema(content, globalSettings, slug));
        }
        schemas.push(this.generateOrganizationSchema(globalSettings));
        break;
        
      case 'project':
        if (content) {
          schemas.push(this.generateCreativeWorkSchema(content, globalSettings, slug));
        }
        schemas.push(this.generateOrganizationSchema(globalSettings));
        break;
    }

    return schemas;
  }

  /**
   * Get content image with fallback logic
   */
  private static getContentImage(
    content: ContentWithSEO,
    globalSettings?: SEOSettings | null
  ): string | undefined {
    // Use custom SEO image if available
    if (content.seo_image) {
      return this.normalizeImageUrl(content.seo_image);
    }

    // Fallback to content main image
    if (content.main_image) {
      return this.normalizeImageUrl(content.main_image);
    }

    // Fallback to global default image
    if (globalSettings?.default_image) {
      return this.normalizeImageUrl(globalSettings.default_image);
    }

    return undefined;
  }

  /**
   * Normalize image URL to full URL
   */
  private static normalizeImageUrl(imagePath: string): string {
    if (!imagePath) return '';

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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
}

/**
 * Generate JSON-LD script tag content
 */
export function generateJSONLD(schemas: object[]): string {
  if (schemas.length === 0) return '';
  
  if (schemas.length === 1) {
    return JSON.stringify(schemas[0], null, 2);
  }
  
  // Multiple schemas - wrap in array
  return JSON.stringify(schemas, null, 2);
}