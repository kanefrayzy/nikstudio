'use client';

import React, { useEffect } from 'react';
import { StructuredDataGenerator, generateJSONLD } from '@/lib/structured-data';
import { ContentWithSEO, SEOSettings } from '@/lib/seo-metadata';
import { generateSocialMediaMetaTags } from '@/lib/social-media-optimization';

interface StructuredDataComponentProps {
  contentType: 'home' | 'blog' | 'project';
  content?: ContentWithSEO | null;
  globalSettings?: SEOSettings | null;
  slug?: string;
  enableSocialOptimization?: boolean;
}

/**
 * Component for injecting structured data (JSON-LD) and social media meta tags into page head
 * This component handles client-side structured data injection and social media optimization
 */
export default function StructuredDataComponent({
  contentType,
  content,
  globalSettings,
  slug,
  enableSocialOptimization = true
}: StructuredDataComponentProps) {
  useEffect(() => {
    // Generate structured data schemas
    const schemas = StructuredDataGenerator.generateStructuredData(
      contentType,
      content,
      globalSettings,
      slug
    );

    if (schemas.length === 0) return;

    // Generate JSON-LD content
    const jsonLdContent = generateJSONLD(schemas);

    // Create script element for structured data
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = jsonLdContent;
    script.id = `structured-data-${contentType}`;

    // Remove existing structured data script if present
    const existingScript = document.getElementById(`structured-data-${contentType}`);
    if (existingScript) {
      existingScript.remove();
    }

    // Add new script to head
    document.head.appendChild(script);

    // Add social media optimization if enabled
    if (enableSocialOptimization) {
      injectSocialMediaMetaTags(contentType, content, globalSettings, slug);
    }

    // Cleanup function
    return () => {
      const scriptToRemove = document.getElementById(`structured-data-${contentType}`);
      if (scriptToRemove) {
        scriptToRemove.remove();
      }

      // Clean up social media meta tags
      if (enableSocialOptimization) {
        cleanupSocialMediaMetaTags();
      }
    };
  }, [contentType, content, globalSettings, slug, enableSocialOptimization]);

  // This component doesn't render anything visible
  return null;
}

/**
 * Inject social media meta tags into document head
 */
function injectSocialMediaMetaTags(
  contentType: 'home' | 'blog' | 'project',
  content?: ContentWithSEO | null,
  globalSettings?: SEOSettings | null,
  slug?: string
) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nikstudio.com';
  const siteName = globalSettings?.site_title || 'NIK Studio';
  
  // Generate title and description
  const title = content?.seo_title || 
    (content?.title ? `${content.title} | ${siteName}` : siteName);
  
  const description = content?.seo_description || 
    content?.description || 
    globalSettings?.site_description || 
    'Комплексные решения для промышленных компаний';

  // Generate URL
  let url = baseUrl;
  if (contentType === 'project' && slug) {
    url = `${baseUrl}/projects/${slug}`;
  } else if (contentType === 'blog' && slug) {
    url = `${baseUrl}/blog/${slug}`;
  }

  // Get image
  const image = content?.seo_image || content?.main_image || globalSettings?.default_image;

  // Generate social media meta tags
  const socialTags = generateSocialMediaMetaTags({
    title,
    description,
    image: image || undefined,
    url,
    siteName,
    twitterCardType: globalSettings?.twitter_card_type || 'summary_large_image',
    facebookAppId: globalSettings?.facebook_app_id || undefined,
    publishedTime: content?.created_at,
    modifiedTime: content?.updated_at,
    author: 'NIK Studio',
    section: contentType === 'blog' ? 'Блог' : contentType === 'project' ? 'Проекты' : undefined
  });

  // Remove existing social media meta tags
  cleanupSocialMediaMetaTags();

  // Add Open Graph tags
  socialTags.openGraph.forEach(tag => {
    const meta = document.createElement('meta');
    meta.setAttribute('property', tag.property);
    meta.setAttribute('content', tag.content);
    meta.setAttribute('data-social-meta', 'og');
    document.head.appendChild(meta);
  });

  // Add Twitter Card tags
  socialTags.twitter.forEach(tag => {
    const meta = document.createElement('meta');
    meta.setAttribute('name', tag.name);
    meta.setAttribute('content', tag.content);
    meta.setAttribute('data-social-meta', 'twitter');
    document.head.appendChild(meta);
  });
}

/**
 * Clean up social media meta tags from document head
 */
function cleanupSocialMediaMetaTags() {
  const socialMetas = document.querySelectorAll('meta[data-social-meta]');
  socialMetas.forEach(meta => meta.remove());
}

/**
 * Server-side structured data script component
 * Use this for server-side rendering of structured data
 */
export function StructuredDataScript({
  contentType,
  content,
  globalSettings,
  slug,
  enableSocialOptimization = true
}: StructuredDataComponentProps) {
  // Generate structured data schemas
  const schemas = StructuredDataGenerator.generateStructuredData(
    contentType,
    content,
    globalSettings,
    slug
  );

  if (schemas.length === 0) return null;

  // Generate JSON-LD content
  const jsonLdContent = generateJSONLD(schemas);

  // Generate social media meta tags for server-side rendering
  const socialTags = enableSocialOptimization ? generateServerSideSocialTags(
    contentType,
    content,
    globalSettings,
    slug
  ) : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdContent }}
      />
      {socialTags && (
        <>
          {/* Open Graph tags */}
          {socialTags.openGraph.map((tag, index) => (
            <meta key={`og-${index}`} property={tag.property} content={tag.content} />
          ))}
          
          {/* Twitter Card tags */}
          {socialTags.twitter.map((tag, index) => (
            <meta key={`twitter-${index}`} name={tag.name} content={tag.content} />
          ))}
        </>
      )}
    </>
  );
}

/**
 * Generate social media tags for server-side rendering
 */
function generateServerSideSocialTags(
  contentType: 'home' | 'blog' | 'project',
  content?: ContentWithSEO | null,
  globalSettings?: SEOSettings | null,
  slug?: string
) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nikstudio.com';
  const siteName = globalSettings?.site_title || 'NIK Studio';
  
  // Generate title and description
  const title = content?.seo_title || 
    (content?.title ? `${content.title} | ${siteName}` : siteName);
  
  const description = content?.seo_description || 
    content?.description || 
    globalSettings?.site_description || 
    'Комплексные решения для промышленных компаний';

  // Generate URL
  let url = baseUrl;
  if (contentType === 'project' && slug) {
    url = `${baseUrl}/projects/${slug}`;
  } else if (contentType === 'blog' && slug) {
    url = `${baseUrl}/blog/${slug}`;
  }

  // Get image
  const image = content?.seo_image || content?.main_image || globalSettings?.default_image;

  // Generate social media meta tags
  return generateSocialMediaMetaTags({
    title,
    description,
    image: image || undefined,
    url,
    siteName,
    twitterCardType: globalSettings?.twitter_card_type || 'summary_large_image',
    facebookAppId: globalSettings?.facebook_app_id || undefined,
    publishedTime: content?.created_at,
    modifiedTime: content?.updated_at,
    author: 'NIK Studio',
    section: contentType === 'blog' ? 'Блог' : contentType === 'project' ? 'Проекты' : undefined
  });
}