import { Metadata } from 'next';
import { SEOMetadataGenerator } from '@/lib/seo-metadata';
import MediaPageClient from './MediaPageClient';

// Generate metadata for media page
export async function generateMetadata(): Promise<Metadata> {
  const globalSettings = await SEOMetadataGenerator.fetchGlobalSettings();
  const pageSettings = await SEOMetadataGenerator.fetchPageSettings('media');

  return SEOMetadataGenerator.generateMetadata({
    content: null,
    globalSettings,
    pageSettings,
    pageType: 'media'
  });
}

export default function MediaPage() {
  return <MediaPageClient />;
}
