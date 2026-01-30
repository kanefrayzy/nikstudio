"use client";
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';

// Lazy load CarouselWithLightboxBasic with skeleton loader
const CarouselWithLightboxBasic = dynamic(() => import("../components/CarouselWithLightboxBasic"), {
  loading: () => (
    <div className="relative w-full h-[200px] sm:h-[500px] lg:h-[1080px] bg-[#181A1B] animate-pulse">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
      </div>
    </div>
  ),
  ssr: false,
});

// Интерфейсы для типизации
interface Slide {
  mainImage: string;
  mainPoster?: string | null;
  mainType?: string;
  secondaryImage: string;
  secondaryPoster?: string | null;
  secondaryType?: string;
}

interface Feature {
  title: string;
  description: string[];
}

interface Service {
  id: number;
  title: string;
  description: string;
  slides: Slide[];
  features: Feature[];
}

// Компонент для секции сервисов
export default function ServiceSection({ service, className = "" }: { service: Service, className?: string }) {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Use IntersectionObserver to defer carousel initialization
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '200px', // Start loading 200px before the element is visible
        threshold: 0.01,
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  // Функция для определения типа медиа по расширению файла (fallback)
  const getMediaType = (src: string, type?: string): 'image' | 'video' => {
    // Используем тип из API, если доступен
    if (type === 'video' || type === 'image') {
      return type;
    }
    
    // Fallback: определяем по расширению файла
    const extension = src.split('.').pop()?.toLowerCase();
    return extension === 'mp4' || extension === 'webm' || extension === 'mov' ? 'video' : 'image';
  };

  // Преобразуем данные service.slides в формат для CarouselWithLightboxBasic
  const carouselImages = service.slides?.map((slide, index) => {
    const mainType = getMediaType(slide.mainImage, slide.mainType);
    const secondaryType = getMediaType(slide.secondaryImage, slide.secondaryType);
    
    // Фильтруем только валидные медиа элементы
    const items = [];
    
    if (slide.mainImage && slide.mainImage.trim()) {
      items.push({
        type: mainType,
        src: slide.mainImage,
        alt: `${service.title} - ${mainType === 'video' ? 'видео' : 'изображение'} ${index + 1}-1`,
        ...(mainType === 'video' && slide.mainPoster && { poster: slide.mainPoster })
      });
    }
    
    if (slide.secondaryImage && slide.secondaryImage.trim()) {
      items.push({
        type: secondaryType,
        src: slide.secondaryImage,
        alt: `${service.title} - ${secondaryType === 'video' ? 'видео' : 'изображение'} ${index + 1}-2`,
        ...(secondaryType === 'video' && slide.secondaryPoster && { poster: slide.secondaryPoster })
      });
    }
    
    return {
      id: index + 1,
      type: items.length === 2 ? 'double' as const : 'single' as const,
      items: items
    };
  }).filter(slide => slide.items.length > 0) || [];

  return (
    <section ref={sectionRef} className={`bg-[#0e1011] w-full ${className}`}>
      {/* CarouselWithLightboxBasic - Only load when visible */}
      <div className="mt-[20px] sm:mt-20">
        {isVisible ? (
          <CarouselWithLightboxBasic
            images={carouselImages}
            className="w-full"
          />
        ) : (
          <div className="relative w-full h-[200px] sm:h-[500px] lg:h-[1080px] bg-[#181A1B]">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white/40 text-lg">Загрузка...</div>
            </div>
          </div>
        )}
      </div>

      {/* Content Grid */}
      <div className="flex flex-col md:flex-row w-full gap-6 md:gap-4 lg:gap-24 px-5 sm:px-12 lg:px-22 py-16 md:py-24 lg:py-[96px]">
        <h2 lang="ru" className="text-white font-geometria font-bold text-[40px] md:text-[128px] uppercase leading-none w-full md:w-[39.55%] whitespace-normal hyphens-auto break-words -mt-[40px] sm:mt-0">
          {service.title}
        </h2>
        
        <div className="flex flex-col gap-12 md:gap-20 flex-1 -ml-">
          <p className="text-white font-inter font-semibold -mt-[10px] sm:mt-0 text-[20px] md:text-[36px] lg:text-[48px] leading-[120%] sm:leading-[130%] -tracking-[1px] sm:-tracking-[0.5px] w-full lg:max-w-[400px] xl:max-w-[992px] break-words">
            {service.description}
          </p>

          <div className="flex flex-col gap-12 md:gap-12">
            {service.features?.map((feature: Feature, index: number) => (
              <div key={index} className="flex flex-col">
                <h3 className="text-white font-inter font-semibold -mt-[20px] sm:mt-0 text-[18px] md:text-[40px] mb-[16px] leading-[120%] sm:leading-[140%] -tracking-[1px]">
                  {feature.title}
                </h3>
                {feature.description?.map((paragraph: string, i: number) => (
                  <p key={i} className="text-white/60 font-inter text-[16px] md:text-[20px] leading-[100%] sm:leading-[180%]">
                    {paragraph}
                  </p>
                ))}
                {index < (service.features?.length || 0) - 1 && (
                  <div className="h-[2px] bg-white/20 w-full mt-[15px] sm:mt-12"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}