'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import ProjectCategories from '@/components/ProjectCategories';
import { getImageUrl } from "@/lib/media-utils";

interface Project {
  id: number;
  name: string;
  year: string;
  main_image: string;
  logo: string;
  main_title: string;
  alt_text: string;
  slug: string;
}

interface ProjectsSectionProps {
  initialProjects: Project[];
  initialCategoryId?: string;
}

export default function ProjectsSection({ initialProjects, initialCategoryId }: ProjectsSectionProps) {
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(
    initialCategoryId ? parseInt(initialCategoryId) : null
  );
  const projectsSectionRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const categoryId = searchParams.get('category_id');
    if (categoryId) {
      const categoryIdNum = parseInt(categoryId, 10);
      setSelectedCategory(categoryIdNum);
      if (projectsSectionRef.current) {
        setTimeout(() => {
          projectsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } else {
      setSelectedCategory(null);
    }
  }, [searchParams]);

  const displayedProjects = showAllProjects ? initialProjects : initialProjects.slice(0, 4);

  return (
    <section className="w-full bg-[#181A1B] pt-7 sm:pt-24 flex flex-col sm:mt-[25px] scroll-mt-20">
      <div className="px-5 sm:px-12 lg:px-24 flex flex-col gap-24">
        {/* Header */}
        <div className="flex flex-col gap-24">
          <div className="flex flex-row justify-between items-center">
            <h3 className="text-white/60 font-cabin font-medium text-[20px] sm:text-2xl lg:text-[32px] sm:w-[288px] h-[32px]">
              проекты под ключ
            </h3>
            <span className="text-white/60 font-cabin font-medium text-[20px] sm:text-2xl lg:text-[32px]">
              (01)
            </span>
          </div>

          <div className="flex flex-col gap-4 -mt-[80px] sm:-mt-[15px]">
            <h2 className="text-white font-geometria font-extrabold text-[60px] sm:text-6xl xl:text-[200px] 2xl:text-[280px] uppercase leading-none">
              проекты
            </h2>

            <p className="text-white font-inter font-medium sm:font-semibold text-[32px] sm:text-2xl lg:text-[80px] leading-[120%] sm:leading-tight max-w-[1450px] max-w-full-3xl mt-[14px] sm:-mt-[15px]">
              Мы берём на себя составление всех технических заданий. Все части проекта в едином ключе
            </p>
          </div>
        </div>

        {/* Project Categories */}
        <div id="projects" ref={projectsSectionRef} className="-mt-[165px] sm:mt-0">
        </div>
        <ProjectCategories
          selectedCategory={selectedCategory}
        />
      </div>

      {/* Project Items */}
      <div className="flex flex-col gap-12 mt-[25px] sm:mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {displayedProjects.map((project) => (
            <Link href={`/projects/${project.slug}`} key={project.id} className="flex flex-col group">
              <div className="relative w-full aspect-square overflow-hidden" style={{ minHeight: '390px' }}>
                <Image
                  src={getImageUrl(project.main_image)}
                  alt={project.main_title}
                  fill
                  className="object-cover opacity-70 h-[390px] sm:h-auto transition-transform duration-300 group-hover:scale-110"
                  quality={85}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  onError={(e) => {
                    console.error('Ошибка загрузки изображения:', project.main_image);
                    e.currentTarget.src = '/placeholder.jpg';
                  }}
                />
                {project.logo && (
                  <div className="absolute inset-0 flex items-center justify-center scale-75 sm:scale-100" style={{ minHeight: '122px' }}>
                    <Image
                      src={getImageUrl(project.logo)}
                      alt={`${project.main_title} Logo`}
                      width={335}
                      height={122}
                      className="object-contain"
                      quality={85}
                      onError={(e) => {
                        console.error('Ошибка загрузки логотипа:', project.logo);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-8 px-5 sm:px-8 lg:px-12 -mt-[20px] sm:mt-0 group-hover:bg-white transition-colors duration-300" style={{ minHeight: '80px' }}>
                <h3 className="text-white font-inter font-medium sm:font-semibold text-[24px] sm:text-2xl lg:text-[40px] leading-[140%] sm:leading-tight tracking-[-1px] sm:tracking-normal group-hover:text-black transition-colors duration-300">
                  {project.main_title}
                </h3>
                <span className="text-white/60 font-cabin font-medium text-[24px] sm:text-lg lg:text-[32px] group-hover:text-black transition-colors duration-300">
                  ({project.year})
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Toggle Button */}
      {initialProjects.length > 4 && (
        <div className="py-20 md:py-[76px] px-6 sm:px-12 lg:px-24 flex justify-center md:justify-start mt-3">
          <button
            onClick={() => setShowAllProjects(!showAllProjects)}
            className="flex items-center justify-center w-3xs h-[54px] text-center text-white border-2 border-white rounded-full font-inter font-semibold text-xl md:text-[22px] hover:bg-white hover:text-[#0E1011] hover:cursor-pointer transition-colors duration-300"
          >
            {showAllProjects ? "скрыть проекты" : "все проекты"}
          </button>
        </div>
      )}
    </section>
  );
}
