'use client';

import Image from "next/image";
import Link from "next/link";
import ProjectCategories from '@/components/ProjectCategories';
import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from 'next/navigation';
import ServicesSection from '@/app/home/ServicesSection';
import ServiceSectionMobile from "@/app/home/ServicesSectionMobile";
import TestimonialsSection from '@/app/home/TestimonialsSection';
import MainContentSection from '@/app/home/MainContentSection';
import HeroVideoSection from '@/components/HeroVideoSection';
import HeroVideoErrorBoundary from '@/components/HeroVideoErrorBoundary';
import StructuredDataComponent from '@/components/StructuredDataComponent';
import { SEOMetadataGenerator } from '@/lib/seo-metadata';
import { getMediaUrl, getImageUrl } from "@/lib/media-utils";

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

export default function HomeContentClient() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [homeContent, setHomeContent] = useState<HomeContent | null>(null);
  const [globalSettings, setGlobalSettings] = useState<any>(null);
  const [heroVideoLoading, setHeroVideoLoading] = useState(true);
  const [heroVideoError, setHeroVideoError] = useState<string | null>(null);
  const projectsSectionRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const categoryId = searchParams.get('category_id');
    if (categoryId) {
      const categoryIdNum = parseInt(categoryId, 10);
      setSelectedCategory(categoryIdNum);
      if (projectsSectionRef.current) {
        setTimeout(() => {
          projectsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [searchParams]);

  // Fetch home content data and global SEO settings
  useEffect(() => {
    async function fetchHomeContent() {
      try {
        setHeroVideoLoading(true);
        setHeroVideoError(null);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const url = `${apiUrl}/api/home`;

        console.log('Запрос к API для контента главной страницы:', url);

        const response = await fetch(url);
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Ответ сервера при загрузке контента главной страницы:', response.status, errorText);
          throw new Error(`Ошибка при загрузке контента главной страницы: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Полученные данные контента главной страницы:', data);

        if (data.success) {
          setHomeContent(data.data);
        } else {
          console.error('Некорректный формат данных контента главной страницы:', data);
          setHeroVideoError('Ошибка при загрузке контента главной страницы');
        }

        // Fetch global SEO settings
        const globalSettingsData = await SEOMetadataGenerator.fetchGlobalSettings();
        setGlobalSettings(globalSettingsData);

      } catch (error) {
        console.error('Ошибка при загрузке контента главной страницы:', error);
        setHeroVideoError('Не удалось загрузить контент главной страницы');
      } finally {
        setHeroVideoLoading(false);
      }
    }
    fetchHomeContent();
  }, []);

  useEffect(() => {
    async function fetchProjects() {
      try {
        setLoading(true);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        let url = `${apiUrl}/api/projects`;

        // Добавляем параметр категории, если она выбрана
        if (selectedCategory !== null) {
          url += `?category_id=${selectedCategory}`;
        }

        console.log('Запрос к API:', url); // Отладочная информация

        const response = await fetch(url);
        if (!response.ok) {
          // Получаем текст ошибки от сервера
          const errorText = await response.text();
          console.error('Ответ сервера:', response.status, errorText);
          throw new Error(`Ошибка при загрузке проектов: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Полученные данные:', data); // Отладочная информация

        if (data.success && Array.isArray(data.data)) {
          setProjects(data.data);
        } else {
          console.error('Некорректный формат данных:', data);
          setProjects([]);
        }
      } catch (error) {
        console.error('Ошибка при загрузке проектов:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchProjects();
  }, [selectedCategory]);

  // Обработчик изменения категории
  const handleCategoryChange = (categoryId: number | null) => {
    setSelectedCategory(categoryId);
    const params = new URLSearchParams(window.location.search);
    if (categoryId !== null) {
      params.set('category_id', categoryId.toString());
    } else {
      params.delete('category_id');
    }
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const displayedProjects = showAllProjects ? projects : projects.slice(0, 4);

  // Show skeleton during initial load to prevent CLS
  if (heroVideoLoading && !homeContent) {
    return (
      <div className="flex flex-col lg:flex-row justify-center w-full relative">
        {/* Left Side - Hero Image Skeleton */}
        <div
          className="w-full lg:w-1/2 bg-gray-800 relative h-[246px] sm:h-[540px] md:h-[720px] lg:h-[1080px]"
          style={{ aspectRatio: '1787/1810', minHeight: '246px' }}
        />

        {/* Right Side - Content Skeleton */}
        <div className="w-full lg:w-1/2 flex flex-col justify-end">
          <div className="flex flex-col p-5 sm:p-12 lg:p-24 gap-12 lg:pt-[204px] lg:pb-[64px] h-full">
            <div className="flex flex-col items-center sm:items-start gap-12 lg:gap-[73px]">
              {/* Logo Skeleton */}
              <div
                className="hidden sm:block bg-gray-800 rounded"
                style={{ width: '321.99px', height: '119.99px', minWidth: '321.99px', minHeight: '119.99px' }}
              />

              <div className="flex flex-col gap-8 lg:gap-10 lg:mt-[38px] w-full">
                {/* Description Skeleton */}
                <div
                  className="bg-gray-800 rounded w-full lg:w-[400px] xl:w-[500px] 2xl:w-[768px]"
                  style={{ height: '90px' }}
                />

                {/* Title Skeleton */}
                <div
                  className="bg-gray-800 rounded w-full lg:w-[400px] xl:w-[500px] 2xl:w-[768px]"
                  style={{ height: '124px' }}
                />

                {/* Services List Skeleton */}
                <div
                  className="bg-gray-800 rounded"
                  style={{ height: '240px' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
          {heroVideoLoading ? (
            // Loading state - show fallback image while loading
            <div className="relative w-full h-full overflow-hidden">
              <Image
                src="/images/home/hero-image.png"
                alt="Hero Image Loading"
                className="object-cover object-center w-full h-full"
                width={1787}
                height={1810}
                priority
                fetchPriority="high"
                quality={90}
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          ) : heroVideoError ? (
            // Error state - show fallback image with error logged
            <div className="relative w-full h-full overflow-hidden">
              <Image
                src="/images/home/hero-image.png"
                alt="Hero Image"
                className="object-cover object-center w-full h-full"
                width={1787}
                height={1810}
                priority
                fetchPriority="high"
                quality={90}
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          ) : (
            // Normal state - show video component with error boundary
            <HeroVideoErrorBoundary
              fallbackImage={homeContent?.hero_fallback_image_url ? getMediaUrl(homeContent.hero_fallback_image_url, "/images/home/hero-image.png") : "/images/home/hero-image.png"}
            >
              <HeroVideoSection
                videoUrl={homeContent?.hero_video_url ? getMediaUrl(homeContent.hero_video_url) : undefined}
                fallbackImage={homeContent?.hero_fallback_image_url ? getMediaUrl(homeContent.hero_fallback_image_url, "/images/home/hero-image.png") : "/images/home/hero-image.png"}
                className="w-full h-full"
              />
            </HeroVideoErrorBoundary>
          )}
        </div>

        {/* Right Side - Content */}
        <div className="w-full lg:w-1/2 flex flex-col justify-end">
          <div className="flex flex-col p-5 sm:p-12 lg:p-24 gap-12 lg:pt-[204px] lg:pb-[64px] h-full">
            <div className="flex flex-col items-center sm:items-start gap-12 lg:gap-[73px]">
              <Link href="/" className="hidden sm:block">
                <div className="relative w-[321.99px] h-[119.99px] scale-75 sm:scale-100" style={{ minWidth: '321.99px', minHeight: '119.99px' }}>
                  <Image
                    src="/images/home/nik-logo-hero.svg"
                    alt="NIK Studio Logo"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </Link>

              <div className="flex flex-col gap-8 lg:gap-10 lg:mt-[38px]">
                <p className="text-white font-geometria text-[20px] sm:text-[30px] leading-[100%] w-full lg:w-[400px] xl:w-[500px] 2xl:w-[768px] w-full-3xl h-[90px] font-normal flex-none self-stretch">
                  Комплексные решения для промышленных компаний / подготовка к отраслевым выставкам / сопровождение / вывод продукта на новый рынок
                </p>
                <h1 className="text-white font-inter text-[32px] sm:text-[48px] leading-[100%] sm:leading-[130%] w-full lg:w-[400px] xl:w-[500px] 2xl:w-[768px] w-full-3xl h-[124px] font-semibold flex-none self-stretch sm:mt-15 xl:mt-15 2xl:mt-0">
                  Превращаем сложные технологии в понятный визуал
                </h1>
                <div className="text-white/60 font-inter text-[16px] sm:text-[30px] leading-[100%] h-[240px] font-light flex-none -mt-[40px] sm:mt-40 xl:mt-25 2xl:mt-0">
                  мультимедиа<br />
                  брендинг<br />
                  дизайн / презентации<br />
                  коммерческая фотогорафия<br />
                  3д-визуализация и анимация<br />
                  видеопродакшн<br />
                  создание сайтов
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <MainContentSection />

      {/* Projects Section */}
      <section className="w-full bg-[#181A1B] pt-7 sm:pt-24 flex flex-col sm:mt-[25px] scroll-mt-20">
        <div className="px-5 sm:px-12 lg:px-24 flex flex-col gap-24">
          {/* Header */}
          <div className="flex flex-col gap-24">
            <div className="flex flex-row justify-between items-center">
              <h3 className="text-white/60 font-cabin font-medium text-[20px] sm:text-2xl lg:text-[32px] sm:w-[288px] h-[32px]">
                проекты под ключ
              </h3>
              <span className="text-white/60 font-cabin font-medium text-[20px] sm:text-2xl lg:text-[32px]">
                (01)
              </span>
            </div>

            <div className="flex flex-col gap-4 -mt-[80px] sm:-mt-[15px]">
              <h2 className="text-white font-geometria font-extrabold text-[60px] sm:text-6xl xl:text-[200px] 2xl:text-[280px] uppercase leading-none">
                проекты
              </h2>

              <p className="text-white font-inter font-medium sm:font-semibold text-[32px] sm:text-2xl lg:text-[80px] leading-[120%] sm:leading-tight max-w-[1450px] max-w-full-3xl mt-[14px] sm:-mt-[15px]">
                Мы берём на себя составление всех технических заданий. Все части проекта в едином ключе
              </p>
            </div>
          </div>

          {/* Project Categories */}
          <div id="projects" ref={projectsSectionRef} className="-mt-[165px] sm:mt-0">

          </div>
          <ProjectCategories
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
          />
        </div>

        {/* Project Items */}
        <div className="flex flex-col gap-12 mt-[25px] sm:mt-12">
          {loading ? (
            <div className="text-white text-center py-10">Загрузка проектов...</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {displayedProjects.map((project) => (
                <Link href={`/projects/${project.slug}`} key={project.id} className="flex flex-col group">
                  <div className="relative w-full aspect-square overflow-hidden" style={{ minHeight: '390px' }}>
                    <Image
                      src={getImageUrl(project.main_image)}
                      alt={project.main_title}
                      fill
                      className="object-cover opacity-70 h-[390px] sm:h-auto transition-transform duration-300 group-hover:scale-110"
                      quality={85}
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      onError={(e) => {
                        console.error('Ошибка загрузки изображения:', project.main_image);
                        e.currentTarget.src = '/placeholder.jpg';
                      }}
                    />
                    {project.logo && (
                      <div className="absolute inset-0 flex items-center justify-center scale-75 sm:scale-100" style={{ minHeight: '122px' }}>
                        <Image
                          src={getImageUrl(project.logo)}
                          alt={`${project.main_title} Logo`}
                          width={335}
                          height={122}
                          className="object-contain"
                          quality={85}
                          onError={(e) => {
                            console.error('Ошибка загрузки логотипа:', project.logo);
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-8 px-5 sm:px-8 lg:px-12 -mt-[20px] sm:mt-0 group-hover:bg-white transition-colors duration-300" style={{ minHeight: '80px' }}>
                    <h3 className="text-white font-inter font-medium sm:font-semibold text-[24px] sm:text-2xl lg:text-[40px] leading-[140%] sm:leading-tight tracking-[-1px] sm:tracking-normal group-hover:text-black transition-colors duration-300">
                      {project.main_title}
                    </h3>
                    <span className="text-white/60 font-cabin font-medium text-[24px] sm:text-lg lg:text-[32px] group-hover:text-black transition-colors duration-300">
                      ({project.year})
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Toggle Button */}
        {projects.length > 4 && (
          <div className="py-20 md:py-[76px] px-6 sm:px-12 lg:px-24 flex justify-center md:justify-start mt-3">
            <button
              onClick={() => setShowAllProjects(!showAllProjects)}
              className="flex items-center justify-center w-3xs h-[54px] text-center text-white border-2 border-white rounded-full font-inter font-semibold text-xl md:text-[22px] hover:bg-white hover:text-[#0E1011] hover:cursor-pointer transition-colors duration-300"
            >
              {showAllProjects ? "скрыть проекты" : "все проекты"}
            </button>
          </div>
        )}
      </section>

      {/* Другие секции */}
      <div className="hidden sm:block">
        <ServicesSection />
      </div>
      <div className="block sm:hidden">
        <ServiceSectionMobile />
      </div>


      <TestimonialsSection />
    </>
  );
}
