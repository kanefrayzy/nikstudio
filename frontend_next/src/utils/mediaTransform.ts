import { Service, Step, TestimonialLegacy } from '@/types/media';

/**
 * Transform API media page data to match existing component interfaces
 */
export const transformMediaPageData = (apiData: any) => {
  console.log('🔄 Начало трансформации данных медиа страницы');
  console.log('📊 Исходные данные API:', JSON.stringify(apiData, null, 2));

  // Transform services to match existing ServiceSection component interface
  const transformedServices: Service[] = apiData.services.map((service: any) => ({
    id: service.id,
    title: service.title,
    description: service.description,
    slides: transformMediaToSlides(service.media || []),
    features: service.features.map((feature: any) => ({
      title: feature.title,
      description: feature.description
    })),
    darkBackground: service.darkBackground
  }));

  // Transform testimonials to match existing component interface
  console.log('👥 Трансформация отзывов...');
  console.log('📝 Исходные отзывы из API:', JSON.stringify(apiData.testimonials, null, 2));
  
  const transformedTestimonials: TestimonialLegacy[] = apiData.testimonials.items.map((testimonial: any, index: number) => {
    console.log(`🔍 Обработка отзыва ${index + 1}:`, {
      id: testimonial.id,
      company: testimonial.company,
      originalImage: testimonial.image,
      imageExists: !!testimonial.image
    });
    
    const transformedImage = testimonial.image ? addStoragePrefix(testimonial.image) : '';
    console.log(`🖼️ Трансформированное изображение для отзыва ${index + 1}:`, transformedImage);
    
    return {
      company: testimonial.company,
      quote: testimonial.quote,
      text: testimonial.description, // API uses 'description' instead of 'text'
      image: transformedImage
    };
  });
  
  console.log('✅ Результат трансформации отзывов:', JSON.stringify(transformedTestimonials, null, 2));

  // Transform process steps to match existing component interface
  const transformedProcessSteps: Step[] = apiData.process.steps.map((step: any) => ({
    id: step.stepNumber,
    title: step.title,
    subtitle: step.subtitle,
    image: addStoragePrefix(step.image),
    description: {
      left: step.descriptionLeft,
      right: step.descriptionRight
    }
  }));

  const finalData = {
    services: transformedServices,
    testimonials: transformedTestimonials,
    testimonialsData: {
      title: apiData.testimonials.title,
      subtitle: apiData.testimonials.subtitle
    },
    processData: {
      title: apiData.process.title,
      subtitle: apiData.process.subtitle,
      steps: transformedProcessSteps
    },
    heroData: {
      title: apiData.hero.title,
      description: apiData.hero.description
    }
  };

  console.log('🎯 Финальные трансформированные данные:', JSON.stringify(finalData, null, 2));
  console.log('📊 Количество отзывов в финальных данных:', finalData.testimonials.length);
  
  return finalData;
};

/**
 * Transform media array to slides format
 * Each media group from admin becomes one slide with main + secondary side by side
 */
const transformMediaToSlides = (mediaArray: any[]) => {
  console.log('🎬 transformMediaToSlides input:', JSON.stringify(mediaArray, null, 2));
  
  const result = mediaArray.map((mediaGroup: any, index: number) => {
    console.log(`📦 Processing media group ${index}:`, JSON.stringify(mediaGroup, null, 2));
    
    // Transform main media
    const mainMedia = mediaGroup.main;
    const mainType = mainMedia?.type || 'image';
    const mainIsVideo = mainType === 'video';
    const mainImage = mainMedia?.src ? addStoragePrefix(mainMedia.src, mainIsVideo) : '';
    const mainPoster = mainMedia?.poster ? addStoragePrefix(mainMedia.poster, false) : null;
    
    console.log(`🎯 Main media for group ${index}:`, { mainImage, mainType, mainPoster });
    
    // Transform secondary media - handle both array and single object
    const secondaryArray = mediaGroup.secondary || [];
    console.log(`📎 Secondary array for group ${index}:`, JSON.stringify(secondaryArray, null, 2));
    
    let secondaryImage = '';
    let secondaryType = 'image';
    let secondaryPoster: string | null = null;
    
    // Get first valid secondary item
    if (Array.isArray(secondaryArray) && secondaryArray.length > 0) {
      const firstSecondary = secondaryArray[0];
      if (firstSecondary?.src) {
        secondaryType = firstSecondary?.type || 'image';
        const secondaryIsVideo = secondaryType === 'video';
        secondaryImage = addStoragePrefix(firstSecondary.src, secondaryIsVideo);
        secondaryPoster = firstSecondary.poster ? addStoragePrefix(firstSecondary.poster, false) : null;
      }
    } else if (secondaryArray?.src) {
      // Handle case when secondary is a single object, not array
      secondaryType = secondaryArray?.type || 'image';
      const secondaryIsVideo = secondaryType === 'video';
      secondaryImage = addStoragePrefix(secondaryArray.src, secondaryIsVideo);
      secondaryPoster = secondaryArray.poster ? addStoragePrefix(secondaryArray.poster, false) : null;
    }
    
    console.log(`🎯 Secondary media for group ${index}:`, { secondaryImage, secondaryType, secondaryPoster });
    
    const slideData = {
      mainImage,
      mainPoster,
      mainType,
      secondaryImage,
      secondaryPoster,
      secondaryType
    };
    
    console.log(`✅ Slide ${index} result:`, JSON.stringify(slideData, null, 2));
    return slideData;
  });
  
  // Filter out slides that have no valid media at all
  const filteredResult = result.filter(slide => slide.mainImage || slide.secondaryImage);
  
  console.log('🎯 transformMediaToSlides final result:', JSON.stringify(filteredResult, null, 2));
  return filteredResult;
};

/**
 * Add storage prefix to file paths for Laravel images
 */
const addStoragePrefix = (filePath: string | null, isVideo: boolean = false): string => {
  if (!filePath) {
    console.warn('⚠️ Пустой путь к файлу');
    return '';
  }
  
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  
  // Если уже полный URL, возвращаем как есть
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    console.log('🔗 Полный URL файла:', filePath);
    return filePath;
  }
  
  // Для видео используем /api/video/ для поддержки Range requests
  if (isVideo) {
    // Убираем /storage/ префикс если есть
    const cleanPath = filePath.startsWith('/storage/') 
      ? filePath.substring(9) 
      : filePath.startsWith('/') 
        ? filePath.substring(1) 
        : filePath;
    const videoUrl = `${apiUrl}/api/video/${cleanPath}`;
    console.log('🎥 URL видео через API:', videoUrl);
    return videoUrl;
  }
  
  // Для изображений используем обычный /storage/ путь
  if (filePath.startsWith('/storage/')) {
    const laravelStorageUrl = `${apiUrl}${filePath}`;
    console.log('📁 URL с /storage/ префиксом:', laravelStorageUrl);
    return laravelStorageUrl;
  }
  
  // Добавляем Laravel storage URL с полным путем
  const laravelStorageUrl = `${apiUrl}/storage/${filePath}`;
  console.log('🖼️ Сформированный URL изображения:', laravelStorageUrl);
  return laravelStorageUrl;
};

/**
 * Fallback data when API is unavailable
 */
export const getFallbackMediaData = () => {
  return {
    services: [] as Service[],
    testimonials: [] as TestimonialLegacy[],
    testimonialsData: {
      title: "говорят о нас",
      subtitle: "Команда NIKstudio закрывает целый ряд задач с энтузиазмом и полной ответственностью"
    },
    processData: {
      title: "процесс",
      subtitle: "Процесс работы строится на взаимодействии всех специалистов под единым руководством",
      steps: [] as Step[]
    },
    heroData: {
      title: "МЕДИА",
      description: "Создаём проекты комплексно и выполняем отдельные задачи"
    }
  };
};