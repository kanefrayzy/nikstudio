import useSWR from 'swr';
import { get } from '@/lib/api';
import { SEOSettings } from '@/lib/seo-metadata';

/**
 * Интерфейс ответа API для SEO настроек
 */
interface SEOSettingsResponse {
  status?: string;
  data: SEOSettings;
}

/**
 * Fetcher функция для SWR
 */
const seoSettingsFetcher = async (): Promise<SEOSettings | null> => {
  try {
    const response = await get<SEOSettingsResponse>('/api/seo/settings');
    return response.data || null;
  } catch (error) {
    console.error('Error fetching SEO settings:', error);
    return null;
  }
};

/**
 * Hook для получения глобальных SEO настроек с кэшированием
 * 
 * Использует SWR для кэширования данных SEO настроек.
 * Данные обновляются автоматически каждые 10 минут.
 * 
 * @returns {Object} - Объект с данными SEO настроек, состоянием загрузки и ошибкой
 */
export function useSEOSettings() {
  const { data, error, isLoading, mutate } = useSWR<SEOSettings | null>(
    '/api/seo/settings',
    seoSettingsFetcher,
    {
      // Кэширование на 10 минут (600000 мс) - SEO настройки меняются очень редко
      refreshInterval: 600000,
      
      // Не обновлять при фокусе окна
      revalidateOnFocus: false,
      
      // Не обновлять при переподключении
      revalidateOnReconnect: false,
      
      // Использовать кэш при монтировании
      revalidateOnMount: true,
      
      // Дедупликация запросов в течение 5 секунд
      dedupingInterval: 5000,
      
      // Показывать устаревшие данные во время обновления
      keepPreviousData: true,
      
      // Не показывать ошибку в консоли при неудаче
      shouldRetryOnError: false,
    }
  );

  return {
    settings: data,
    isLoading,
    isError: error,
    mutate, // Функция для ручного обновления данных
  };
}
