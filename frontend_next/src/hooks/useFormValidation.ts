import { useState, useCallback } from 'react';
import { ValidationResult } from '@/utils/validation';
import { ApiError, useErrorHandler } from '@/utils/apiErrorHandler';

interface UseFormValidationOptions<T> {
  initialValues: T;
  validate: (values: T) => ValidationResult;
  onSubmit: (values: T) => Promise<void>;
}

interface UseFormValidationReturn<T> {
  values: T;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isValid: boolean;
  setValue: (field: keyof T, value: any) => void;
  setValues: (newValues: Partial<T>) => void;
  setFieldError: (field: keyof T, error: string) => void;
  clearFieldError: (field: keyof T) => void;
  clearAllErrors: () => void;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  reset: () => void;
}

export function useFormValidation<T extends Record<string, any>>({
  initialValues,
  validate,
  onSubmit
}: UseFormValidationOptions<T>): UseFormValidationReturn<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { handleError } = useErrorHandler();

  // Установка значения поля
  const setValue = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
    
    // Очищаем ошибку поля при изменении значения
    if (errors[field as string]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });
    }
  }, [errors]);

  // Установка нескольких значений
  const setValuesCallback = useCallback((newValues: Partial<T>) => {
    setValues(prev => ({ ...prev, ...newValues }));
  }, []);

  // Установка ошибки для конкретного поля
  const setFieldError = useCallback((field: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [field as string]: error }));
  }, []);

  // Очистка ошибки для конкретного поля
  const clearFieldError = useCallback((field: keyof T) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field as string];
      return newErrors;
    });
  }, []);

  // Очистка всех ошибок
  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  // Проверка валидности формы
  const isValid = Object.keys(errors).length === 0;

  // Обработка отправки формы
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    // Очищаем предыдущие ошибки
    setErrors({});
    
    // Валидируем форму
    const validationResult = validate(values);
    
    if (!validationResult.isValid) {
      setErrors(validationResult.errors);
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(values);
    } catch (error) {
      // Обрабатываем ошибки API
      if (error && typeof error === 'object' && 'status' in error) {
        const apiError = error as ApiError;
        
        // Если это ошибка валидации, устанавливаем ошибки полей
        if (apiError.status === 422 && apiError.errors) {
          const fieldErrors: Record<string, string> = {};
          Object.entries(apiError.errors).forEach(([field, messages]) => {
            fieldErrors[field] = Array.isArray(messages) ? messages[0] : messages;
          });
          setErrors(fieldErrors);
        } else {
          // Для других ошибок показываем общую ошибку
          const errorMessage = handleError(error);
          setErrors({ general: errorMessage });
        }
      } else {
        // Для неизвестных ошибок
        const errorMessage = handleError(error);
        setErrors({ general: errorMessage });
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validate, onSubmit, handleError]);

  // Сброс формы
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setIsSubmitting(false);
  }, [initialValues]);

  return {
    values,
    errors,
    isSubmitting,
    isValid,
    setValue,
    setValues: setValuesCallback,
    setFieldError,
    clearFieldError,
    clearAllErrors,
    handleSubmit,
    reset
  };
}

// Хук для обработки загрузки файлов с валидацией
interface UseFileUploadOptions {
  onUpload: (file: File) => Promise<string>;
  validateFile?: (file: File) => { isValid: boolean; error?: string };
  maxSize?: number;
  allowedTypes?: string[];
}

interface UseFileUploadReturn {
  file: File | null;
  preview: string | null;
  isUploading: boolean;
  error: string | null;
  uploadedUrl: string | null;
  setFile: (file: File | null) => void;
  upload: () => Promise<void>;
  reset: () => void;
}

export function useFileUpload({
  onUpload,
  validateFile,
  maxSize,
  allowedTypes
}: UseFileUploadOptions): UseFileUploadReturn {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const { handleError } = useErrorHandler();

  const setFileCallback = useCallback((newFile: File | null) => {
    // Очищаем предыдущие состояния
    setError(null);
    setUploadedUrl(null);
    
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }

    if (!newFile) {
      setFile(null);
      return;
    }

    // Валидация размера файла
    if (maxSize && newFile.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      setError(`Размер файла превышает максимально допустимый (${maxSizeMB} МБ)`);
      return;
    }

    // Валидация типа файла
    if (allowedTypes && !allowedTypes.includes(newFile.type)) {
      setError('Неподдерживаемый тип файла');
      return;
    }

    // Кастомная валидация
    if (validateFile) {
      const validation = validateFile(newFile);
      if (!validation.isValid) {
        setError(validation.error || 'Ошибка валидации файла');
        return;
      }
    }

    setFile(newFile);

    // Создаем превью для изображений
    if (newFile.type.startsWith('image/')) {
      const previewUrl = URL.createObjectURL(newFile);
      setPreview(previewUrl);
    }
  }, [maxSize, allowedTypes, validateFile, preview]);

  const upload = useCallback(async () => {
    if (!file) {
      setError('Файл не выбран');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const url = await onUpload(file);
      setUploadedUrl(url);
    } catch (error) {
      const errorMessage = handleError(error);
      setError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  }, [file, onUpload, handleError]);

  const reset = useCallback(() => {
    setFile(null);
    setError(null);
    setUploadedUrl(null);
    setIsUploading(false);
    
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
  }, [preview]);

  return {
    file,
    preview,
    isUploading,
    error,
    uploadedUrl,
    setFile: setFileCallback,
    upload,
    reset
  };
}