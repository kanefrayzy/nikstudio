'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ProjectCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

interface ProjectCategoriesProps {
  className?: string;
  onCategoryChange?: (categoryId: number | null) => void;
  selectedCategory: number | null;
}

interface ApiResponse {
  status?: string;
  success?: boolean; // Для обратной совместимости
  data?: ProjectCategory[];
  message?: string;
}

const ProjectCategories: React.FC<ProjectCategoriesProps> = ({ className, onCategoryChange, selectedCategory }) => {
  const [categories, setCategories] = useState<ProjectCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

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

        console.log('Ответ API:', data); // Для отладки

        // Проверяем разные варианты структуры ответа
        if (data.status === 'success' && data.data) {
          setCategories(data.data);
        } else if (data.success && data.data) {
          // Для обратной совместимости
          setCategories(data.data);
        } else if (Array.isArray(data.data)) {
          // Если данные есть, но статус не указан
          setCategories(data.data);
        } else if (Array.isArray(data)) {
          // Если данные пришли как массив
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

  // Обработчик клика по категории
  const handleCategoryClick = (categoryId: number | null) => {
    if (onCategoryChange) {
      // Legacy callback support
      onCategoryChange(categoryId);
    } else {
      // Use router navigation for ISR
      if (categoryId === null) {
        router.push('/projects');
      } else {
        router.push(`/projects?category_id=${categoryId}`);
      }
    }
  };

  if (loading) {
    return (
      <section className={`w-full px-5 sm:px-12 lg:px-24 flex justify-center items-center -mt-[26px] sm:mt-10 ${className}`}>
        <div className="text-white text-[20px] sm:text-xl lg:text-[32px] font-light sm:font-normal font-geometria sm:font-inter leading-[100%] sm:leading-none">
          Загрузка...
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={`w-full px-5 sm:px-12 lg:px-24 flex justify-center items-center -mt-[26px] sm:mt-10 ${className}`}>
        <div className="text-white text-[20px] sm:text-xl lg:text-[32px] font-light sm:font-normal font-geometria sm:font-inter leading-[100%] sm:leading-none">
          Ошибка: {error}
        </div>
      </section>
    );
  }

  return (
    <section className={`w-full px-5 sm:px-12 lg:px-24 flex justify-center items-center mt-[10px] sm:mt-10 ${className}`}>
      <div className="text-white text-[20px] sm:text-xl lg:text-[32px] font-light font-geometria sm:font-inter leading-[100%] sm:leading-none flex flex-wrap justify-center gap-4 sm:gap-8 lg:gap-10">
        {/* Ссылка "Проекты" для показа всех проектов */}
        <span
          onClick={() => handleCategoryClick(null)}
          className={`cursor-pointer transition-colors duration-300 ${selectedCategory === null ? 'text-[#DE063A]' : 'hover:text-[#DE063A]'}`}
        >
          Проекты
        </span>

        {/* Динамические категории из API */}
        {categories.map((category) => (
          <span
            key={category.id}
            onClick={() => handleCategoryClick(category.id)}
            className={` cursor-pointer transition-colors duration-300 ${selectedCategory === category.id ? 'text-[#DE063A]' : 'hover:text-[#DE063A]'}`}
          >
            {category.name}
          </span>
        ))}
      </div>
    </section>
  );
};

export default ProjectCategories;
