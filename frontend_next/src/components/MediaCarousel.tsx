"use client";

import Image from 'next/image';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSwipeable } from 'react-swipeable';

// MediaItem interface
export interface MediaItem {
  type: "image" | "video";
  src: string;
  poster?: string;
}

// MediaCarousel props interface
export interface MediaCarouselProps {
  items: MediaItem[];
  height?: string;
  altPrefix?: string;
  ariaLabel?: string;
}

export default function MediaCarousel({ 
  items, 
  height = "h-[500px] sm:h-[700px] lg:h-[1080px]", 
  altPrefix = "ИКАР изображение",
  ariaLabel = "Галерея"
}: MediaCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const currentVideoRef = useRef<HTMLVideoElement>(null);
  
  // Handle dot navigation
  const handleDotClick = (index: number) => {
    if (currentIndex !== index && !isTransitioning) {
      // Pause current video if it's playing
      if (items[currentIndex].type === "video" && currentVideoRef.current) {
        currentVideoRef.current.pause();
      }
      
      setIsTransitioning(true);
      setCurrentIndex(index);
      
      // Reset transition state after animation completes
      setTimeout(() => {
        setIsTransitioning(false);
      }, 500); // Match this with the CSS transition duration
    }
  };
  
  // Handle swipe navigation
  const handleNext = useCallback(() => {
    if (!isTransitioning) {
      // Pause current video if it's playing
      if (items[currentIndex].type === "video" && currentVideoRef.current) {
        currentVideoRef.current.pause();
      }
      
      setIsTransitioning(true);
      setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length);
      
      setTimeout(() => {
        setIsTransitioning(false);
      }, 500);
    }
  }, [isTransitioning, items, currentIndex]);
  
  const handlePrev = useCallback(() => {
    if (!isTransitioning) {
      // Pause current video if it's playing
      if (items[currentIndex].type === "video" && currentVideoRef.current) {
        currentVideoRef.current.pause();
      }
      
      setIsTransitioning(true);
      setCurrentIndex((prevIndex) => (prevIndex - 1 + items.length) % items.length);
      
      setTimeout(() => {
        setIsTransitioning(false);
      }, 500);
    }
  }, [isTransitioning, items, currentIndex]);
  
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
        handlePrev();
      } else if (dragDistance < -threshold) {
        handleNext();
      }
      
      setIsDragging(false);
    }
  };
  
  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
    }
  };
  
  // Get swipe handlers but don't use the ref
  const { ref: _swipeRef, ...swipeHandlers } = useSwipeable({
    onSwipedLeft: handleNext,
    onSwipedRight: handlePrev,
    trackMouse: false, // We handle mouse events separately
    preventScrollOnSwipe: true
  });
  
  // Apply the swipe ref manually to our ref element when it changes
  useEffect(() => {
    if (carouselRef.current) {
      _swipeRef(carouselRef.current);
    }
  }, [_swipeRef]);
  
  return (
    <div 
      ref={carouselRef}
      className={`relative w-full ${height} ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} overflow-hidden`}
      {...swipeHandlers}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      role="region"
      aria-label={ariaLabel}
    >
      {/* Media Items */}
      {items.map((item, index) => (
        <div 
          key={item.src}
          className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
            index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
          aria-hidden={index !== currentIndex}
        >
          {item.type === "image" ? (
            <Image
              src={item.src}
              alt={`${altPrefix} ${index + 1}`}
              fill
              className="object-cover"
              priority={index === 0}
              draggable={false}
            />
          ) : (
            <video
              // Only use ref for current video
              ref={index === currentIndex ? currentVideoRef : undefined}
              src={item.src}
              poster={item.poster}
              className="absolute inset-0 w-full h-full object-cover"
              controls={index === currentIndex}
              controlsList="nodownload"
              preload="metadata"
              playsInline
              draggable={false}
            />
          )}
        </div>
      ))}
      
      {/* Slider Dots */}
      <div 
        className="absolute bottom-[20px] left-1/2 -translate-x-1/2 flex gap-10 z-20"
        role="tablist"
        aria-label={`Навигация по ${ariaLabel.toLowerCase()}`}
      >
        {items.map((_, index) => (
          <button
            key={`dot-${index}`}
            onClick={() => handleDotClick(index)}
            className={`rounded-full transition-all cursor-pointer duration-300 focus:outline-none focus:ring-2 focus:ring-white ${
              index === currentIndex 
                ? 'w-5 h-5 bg-[#0E1011]' 
                : 'w-4 h-4 bg-white/60 hover:bg-white/80'
            }`}
            role="tab"
            aria-selected={index === currentIndex}
            aria-label={`${items[index].type === "image" ? "Изображение" : "Видео"} ${index + 1}`}
            tabIndex={0}
          />
        ))}
      </div>
    </div>
  );
} 