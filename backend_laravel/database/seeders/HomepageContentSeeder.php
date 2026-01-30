<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\HomepageContent;
use Illuminate\Support\Facades\DB;

class HomepageContentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {

        $content = [
            // Hero Section
            [
                'section' => 'hero',
                'content_type' => 'text',
                'content_key' => 'hero_title',
                'content_value' => 'Превращаем сложные технологии в понятный визуал',
                'order_index' => 0,
                'metadata' => null,
            ],
            [
                'section' => 'hero',
                'content_type' => 'text',
                'content_key' => 'hero_subtitle',
                'content_value' => 'Комплексные решения для промышленных компаний / подготовка к отраслевым выставкам / сопровождение / вывод продукта на новый рынок',
                'order_index' => 1,
                'metadata' => null,
            ],
            [
                'section' => 'hero',
                'content_type' => 'text',
                'content_key' => 'hero_description',
                'content_value' => "мультимедиа\nбрендинг\nдизайн / презентации\nкоммерческая фотогорафия\n3д-визуализация и анимация\nвидеопродакшн\nсоздание сайтов",
                'order_index' => 2,
                'metadata' => null,
            ],
            [
                'section' => 'hero',
                'content_type' => 'image',
                'content_key' => 'hero_logo',
                'content_value' => '/images/home/nik-logo-hero.svg',
                'order_index' => 3,
                'metadata' => ['alt_text' => 'NIK Studio Logo'],
            ],

            // Main Content Section
            [
                'section' => 'main_content',
                'content_type' => 'text',
                'content_key' => 'main_content_heading',
                'content_value' => 'дизайн-бюро NIKstudio',
                'order_index' => 0,
                'metadata' => null,
            ],
            [
                'section' => 'main_content',
                'content_type' => 'text',
                'content_key' => 'main_content_title',
                'content_value' => 'комплексные решения, мощный визуал',
                'order_index' => 1,
                'metadata' => null,
            ],
            [
                'section' => 'main_content',
                'content_type' => 'text',
                'content_key' => 'main_content_paragraph_1',
                'content_value' => 'Мы помогаем технологичным и производственным компаниям выглядеть ярко и понятно. Создаём дизайн, который работает — от логотипа до выставочного стенда, от презентации до 3D-видео.',
                'order_index' => 2,
                'metadata' => null,
            ],
            [
                'section' => 'main_content',
                'content_type' => 'text',
                'content_key' => 'main_content_paragraph_2',
                'content_value' => 'Уникальный сервис «под ключ» для демонстрации вашей компании в цифровом пространстве, позволяющий избежать разрозненности работы с множеством подрядчиков. Единый, отлаженный механизм реализации ваших проектов.',
                'order_index' => 3,
                'metadata' => null,
            ],
            [
                'section' => 'main_content',
                'content_type' => 'text',
                'content_key' => 'main_content_clients_heading',
                'content_value' => 'Работали с компаниями -',
                'order_index' => 4,
                'metadata' => null,
            ],
            [
                'section' => 'main_content',
                'content_type' => 'image',
                'content_key' => 'client_logo_1',
                'content_value' => '/images/home/ikar-logo.svg',
                'order_index' => 5,
                'metadata' => ['alt_text' => 'IKAR'],
            ],
            [
                'section' => 'main_content',
                'content_type' => 'image',
                'content_key' => 'client_logo_2',
                'content_value' => '/images/home/technopolis-logo.svg',
                'order_index' => 6,
                'metadata' => ['alt_text' => 'Technopolis'],
            ],
            [
                'section' => 'main_content',
                'content_type' => 'image',
                'content_key' => 'client_logo_3',
                'content_value' => '/images/home/almaz-logo.svg',
                'order_index' => 7,
                'metadata' => ['alt_text' => 'Almaz Antey'],
            ],
            [
                'section' => 'main_content',
                'content_type' => 'image',
                'content_key' => 'client_logo_4',
                'content_value' => '/images/home/aviaspecmash-logo.svg',
                'order_index' => 8,
                'metadata' => ['alt_text' => 'Aviaspecmash'],
            ],
            [
                'section' => 'main_content',
                'content_type' => 'image',
                'content_key' => 'client_logo_5',
                'content_value' => '/images/home/style_eko.svg',
                'order_index' => 9,
                'metadata' => ['alt_text' => 'StyleEko'],
            ],
            [
                'section' => 'main_content',
                'content_type' => 'image',
                'content_key' => 'client_logo_6',
                'content_value' => '/images/home/garden_foresta.svg',
                'order_index' => 10,
                'metadata' => ['alt_text' => 'GardenForesta'],
            ],

            // Services Section - Service 1
            [
                'section' => 'services_1',
                'content_type' => 'text',
                'content_key' => 'service_1_title',
                'content_value' => 'решения для выставок',
                'order_index' => 0,
                'metadata' => null,
            ],
            [
                'section' => 'services_1',
                'content_type' => 'text',
                'content_key' => 'service_1_description',
                'content_value' => 'Комплексный подход к дизайну и визуализации вашего присутствия на выставке.',
                'order_index' => 1,
                'metadata' => null,
            ],
            [
                'section' => 'services_1',
                'content_type' => 'text',
                'content_key' => 'service_1_subtitle',
                'content_value' => 'Из производственников — в звёзды отрасли',
                'order_index' => 2,
                'metadata' => null,
            ],
            [
                'section' => 'services_1',
                'content_type' => 'text',
                'content_key' => 'service_1_features',
                'content_value' => json_encode(['Концепция', 'Пространство', 'Мультимедиа', 'Сопровождение']),
                'order_index' => 3,
                'metadata' => null,
            ],
            [
                'section' => 'services_1',
                'content_type' => 'image',
                'content_key' => 'service_1_image',
                'content_value' => '/images/home/service-1.jpg',
                'order_index' => 4,
                'metadata' => ['alt_text' => 'Exhibition Solutions'],
            ],

            // Services Section - Service 2
            [
                'section' => 'services_2',
                'content_type' => 'text',
                'content_key' => 'service_2_title',
                'content_value' => 'стратегия брендинг',
                'order_index' => 0,
                'metadata' => null,
            ],
            [
                'section' => 'services_2',
                'content_type' => 'text',
                'content_key' => 'service_2_description',
                'content_value' => 'Разработка индивидуальной маркетинговой стратегии визуализации с учётом специфики вашей отрасли. Создание целостного визуального месседжа, дизайн-концепции, фирменного стиля, логотипа и брендинга.',
                'order_index' => 1,
                'metadata' => null,
            ],
            [
                'section' => 'services_2',
                'content_type' => 'text',
                'content_key' => 'service_2_subtitle',
                'content_value' => 'Выделяющийся из массы, стильный, технологичный',
                'order_index' => 2,
                'metadata' => null,
            ],
            [
                'section' => 'services_2',
                'content_type' => 'text',
                'content_key' => 'service_2_features',
                'content_value' => json_encode(['Концепция брендинга', 'Логотип', 'Позиционирование', 'Гайдлайн']),
                'order_index' => 3,
                'metadata' => null,
            ],
            [
                'section' => 'services_2',
                'content_type' => 'image',
                'content_key' => 'service_2_image',
                'content_value' => '/images/home/service-2.jpg',
                'order_index' => 4,
                'metadata' => ['alt_text' => 'Branding and Strategy'],
            ],

            // Services Section - Service 3
            [
                'section' => 'services_3',
                'content_type' => 'text',
                'content_key' => 'service_3_title',
                'content_value' => 'ДИЗАЙН полиграфии',
                'order_index' => 0,
                'metadata' => null,
            ],
            [
                'section' => 'services_3',
                'content_type' => 'text',
                'content_key' => 'service_3_description',
                'content_value' => 'Стильный и понятный дизайн, отражающий суть продукта, созданный точно под целевого клиента. Изготовление в точной цветопередачей.',
                'order_index' => 1,
                'metadata' => null,
            ],
            [
                'section' => 'services_3',
                'content_type' => 'text',
                'content_key' => 'service_3_subtitle',
                'content_value' => 'Создание полиграфических материалов под ключ',
                'order_index' => 2,
                'metadata' => null,
            ],
            [
                'section' => 'services_3',
                'content_type' => 'text',
                'content_key' => 'service_3_features',
                'content_value' => json_encode(['Презентации', 'Буклеты', 'Корпоративные журналы']),
                'order_index' => 3,
                'metadata' => null,
            ],
            [
                'section' => 'services_3',
                'content_type' => 'image',
                'content_key' => 'service_3_image',
                'content_value' => '/images/home/service-3.jpg',
                'order_index' => 4,
                'metadata' => ['alt_text' => 'Print Design'],
            ],

            // Services Section - Service 4
            [
                'section' => 'services_4',
                'content_type' => 'text',
                'content_key' => 'service_4_title',
                'content_value' => 'Фото',
                'order_index' => 0,
                'metadata' => null,
            ],
            [
                'section' => 'services_4',
                'content_type' => 'text',
                'content_key' => 'service_4_description',
                'content_value' => 'Профессиональное фото продукта и процесса производства',
                'order_index' => 1,
                'metadata' => null,
            ],
            [
                'section' => 'services_4',
                'content_type' => 'text',
                'content_key' => 'service_4_subtitle',
                'content_value' => 'Опыт более 15 лет',
                'order_index' => 2,
                'metadata' => null,
            ],
            [
                'section' => 'services_4',
                'content_type' => 'text',
                'content_key' => 'service_4_features',
                'content_value' => json_encode(['Фото продукта', 'Портреты команды', 'Съёмка производства', 'Фото мероприятий']),
                'order_index' => 3,
                'metadata' => null,
            ],
            [
                'section' => 'services_4',
                'content_type' => 'image',
                'content_key' => 'service_4_image',
                'content_value' => '/images/home/service-4.jpg',
                'order_index' => 4,
                'metadata' => ['alt_text' => 'Photography'],
            ],

            // Services Section - Service 5
            [
                'section' => 'services_5',
                'content_type' => 'text',
                'content_key' => 'service_5_title',
                'content_value' => '3d графика',
                'order_index' => 0,
                'metadata' => null,
            ],
            [
                'section' => 'services_5',
                'content_type' => 'text',
                'content_key' => 'service_5_description',
                'content_value' => 'Создание промышленного 3д-дизайна, анимация графики',
                'order_index' => 1,
                'metadata' => null,
            ],
            [
                'section' => 'services_5',
                'content_type' => 'text',
                'content_key' => 'service_5_subtitle',
                'content_value' => 'TDM/ERP/CAD',
                'order_index' => 2,
                'metadata' => null,
            ],
            [
                'section' => 'services_5',
                'content_type' => 'text',
                'content_key' => 'service_5_features',
                'content_value' => json_encode(['Доработка моделей', 'Текстурирование', 'Анимация 3д', 'Создание рендеров']),
                'order_index' => 3,
                'metadata' => null,
            ],
            [
                'section' => 'services_5',
                'content_type' => 'image',
                'content_key' => 'service_5_image',
                'content_value' => '/images/home/service-5.jpg',
                'order_index' => 4,
                'metadata' => ['alt_text' => '3D Graphics'],
            ],

            // Services Section - Service 6
            [
                'section' => 'services_6',
                'content_type' => 'text',
                'content_key' => 'service_6_title',
                'content_value' => 'web-Сайты',
                'order_index' => 0,
                'metadata' => null,
            ],
            [
                'section' => 'services_6',
                'content_type' => 'text',
                'content_key' => 'service_6_description',
                'content_value' => 'Эксклюзивные продуманные web-сайты, созданные на основе уникального контента: брендинг, фото, видео, 3д графика - всё в едином ключе.',
                'order_index' => 1,
                'metadata' => null,
            ],
            [
                'section' => 'services_6',
                'content_type' => 'text',
                'content_key' => 'service_6_subtitle',
                'content_value' => 'Российские CMS',
                'order_index' => 2,
                'metadata' => null,
            ],
            [
                'section' => 'services_6',
                'content_type' => 'text',
                'content_key' => 'service_6_features',
                'content_value' => json_encode(['Мобильная версия', 'Тестирование удобства', 'Современный дизайн', 'UI/UX аудит']),
                'order_index' => 3,
                'metadata' => null,
            ],
            [
                'section' => 'services_6',
                'content_type' => 'image',
                'content_key' => 'service_6_image',
                'content_value' => '/images/home/service-6.jpg',
                'order_index' => 4,
                'metadata' => ['alt_text' => 'Web Design'],
            ],

            // Services Section - Service 7
            [
                'section' => 'services_7',
                'content_type' => 'text',
                'content_key' => 'service_7_title',
                'content_value' => 'видео продакшн',
                'order_index' => 0,
                'metadata' => null,
            ],
            [
                'section' => 'services_7',
                'content_type' => 'text',
                'content_key' => 'service_7_description',
                'content_value' => 'Большой опыт позволяет самим создавать сценарий и понятно демонстрировать преимущества вашей компании.',
                'order_index' => 1,
                'metadata' => null,
            ],
            [
                'section' => 'services_7',
                'content_type' => 'text',
                'content_key' => 'service_7_subtitle',
                'content_value' => 'Профессиональная съёмка роликов',
                'order_index' => 2,
                'metadata' => null,
            ],
            [
                'section' => 'services_7',
                'content_type' => 'text',
                'content_key' => 'service_7_features',
                'content_value' => json_encode(['Составим сценарий', 'Продумаем детали', 'Создадим стильный', 'информативный ролик']),
                'order_index' => 3,
                'metadata' => null,
            ],
            [
                'section' => 'services_7',
                'content_type' => 'image',
                'content_key' => 'service_7_image',
                'content_value' => '/images/home/service-7.jpg',
                'order_index' => 4,
                'metadata' => ['alt_text' => 'Video Production'],
            ],

            // Testimonials Section - Testimonial 1
            [
                'section' => 'testimonials_1',
                'content_type' => 'text',
                'content_key' => 'testimonial_1_quote',
                'content_value' => 'Exceptional Branding That Elevated Our Identity.',
                'order_index' => 0,
                'metadata' => null,
            ],
            [
                'section' => 'testimonials_1',
                'content_type' => 'text',
                'content_key' => 'testimonial_1_description',
                'content_value' => 'Their strategic approach completely transformed our brand. We\'ve seen a huge increase in recognition and client engagement.',
                'order_index' => 1,
                'metadata' => null,
            ],
            [
                'section' => 'testimonials_1',
                'content_type' => 'text',
                'content_key' => 'testimonial_1_author_name',
                'content_value' => 'Трофимов Сергей',
                'order_index' => 2,
                'metadata' => null,
            ],
            [
                'section' => 'testimonials_1',
                'content_type' => 'text',
                'content_key' => 'testimonial_1_author_company',
                'content_value' => '«Монитор СОФТ»',
                'order_index' => 3,
                'metadata' => null,
            ],
            [
                'section' => 'testimonials_1',
                'content_type' => 'image',
                'content_key' => 'testimonial_1_author_photo',
                'content_value' => '/images/home/testimonial-1.jpg',
                'order_index' => 4,
                'metadata' => ['alt_text' => 'Testimonial'],
            ],

            // Testimonials Section - Testimonial 2
            [
                'section' => 'testimonials_2',
                'content_type' => 'text',
                'content_key' => 'testimonial_2_quote',
                'content_value' => 'По итогам выставки был заключен контракт',
                'order_index' => 0,
                'metadata' => null,
            ],
            [
                'section' => 'testimonials_2',
                'content_type' => 'text',
                'content_key' => 'testimonial_2_description',
                'content_value' => 'The website they created is stunning, user-friendly, and has boosted our online conversions significantly. Highly recommend!',
                'order_index' => 1,
                'metadata' => null,
            ],
            [
                'section' => 'testimonials_2',
                'content_type' => 'text',
                'content_key' => 'testimonial_2_author_name',
                'content_value' => 'Юлия Данилова',
                'order_index' => 2,
                'metadata' => null,
            ],
            [
                'section' => 'testimonials_2',
                'content_type' => 'text',
                'content_key' => 'testimonial_2_author_company',
                'content_value' => 'Группа компаний «ИКАР»',
                'order_index' => 3,
                'metadata' => null,
            ],
            [
                'section' => 'testimonials_2',
                'content_type' => 'image',
                'content_key' => 'testimonial_2_author_photo',
                'content_value' => '/images/home/testimonial-3.jpg',
                'order_index' => 4,
                'metadata' => ['alt_text' => 'Testimonial'],
            ],

            // Testimonials Section - Testimonial 3
            [
                'section' => 'testimonials_3',
                'content_type' => 'text',
                'content_key' => 'testimonial_3_quote',
                'content_value' => 'Creative Solutions That Drove Real Results for Our Website.',
                'order_index' => 0,
                'metadata' => null,
            ],
            [
                'section' => 'testimonials_3',
                'content_type' => 'text',
                'content_key' => 'testimonial_3_description',
                'content_value' => 'Their designs are not only beautiful but effective. Our sales increased by 30% post-launch. Incredible experience!',
                'order_index' => 1,
                'metadata' => null,
            ],
            [
                'section' => 'testimonials_3',
                'content_type' => 'text',
                'content_key' => 'testimonial_3_author_name',
                'content_value' => 'Колушов Михаил',
                'order_index' => 2,
                'metadata' => null,
            ],
            [
                'section' => 'testimonials_3',
                'content_type' => 'text',
                'content_key' => 'testimonial_3_author_company',
                'content_value' => 'АО «НПП Авиаспецмаш»',
                'order_index' => 3,
                'metadata' => null,
            ],
            [
                'section' => 'testimonials_3',
                'content_type' => 'image',
                'content_key' => 'testimonial_3_author_photo',
                'content_value' => '/images/home/testimonial-5.jpg',
                'order_index' => 4,
                'metadata' => ['alt_text' => 'Testimonial'],
            ],

            // Testimonials Section - Testimonial 4
            [
                'section' => 'testimonials_4',
                'content_type' => 'text',
                'content_key' => 'testimonial_4_quote',
                'content_value' => 'Seamless Collaboration & Support With Exceptional Results.',
                'order_index' => 0,
                'metadata' => null,
            ],
            [
                'section' => 'testimonials_4',
                'content_type' => 'text',
                'content_key' => 'testimonial_4_description',
                'content_value' => 'Working with them was easy and efficient. They perfectly captured our vision, and the results were outstanding.',
                'order_index' => 1,
                'metadata' => null,
            ],
            [
                'section' => 'testimonials_4',
                'content_type' => 'text',
                'content_key' => 'testimonial_4_author_name',
                'content_value' => 'Александра Райкова',
                'order_index' => 2,
                'metadata' => null,
            ],
            [
                'section' => 'testimonials_4',
                'content_type' => 'text',
                'content_key' => 'testimonial_4_author_company',
                'content_value' => 'GARDEN Foresta',
                'order_index' => 3,
                'metadata' => null,
            ],
            [
                'section' => 'testimonials_4',
                'content_type' => 'image',
                'content_key' => 'testimonial_4_author_photo',
                'content_value' => '/images/home/testimonial-2.jpg',
                'order_index' => 4,
                'metadata' => ['alt_text' => 'Testimonial'],
            ],

            // Testimonials Section - Testimonial 5
            [
                'section' => 'testimonials_5',
                'content_type' => 'text',
                'content_key' => 'testimonial_5_quote',
                'content_value' => 'Запустили интернет магазин для розничной продукции',
                'order_index' => 0,
                'metadata' => null,
            ],
            [
                'section' => 'testimonials_5',
                'content_type' => 'text',
                'content_key' => 'testimonial_5_description',
                'content_value' => 'Our new branding resonated with our audience immediately. We\'ve received so many compliments and new business inquiries.',
                'order_index' => 1,
                'metadata' => null,
            ],
            [
                'section' => 'testimonials_5',
                'content_type' => 'text',
                'content_key' => 'testimonial_5_author_name',
                'content_value' => 'Егорова Марина',
                'order_index' => 2,
                'metadata' => null,
            ],
            [
                'section' => 'testimonials_5',
                'content_type' => 'text',
                'content_key' => 'testimonial_5_author_company',
                'content_value' => '«ЕГОРОВ мясо»',
                'order_index' => 3,
                'metadata' => null,
            ],
            [
                'section' => 'testimonials_5',
                'content_type' => 'image',
                'content_key' => 'testimonial_5_author_photo',
                'content_value' => '/images/home/testimonial-4.jpg',
                'order_index' => 4,
                'metadata' => ['alt_text' => 'Testimonial'],
            ],

            // Testimonials Section - Testimonial 6
            [
                'section' => 'testimonials_6',
                'content_type' => 'text',
                'content_key' => 'testimonial_6_quote',
                'content_value' => 'UX Design That Transformed Our User Experience.',
                'order_index' => 0,
                'metadata' => null,
            ],
            [
                'section' => 'testimonials_6',
                'content_type' => 'text',
                'content_key' => 'testimonial_6_description',
                'content_value' => 'Their UX design made our platform more intuitive and enjoyable to use. Customer satisfaction has dramatically improved.',
                'order_index' => 1,
                'metadata' => null,
            ],
            [
                'section' => 'testimonials_6',
                'content_type' => 'text',
                'content_key' => 'testimonial_6_author_name',
                'content_value' => 'Дмитрий Страшкевич',
                'order_index' => 2,
                'metadata' => null,
            ],
            [
                'section' => 'testimonials_6',
                'content_type' => 'text',
                'content_key' => 'testimonial_6_author_company',
                'content_value' => '«Эко Стиль»',
                'order_index' => 3,
                'metadata' => null,
            ],
            [
                'section' => 'testimonials_6',
                'content_type' => 'image',
                'content_key' => 'testimonial_6_author_photo',
                'content_value' => '/images/home/testimonial-6.jpg',
                'order_index' => 4,
                'metadata' => ['alt_text' => 'Testimonial'],
            ],
        ];

        // Insert all content
        foreach ($content as $item) {
            HomepageContent::updateOrCreate(
                [
                    'section' => $item['section'],
                    'content_key' => $item['content_key']
                ],
                $item
            );
        }

        $this->command->info('Homepage content seeded successfully!');
    }
}
