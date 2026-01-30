import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import StructuredDataComponent, { StructuredDataScript } from '@/components/StructuredDataComponent';
import { ContentWithSEO, SEOSettings } from '@/lib/seo-metadata';

// Mock environment variables
vi.mock('process', () => ({
  env: {
    NEXT_PUBLIC_API_URL: 'http://localhost:8000',
    NEXT_PUBLIC_SITE_URL: 'https://nikstudio.com'
  }
}));

describe('StructuredDataComponent', () => {
  const mockGlobalSettings: SEOSettings = {
    id: 1,
    site_title: 'NIK Studio',
    site_description: 'Комплексные решения для промышленных компаний',
    default_image: '/storage/images/default.jpg',
    twitter_card_type: 'summary_large_image',
    facebook_app_id: '123456789',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  };

  const mockProjectContent: ContentWithSEO = {
    seo_title: 'Test Project SEO Title',
    seo_description: 'Test project SEO description',
    seo_image: '/storage/images/project.jpg',
    title: 'Test Project',
    main_title: 'Test Project Main Title',
    description: 'Test project description',
    main_image: '/storage/images/project-main.jpg',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    slug: 'test-project'
  };

  const mockBlogContent: ContentWithSEO = {
    seo_title: 'Test Blog Post SEO Title',
    seo_description: 'Test blog post SEO description',
    seo_image: '/storage/images/blog.jpg',
    title: 'Test Blog Post',
    main_title: 'Test Blog Post Main Title',
    description: 'Test blog post description',
    main_image: '/storage/images/blog-main.jpg',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    slug: 'test-blog-post'
  };

  beforeEach(() => {
    // Clear any existing structured data scripts
    const existingScripts = document.querySelectorAll('script[type="application/ld+json"]');
    existingScripts.forEach(script => script.remove());
    
    // Clear any existing social media meta tags
    const existingMetas = document.querySelectorAll('meta[data-social-meta]');
    existingMetas.forEach(meta => meta.remove());
  });

  afterEach(() => {
    cleanup();
    // Clean up any scripts or meta tags added during tests
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    scripts.forEach(script => script.remove());
    
    const metas = document.querySelectorAll('meta[data-social-meta]');
    metas.forEach(meta => meta.remove());
  });

  describe('Client-side StructuredDataComponent', () => {
    it('should inject structured data script for homepage', () => {
      render(
        <StructuredDataComponent
          contentType="home"
          globalSettings={mockGlobalSettings}
        />
      );

      const script = document.querySelector('script[id="structured-data-home"]');
      expect(script).toBeTruthy();
      expect(script?.getAttribute('type')).toBe('application/ld+json');
      
      const jsonContent = JSON.parse(script?.textContent || '[]');
      expect(Array.isArray(jsonContent)).toBe(true);
      expect(jsonContent.length).toBeGreaterThan(0);
      
      // Should contain Organization and WebSite schemas
      const organizationSchema = jsonContent.find((schema: any) => schema['@type'] === 'Organization');
      const websiteSchema = jsonContent.find((schema: any) => schema['@type'] === 'WebSite');
      
      expect(organizationSchema).toBeTruthy();
      expect(websiteSchema).toBeTruthy();
      expect(organizationSchema.name).toBe('NIK Studio');
    });

    it('should inject structured data script for project page', () => {
      render(
        <StructuredDataComponent
          contentType="project"
          content={mockProjectContent}
          globalSettings={mockGlobalSettings}
          slug="test-project"
        />
      );

      const script = document.querySelector('script[id="structured-data-project"]');
      expect(script).toBeTruthy();
      
      const jsonContent = JSON.parse(script?.textContent || '[]');
      const creativeWorkSchema = jsonContent.find((schema: any) => schema['@type'] === 'CreativeWork');
      
      expect(creativeWorkSchema).toBeTruthy();
      expect(creativeWorkSchema.name).toBe('Test Project SEO Title');
      expect(creativeWorkSchema.description).toBe('Test project SEO description');
    });

    it('should inject structured data script for blog page', () => {
      render(
        <StructuredDataComponent
          contentType="blog"
          content={mockBlogContent}
          globalSettings={mockGlobalSettings}
          slug="test-blog-post"
        />
      );

      const script = document.querySelector('script[id="structured-data-blog"]');
      expect(script).toBeTruthy();
      
      const jsonContent = JSON.parse(script?.textContent || '[]');
      const articleSchema = jsonContent.find((schema: any) => schema['@type'] === 'Article');
      
      expect(articleSchema).toBeTruthy();
      expect(articleSchema.headline).toBe('Test Blog Post SEO Title');
      expect(articleSchema.description).toBe('Test blog post SEO description');
    });

    it('should inject social media meta tags when enabled', () => {
      render(
        <StructuredDataComponent
          contentType="project"
          content={mockProjectContent}
          globalSettings={mockGlobalSettings}
          slug="test-project"
          enableSocialOptimization={true}
        />
      );

      // Check for Open Graph tags
      const ogTitleTag = document.querySelector('meta[property="og:title"]');
      const ogDescriptionTag = document.querySelector('meta[property="og:description"]');
      const ogImageTag = document.querySelector('meta[property="og:image"]');
      
      expect(ogTitleTag).toBeTruthy();
      expect(ogDescriptionTag).toBeTruthy();
      expect(ogImageTag).toBeTruthy();
      
      expect(ogTitleTag?.getAttribute('content')).toBe('Test Project SEO Title');
      expect(ogDescriptionTag?.getAttribute('content')).toBe('Test project SEO description');

      // Check for Twitter Card tags
      const twitterCardTag = document.querySelector('meta[name="twitter:card"]');
      const twitterTitleTag = document.querySelector('meta[name="twitter:title"]');
      
      expect(twitterCardTag).toBeTruthy();
      expect(twitterTitleTag).toBeTruthy();
      expect(twitterCardTag?.getAttribute('content')).toBe('summary_large_image');
    });

    it('should not inject social media meta tags when disabled', () => {
      render(
        <StructuredDataComponent
          contentType="project"
          content={mockProjectContent}
          globalSettings={mockGlobalSettings}
          slug="test-project"
          enableSocialOptimization={false}
        />
      );

      // Should not have social media meta tags
      const ogTags = document.querySelectorAll('meta[data-social-meta="og"]');
      const twitterTags = document.querySelectorAll('meta[data-social-meta="twitter"]');
      
      expect(ogTags.length).toBe(0);
      expect(twitterTags.length).toBe(0);
    });

    it('should replace existing structured data script when re-rendered', () => {
      const { rerender } = render(
        <StructuredDataComponent
          contentType="project"
          content={mockProjectContent}
          globalSettings={mockGlobalSettings}
          slug="test-project"
        />
      );

      const firstScript = document.querySelector('script[id="structured-data-project"]');
      expect(firstScript).toBeTruthy();

      // Re-render with different content
      const updatedContent = { ...mockProjectContent, seo_title: 'Updated Project Title' };
      rerender(
        <StructuredDataComponent
          contentType="project"
          content={updatedContent}
          globalSettings={mockGlobalSettings}
          slug="test-project"
        />
      );

      const scripts = document.querySelectorAll('script[id="structured-data-project"]');
      expect(scripts.length).toBe(1); // Should only have one script

      const jsonContent = JSON.parse(scripts[0]?.textContent || '[]');
      const creativeWorkSchema = jsonContent.find((schema: any) => schema['@type'] === 'CreativeWork');
      expect(creativeWorkSchema.name).toBe('Updated Project Title');
    });

    it('should clean up scripts and meta tags on unmount', () => {
      const { unmount } = render(
        <StructuredDataComponent
          contentType="project"
          content={mockProjectContent}
          globalSettings={mockGlobalSettings}
          slug="test-project"
          enableSocialOptimization={true}
        />
      );

      // Verify elements exist
      expect(document.querySelector('script[id="structured-data-project"]')).toBeTruthy();
      expect(document.querySelectorAll('meta[data-social-meta]').length).toBeGreaterThan(0);

      // Unmount component
      unmount();

      // Verify cleanup
      expect(document.querySelector('script[id="structured-data-project"]')).toBeFalsy();
      expect(document.querySelectorAll('meta[data-social-meta]').length).toBe(0);
    });
  });

  describe('Server-side StructuredDataScript', () => {
    it('should render structured data script for homepage', () => {
      const { container } = render(
        <StructuredDataScript
          contentType="home"
          globalSettings={mockGlobalSettings}
        />
      );

      const script = container.querySelector('script[type="application/ld+json"]');
      expect(script).toBeTruthy();
      
      const jsonContent = JSON.parse(script?.textContent || '[]');
      expect(Array.isArray(jsonContent)).toBe(true);
      
      const organizationSchema = jsonContent.find((schema: any) => schema['@type'] === 'Organization');
      expect(organizationSchema).toBeTruthy();
    });

    it('should render social media meta tags when enabled', () => {
      const { container } = render(
        <StructuredDataScript
          contentType="project"
          content={mockProjectContent}
          globalSettings={mockGlobalSettings}
          slug="test-project"
          enableSocialOptimization={true}
        />
      );

      // Check that structured data script exists
      const script = container.querySelector('script[type="application/ld+json"]');
      expect(script).toBeTruthy();

      // Check that structured data script exists
      expect(script).toBeTruthy();
      
      // Verify the structured data contains the expected content
      const jsonContent = JSON.parse(script?.textContent || '[]');
      const creativeWorkSchema = jsonContent.find((schema: any) => schema['@type'] === 'CreativeWork');
      expect(creativeWorkSchema).toBeTruthy();
      expect(creativeWorkSchema.name).toBe('Test Project SEO Title');
    });

    it('should not render social media meta tags when disabled', () => {
      const { container } = render(
        <StructuredDataScript
          contentType="project"
          content={mockProjectContent}
          globalSettings={mockGlobalSettings}
          slug="test-project"
          enableSocialOptimization={false}
        />
      );

      const ogTags = container.querySelectorAll('meta[property^="og:"]');
      const twitterTags = container.querySelectorAll('meta[name^="twitter:"]');
      
      expect(ogTags.length).toBe(0);
      expect(twitterTags.length).toBe(0);
    });

    it('should still render organization schema when content is null', () => {
      const { container } = render(
        <StructuredDataScript
          contentType="project"
          content={null}
          globalSettings={null}
        />
      );

      const script = container.querySelector('script[type="application/ld+json"]');
      expect(script).toBeTruthy();
      
      // Should still have Organization schema even without content
      const jsonContent = JSON.parse(script?.textContent || '{}');
      expect(jsonContent['@type']).toBe('Organization');
      expect(jsonContent.name).toBe('NIK Studio'); // Default value
    });
  });
});