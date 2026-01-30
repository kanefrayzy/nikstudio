import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  EmailErrorClassifier,
  EmailErrorLogger,
  EmailErrorRecovery,
  EmailUIHelpers,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  LOADING_MESSAGES
} from '../lib/services/EmailErrorHandler';
import { EmailServiceError, EmailErrorType } from '../lib/services/ContactEmailService';

describe('EmailErrorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('EmailErrorClassifier', () => {
    describe('classifyAndGetMessage', () => {
      it('should return validation error message', () => {
        const error = new EmailServiceError(
          'Validation failed',
          EmailErrorType.VALIDATION,
          {
            response: {
              data: {
                errors: {
                  email: ['Введите корректный email адрес']
                }
              }
            }
          }
        );

        const message = EmailErrorClassifier.classifyAndGetMessage(error);
        expect(message).toBe('Введите корректный email адрес');
      });

      it('should return generic validation message when no specific errors', () => {
        const error = new EmailServiceError(
          'Validation failed',
          EmailErrorType.VALIDATION
        );

        const message = EmailErrorClassifier.classifyAndGetMessage(error);
        expect(message).toBe(ERROR_MESSAGES[EmailErrorType.VALIDATION].generic);
      });

      it('should return timeout message for network timeout', () => {
        const error = new EmailServiceError(
          'Network error',
          EmailErrorType.NETWORK,
          { code: 'ECONNABORTED' }
        );

        const message = EmailErrorClassifier.classifyAndGetMessage(error);
        expect(message).toBe(ERROR_MESSAGES[EmailErrorType.NETWORK].timeout);
      });

      it('should return connection message for network error', () => {
        const error = new EmailServiceError(
          'Network error',
          EmailErrorType.NETWORK,
          { code: 'NETWORK_ERROR' }
        );

        const message = EmailErrorClassifier.classifyAndGetMessage(error);
        expect(message).toBe(ERROR_MESSAGES[EmailErrorType.NETWORK].connection);
      });

      it('should return offline message when navigator is offline', () => {
        // Mock navigator.onLine
        Object.defineProperty(navigator, 'onLine', {
          writable: true,
          value: false
        });

        const error = new EmailServiceError(
          'Network error',
          EmailErrorType.NETWORK
        );

        const message = EmailErrorClassifier.classifyAndGetMessage(error);
        expect(message).toBe(ERROR_MESSAGES[EmailErrorType.NETWORK].offline);

        // Restore navigator.onLine
        Object.defineProperty(navigator, 'onLine', {
          writable: true,
          value: true
        });
      });

      it('should return SMTP authentication error message', () => {
        const error = new EmailServiceError(
          'SMTP error',
          EmailErrorType.SMTP,
          {
            response: {
              data: {
                error_code: 'SMTP_AUTH_FAILED'
              }
            }
          }
        );

        const message = EmailErrorClassifier.classifyAndGetMessage(error);
        expect(message).toBe(ERROR_MESSAGES[EmailErrorType.SMTP].authentication);
      });

      it('should return server maintenance message for 503 status', () => {
        const error = new EmailServiceError(
          'Server error',
          EmailErrorType.SERVER,
          {
            response: {
              status: 503
            }
          }
        );

        const message = EmailErrorClassifier.classifyAndGetMessage(error);
        expect(message).toBe(ERROR_MESSAGES[EmailErrorType.SERVER].maintenance);
      });

      it('should return generic message for unknown errors', () => {
        const error = new EmailServiceError(
          'Unknown error',
          EmailErrorType.GENERIC
        );

        const message = EmailErrorClassifier.classifyAndGetMessage(error);
        expect(message).toBe(ERROR_MESSAGES[EmailErrorType.GENERIC].generic);
      });
    });

    describe('shouldRetry', () => {
      it('should return true for network errors within retry limit', () => {
        const error = new EmailServiceError('Network error', EmailErrorType.NETWORK);
        expect(EmailErrorClassifier.shouldRetry(error, 1, 3)).toBe(true);
      });

      it('should return true for server errors within retry limit', () => {
        const error = new EmailServiceError('Server error', EmailErrorType.SERVER);
        expect(EmailErrorClassifier.shouldRetry(error, 2, 3)).toBe(true);
      });

      it('should return false when max attempts reached', () => {
        const error = new EmailServiceError('Network error', EmailErrorType.NETWORK);
        expect(EmailErrorClassifier.shouldRetry(error, 3, 3)).toBe(false);
      });

      it('should return false for validation errors', () => {
        const error = new EmailServiceError('Validation error', EmailErrorType.VALIDATION);
        expect(EmailErrorClassifier.shouldRetry(error, 1, 3)).toBe(false);
      });

      it('should return false for SMTP errors', () => {
        const error = new EmailServiceError('SMTP error', EmailErrorType.SMTP);
        expect(EmailErrorClassifier.shouldRetry(error, 1, 3)).toBe(false);
      });
    });

    describe('getRetryDelay', () => {
      it('should return exponential backoff delays', () => {
        expect(EmailErrorClassifier.getRetryDelay(1)).toBe(1000);
        expect(EmailErrorClassifier.getRetryDelay(2)).toBe(2000);
        expect(EmailErrorClassifier.getRetryDelay(3)).toBe(4000);
        expect(EmailErrorClassifier.getRetryDelay(4)).toBe(8000);
      });

      it('should cap delay at maximum value', () => {
        expect(EmailErrorClassifier.getRetryDelay(10)).toBe(10000);
        expect(EmailErrorClassifier.getRetryDelay(20)).toBe(10000);
      });
    });

    describe('isRecoverable', () => {
      it('should return true for network errors', () => {
        const error = new EmailServiceError('Network error', EmailErrorType.NETWORK);
        expect(EmailErrorClassifier.isRecoverable(error)).toBe(true);
      });

      it('should return true for server errors', () => {
        const error = new EmailServiceError('Server error', EmailErrorType.SERVER);
        expect(EmailErrorClassifier.isRecoverable(error)).toBe(true);
      });

      it('should return false for validation errors', () => {
        const error = new EmailServiceError('Validation error', EmailErrorType.VALIDATION);
        expect(EmailErrorClassifier.isRecoverable(error)).toBe(false);
      });

      it('should return false for SMTP errors', () => {
        const error = new EmailServiceError('SMTP error', EmailErrorType.SMTP);
        expect(EmailErrorClassifier.isRecoverable(error)).toBe(false);
      });
    });
  });

  describe('EmailErrorLogger', () => {
    let consoleSpy: any;

    beforeEach(() => {
      consoleSpy = {
        error: vi.spyOn(console, 'error').mockImplementation(() => {}),
        log: vi.spyOn(console, 'log').mockImplementation(() => {}),
        warn: vi.spyOn(console, 'warn').mockImplementation(() => {})
      };
    });

    afterEach(() => {
      consoleSpy.error.mockRestore();
      consoleSpy.log.mockRestore();
      consoleSpy.warn.mockRestore();
    });

    describe('logError', () => {
      it('should log error with context', () => {
        const error = new EmailServiceError('Test error', EmailErrorType.NETWORK);
        const context = {
          endpoint: '/api/contact/send',
          attempt: 1,
          maxAttempts: 3
        };

        EmailErrorLogger.logError(error, context);

        expect(consoleSpy.error).toHaveBeenCalledWith(
          expect.stringContaining('[EmailService] Error occurred:'),
          expect.objectContaining({
            errorType: EmailErrorType.NETWORK,
            message: 'Test error',
            context
          })
        );
      });

      it('should sanitize form data in context', () => {
        const error = new EmailServiceError('Test error', EmailErrorType.VALIDATION);
        const context = {
          endpoint: '/api/contact/send',
          formData: {
            name: 'Иван Петров',
            email: 'ivan@example.com',
            message: 'Секретное сообщение'
          }
        };

        EmailErrorLogger.logError(error, context);

        const logCall = consoleSpy.error.mock.calls[0];
        const logData = logCall[1];
        
        expect(logData.context.formData.email).toBe('iv**@example.com');
        expect(logData.context.formData.message).toBe('[message content]');
        expect(logData.context.formData.name).toBe('Иван Петров');
      });
    });

    describe('logSuccess', () => {
      it('should log successful operation', () => {
        const context = {
          endpoint: '/api/contact/send',
          duration: 1500
        };

        EmailErrorLogger.logSuccess(context);

        expect(consoleSpy.log).toHaveBeenCalledWith(
          expect.stringContaining('[EmailService] Operation successful:'),
          expect.objectContaining({
            status: 'success',
            context
          })
        );
      });
    });

    describe('logRetry', () => {
      it('should log retry attempt', () => {
        const error = new EmailServiceError('Network error', EmailErrorType.NETWORK);
        const context = {
          endpoint: '/api/contact/send',
          attempt: 2,
          maxAttempts: 3,
          delay: 2000,
          error
        };

        EmailErrorLogger.logRetry(context);

        expect(consoleSpy.warn).toHaveBeenCalledWith(
          expect.stringContaining('[EmailService] Retrying operation:'),
          expect.objectContaining({
            status: 'retry',
            context: expect.objectContaining({
              attempt: 2,
              maxAttempts: 3,
              delay: 2000
            })
          })
        );
      });
    });
  });

  describe('EmailErrorRecovery', () => {
    describe('attemptRecovery', () => {
      it('should return true for network errors when online', async () => {
        Object.defineProperty(navigator, 'onLine', {
          writable: true,
          value: true
        });

        const error = new EmailServiceError('Network error', EmailErrorType.NETWORK);
        const context = {
          endpoint: '/api/contact/send',
          formData: {},
          attempt: 1
        };

        const result = await EmailErrorRecovery.attemptRecovery(error, context);
        expect(result).toBe(true);
      });

      it('should return true for server errors', async () => {
        const error = new EmailServiceError('Server error', EmailErrorType.SERVER);
        const context = {
          endpoint: '/api/contact/send',
          formData: {},
          attempt: 1
        };

        const result = await EmailErrorRecovery.attemptRecovery(error, context);
        expect(result).toBe(true);
      });

      it('should return false for non-recoverable errors', async () => {
        const error = new EmailServiceError('Validation error', EmailErrorType.VALIDATION);
        const context = {
          endpoint: '/api/contact/send',
          formData: {},
          attempt: 1
        };

        const result = await EmailErrorRecovery.attemptRecovery(error, context);
        expect(result).toBe(false);
      });
    });
  });

  describe('EmailUIHelpers', () => {
    describe('getLoadingMessage', () => {
      it('should return sending message', () => {
        expect(EmailUIHelpers.getLoadingMessage('contact')).toBe(LOADING_MESSAGES.sending);
        expect(EmailUIHelpers.getLoadingMessage('project')).toBe(LOADING_MESSAGES.sending);
        expect(EmailUIHelpers.getLoadingMessage()).toBe(LOADING_MESSAGES.sending);
      });
    });

    describe('getSuccessMessage', () => {
      it('should return appropriate success messages', () => {
        expect(EmailUIHelpers.getSuccessMessage('contact')).toBe(SUCCESS_MESSAGES.contact);
        expect(EmailUIHelpers.getSuccessMessage('project')).toBe(SUCCESS_MESSAGES.project);
        expect(EmailUIHelpers.getSuccessMessage()).toBe(SUCCESS_MESSAGES.generic);
      });
    });

    describe('formatErrorForUI', () => {
      it('should format network error as warning when recoverable', () => {
        const error = new EmailServiceError('Network error', EmailErrorType.NETWORK);
        const formatted = EmailUIHelpers.formatErrorForUI(error);

        expect(formatted.type).toBe('warning');
        expect(formatted.recoverable).toBe(true);
        expect(formatted.message).toBe(ERROR_MESSAGES[EmailErrorType.NETWORK].generic);
      });

      it('should format validation error as error', () => {
        const error = new EmailServiceError('Validation error', EmailErrorType.VALIDATION);
        const formatted = EmailUIHelpers.formatErrorForUI(error);

        expect(formatted.type).toBe('error');
        expect(formatted.recoverable).toBe(false);
      });
    });

    describe('shouldClearFormAfterError', () => {
      it('should never clear form after error', () => {
        const error = new EmailServiceError('Any error', EmailErrorType.NETWORK);
        expect(EmailUIHelpers.shouldClearFormAfterError(error)).toBe(false);
      });
    });

    describe('getRetryButtonText', () => {
      it('should return appropriate retry button text', () => {
        const networkError = new EmailServiceError('Network error', EmailErrorType.NETWORK);
        const serverError = new EmailServiceError('Server error', EmailErrorType.SERVER);
        const validationError = new EmailServiceError('Validation error', EmailErrorType.VALIDATION);

        expect(EmailUIHelpers.getRetryButtonText(networkError)).toBe('Повторить попытку');
        expect(EmailUIHelpers.getRetryButtonText(serverError)).toBe('Попробовать снова');
        expect(EmailUIHelpers.getRetryButtonText(validationError)).toBe('Отправить заново');
      });
    });
  });

  describe('Constants', () => {
    it('should have all required error messages', () => {
      expect(ERROR_MESSAGES[EmailErrorType.VALIDATION]).toBeDefined();
      expect(ERROR_MESSAGES[EmailErrorType.NETWORK]).toBeDefined();
      expect(ERROR_MESSAGES[EmailErrorType.SMTP]).toBeDefined();
      expect(ERROR_MESSAGES[EmailErrorType.SERVER]).toBeDefined();
      expect(ERROR_MESSAGES[EmailErrorType.GENERIC]).toBeDefined();
    });

    it('should have all required success messages', () => {
      expect(SUCCESS_MESSAGES.contact).toBeDefined();
      expect(SUCCESS_MESSAGES.project).toBeDefined();
      expect(SUCCESS_MESSAGES.generic).toBeDefined();
    });

    it('should have all required loading messages', () => {
      expect(LOADING_MESSAGES.sending).toBeDefined();
      expect(LOADING_MESSAGES.processing).toBeDefined();
      expect(LOADING_MESSAGES.connecting).toBeDefined();
    });

    it('should have all messages in Russian', () => {
      // Check that all messages contain Cyrillic characters (Russian)
      const allMessages = [
        ...Object.values(ERROR_MESSAGES).flatMap(category => Object.values(category)),
        ...Object.values(SUCCESS_MESSAGES),
        ...Object.values(LOADING_MESSAGES)
      ];

      allMessages.forEach(message => {
        expect(message).toMatch(/[а-яё]/i); // Contains Cyrillic characters
      });
    });
  });
});