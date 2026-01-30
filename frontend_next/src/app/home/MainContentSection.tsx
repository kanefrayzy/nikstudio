import Image from "next/image";
import { HomepageContent, getContentValue, getImageUrl } from "@/lib/homepage-content";

interface MainContentSectionProps {
  content?: HomepageContent[];
}

export default function MainContentSection({ content }: MainContentSectionProps) {
  // Fallback values (current hardcoded content)
  const heading = getContentValue(content, 'main_content_heading', 'дизайн-бюро NIKstudio');
  const title = getContentValue(content, 'main_content_title', 'комплексные решения, мощный визуал');
  const paragraph1 = getContentValue(
    content, 
    'main_content_paragraph_1', 
    'Мы помогаем технологичным и производственным компаниям выглядеть ярко и понятно. Создаём дизайн, который работает — от логотипа до выставочного стенда, от презентации до 3D-видео.'
  );
  const paragraph2 = getContentValue(
    content, 
    'main_content_paragraph_2', 
    'Уникальный сервис «под ключ» для демонстрации вашей компании в цифровом пространстве, позволяющий избежать разрозненности работы с множеством подрядчиков. Единый, отлаженный механизм реализации ваших проектов.'
  );
  const clientsHeading = getContentValue(content, 'main_content_clients_heading', 'Работали с компаниями -');
  
  // Client logos
  const clientLogo1 = getImageUrl(content, 'client_logo_1', '/images/home/ikar-logo.svg');
  const clientLogo2 = getImageUrl(content, 'client_logo_2', '/images/home/technopolis-logo.svg');
  const clientLogo3 = getImageUrl(content, 'client_logo_3', '/images/home/almaz-logo.svg');
  const clientLogo4 = getImageUrl(content, 'client_logo_4', '/images/home/aviaspecmash-logo.svg');
  const clientLogo5 = getImageUrl(content, 'client_logo_5', '/images/home/style_eko.svg');
  const clientLogo6 = getImageUrl(content, 'client_logo_6', '/images/home/garden_foresta.svg');

  return (
    <div className="w-full lg:w-1/2 ml-auto -mt-25 sm:mt-0">
      <div className="flex flex-col p-5 sm:p-12 lg:p-24 lg:py-[85px] gap-16 lg:gap-[64px]">
        <div className="flex flex-col gap-8">
          <p className="text-white font-geometria text-[20px] sm:text-lg lg:text-[30px]">{heading}</p>
          
          <div className="flex flex-col gap-4 lg:gap-8 -mt-[16px] sm:mt-0 lg:-mt-[10px]">
            <h2 className="text-white font-geometria font-bold text-[40px] sm:text-[60px] 2xl:text-[80px] leading-[120%] sm:leading-[110%] w-full sm:w-[500px] 2xl:w-[768px] w-full-3xl h-[352px] uppercase flex-none self-stretch">
              {title}
            </h2>
            
            <div className="text-white/60 font-inter text-[16px] sm:text-[22px] leading-[100%] sm:leading-[170%] w-full lg:w-[400px] xl:w-[500px] 2xl:w-[768px] w-full-3xl font-normal flex-none self-stretch -mt-[155px] sm:-mt-[10px]">
              <p>
                {paragraph1}
              </p>
              <p className="mt-[17px] sm:mt-[35px]">
                {paragraph2}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-8">
          <p className="text-white font-geometria text-[20px] sm:text-lg lg:text-[30px] -mt-[50px] sm:mt-[20px]">{clientsHeading}</p>
          
          <div className="-mt-[20px] sm:mt-0 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-8 lg:gap-16">
            <div className="bg-[#0E1011] rounded-lg flex items-center justify-center h-[72px]">
              <Image 
                src={clientLogo1}
                alt="IKAR" 
                width={147.32} 
                height={40.41} 
                className="object-contain"
                loading="lazy"
              />
            </div>
            <div className="bg-[#0E1011] rounded-lg flex items-center justify-center h-[72px]">
              <Image 
                src={clientLogo2}
                alt="Technopolis" 
                width={256} 
                height={71.54} 
                className="object-contain"
                loading="lazy"
              />
            </div>

            <div className="bg-[#0E1011] rounded-lg flex items-center justify-center h-[72px]">
              <Image 
                src={clientLogo3}
                alt="Almaz Antey" 
                width={169.6} 
                height={40} 
                className="object-contain"
                loading="lazy"
              />
            </div>
            <div className="bg-[#0E1011] rounded-lg flex items-center justify-center h-[72px]">
              <Image 
                src={clientLogo4}
                alt="Aviaspecmash" 
                width={229.34} 
                height={30.79} 
                className="object-contain"
                loading="lazy"
              />
            </div>

            <div className="bg-[#0E1011] rounded-lg flex items-center justify-center h-[72px]">
              <Image 
                src={clientLogo5}
                alt="StyleEko" 
                width={215.37} 
                height={46.45} 
                className="object-contain"
                loading="lazy"
              />
            </div>
            
            <div className="bg-[#0E1011] rounded-lg flex items-center justify-center h-[72px]">
              <Image 
                src={clientLogo6}
                alt="GardenForesta" 
                width={179} 
                height={58.01} 
                className="object-contain"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}