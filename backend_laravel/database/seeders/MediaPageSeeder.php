<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\MediaPageContent;
use App\Models\MediaService;
use App\Models\MediaServiceFeature;
use App\Models\MediaServiceMedia;
use App\Models\MediaTestimonial;
use App\Models\MediaProcessStep;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Exception;

class MediaPageSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        try {
            $this->command->info('Starting MediaPageSeeder...');
            
            // Create media page content with validation
            $this->seedMediaPageContent();
            
            // Clear existing data
            $this->clearExistingData();
            
            // Seed all services from mediaServices.ts
            $this->seedMediaServices();
            
            // Seed testimonials
            $this->seedTestimonials();
            
            // Seed process steps
            $this->seedProcessSteps();
            
            $this->command->info('MediaPageSeeder completed successfully!');
            
        } catch (Exception $e) {
            $this->command->error('MediaPageSeeder failed: ' . $e->getMessage());
            Log::error('MediaPageSeeder error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Seed media page content with validation
     */
    private function seedMediaPageContent(): void
    {
        $contentData = [
            'hero_title' => 'Медиа услуги',
            'hero_description' => 'Комплексные решения для вашего бизнеса',
            'testimonials_title' => 'Отзывы клиентов',
            'testimonials_subtitle' => 'Что говорят о нас наши клиенты',
            'process_title' => 'Наш процесс работы',
            'process_subtitle' => 'Как мы работаем с проектами'
        ];

        $this->validateData($contentData, [
            'hero_title' => 'required|string|max:255',
            'hero_description' => 'required|string|max:1000',
            'testimonials_title' => 'required|string|max:255',
            'testimonials_subtitle' => 'required|string|max:255',
            'process_title' => 'required|string|max:255',
            'process_subtitle' => 'required|string|max:255',
        ], 'Media Page Content');

        MediaPageContent::updateOrCreate(['id' => 1], $contentData);
        $this->command->info('✓ Media page content seeded');
    }

    /**
     * Clear existing data
     */
    private function clearExistingData(): void
    {
        MediaServiceMedia::truncate();
        MediaServiceFeature::truncate();
        MediaService::truncate();
        MediaTestimonial::truncate();
        MediaProcessStep::truncate();
        $this->command->info('✓ Existing data cleared');
    }

    /**
     * Seed all media services from mediaServices.ts
     */
    private function seedMediaServices(): void
    {
        // Complete media services data from mediaServices.ts
        $servicesData = $this->getCompleteServicesData();

        // Create all services with validation
        foreach ($servicesData as $serviceData) {
            // Validate service data
            $this->validateData($serviceData, [
                'title' => 'required|string|max:255',
                'description' => 'required|string|max:1000',
                'order' => 'required|integer|min:1',
                'dark_background' => 'required|boolean',
                'slides' => 'required|array|min:1',
                'features' => 'required|array|min:1'
            ], "Service: {$serviceData['title']}");

            $service = MediaService::create([
                'title' => $serviceData['title'],
                'description' => $serviceData['description'],
                'order' => $serviceData['order'],
                'dark_background' => $serviceData['dark_background']
            ]);

            // Create features for the service
            foreach ($serviceData['features'] as $index => $featureData) {
                $this->validateData($featureData, [
                    'title' => 'required|string|max:255',
                    'description' => 'required|array|min:1'
                ], "Feature: {$featureData['title']}");

                MediaServiceFeature::create([
                    'service_id' => $service->id,
                    'title' => $featureData['title'],
                    'description' => $featureData['description'],
                    'order' => $index + 1
                ]);
            }

            // Create media items for the service
            foreach ($serviceData['slides'] as $index => $slide) {
                $groupId = $index + 1;
                
                // Validate slide data
                $this->validateData($slide, [
                    'mainImage' => 'required|string',
                    'secondaryImage' => 'required|string'
                ], "Slide {$groupId} for service: {$serviceData['title']}");
                
                // Determine file type based on extension
                $mainFileType = str_ends_with($slide['mainImage'], '.mp4') ? 'video' : 'image';
                $secondaryFileType = str_ends_with($slide['secondaryImage'], '.mp4') ? 'video' : 'image';
                
                // Main media
                MediaServiceMedia::create([
                    'service_id' => $service->id,
                    'group_id' => $groupId,
                    'media_type' => 'main',
                    'file_type' => $mainFileType,
                    'file_path' => $slide['mainImage'],
                    'alt_text' => "Main media {$groupId}",
                    'order' => $groupId
                ]);

                // Secondary media
                MediaServiceMedia::create([
                    'service_id' => $service->id,
                    'group_id' => $groupId,
                    'media_type' => 'secondary',
                    'file_type' => $secondaryFileType,
                    'file_path' => $slide['secondaryImage'],
                    'alt_text' => "Secondary media {$groupId}",
                    'order' => $groupId
                ]);
            }
        }

        $this->command->info('✓ All media services seeded (' . count($servicesData) . ' services)');
    }

    /**
     * Seed testimonials
     */
    private function seedTestimonials(): void
    {
        $testimonialsData = [
            [
                'company' => 'ООО "Технологии будущего"',
                'quote' => 'Отличная работа команды!',
                'description' => 'Команда проявила высокий профессионализм и креативность в решении наших задач.',
                'image_path' => '/images/testimonials/company1.jpg',
                'order' => 1
            ],
            [
                'company' => 'АО "Инновационные решения"',
                'quote' => 'Превосходное качество услуг',
                'description' => 'Результат превзошел все наши ожидания. Рекомендуем всем партнерам.',
                'image_path' => '/images/testimonials/company2.jpg',
                'order' => 2
            ],
            [
                'company' => 'ЗАО "Промышленные системы"',
                'quote' => 'Профессиональный подход к каждому проекту',
                'description' => 'Высокое качество исполнения и соблюдение всех сроков. Будем продолжать сотрудничество.',
                'image_path' => '/images/testimonials/company3.jpg',
                'order' => 3
            ]
        ];

        foreach ($testimonialsData as $testimonialData) {
            $this->validateData($testimonialData, [
                'company' => 'required|string|max:255',
                'quote' => 'required|string|max:500',
                'description' => 'required|string|max:1000',
                'image_path' => 'required|string',
                'order' => 'required|integer|min:1'
            ], "Testimonial: {$testimonialData['company']}");

            MediaTestimonial::create($testimonialData);
        }

        $this->command->info('✓ Testimonials seeded (' . count($testimonialsData) . ' testimonials)');
    }

    /**
     * Seed process steps
     */
    private function seedProcessSteps(): void
    {
        $processStepsData = [
            [
                'step_number' => '01',
                'title' => 'Анализ и планирование',
                'subtitle' => 'Изучение требований',
                'image_path' => '/images/process/step1.jpg',
                'description_left' => 'Детальный анализ потребностей клиента и постановка задач.',
                'description_right' => 'Разработка стратегии и планирование этапов реализации проекта.',
                'order' => 1
            ],
            [
                'step_number' => '02',
                'title' => 'Концепция и дизайн',
                'subtitle' => 'Творческий процесс',
                'image_path' => '/images/process/step2.jpg',
                'description_left' => 'Создание уникальной концепции и визуального решения.',
                'description_right' => 'Проработка деталей дизайна с учетом всех требований.',
                'order' => 2
            ],
            [
                'step_number' => '03',
                'title' => 'Реализация',
                'subtitle' => 'Воплощение идей',
                'image_path' => '/images/process/step3.jpg',
                'description_left' => 'Техническая реализация проекта с контролем качества.',
                'description_right' => 'Финальная проверка и подготовка к запуску.',
                'order' => 3
            ],
            [
                'step_number' => '04',
                'title' => 'Тестирование и оптимизация',
                'subtitle' => 'Контроль качества',
                'image_path' => '/images/process/step4.jpg',
                'description_left' => 'Комплексное тестирование всех функций и возможностей.',
                'description_right' => 'Оптимизация производительности и устранение недочетов.',
                'order' => 4
            ]
        ];

        foreach ($processStepsData as $stepData) {
            $this->validateData($stepData, [
                'step_number' => 'required|string|max:10',
                'title' => 'required|string|max:255',
                'subtitle' => 'required|string|max:255',
                'image_path' => 'required|string',
                'description_left' => 'required|string|max:500',
                'description_right' => 'required|string|max:500',
                'order' => 'required|integer|min:1'
            ], "Process Step: {$stepData['step_number']}");

            MediaProcessStep::create($stepData);
        }

        $this->command->info('✓ Process steps seeded (' . count($processStepsData) . ' steps)');
    }

    /**
     * Validate data using Laravel validator
     */
    private function validateData(array $data, array $rules, string $context): void
    {
        $validator = Validator::make($data, $rules);
        
        if ($validator->fails()) {
            $errors = $validator->errors()->all();
            $errorMessage = "Validation failed for {$context}: " . implode(', ', $errors);
            $this->command->error($errorMessage);
            throw new Exception($errorMessage);
        }
    }

    /**
     * Get complete services data from mediaServices.ts
     */
    private function getCompleteServicesData(): array
    {
        return [
            [
                'title' => "решения для выставок",
                'description' => "Комплексный подход к дизайну и визуализации вашего присутствия на выставке.",
                'order' => 1,
                'dark_background' => false,
                'slides' => [
                    ['mainImage' => "/images/media/carousel_1/main_image_1.png", 'secondaryImage' => "/images/media/carousel_1/secondary_image_1.png"],
                    ['mainImage' => "/images/media/carousel_1/main_image_2.jpg", 'secondaryImage' => "/images/media/carousel_1/secondary_image_2.jpg"],
                    ['mainImage' => "/images/media/carousel_1/main_image_3.jpg", 'secondaryImage' => "/images/media/carousel_1/secondary_image_3.webp"],
                    ['mainImage' => "/images/media/carousel_1/main_image_4.webp", 'secondaryImage' => "/images/media/carousel_1/secondary_image_4.png"],
                    ['mainImage' => "/images/media/carousel_1/main_image_5.webp", 'secondaryImage' => "/images/media/carousel_1/secondary_image_5.jpg"]
                ],
                'features' => [
                    [
                        'title' => "Концепция и дизайн выставочных стендов",
                        'description' => [
                            "Разработка уникальных концепций оформления выставочных павильонов и стендов, учитывающих специфику отрасли и потребности целевой аудитории.",
                            "Интеграция фирменного стиля в дизайн экспозиции для создания запоминающегося имиджа."
                        ]
                    ],
                    [
                        'title' => "Презентационные материалы",
                        'description' => [
                            "Создание дизайна презентаций, видео-роликов и графических материалов для демонстрации на выставках.",
                            "Организация съёмок участия компании на выставках с последующей обработкой визуального контента."
                        ]
                    ],
                    [
                        'title' => "Комплексное сопровождение выставок",
                        'description' => [
                            "Консультации и подготовка технических заданий для всех этапов выставочной деятельности.",
                            "Мониторинг и оценка эффективности участия в выставках для дальнейшей оптимизации концепций."
                        ]
                    ]
                ]
            ],
            [
                'title' => "Брендинг\nстратегия",
                'description' => "Создаём сильную визуальную идентичность, которая формирует запоминаемый образ компании и выделяет её на фоне конкурентов.",
                'order' => 2,
                'dark_background' => false,
                'slides' => [
                    ['mainImage' => "/images/media/carousel_2/main_image_1.png", 'secondaryImage' => "/images/media/carousel_2/secondary_image_1.png"],
                    ['mainImage' => "/images/media/carousel_2/main_image_2.webp", 'secondaryImage' => "/images/media/carousel_2/secondary_image_2.jpg"],
                    ['mainImage' => "/images/media/carousel_2/main_image_3.jpg", 'secondaryImage' => "/images/media/carousel_2/secondary_image_3.webp"],
                    ['mainImage' => "/images/media/carousel_2/main_image_4.jpg", 'secondaryImage' => "/images/media/carousel_2/secondary_image_4.jpeg"],
                    ['mainImage' => "/images/media/carousel_2/main_image_5.jpg", 'secondaryImage' => "/images/media/carousel_2/secondary_image_5.webp"]
                ],
                'features' => [
                    [
                        'title' => "Концепция и стратегия бренда",
                        'description' => [
                            "Формирование уникальной концепции бренда с учётом специфики бизнеса клиента и целевой аудитории.",
                            "Разработка позиционирования бренда, формирование миссии, ценностей и обещания бренда."
                        ]
                    ],
                    [
                        'title' => "Создание фирменного стиля",
                        'description' => [
                            "Проработка полной визуальной айдентики: выбор цветовой палитры, типографики, паттернов и элементов фирменного стиля.",
                            "Разработка логотипа, который отражает характер и уникальность компании."
                        ]
                    ],
                    [
                        'title' => "Брендбук и рекомендации по использованию",
                        'description' => [
                            "Составление детализированного брендбука для единообразного применения визуальных элементов на всех носителях – от цифровых каналов до печатной продукции, автомобилей и фирменного мерча."
                        ]
                    ],
                    [
                        'title' => "Создаём сильную визуальную идентичность, которая формирует запоминаемый образ компании и выделяет её на фоне конкурентов.",
                        'description' => [
                            "Разработка логотипов и фирменных знаков",
                            "Создание брендбука и гайдлайнов",
                            "Формирование визуального языка бренда",
                            "Нейминг и слоганы",
                            "Аудит текущего бренда и ребрендинг",
                            "Формирование бренда «под выставку» с учётом целей экспонирования"
                        ]
                    ]
                ]
            ],
            [
                'title' => "дизайн\nполиграфия",
                'description' => "Фирменная печатная продукция для делового общения, выставок и POS. Всегда в срок и наивысшего качества",
                'order' => 3,
                'dark_background' => true,
                'slides' => [
                    ['mainImage' => "/images/media/carousel_3/main_image_1.png", 'secondaryImage' => "/images/media/carousel_3/secondary_image_1.png"],
                    ['mainImage' => "/images/media/carousel_3/main_image_2.jpg", 'secondaryImage' => "/images/media/carousel_3/secondary_image_2.jpg"],
                    ['mainImage' => "/images/media/carousel_3/main_image_3.jpg", 'secondaryImage' => "/images/media/carousel_3/secondary_image_3.jpg"],
                    ['mainImage' => "/images/media/carousel_3/main_image_4.jpg", 'secondaryImage' => "/images/media/carousel_3/secondary_image_4.webp"],
                    ['mainImage' => "/images/media/carousel_3/main_image_5.jpg", 'secondaryImage' => "/images/media/carousel_3/secondary_image_5.jpg"]
                ],
                'features' => [
                    [
                        'title' => "Дизайн печатной продукции",
                        'description' => [
                            "Разработка макетов для брошюр, каталогов, визиток, плакатов и других материалов.",
                            "Творческий подход и точная передача фирменного стиля."
                        ]
                    ],
                    [
                        'title' => "Подготовка к печати",
                        'description' => [
                            "Профессиональная предпечатная подготовка макетов, включая контроль качества и соответствие техническим требованиям типографий.",
                            "Консультации по выбору материалов и технологий печати для оптимального результата."
                        ]
                    ],
                    [
                        'title' => "Комплексное оформление маркетинговых материалов",
                        'description' => [
                            "Согласование единообразного дизайна для всех печатных материалов, обеспечивая целостное представление бренда."
                        ]
                    ]
                ]
            ],
            [
                'title' => "фото",
                'description' => "Профессиональная фотосъёмка продукции и производства. Съёмка рабочего процесса и команды",
                'order' => 4,
                'dark_background' => true,
                'slides' => [
                    ['mainImage' => "/images/media/carousel_4/main_image_1.png", 'secondaryImage' => "/images/media/carousel_4/secondary_image_1.png"],
                    ['mainImage' => "/images/media/carousel_4/main_image_2.jpeg", 'secondaryImage' => "/images/media/carousel_4/secondary_image_2.jpg"],
                    ['mainImage' => "/images/media/carousel_4/main_image_3.jpeg", 'secondaryImage' => "/images/media/carousel_4/secondary_image_3.jpg"],
                    ['mainImage' => "/images/media/carousel_4/main_image_4.jpg", 'secondaryImage' => "/images/media/carousel_4/secondary_image_4.jpeg"],
                    ['mainImage' => "/images/media/carousel_4/main_image_5.webp", 'secondaryImage' => "/images/media/carousel_4/secondary_image_5.jpg"]
                ],
                'features' => [
                    [
                        'title' => "Особый технический взгляд на продукт и производство",
                        'description' => [
                            "Мы видим не просто «что есть», а что нужно показать, чтобы донести ценность продукта до целевого клиента:",
                            "Знаем, что подчеркнуть в технологичном процессе, чтобы вызвать доверие.",
                            "Умеем находить ключевые визуальные акценты — детали, которые \"цепляют\" аудиторию.",
                            "Обладаем опытом съёмок на промышленных, инженерных, производственных объектах, где важна точность, безопасность и деликатность."
                        ]
                    ],
                    [
                        'title' => "Подготовка к печати",
                        'description' => [
                            "Профессиональная предпечатная подготовка макетов, включая контроль качества и соответствие техническим требованиям типографий.",
                            "Консультации по выбору материалов и технологий печати для оптимального результата."
                        ]
                    ],
                    [
                        'title' => "Комплексное оформление маркетинговых материалов",
                        'description' => [
                            "Согласование единообразного дизайна для всех печатных материалов, обеспечивая целостное представление бренда."
                        ]
                    ]
                ]
            ],
            [
                'title' => "3d\nграфика",
                'description' => "Промышленная визуализация, которая работает на восприятие, продажи и доверие",
                'order' => 5,
                'dark_background' => true,
                'slides' => [
                    ['mainImage' => "/images/media/carousel_5/main_image_1.png", 'secondaryImage' => "/images/media/carousel_5/secondary_image_1.png"],
                    ['mainImage' => "/images/media/carousel_5/main_image_2.jpg", 'secondaryImage' => "/images/media/carousel_5/secondary_image_2.png"],
                    ['mainImage' => "/images/media/carousel_5/main_image_3.png", 'secondaryImage' => "/images/media/carousel_5/secondary_image_3.jpg"],
                    ['mainImage' => "/images/media/carousel_5/main_image_4.jpeg", 'secondaryImage' => "/images/media/carousel_5/secondary_image_4.jpg"],
                    ['mainImage' => "/images/media/carousel_5/main_image_5.webp", 'secondaryImage' => "/images/media/carousel_5/secondary_image_5.jpg"]
                ],
                'features' => [
                    [
                        'title' => "Понимаем суть — создаём смысл",
                        'description' => [
                            "Мы обладаем глубокой экспертизой в работе с промышленными компаниями, особенно в таких технологически сложных отраслях, как:",
                            "авиация,",
                            "беспилотные летательные аппараты,",
                            "системы управления",
                            "Мы не \"рисуем по ТЗ\", а понимаем техническое устройство, функциональность и контекст применения — благодаря опыту и тесной работе с инженерами."
                        ]
                    ],
                    [
                        'title' => "Концептуальная 3D-графика для выставок и презентаций",
                        'description' => [
                            "Графика для больших экранов, презентационных зон и LED-дисплеев",
                            "Подчёркивание инновационности, масштаба, технологичности",
                            "Создание визуального вау-эффекта с умом",
                            "Адаптация под архитектуру и пространственные форматы"
                        ]
                    ],
                    [
                        'title' => "Анимация для видео и демо-роликов",
                        'description' => [
                            "Стильная, сдержанная, технологичная 3D-анимация",
                            "Встраиваем в презентационные и промо-видео",
                            "Акценты на ключевых преимуществах продукта",
                            "Эффектная подача без визуального «шума»"
                        ]
                    ]
                ]
            ],
            [
                'title' => "WEB\nсайты",
                'description' => "Мы создаём не просто сайт, а продуманный до деталей цифровой продукт, который работает на ваши цели.",
                'order' => 6,
                'dark_background' => true,
                'slides' => [
                    ['mainImage' => "/images/media/carousel_6/main_image_1.png", 'secondaryImage' => "/images/media/carousel_6/secondary_image_1.png"],
                    ['mainImage' => "/images/media/carousel_6/main_image_2.jpg", 'secondaryImage' => "/images/media/carousel_6/secondary_image_2.jpg"],
                    ['mainImage' => "/images/media/carousel_6/main_image_3.png", 'secondaryImage' => "/images/media/carousel_6/secondary_image_3.webp"],
                    ['mainImage' => "/images/media/carousel_6/main_image_4.jpg", 'secondaryImage' => "/images/media/carousel_6/secondary_image_4.jpg"],
                    ['mainImage' => "/images/media/carousel_6/main_image_5.jpg", 'secondaryImage' => "/images/media/carousel_6/secondary_image_5.png"]
                ],
                'features' => [
                    [
                        'title' => "Концепция дизайна: от смысла — к форме",
                        'description' => [
                            "Каждый сайт мы начинаем с анализа бизнеса и ниши, чтобы создать не шаблон, а индивидуальное решение, которое будет усиливать именно вашу компанию:",
                            "Проводим исследование сферы деятельности и целевой аудитории",
                            "Выделяем сильные стороны компании — ваши реальные преимущества",
                            "Анализируем конкурентов, чтобы сделать вас заметнее и понятнее на их фоне",
                            "Формируем визуальный язык и структуру сайта, которая доносит суть без лишнего",
                            "В результате вы получаете сайт, который не просто «красивый» — он обоснованный, логичный и убедительный."
                        ]
                    ],
                    [
                        'title' => "Контент в едином визуальном ключе, заточенный под сайт",
                        'description' => [
                            "Мы сами создаём весь визуальный и текстовый контент под сайт — вам не нужно беспокоиться о фото, видео или текстах.",
                            "Профессиональная фотосъёмка продукции, команды, процессов",
                            "Видеообзоры, 3D-анимации и технические схемы",
                            "Структурированные тексты с фокусом на выгоды и решения",
                            "Единый стиль изображений, шрифтов и визуальной подачи",
                            "Всё сделано в одном ключе, с учётом того, как лучше всего показать ваш продукт, экспертность и уникальность."
                        ]
                    ],
                    [
                        'title' => "Адаптивность и надёжность: работает на всех устройствах",
                        'description' => [
                            "Полная адаптация под смартфоны, планшеты, десктопы",
                            "Интуитивная навигация и читаемость с любого экрана",
                            "Используем российские CMS-платформы, которые:",
                            "Быстрые",
                            "Защищённые",
                            "Легко обновляются вашей командой без программиста",
                            "Ваш сайт будет не только красивым, но и технически устойчивым, безопасным и управляемым."
                        ]
                    ],
                    [
                        'title' => "Отраслевые особенности — переведены в понятный визуальный язык",
                        'description' => [
                            "Мы умеем работать с технологическими, инженерными и производственными компаниями. И знаем, как показать сложные процессы и решения простым языком:",
                            "Используем 3D-модели, схемы, анимации",
                            "Создаём инфографику и визуализацию техпроцессов",
                            "Разрабатываем каталоги продукции, фильтры, калькуляторы, если нужно",
                            "Учитываем нормативные, технические и отраслевые требования",
                            "Результат — сайт, который не пугает сложностью, а вызывает интерес и доверие."
                        ]
                    ]
                ]
            ],
            [
                'title' => "видео",
                'description' => "Покажем ваш продукт так, чтобы в него поверили и захотели.",
                'order' => 7,
                'dark_background' => true,
                'slides' => [
                    ['mainImage' => "/images/media/carousel_7/main_image_1.mp4", 'secondaryImage' => "/images/media/carousel_7/secondary_image_1.mp4"],
                    ['mainImage' => "/images/media/carousel_7/main_image_2.mp4", 'secondaryImage' => "/images/media/carousel_7/secondary_image_2.mp4"],
                    ['mainImage' => "/images/media/carousel_7/main_image_3.mp4", 'secondaryImage' => "/images/media/carousel_7/secondary_image_3.mp4"],
                    ['mainImage' => "/images/media/carousel_7/main_image_4.mp4", 'secondaryImage' => "/images/media/carousel_7/secondary_image_4.mp4"],
                    ['mainImage' => "/images/media/carousel_7/main_image_5.mp4", 'secondaryImage' => "/images/media/carousel_7/secondary_image_5.mp4"]
                ],
                'features' => [
                    [
                        'title' => "Сценарий — не формальность, а основа. Продумаем за вас и предложим лучший вариант.",
                        'description' => [
                            "Каждое видео мы начинаем с проработки сценария — не абстрактного, а созданного исключительно под ваш продукт и целевую аудиторию.",
                            "Раскрываем сильные стороны продукта или технологии",
                            "Учитываем, что важно показать именно вашим клиентам",
                            "Выстраиваем логичную и убедительную подачу",
                            "Упрощаем сложное, не теряя сути",
                            "Вы не получаете \"сухую инструкцию\", а вовлекающий видеоролик, который работает на презентациях, в переговорах, на выставках и в диджитале."
                        ]
                    ],
                    [
                        'title' => "Графика и композитинг — добавляем глубину и стиль",
                        'description' => [
                            "Мы усиливаем видео современными визуальными средствами, чтобы оно выглядело технологично, свежо и понятно:",
                            "2D-графика: инфографика, анимация текста, схемы",
                            "3D-графика: продукт в разрезе, принцип действия, эффекты",
                            "Видеокомпозитинг: объединяем реальные съёмки с графикой и спецэффектами",
                            "Всё это делаем в едином визуальном стиле, чтобы создать профессиональный и цельный образ компании."
                        ]
                    ],
                    [
                        'title' => "Создаём видео, которые помогают продавать, убеждать и объяснять.",
                        'description' => [
                            "Организуем съёмки на производстве, в офисе, на объектах",
                            "Используем профессиональное оборудование, свет, звук",
                            "Работаем с операторской группой, понимающей B2B-задачи",
                            "Умеем снимать без \"воды\", но с характером",
                            "Чёткий месседж"
                        ]
                    ]
                ]
            ]
        ];
    }
}