'use client';

import Link from "next/link";
import Image from "next/image";
import BackToTopLink from "./BackToTopLink";
import { useState, useEffect } from 'react';

interface ProjectCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

interface ApiResponse {
  status?: string;
  success?: boolean;
  data?: ProjectCategory[];
  message?: string;
}

export default function Footer() {
  const [categories, setCategories] = useState<ProjectCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const response = await fetch(`${apiUrl}/api/project-categories`, {
          next: { revalidate: 3600 } // Cache for 1 hour
        });
        
        if (!response.ok) {
          throw new Error('Ошибка при загрузке категорий');
        }

        const data: ApiResponse = await response.json();
        
        // Проверяем разные варианты структуры ответа
        if (data.status === 'success' && data.data) {
          setCategories(data.data);
        } else if (data.success && data.data) {
          setCategories(data.data);
        } else if (Array.isArray(data.data)) {
          setCategories(data.data);
        } else if (Array.isArray(data)) {
          setCategories(data as ProjectCategory[]);
        } else {
          throw new Error(data.message || 'Ошибка при получении данных');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Произошла ошибка');
        console.error('Ошибка при загрузке категорий:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <footer className="bg-white w-full hidden sm:block">
      <div className="flex flex-col justify-between gap-20 lg:gap-40 px-6 sm:px-12 lg:px-24 pt-12 lg:pt-24 pb-8 lg:pb-16 w-full">
        {/* Logo and Navigation */}
        <div className="flex flex-col justify-stretch gap-16 lg:gap-32 w-full">
          {/* Logo */}
          <div className="relative">
            <div className="mt-10 lg:mt-[79px]">
              <Link href="/">
                <Image
                  src="/images/footer/logo_footer.svg"
                  alt="NIK Studio Logo"
                  className="w-full max-w-[393.59px] h-auto"
                  width={393.59}
                  height={139.15}
                  loading="lazy"
                />
              </Link>
            </div>
          </div>

          {/* Navigation Lists */}
          <div className="flex flex-col gap-12 lg:gap-24 w-full mt-12 sm:mt-24 lg:mt-[203px]">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 xl:gap-24 2xl:gap-26 w-full">
              {/* Страницы */}
              <div className="flex flex-col gap-4 lg:gap-8 self-stretch">
                <h3 className="text-[#0E1011]/60 text-xl lg:text-[30px] font-geometria font-normal leading-[100%] w-full lg:w-[360px] lg:h-[30px] self-stretch flex-grow-0">
                  Страницы
                </h3>
                <nav className="flex flex-col gap-2 lg:gap-4">
                  <Link
                    href="/"
                    className="text-[#0E1011] hover:text-[#DE063A] text-xl lg:text-[26px] font-inter font-semibold leading-[130%] w-full lg:w-[360px] lg:h-[34px] self-stretch flex-grow-0 transition-colors duration-300"
                  >
                    Главная
                  </Link>
                  <Link
                    href="/about"
                    className="text-[#0E1011] hover:text-[#DE063A] text-xl lg:text-[26px] font-inter font-semibold leading-[130%] w-full lg:w-[360px] lg:h-[34px] self-stretch flex-grow-0 transition-colors duration-300"
                  >
                    О нас
                  </Link>
                  <Link
                    href="/blog"
                    className="text-[#0E1011] hover:text-[#DE063A] text-xl lg:text-[26px] font-inter font-semibold leading-[130%] w-full lg:w-[360px] lg:h-[34px] self-stretch flex-grow-0 transition-colors duration-300"
                  >
                    Блог
                  </Link>
                  <Link
                    href="/contact"
                    className="text-[#0E1011] hover:text-[#DE063A] text-xl lg:text-[26px] font-inter font-semibold leading-[130%] w-full lg:w-[360px] lg:h-[34px] self-stretch flex-grow-0 transition-colors duration-300"
                  >
                    Связаться
                  </Link>
                </nav>
              </div>

              {/* Проекты */}
              <div className="flex flex-col gap-4 lg:gap-8 self-stretch">
                <h3 className="text-[#0E1011]/60 text-xl lg:text-[30px] font-geometria font-normal leading-[100%] w-full lg:w-[360px] lg:h-[30px] self-stretch flex-grow-0">
                  Проекты
                </h3>
                <nav className="flex flex-col gap-2 lg:gap-4">
                  {/* Ссылка на все проекты */}
                  <Link
                    href="/projects"
                    className="text-[#0E1011] hover:text-[#DE063A] text-xl lg:text-[26px] font-inter font-semibold leading-[130%] w-full lg:w-[360px] lg:h-[34px] self-stretch flex-grow-0 transition-colors duration-300"
                  >
                    Проекты под ключ
                  </Link>
                  
                  {/* Динамические категории */}
                  {loading ? (
                    <span className="text-[#0E1011]/60 text-xl lg:text-[26px] font-inter font-normal leading-[130%]">
                      Загрузка...
                    </span>
                  ) : error ? (
                    <span className="text-[#0E1011]/60 text-xl lg:text-[26px] font-inter font-normal leading-[130%]">
                      Ошибка загрузки
                    </span>
                  ) : (
                    categories.map((category) => (
                      <Link
                        key={category.id}
                        href={`/?category_id=${category.id}#projects`}
                        className="text-[#0E1011] hover:text-[#DE063A] text-xl lg:text-[26px] font-inter font-semibold leading-[130%] w-full lg:w-[360px] lg:h-[34px] self-stretch flex-grow-0 transition-colors duration-300"
                      >
                        {category.name}
                      </Link>
                    ))
                  )}
                </nav>
              </div>

              {/* Медиа */}
              <div className="flex flex-col gap-4 lg:gap-8 self-stretch mt-8 sm:mt-0">
                <h3 className="text-[#0E1011]/60 text-xl lg:text-[30px] font-geometria font-normal leading-[100%] w-full lg:w-[360px] lg:h-[30px] self-stretch flex-grow-0">
                  Услуги
                </h3>
                <nav className="flex flex-col gap-2 lg:gap-4">
                  <Link
                    href="/media"
                    className="text-[#0E1011] hover:text-[#DE063A] text-xl lg:text-[26px] font-inter font-semibold leading-[130%] w-full lg:w-[360px] lg:h-[34px] self-stretch flex-grow-0 transition-colors duration-300"
                  >
                    Медиа
                  </Link>                  
                </nav>
              </div>

              {/* Социальные сети */}
              <div className="flex flex-col gap-4 lg:gap-8 self-stretch mt-8 sm:mt-0">
                <h3 className="text-[#0E1011]/60 text-xl lg:text-[30px] font-geometria font-normal leading-[100%] w-full lg:w-[360px] lg:h-[30px] self-stretch flex-grow-0">
                  Социальные сети
                </h3>
                <nav className="flex flex-col gap-2 lg:gap-4">
                  <a
                    href="tel:+79263314618"
                    className="text-[#0E1011] hover:text-[#DE063A] text-xl lg:text-[26px] font-inter font-semibold leading-[130%] w-full lg:w-[360px] lg:h-[34px] self-stretch flex-grow-0 transition-colors duration-300"
                  >
                    +7 (926) 331-46-18
                  </a>
                  <a
                    href="mailto:info@nikstudio.pro"
                    className="text-[#0E1011] hover:text-[#DE063A] text-xl lg:text-[26px] font-inter font-semibold leading-[130%] w-full lg:w-[360px] lg:h-[34px] self-stretch flex-grow-0 transition-colors duration-300"
                  >
                    info@nikstudio.pro
                  </a>
                  <a
                    href="https://www.instagram.com/nikstudio.pro/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0E1011] hover:text-[#DE063A] text-xl lg:text-[26px] font-inter font-semibold leading-[130%] w-full lg:w-[360px] lg:h-[34px] self-stretch flex-grow-0 transition-colors duration-300"
                  >
                    Instagram
                  </a>
                  <a
                    href="https://m.vk.com/nikstudiopro?from=groups"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0E1011] hover:text-[#DE063A] text-xl lg:text-[26px] font-inter font-semibold leading-[130%] w-full lg:w-[360px] lg:h-[34px] self-stretch flex-grow-0 transition-colors duration-300"
                  >
                    Вконтакте
                  </a>
                  <a
                    href="https://t.me/slavanikitin_msk"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0E1011] hover:text-[#DE063A] text-xl lg:text-[26px] font-inter font-semibold leading-[130%] w-full lg:w-[360px] lg:h-[34px] self-stretch flex-grow-0 transition-colors duration-300"
                  >
                    Телеграм
                  </a>
                </nav>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Links */}
        <div className="flex flex-col sm:flex-row justify-between w-full sm:-mt-8 lg:-mt-[67px] gap-8 sm:gap-0">
          <div className="flex flex-col gap-0.5">
            <Link 
              href="https://www.golatemplate.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#0E1011] text-lg sm:text-[22px] font-semibold font-inter hover:text-[#DE063A] underline underline-offset-5 decoration-2 transition-colors duration-300"
            >
            </Link>
          </div>
          <BackToTopLink />
        </div>
      </div>
    </footer>
  );
}