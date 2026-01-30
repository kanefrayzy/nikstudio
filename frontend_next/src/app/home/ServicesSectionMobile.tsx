"use client"

import Image from "next/image";
import Link from "next/link";
import { useServiceVideo } from "@/hooks/useServiceVideo";
import { getContentValue, getImageUrl, type HomepageContentBySections } from '@/lib/homepage-content';

interface ServicesSectionProps {
    className?: string;
    content?: HomepageContentBySections | null;
}

export default function ServicesSectionMobile({ className, content }: ServicesSectionProps) {
    const { video: videoProductionVideo, loading: videoLoading } = useServiceVideo('video_production');
    
    // Define services data structure (same as desktop but simplified for mobile)
    const services = [
        {
            section: 'services_1',
            titleKey: 'service_1_title',
            descriptionKey: 'service_1_description',
            subtitleKey: 'service_1_subtitle',
            featuresKey: 'service_1_features',
            imageKey: 'service_1_image',
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
            fallback: {
                title: 'стратегия брендинг',
                description: 'Разработка индивидуальной маркетинговой стратегии визуализации с учётом специфики вашей отрасли.\n\nСоздание целостного визуального месседжа, дизайн-концепции, фирменного стиля, логотипа и брендинга.',
                subtitle: 'Выделяющийся из массы, стильный, технологичный',
                features: ['Концепция', 'Пространство', 'Мультимедиа', 'Сопровождение'],
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
            fallback: {
                title: 'ДИЗАЙН',
                description: 'Комплексный подход к дизайну и визуализации вашего присутствия на выставке.',
                subtitle: 'Из производственников — в звёзды отрасли',
                features: ['Концепция', 'Пространство', 'Мультимедиа', 'Сопровождение'],
                image: '/images/home/service-3.jpg'
            }
        },
        {
            section: 'services_5',
            titleKey: 'service_5_title',
            descriptionKey: 'service_5_description',
            subtitleKey: 'service_5_subtitle',
            featuresKey: 'service_5_features',
            imageKey: 'service_5_image',
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
            isVideo: true,
            fallback: {
                title: 'видео продакшн',
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
                        <h2 className="text-white font-geometria font-extrabold sm:font-bold text-[60px] sm:text-6xl lg:text-[200px] xl:text-[280px] uppercase leading-none">
                            медиа
                        </h2>

                        <p className="mt-[25px] sm:mt-0 text-white font-inter font-medium sm:font-semibold text-[32px] sm:text-2xl lg:text-[80px] leading-[120%] sm:tracking-[-2px] max-w-[1400px] max-w-full-3xl">
                            Создаём проекты комплексно и выполняем отдельные задачи
                        </p>
                    </div>
                </div>
            </div>

            {/* Service Cards */}
            <div className="flex flex-col gap-[60px] mt-[80px]">
                {services.map((service) => {
                    const serviceContent = content?.[service.section as keyof HomepageContentBySections];
                    const title = getContentValue(serviceContent, service.titleKey, service.fallback.title);
                    const description = getContentValue(serviceContent, service.descriptionKey, service.fallback.description);
                    const subtitle = getContentValue(serviceContent, service.subtitleKey, service.fallback.subtitle);
                    const featuresStr = getContentValue(serviceContent, service.featuresKey, '');
                    const features = featuresStr ? JSON.parse(featuresStr) : service.fallback.features;
                    const imageUrl = getImageUrl(serviceContent, service.imageKey, service.fallback.image);
                    
                    // Split features into two columns
                    const midPoint = Math.ceil(features.length / 2);
                    const firstColumn = features.slice(0, midPoint);
                    const secondColumn = features.slice(midPoint);

                    return (
                        <div key={service.section} className="flex flex-col gap-5">
                            {/* Title */}
                            <div className="px-5">
                                <h3 className="text-white font-geometria font-bold text-[40px] uppercase leading-[1em]">
                                    {title}
                                </h3>
                            </div>

                            {/* Image Wrapper */}
                            <div className="relative w-full h-[520px] overflow-hidden">
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

                            {/* Content Frame */}
                            <div className="px-5 flex flex-col gap-5">
                                <div className="flex flex-col gap-4">
                                    <p 
                                        className="text-white font-inter font-semibold text-[20px] leading-[1.2em] tracking-[-1px]"
                                        dangerouslySetInnerHTML={{ __html: description.replace(/\n/g, '<br />') }}
                                    />
                                </div>
                                <div className="flex flex-col gap-5">
                                    <p className="text-white/60 font-cabin text-[16px] leading-[1em]">
                                        {subtitle}
                                    </p>
                                    <div className="flex gap-5">
                                        <div className="flex-1 text-white font-inter font-semibold text-[16px] leading-[1.3em]">
                                            {firstColumn.map((feature: string, idx: number) => (
                                                feature && <p key={idx}>{feature}</p>
                                            ))}
                                        </div>
                                        <div className="flex-1 text-white font-inter font-semibold text-[16px] leading-[1.3em]">
                                            {secondColumn.map((feature: string, idx: number) => (
                                                feature && <p key={idx}>{feature}</p>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* All Projects Button */}
            <div className="mx-auto mt-[60px] mb-[80px]">
                <Link href="/projects">
                    <button className="flex items-center justify-center gap-2 px-4 py-2 border border-white rounded-full bg-transparent hover:bg-white/10 transition-colors">
                        <span className="text-white font-inter font-semibold text-base leading-none">
                            все проекты
                        </span>
                    </button>
                </Link>
            </div>

        </section>
    );
}