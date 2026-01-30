import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios, { AxiosError } from 'axios';
import { 
  ContactEmailService, 
  EmailServiceError, 
  EmailErrorType, 
  ContactFormData,
  EmailApiResponse 
} from '../lib/services/ContactEmailService';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

describe('ContactEmailService', () => {
  const mockFormData: ContactFormData = {
    name: 'Иван Петров',
    email: 'ivan@example.com',
    company: 'ООО Тест',
    message: 'Тестовое сообщение для проверки функциональности'
  };

  const mockSuccessResponse: EmailApiResponse = {
    success: true,
    message: 'Сообщение успешно отправлено!',
    data: { id: 1 }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('sendContactEmail', () => {
    it('should send contact email successfully', async () => {
      const mockPost = vi.fn().mockResolvedValue({ data: mockSuccessResponse });
      mockedAxios.create = vi.fn().mockReturnValue({ post: mockPost });

      const result = await ContactEmailService.sendContactEmail(mockFormData);

      expect(mockPost).toHaveBeenCalledWith('/api/contact/send', {
        ...mockFormData,
        source: 'contact'
      });
      expect(result).toEqual(mockSuccessResponse);
    });

    it('should handle validation errors (422)', async () => {
      const validationError = new AxiosError('Validation failed');
      validationError.response = {
        status: 422,
        statusText: 'Unprocessable Entity',
        data: {
          success: false,
          message: 'Пожалуйста, исправьте ошибки в форме',
          errors: {
            email: ['Введите корректный email адрес']
          }
        },
        headers: {},
        config: {} as any
      };

      const mockPost = vi.fn().mockRejectedValue(validationError);
      mockedAxios.create = vi.fn().mockReturnValue({ post: mockPost });

      await expect(ContactEmailService.sendContactEmail(mockFormData))
        .rejects.toThrow(EmailServiceError);

      try {
        await ContactEmailService.sendContactEmail(mockFormData);
      } catch (error) {
        expect(error).toBeInstanceOf(EmailServiceError);
        expect((error as EmailServiceError).type).toBe(EmailErrorType.VALIDATION);
        expect((error as EmailServiceError).statusCode).toBe(422);
      }
    });

    it('should handle SMTP connection errors', async () => {
      const smtpError = new AxiosError('SMTP connection failed');
      smtpError.response = {
        status: 500,
        statusText: 'Internal Server Error',
        data: {
          success: false,
          message: 'Email sending failed',
          error_code: 'SMTP_CONNECTION_FAILED'
        },
        headers: {},
        config: {} as any
      };

      const mockPost = vi.fn().mockRejectedValue(smtpError);
      mockedAxios.create = vi.fn().mockReturnValue({ post: mockPost });

      await expect(ContactEmailService.sendContactEmail(mockFormData))
        .rejects.toThrow(EmailServiceError);

      try {
        await ContactEmailService.sendContactEmail(mockFormData);
      } catch (error) {
        expect(error).toBeInstanceOf(EmailServiceError);
        expect((error as EmailServiceError).type).toBe(EmailErrorType.SMTP);
        expect((error as EmailServiceError).message).toBe('Ошибка подключения к почтовому серверу');
      }
    });

    it('should handle network errors with retry', async () => {
      const networkError = new AxiosError('Network Error');
      networkError.code = 'NETWORK_ERROR';

      const mockPost = vi.fn()
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValue({ data: mockSuccessResponse });

      mockedAxios.create = vi.fn().mockReturnValue({ post: mockPost });

      // Mock delay function to avoid actual delays in tests
      const originalDelay = (ContactEmailService as any).delay;
      (ContactEmailService as any).delay = vi.fn().mockResolvedValue(undefined);

      const result = await ContactEmailService.sendContactEmail(mockFormData);

      expect(mockPost).toHaveBeenCalledTimes(3); // Initial + 2 retries
      expect(result).toEqual(mockSuccessResponse);

      // Restore original delay function
      (ContactEmailService as any).delay = originalDelay;
    });

    it('should fail after maximum retry attempts', async () => {
      const networkError = new AxiosError('Network Error');
      networkError.code = 'NETWORK_ERROR';

      const mockPost = vi.fn().mockRejectedValue(networkError);
      mockedAxios.create = vi.fn().mockReturnValue({ post: mockPost });

      // Mock delay function
      (ContactEmailService as any).delay = vi.fn().mockResolvedValue(undefined);

      await expect(ContactEmailService.sendContactEmail(mockFormData))
        .rejects.toThrow(EmailServiceError);

      expect(mockPost).toHaveBeenCalledTimes(3); // Initial + 2 retries

      try {
        await ContactEmailService.sendContactEmail(mockFormData);
      } catch (error) {
        expect(error).toBeInstanceOf(EmailServiceError);
        expect((error as EmailServiceError).type).toBe(EmailErrorType.NETWORK);
      }
    });

    it('should handle server errors (5xx)', async () => {
      const serverError = new AxiosError('Internal Server Error');
      serverError.response = {
        status: 500,
        statusText: 'Internal Server Error',
        data: {
          success: false,
          message: 'Server error occurred'
        },
        headers: {},
        config: {} as any
      };

      const mockPost = vi.fn().mockRejectedValue(serverError);
      mockedAxios.create = vi.fn().mockReturnValue({ post: mockPost });

      await expect(ContactEmailService.sendContactEmail(mockFormData))
        .rejects.toThrow(EmailServiceError);

      try {
        await ContactEmailService.sendContactEmail(mockFormData);
      } catch (error) {
        expect(error).toBeInstanceOf(EmailServiceError);
        expect((error as EmailServiceError).type).toBe(EmailErrorType.SERVER);
        expect((error as EmailServiceError).message).toBe('Сервис временно недоступен, попробуйте позже');
      }
    });
  });

  describe('sendProjectInquiry', () => {
    it('should send project inquiry email successfully', async () => {
      const projectData = {
        ...mockFormData,
        project_title: 'Тестовый проект'
      };

      const mockPost = vi.fn().mockResolvedValue({ data: mockSuccessResponse });
      mockedAxios.create = vi.fn().mockReturnValue({ post: mockPost });

      const result = await ContactEmailService.sendProjectInquiry(projectData);

      expect(mockPost).toHaveBeenCalledWith('/api/contact/project', {
        ...projectData,
        source: 'project'
      });
      expect(result).toEqual(mockSuccessResponse);
    });

    it('should handle project inquiry without project title', async () => {
      const mockPost = vi.fn().mockResolvedValue({ data: mockSuccessResponse });
      mockedAxios.create = vi.fn().mockReturnValue({ post: mockPost });

      const result = await ContactEmailService.sendProjectInquiry(mockFormData);

      expect(mockPost).toHaveBeenCalledWith('/api/contact/project', {
        ...mockFormData,
        source: 'project'
      });
      expect(result).toEqual(mockSuccessResponse);
    });
  });

  describe('Error handling utilities', () => {
    it('should return correct error messages for different error types', () => {
      const validationError = new EmailServiceError('Validation failed', EmailErrorType.VALIDATION);
      const networkError = new EmailServiceError('Network failed', EmailErrorType.NETWORK);
      const smtpError = new EmailServiceError('SMTP failed', EmailErrorType.SMTP);
      const serverError = new EmailServiceError('Server failed', EmailErrorType.SERVER);
      const genericError = new EmailServiceError('Generic failed', EmailErrorType.GENERIC);

      expect(ContactEmailService.getErrorMessage(validationError)).toBe('Validation failed');
      expect(ContactEmailService.getErrorMessage(networkError)).toBe('Проверьте подключение к интернету и попробуйте снова');
      expect(ContactEmailService.getErrorMessage(smtpError)).toBe('Ошибка подключения к почтовому серверу');
      expect(ContactEmailService.getErrorMessage(serverError)).toBe('Сервис временно недоступен, попробуйте позже');
      expect(ContactEmailService.getErrorMessage(genericError)).toBe('Произошла ошибка при отправке сообщения');
    });

    it('should correctly identify retryable errors', () => {
      const networkError = new EmailServiceError('Network failed', EmailErrorType.NETWORK);
      const serverError = new EmailServiceError('Server failed', EmailErrorType.SERVER);
      const validationError = new EmailServiceError('Validation failed', EmailErrorType.VALIDATION);
      const smtpError = new EmailServiceError('SMTP failed', EmailErrorType.SMTP);

      expect(ContactEmailService.isRetryableError(networkError)).toBe(true);
      expect(ContactEmailService.isRetryableError(serverError)).toBe(true);
      expect(ContactEmailService.isRetryableError(validationError)).toBe(false);
      expect(ContactEmailService.isRetryableError(smtpError)).toBe(false);
    });
  });

  describe('Error classification', () => {
    it('should classify timeout errors as network errors', async () => {
      const timeoutError = new AxiosError('Timeout');
      timeoutError.code = 'ECONNABORTED';

      const mockPost = vi.fn().mockRejectedValue(timeoutError);
      mockedAxios.create = vi.fn().mockReturnValue({ post: mockPost });

      try {
        await ContactEmailService.sendContactEmail(mockFormData);
      } catch (error) {
        expect(error).toBeInstanceOf(EmailServiceError);
        expect((error as EmailServiceError).type).toBe(EmailErrorType.NETWORK);
      }
    });

    it('should classify unknown errors as generic errors', async () => {
      const unknownError = new Error('Unknown error');

      const mockPost = vi.fn().mockRejectedValue(unknownError);
      mockedAxios.create = vi.fn().mockReturnValue({ post: mockPost });

      try {
        await ContactEmailService.sendContactEmail(mockFormData);
      } catch (error) {
        expect(error).toBeInstanceOf(EmailServiceError);
        expect((error as EmailServiceError).type).toBe(EmailErrorType.GENERIC);
      }
    });
  });

  describe('Logging', () => {
    it('should log successful requests', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const mockPost = vi.fn().mockResolvedValue({ 
        data: mockSuccessResponse,
        status: 200 
      });
      mockedAxios.create = vi.fn().mockReturnValue({ post: mockPost });

      await ContactEmailService.sendContactEmail(mockFormData);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Email sent successfully'),
        expect.objectContaining({
          status: 200,
          data: mockSuccessResponse
        })
      );

      consoleSpy.mockRestore();
    });

    it('should log failed requests', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const networkError = new AxiosError('Network Error');
      networkError.code = 'NETWORK_ERROR';

      const mockPost = vi.fn().mockRejectedValue(networkError);
      mockedAxios.create = vi.fn().mockReturnValue({ post: mockPost });

      // Mock delay to avoid actual delays
      (ContactEmailService as any).delay = vi.fn().mockResolvedValue(undefined);

      try {
        await ContactEmailService.sendContactEmail(mockFormData);
      } catch {
        // Expected to throw
      }

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Email request failed'),
        expect.objectContaining({
          endpoint: '/api/contact/send'
        })
      );

      consoleSpy.mockRestore();
    });
  });
});