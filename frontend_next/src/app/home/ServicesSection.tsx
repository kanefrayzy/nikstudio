"use client"

import Image from "next/image";
import { useServiceVideo } from "@/hooks/useServiceVideo";
import { getContentValue, getImageUrl, type HomepageContentBySections } from '@/lib/homepage-content';

interface ServicesSectionProps {
  className?: string;
  content?: HomepageContentBySections | null;
}

export default function ServicesSection({ className, content }: ServicesSectionProps) {
  const { video: videoProductionVideo, loading: videoLoading } = useServiceVideo('video_production');

  // Define services data structure
  const services = [
    {
      section: 'services_1',
      titleKey: 'service_1_title',
      descriptionKey: 'service_1_description',
      subtitleKey: 'service_1_subtitle',
      featuresKey: 'service_1_features',
      imageKey: 'service_1_image',
      layout: 'left',
      bgColor: '',
      fallback: {
        title: 'решения для выставок',
        description: 'Комплексный подход к дизайну и визуализации вашего присутствия на выставке.',
        subtitle: 'Из производственников — в звёзды отрасли',
        features: ['Концепция', 'Пространство', 'Мультимедиа', 'Сопровождение'],
        image: '/images/home/service-1.jpg'
      }
    },
    {
      section: 'services_2',
      titleKey: 'service_2_title',
      descriptionKey: 'service_2_description',
      subtitleKey: 'service_2_subtitle',
      featuresKey: 'service_2_features',
      imageKey: 'service_2_image',
      layout: 'right',
      bgColor: 'bg-[#181A1B]',
      fallback: {
        title: 'стратегия\nbrендинг',
        description: 'Разработка индивидуальной маркетинговой стратегии визуализации с учётом специфики вашей отрасли.\nСоздание целостного визуального месседжа, дизайн-концепции, фирменного стиля, логотипа и брендинга.',
        subtitle: 'Выделяющийся из массы, стильный, технологичный',
        features: ['Концепция брендинга', 'Логотип', 'Позиционирование', 'Гайдлайн'],
        image: '/images/home/service-2.jpg'
      }
    },
    {
      section: 'services_3',
      titleKey: 'service_3_title',
      descriptionKey: 'service_3_description',
      subtitleKey: 'service_3_subtitle',
      featuresKey: 'service_3_features',
      imageKey: 'service_3_image',
      layout: 'left',
      bgColor: '',
      fallback: {
        title: 'ДИЗАЙН\nполиграфии',
        description: 'Стильный и понятный дизайн, отражающий суть продукта, созданный точно под целевого клиента. Изготовление в точной цветопередачей.',
        subtitle: 'Создание полиграфических материалов под ключ',
        features: ['Презентации', 'Буклеты', 'Корпоративные журналы', ''],
        image: '/images/home/service-3.jpg'
      }
    },
    {
      section: 'services_4',
      titleKey: 'service_4_title',
      descriptionKey: 'service_4_description',
      subtitleKey: 'service_4_subtitle',
      featuresKey: 'service_4_features',
      imageKey: 'service_4_image',
      layout: 'right',
      bgColor: 'bg-[#181A1B]',
      fallback: {
        title: 'Фото',
        description: 'Профессиональное фото продукта и процесса производства',
        subtitle: 'Опыт более 15 лет',
        features: ['Фото продукта', 'Портреты команды', 'Съёмка производства', 'Фото мероприятий'],
        image: '/images/home/service-4.jpg'
      }
    },
    {
      section: 'services_5',
      titleKey: 'service_5_title',
      descriptionKey: 'service_5_description',
      subtitleKey: 'service_5_subtitle',
      featuresKey: 'service_5_features',
      imageKey: 'service_5_image',
      layout: 'left',
      bgColor: '',
      fallback: {
        title: '3d графика',
        description: 'Создание промышленного 3д-дизайна, анимация графики',
        subtitle: 'TDM/ERP/CAD',
        features: ['Доработка моделей', 'Текстурирование', 'Анимация 3д', 'Создание рендеров'],
        image: '/images/home/service-5.jpg'
      }
    },
    {
      section: 'services_6',
      titleKey: 'service_6_title',
      descriptionKey: 'service_6_description',
      subtitleKey: 'service_6_subtitle',
      featuresKey: 'service_6_features',
      imageKey: 'service_6_image',
      layout: 'right',
      bgColor: 'bg-[#181A1B]',
      fallback: {
        title: 'web-Сайты',
        description: 'Эксклюзивные продуманные web-сайты, созданные на основе уникального контента: брендинг, фото, видео, 3д графика - всё в едином ключе.',
        subtitle: 'Российские CMS',
        features: ['Мобильная версия', 'Тестирование удобства', 'Современный дизайн', 'UI/UX аудит'],
        image: '/images/home/service-6.jpg'
      }
    },
    {
      section: 'services_7',
      titleKey: 'service_7_title',
      descriptionKey: 'service_7_description',
      subtitleKey: 'service_7_subtitle',
      featuresKey: 'service_7_features',
      imageKey: 'service_7_image',
      layout: 'left',
      bgColor: '',
      isVideo: true,
      fallback: {
        title: 'видео\nпродакшн',
        description: 'Большой опыт позволяет самим создавать сценарий и понятно демонстрировать преимущества вашей компании.',
        subtitle: 'Профессиональная съёмка роликов',
        features: ['Составим сценарий', 'Продумаем детали', 'Создадим стильный', 'информативный ролик'],
        image: '/images/home/service-7.jpg'
      }
    }
  ];

  return (
    <section className={`w-full bg-[#0E1011] flex flex-col mt-[28px] sm:mt-3 ${className || ''}`}>
      <div className="px-5 sm:px-12 lg:px-24 sm:py-24 flex flex-col gap-24">
        {/* Header */}
        <div className="flex flex-col gap-24">
          <div className="flex flex-row justify-between items-center">
            <h3 className="text-white/60 font-cabin font-medium text-[20px] sm:text-2xl lg:text-[32px]">услуги</h3>
            <span className="text-white/60 font-cabin font-medium text-[20px] sm:text-2xl lg:text-[32px]">(02)</span>
          </div>

          <div className="flex flex-col gap-4 -mt-[58px] sm:-mt-3">
            <h2 className="text-white font-geometria font-extrabold text-[60px] sm:text-6xl lg:text-[200px] xl:text-[280px] uppercase leading-none">
              медиа
            </h2>

            <p className="mt-[25px] sm:mt-0 text-white font-inter font-medium sm:font-semibold text-[32px] sm:text-2xl lg:text-[80px] leading-[120%] sm:tracking-[-2px] max-w-[1400px] max-w-full-3xl">
              Создаём проекты комплексно и выполняем отдельные задачи
            </p>
          </div>
        </div>
      </div>

      {/* Service Cards */}
      <div className="flex flex-col">
        {services.map((service, index) => {
          const serviceContent = content?.[service.section as keyof HomepageContentBySections];
          const title = getContentValue(serviceContent, service.titleKey, service.fallback.title);
          const description = getContentValue(serviceContent, service.descriptionKey, service.fallback.description);
          const subtitle = getContentValue(serviceContent, service.subtitleKey, service.fallback.subtitle);
          const featuresStr = getContentValue(serviceContent, service.featuresKey, '');
          const features = featuresStr ? JSON.parse(featuresStr) : service.fallback.features;
          const imageUrl = getImageUrl(serviceContent, service.imageKey, service.fallback.image);

          // Split features into two columns (first half and second half)
          const midPoint = Math.ceil(features.length / 2);
          const firstColumn = features.slice(0, midPoint);
          const secondColumn = features.slice(midPoint);

          const isLeft = service.layout === 'left';
          const hasMarginTop = service.layout === 'right';

          return (
            <div key={service.section} className={`flex flex-col lg:flex-row ${hasMarginTop ? 'mt-[25px] sm:mt-0' : ''}`}>
              {/* Image on left for right layout */}
              {!isLeft && (
                <div className="relative w-full lg:w-2/5 h-[520px] sm:h-[400px] lg:h-[1080px]">
                  {service.isVideo ? (
                    videoLoading ? (
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                      </div>
                    ) : videoProductionVideo?.video_url ? (
                      <video
                        className="w-full h-full object-cover"
                        autoPlay
                        muted
                        loop
                        playsInline
                      >
                        <source src={videoProductionVideo.video_url} type="video/mp4" />
                        Ваш браузер не поддерживает видео.
                      </video>
                    ) : (
                      <video
                        className="w-full h-full object-cover"
                        autoPlay
                        muted
                        loop
                        playsInline
                      >
                        <source src="/video/Авиационный Буксировочный Комплекс Геркулес (АБК ГЕРКУЛЕС).mp4" type="video/mp4" />
                        Ваш браузер не поддерживает видео.
                      </video>
                    )
                  ) : (
                    <Image
                      src={imageUrl}
                      alt={title}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
              )}

              {/* Content */}
              <div className={`w-full lg:w-3/5 px-5 sm:px-12 lg:px-32 py-16 lg:py-32 flex flex-col justify-between gap-12 lg:gap-24 ${service.bgColor}`}>
                <div className="flex flex-col justify-between flex-1">
                  <div className="flex flex-col gap-4">
                    <h3
                      className={`text-white font-geometria font-bold text-[40px] sm:text-4xl xl:text-[80px] 2xl:text-[128px] uppercase leading-none ${isLeft ? 'mt-[10px] sm:mt-0' : '-mt-[40px] sm:mt-0'}`}
                      dangerouslySetInnerHTML={{ __html: title.replace(/\n/g, '<br />') }}
                    />
                    <p
                      className="w-full lg:w-[600px] 2xl:w-[800px] w-full-3xl font-inter text-[20px] sm:text-[40px] leading-[120%] sm:leading-[140%] tracking-[-1px] sm:tracking-normal text-white font-semibold flex-none order-1"
                      dangerouslySetInnerHTML={{ __html: description.replace(/\n/g, '<br />') }}
                    />
                  </div>
                  <div className={`flex flex-col gap-4 lg:gap-8 ${index === 0 ? '-mt-[76px] sm:mt-20 md:mt-11' : index === 1 ? 'mt-[44px] sm:mt-0' : index === 2 ? 'mt-[20px] sm:mt-14' : index === 3 ? 'mt-[24px] sm:mt-0' : 'mt-[20px] sm:mt-0'}`}>
                    <p className="text-white/60 font-cabin text-[16px] sm:text-xl lg:text-[32px] leading-[100%] sm:leading-tight">
                      {subtitle}
                    </p>
                    <div className="grid grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-24">
                      <div className="text-white font-inter font-semibold text-[16px] sm:text-xl lg:text-[32px] leading-[130%] sm:leading-tight">
                        {firstColumn.map((feature: string, idx: number) => (
                          feature && <p key={idx}>{feature}</p>
                        ))}
                      </div>
                      <div className="text-white font-inter font-semibold text-[16px] sm:text-xl lg:text-[32px] leading-[130%] sm:leading-tight">
                        {secondColumn.map((feature: string, idx: number) => (
                          feature && <p key={idx}>{feature}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Image on right for left layout */}
              {isLeft && (
                <div className="relative w-full lg:w-2/5 h-[520px] sm:h-[400px] lg:h-[1080px]">
                  {service.isVideo ? (
                    videoLoading ? (
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                      </div>
                    ) : videoProductionVideo?.video_url ? (
                      <video
                        className="w-full h-full object-cover"
                        autoPlay
                        muted
                        loop
                        playsInline
                      >
                        <source src={videoProductionVideo.video_url} type="video/mp4" />
                        Ваш браузер не поддерживает видео.
                      </video>
                    ) : (
                      <video
                        className="w-full h-full object-cover"
                        autoPlay
                        muted
                        loop
                        playsInline
                      >
                        <source src="/video/Авиационный Буксировочный Комплекс Геркулес (АБК ГЕРКУЛЕС).mp4" type="video/mp4" />
                        Ваш браузер не поддерживает видео.
                      </video>
                    )
                  ) : (
                    <Image
                      src={imageUrl}
                      alt={title}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
