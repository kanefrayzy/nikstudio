// Утилиты для обработки ошибок API

export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
  data?: any;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

// Обработчик ошибок fetch запросов
export const handleFetchError = async (response: Response): Promise<ApiError> => {
  let errorData: any = {};
  
  try {
    errorData = await response.json();
  } catch {
    // Если не удается распарсить JSON, используем стандартное сообщение
  }

  const apiError: ApiError = {
    status: response.status,
    message: errorData.message || getDefaultErrorMessage(response.status),
    errors: errorData.errors,
    data: errorData
  };

  return apiError;
};

// Получение стандартного сообщения об ошибке по HTTP коду
export const getDefaultErrorMessage = (status: number): string => {
  switch (status) {
    case 400:
      return 'Неверный запрос';
    case 401:
      return 'Необходима авторизация';
    case 403:
      return 'Доступ запрещен';
    case 404:
      return 'Ресурс не найден';
    case 413:
      return 'Размер файла превышает максимально допустимый';
    case 422:
      return 'Ошибка валидации данных';
    case 429:
      return 'Слишком много запросов. Попробуйте позже';
    case 500:
      return 'Внутренняя ошибка сервера';
    case 502:
      return 'Сервер временно недоступен';
    case 503:
      return 'Сервис временно недоступен';
    default:
      return 'Произошла ошибка при выполнении запроса';
  }
};

// Обработка ошибок валидации
export const getValidationErrors = (apiError: ApiError): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  if (apiError.errors) {
    Object.entries(apiError.errors).forEach(([field, messages]) => {
      errors[field] = Array.isArray(messages) ? messages[0] : messages;
    });
  }
  
  return errors;
};

// Проверка, является ли ошибка ошибкой валидации
export const isValidationError = (error: ApiError): boolean => {
  return error.status === 422 && !!error.errors;
};

// Проверка, является ли ошибка ошибкой размера файла
export const isFileSizeError = (error: ApiError): boolean => {
  return error.status === 413;
};

// Универсальная функция для выполнения API запросов с обработкой ошибок
export const apiRequest = async <T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await handleFetchError(response);
      throw error;
    }

    const data: ApiResponse<T> = await response.json();
    
    if (!data.success) {
      throw {
        status: response.status,
        message: data.message || 'Запрос выполнен с ошибкой',
        errors: data.errors,
        data: data
      } as ApiError;
    }

    return data.data as T;
  } catch (error) {
    // Если это уже ApiError, пробрасываем дальше
    if (error && typeof error === 'object' && 'status' in error) {
      throw error;
    }
    
    // Обрабатываем сетевые ошибки
    throw {
      status: 0,
      message: 'Ошибка сети. Проверьте подключение к интернету',
      data: error
    } as ApiError;
  }
};

// Функция для выполнения запросов с FormData (для загрузки файлов)
export const apiFormDataRequest = async <T = any>(
  url: string,
  formData: FormData,
  method: 'POST' | 'PUT' | 'PATCH' = 'POST'
): Promise<T> => {
  try {
    const response = await fetch(url, {
      method,
      body: formData,
      // Не устанавливаем Content-Type для FormData - браузер сделает это автоматически
    });

    if (!response.ok) {
      const error = await handleFetchError(response);
      throw error;
    }

    const data: ApiResponse<T> = await response.json();
    
    if (!data.success) {
      throw {
        status: response.status,
        message: data.message || 'Запрос выполнен с ошибкой',
        errors: data.errors,
        data: data
      } as ApiError;
    }

    return data.data as T;
  } catch (error) {
    // Если это уже ApiError, пробрасываем дальше
    if (error && typeof error === 'object' && 'status' in error) {
      throw error;
    }
    
    // Обрабатываем сетевые ошибки
    throw {
      status: 0,
      message: 'Ошибка сети. Проверьте подключение к интернету',
      data: error
    } as ApiError;
  }
};

// Хук для обработки ошибок в React компонентах
export const useErrorHandler = () => {
  const handleError = (error: any): string => {
    if (error && typeof error === 'object' && 'status' in error) {
      const apiError = error as ApiError;
      
      // Для ошибок валидации возвращаем первую ошибку
      if (isValidationError(apiError)) {
        const validationErrors = getValidationErrors(apiError);
        const firstError = Object.values(validationErrors)[0];
        return firstError || apiError.message;
      }
      
      return apiError.message;
    }
    
    return error?.message || 'Произошла неизвестная ошибка';
  };

  return { handleError };
};