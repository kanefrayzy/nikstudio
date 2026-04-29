'use client';

import React, { useState } from 'react';
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
  /** Количество фото в превью до кнопки «ещё фото». По умолчанию 3 (1 широкое + 2 квадрата). */
  previewCount?: number;
}

/**
 * Коллаж-галерея для блоков проекта.
 * Превью: 1 горизонтальное фото + 2 квадратных рядом.
 * Остальные фото скрываются под кнопкой «ещё фото / скрыть фото»
 * и появляются плавно ниже.
 */
const CollageGallery: React.FC<CollageGalleryProps> = ({
  images,
  className = '',
  previewCount = 3,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [activeItem, setActiveItem] = useState<CollageGalleryItem | null>(null);

  // Сплющиваем все группы в плоский список фото (видео тоже допустимы как poster)
  const flatItems: CollageGalleryItem[] = images.flatMap((g) => g.items);

  if (flatItems.length === 0) return null;

  const previewItems = flatItems.slice(0, previewCount);
  const restItems = flatItems.slice(previewCount);

  const renderMedia = (
    item: CollageGalleryItem,
    sizes: string,
    rounded = 'rounded-lg sm:rounded-xl'
  ) => {
    const src = item.type === 'video' ? item.poster || item.src : item.src;
    return (
      <Image
        src={src}
        alt={item.alt || ''}
        fill
        sizes={sizes}
        className={`object-cover transition-transform duration-500 group-hover:scale-105 ${rounded}`}
      />
    );
  };

  return (
    <section
      className={`w-full px-5 sm:px-12 lg:px-24 ${className}`}
    >
      {/* Превью: 1 горизонтальная + 2 квадрата */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        {previewItems[0] && (
          <button
            type="button"
            onClick={() => setActiveItem(previewItems[0])}
            className="group relative col-span-1 sm:col-span-2 aspect-[16/9] sm:aspect-[16/10] w-full overflow-hidden rounded-lg sm:rounded-xl bg-[#181A1B] focus:outline-none focus:ring-2 focus:ring-[#DE063A]"
            aria-label={previewItems[0].alt || 'Открыть фото'}
          >
            {renderMedia(previewItems[0], '(max-width: 640px) 100vw, 66vw')}
          </button>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-1 gap-3 sm:gap-4 lg:gap-6">
          {previewItems.slice(1, 3).map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveItem(item)}
              className="group relative aspect-square w-full overflow-hidden rounded-lg sm:rounded-xl bg-[#181A1B] focus:outline-none focus:ring-2 focus:ring-[#DE063A]"
              aria-label={item.alt || `Открыть фото ${idx + 2}`}
            >
              {renderMedia(item, '(max-width: 640px) 50vw, 33vw')}
            </button>
          ))}
        </div>
      </div>

      {/* Скрытая часть: остальные фото в сетке */}
      {restItems.length > 0 && (
        <div
          className={`grid transition-[grid-template-rows] duration-500 ease-in-out ${
            expanded ? 'grid-rows-[1fr] mt-3 sm:mt-4 lg:mt-6' : 'grid-rows-[0fr]'
          }`}
        >
          <div className="overflow-hidden">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              {restItems.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveItem(item)}
                  className="group relative aspect-square w-full overflow-hidden rounded-lg sm:rounded-xl bg-[#181A1B] focus:outline-none focus:ring-2 focus:ring-[#DE063A]"
                  aria-label={item.alt || `Открыть фото ${idx + previewCount + 1}`}
                >
                  {renderMedia(item, '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw')}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Кнопка переключения */}
      {restItems.length > 0 && (
        <div className="mt-6 sm:mt-8 lg:mt-10 flex justify-center">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-full border-2 border-white text-white font-inter font-semibold text-base sm:text-lg hover:bg-white hover:text-[#0E1011] transition-colors duration-300 cursor-pointer"
          >
            <span>
              {expanded
                ? 'скрыть фото'
                : `ещё фото${restItems.length > 0 ? ` (${restItems.length})` : ''}`}
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
      {activeItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 sm:p-8"
          onClick={() => setActiveItem(null)}
        >
          <button
            type="button"
            aria-label="Закрыть"
            className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setActiveItem(null);
            }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
          <div
            className="relative w-full max-w-5xl aspect-[4/3]"
            onClick={(e) => e.stopPropagation()}
          >
            {activeItem.type === 'video' ? (
              <video
                src={activeItem.src}
                poster={activeItem.poster}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            ) : (
              <Image
                src={activeItem.src}
                alt={activeItem.alt || 'Фото'}
                fill
                sizes="100vw"
                className="object-contain"
              />
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default CollageGallery;
