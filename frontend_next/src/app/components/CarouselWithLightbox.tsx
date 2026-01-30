// components/CarouselWithLightbox.tsx
'use client'

import Image from 'next/image'
import LaravelImage from '@/components/LaravelImage'
import { Swiper, SwiperSlide } from 'swiper/react'
import type { Swiper as SwiperType } from 'swiper';
import { Navigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import { useState, useRef, useEffect } from 'react'

type MediaItem = {
  type: 'image' | 'video'
  src: string
  alt: string
  poster?: string
}

type Slide = {
  id: number
  type: 'single' | 'double'
  items: ReadonlyArray<MediaItem>
}

type Props = {
  images: readonly Slide[]
  className?: string
}

export default function CarouselWithLightbox({ images, className = "" }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedSlideIndex, setSelectedSlideIndex] = useState(0)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isMediaFullHeight, setIsMediaFullHeight] = useState(false)
  const [enlargedMediaSrc, setEnlargedMediaSrc] = useState<string | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const swiperRef = useRef<SwiperType | null>(null)
  const lightboxSwiperRef = useRef<SwiperType | null>(null)
  const prevRef = useRef<HTMLButtonElement>(null)
  const nextRef = useRef<HTMLButtonElement>(null)
  const lightboxPrevRef = useRef<HTMLButtonElement>(null)
  const lightboxNextRef = useRef<HTMLButtonElement>(null)
  const slideChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Состояние для обработки свайпа вверх
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null)

  // Функция для открытия лайтбокса с определенным слайдом
  const handleOpen = (slideIndex: number) => {
    setSelectedSlideIndex(slideIndex)
    setIsOpen(true)
  }

  // Функция для поиска индекса слайда по src медиа
  const findSlideIndexBySrc = (src: string): number => {
    return images.findIndex(slide =>
      slide.items.some(item => item.src === src)
    )
  }

  // Обработчик клика на медиа элемент
  const handleMediaClick = (src: string) => {
    const slideIndex = findSlideIndexBySrc(src)
    if (slideIndex !== -1) {
      handleOpen(slideIndex)
    }
  }

  // Обработчик клика на видео в обычном режиме
  const handleVideoClick = (e: React.MouseEvent, src: string) => {
    e.preventDefault()
    e.stopPropagation()

    // Проверяем, был ли клик по элементам управления видео
    const target = e.target as HTMLElement
    if (target.tagName === 'VIDEO' && !target.closest('[controls]')) {
      return
    }

    // Если клик не по controls, открываем лайтбокс
    handleMediaClick(src)
  }

  // Обработчик клика для медиа в лайтбоксе
  const handleLightboxMediaClick = (e: React.MouseEvent, mediaType: 'image' | 'video', mediaSrc: string) => {
    e.preventDefault()
    e.stopPropagation()

    const currentSlide = images[selectedSlideIndex]

    // Если это двойной слайд, обрабатываем увеличение/уменьшение отдельного изображения
    if (currentSlide.type === 'double') {
      if (enlargedMediaSrc === mediaSrc) {
        // Если изображение уже увеличено, уменьшаем его
        setEnlargedMediaSrc(null)
      } else {
        // Увеличиваем выбранное изображение
        setEnlargedMediaSrc(mediaSrc)
      }
      return
    }

    if (mediaType === 'video') {
      // Для видео проверяем, был ли клик по области controls
      const target = e.target as HTMLElement
      if (target.tagName === 'VIDEO') {
        const rect = target.getBoundingClientRect()
        // const clickX = e.clientX - rect.left
        const clickY = e.clientY - rect.top

        // Примерная область controls (обычно внизу видео)
        const controlsHeight = 40 // примерная высота панели управления
        const isControlsArea = clickY > rect.height - controlsHeight

        if (isControlsArea) {
          // Если клик по области controls, не делаем ничего (позволяем видео обработать клик)
          return
        }
      }
    }

    // Toggle размера для одиночного медиа
    setIsMediaFullHeight(!isMediaFullHeight)
  }

  // Обработчик событий видео для предотвращения скрытия контролов
  const handleVideoPlay = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    e.stopPropagation()
    const video = e.currentTarget
    // Принудительно показываем контролы при воспроизведении
    video.setAttribute('controls', 'true')
    video.style.pointerEvents = 'auto'
  }

  const handleVideoPause = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    e.stopPropagation()
    const video = e.currentTarget
    // Убеждаемся, что контролы остаются видимыми
    video.setAttribute('controls', 'true')
    video.style.pointerEvents = 'auto'
  }

  // Обработчик для предотвращения скрытия контролов при различных событиях
  const handleVideoEvent = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    e.stopPropagation()
    const video = e.currentTarget
    // Принудительно сохраняем контролы
    video.setAttribute('controls', 'true')
    video.style.pointerEvents = 'auto'
  }

  // Убираем проблемную инициализацию навигации - будем использовать только onClick handlers

  // Переход к нужному слайду при открытии лайтбокса
  useEffect(() => {
    if (isOpen && lightboxSwiperRef.current) {
      setTimeout(() => {
        lightboxSwiperRef.current?.slideTo(selectedSlideIndex, 0)
      }, 150);
    }
  }, [isOpen, selectedSlideIndex])

  // Сброс состояния размера медиа при смене слайда
  useEffect(() => {
    if (isOpen) {
      setIsMediaFullHeight(false)
      setEnlargedMediaSrc(null)
    }
  }, [selectedSlideIndex, isOpen])

  const handleDotClick = (index: number) => {
    if (swiperRef.current && !isTransitioning) {
      const realIndex = swiperRef.current.realIndex;
      if (index !== realIndex) {
        setIsTransitioning(true);
        swiperRef.current.slideTo(index, 300);
        setTimeout(() => setIsTransitioning(false), 400);
      }
    }
  }

  // Обработчик для предотвращения множественных переключений
  const handleSlideChange = (swiper: SwiperType) => {
    if (slideChangeTimeoutRef.current) {
      clearTimeout(slideChangeTimeoutRef.current);
    }

    slideChangeTimeoutRef.current = setTimeout(() => {
      setCurrentIndex(swiper.realIndex);
    }, 50);
  }

  // Обработчик для лайтбокса с защитой от автопереключения
  const handleLightboxSlideChange = (swiper: SwiperType) => {
    if (slideChangeTimeoutRef.current) {
      clearTimeout(slideChangeTimeoutRef.current);
    }

    slideChangeTimeoutRef.current = setTimeout(() => {
      setSelectedSlideIndex(swiper.realIndex);
      setIsMediaFullHeight(false);
      setEnlargedMediaSrc(null);
    }, 50);
  }

  // Навигация для основной карусели
  const handlePrevSlide = () => {
    if (swiperRef.current && !isTransitioning) {
      setIsTransitioning(true);
      swiperRef.current.slidePrev();
      setTimeout(() => setIsTransitioning(false), 400);
    }
  }

  const handleNextSlide = () => {
    if (swiperRef.current && !isTransitioning) {
      setIsTransitioning(true);
      swiperRef.current.slideNext();
      setTimeout(() => setIsTransitioning(false), 400);
    }
  }

  // Навигация для лайтбокса
  const handleLightboxPrev = () => {
    if (lightboxSwiperRef.current && !isTransitioning) {
      setIsTransitioning(true);
      lightboxSwiperRef.current.slidePrev();
      setTimeout(() => setIsTransitioning(false), 400);
    }
  }

  const handleLightboxNext = () => {
    if (lightboxSwiperRef.current && !isTransitioning) {
      setIsTransitioning(true);
      lightboxSwiperRef.current.slideNext();
      setTimeout(() => setIsTransitioning(false), 400);
    }
  }

  const handleCloseLightbox = () => {
    setIsOpen(false)
    setIsMediaFullHeight(false) // Сбрасываем размер при закрытии
    setEnlargedMediaSrc(null) // Сбрасываем увеличенное изображение
  }

  // Обработчики для свайпа вверх
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null) // Сбрасываем предыдущее значение
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    })
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    })
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const distanceX = touchStart.x - touchEnd.x
    const distanceY = touchStart.y - touchEnd.y
    const isUpSwipe = distanceY > 50 && Math.abs(distanceX) < Math.abs(distanceY)

    if (isUpSwipe) {
      handleCloseLightbox()
    }
  }

  // Обработчик нажатия клавиши Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (enlargedMediaSrc) {
          // Если есть увеличенное изображение, сначала уменьшаем его
          setEnlargedMediaSrc(null)
        } else {
          // Если нет увеличенного изображения, закрываем лайтбокс
          handleCloseLightbox()
        }
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Блокируем прокрутку страницы при открытом лайтбоксе
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
      // Очищаем таймаут при размонтировании
      if (slideChangeTimeoutRef.current) {
        clearTimeout(slideChangeTimeoutRef.current)
      }
    }
  }, [isOpen, enlargedMediaSrc])

  // Cleanup при размонтировании компонента
  useEffect(() => {
    return () => {
      if (slideChangeTimeoutRef.current) {
        clearTimeout(slideChangeTimeoutRef.current)
      }
    }
  }, [])

  return (
    <>
      <div className={`relative ${className}`}>
        <Swiper
          onSwiper={(swiper) => {
            swiperRef.current = swiper
          }}
          onSlideChange={handleSlideChange}
          spaceBetween={30}
          loop={true}
          navigation={false}
          modules={[Navigation]}
          className="w-full custom-swiper cursor-grab active:cursor-grabbing"
          pagination={false}
          allowTouchMove={!isTransitioning}
          touchEventsTarget="container"
          speed={300}
          preventInteractionOnTransition={true}
          resistanceRatio={0.85}
        >
          {images.map((slide, _slideIndex) => (
            <SwiperSlide key={slide.id}>
              {slide.type === 'double' ? (
                <div className="flex flex-row gap-[10px] sm:gap-6">
                  {slide.items.map((media: MediaItem) => (
                    <div
                      key={media.src}
                      className="w-full h-[200px] sm:h-[500px] lg:h-[1080px] relative cursor-zoom-in active:cursor-grabbing"
                      onClick={() => handleMediaClick(media.src)}
                    >
                      {media.type === 'image' ? (
                        <LaravelImage
                          src={media.src}
                          alt={media.alt}
                          fill
                          className="object-cover pointer-events-none"
                        />
                      ) : (
                        <>
                          <video
                            src={media.src}
                            poster={media.poster}
                            className="absolute inset-0 w-full h-full object-cover"
                            controls
                            controlsList="nodownload"
                            preload="metadata"
                            onPlay={handleVideoPlay}
                            onPause={handleVideoPause}
                            onLoadedMetadata={handleVideoEvent}
                            onCanPlay={handleVideoEvent}
                            onTimeUpdate={handleVideoEvent}
                            style={{
                              pointerEvents: 'auto'
                            }}
                          />
                          {/* Overlay для свайпа и лайтбокса - исключаем область controls */}
                          <div
                            className="absolute top-0 left-0 w-full cursor-zoom-in active:cursor-grabbing"
                            style={{
                              height: 'calc(100% - 80px)', // Оставляем нижнюю часть для controls
                              pointerEvents: 'auto',
                              backgroundColor: 'transparent',
                              zIndex: 1
                            }}
                            onClick={(e) => handleVideoClick(e, media.src)}
                            onMouseDown={(e) => {
                              e.preventDefault()
                              // Передаем событие родительскому контейнеру для свайпа
                              const parentDiv = e.currentTarget.parentElement
                              if (parentDiv) {
                                const mouseEvent = new MouseEvent('mousedown', {
                                  bubbles: true,
                                  cancelable: true,
                                  clientX: e.clientX,
                                  clientY: e.clientY,
                                  button: e.button,
                                  buttons: e.buttons
                                })
                                parentDiv.dispatchEvent(mouseEvent)
                              }
                            }}
                          />
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className="w-full h-[200px] sm:h-[500px] lg:h-[1080px] relative cursor-zoom-in active:cursor-grabbing"
                  onClick={() => handleMediaClick(slide.items[0].src)}
                >
                  {slide.items[0].type === 'image' ? (
                    <LaravelImage
                      src={slide.items[0].src}
                      alt={slide.items[0].alt}
                      fill
                      className="object-cover pointer-events-none"
                    />
                  ) : (
                    <>
                      <video
                        src={slide.items[0].src}
                        poster={slide.items[0].poster}
                        className="absolute inset-0 w-full h-full object-cover"
                        controls
                        controlsList="nodownload"
                        preload="metadata"
                        onPlay={handleVideoPlay}
                        onPause={handleVideoPause}
                        onLoadedMetadata={handleVideoEvent}
                        onCanPlay={handleVideoEvent}
                        onTimeUpdate={handleVideoEvent}
                        style={{
                          pointerEvents: 'auto'
                        }}
                      />
                      {/* Overlay для свайпа и лайтбокса - исключаем область controls */}
                      <div
                        className="absolute top-0 left-0 w-full cursor-zoom-in active:cursor-grabbing"
                        style={{
                          height: 'calc(100% - 80px)', // Оставляем нижнюю часть для controls
                          pointerEvents: 'auto',
                          backgroundColor: 'transparent',
                          zIndex: 1
                        }}
                        onClick={(e) => handleVideoClick(e, slide.items[0].src)}
                        onMouseDown={(e) => {
                          e.preventDefault()
                          // Передаем событие родительскому контейнеру для свайпа
                          const parentDiv = e.currentTarget.parentElement
                          if (parentDiv) {
                            const mouseEvent = new MouseEvent('mousedown', {
                              bubbles: true,
                              cancelable: true,
                              clientX: e.clientX,
                              clientY: e.clientY,
                              button: e.button,
                              buttons: e.buttons
                            })
                            parentDiv.dispatchEvent(mouseEvent)
                          }
                        }}
                      />
                    </>
                  )}
                </div>
              )}
            </SwiperSlide>
          ))}
        </Swiper>

        <button
          ref={prevRef}
          className={`absolute top-1/2 left-0 z-10 -translate-y-1/2 cursor-pointer w-[60px] h-[60px] flex items-center justify-center bg-[#0E1011] hover:bg-white transition-colors duration-300 group opacity-50 sm:opacity-100 ${isTransitioning ? 'pointer-events-none' : ''}`}
          aria-label="Previous slide"
          onClick={handlePrevSlide}
          disabled={isTransitioning}
        >
          <Image
            src="/images/media/arrow_left.svg"
            alt="Previous"
            width={21}
            height={21}
            className="[filter:invert(1)] group-hover:[filter:invert(0)]"
          />
        </button>

        <button
          ref={nextRef}
          className={`absolute top-1/2 right-0 z-10 -translate-y-1/2 cursor-pointer w-[60px] h-[60px] flex items-center justify-center bg-[#0E1011] hover:bg-white transition-colors duration-300 group opacity-50 sm:opacity-100 ${isTransitioning ? 'pointer-events-none' : ''}`}
          aria-label="Next slide"
          onClick={handleNextSlide}
          disabled={isTransitioning}
        >
          <Image
            src="/images/media/arrow_right.svg"
            alt="Next"
            width={21}
            height={21}
            className="[filter:invert(1)] group-hover:[filter:invert(0)]"
          />
        </button>

        {/* Кастомные точки навигации */}
        <div
          className="absolute -bottom-[30px] sm:-bottom-[40px] left-1/2 -translate-x-1/2 flex gap-10 z-20"
          role="tablist"
          aria-label="Навигация по слайдам"
        >
          {images.map((_, index) => (
            <button
              key={`dot-${index}`}
              onClick={() => handleDotClick(index)}
              className={`rounded-full transition-all cursor-pointer duration-300 focus:outline-none focus:ring-2 focus:ring-white ${index === currentIndex
                ? 'w-4 sm:w-5 h-4 sm:h-5 bg-[#0e1011] border border-color-white'
                : 'w-3 sm:w-4 h-3 sm:h-4 bg-[#5e6265] hover:bg-[#5e6265] flex flex-row items-center'
                }`}
              role="tab"
              aria-selected={index === currentIndex}
              aria-label={`Слайд ${index + 1}`}
              tabIndex={0}
            />
          ))}
        </div>
      </div>

      {/* Полноэкранный лайтбокс с каруселью */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/95 flex items-center justify-center z-50"
          style={{ userSelect: 'none' }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Кнопка закрытия */}
          <button
            onClick={handleCloseLightbox}
            className="absolute top-4 right-4 z-60 w-12 h-12 flex items-center justify-center bg-black/50 hover:bg-black/70 rounded-full transition-colors duration-300 hover:cursor-pointer"
            aria-label="Закрыть лайтбокс"
            style={{ userSelect: 'none' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-white">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Полноэкранная карусель */}
          <div className="w-full h-full relative" style={{ userSelect: 'none' }}>
            <Swiper
              onSwiper={(swiper) => {
                lightboxSwiperRef.current = swiper
              }}
              onSlideChange={handleLightboxSlideChange}
              spaceBetween={0}
              loop={true}
              navigation={false}
              modules={[Navigation]}
              className="w-full h-full lightbox-swiper cursor-grab active:cursor-grabbing"
              initialSlide={selectedSlideIndex}
              allowTouchMove={!isTransitioning}
              touchEventsTarget="container"
              style={{ userSelect: 'none' }}
              speed={300}
              preventInteractionOnTransition={true}
              autoplay={false}
              freeMode={false}
              watchSlidesProgress={false}
              resistanceRatio={0.85}
            >
              {images.map((slide) => (
                <SwiperSlide key={`lightbox-${slide.id}`} className="flex items-center justify-center" style={{ userSelect: 'none' }}>
                  {slide.type === 'double' ? (
                    <div
                      className={`flex ${enlargedMediaSrc ? 'flex-col' : 'flex-row'} gap-4 w-full h-full items-center justify-center px-4 transition-all duration-300`}
                      style={{ userSelect: 'none' }}
                    >
                      {slide.items.map((media: MediaItem) => {
                        const isEnlarged = enlargedMediaSrc === media.src
                        const isOtherEnlarged = enlargedMediaSrc && enlargedMediaSrc !== media.src

                        return (
                          <div
                            key={`lightbox-${media.src}`}
                            className={`${isEnlarged
                              ? 'w-full h-full'
                              : isOtherEnlarged
                                ? 'hidden'
                                : 'flex-1 h-full'
                              } relative flex items-center justify-center cursor-zoom-in active:cursor-grabbing transition-all duration-300`}
                            style={{ userSelect: 'none' }}
                          >
                            {media.type === 'image' ? (
                              <div 
                                onClick={(e) => handleLightboxMediaClick(e, media.type, media.src)}
                                style={{ userSelect: 'none', pointerEvents: 'auto' }}
                                className="cursor-zoom-in active:cursor-grabbing"
                              >
                                <LaravelImage
                                  src={media.src}
                                  alt={media.alt}
                                  width={0}
                                  height={0}
                                  className={`object-contain ${isEnlarged ? 'max-h-screen' : 'max-h-[90vh]'
                                    } w-auto h-auto max-w-full`}
                                  onLoad={() => console.log('✅ Лайтбокс изображение загружено:', media.src)}
                                  onError={() => console.error('❌ Ошибка лайтбокс изображения:', media.src)}
                                />
                              </div>
                            ) : (
                              <div className="relative">
                                <video
                                  src={media.src}
                                  poster={media.poster}
                                  className={`object-contain ${isEnlarged ? 'max-h-screen' : 'max-h-[90vh]'
                                    } max-w-full`}
                                  controls
                                  controlsList="nodownload"
                                  preload="metadata"
                                  onPlay={handleVideoPlay}
                                  onPause={handleVideoPause}
                                  onLoadedMetadata={handleVideoEvent}
                                  onCanPlay={handleVideoEvent}
                                  onTimeUpdate={handleVideoEvent}
                                  style={{
                                    userSelect: 'none',
                                    pointerEvents: 'auto'
                                  }}
                                />
                                {/* Overlay для zoom - исключаем область controls */}
                                <div
                                  className="absolute top-0 left-0 w-full cursor-zoom-in active:cursor-grabbing"
                                  style={{
                                    height: 'calc(100% - 80px)', // Оставляем нижнюю часть для controls
                                    pointerEvents: 'auto',
                                    backgroundColor: 'transparent',
                                    zIndex: 1,
                                    userSelect: 'none'
                                  }}
                                  onClick={(e) => handleLightboxMediaClick(e, media.type, media.src)}
                                  onMouseDown={(e) => {
                                    e.preventDefault()
                                    // Передаем событие родительскому контейнеру для свайпа
                                    const parentDiv = e.currentTarget.parentElement?.parentElement?.parentElement
                                    if (parentDiv) {
                                      const mouseEvent = new MouseEvent('mousedown', {
                                        bubbles: true,
                                        cancelable: true,
                                        clientX: e.clientX,
                                        clientY: e.clientY,
                                        button: e.button,
                                        buttons: e.buttons
                                      })
                                      parentDiv.dispatchEvent(mouseEvent)
                                    }
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center px-4"
                      style={{ userSelect: 'none' }}
                    >
                      {slide.items[0].type === 'image' ? (
                        <div 
                          onClick={(e) => handleLightboxMediaClick(e, slide.items[0].type, slide.items[0].src)}
                          style={{ userSelect: 'none', pointerEvents: 'auto' }}
                          className={isMediaFullHeight ? 'cursor-zoom-out active:cursor-grabbing' : 'cursor-zoom-in active:cursor-grabbing'}
                        >
                          <LaravelImage
                            src={slide.items[0].src}
                            alt={slide.items[0].alt}
                            width={0}
                            height={0}
                            className={`object-contain ${isMediaFullHeight ? 'max-h-screen' : 'max-h-[90vh]'
                              } w-auto h-auto max-w-full`}
                            onLoad={() => console.log('✅ Полноэкранное изображение загружено:', slide.items[0].src)}
                            onError={() => console.error('❌ Ошибка полноэкранного изображения:', slide.items[0].src)}
                          />
                        </div>
                      ) : (
                        <div className="relative">
                          <video
                            src={slide.items[0].src}
                            poster={slide.items[0].poster}
                            className={`object-contain ${isMediaFullHeight ? 'max-h-screen' : 'max-h-[90vh]'
                              } max-w-full`}
                            controls
                            controlsList="nodownload"
                            preload="metadata"
                            onPlay={handleVideoPlay}
                            onPause={handleVideoPause}
                            onLoadedMetadata={handleVideoEvent}
                            onCanPlay={handleVideoEvent}
                            onTimeUpdate={handleVideoEvent}
                            style={{
                              userSelect: 'none',
                              pointerEvents: 'auto'
                            }}
                          />
                          {/* Overlay для zoom - исключаем область controls */}
                          <div
                            className={`absolute top-0 left-0 w-full ${isMediaFullHeight ? 'cursor-zoom-out active:cursor-grabbing' : 'cursor-zoom-in active:cursor-grabbing'
                              }`}
                            style={{
                              height: 'calc(100% - 80px)', // Оставляем нижнюю часть для controls
                              pointerEvents: 'auto',
                              backgroundColor: 'transparent',
                              zIndex: 1,
                              userSelect: 'none'
                            }}
                            onClick={(e) => handleLightboxMediaClick(e, slide.items[0].type, slide.items[0].src)}
                            onMouseDown={(e) => {
                              e.preventDefault()
                              // Передаем событие родительскому контейнеру для свайпа
                              const parentDiv = e.currentTarget.parentElement?.parentElement?.parentElement
                              if (parentDiv) {
                                const mouseEvent = new MouseEvent('mousedown', {
                                  bubbles: true,
                                  cancelable: true,
                                  clientX: e.clientX,
                                  clientY: e.clientY,
                                  button: e.button,
                                  buttons: e.buttons
                                })
                                parentDiv.dispatchEvent(mouseEvent)
                              }
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </SwiperSlide>
              ))}
            </Swiper>

            {/* Кастомные стрелки для лайтбокса */}
            <button
              ref={lightboxPrevRef}
              className={`absolute top-1/2 left-0 z-10 -translate-y-1/2 cursor-pointer w-[60px] h-[60px] flex items-center justify-center bg-[#0E1011] hover:bg-white transition-colors duration-300 group opacity-50 sm:opacity-100 ${isTransitioning ? 'pointer-events-none' : ''}`}
              aria-label="Previous slide"
              onClick={handleLightboxPrev}
              disabled={isTransitioning}
            >
              <Image
                src="/images/media/arrow_left.svg"
                alt="Previous"
                width={21}
                height={21}
                className="[filter:invert(1)] group-hover:[filter:invert(0)]"
              />
            </button>

            <button
              ref={lightboxNextRef}
              className={`absolute top-1/2 right-0 z-10 -translate-y-1/2 cursor-pointer w-[60px] h-[60px] flex items-center justify-center bg-[#0E1011] hover:bg-white transition-colors duration-300 group opacity-50 sm:opacity-100 ${isTransitioning ? 'pointer-events-none' : ''}`}
              aria-label="Next slide"
              onClick={handleLightboxNext}
              disabled={isTransitioning}
            >
              <Image
                src="/images/media/arrow_right.svg"
                alt="Next"
                width={21}
                height={21}
                className="[filter:invert(1)] group-hover:[filter:invert(0)]"
              />
            </button>
          </div>
        </div>
      )}
    </>
  )
}