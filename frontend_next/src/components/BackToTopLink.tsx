'use client';

import Link from 'next/link';

export default function BackToTopLink() {
  const scrollToTop = () => {
    const duration = 1000; // Длительность анимации в миллисекундах
    const start = window.pageYOffset;
    const startTime = performance.now();

    const easeInOutCubic = (t: number): number => {
      return t < 0.5 
        ? 4 * t * t * t 
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };

    const animateScroll = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      window.scrollTo(0, start * (1 - easeInOutCubic(progress)));

      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      }
    };

    requestAnimationFrame(animateScroll);
  };

  return (
    <div className="flex flex-col gap-0.5 lg:-mr-[21px] md:-mr-[12px]">
      <Link 
        href="#" 
        onClick={(e) => {
          e.preventDefault();
          scrollToTop();
        }}
        className="text-[#0E1011] text-[20px] sm:text-[22px] font-medium sm:font-semibold font-geometria sm:font-inter hover:text-[#DE063A] transition-colors duration-300 underline underline-offset-5 decoration-2"
      >
        Наверх
      </Link>      
    </div>
  );
} 