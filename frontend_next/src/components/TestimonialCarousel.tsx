import Image from "next/image";
import { useState, useRef } from "react";

// Testimonial data structure
interface Testimonial {
  quote: string;
  description: string;
  authorName: string;
  authorCompany: string;
  authorPhoto: string;
  bgColor: string;
}

interface TestimonialCarouselProps {
  testimonials: Testimonial[];
}

export default function TestimonialCarousel({ testimonials }: TestimonialCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const isDragging = useRef<boolean>(false);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    isDragging.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;

    const deltaX = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0) {
        // Свайп влево - следующий слайд
        nextSlide();
      } else {
        // Свайп вправо - предыдущий слайд
        prevSlide();
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    touchStartX.current = e.clientX;
    isDragging.current = true;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    touchEndX.current = e.clientX;
  };

  const handleMouseUp = () => {
    if (!isDragging.current) return;
    isDragging.current = false;

    const deltaX = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0) {
        // Свайп влево - следующий слайд
        nextSlide();
      } else {
        // Свайп вправо - предыдущий слайд
        prevSlide();
      }
    }
  };

  return (
    <div className="block sm:hidden relative overflow-hidden">
      <div
        className="flex transition-transform duration-300 cursor-grab active:cursor-grabbing select-none"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {testimonials.map((t, i) => (
          <div key={i} className="min-w-full bg-[#181A1B] p-5 md:p-4 2xl:p-20 flex flex-col justify-between flex-1 h-[347px] sm:h-[500px] md:h-[600px] lg:h-[696px]">
            <div className="relative w-[30px] h-[19px]">
              <svg width="30" height="19" viewBox="0 0 48 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 30V13.764L5.73034 0H17.5843L13.8764 13.2584H21.0112V30H0ZM26.3483 30V13.764L32.0787 0H43.9326L40.2247 13.2584H47.3596V30H26.3483Z" fill="white" />
              </svg>
            </div>
            <div className="flex flex-col justify-between flex-1 mt-[60px] sm:mt-[95px]">
              <div className="flex flex-col gap-4 lg:gap-8">
                <h3 className="text-white font-geometria sm:font-inter font-medium sm:font-semibold text-[24px] sm:text-2xl lg:text-[40px] leading-[140%] tracking-[-1px] sm:tracking-normal">
                  {t.quote}
                </h3>
                <p className="text-white/60 font-geometria sm:font-inter font-light sm:font-normal text-[15px] sm:text-base lg:text-xl leading-[120%] sm:leading-[180%] mt-0 sm:-mt-[17px]">
                  {t.description}
                </p>
              </div>
              <div className="flex items-center gap-6">
                <div className="relative w-16 h-16 lg:w-[70px] lg:h-[70px] rounded-full bg-[#CCCCCC] overflow-hidden">
                  <Image src={t.authorPhoto} alt={t.authorName} fill className="object-cover" />
                </div>
                <div className="flex flex-col">
                  <h4 className="text-white font-geometria sm:font-inter font-medium sm:font-semibold text-[16px] sm:text-[12px] lg:text-[20px] xl:text-[26px] leading-[130%]">{t.authorName}</h4>
                  <p className="text-white/60 font-geometria sm:font-cabin font-medium text-[16px] lg:text-xl leading-[100%]">{t.authorCompany}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Индикаторы слайдов */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {testimonials.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`w-2 h-2 rounded-full transition-colors ${i === currentIndex ? 'bg-white' : 'bg-white/40'
              }`}
          />
        ))}
      </div>

      <button
        onClick={prevSlide}
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 rounded-full p-2 transition-colors"
      >
        ‹
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 rounded-full p-2 transition-colors"
      >
        ›
      </button>
    </div>
  );
}