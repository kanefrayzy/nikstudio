import { Metadata } from 'next';
import { SEOMetadataGenerator } from '@/lib/seo-metadata';
import Header_mini from "@/components/Header_mini";
import Header_mobile from "@/components/Header_mobile";
import HomeContentServer from '@/app/HomeContentServer';
import LazyFooters from '@/components/LazyFooters';

// Generate metadata for homepage
export async function generateMetadata(): Promise<Metadata> {
  const globalSettings = await SEOMetadataGenerator.fetchGlobalSettings();
  const pageSettings = await SEOMetadataGenerator.fetchPageSettings('home');

  return SEOMetadataGenerator.generateMetadata({
    content: null,
    globalSettings,
    pageSettings,
    pageType: 'home'
  });
}

export default async function Home({
  searchParams
}: {
  searchParams: Promise<{ category_id?: string }>
}) {
  const params = await searchParams;
  const categoryId = params.category_id;

  return (
    <main className="flex flex-col min-h-screen bg-[#0E1011] overflow-x-hidden">
      {/* Header */}
      <Header_mobile />
      <div className="absolute top-0 right-0 w-full lg:w-1/2 z-10">
        <Header_mini />
      </div>

      {/* Content - Server Component with ISR */}
      <HomeContentServer categoryId={categoryId} />

      {/* Footer - Lazy loaded */}
      <LazyFooters />
    </main>
  );
}
