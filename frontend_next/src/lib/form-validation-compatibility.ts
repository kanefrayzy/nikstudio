/**
 * Form Validation Compatibility System
 * 
 * Provides cross-browser form validation with HTML5 polyfills and fallbacks
 * for older browsers that don't support modern form validation features.
 */

import { browserDetectionService } from './browser-detection';

export interface ValidationRule {
  required?: boolean;
  pattern?: string | RegExp;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  step?: number;
  type?: 'email' | 'url' | 'number' | 'tel' | 'text';
  custom?: (value: string) => string | null;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface FormValidationOptions {
  showNativeMessages?: boolean;
  customMessageContainer?: HTMLElement;
  validateOnInput?: boolean;
  validateOnBlur?: boolean;
  highlightInvalidFields?: boolean;
}

/**
 * Cross-browser form validation service
 */
class FormValidationCompatibilityService {
  private supportedInputTypes: Set<string> = new Set();
  private validationMessageContainer: WeakMap<HTMLElement, HTMLElement> = new WeakMap();
  private validationRules: WeakMap<HTMLElement, ValidationRule> = new WeakMap();
  private formOptions: WeakMap<HTMLFormElement, FormValidationOptions> = new WeakMap();

  constructor() {
    this.detectInputTypeSupport();
    this.setupGlobalStyles();
  }

  /**
   * Detect which HTML5 input types are supported by the browser
   */
  private detectInputTypeSupport(): void {
    if (typeof window === 'undefined') return;

    const testInput = document.createElement('input');
    const inputTypes = ['email', 'url', 'number', 'tel', 'date', 'time', 'color', 'range'];

    inputTypes.forEach(type => {
      testInput.type = type;
      if (testInput.type === type) {
        this.supportedInputTypes.add(type);
      }
    });
  }

  /**
   * Setup global CSS for validation styling
   */
  private setupGlobalStyles(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const styleId = 'form-validation-compatibility-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* Cross-browser validation styles */
      .form-validation-error {
        border-color: #ef4444 !important;
        box-shadow: 0 0 0 1px #ef4444 !important;
      }
      
      .form-validation-success {
        border-color: #10b981 !important;
        box-shadow: 0 0 0 1px #10b981 !important;
      }
      
      .form-validation-message {
        display: block;
        margin-top: 4px;
        font-size: 0.875rem;
        line-height: 1.25rem;
      }
      
      .form-validation-error-message {
        color: #ef4444;
      }
      
      .form-validation-warning-message {
        color: #f59e0b;
      }
      
      .form-validation-success-message {
        color: #10b981;
      }
      
      /* Input type fallback styles */
      .input-type-fallback {
        position: relative;
      }
      
      .input-type-fallback::after {
        content: attr(data-fallback-hint);
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 0.75rem;
        color: #6b7280;
        pointer-events: none;
      }
      
      /* Custom validation message container */
      .custom-validation-container {
        position: relative;
      }
      
      .custom-validation-message {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        z-index: 10;
        background: white;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        padding: 8px;
        margin-top: 2px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      }
      
      /* Dark mode support */
      @media (prefers-color-scheme: dark) {
        .custom-validation-message {
          background: #1f2937;
          border-color: #374151;
          color: #f9fafb;
        }
      }
    `;
    
    document.head.appendChild(style);
  }

  /**
   * Initialize form validation for a form element
   */
  initializeForm(form: HTMLFormElement, options: FormValidationOptions = {}): void {
    const defaultOptions: FormValidationOptions = {
      showNativeMessages: false,
      validateOnInput: true,
      validateOnBlur: true,
      highlightInvalidFields: true,
      ...options
    };

    this.formOptions.set(form, defaultOptions);

    // Disable native validation if we're using custom validation
    if (!defaultOptions.showNativeMessages) {
      form.setAttribute('novalidate', '');
    }

    // Setup form submission validation
    form.addEventListener('submit', (e) => {
      if (!this.validateForm(form)) {
        e.preventDefault();
        e.stopPropagation();
      }
    });

    // Setup input validation listeners
    const inputs = form.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement || input instanceof HTMLSelectElement) {
        this.initializeInput(input, defaultOptions);
      }
    });
  }

  /**
   * Initialize validation for a single input element
   */
  initializeInput(input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, options: FormValidationOptions): void {
    // Apply input type fallbacks
    if (input instanceof HTMLInputElement) {
      this.applyInputTypeFallback(input);
    }

    // Setup validation listeners
    if (options.validateOnInput) {
      input.addEventListener('input', () => {
        this.validateInput(input, options);
      });
    }

    if (options.validateOnBlur) {
      input.addEventListener('blur', () => {
        this.validateInput(input, options);
      });
    }

    // Setup custom validation message container
    this.setupValidationMessageContainer(input);
  }

  /**
   * Apply input type fallbacks for unsupported types
   */
  private applyInputTypeFallback(input: HTMLInputElement): void {
    const originalType = input.type;
    
    if (!this.supportedInputTypes.has(originalType)) {
      // Store original type for validation
      input.dataset.originalType = originalType;
      
      switch (originalType) {
        case 'email':
          input.type = 'text';
          input.dataset.fallbackHint = '@';
          input.placeholder = input.placeholder || 'example@domain.com';
          break;
          
        case 'url':
          input.type = 'text';
          input.dataset.fallbackHint = 'http://';
          input.placeholder = input.placeholder || 'https://example.com';
          break;
          
        case 'number':
          input.type = 'text';
          input.dataset.fallbackHint = '123';
          input.inputMode = 'numeric';
          break;
          
        case 'tel':
          input.type = 'text';
          input.dataset.fallbackHint = '📞';
          input.inputMode = 'tel';
          break;
      }
      
      input.classList.add('input-type-fallback');
    }
  }

  /**
   * Setup validation message container for an input
   */
  private setupValidationMessageContainer(input: HTMLElement): void {
    const container = document.createElement('div');
    container.className = 'form-validation-message';
    container.style.display = 'none';
    
    // Insert after the input
    if (input.parentNode) {
      input.parentNode.insertBefore(container, input.nextSibling);
      this.validationMessageContainer.set(input, container);
    }
  }

  /**
   * Set validation rules for an input
   */
  setValidationRules(input: HTMLElement, rules: ValidationRule): void {
    this.validationRules.set(input, rules);
  }

  /**
   * Validate a single input element
   */
  validateInput(input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, options?: FormValidationOptions): ValidationResult {
    const rules = this.validationRules.get(input) || this.extractRulesFromAttributes(input);
    const value = input.value;
    const result = this.validateValue(value, rules, input);

    // Update UI based on validation result
    this.updateInputValidationUI(input, result, options);

    return result;
  }

  /**
   * Validate entire form
   */
  validateForm(form: HTMLFormElement): boolean {
    const options = this.formOptions.get(form);
    let isFormValid = true;

    const inputs = form.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement || input instanceof HTMLSelectElement) {
        const result = this.validateInput(input, options);
        if (!result.isValid) {
          isFormValid = false;
        }
      }
    });

    return isFormValid;
  }

  /**
   * Extract validation rules from HTML attributes
   */
  private extractRulesFromAttributes(input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): ValidationRule {
    const rules: ValidationRule = {};

    if (input.hasAttribute('required')) {
      rules.required = true;
    }

    if (input instanceof HTMLInputElement) {
      const originalType = input.dataset.originalType || input.type;
      rules.type = originalType as ValidationRule['type'];

      if (input.hasAttribute('pattern')) {
        rules.pattern = input.getAttribute('pattern') || '';
      }

      if (input.hasAttribute('minlength')) {
        rules.minLength = parseInt(input.getAttribute('minlength') || '0');
      }

      if (input.hasAttribute('maxlength')) {
        rules.maxLength = parseInt(input.getAttribute('maxlength') || '0');
      }

      if (input.hasAttribute('min')) {
        rules.min = parseFloat(input.getAttribute('min') || '0');
      }

      if (input.hasAttribute('max')) {
        rules.max = parseFloat(input.getAttribute('max') || '0');
      }

      if (input.hasAttribute('step')) {
        rules.step = parseFloat(input.getAttribute('step') || '1');
      }
    }

    return rules;
  }

  /**
   * Validate a value against rules
   */
  private validateValue(value: string, rules: ValidationRule, _input?: HTMLElement): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required validation
    if (rules.required && (!value || value.trim() === '')) {
      errors.push('Это поле обязательно для заполнения');
    }

    // Skip other validations if value is empty and not required
    if (!value && !rules.required) {
      return { isValid: true, errors: [], warnings: [] };
    }

    // Type-specific validation
    if (rules.type && value) {
      switch (rules.type) {
        case 'email':
          if (!this.isValidEmail(value)) {
            errors.push('Введите корректный email адрес');
          }
          break;
          
        case 'url':
          if (!this.isValidUrl(value)) {
            errors.push('Введите корректный URL адрес');
          }
          break;
          
        case 'number':
          if (!this.isValidNumber(value)) {
            errors.push('Введите корректное число');
          } else {
            const numValue = parseFloat(value);
            if (rules.min !== undefined && numValue < rules.min) {
              errors.push(`Значение должно быть не менее ${rules.min}`);
            }
            if (rules.max !== undefined && numValue > rules.max) {
              errors.push(`Значение должно быть не более ${rules.max}`);
            }
            if (rules.step !== undefined && (numValue % rules.step) !== 0) {
              errors.push(`Значение должно быть кратно ${rules.step}`);
            }
          }
          break;
          
        case 'tel':
          if (!this.isValidPhone(value)) {
            warnings.push('Проверьте правильность номера телефона');
          }
          break;
      }
    }

    // Pattern validation
    if (rules.pattern && value) {
      const pattern = typeof rules.pattern === 'string' ? new RegExp(rules.pattern) : rules.pattern;
      if (!pattern.test(value)) {
        errors.push('Значение не соответствует требуемому формату');
      }
    }

    // Length validation
    if (rules.minLength && value.length < rules.minLength) {
      errors.push(`Минимальная длина: ${rules.minLength} символов`);
    }

    if (rules.maxLength && value.length > rules.maxLength) {
      errors.push(`Максимальная длина: ${rules.maxLength} символов`);
    }

    // Custom validation
    if (rules.custom && value) {
      const customError = rules.custom(value);
      if (customError) {
        errors.push(customError);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Update input validation UI
   */
  private updateInputValidationUI(input: HTMLElement, result: ValidationResult, options?: FormValidationOptions): void {
    const messageContainer = this.validationMessageContainer.get(input);
    
    // Remove existing validation classes
    input.classList.remove('form-validation-error', 'form-validation-success');
    
    if (options?.highlightInvalidFields) {
      if (result.isValid) {
        input.classList.add('form-validation-success');
      } else {
        input.classList.add('form-validation-error');
      }
    }

    // Update validation message
    if (messageContainer) {
      messageContainer.innerHTML = '';
      messageContainer.style.display = 'none';

      if (result.errors.length > 0 || result.warnings.length > 0) {
        messageContainer.style.display = 'block';
        
        result.errors.forEach(error => {
          const errorDiv = document.createElement('div');
          errorDiv.className = 'form-validation-error-message';
          errorDiv.textContent = error;
          messageContainer.appendChild(errorDiv);
        });

        result.warnings.forEach(warning => {
          const warningDiv = document.createElement('div');
          warningDiv.className = 'form-validation-warning-message';
          warningDiv.textContent = warning;
          messageContainer.appendChild(warningDiv);
        });
      }
    }
  }

  /**
   * Email validation
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * URL validation
   */
  private isValidUrl(url: string): boolean {
    // Basic validation - must contain at least a dot and some text
    if (!url || url.length < 4 || !/\w+\.\w+/.test(url)) {
      return false;
    }

    try {
      new URL(url);
      return true;
    } catch {
      // Try with http:// prefix
      try {
        new URL('http://' + url);
        return true;
      } catch {
        return false;
      }
    }
  }

  /**
   * Number validation
   */
  private isValidNumber(value: string): boolean {
    return !isNaN(parseFloat(value)) && isFinite(parseFloat(value));
  }

  /**
   * Phone validation (basic)
   */
  private isValidPhone(phone: string): boolean {
    // Basic phone validation - at least 10 digits
    const phoneRegex = /[\d\s\-\+\(\)]{10,}/;
    return phoneRegex.test(phone);
  }

  /**
   * Get browser validation capabilities
   */
  getValidationCapabilities(): {
    nativeValidation: boolean;
    supportedInputTypes: string[];
    constraintValidation: boolean;
  } {
    const _browserInfo = browserDetectionService.getBrowserInfo();
    
    return {
      nativeValidation: 'checkValidity' in document.createElement('input'),
      supportedInputTypes: Array.from(this.supportedInputTypes),
      constraintValidation: 'validity' in document.createElement('input')
    };
  }

  /**
   * Clear validation state for an input
   */
  clearValidation(input: HTMLElement): void {
    input.classList.remove('form-validation-error', 'form-validation-success');
    const messageContainer = this.validationMessageContainer.get(input);
    if (messageContainer) {
      messageContainer.style.display = 'none';
      messageContainer.innerHTML = '';
    }
  }

  /**
   * Clear validation state for entire form
   */
  clearFormValidation(form: HTMLFormElement): void {
    const inputs = form.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      this.clearValidation(input as HTMLElement);
    });
  }
}

// Export singleton instance
export const formValidationService = new FormValidationCompatibilityService();

// Export utility functions for React components
export const formValidationUtils = {
  /**
   * Validate email format
   */
  validateEmail: (email: string): ValidationResult => {
    return formValidationService['validateValue'](email, { type: 'email', required: true });
  },

  /**
   * Validate URL format
   */
  validateUrl: (url: string): ValidationResult => {
    return formValidationService['validateValue'](url, { type: 'url', required: true });
  },

  /**
   * Validate number format
   */
  validateNumber: (value: string, min?: number, max?: number, step?: number): ValidationResult => {
    return formValidationService['validateValue'](value, { type: 'number', min, max, step, required: true });
  },

  /**
   * Check if input type is supported
   */
  isInputTypeSupported: (type: string): boolean => {
    return formValidationService['supportedInputTypes'].has(type);
  },

  /**
   * Get validation capabilities
   */
  getCapabilities: () => formValidationService.getValidationCapabilities()
};