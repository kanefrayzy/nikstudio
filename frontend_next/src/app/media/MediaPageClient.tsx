"use client";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header";
import Header_mobile from "@/components/Header_mobile";
import Footer from "@/components/Footer";
import FooterMobile from "@/components/Footer_mobile";
import MediaPageSkeleton from "@/components/MediaPageSkeleton";

import LaravelImage from "@/components/LaravelImage";
import { useState, useRef, useEffect } from "react";
import { fetchMediaPageData } from "@/services/mediaApi";
import { transformMediaPageData, getFallbackMediaData } from "@/utils/mediaTransform";
import { preloadImage } from "@/utils/imageOptimization";
import { Service, Step, TestimonialLegacy } from "@/types/media";
import ServiceSection from "./ServiceSection";
import ServiceSectionMobile from "./ServiceSection_mobile";

export default function MediaPageClient() {
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Dynamic data state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mediaData, setMediaData] = useState<{
    services: Service[];
    testimonials: TestimonialLegacy[];
    testimonialsData: { title: string; subtitle: string; };
    processData: { title: string; subtitle: string; steps: Step[]; };
    heroData: { title: string; description: string; };
  }>(() => getFallbackMediaData());

  // Fetch media page data on component mount
  useEffect(() => {
    const loadMediaData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log('🔄 Загрузка данных медиа страницы...');
        const apiData = await fetchMediaPageData();
        console.log('📊 Полученные API данные:', apiData);
        const transformedData = transformMediaPageData(apiData);
        console.log('🔄 Трансформированные данные:', transformedData);
        setMediaData(transformedData);

        // Сбрасываем индекс отзыва при загрузке новых данных
        setCurrentTestimonialIndex(0);

        // Preload critical images after data is loaded
        if (transformedData.testimonials.length > 0 && transformedData.testimonials[0].image) {
          // Preload first testimonial image
          preloadImage(transformedData.testimonials[0].image).catch(() => {
            // Ignore preload errors
          });
        }

        if (transformedData.processData.steps.length > 0 && transformedData.processData.steps[0].image) {
          // Preload first process step image
          preloadImage(transformedData.processData.steps[0].image).catch(() => {
            // Ignore preload errors
          });
        }

      } catch (err) {
        console.error('Failed to load media page data:', err);
        setError('Не удалось загрузить данные страницы');
        // Keep fallback data on error
      } finally {
        setIsLoading(false);
      }
    };

    loadMediaData();
  }, []);

  // Use dynamic data
  const { services, testimonials, testimonialsData, processData, heroData } = mediaData;

  const handlePreviousTestimonial = () => {
    if (isTransitioning) return;

    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentTestimonialIndex((prev) => {
        return prev === 0 ? testimonials.length - 1 : prev - 1;
      });

      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, 450);
  };

  const handleNextTestimonial = () => {
    if (isTransitioning) return;

    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentTestimonialIndex((prev) => {
        return (prev + 1) % testimonials.length;
      });

      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, 450);
  };

  const currentTestimonial = testimonials[currentTestimonialIndex] as TestimonialLegacy | undefined;

  // Show loading skeleton while data is being fetched
  if (isLoading) {
    return <MediaPageSkeleton />;
  }

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.clientX);
    setCurrentX(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setCurrentX(e.clientX);
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      const dragDistance = currentX - startX;
      const threshold = 50; // Minimum drag distance to trigger slide change

      if (dragDistance > threshold) {
        handlePreviousTestimonial();
      } else if (dragDistance < -threshold) {
        handleNextTestimonial();
      }

      setIsDragging(false);
    }
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
    }
  };

  return (
    <main className="bg-[#0E1011] min-h-screen flex flex-col items-stretch">
      <Header />
      <Header_mobile />

      {/* Error Message */}
      {error && (
        <div className="px-5 sm:px-12 lg:px-24 py-4">
          <div className="bg-red-900/20 border border-red-500/50 text-red-200 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="pt-[0px] sm:pt-40 md:pt-[150px] pb-[35px] md:pb-[17px] px-5 sm:px-12 lg:px-24">
        <h1 className="text-white font-geometria font-extrabold text-[60px] sm:text-[150px] lg:text-[200px] 2xl:text-[280px] uppercase leading-[120%] sm:leading-none">
          {heroData.title}
        </h1>
        <p className="text-white font-inter font-medium sm:font-semibold text-[32px] md:text-[80px] leading-[100%] md:leading-[1.2em] mt-6 md:mt-2 max-w-[1400px] max-w-full-3xl tracking-normal sm:-tracking-[2px]">
          {heroData.description}
        </p>
      </section>

      {/* Services Sections */}
      {services.map((service: Service) => (
        <ServiceSection key={service.id} service={service} className="mt-[10px] sm:mt-0 hidden sm:block" />
      ))}

      {services.map((service: Service) => (
        <ServiceSectionMobile key={service.id} service={service} className="mt-[10px] sm:mt-0 block sm:hidden" />
      ))}
      <div className="h-[130px] bg-[#0e1011] w-auto"></div>

      {/* Projects Link Section */}
      <section className="py-20 md:py-[76px] px-5 sm:px-12 lg:px-24 flex justify-center md:justify-start -mt-[220px] sm:mt-0">
        <Link
          href="/projects"
          className="flex items-center justify-center w-[134px] sm:w-[192px] h-[32px] sm:h-[54px] text-center text-white border-2 border-white rounded-full font-inter font-semibold text-[16px] md:text-[22px] hover:bg-white hover:text-[#0E1011] transition-colors duration-300"
        >
          все проекты
        </Link>
      </section>

      {/* Testimonials Section */}
      {testimonials.length > 0 && (
        <section className="w-full">
          <div className="flex flex-col gap-24 py-16 md:py-24">
            <div className="flex flex-col px-5 sm:px-22">
              <div className="md:col-span-4 hidden sm:flex flex-col md:flex-row justify-end items-center mt-3">
                <span className="text-white/60 font-cabin text-2xl md:text-[32px]">(01)</span>
              </div>
              <div className="md:col-span-4 flex sm:hidden flex-row justify-between items-center -mt-[28px] px-1">
                <span className="text-white/60 font-cabin font-medium text-[20px] md:text-[32px]">информация</span>
                <span className="text-white/60 font-cabin font-medium text-[20px] md:text-[32px]">03</span>
              </div>

              <div className="md:col-span-8 flex flex-col gap-6 mt-[35px] sm:mt-21">
                <h2 className="text-white font-geometria font-extrabold text-[60px] sm:text-[100px] lg:text-[150px] xl:text-[200px] 2xl:text-[240px] uppercase leading-[120%] sm:leading-none">
                  {testimonialsData.title}
                </h2>
                <p className="text-white font-inter font-medium sm:font-semibold text-[32px] md:text-[72px] lg:text-[80px] leading-[120%] tracking-normal sm:-tracking-[2px] max-w-[1400px] max-w-full-3xl">
                  {testimonialsData.subtitle}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 -mt-[60px] sm:mt-0">
              <div
                ref={carouselRef}
                className={`relative h-[248px] md:h-[1080px] w-full overflow-hidden ${isDragging ? 'cursor-grabbing' : 'cursor-grab'
                  }`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
              >
                <div
                  className={`absolute inset-0 transition-opacity duration-300 ease-in-out ${isTransitioning ? 'opacity-0' : 'opacity-100'
                    }`}
                >
                  <LaravelImage
                    key={`testimonial-${currentTestimonialIndex}-${currentTestimonial?.image}`}
                    src={currentTestimonial?.image || '/images/media/testimonial/placeholder.jpg'}
                    alt={`Testimonial from ${currentTestimonial?.company || 'Client'}`}
                    className="object-cover transition-transform duration-300"
                    fill
                    priority
                    quality={90}
                  />
                </div>
                <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between items-center">
                  <button
                    className="w-[60px] h-[60px] flex items-center justify-center bg-[#0E1011] hover:bg-white transition-colors duration-300 cursor-pointer group z-10 opacity-50 sm:opacity-100"
                    onClick={handlePreviousTestimonial}
                    disabled={isTransitioning || testimonials.length <= 1}
                    aria-label="Previous testimonial"
                  >
                    <Image
                      src="/images/media/arrow_left.svg"
                      alt="Previous"
                      width={21}
                      height={21}
                      className="[filter:invert(1)] group-hover:[filter:invert(0)]"
                      draggable={false}
                      loading="lazy"
                    />
                  </button>

                  <button
                    className="w-[60px] h-[60px] flex items-center justify-center bg-[#0E1011] hover:bg-white transition-colors duration-300 cursor-pointer group z-10 opacity-50 sm:opacity-100"
                    onClick={handleNextTestimonial}
                    disabled={isTransitioning || testimonials.length <= 1}
                    aria-label="Next testimonial"
                  >
                    <Image
                      src="/images/media/arrow_right.svg"
                      alt="Next"
                      width={21}
                      height={21}
                      className="[filter:invert(1)] group-hover:[filter:invert(0)]"
                      draggable={false}
                      loading="lazy"
                    />
                  </button>
                </div>
              </div>
              <div className="bg-[#181A1B] pt-12 pb-[56px] md:pt-24 md:pb-24 px-5 sm:px-12 md:px-12 lg:px-24 flex flex-col h-full -mt-[17px] sm:mt-0">
                <Image
                  src="/images/media/quote-icon.svg"
                  alt="Quote icon"
                  width={74.09}
                  height={46.93}
                  className="mb-8 w-[43px] sm:w-[74.09px] h-[27px] sm:h-[46.93px]"
                  loading="lazy"
                />

                <div className="flex flex-col justify-center flex-grow">
                  <div className={`transition-all duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'
                    }`}>
                    <span className="text-white/60 font-cabin font-medium sm:font-normal text-[16px] md:text-[32px] block mb-7 mt-[5px] sm:mt-0">
                      {currentTestimonial?.company || ''}
                    </span>
                    <h3 className="text-white font-inter font-semibold text-[24px] sm:text-4xl md:text-[36px] lg:text-[44px] xl:text-[60px] 2xl:text-[64px] leading-[130%] -tracking-[1px] mb-7 -mt-[17px] sm:mt-0">
                      {currentTestimonial?.quote || ''}
                    </h3>
                    <p className="text-white/60 font-inter text-[16px] md:text-[28px] leading-[160%] -mt-[12px] sm:mt-0">
                      {currentTestimonial?.text || ''}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Process Section */}
      <section className="w-full">
        <div className="flex flex-col gap-24 -mt-[25px] sm:-mt-1">
          <div className="flex flex-col px-5 sm:px-22">
            <div className="md:col-span-4 flex flex-row justify-between items-center">
              <span className="text-white/60 font-geometria sm:font-cabin font-medium sm:font-normal text-[20px] md:text-[32px]">Как мы работаем</span>
              <span className="hidden sm:block text-white font-cabin text-2xl md:text-[32px]">t</span>
              <span className="block sm:hidden text-white/60 font-geometria sm:font-cabin font-medium text-[20px] md:text-[32px]">02</span>
            </div>

            <div className="md:col-span-8 flex flex-col gap-6 mt-[20px] sm:mt-20">
              <h2 className="text-white font-geometria font-extrabold text-[60px] sm:text-[100px] lg:text-[150px] xl:text-[200px] 2xl:text-[280px] uppercase leading-none">
                {processData.title}
              </h2>
              <p className="text-white font-inter font-medium sm:font-semibold text-[32px] md:text-[80px] leading-[100%] sm:leading-[120%] tracking-normal sm:-tracking-[2px] max-w-[1400px] max-w-full-3xl mt-[5px] sm:mt-0">
                {processData.subtitle}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-0 -mt-[58px] sm:mt-0">
            {processData.steps.map((step: Step, index: number) => (
              <div
                key={step.id}
                className="grid grid-cols-1 md:grid-cols-2 gap-0"
              >
                <div className="relative h-[360px] md:h-[1080px] w-full">
                  <LaravelImage
                    src={step.image || `/images/media/process-${index + 1}.jpg`}
                    alt={step.title}
                    className="object-cover"
                    fill
                    priority={index < 2}
                    quality={index < 2 ? 85 : 80}
                    loading={index < 2 ? undefined : "lazy"}
                  />
                </div>
                <div className={`${index % 2 === 1 ? 'bg-transparent' : 'bg-[#181A1B]'} p-5 md:p-12 pb-[40px] sm:pb-0 lg:p-24 flex flex-col gap-12`}>
                  <span className="text-white font-geometria font-bold text-6xl md:text-[160px] uppercase mt-[18px] sm:mt-0">
                    0{step.id}
                  </span>
                  <div className="flex flex-col gap-4 -mt-[11px] sm:mt-49">
                    <span className="text-white/60 font-geometria text-[20px] md:text-[32px]">
                      {step.title}
                    </span>
                    <h3 className="text-white font-inter font-semibold text-[32px] md:text-[52px] lg:text-[64px] leading-[130%] -tracking-[1px] mt-0 sm:mt-3">
                      {step.subtitle}
                    </h3>
                    <div className="flex flex-col sm:flex-row flex-start gap-[32px] mt-[5px] sm:mt-0">
                      <p className="w-full sm:w-[368px] font-inter font-normal text-[16px] sm:text-[20px] leading-[180%] text-white/60">{step.description.left}</p>
                      <p className="w-full sm:w-[368px] font-inter font-normal text-[16px] sm:text-[20px] leading-[180%] text-white/60">{step.description.right}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-15 sm:py-20 md:py-[76px] pb-[102px] px-5 sm:px-12 lg:px-24 flex sm:hidden justify-center md:justify-start mt-0 sm:-mt-35">
        <Link
          href="/contact"
          className="flex flex-row justify-center items-center py-7 sm:py-4 px-5 sm:px-[26px] gap-2 w-full h-12 sm:h-[54px] 3xl:h-[70px] 3xl:text-[28px] bg-white text-[#0E1011] text-[22px] font-semibold rounded-full mx-auto font-inter hover:cursor-pointer hover:bg-[#DE063A] hover:text-white transition-colors duration-300"
        >
          Связаться
        </Link>
      </section>

      <Footer />
      <FooterMobile />
    </main>
  );
}
