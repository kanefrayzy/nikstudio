// Утилиты для валидации форм с русскими сообщениями об ошибках

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

// Валидация размера файла
export const validateFileSize = (file: File, type: 'image' | 'video'): FileValidationResult => {
  const maxSize = type === 'image' ? 2 * 1024 * 1024 : 50 * 1024 * 1024; // 2MB для изображений, 50MB для видео
  
  if (file.size > maxSize) {
    const maxSizeMB = type === 'image' ? '2 МБ' : '50 МБ';
    return {
      isValid: false,
      error: `Размер файла превышает максимально допустимый (${maxSizeMB})`
    };
  }
  
  return { isValid: true };
};

// Валидация типа файла
export const validateFileType = (file: File, type: 'image' | 'video'): FileValidationResult => {
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const allowedVideoTypes = ['video/mp4', 'video/webm'];
  
  const allowedTypes = type === 'image' ? allowedImageTypes : allowedVideoTypes;
  
  if (!allowedTypes.includes(file.type)) {
    const allowedExtensions = type === 'image' ? 'JPG, PNG, WebP' : 'MP4, WebM';
    return {
      isValid: false,
      error: `Неподдерживаемый тип файла. Разрешены: ${allowedExtensions}`
    };
  }
  
  return { isValid: true };
};

// Комплексная валидация файла
export const validateFile = (file: File, type: 'image' | 'video'): FileValidationResult => {
  // Проверяем тип файла
  const typeValidation = validateFileType(file, type);
  if (!typeValidation.isValid) {
    return typeValidation;
  }
  
  // Проверяем размер файла
  const sizeValidation = validateFileSize(file, type);
  if (!sizeValidation.isValid) {
    return sizeValidation;
  }
  
  return { isValid: true };
};

// Валидация текстовых полей
export const validateTextField = (value: string, fieldName: string, required: boolean = true, minLength?: number, maxLength?: number): string | null => {
  if (required && (!value || value.trim().length === 0)) {
    return `${fieldName} обязательно для заполнения`;
  }
  
  if (minLength && value.length < minLength) {
    return `${fieldName} должно содержать минимум ${minLength} символов`;
  }
  
  if (maxLength && value.length > maxLength) {
    return `${fieldName} должно содержать максимум ${maxLength} символов`;
  }
  
  return null;
};

// Валидация формы героя
export const validateHeroForm = (title: string, description: string): ValidationResult => {
  const errors: Record<string, string> = {};
  
  const titleError = validateTextField(title, 'Заголовок', true, 1, 100);
  if (titleError) errors.title = titleError;
  
  const descriptionError = validateTextField(description, 'Описание', true, 1, 500);
  if (descriptionError) errors.description = descriptionError;
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Валидация формы сервиса
export const validateServiceForm = (title: string, description: string): ValidationResult => {
  const errors: Record<string, string> = {};
  
  const titleError = validateTextField(title, 'Название сервиса', true, 1, 100);
  if (titleError) errors.title = titleError;
  
  const descriptionError = validateTextField(description, 'Описание сервиса', true, 1, 1000);
  if (descriptionError) errors.description = descriptionError;
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Валидация формы отзыва
export const validateTestimonialForm = (company: string, quote: string, text: string): ValidationResult => {
  const errors: Record<string, string> = {};
  
  const companyError = validateTextField(company, 'Название компании', true, 1, 100);
  if (companyError) errors.company = companyError;
  
  const quoteError = validateTextField(quote, 'Цитата', true, 1, 200);
  if (quoteError) errors.quote = quoteError;
  
  const textError = validateTextField(text, 'Описание', true, 1, 500);
  if (textError) errors.text = textError;
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Валидация формы шага процесса
export const validateProcessStepForm = (stepNumber: string, title: string, subtitle: string, leftDescription: string, rightDescription: string): ValidationResult => {
  const errors: Record<string, string> = {};
  
  const stepNumberError = validateTextField(stepNumber, 'Номер шага', true, 1, 10);
  if (stepNumberError) errors.stepNumber = stepNumberError;
  
  const titleError = validateTextField(title, 'Заголовок', true, 1, 100);
  if (titleError) errors.title = titleError;
  
  const subtitleError = validateTextField(subtitle, 'Подзаголовок', true, 1, 200);
  if (subtitleError) errors.subtitle = subtitleError;
  
  const leftDescriptionError = validateTextField(leftDescription, 'Левое описание', true, 1, 500);
  if (leftDescriptionError) errors.leftDescription = leftDescriptionError;
  
  const rightDescriptionError = validateTextField(rightDescription, 'Правое описание', true, 1, 500);
  if (rightDescriptionError) errors.rightDescription = rightDescriptionError;
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Обработка ошибок API
export const handleApiError = (error: any): string => {
  // Если это ошибка с кодом 413 (файл слишком большой)
  if (error.status === 413) {
    return 'Размер файла превышает максимально допустимый';
  }
  
  // Если это ошибка валидации (422)
  if (error.status === 422) {
    if (error.data && error.data.errors) {
      // Возвращаем первую ошибку валидации
      const firstError = Object.values(error.data.errors)[0];
      return Array.isArray(firstError) ? firstError[0] : String(firstError);
    }
    return 'Ошибка валидации данных';
  }
  
  // Если это ошибка сервера (500)
  if (error.status >= 500) {
    return 'Внутренняя ошибка сервера. Попробуйте позже';
  }
  
  // Если это ошибка сети
  if (error.name === 'NetworkError' || error.message?.includes('fetch')) {
    return 'Ошибка сети. Проверьте подключение к интернету';
  }
  
  // Общая ошибка
  return error.message || 'Произошла неизвестная ошибка';
};

// Утилита для отображения ошибок в формах
export const getFieldError = (errors: Record<string, string>, fieldName: string): string | undefined => {
  return errors[fieldName];
};

// Проверка, есть ли ошибки в форме
export const hasFormErrors = (errors: Record<string, string>): boolean => {
  return Object.keys(errors).length > 0;
};