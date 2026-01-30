'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, Search, Twitter, Eye } from 'lucide-react';

interface GlobalSEOPreviewProps {
  siteTitle: string;
  siteDescription: string;
  defaultImage?: string;
  twitterCardType: 'summary' | 'summary_large_image';
}

export default function GlobalSEOPreview({
  siteTitle,
  siteDescription,
  defaultImage,
  twitterCardType
}: GlobalSEOPreviewProps) {
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const displayTitle = truncateText(siteTitle, 60);
  const displayDescription = truncateText(siteDescription, 160);
  const imageUrl = defaultImage ? 
    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${defaultImage}` : 
    null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Предварительный просмотр
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Google Search Preview */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Search className="h-4 w-4" />
            <span className="font-medium">Поиск Google</span>
          </div>
          <div className="border rounded-lg p-4 bg-white">
            <div className="text-blue-600 text-lg hover:underline cursor-pointer">
              {displayTitle}
            </div>
            <div className="text-green-700 text-sm mt-1">
              {process.env.NEXT_PUBLIC_SITE_URL || 'https://nikstudio.com'}
            </div>
            <div className="text-gray-600 text-sm mt-2">
              {displayDescription}
            </div>
          </div>
        </div>

        {/* Social Media Preview */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Globe className="h-4 w-4" />
            <span className="font-medium">Социальные сети</span>
          </div>
          <div className="border rounded-lg overflow-hidden bg-white">
            {imageUrl && (
              <div className="aspect-video bg-gray-100 flex items-center justify-center">
                <img
                  src={imageUrl}
                  alt="Предварительный просмотр изображения"
                  className="max-w-full max-h-full object-cover"
                />
              </div>
            )}
            <div className="p-4">
              <div className="font-semibold text-gray-900 mb-1">
                {displayTitle}
              </div>
              <div className="text-gray-600 text-sm mb-2">
                {displayDescription}
              </div>
              <div className="text-gray-500 text-xs uppercase">
                {process.env.NEXT_PUBLIC_SITE_URL?.replace('https://', '') || 'nikstudio.com'}
              </div>
            </div>
          </div>
        </div>

        {/* Twitter Card Preview */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Twitter className="h-4 w-4" />
            <span className="font-medium">Twitter Card ({twitterCardType})</span>
          </div>
          <div className="border rounded-lg overflow-hidden bg-white max-w-md">
            {imageUrl && twitterCardType === 'summary_large_image' && (
              <div className="aspect-video bg-gray-100 flex items-center justify-center">
                <img
                  src={imageUrl}
                  alt="Twitter Card изображение"
                  className="max-w-full max-h-full object-cover"
                />
              </div>
            )}
            <div className="p-3">
              <div className="flex items-start gap-3">
                {imageUrl && twitterCardType === 'summary' && (
                  <div className="w-16 h-16 bg-gray-100 rounded flex-shrink-0 flex items-center justify-center">
                    <img
                      src={imageUrl}
                      alt="Twitter Card изображение"
                      className="max-w-full max-h-full object-cover rounded"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 text-sm mb-1">
                    {displayTitle}
                  </div>
                  <div className="text-gray-600 text-sm mb-1">
                    {displayDescription}
                  </div>
                  <div className="text-gray-500 text-xs">
                    {process.env.NEXT_PUBLIC_SITE_URL?.replace('https://', '') || 'nikstudio.com'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}