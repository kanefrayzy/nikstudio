import Image from "next/image";
import { Inter } from "next/font/google";
import Footer from "@/components/Footer";
import FooterMobile from "@/components/Footer_mobile";
import Header from "@/components/Header";
import Header_mobile from '@/components/Header_mobile';
import { Metadata } from "next";
import Link from "next/link";

const inter = Inter({
  weight: ["400", "600"],
  subsets: ["cyrillic", "latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "О нас | NIK Studio - Создаём эффектный визуал",
  description: "Создаём эффектный визуал, понимаем продукт, разрабатываем смыслы, доносим суть",
  keywords: ["NIK Studio", "о нас", "визуал", "креатив", "опыт", "скорость"],
  openGraph: {
    title: "О нас | NIK Studio - Создаём эффектный визуал",
    description: "Создаём эффектный визуал, понимаем продукт, разрабатываем смыслы, доносим суть",
    url: "https://nikstudio.com/about",
    siteName: "NIK Studio",
    images: [
      {
        url: "https://nikstudio.com/images/about/hero_image.jpg",
        width: 1200,
        height: 630,
        alt: "NIK Studio About Page",
      },
    ],
    locale: "ru_RU",
    type: "website",
  },
};

export default function About() {
  return (
    <main className={`relative flex flex-col min-h-screen bg-[#0E1011] max-w-[2560px] w-full mx-auto ${inter.variable}`}>
      {/* Header */}
      <Header />
      <Header_mobile />

      {/* Hero Section */}
      <section className="w-full flex flex-col">
        <div className="w-full flex flex-col px-5 sm:px-12 lg:px-24 3xl:px-[120px] sm:pt-80 lg:pt-[150px] 3xl:pt-[200px] pb-24 sm:pb-24 lg:pb-[96px] 3xl:pb-[120px] mt-1 sm:mt-0">
          <h1 className="text-white text-[60px] sm:text-[200px] 2xl:text-[280px] 3xl:text-[320px] font-geometria font-extrabold uppercase leading-[100%]">
            о нас
          </h1>
          <p className="mt-[40px] sm:mt-[10px] text-white text-[32px] sm:text-4xl md:text-6xl lg:text-[80px] 3xl:text-[100px] font-inter font-medium sm:font-semibold leading-[120%] sm:tracking-[-0.025em] max-w-[1400px] max-w-full-3xl">
            Создаём эффектный визуал, понимаем продукт, разрабатываем смыслы, доносим суть
          </p>
        </div>
        <div className="w-full h-[228px] sm:h-[1080px] 3xl:h-[1440px] relative overflow-hidden">
          <Image
            src="/images/about/hero_image.png"
            alt="NIK Studio Work Environment"
            fill
            className="object-cover object-center"
            quality={90}
            priority
            fetchPriority="high"
            sizes="100vw"
          />
        </div>
      </section>

      {/* Team Section */}
      <section className="w-full flex flex-col">
        <div className="w-full flex flex-col px-5 sm:px-12 lg:px-24 3xl:px-[120px] py-24 sm:py-24 lg:py-[96px] 3xl:py-[120px] gap-24 sm:gap-24 lg:gap-[96px] 3xl:gap-[120px]">
          <div className="-mt-19 sm:mt-0 flex flex-row justify-between items-center gap-8 sm:gap-12 lg:gap-[96px]">
            <span className="text-white/60 text-[20px] sm:text-2xl lg:text-[30px] 3xl:text-[40px] font-cabin sm:font-geometria font-medium sm:font-normal leading-none">
              Команда
            </span>
            <span className="text-white/60 text-[20px] sm:text-2xl lg:text-[30px] 3xl:text-[40px] font-cabin sm:font-geometria font-medium sm:font-normal leading-none">
              (01)
            </span>
          </div>
          <h2 className="-mt-19 sm:mt-0 text-white text-[60px] sm:text-[96px] lg:text-[200px] 2xl:text-[240px] 3xl:text-[280px] font-geometria font-extrabold uppercase leading-[120%] sm:leading-[100%]">
            креатив<br />
            опыт<br />
            скорость
          </h2>
        </div>

        <div className="-mt-19 sm:mt-0 w-full flex flex-col lg:flex-row">
          <div className="w-full lg:w-1/2 bg-[#0E1011] h-auto lg:h-[1080px] 3xl:h-[1440px] relative">
            <Image
              src="/images/about/slava_photo.png"
              alt="Слава Никитин"
              width={960}
              height={1260}
              className="w-full h-[360px] sm:h-auto object-cover"
              quality={85}
              loading="lazy"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
          <div className="w-full lg:w-1/2 flex flex-col justify-between">
            <div className="flex flex-col mt-[13px] sm:mt-0 lg:mt-[70px] xl:mt-[140px] 2xl:mt-[285px] 3xl:mt-[320px] px-5 sm:px-12 lg:px-24 3xl:px-[120px] pt-12 sm:pt-24 lg:pt-[160px] 3xl:pt-[200px] pb-16 sm:pb-16 lg:pb-[64px] 3xl:pb-[80px]">
              <h3 className="text-white text-[40px] sm:text-5xl lg:text-[72px] xl:text-[80px] 3xl:text-[100px] font-geometria font-bold uppercase leading-[120%] sm:leading-[110%]">
                слава никитин
              </h3>
              <div className="mt-[11px] sm:mt-4 3xl:mt-6">
                <p className="text-white/60 text-[20px] sm:text-xl lg:text-[30px] 3xl:text-[36px] font-inter sm:font-geometria font-medium sm:font-normal leading-[100%] sm:leading-none">
                  Основатель студии<br />
                  Креативный директор<br />
                  Продюсер<br />
                  Коммерческий фотограф
                </p>
              </div>
              <div className="mt-5 3xl:mt-8">
                <p className="text-white text-[16px] sm:text-xl lg:text-[24px] 3xl:text-[32px] font-inter font-normal leading-[180%] sm:leading-[170%]">
                  &quot;Нестандартный взгляд и внимание к деталям - всё это работает на оперативное решение задач по созданию лучшего и самого продуманного визуального посыла. Вы не тратите время, отвечая на вопросы - &quot;какой создавать дизайн, каким снимать ролик о вашем продукте, что и кого фотографировать, каким лучше придумать бренд, что размещать на сайте?&quot; - мы сами продумываем все вопросы, изучая вашу нишу и предлагаем решение.
                </p>
              </div>
            </div>

            <div className="-mt-[69px] sm:mt-0 flex flex-col px-5 sm:px-12 lg:px-24 3xl:px-[120px] py-12 sm:py-24 lg:pt-[96px] 3xl:pt-[120px] lg:pb-[126px] 3xl:pb-[160px] gap-16 sm:gap-16 lg:gap-[64px] 3xl:gap-[80px]">
              <div className="flex flex-col gap-2 sm:gap-2 lg:gap-[8px] 3xl:gap-[12px]">
                <h4 className="text-white text-[24px] sm:text-3xl lg:text-[48px] 3xl:text-[60px] font-geometria font-bold uppercase leading-[130%] tracking-[-1px] sm:tracking-normal">
                  нам доверяют лидеры отраслей
                </h4>
                <p className="mt-[12px] sm:mt-0 text-white/60 text-[16px] sm:text-lg lg:text-[20px] 3xl:text-[28px] font-inter font-normal leading-[180%]">
                  За 7 лет работы, мы можем со всей гордостью сказать - что нам действительно доверяют лидеры! Мы создавали и создаём проекты в самых интересных нишах: фермерство, гражданская авиация, гастрономия, беспилотные летательные аппараты, музыкальная техника и кинотеатры, строительство и ландшафтное озеленение, и везде мы добились отличных результатов, а так же набрались огромного опыта, который применяем при создании наших услуг.
                </p>
              </div>
              
              <div className="-mt-[23px] sm:mt-0 flex flex-col gap-2 sm:gap-2 lg:gap-[8px] 3xl:gap-[12px]">
                <h4 className="text-white text-[24px] sm:text-3xl lg:text-[48px] 3xl:text-[60px] font-geometria font-bold uppercase leading-[130%] tracking-[-1px] sm:tracking-normal">
                  креативный подход
                </h4>
                <p className="mt-[12px] sm:mt-0 text-white/60 text-[16px] sm:text-lg lg:text-[20px] 3xl:text-[28px] font-inter font-normal leading-[180%]">
                  Главным преимуществом является нестандартный подход, с которым нам удаётся показывать продукцию и производства &quot;реально&quot; без прикрас, но с сильных сторон и с позиции надежности, а так же с перспективой быстрого наращивания темпов выпуска продукции. Таким образом потенциальные клиенты видят те стороны, которые их действительно интересуют, а не просто красивую &quot;пыль в глаза&quot;. Для каждого проекта есть целевая аудитория - мы изучаем её и демонстрируем ей именно то, что заставит её видеть свои точки роста совместно с вашим продуктом.
                </p>
              </div>

              <div className="-mt-[22px] sm:mt-0 flex flex-col gap-2 sm:gap-2 lg:gap-[8px] 3xl:gap-[12px]">
                <h4 className="text-white text-[24px] sm:text-3xl lg:text-[48px] 3xl:text-[60px] font-geometria font-bold uppercase leading-[130%] tracking-[-1px] sm:tracking-normal">
                  сроки не прощают недоверия
                </h4>
                <p className="mt-[12px] sm:mt-0 text-white/60 text-[16px] sm:text-lg lg:text-[20px] 3xl:text-[28px] font-inter font-normal leading-[180%]">
                  Наша команда прекрасно понимает ответственность своей работы. Мы делаем быстро, продумывая нюансы. Подстраиваемся под темп процесса, чтобы к выставке, а зачастую мы готовим предприятия именно к отраслевым выставкам - ваша компания оказалась &quot;во все оружия&quot;. Часто мы превращаем невозможные сроки - в крайне хороший и рабочий продукт, именно поэтому нас советуют и нам доверяют!
                </p>
              </div>
            </div>
            <section className="py-15 sm:py-20 md:py-[76px] px-5 sm:px-12 lg:px-24 flex justify-center md:justify-start -mt-16 sm:-mt-35">
              <Link 
                href="/contact"
                className="flex flex-row justify-center items-center py-7 sm:py-4 px-5 sm:px-[26px] gap-2 w-full h-12 sm:h-[54px] 3xl:h-[70px] 3xl:text-[28px] bg-white text-[#0E1011] text-[22px] font-semibold rounded-full mx-auto font-inter hover:cursor-pointer hover:bg-[#DE063A] hover:text-white transition-colors duration-300"
              >
                Связаться
              </Link>              
            </section>
          </div>          
        </div>        
      </section>
      
      {/* Footer */}
      <Footer />
      <FooterMobile />
    </main>
  );
}
