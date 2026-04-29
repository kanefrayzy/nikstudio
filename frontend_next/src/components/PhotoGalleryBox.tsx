'use client';

import React, { useState } from 'react';
import Image from 'next/image';

export interface GalleryPhoto {
  src: string;
  alt?: string;
  caption?: string;
}

interface PhotoGalleryBoxProps {
  /** Заголовок бокса */
  title?: string;
  /** Подзаголовок / описание */
  description?: string;
  /** Текст на кнопке (закрытое состояние) */
  toggleLabel?: string;
  /** Текст на кнопке (открытое состояние) */
  toggleLabelOpen?: string;
  /** Список фотографий */
  photos: GalleryPhoto[];
  /** Открыто ли по умолчанию */
  defaultOpen?: boolean;
  className?: string;
}

/**
 * Адаптивный бокс с галереей фотографий, раскрывающейся вниз.
 * Корректно отображается на мобильных, планшетах и десктопе.
 */
const PhotoGalleryBox: React.FC<PhotoGalleryBoxProps> = ({
  title = 'Галерея',
  description,
  toggleLabel = 'Показать фото',
  toggleLabelOpen = 'Скрыть фото',
  photos,
  defaultOpen = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [activePhoto, setActivePhoto] = useState<GalleryPhoto | null>(null);

  return (
    <section
      className={`w-full px-5 sm:px-12 lg:px-24 py-12 sm:py-16 lg:py-24 ${className}`}
    >
      <div className="mx-auto w-full max-w-[1600px]">
        {/* Box wrapper */}
        <div className="rounded-2xl sm:rounded-3xl bg-[#181A1B] border border-white/10 overflow-hidden shadow-lg">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 p-6 sm:p-8 lg:p-10">
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-geometria font-semibold text-2xl sm:text-3xl lg:text-4xl leading-tight">
                {title}
              </h3>
              {description && (
                <p className="mt-2 text-white/60 font-inter text-sm sm:text-base lg:text-lg leading-relaxed">
                  {description}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsOpen((v) => !v)}
              aria-expanded={isOpen}
              aria-controls="photo-gallery-content"
              className="self-start sm:self-auto inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3 sm:py-4 rounded-full bg-white text-[#0E1011] font-inter font-semibold text-sm sm:text-base hover:bg-[#DE063A] hover:text-white transition-colors duration-300 cursor-pointer whitespace-nowrap"
            >
              <span>{isOpen ? toggleLabelOpen : toggleLabel}</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
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

          {/* Collapsible gallery */}
          <div
            id="photo-gallery-content"
            className={`grid transition-[grid-template-rows] duration-500 ease-in-out ${
              isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
            }`}
          >
            <div className="overflow-hidden">
              <div className="px-6 sm:px-8 lg:px-10 pb-6 sm:pb-8 lg:pb-10">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                  {photos.map((photo, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActivePhoto(photo)}
                      className="group relative aspect-square w-full overflow-hidden rounded-lg sm:rounded-xl bg-[#0E1011] focus:outline-none focus:ring-2 focus:ring-[#DE063A]"
                      aria-label={photo.alt || `Открыть фото ${idx + 1}`}
                    >
                      <Image
                        src={photo.src}
                        alt={photo.alt || `Фото ${idx + 1}`}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      {photo.caption && (
                        <span className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/70 to-transparent text-white text-xs sm:text-sm font-inter opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          {photo.caption}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {activePhoto && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 sm:p-8"
          onClick={() => setActivePhoto(null)}
        >
          <button
            type="button"
            aria-label="Закрыть"
            className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setActivePhoto(null);
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
            <Image
              src={activePhoto.src}
              alt={activePhoto.alt || 'Фото'}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>
        </div>
      )}
    </section>
  );
};

export default PhotoGalleryBox;
