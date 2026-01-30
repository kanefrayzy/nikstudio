import { EmailServiceError, EmailErrorType } from './ContactEmailService';

// Error message mapping in Russian
export const ERROR_MESSAGES = {
  [EmailErrorType.VALIDATION]: {
    generic: 'Пожалуйста, исправьте ошибки в форме',
    name: 'Имя должно содержать минимум 2 символа',
    email: 'Введите корректный email адрес',
    message: 'Сообщение должно содержать минимум 10 символов',
    company: 'Название компании не может быть пустым',
    required: 'Это поле обязательно для заполнения'
  },
  [EmailErrorType.NETWORK]: {
    generic: 'Проверьте подключение к интернету и попробуйте снова',
    timeout: 'Превышено время ожидания, попробуйте снова',
    connection: 'Не удается подключиться к серверу',
    offline: 'Отсутствует подключение к интернету'
  },
  [EmailErrorType.SMTP]: {
    generic: 'Ошибка подключения к почтовому серверу',
    authentication: 'Ошибка аутентификации почтового сервера',
    connection: 'Не удается подключиться к почтовому серверу',
    configuration: 'Неверная конфигурация почтового сервера'
  },
  [EmailErrorType.SERVER]: {
    generic: 'Сервис временно недоступен, попробуйте позже',
    maintenance: 'Сервер находится на техническом обслуживании',
    overload: 'Сервер перегружен, попробуйте позже',
    internal: 'Внутренняя ошибка сервера'
  },
  [EmailErrorType.GENERIC]: {
    generic: 'Произошла ошибка при отправке сообщения',
    unknown: 'Неизвестная ошибка, попробуйте позже',
    unexpected: 'Произошла неожиданная ошибка'
  }
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  contact: 'Сообщение успешно отправлено!',
  project: 'Запрос по проекту успешно отправлен!',
  generic: 'Операция выполнена успешно!'
} as const;

// Loading messages
export const LOADING_MESSAGES = {
  sending: 'Отправка...',
  processing: 'Обработка...',
  connecting: 'Подключение...'
} as const;

// Error classification utility
export class EmailErrorClassifier {
  /**
   * Classify error and return appropriate user message
   */
  static classifyAndGetMessage(error: EmailServiceError): string {
    const errorType = error.type;
    const originalError = error.originalError;

    // Get specific error message based on error details
    switch (errorType) {
      case EmailErrorType.VALIDATION:
        return this.getValidationMessage(originalError);
      
      case EmailErrorType.NETWORK:
        return this.getNetworkMessage(originalError);
      
      case EmailErrorType.SMTP:
        return this.getSmtpMessage(originalError);
      
      case EmailErrorType.SERVER:
        return this.getServerMessage(originalError);
      
      case EmailErrorType.GENERIC:
      default:
        return ERROR_MESSAGES[EmailErrorType.GENERIC].generic;
    }
  }

  /**
   * Get specific validation error message
   */
  private static getValidationMessage(originalError: any): string {
    if (originalError?.response?.data?.errors) {
      const errors = originalError.response.data.errors;
      
      // Return first validation error message
      for (const field in errors) {
        if (errors[field] && errors[field].length > 0) {
          return errors[field][0];
        }
      }
    }
    
    return ERROR_MESSAGES[EmailErrorType.VALIDATION].generic;
  }

  /**
   * Get specific network error message
   */
  private static getNetworkMessage(originalError: any): string {
    if (originalError?.code === 'ECONNABORTED') {
      return ERROR_MESSAGES[EmailErrorType.NETWORK].timeout;
    }
    
    if (originalError?.code === 'NETWORK_ERROR') {
      return ERROR_MESSAGES[EmailErrorType.NETWORK].connection;
    }
    
    if (!navigator.onLine) {
      return ERROR_MESSAGES[EmailErrorType.NETWORK].offline;
    }
    
    return ERROR_MESSAGES[EmailErrorType.NETWORK].generic;
  }

  /**
   * Get specific SMTP error message
   */
  private static getSmtpMessage(originalError: any): string {
    const errorCode = originalError?.response?.data?.error_code;
    
    switch (errorCode) {
      case 'SMTP_AUTH_FAILED':
        return ERROR_MESSAGES[EmailErrorType.SMTP].authentication;
      case 'SMTP_CONNECTION_FAILED':
        return ERROR_MESSAGES[EmailErrorType.SMTP].connection;
      case 'SMTP_CONFIG_ERROR':
        return ERROR_MESSAGES[EmailErrorType.SMTP].configuration;
      default:
        return ERROR_MESSAGES[EmailErrorType.SMTP].generic;
    }
  }

  /**
   * Get specific server error message
   */
  private static getServerMessage(originalError: any): string {
    const status = originalError?.response?.status;
    
    switch (status) {
      case 503:
        return ERROR_MESSAGES[EmailErrorType.SERVER].maintenance;
      case 502:
      case 504:
        return ERROR_MESSAGES[EmailErrorType.SERVER].overload;
      case 500:
        return ERROR_MESSAGES[EmailErrorType.SERVER].internal;
      default:
        return ERROR_MESSAGES[EmailErrorType.SERVER].generic;
    }
  }

  /**
   * Check if error should trigger retry logic
   */
  static shouldRetry(error: EmailServiceError, currentAttempt: number, maxAttempts: number): boolean {
    if (currentAttempt >= maxAttempts) {
      return false;
    }

    // Only retry network and server errors
    return error.type === EmailErrorType.NETWORK || error.type === EmailErrorType.SERVER;
  }

  /**
   * Get retry delay based on attempt number (exponential backoff)
   */
  static getRetryDelay(attempt: number): number {
    const baseDelay = 1000; // 1 second
    const maxDelay = 10000; // 10 seconds
    
    const delay = baseDelay * Math.pow(2, attempt - 1);
    return Math.min(delay, maxDelay);
  }

  /**
   * Check if error is recoverable
   */
  static isRecoverable(error: EmailServiceError): boolean {
    switch (error.type) {
      case EmailErrorType.NETWORK:
      case EmailErrorType.SERVER:
        return true;
      case EmailErrorType.VALIDATION:
      case EmailErrorType.SMTP:
      case EmailErrorType.GENERIC:
      default:
        return false;
    }
  }
}

// Error logging utility
export class EmailErrorLogger {
  private static readonly LOG_PREFIX = '[EmailService]';

  /**
   * Log error with context information
   */
  static logError(error: EmailServiceError, context: {
    endpoint?: string;
    attempt?: number;
    maxAttempts?: number;
    formData?: any;
  }): void {
    const logData = {
      timestamp: new Date().toISOString(),
      errorType: error.type,
      message: error.message,
      statusCode: error.statusCode,
      context: this.sanitizeFormData(context),
      originalError: this.sanitizeError(error.originalError)
    };

    console.error(`${this.LOG_PREFIX} Error occurred:`, logData);

    // In production, you might want to send this to an error tracking service
    if (process.env.NODE_ENV === 'production') {
      this.sendToErrorTracking(logData);
    }
  }

  /**
   * Log successful operation
   */
  static logSuccess(context: {
    endpoint: string;
    duration?: number;
    formData?: any;
  }): void {
    const logData = {
      timestamp: new Date().toISOString(),
      status: 'success',
      context: this.sanitizeFormData(context)
    };

    console.log(`${this.LOG_PREFIX} Operation successful:`, logData);
  }

  /**
   * Log retry attempt
   */
  static logRetry(context: {
    endpoint: string;
    attempt: number;
    maxAttempts: number;
    delay: number;
    error: EmailServiceError;
  }): void {
    const logData = {
      timestamp: new Date().toISOString(),
      status: 'retry',
      context: {
        ...context,
        error: {
          type: context.error.type,
          message: context.error.message,
          statusCode: context.error.statusCode
        }
      }
    };

    console.warn(`${this.LOG_PREFIX} Retrying operation:`, logData);
  }

  /**
   * Sanitize error object for logging (remove sensitive data)
   */
  private static sanitizeError(error: any): any {
    if (!error) return null;

    const sanitized: any = {
      name: error.name,
      message: error.message,
      code: error.code
    };

    if (error.response) {
      sanitized.response = {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      };
    }

    return sanitized;
  }

  /**
   * Sanitize form data for logging (remove sensitive information)
   */
  private static sanitizeFormData(context: any): any {
    if (!context.formData) return context;

    const sanitized = { ...context };
    
    // Remove or mask sensitive fields
    if (sanitized.formData) {
      sanitized.formData = {
        ...sanitized.formData,
        email: sanitized.formData.email ? this.maskEmail(sanitized.formData.email) : undefined,
        // Keep other fields as they are not sensitive
        name: sanitized.formData.name,
        company: sanitized.formData.company,
        message: sanitized.formData.message ? '[message content]' : undefined,
        source: sanitized.formData.source,
        project_title: sanitized.formData.project_title
      };
    }

    return sanitized;
  }

  /**
   * Mask email address for logging
   */
  private static maskEmail(email: string): string {
    const [localPart, domain] = email.split('@');
    if (!domain) return '[invalid email]';
    
    const maskedLocal = localPart.length > 2 
      ? localPart.substring(0, 2) + '*'.repeat(localPart.length - 2)
      : '*'.repeat(localPart.length);
    
    return `${maskedLocal}@${domain}`;
  }

  /**
   * Send error data to error tracking service (placeholder)
   */
  private static sendToErrorTracking(logData: any): void {
    // Placeholder for error tracking service integration
    // In a real application, you would send this to services like:
    // - Sentry
    // - Bugsnag
    // - LogRocket
    // - Custom error tracking endpoint
    
    console.log('Would send to error tracking service:', logData);
  }
}

// Recovery strategies
export class EmailErrorRecovery {
  /**
   * Attempt to recover from error
   */
  static async attemptRecovery(error: EmailServiceError, context: {
    endpoint: string;
    formData: any;
    attempt: number;
  }): Promise<boolean> {
    switch (error.type) {
      case EmailErrorType.NETWORK:
        return this.recoverFromNetworkError(context);
      
      case EmailErrorType.SERVER:
        return this.recoverFromServerError(context);
      
      default:
        return false;
    }
  }

  /**
   * Recovery strategy for network errors
   */
  private static async recoverFromNetworkError(_context: any): Promise<boolean> {
    // Check if network is back online
    if (!navigator.onLine) {
      // Wait for network to come back
      return new Promise((resolve) => {
        const checkConnection = () => {
          if (navigator.onLine) {
            window.removeEventListener('online', checkConnection);
            resolve(true);
          }
        };
        
        window.addEventListener('online', checkConnection);
        
        // Timeout after 30 seconds
        setTimeout(() => {
          window.removeEventListener('online', checkConnection);
          resolve(false);
        }, 30000);
      });
    }
    
    return true; // Network appears to be available
  }

  /**
   * Recovery strategy for server errors
   */
  private static async recoverFromServerError(_context: any): Promise<boolean> {
    // For server errors, we can only wait and retry
    // In a more sophisticated implementation, you might:
    // - Check server status endpoint
    // - Use circuit breaker pattern
    // - Switch to backup endpoint
    
    return true; // Allow retry
  }
}

// Utility functions for UI components
export class EmailUIHelpers {
  /**
   * Get appropriate loading message for operation
   */
  static getLoadingMessage(_operation: 'contact' | 'project' | 'generic' = 'generic'): string {
    return LOADING_MESSAGES.sending;
  }

  /**
   * Get appropriate success message for operation
   */
  static getSuccessMessage(operation: 'contact' | 'project' | 'generic' = 'generic'): string {
    return SUCCESS_MESSAGES[operation] || SUCCESS_MESSAGES.generic;
  }

  /**
   * Format error for display in UI
   */
  static formatErrorForUI(error: EmailServiceError): {
    message: string;
    type: 'error' | 'warning' | 'info';
    recoverable: boolean;
  } {
    const message = EmailErrorClassifier.classifyAndGetMessage(error);
    const recoverable = EmailErrorClassifier.isRecoverable(error);
    
    let type: 'error' | 'warning' | 'info' = 'error';
    
    if (error.type === EmailErrorType.NETWORK && recoverable) {
      type = 'warning';
    }
    
    return {
      message,
      type,
      recoverable
    };
  }

  /**
   * Check if form should be cleared after error
   */
  static shouldClearFormAfterError(_error: EmailServiceError): boolean {
    // Only clear form after successful submission, never after errors
    return false;
  }

  /**
   * Get retry button text based on error type
   */
  static getRetryButtonText(error: EmailServiceError): string {
    switch (error.type) {
      case EmailErrorType.NETWORK:
        return 'Повторить попытку';
      case EmailErrorType.SERVER:
        return 'Попробовать снова';
      default:
        return 'Отправить заново';
    }
  }
}