'use client';

import React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SocialMediaImageOptimizer } from '@/lib/social-media-optimization';
import { SEOSettings } from '@/lib/seo-metadata';

interface SEOPreviewProps {
  title: string;
  description: string;
  image?: string;
  url: string;
  siteName?: string;
  globalSettings?: SEOSettings | null;
  showPlatforms?: ('google' | 'facebook' | 'twitter' | 'linkedin')[];
}

interface SEOPreviewData {
  title: string;
  description: string;
  titleLength: number;
  descriptionLength: number;
  titleWarning: boolean;
  descriptionWarning: boolean;
  truncatedTitle: string;
  truncatedDescription: string;
}

/**
 * SEO Preview Component
 * Shows how content will appear in search results and social media
 */
export default function SEOPreview({
  title,
  description,
  image,
  url,
  siteName = 'NIK Studio',
  globalSettings,
  showPlatforms = ['google', 'facebook', 'twitter']
}: SEOPreviewProps) {
  // Generate preview data with validation
  const previewData = generatePreviewData(title, description);
  
  // Generate optimized images for different platforms
  const optimizedImages = image ? {
    openGraph: SocialMediaImageOptimizer.generateOpenGraphImage(image),
    twitter: SocialMediaImageOptimizer.generateTwitterImage(image, globalSettings?.twitter_card_type || 'summary_large_image'),
    facebook: SocialMediaImageOptimizer.generateFacebookImage(image),
    linkedin: SocialMediaImageOptimizer.generateLinkedInImage(image)
  } : null;

  return (
    <div className="space-y-6">
      {/* SEO Validation Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Анализ SEO</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Заголовок</span>
                <Badge variant={previewData.titleWarning ? 'destructive' : 'default'}>
                  {previewData.titleLength}/60
                </Badge>
              </div>
              {previewData.titleWarning && (
                <p className="text-sm text-red-600">
                  Заголовок превышает рекомендуемую длину в 60 символов
                </p>
              )}
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Описание</span>
                <Badge variant={previewData.descriptionWarning ? 'destructive' : 'default'}>
                  {previewData.descriptionLength}/160
                </Badge>
              </div>
              {previewData.descriptionWarning && (
                <p className="text-sm text-red-600">
                  Описание превышает рекомендуемую длину в 160 символов
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Platform Previews */}
      <div className="space-y-6">
        {showPlatforms.includes('google') && (
          <GoogleSearchPreview
            title={previewData.truncatedTitle}
            description={previewData.truncatedDescription}
            url={url}
          />
        )}

        {showPlatforms.includes('facebook') && (
          <FacebookPreview
            title={previewData.title}
            description={previewData.description}
            image={optimizedImages?.facebook}
            url={url}
            siteName={siteName}
          />
        )}

        {showPlatforms.includes('twitter') && (
          <TwitterPreview
            title={previewData.title}
            description={previewData.description}
            image={optimizedImages?.twitter}
            url={url}
            cardType={globalSettings?.twitter_card_type || 'summary_large_image'}
          />
        )}

        {showPlatforms.includes('linkedin') && (
          <LinkedInPreview
            title={previewData.title}
            description={previewData.description}
            image={optimizedImages?.linkedin}
            url={url}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Google Search Result Preview
 */
function GoogleSearchPreview({ title, description, url }: {
  title: string;
  description: string;
  url: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="w-5 h-5 bg-blue-500 rounded-sm flex items-center justify-center">
            <span className="text-white text-xs font-bold">G</span>
          </div>
          Google Search
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-white p-4 rounded border">
          <div className="space-y-1">
            <div className="text-sm text-green-700">{url}</div>
            <h3 className="text-xl text-blue-600 hover:underline cursor-pointer">
              {title}
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Facebook Share Preview
 */
function FacebookPreview({ title, description, image, url, siteName: _siteName }: {
  title: string;
  description: string;
  image?: string;
  url: string;
  siteName: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="w-5 h-5 bg-blue-600 rounded-sm flex items-center justify-center">
            <span className="text-white text-xs font-bold">f</span>
          </div>
          Facebook
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-white border rounded-lg overflow-hidden max-w-md">
          {image && (
            <div className="relative h-48 bg-gray-200">
              <Image
                src={image}
                alt={title}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}
          <div className="p-3 space-y-1">
            <div className="text-xs text-gray-500 uppercase">{new URL(url).hostname}</div>
            <h4 className="font-semibold text-gray-900 line-clamp-2">{title}</h4>
            <p className="text-sm text-gray-600 line-clamp-2">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Twitter Card Preview
 */
function TwitterPreview({ title, description, image, url, cardType }: {
  title: string;
  description: string;
  image?: string;
  url: string;
  cardType: 'summary' | 'summary_large_image';
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="w-5 h-5 bg-blue-400 rounded-sm flex items-center justify-center">
            <span className="text-white text-xs font-bold">T</span>
          </div>
          Twitter ({cardType === 'summary' ? 'Summary' : 'Large Image'})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-white border rounded-xl overflow-hidden max-w-md">
          {image && cardType === 'summary_large_image' && (
            <div className="relative h-48 bg-gray-200">
              <Image
                src={image}
                alt={title}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}
          <div className="p-3">
            <div className="flex gap-3">
              {image && cardType === 'summary' && (
                <div className="relative w-16 h-16 bg-gray-200 rounded flex-shrink-0">
                  <Image
                    src={image}
                    alt={title}
                    fill
                    className="object-cover rounded"
                    unoptimized
                  />
                </div>
              )}
              <div className="flex-1 space-y-1">
                <div className="text-xs text-gray-500">{new URL(url).hostname}</div>
                <h4 className="font-semibold text-gray-900 line-clamp-2">{title}</h4>
                <p className="text-sm text-gray-600 line-clamp-2">{description}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * LinkedIn Share Preview
 */
function LinkedInPreview({ title, description, image, url }: {
  title: string;
  description: string;
  image?: string;
  url: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="w-5 h-5 bg-blue-700 rounded-sm flex items-center justify-center">
            <span className="text-white text-xs font-bold">in</span>
          </div>
          LinkedIn
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-white border rounded-lg overflow-hidden max-w-md">
          {image && (
            <div className="relative h-48 bg-gray-200">
              <Image
                src={image}
                alt={title}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}
          <div className="p-3 space-y-1">
            <h4 className="font-semibold text-gray-900 line-clamp-2">{title}</h4>
            <p className="text-sm text-gray-600 line-clamp-3">{description}</p>
            <div className="text-xs text-gray-500">{new URL(url).hostname}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Generate preview data with validation
 */
function generatePreviewData(title: string, description: string): SEOPreviewData {
  const titleLength = title.length;
  const descriptionLength = description.length;
  
  const titleWarning = titleLength > 60;
  const descriptionWarning = descriptionLength > 160;
  
  // Truncate for Google search results
  const truncatedTitle = titleLength > 60 ? title.substring(0, 57) + '...' : title;
  const truncatedDescription = descriptionLength > 160 ? description.substring(0, 157) + '...' : description;
  
  return {
    title,
    description,
    titleLength,
    descriptionLength,
    titleWarning,
    descriptionWarning,
    truncatedTitle,
    truncatedDescription
  };
}