import useSWR from 'swr';
import { get } from '@/lib/api';

/**
 * Интерфейс проекта
 */
export interface Project {
  id: number;
  main_title: string;
  projects_page_title?: string;
  slug: string;
  year: number;
  category_id?: number;
  main_image?: string;
  projects_page_image?: string;
  logo?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Интерфейс ответа API для проектов
 */
interface ProjectsResponse {
  success: boolean;
  data: Project[];
}

/**
 * Функция для корректировки URL изображений
 */
function getImageUrl(imagePath: string | null): string {
  if (!imagePath) return '';
  if (imagePath.startsWith('http')) return imagePath;
  if (imagePath.startsWith('/images/')) return imagePath;
  
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  
  if (imagePath.startsWith('/storage/')) {
    return `${apiUrl}${imagePath}`;
  } else if (imagePath.startsWith('projects')) {
    return `${apiUrl}/storage/${imagePath}`;
  } else {
    return `${apiUrl}/storage/projects/${imagePath}`;
  }
}

/**
 * Fetcher функция для SWR
 */
const projectsFetcher = async (): Promise<Project[]> => {
  const response = await get<ProjectsResponse>('/api/projects');
  
  if (response.success && response.data) {
    // Корректировка URL изображений
    return response.data.map(project => ({
      ...project,
      main_image: getImageUrl(project.main_image ?? null),
      projects_page_image: getImageUrl(project.projects_page_image ?? null),
      logo: getImageUrl(project.logo ?? null),
    }));
  }
  
  return [];
};

/**
 * Hook для получения списка проектов с кэшированием
 * 
 * Использует SWR для кэширования данных проектов.
 * Данные обновляются автоматически каждые 2 минуты.
 * 
 * @returns {Object} - Объект с данными проектов, состоянием загрузки и ошибкой
 */
export function useProjects() {
  const { data, error, isLoading, mutate } = useSWR<Project[]>(
    '/api/projects',
    projectsFetcher,
    {
      // Кэширование на 2 минуты (120000 мс) - проекты могут обновляться чаще
      refreshInterval: 120000,
      
      // Не обновлять при фокусе окна
      revalidateOnFocus: false,
      
      // Обновлять при переподключении
      revalidateOnReconnect: true,
      
      // Использовать кэш при монтировании
      revalidateOnMount: true,
      
      // Дедупликация запросов в течение 2 секунд
      dedupingInterval: 2000,
      
      // Показывать устаревшие данные во время обновления
      keepPreviousData: true,
    }
  );

  return {
    projects: data || [],
    isLoading,
    isError: error,
    mutate, // Функция для ручного обновления данных
  };
}
