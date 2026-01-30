import { MediaPageData } from '@/types/media';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Fetch media page data from public API with caching
 */
export const fetchMediaPageData = async (): Promise<MediaPageData> => {
  try {
    console.log('🌐 Запрос к API:', `${API_BASE_URL}/api/public/media-page`);
    
    const response = await fetch(`${API_BASE_URL}/api/public/media-page`, {
      // Add caching for client-side requests
      next: { revalidate: 1800 }, // Cache for 30 minutes
      cache: 'force-cache', // Request deduplication
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    console.log('📡 Ответ от API:', {
      status: response.status,
      success: (data as any).success,
      dataExists: !!(data as any).data,
      fullResponse: data
    });

    if ((data as any).success && (data as any).data) {
      console.log('✅ Данные успешно получены от API');
      console.log('👥 Отзывы в ответе API:', (data as any).data.testimonials);
      return (data as any).data;
    } else {
      throw new Error('Invalid API response format');
    }
  } catch (error) {
    console.error('❌ Ошибка при получении данных от API:', error);
    throw error;
  }
};