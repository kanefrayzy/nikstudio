import axios from 'axios';

/**
 * Централизованный API клиент для работы с backend
 * Обрабатывает авторизацию, обновление токенов и ошибки
 */

// Получение токена из cookie
const getTokenFromCookie = (): string | null => {
  if (typeof document === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, ...valueParts] = cookie.trim().split('=');
    if (name === 'admin-token') {
      // Join back in case token contains '=' characters
      const value = valueParts.join('=');
      return decodeURIComponent(value);
    }
  }
  return null;
};

// Сохранение токена в cookie
const saveTokenToCookie = (token: string, maxAge?: number): void => {
  if (typeof document === 'undefined') return;
  
  const age = maxAge || 60 * 60 * 8; // 8 часов по умолчанию
  document.cookie = `admin-token=${token}; path=/; max-age=${age}`;
};

// Удаление токена из cookie
const removeTokenFromCookie = (): void => {
  if (typeof document === 'undefined') return;
  
  document.cookie = 'admin-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
};

// Создание axios instance
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000, // 30 секунд
});

// Request interceptor - добавление токена в заголовки
apiClient.interceptors.request.use(
  (config: any) => {
    const token = getTokenFromCookie();
    
    console.log('[API Client] Request interceptor:', {
      url: config.url,
      method: config.method,
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'none',
      isFormData: config.data instanceof FormData
    });
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('[API Client] Authorization header added');
    } else if (!token) {
      console.warn('[API Client] No token found in cookies!');
    }
    
    // Для FormData удаляем Content-Type, чтобы браузер установил правильный boundary
    if (config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type'];
      console.log('[API Client] Content-Type removed for FormData');
    }
    
    return config;
  },
  (error: any) => {
    console.error('[API Client] Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - обработка ответов и ошибок
apiClient.interceptors.response.use(
  (response: any) => {
    
    // Проверяем наличие нового токена в заголовке X-New-Token
    const newToken = response.headers['x-new-token'];
    const newExpiresAt = response.headers['x-token-expires-at'];
    
    if (newToken) {
      console.log('[API Client] 🔄 Получен новый токен, обновляем cookie');
      
      // Вычисляем max-age из expires_at
      let maxAge = 60 * 60 * 8; // 8 часов по умолчанию
      
      if (newExpiresAt) {
        const expiresAt = new Date(newExpiresAt);
        const now = new Date();
        const diffInSeconds = Math.floor((expiresAt.getTime() - now.getTime()) / 1000);
        
        if (diffInSeconds > 0) {
          maxAge = diffInSeconds;
        }
        
        // Сохраняем время истечения для useTokenRefresh hook
        if (typeof window !== 'undefined') {
          localStorage.setItem('admin-token-expires-at', expiresAt.toISOString());
          document.cookie = `admin-token-expires-at=${encodeURIComponent(expiresAt.toISOString())}; path=/; max-age=${maxAge}`;
        }
      }
      
      saveTokenToCookie(newToken, maxAge);
    }
    
    return response;
  },
  (error: any) => {
    console.error('[API Client] Response error:', {
      url: error.config?.url,
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      data: error.response?.data
    });
    
    // Обработка 401 ошибки - неавторизован
    if (error.response?.status === 401) {
      console.log('[API Client] 🚫 Ошибка 401: Неавторизован, перенаправление на страницу входа');
      
      // Удаляем токен
      removeTokenFromCookie();
      
      // Перенаправляем на страницу логина только если мы не на клиенте
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/admin/login')) {
        window.location.href = '/admin/login';
      }
    }
    
    // Обработка 403 ошибки - доступ запрещён
    if (error.response?.status === 403) {
      console.log('🚫 Ошибка 403: Доступ запрещён');
      
      // Можно показать toast уведомление
      if (typeof window !== 'undefined') {
        // Используем простой alert, можно заменить на toast библиотеку
        alert('Доступ запрещён. У вас нет прав для выполнения этого действия.');
      }
    }
    
    return Promise.reject(error);
  }
);

// Экспорт основных HTTP методов

/**
 * GET запрос
 */
export const get = async <T = any>(url: string, config?: any): Promise<T> => {
  const response = await apiClient.get<T>(url, config);
  return response.data;
};

/**
 * POST запрос
 */
export const post = async <T = any>(url: string, data?: any, config?: any): Promise<T> => {
  const response = await apiClient.post<T>(url, data, config);
  return response.data;
};

/**
 * PUT запрос
 */
export const put = async <T = any>(url: string, data?: any, config?: any): Promise<T> => {
  const response = await apiClient.put<T>(url, data, config);
  return response.data;
};

/**
 * DELETE запрос
 */
export const del = async <T = any>(url: string, config?: any): Promise<T> => {
  const response = await apiClient.delete<T>(url, config);
  return response.data;
};

/**
 * PATCH запрос
 */
export const patch = async <T = any>(url: string, data?: any, config?: any): Promise<T> => {
  const response = await apiClient.patch<T>(url, data, config);
  return response.data;
};

// Экспорт axios instance для прямого использования если нужно
export default apiClient;

// Экспорт утилит для работы с токенами
export { getTokenFromCookie, saveTokenToCookie, removeTokenFromCookie };
