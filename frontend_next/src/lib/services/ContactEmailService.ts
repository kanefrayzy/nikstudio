import axios from 'axios';

// Interface for contact form data
export interface ContactFormData {
  name: string;
  email: string;
  company: string;
  message: string;
  source?: 'project' | 'contact';
  project_title?: string;
}

// Interface for API response
export interface EmailApiResponse {
  success: boolean;
  message: string;
  data?: any;
  errors?: Record<string, string[]>;
  error_code?: string;
}

// Error types for classification
export enum EmailErrorType {
  VALIDATION = 'validation',
  NETWORK = 'network',
  SMTP = 'smtp',
  SERVER = 'server',
  GENERIC = 'generic'
}

// Custom error class for email operations
export class EmailServiceError extends Error {
  public type: EmailErrorType;
  public originalError?: any;
  public statusCode?: number;

  constructor(message: string, type: EmailErrorType, originalError?: any, statusCode?: number) {
    super(message);
    this.name = 'EmailServiceError';
    this.type = type;
    this.originalError = originalError;
    this.statusCode = statusCode;
  }
}

// Main service class
export class ContactEmailService {
  private static readonly API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  private static readonly TIMEOUT = 30000; // 30 seconds
  private static readonly RETRY_ATTEMPTS = 2;
  private static readonly RETRY_DELAY = 1000; // 1 second

  // Configure axios instance
  private static getAxiosInstance() {
    return axios.create({
      baseURL: this.API_BASE_URL,
      timeout: this.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
  }

  /**
   * Send contact email from collaboration form
   */
  static async sendContactEmail(data: ContactFormData): Promise<EmailApiResponse> {
    const payload = {
      ...data,
      source: 'contact'
    };

    return this.makeRequest('/api/contact/send', payload);
  }

  /**
   * Send project inquiry email from project detail page
   */
  static async sendProjectInquiry(data: ContactFormData): Promise<EmailApiResponse> {
    const payload = {
      ...data,
      source: 'project'
    };

    return this.makeRequest('/api/contact/project', payload);
  }

  /**
   * Make HTTP request with error handling and retry logic
   */
  private static async makeRequest(endpoint: string, data: any, attempt: number = 1): Promise<EmailApiResponse> {
    try {
      const axiosInstance = this.getAxiosInstance();
      const response = await axiosInstance.post<EmailApiResponse>(endpoint, data);
      
      // Log successful request for debugging
      console.log(`Email sent successfully to ${endpoint}`, {
        status: response.status,
        data: response.data
      });

      return response.data;
    } catch (error) {
      // Log error for debugging
      console.error(`Email request failed (attempt ${attempt}/${this.RETRY_ATTEMPTS + 1})`, {
        endpoint,
        error: (error as any)?.response ? {
          status: (error as any).response?.status,
          statusText: (error as any).response?.statusText,
          data: (error as any).response?.data,
          message: (error as any).message
        } : error
      });

      // Classify and handle the error
      const emailError = this.classifyError(error);

      // Retry logic for network errors
      if (emailError.type === EmailErrorType.NETWORK && attempt <= this.RETRY_ATTEMPTS) {
        console.log(`Retrying request in ${this.RETRY_DELAY}ms...`);
        await this.delay(this.RETRY_DELAY);
        return this.makeRequest(endpoint, data, attempt + 1);
      }

      throw emailError;
    }
  }

  /**
   * Classify error type based on error details
   */
  private static classifyError(error: any): EmailServiceError {
    if ((error as any)?.response) {
      const status = (error as any).response?.status;
      const responseData = (error as any).response?.data;

      // Validation errors (422)
      if (status === 422) {
        return new EmailServiceError(
          responseData?.message || 'Пожалуйста, исправьте ошибки в форме',
          EmailErrorType.VALIDATION,
          error,
          status
        );
      }

      // SMTP connection errors (specific error codes from backend)
      if (responseData?.error_code === 'SMTP_CONNECTION_FAILED') {
        return new EmailServiceError(
          'Ошибка подключения к почтовому серверу',
          EmailErrorType.SMTP,
          error,
          status
        );
      }

      // Server errors (5xx)
      if (status && status >= 500) {
        return new EmailServiceError(
          'Сервис временно недоступен, попробуйте позже',
          EmailErrorType.SERVER,
          error,
          status
        );
      }

      // Network errors (no response or timeout)
      if (!(error as any).response || (error as any).code === 'ECONNABORTED' || (error as any).code === 'NETWORK_ERROR') {
        return new EmailServiceError(
          'Проверьте подключение к интернету и попробуйте снова',
          EmailErrorType.NETWORK,
          error
        );
      }
    }

    // Generic error fallback
    return new EmailServiceError(
      'Произошла ошибка при отправке сообщения',
      EmailErrorType.GENERIC,
      error
    );
  }

  /**
   * Utility function for delays
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get user-friendly error message based on error type
   */
  static getErrorMessage(error: EmailServiceError): string {
    switch (error.type) {
      case EmailErrorType.VALIDATION:
        return error.message;
      case EmailErrorType.NETWORK:
        return 'Проверьте подключение к интернету и попробуйте снова';
      case EmailErrorType.SMTP:
        return 'Ошибка подключения к почтовому серверу';
      case EmailErrorType.SERVER:
        return 'Сервис временно недоступен, попробуйте позже';
      case EmailErrorType.GENERIC:
      default:
        return 'Произошла ошибка при отправке сообщения';
    }
  }

  /**
   * Check if error is retryable
   */
  static isRetryableError(error: EmailServiceError): boolean {
    return error.type === EmailErrorType.NETWORK || error.type === EmailErrorType.SERVER;
  }
}