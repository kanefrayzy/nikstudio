'use client';

import Image from 'next/image';
import Link from 'next/link';

interface Project {
  id: number;
  slug: string;
  projects_page_image?: string;
  projects_page_title?: string;
  main_title: string;
}

interface ProjectsListProps {
  projects: Project[];
  loading?: boolean;
}

// Функция для получения полного URL изображения
const getImageUrl = (imagePath: string) => {
  if (!imagePath) return '/placeholder.jpg';

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // Если путь уже содержит полный URL, используем его
  if (imagePath.startsWith('http')) {
    return imagePath;
  }

  // Убираем все лишние префиксы и получаем чистый путь
  let cleanPath = imagePath;
  if (cleanPath.startsWith('/storage/')) {
    cleanPath = cleanPath.substring('/storage/'.length);
  } else if (cleanPath.startsWith('/')) {
    cleanPath = cleanPath.substring(1);
  }

  return `${apiUrl}/storage/${cleanPath}`;
};

export default function ProjectsList({ projects, loading = false }: ProjectsListProps) {
  if (loading) {
    return (
      <section className="w-full flex flex-col pb-6">
        <div className="text-white text-center py-20">
          <div className="text-xl">Загрузка проектов...</div>
        </div>
      </section>
    );
  }

  if (projects.length === 0) {
    return (
      <section className="w-full flex flex-col pb-6">
        <div className="text-white text-center py-20">
          <div className="text-xl">Проекты не найдены</div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full flex flex-col pb-6">
      <div className="grid grid-cols-1 gap-5 lg:gap-6">
        {projects.map((project, index) => (
          <Link
            href={`/projects/${project.slug}`}
            key={project.id}
            className="group block"
          >
            <div className="relative w-full aspect-square lg:aspect-[1920/1080] overflow-hidden bg-[#0E1011]">
              <Image
                src={getImageUrl(project.projects_page_image || '')}
                alt={project.projects_page_title || project.main_title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                priority={index === 0}
                fetchPriority={index === 0 ? "high" : undefined}
                quality={index === 0 ? 90 : 85}
                sizes="100vw"
                onError={(e) => {
                  console.error('Ошибка загрузки изображения:', project.projects_page_image);
                  e.currentTarget.src = '/placeholder.jpg';
                }}
              />

              {/* Text Overlay */}
              <div className="absolute inset-0 flex items-end">
                <div className="p-5 lg:p-24">
                  <h3 className="text-white font-geometria font-bold text-[32px] lg:text-[96px] xl:text-[128px] 2xl:text-[192px] uppercase leading-none tracking-tight">
                    {project.projects_page_title || project.main_title}
                  </h3>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
