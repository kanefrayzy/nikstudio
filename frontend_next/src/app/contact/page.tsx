import Image from "next/image";
import Header_mini from "@/components/Header_mini";
import Header_mobile from "@/components/Header_mobile";
import { Inter } from "next/font/google";
import { Metadata } from "next";
import Footer from "@/components/Footer";
import FooterMobile from "@/components/Footer_mobile";
import ContactForm from "@/components/ContactForm";

const inter = Inter({
  weight: ["400", "600"],
  subsets: ["cyrillic", "latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Контакты | NIK Studio - Форма обратной связи",
  description: "Свяжитесь с NIK Studio для обсуждения сотрудничества. Заполните форму обратной связи, и мы свяжемся с вами для обсуждения подробностей вашего проекта.",
  keywords: ["NIK Studio", "контакты", "обратная связь", "сотрудничество", "дизайн студия"],
  openGraph: {
    title: "Контакты | NIK Studio - Форма обратной связи",
    description: "Свяжитесь с NIK Studio для обсуждения сотрудничества. Заполните форму обратной связи, и мы свяжемся с вами для обсуждения подробностей вашего проекта.",
    url: "https://nikstudio.com/contact",
    siteName: "NIK Studio",
    images: [
      {
        url: "https://nikstudio.com/images/contact-og.jpg",
        width: 1200,
        height: 630,
        alt: "NIK Studio Contact Page",
      },
    ],
    locale: "ru_RU",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Контакты | NIK Studio - Форма обратной связи",
    description: "Свяжитесь с NIK Studio для обсуждения сотрудничества и заполните форму обратной связи.",
    images: ["https://nikstudio.com/images/contact-og.jpg"],
  },
  alternates: {
    canonical: "https://nikstudio.com/contact"
  },
  robots: {
    index: true,
    follow: true
  }
};

export default function Contact() {
  return (
    <main
      className={`relative flex flex-col min-h-screen bg-[#0E1011] max-w-[2560px] w-full mx-auto ${inter.variable}`}
    >
      {/* Main Content */}
      <div className="flex flex-col lg:flex-row">
        {/* Left Side - Image */}
        <Header_mobile />
        <div className="w-full lg:w-1/2 bg-white">
          <div className="relative w-full h-full overflow-hidden">
            <Image
              src="/images/contact/contact-image.png"
              alt="Contact Image"
              className="object-cover object-center w-full h-[360px] sm:h-auto lg:h-full"
              width={1327}
              height={1742}
              priority
            />
          </div>
        </div>

        {/* Right Side Column */}
        <div className="w-full lg:w-1/2">
          {/* Header */}
          <Header_mini />

          {/* Right Side - Form */}
          <div className="bg-[#0E1011] flex flex-col items-center">
            <div className="flex flex-col px-5 sm:px-12 lg:px-24 py-12 lg:py-24 h-full w-full 3xl:px-[120px] 3xl:py-[120px]">
              {/* Title and Description */}
              <div className="flex flex-col gap-4 -mt-2 sm:mt-0 sm:pt-12 lg:pt-[74px] mb-8 lg:mb-22 3xl:pt-[100px] 3xl:mb-[120px]">
                <h1 className="text-white text-[40px] sm:text-5xl md:text-[50px] lg:text-[60px] xl:text-[70px] 2xl:text-[80px] 3xl:text-[100px] font-bold uppercase leading-[130%] sm:leading-[110%] tracking-[-1px] font-geometria">
                  ХОТИТЕ СОТРУДНИЧАТЬ?
                </h1>
                <p className="text-white text-base sm:text-xl lg:text-[24px] 3xl:text-[32px] leading-[170%] font-inter mt-2 lg:mt-[4px] 3xl:mt-[10px]">
                  Всегда рады продуктивному сотрудничеству, напишите и мы с вами
                  свяжемся для обсуждения подробностей.
                </p>
              </div>
              <ContactForm />
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <Footer />
      <FooterMobile />
    </main>
  );
}
