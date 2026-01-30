// Email service exports
export {
  ContactEmailService,
  EmailServiceError,
  EmailErrorType,
  type ContactFormData,
  type EmailApiResponse
} from './ContactEmailService';

export {
  EmailErrorClassifier,
  EmailErrorLogger,
  EmailErrorRecovery,
  EmailUIHelpers,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  LOADING_MESSAGES
} from './EmailErrorHandler';