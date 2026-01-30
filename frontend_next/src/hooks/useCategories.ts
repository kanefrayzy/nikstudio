import useSWR from 'swr';
import { get } from '@/lib/api';

/**
 * Интерфейс категории проекта
 */
export interface ProjectCategory {
  id: number;
  name: string;
  slug: string;
  sort_order?: number;
  created_at: string;
  updated_at: string;
}

/**
 * Интерфейс ответа API для категорий
 */
interface CategoriesResponse {
  status: string;
  data: ProjectCategory[];
}

/**
 * Fetcher функция для SWR
 */
const categoriesFetcher = async (): Promise<ProjectCategory[]> => {
  const response = await get<CategoriesResponse>('/api/project-categories');
  
  if (response.status === 'success' && response.data) {
    // Сортировка по sort_order
    return response.data.sort((a, b) => {
      const orderA = a.sort_order ?? 999;
      const orderB = b.sort_order ?? 999;
      return orderA - orderB;
    });
  }
  
  return [];
};

/**
 * Hook для получения категорий проектов с кэшированием
 * 
 * Использует SWR для кэширования данных категорий.
 * Данные обновляются автоматически каждые 5 минут.
 * 
 * @returns {Object} - Объект с данными категорий, состоянием загрузки и ошибкой
 */
export function useCategories() {
  const { data, error, isLoading, mutate } = useSWR<ProjectCategory[]>(
    '/api/project-categories',
    categoriesFetcher,
    {
      // Кэширование на 5 минут (300000 мс)
      refreshInterval: 300000,
      
      // Не обновлять при фокусе окна (категории редко меняются)
      revalidateOnFocus: false,
      
      // Не обновлять при переподключении
      revalidateOnReconnect: false,
      
      // Использовать кэш при монтировании
      revalidateOnMount: true,
      
      // Дедупликация запросов в течение 2 секунд
      dedupingInterval: 2000,
      
      // Показывать устаревшие данные во время обновления
      keepPreviousData: true,
    }
  );

  return {
    categories: data || [],
    isLoading,
    isError: error,
    mutate, // Функция для ручного обновления данных
  };
}
