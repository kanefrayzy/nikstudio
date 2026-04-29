'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

export interface CollageGalleryItem {
  type: 'image' | 'video';
  src: string;
  alt?: string;
  poster?: string;
}

export interface CollageGalleryGroup {
  id: number;
  type: 'single' | 'double';
  items: CollageGalleryItem[];
}

interface CollageGalleryProps {
  /**
   * Принимает данные в том же формате, что и `CarouselWithLightboxBasic`
   * (массив групп с items), но раскладывает плоский список фотографий в коллаж.
   */
  images: CollageGalleryGroup[];
  className?: string;
}

/**
 * Коллаж-галерея для блоков проекта.
 * Превью: 2 равных фото в ряду + 1 широкое снизу.
 * Остальные — сетка квадратов под кнопкой «ещё фото».
 * Клик → лайтбокс с навигацией (стрелки + клавиатура).
 */
const CollageGallery: React.FC<CollageGalleryProps> = ({
  images,
  className = '',
}) => {
  const [expanded, setExpanded] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Сплющиваем все группы в плоский список фото
  const flatItems: CollageGalleryItem[] = images.flatMap((g) => g.items);

  if (flatItems.length === 0) return null;

  // Превью: первые 3 фото, остальные скрыты
  const restItems = flatItems.slice(3);

  const openLightbox = (idx: number) => setActiveIndex(idx);
  const closeLightbox = useCallback(() => setActiveIndex(null), []);
  const goPrev = useCallback(
    () => setActiveIndex((i) => (i !== null ? (i - 1 + flatItems.length) % flatItems.length : null)),
    [flatItems.length]
  );
  const goNext = useCallback(
    () => setActiveIndex((i) => (i !== null ? (i + 1) % flatItems.length : null)),
    [flatItems.length]
  );

  // Keyboard navigation in lightbox
  useEffect(() => {
    if (activeIndex === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeIndex, closeLightbox, goPrev, goNext]);

  const renderThumb = (
    item: CollageGalleryItem,
    globalIdx: number,
    sizes: string,
    aspectClass: string
  ) => {
    const src = item.type === 'video' ? item.poster || item.src : item.src;
    return (
      <button
        key={globalIdx}
        type="button"
        onClick={() => openLightbox(globalIdx)}
        className={`group relative ${aspectClass} w-full overflow-hidden bg-[#181A1B] focus:outline-none focus:ring-2 focus:ring-[#DE063A]`}
        aria-label={item.alt || `Открыть фото ${globalIdx + 1}`}
      >
        <Image
          src={src}
          alt={item.alt || ''}
          fill
          sizes={sizes}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </button>
    );
  };

  const currentItem = activeIndex !== null ? flatItems[activeIndex] : null;

  return (
    <section className={`w-full px-5 sm:px-12 lg:px-24 ${className}`}>
      {/* Row 1: 2 равных фото рядом */}
      <div className="grid grid-cols-2 gap-[2px] sm:gap-1">
        {flatItems[0] && renderThumb(flatItems[0], 0, '50vw', 'aspect-[4/3]')}
        {flatItems[1] && renderThumb(flatItems[1], 1, '50vw', 'aspect-[4/3]')}
      </div>

      {/* Row 2: одно широкое фото */}
      {flatItems[2] && (
        <div className="mt-[2px] sm:mt-1">
          {renderThumb(flatItems[2], 2, '100vw', 'aspect-[21/9] sm:aspect-[21/8]')}
        </div>
      )}

      {/* Скрытая часть: остальные фото квадратами */}
      {restItems.length > 0 && (
        <div
          className={`grid transition-[grid-template-rows] duration-500 ease-in-out ${
            expanded ? 'grid-rows-[1fr] mt-[2px] sm:mt-1' : 'grid-rows-[0fr]'
          }`}
        >
          <div className="overflow-hidden">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-[2px] sm:gap-1">
              {restItems.map((item, idx) =>
                renderThumb(
                  item,
                  idx + 3,
                  '(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw',
                  'aspect-square'
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Кнопка «ещё фото / скрыть фото» */}
      {restItems.length > 0 && (
        <div className="mt-6 sm:mt-8 lg:mt-10 flex justify-center">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 border border-white/40 text-white font-inter font-semibold text-base sm:text-lg hover:bg-white hover:text-[#0E1011] transition-colors duration-300 cursor-pointer"
          >
            <span>
              {expanded ? 'скрыть фото' : `ещё фото (${restItems.length})`}
            </span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={`transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
              aria-hidden="true"
            >
              <path
                d="M4 6L8 10L12 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Лайтбокс */}
      {currentItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/92"
          onClick={closeLightbox}
        >
          {/* Закрыть */}
          <button
            type="button"
            aria-label="Закрыть"
            className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 flex items-center justify-center text-white bg-white/10 hover:bg-white/25 transition-colors z-10"
            onClick={(e) => { e.stopPropagation(); closeLightbox(); }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          {/* Назад */}
          {flatItems.length > 1 && (
            <button
              type="button"
              aria-label="Предыдущее фото"
              className="absolute left-3 sm:left-6 w-10 h-10 flex items-center justify-center text-white bg-white/10 hover:bg-white/25 transition-colors z-10"
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M13 4L7 10L13 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          )}

          {/* Вперёд */}
          {flatItems.length > 1 && (
            <button
              type="button"
              aria-label="Следующее фото"
              className="absolute right-3 sm:right-6 w-10 h-10 flex items-center justify-center text-white bg-white/10 hover:bg-white/25 transition-colors z-10"
              onClick={(e) => { e.stopPropagation(); goNext(); }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M7 4L13 10L7 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          )}

          {/* Изображение / видео */}
          <div
            className="relative w-full h-full flex items-center justify-center px-16 py-12"
            onClick={(e) => e.stopPropagation()}
          >
            {currentItem.type === 'video' ? (
              <video
                src={currentItem.src}
                poster={currentItem.poster}
                controls
                autoPlay
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <div className="relative w-full h-full">
                <Image
                  src={currentItem.src}
                  alt={currentItem.alt || ''}
                  fill
                  sizes="100vw"
                  className="object-contain"
                />
              </div>
            )}
          </div>

          {/* Счётчик */}
          {flatItems.length > 1 && activeIndex !== null && (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/50 font-inter text-sm tabular-nums">
              {activeIndex + 1} / {flatItems.length}
            </div>
          )}
        </div>
      )}
export default CollageGallery;
