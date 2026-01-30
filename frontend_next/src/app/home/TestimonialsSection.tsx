'use client';

import React from 'react';
import Image from "next/image";
import dynamic from 'next/dynamic';
import { getContentValue, getImageUrl, type HomepageContentBySections } from '@/lib/homepage-content';

// Lazy load TestimonialCarousel with skeleton loader
const TestimonialCarousel = dynamic(() => import('@/components/TestimonialCarousel'), {
  loading: () => (
    <div className="block sm:hidden relative overflow-hidden h-[347px] sm:h-[500px] md:h-[600px] lg:h-[696px] bg-[#181A1B] animate-pulse">
      <div className="p-5 flex flex-col gap-4">
        <div className="w-[30px] h-[19px] bg-white/20 rounded"></div>
        <div className="mt-[60px] space-y-4">
          <div className="h-8 bg-white/20 rounded w-3/4"></div>
          <div className="h-4 bg-white/10 rounded w-full"></div>
          <div className="h-4 bg-white/10 rounded w-5/6"></div>
        </div>
      </div>
    </div>
  ),
  ssr: false,
});

interface TestimonialsSectionProps {
  content?: HomepageContentBySections | null;
}

// Testimonial data structure
interface Testimonial {
  quote: string;
  description: string;
  authorName: string;
  authorCompany: string;
  authorPhoto: string;
  bgColor: string;
}

export default function TestimonialsSection({ content }: TestimonialsSectionProps) {
  // Map testimonials from CMS content with fallback values
  const testimonials: Testimonial[] = [
    {
      quote: getContentValue(
        content?.testimonials_1,
        'testimonial_1_quote',
        'Exceptional Branding That Elevated Our Identity.'
      ),
      description: getContentValue(
        content?.testimonials_1,
        'testimonial_1_description',
        'Their strategic approach completely transformed our brand. We\'ve seen a huge increase in recognition and client engagement.'
      ),
      authorName: getContentValue(
        content?.testimonials_1,
        'testimonial_1_author_name',
        'Трофимов Сергей'
      ),
      authorCompany: getContentValue(
        content?.testimonials_1,
        'testimonial_1_author_company',
        '«Монитор СОФТ»'
      ),
      authorPhoto: getImageUrl(
        content?.testimonials_1,
        'testimonial_1_author_photo',
        '/images/home/testimonial-1.jpg'
      ),
      bgColor: 'bg-[#181A1B]',
    },
    {
      quote: getContentValue(
        content?.testimonials_2,
        'testimonial_2_quote',
        'По итогам выставки был заключен контракт'
      ),
      description: getContentValue(
        content?.testimonials_2,
        'testimonial_2_description',
        'The website they created is stunning, user-friendly, and has boosted our online conversions significantly. Highly recommend!'
      ),
      authorName: getContentValue(
        content?.testimonials_2,
        'testimonial_2_author_name',
        'Юлия Данилова'
      ),
      authorCompany: getContentValue(
        content?.testimonials_2,
        'testimonial_2_author_company',
        'Группа компаний «ИКАР»'
      ),
      authorPhoto: getImageUrl(
        content?.testimonials_2,
        'testimonial_2_author_photo',
        '/images/home/testimonial-3.jpg'
      ),
      bgColor: 'bg-[#1F2122]',
    },
    {
      quote: getContentValue(
        content?.testimonials_3,
        'testimonial_3_quote',
        'Creative Solutions That Drove Real Results for Our Website.'
      ),
      description: getContentValue(
        content?.testimonials_3,
        'testimonial_3_description',
        'Their designs are not only beautiful but effective. Our sales increased by 30% post-launch. Incredible experience!'
      ),
      authorName: getContentValue(
        content?.testimonials_3,
        'testimonial_3_author_name',
        'Колушов Михаил'
      ),
      authorCompany: getContentValue(
        content?.testimonials_3,
        'testimonial_3_author_company',
        'АО «НПП Авиаспецмаш»'
      ),
      authorPhoto: getImageUrl(
        content?.testimonials_3,
        'testimonial_3_author_photo',
        '/images/home/testimonial-5.jpg'
      ),
      bgColor: 'bg-[#181A1B]',
    },
    {
      quote: getContentValue(
        content?.testimonials_4,
        'testimonial_4_quote',
        'Seamless Collaboration & Support With Exceptional Results.'
      ),
      description: getContentValue(
        content?.testimonials_4,
        'testimonial_4_description',
        'Working with them was easy and efficient. They perfectly captured our vision, and the results were outstanding.'
      ),
      authorName: getContentValue(
        content?.testimonials_4,
        'testimonial_4_author_name',
        'Александра Райкова'
      ),
      authorCompany: getContentValue(
        content?.testimonials_4,
        'testimonial_4_author_company',
        'GARDEN Foresta'
      ),
      authorPhoto: getImageUrl(
        content?.testimonials_4,
        'testimonial_4_author_photo',
        '/images/home/testimonial-2.jpg'
      ),
      bgColor: 'bg-[#1F2122]',
    },
    {
      quote: getContentValue(
        content?.testimonials_5,
        'testimonial_5_quote',
        'Запустили интернет магазин для розничной продукции'
      ),
      description: getContentValue(
        content?.testimonials_5,
        'testimonial_5_description',
        'Our new branding resonated with our audience immediately. We\'ve received so many compliments and new business inquiries.'
      ),
      authorName: getContentValue(
        content?.testimonials_5,
        'testimonial_5_author_name',
        'Егорова Марина'
      ),
      authorCompany: getContentValue(
        content?.testimonials_5,
        'testimonial_5_author_company',
        '«ЕГОРОВ мясо»'
      ),
      authorPhoto: getImageUrl(
        content?.testimonials_5,
        'testimonial_5_author_photo',
        '/images/home/testimonial-4.jpg'
      ),
      bgColor: 'bg-[#181A1B]',
    },
    {
      quote: getContentValue(
        content?.testimonials_6,
        'testimonial_6_quote',
        'UX Design That Transformed Our User Experience.'
      ),
      description: getContentValue(
        content?.testimonials_6,
        'testimonial_6_description',
        'Their UX design made our platform more intuitive and enjoyable to use. Customer satisfaction has dramatically improved.'
      ),
      authorName: getContentValue(
        content?.testimonials_6,
        'testimonial_6_author_name',
        'Дмитрий Страшкевич'
      ),
      authorCompany: getContentValue(
        content?.testimonials_6,
        'testimonial_6_author_company',
        '«Эко Стиль»'
      ),
      authorPhoto: getImageUrl(
        content?.testimonials_6,
        'testimonial_6_author_photo',
        '/images/home/testimonial-6.jpg'
      ),
      bgColor: 'bg-[#1F2122]',
    },
  ];
  return (
    <section className="w-full bg-[#0E1011] mt-[10px] sm:mt-29">
      {/* Header with padding */}
      <div className="px-6 sm:px-12 lg:px-24 mb-24">
        <div className="flex flex-col gap-24">
          <div className="flex flex-row justify-between items-center">
            <h3 className="text-white/60 font-cabin font-medium text-[20px] sm:text-2xl lg:text-[32px]">Информация</h3>
            <span className="text-white/60 font-cabin font-medium text-[20px] sm:text-2xl lg:text-[32px]">(03)</span>
          </div>

          <div className="flex flex-col gap-4 -mt-[60px] sm:-mt-4">
            <h2 className="text-white font-geometria font-extrabold text-[60px] sm:text-6xl xl:text-[200px] 2xl:text-[240px] uppercase leading-[120%] sm:leading-none">
              говорят о нас
            </h2>
            <p className="text-white font-inter font-medium sm:font-semibold text-[32px] sm:text-2xl lg:text-[80px] leading-[120%] sm:leading-tight tracking-[-2px] max-w-[1400px] max-w-full-3xl">
              Команда NIKstudio закрывает целый ряд задач с энтузиазмом и полной ответственностью
            </p>
          </div>
        </div>
      </div>

      {/* Testimonial Cards - Full width */}
      <div className="hidden sm:grid grid-cols-1 md:grid-cols-3">
        {testimonials.map((testimonial, index) => (
          <div
            key={index}
            className={`${testimonial.bgColor} p-12 md:p-4 2xl:p-20 flex flex-col justify-between flex-1 h-[600px] sm:h-[500px] md:h-[600px] lg:h-[696px]`}
          >
            <div className="relative w-[48px] h-[30px]">
              <svg width="48" height="30" viewBox="0 0 48 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 30V13.764L5.73034 0H17.5843L13.8764 13.2584H21.0112V30H0ZM26.3483 30V13.764L32.0787 0H43.9326L40.2247 13.2584H47.3596V30H26.3483Z" fill="white"/>
              </svg>
            </div>

            <div className="flex flex-col justify-between flex-1 mt-[95px]">
              <div className="flex flex-col gap-4 lg:gap-8">
                <h3 className="text-white font-inter font-semibold text-xl sm:text-2xl lg:text-[40px] leading-[140%]">
                  {testimonial.quote}
                </h3>
                <p className="text-white/60 font-inter text-base lg:text-xl leading-[180%] -mt-[17px]">
                  {testimonial.description}
                </p>
              </div>

              <div className="flex items-center gap-4 lg:gap-6">
                <div className="relative w-16 h-16 lg:w-[70px] lg:h-[70px] rounded-full bg-[#CCCCCC] overflow-hidden">
                  <Image
                    src={testimonial.authorPhoto}
                    alt={testimonial.authorName}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-col">
                  <h4 className="text-white font-inter font-semibold text-[12px] lg:text-[20px] xl:text-[26px]">
                    {testimonial.authorName}
                  </h4>
                  <p className="text-white/60 font-cabin text-[12px] lg:text-xl">
                    {testimonial.authorCompany}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Testimonial Cards - mobile */}
      <TestimonialCarousel />
    </section>
  );
}
