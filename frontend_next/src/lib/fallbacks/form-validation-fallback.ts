/**
 * Form Validation Fallback Implementation
 * Provides custom form validation for browsers without HTML5 validation support
 */

interface ValidationRule {
  type: 'required' | 'email' | 'url' | 'number' | 'minLength' | 'maxLength' | 'pattern' | 'min' | 'max';
  value?: any;
  message: string;
}

interface ValidationResult {
  isValid: boolean;
  message?: string;
}

/**
 * Custom form validation implementation
 */
class FormValidationFallback {
  private forms: Map<HTMLFormElement, Map<HTMLInputElement, ValidationRule[]>> = new Map();
  private validationMessages: Map<HTMLInputElement, HTMLElement> = new Map();

  /**
   * Enable custom validation for a form
   */
  enableValidation(form: HTMLFormElement): void {
    if (this.forms.has(form)) return;

    this.forms.set(form, new Map());
    
    // Add event listeners
    form.addEventListener('submit', this.handleSubmit.bind(this));
    form.addEventListener('input', this.handleInput.bind(this));
    form.addEventListener('blur', this.handleBlur.bind(this), true);
    
    // Process existing form elements
    this.processFormElements(form);
  }

  /**
   * Disable custom validation for a form
   */
  disableValidation(form: HTMLFormElement): void {
    if (!this.forms.has(form)) return;

    // Remove validation messages
    const inputMap = this.forms.get(form)!;
    inputMap.forEach((_, input) => {
      this.removeValidationMessage(input);
    });

    this.forms.delete(form);
    
    // Remove event listeners
    form.removeEventListener('submit', this.handleSubmit.bind(this));
    form.removeEventListener('input', this.handleInput.bind(this));
    form.removeEventListener('blur', this.handleBlur.bind(this), true);
  }

  private processFormElements(form: HTMLFormElement): void {
    const inputs = form.querySelectorAll('input, textarea, select');
    const inputMap = this.forms.get(form)!;

    inputs.forEach(element => {
      if (element instanceof HTMLInputElement || 
          element instanceof HTMLTextAreaElement || 
          element instanceof HTMLSelectElement) {
        const rules = this.extractValidationRules(element);
        if (rules.length > 0) {
          inputMap.set(element as HTMLInputElement, rules);
        }
      }
    });
  }

  private extractValidationRules(element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): ValidationRule[] {
    const rules: ValidationRule[] = [];

    // Required validation
    if (element.hasAttribute('required')) {
      rules.push({
        type: 'required',
        message: 'Это поле обязательно для заполнения'
      });
    }

    if (element instanceof HTMLInputElement) {
      // Email validation
      if (element.type === 'email') {
        rules.push({
          type: 'email',
          message: 'Введите корректный email адрес'
        });
      }

      // URL validation
      if (element.type === 'url') {
        rules.push({
          type: 'url',
          message: 'Введите корректный URL'
        });
      }

      // Number validation
      if (element.type === 'number') {
        rules.push({
          type: 'number',
          message: 'Введите корректное число'
        });

        if (element.hasAttribute('min')) {
          rules.push({
            type: 'min',
            value: parseFloat(element.getAttribute('min')!),
            message: `Значение должно быть не менее ${element.getAttribute('min')}`
          });
        }

        if (element.hasAttribute('max')) {
          rules.push({
            type: 'max',
            value: parseFloat(element.getAttribute('max')!),
            message: `Значение должно быть не более ${element.getAttribute('max')}`
          });
        }
      }

      // Pattern validation
      if (element.hasAttribute('pattern')) {
        rules.push({
          type: 'pattern',
          value: new RegExp(element.getAttribute('pattern')!),
          message: element.getAttribute('title') || 'Значение не соответствует требуемому формату'
        });
      }
    }

    // Length validation
    if (element.hasAttribute('minlength')) {
      rules.push({
        type: 'minLength',
        value: parseInt(element.getAttribute('minlength')!),
        message: `Минимальная длина: ${element.getAttribute('minlength')} символов`
      });
    }

    if (element.hasAttribute('maxlength')) {
      rules.push({
        type: 'maxLength',
        value: parseInt(element.getAttribute('maxlength')!),
        message: `Максимальная длина: ${element.getAttribute('maxlength')} символов`
      });
    }

    return rules;
  }

  private handleSubmit(event: Event): void {
    const form = event.target as HTMLFormElement;
    const inputMap = this.forms.get(form);
    
    if (!inputMap) return;

    let hasErrors = false;

    inputMap.forEach((rules, input) => {
      const result = this.validateInput(input, rules);
      if (!result.isValid) {
        hasErrors = true;
        this.showValidationMessage(input, result.message!);
      } else {
        this.removeValidationMessage(input);
      }
    });

    if (hasErrors) {
      event.preventDefault();
      event.stopPropagation();
      
      // Focus first invalid input
      const firstInvalidInput = form.querySelector('.validation-error') as HTMLInputElement;
      if (firstInvalidInput) {
        firstInvalidInput.focus();
      }
    }
  }

  private handleInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.validateInputIfNeeded(input);
  }

  private handleBlur(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.validateInputIfNeeded(input);
  }

  private validateInputIfNeeded(input: HTMLInputElement): void {
    // Find the form and rules for this input
    for (const [_form, inputMap] of this.forms.entries()) {
      if (inputMap.has(input)) {
        const rules = inputMap.get(input)!;
        const result = this.validateInput(input, rules);
        
        if (!result.isValid) {
          this.showValidationMessage(input, result.message!);
        } else {
          this.removeValidationMessage(input);
        }
        break;
      }
    }
  }

  private validateInput(input: HTMLInputElement, rules: ValidationRule[]): ValidationResult {
    const value = input.value.trim();

    for (const rule of rules) {
      const result = this.validateRule(value, rule);
      if (!result.isValid) {
        return result;
      }
    }

    return { isValid: true };
  }

  private validateRule(value: string, rule: ValidationRule): ValidationResult {
    switch (rule.type) {
      case 'required':
        return {
          isValid: value.length > 0,
          message: rule.message
        };

      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return {
          isValid: value === '' || emailRegex.test(value),
          message: rule.message
        };

      case 'url':
        try {
          new URL(value);
          return { isValid: true };
        } catch {
          return {
            isValid: value === '',
            message: rule.message
          };
        }

      case 'number':
        const num = parseFloat(value);
        return {
          isValid: value === '' || (!isNaN(num) && isFinite(num)),
          message: rule.message
        };

      case 'minLength':
        return {
          isValid: value.length >= rule.value,
          message: rule.message
        };

      case 'maxLength':
        return {
          isValid: value.length <= rule.value,
          message: rule.message
        };

      case 'pattern':
        return {
          isValid: value === '' || rule.value.test(value),
          message: rule.message
        };

      case 'min':
        const minNum = parseFloat(value);
        return {
          isValid: value === '' || (!isNaN(minNum) && minNum >= rule.value),
          message: rule.message
        };

      case 'max':
        const maxNum = parseFloat(value);
        return {
          isValid: value === '' || (!isNaN(maxNum) && maxNum <= rule.value),
          message: rule.message
        };

      default:
        return { isValid: true };
    }
  }

  private showValidationMessage(input: HTMLInputElement, message: string): void {
    // Remove existing message
    this.removeValidationMessage(input);

    // Add error class
    input.classList.add('validation-error');

    // Create message element
    const messageElement = document.createElement('div');
    messageElement.className = 'validation-message';
    messageElement.textContent = message;
    messageElement.style.cssText = `
      color: #dc2626;
      font-size: 0.875rem;
      margin-top: 0.25rem;
      display: block;
    `;

    // Insert message after input
    input.parentNode?.insertBefore(messageElement, input.nextSibling);
    this.validationMessages.set(input, messageElement);
  }

  private removeValidationMessage(input: HTMLInputElement): void {
    input.classList.remove('validation-error');
    
    const messageElement = this.validationMessages.get(input);
    if (messageElement && messageElement.parentNode) {
      messageElement.parentNode.removeChild(messageElement);
      this.validationMessages.delete(input);
    }
  }
}

// Global instance
const formValidationFallback = new FormValidationFallback();

/**
 * Enable custom form validation
 */
export function enableCustomFormValidation(): void {
  if (typeof window === 'undefined') return;

  // Add CSS for validation styling
  const style = document.createElement('style');
  style.textContent = `
    .validation-error {
      border-color: #dc2626 !important;
      box-shadow: 0 0 0 1px #dc2626 !important;
    }
    
    .validation-message {
      color: #dc2626;
      font-size: 0.875rem;
      margin-top: 0.25rem;
      display: block;
    }
    
    .custom-form-validation input:invalid {
      border-color: #dc2626;
      box-shadow: 0 0 0 1px #dc2626;
    }
    
    .custom-form-validation input:valid {
      border-color: #10b981;
    }
  `;
  
  if (!document.querySelector('style[data-form-validation]')) {
    style.setAttribute('data-form-validation', 'true');
    document.head.appendChild(style);
  }

  // Enable validation for all forms
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    formValidationFallback.enableValidation(form as HTMLFormElement);
  });

  console.log('Custom form validation enabled');
}

/**
 * Check if HTML5 form validation is supported
 */
export function isHTML5ValidationSupported(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const input = document.createElement('input');
    return typeof input.checkValidity === 'function' &&
           typeof input.setCustomValidity === 'function' &&
           'validity' in input;
  } catch {
    return false;
  }
}

/**
 * Enhanced form validation with custom rules
 */
export function createFormValidator(form: HTMLFormElement) {
  const isNativeSupported = isHTML5ValidationSupported();
  
  return {
    validate(): boolean {
      if (isNativeSupported && form.checkValidity) {
        return form.checkValidity();
      } else {
        // Use custom validation
        formValidationFallback.enableValidation(form);
        
        // Trigger validation by dispatching submit event
        const submitEvent = new Event('submit', { cancelable: true });
        const result = form.dispatchEvent(submitEvent);
        return result; // If preventDefault was called, result will be false
      }
    },
    
    validateField(input: HTMLInputElement): boolean {
      if (isNativeSupported && input.checkValidity) {
        return input.checkValidity();
      } else {
        // Use custom validation for single field
        const inputEvent = new Event('blur');
        input.dispatchEvent(inputEvent);
        return !input.classList.contains('validation-error');
      }
    },
    
    setCustomValidity(input: HTMLInputElement, message: string): void {
      if (isNativeSupported && input.setCustomValidity) {
        input.setCustomValidity(message);
      } else {
        // Show custom message
        if (message) {
          input.classList.add('validation-error');
          // Create or update custom message
          const existingMessage = input.parentNode?.querySelector('.validation-message');
          if (existingMessage) {
            existingMessage.textContent = message;
          } else {
            const messageElement = document.createElement('div');
            messageElement.className = 'validation-message';
            messageElement.textContent = message;
            input.parentNode?.insertBefore(messageElement, input.nextSibling);
          }
        } else {
          input.classList.remove('validation-error');
          const messageElement = input.parentNode?.querySelector('.validation-message');
          if (messageElement) {
            messageElement.remove();
          }
        }
      }
    }
  };
}

/**
 * Auto-enable form validation on page load
 */
export function autoEnableFormValidation(): void {
  if (typeof window === 'undefined') return;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (!isHTML5ValidationSupported()) {
        enableCustomFormValidation();
      }
    });
  } else {
    if (!isHTML5ValidationSupported()) {
      enableCustomFormValidation();
    }
  }
}