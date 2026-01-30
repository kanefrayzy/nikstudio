'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import dynamic from 'next/dynamic';
// import Link from 'next/link';
import Header from '@/components/Header';
import Header_mobile from "@/components/Header_mobile";
import Footer from '@/components/Footer';
import FooterMobile from "@/components/Footer_mobile";
import ContactForm from '@/components/ContactForm';
import StructuredDataComponent from '@/components/StructuredDataComponent';
import { SEOMetadataGenerator } from '@/lib/seo-metadata';
import { Project, ApiResponse, ProjectDetailHeroMedia, ProjectDetailBlockMedia } from './types';

// Lazy load CarouselWithLightboxBasic with skeleton loader
const CarouselWithLightboxBasic = dynamic(() => import('@/app/components/CarouselWithLightboxBasic'), {
  loading: () => (
    <div className="relative w-full h-[200px] sm:h-[500px] lg:h-[1080px] bg-[#181A1B] animate-pulse">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
      </div>
    </div>
  ),
  ssr: false,
});

// Утилитарная функция для нормализации путей к медиа файлам
function normalizePath(path: string, isVideo: boolean = false): string {
  if (!path) return '';

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // Если путь уже начинается с http, возвращаем как есть
  if (path.startsWith('http')) return path;

  // Для видео файлов используем /api/video/ для поддержки Range requests
  if (isVideo) {
    // Убираем /storage/ префикс если есть
    const cleanPath = path.startsWith('/storage/') ? path.substring(9) : path.startsWith('/') ? path.substring(1) : path;
    return `${apiUrl}/api/video/${cleanPath}`;
  }
  // Для изображений используем полный URL с API
  else {
    // Если путь начинается с /storage/, добавляем apiUrl
    if (path.startsWith('/storage/')) return `${apiUrl}${path}`;

    // Если путь начинается с /, добавляем apiUrl/storage
    if (path.startsWith('/')) return `${apiUrl}/storage${path}`;

    // В остальных случаях добавляем apiUrl/storage/ префикс
    return `${apiUrl}/storage/${path}`;
  }
}

// Функция для преобразования данных из БД в формат для CarouselWithLightbox
function transformBlockMediaToCarouselFormat(mediaItems: ProjectDetailBlockMedia[]) {
  if (!mediaItems || mediaItems.length === 0) {
    return [];
  }

  // Группируем по group_id
  const groupedItems = mediaItems.reduce((acc, item) => {
    if (!acc[item.group_id]) {
      acc[item.group_id] = [];
    }
    acc[item.group_id].push(item);
    return acc;
  }, {} as Record<number, ProjectDetailBlockMedia[]>);

  // Преобразуем в нужный формат
  return Object.values(groupedItems).map((groupItems: ProjectDetailBlockMedia[]) => {
    const firstItem = groupItems[0];

    return {
      id: firstItem.group_id,
      type: firstItem.group_type,
      items: groupItems.map((item: ProjectDetailBlockMedia) => ({
        type: item.file_type,
        src: normalizePath(item.file_path, item.file_type === 'video'),
        alt: item.alt_text,
        poster: item.poster_path ? normalizePath(item.poster_path) : undefined,
      }))
    };
  });
}

// Функция для преобразования данных из БД в формат для CarouselWithLightbox
function transformHeroMediaToCarouselFormat(heroMediaItems: ProjectDetailHeroMedia[]) {
  if (!heroMediaItems || heroMediaItems.length === 0) {
    return [];
  }

  // Группируем по group_id
  const groupedItems = heroMediaItems.reduce((acc, item) => {
    if (!acc[item.group_id]) {
      acc[item.group_id] = [];
    }
    acc[item.group_id].push(item);
    return acc;
  }, {} as Record<number, ProjectDetailHeroMedia[]>);

  // Преобразуем в нужный формат
  return Object.values(groupedItems).map((groupItems) => {
    const firstItem = groupItems[0];

    return {
      id: firstItem.group_id,
      type: firstItem.group_type,
      items: groupItems.map((item) => ({
        type: item.file_type,
        src: normalizePath(item.file_path, item.file_type === 'video'),
        alt: item.alt_text,
        poster: item.poster_path ? normalizePath(item.poster_path) : undefined,
      }))
    };
  });
}

export default function ProjectDetailClient() {
  const params = useParams();
  const slug = params.slug as string;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [globalSettings, setGlobalSettings] = useState<any>(null);

  useEffect(() => {
    async function fetchProject() {
      if (!slug) return;

      try {
        setLoading(true);
        setError(null);

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiUrl}/api/projects/${slug}`, {
          // Add caching for client-side requests
          next: { revalidate: 1800 }, // Cache for 30 minutes
          // Request deduplication
          cache: 'force-cache'
        });

        if (!response.ok) {
          if (response.status === 404) {
            setError('Проект не найден');
          } else {
            setError('Ошибка при загрузке проекта');
          }
          return;
        }

        const data: ApiResponse<any> = await response.json();

        if (data.success && data.data) {
          setProject(data.data);
          
          // Invalidate cache when project is viewed (for analytics)
          SEOMetadataGenerator.invalidateContentCache('project', slug);
        } else {
          setError('Проект не найден');
        }

        // Fetch global SEO settings
        const globalSettingsData = await SEOMetadataGenerator.fetchGlobalSettings();
        setGlobalSettings(globalSettingsData);

      } catch (err) {
        console.error('Ошибка при загрузке проекта:', err);
        setError('Ошибка при загрузке проекта');
      } finally {
        setLoading(false);
      }
    }

    fetchProject();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E1011] flex items-center justify-center">
        <div className="text-white text-xl">Загрузка проекта...</div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-[#0E1011] flex items-center justify-center">
        <div className="text-white text-xl">{error || 'Проект не найден'}</div>
      </div>
    );
  }

  // Transform media data for carousel components
  const heroMediaItems = project?.detail?.hero_media_items || [];
  const heroMediaGroups = transformHeroMediaToCarouselFormat(heroMediaItems);

  return (
    <div className="min-h-screen bg-[#0E1011] overflow-x-hidden">
      {/* Structured Data */}
      <StructuredDataComponent
        contentType="project"
        content={project}
        globalSettings={globalSettings}
      />

      {/* Header */}
      <Header_mobile />
      <Header />

      {/* Main Content */}
      <main className="pt-20 lg:pt-32">
        {/* Hero Section */}
        <section className="w-full flex flex-col items-stretch">
          {/* Hero Content */}
          <div className="w-full flex flex-col gap-20 px-5 sm:px-12 lg:px-24 mt-[7px] sm:mt-0 sm:pt-[150px] pb-16 sm:pb-[64px]">
            <div className="w-full flex flex-col">
              <h1 className="font-geometria font-extrabold text-[60px] sm:text-[140px] lg:text-[280px] uppercase leading-[100%] sm:leading-[100%] text-white break-words hyphens-auto" lang="ru">
                {project?.detail?.title || project.main_title}
              </h1>
              {(project?.detail?.subtitle || project.projects_page_title) && (
                <p className="font-inter font-semibold text-[32px] sm:text-4xl lg:text-[80px] leading-[100%] sm:leading-[120%] tracking-normal sm:-tracking-[2px] text-white max-w-[1400px] max-w-full-3xl mt-[30px] sm:mt-2">
                  {project?.detail?.subtitle || project.projects_page_title}
                </p>
              )}
            </div>

            <div className="flex flex-col lg:flex-row justify-between -mt-[64px] sm:mt-0">
              {(project?.detail?.client) && (
                <div className="flex flex-col gap-4 w-full">
                  <p className="font-geometria font-light sm:font-normal text-[24px] lg:text-[30px] text-white/60 leading-none">
                    Клиент
                  </p>
                  <p className="font-inter font-semibold text-[24px] lg:text-[32px] text-white leading-[130%] -tracking-[0.5px]">
                    {project.detail.client}
                  </p>
                </div>
              )}
              <div className="flex flex-col gap-4 xl:ml-0 2xl:-ml-51 mt-[20px] sm:mt-0">
                <p className="font-geometria font-light sm:font-normal text-[24px] lg:text-[30px] text-white/60 leading-none">
                  Год
                </p>
                <p className="font-inter font-semibold text-[24px] lg:text-[32px] text-white leading-[130%] -tracking-[0.5px]">
                  {project?.detail?.year || project.year}
                </p>
              </div>
              <div className="flex flex-col gap-4 lg:ml-40 mt-[20px] sm:mt-0">
                <p className="font-geometria font-light sm:font-normal text-[24px] lg:text-[30px] text-white/60 leading-none">
                  Услуги
                </p>
                <p className="font-inter font-semibold text-[24px] lg:text-[32px] text-white leading-[130%] -tracking-[0.5px]">
                  {project.categories.map(cat => cat.name).join(', ') || 'Брендинг, фото, видео, 3д-анимация, презентация, сайт, сопровождение'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Hero Image Carousel */}
        {heroMediaGroups.length > 0 && (
          <CarouselWithLightboxBasic images={heroMediaGroups} className="-mt-[45px] sm:mt-0" />
        )}

        {/* Dynamic Blocks */}
        {project.detail?.blocks && project.detail.blocks.length > 0 && (
          project.detail.blocks.map((block, index) => {
            const blockMediaItems = block.media_items || [];
            const blockCarouselData = transformBlockMediaToCarouselFormat(blockMediaItems);

            return (
              <div key={block.id}>
                {/* Block Section */}
                <section className="w-full flex flex-col sm:flex-row gap-6 sm:gap-12 lg:gap-24 px-5 sm:px-12 lg:px-24 py-16 sm:py-24 lg:py-[96px] lg:pb-[128px] mt-[20px] sm:mt-[70px]">
                  <h2 className="font-geometria font-extrabold sm:font-bold text-[60px] md:text-7xl xl:text-[128px] uppercase leading-[120%] sm:leading-[100%] text-white w-full max-w-[640px] break-words hyphens-auto" lang="ru">
                    {block.title}
                  </h2>
                  <div className="flex flex-col justify-center gap-10 sm:gap-16 lg:gap-20 w-full -mt-[1px] sm:mt-0">
                    <div className="flex flex-col gap-6 sm:gap-8">
                      <h3 className="font-inter font-semibold text-[20px] sm:text-3xl lg:text-[48px] leading-[120%] sm:leading-[130%] -tracking-[1px] sm:-tracking-[0.5px] text-white">
                        {block.subtitle}
                      </h3>
                      <div
                        className="font-inter font-normal text-[16px] sm:text-xl lg:text-[22px] leading-[100%] sm:leading-[170%] text-white/60 max-w-[992px] max-w-full-3xl -mt-[5px] sm:mt-0"
                        dangerouslySetInnerHTML={{ __html: block.content }}
                      />
                    </div>
                  </div>
                </section>

                {/* Block Gallery - динамическое отображение */}
                {blockCarouselData.length > 0 && (
                  <section className="flex flex-col gap-6 sm:-mt-9">
                    <CarouselWithLightboxBasic
                      images={blockCarouselData}
                      className={index === 0 ? 'mt-[12px] sm:mt-0' :
                        index === 1 ? '-mt-[50px] sm:mt-0' :
                          '-mt-[25px] sm:mt-0'}
                    />
                  </section>
                )}
              </div>
            );
          })
        )}

        {/* Contact Section */}
        <section className="w-full flex flex-col lg:flex-row pb-[90px] sm:pb-0 mt-[100px] sm:mt-[150px]">
          {/* Left Image */}
          <div className="w-full lg:w-1/2 h-[350px] sm:h-[600px] lg:h-[1175px] bg-white relative">
            <Image
              src="/images/project_single/contact_image.jpg"
              alt="Связаться с нами"
              fill
              className="object-cover"
            />
          </div>

          {/* Right Form */}
          <div className="w-full lg:w-1/2 flex flex-col justify-center p-5 sm:p-16 lg:p-24 bg-[#0E1011] mt-[60px] sm:-mt-2">
            <div className="w-full max-w-[768px] flex flex-col gap-8 sm:gap-16 lg:gap-24 max-w-full-3xl">
              <div className="flex flex-col gap-4 mb-18">
                <h2 className="font-geometria font-bold text-[40px] sm:text-5xl xl:text-[80px] uppercase leading-[130%] sm:leading-[1.1] text-white tracking-[-1px] sm:tracking-normal">
                  интересует подобный проект ?
                </h2>
                <p className="font-inter font-normal text-[16px] sm:text-xl lg:text-[24px] leading-[180%] sm:leading-[1.7] text-white mt-1">
                  Если вас заинтересовал подобный проект под ключ, напишите и мы с вами свяжемся для обсуждения подробностей.
                </p>
              </div>

              <ContactForm className="-mt-[64px]" />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
      <FooterMobile />
    </div>
  );
}