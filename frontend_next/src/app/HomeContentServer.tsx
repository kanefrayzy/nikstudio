import Image from "next/image";
import Link from "next/link";
import React from "react";
import ServicesSection from '@/app/home/ServicesSection';
import ServiceSectionMobile from "@/app/home/ServicesSectionMobile";
import TestimonialsSection from '@/app/home/TestimonialsSection';
import MainContentSection from '@/app/home/MainContentSection';
import HeroVideoSection from '@/components/HeroVideoSection';
import HeroVideoErrorBoundary from '@/components/HeroVideoErrorBoundary';
import StructuredDataComponent from '@/components/StructuredDataComponent';
import { SEOMetadataGenerator } from '@/lib/seo-metadata';
import { getMediaUrl } from "@/lib/media-utils";
import ProjectsSection from '@/components/ProjectsSection';
import { getHomepageContent, getContentValue, getImageUrl, type HomepageContentBySections } from '@/lib/homepage-content';

interface Project {
  id: number;
  name: string;
  year: string;
  main_image: string;
  logo: string;
  main_title: string;
  alt_text: string;
  slug: string;
}

interface HomeContent {
  id: number;
  hero_video_url: string | null;
  hero_video_original_name: string | null;
  hero_video_size: number | null;
  formatted_video_size: string | null;
  hero_fallback_image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface HomeContentServerProps {
  categoryId?: string;
}

// Fetch home content with ISR
async function getHomeContent(): Promise<HomeContent | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const url = `${apiUrl}/api/home`;

    const response = await fetch(url, {
      next: { revalidate: 0 } // Always fetch fresh data
    });

    if (!response.ok) {
      console.error('Error fetching home content:', response.status);
      return null;
    }

    const data = await response.json();
    if (data.success) {
      return data.data;
    }
    return null;
  } catch (error) {
    console.error('Error fetching home content:', error);
    return null;
  }
}

// Fetch projects with ISR
async function getProjects(categoryId?: string | null): Promise<Project[]> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    let url = `${apiUrl}/api/projects`;

    if (categoryId) {
      url += `?category_id=${categoryId}`;
    }

    const response = await fetch(url, {
      next: { revalidate: 0 } // Always fetch fresh data
    });

    if (!response.ok) {
      console.error('Error fetching projects:', response.status);
      return [];
    }

    const data = await response.json();
    if (data.success && Array.isArray(data.data)) {
      return data.data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
}

export default async function HomeContentServer({ categoryId }: HomeContentServerProps) {
  const homeContent = await getHomeContent();
  const projects = await getProjects(categoryId);
  const globalSettings = await SEOMetadataGenerator.fetchGlobalSettings();

  // Fetch homepage CMS content with fallback
  let homepageContent: HomepageContentBySections | null = null;
  try {
    homepageContent = await getHomepageContent();
  } catch (error) {
    console.error('Error fetching homepage content, using fallback:', error);
    // Will use fallback values in components
  }

  const fallbackImage = homeContent?.hero_fallback_image_url 
    ? getMediaUrl(homeContent.hero_fallback_image_url, "/images/home/hero-image.png") 
    : "/images/home/hero-image.png";

  return (
    <>
      {/* Structured Data */}
      <StructuredDataComponent
        contentType="home"
        globalSettings={globalSettings}
      />

      {/* Hero */}
      <div className="flex flex-col lg:flex-row justify-center w-full relative">
        {/* Left Side - Video/Image - Fixed dimensions to prevent CLS */}
        <div className="w-full lg:w-1/2 bg-white relative h-[246px] sm:h-[540px] md:h-[720px] lg:h-[1080px]" style={{ aspectRatio: '1787/1810' }}>
          <HeroVideoErrorBoundary fallbackImage={fallbackImage}>
            <HeroVideoSection
              videoUrl={homeContent?.hero_video_url ? getMediaUrl(homeContent.hero_video_url) : undefined}
              fallbackImage={fallbackImage}
              className="w-full h-full"
            />
          </HeroVideoErrorBoundary>
        </div>

        {/* Right Side - Content */}
        <div className="w-full lg:w-1/2 flex flex-col justify-end">
          <div className="flex flex-col p-5 sm:p-12 lg:p-24 gap-12 lg:pt-[204px] lg:pb-[64px] h-full">
            <div className="flex flex-col items-center sm:items-start gap-12 lg:gap-[73px]">
              <Link href="/" className="hidden sm:block">
                <div className="relative w-[321.99px] h-[119.99px] scale-75 sm:scale-100" style={{ minWidth: '321.99px', minHeight: '119.99px' }}>
                  <Image
                    src={getImageUrl(homepageContent?.hero, 'hero_logo', '/images/home/nik-logo-hero.svg')}
                    alt="NIK Studio Logo"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </Link>

              <div className="flex flex-col gap-8 lg:gap-10 lg:mt-[38px]">
                <p className="text-white font-geometria text-[20px] sm:text-[30px] leading-[100%] w-full lg:w-[400px] xl:w-[500px] 2xl:w-[768px] w-full-3xl h-[90px] font-normal flex-none self-stretch">
                  {getContentValue(
                    homepageContent?.hero,
                    'hero_subtitle',
                    'Комплексные решения для промышленных компаний / подготовка к отраслевым выставкам / сопровождение / вывод продукта на новый рынок'
                  )}
                </p>
                <h1 className="text-white font-inter text-[32px] sm:text-[48px] leading-[100%] sm:leading-[130%] w-full lg:w-[400px] xl:w-[500px] 2xl:w-[768px] w-full-3xl h-[124px] font-semibold flex-none self-stretch sm:mt-15 xl:mt-15 2xl:mt-0">
                  {getContentValue(
                    homepageContent?.hero,
                    'hero_title',
                    'Превращаем сложные технологии в понятный визуал'
                  )}
                </h1>
                <div 
                  className="text-white/60 font-inter text-[16px] sm:text-[30px] leading-[100%] h-[240px] font-light flex-none -mt-[40px] sm:mt-40 xl:mt-25 2xl:mt-0"
                  dangerouslySetInnerHTML={{
                    __html: getContentValue(
                      homepageContent?.hero,
                      'hero_description',
                      'мультимедиа<br />брендинг<br />дизайн / презентации<br />коммерческая фотогорафия<br />3д-визуализация и анимация<br />видеопродакшн<br />создание сайтов'
                    )
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <MainContentSection content={homepageContent?.main_content} />

      {/* Projects Section - Client component for interactivity */}
      <ProjectsSection initialProjects={projects} initialCategoryId={categoryId} />

      {/* Other sections */}
      <div className="hidden sm:block">
        <ServicesSection content={homepageContent} />
      </div>
      <div className="block sm:hidden">
        <ServiceSectionMobile content={homepageContent} />
      </div>

      <TestimonialsSection content={homepageContent} />
    </>
  );
}
