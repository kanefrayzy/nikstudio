/**
 * Tests for form validation compatibility system
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock browser detection
vi.mock('@/lib/browser-detection', () => ({
  browserDetectionService: {
    getBrowserInfo: () => ({
      name: 'chrome',
      version: 90,
      isSupported: true,
      features: {
        fetch: true,
        promises: true,
        asyncAwait: true,
        cssGrid: true,
        cssFlexbox: true,
        customProperties: true,
        intersectionObserver: true
      }
    })
  }
}));

// Mock DOM environment
const mockWindow = {
  document: {
    createElement: vi.fn(),
    getElementById: vi.fn(),
    head: {
      appendChild: vi.fn()
    }
  },
  HTMLInputElement: class MockHTMLInputElement {
    type: string = 'text';
    value: string = '';
    name: string = '';
    id: string = '';
    hasAttribute = vi.fn();
    getAttribute = vi.fn();
    setAttribute = vi.fn();
    addEventListener = vi.fn();
    removeEventListener = vi.fn();
    classList = {
      add: vi.fn(),
      remove: vi.fn(),
      contains: vi.fn()
    };
    dataset: Record<string, string> = {};
    parentNode = {
      insertBefore: vi.fn()
    };
    nextSibling = null;
  }
};

describe('Form Validation Compatibility', () => {
  let formValidationService: any;
  let formValidationUtils: any;

  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Mock DOM methods
    global.window = mockWindow as any;
    global.document = mockWindow.document as any;
    
    // Mock createElement to return appropriate elements
    mockWindow.document.createElement.mockImplementation((tagName: string) => {
      if (tagName === 'input') {
        return new mockWindow.HTMLInputElement();
      }
      if (tagName === 'div' || tagName === 'style') {
        return {
          id: '',
          className: '',
          textContent: '',
          style: { display: '' },
          innerHTML: '',
          appendChild: vi.fn()
        };
      }
      return {};
    });

    // Import the actual validation service
    const validationModule = await import('@/lib/form-validation-compatibility');
    formValidationService = validationModule.formValidationService;
    formValidationUtils = validationModule.formValidationUtils;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Input Type Detection', () => {
    it('should detect supported input types', () => {
      const capabilities = formValidationService.getValidationCapabilities();
      
      expect(capabilities).toHaveProperty('supportedInputTypes');
      expect(Array.isArray(capabilities.supportedInputTypes)).toBe(true);
    });

    it('should detect native validation support', () => {
      const capabilities = formValidationService.getValidationCapabilities();
      
      expect(capabilities).toHaveProperty('nativeValidation');
      expect(typeof capabilities.nativeValidation).toBe('boolean');
    });

    it('should detect constraint validation API support', () => {
      const capabilities = formValidationService.getValidationCapabilities();
      
      expect(capabilities).toHaveProperty('constraintValidation');
      expect(typeof capabilities.constraintValidation).toBe('boolean');
    });
  });

  describe('Email Validation', () => {
    it('should validate correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org'
      ];

      validEmails.forEach(email => {
        const result = formValidationUtils.validateEmail(email);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user@domain'
      ];

      invalidEmails.forEach(email => {
        const result = formValidationUtils.validateEmail(email);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('URL Validation', () => {
    it('should validate correct URLs', () => {
      const validUrls = [
        'https://example.com',
        'http://domain.org',
        'https://sub.domain.com/path',
        'ftp://files.example.com'
      ];

      validUrls.forEach(url => {
        const result = formValidationUtils.validateUrl(url);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should handle URLs without protocol', () => {
      const urlsWithoutProtocol = [
        'example.com',
        'www.domain.org',
        'sub.domain.com/path'
      ];

      urlsWithoutProtocol.forEach(url => {
        const result = formValidationUtils.validateUrl(url);
        // Should be valid as we add http:// prefix internally
        expect(result.isValid).toBe(true);
      });
    });

    it('should reject clearly invalid URLs', () => {
      const invalidUrls = [
        'not-a-url',
        'just text'
      ];

      invalidUrls.forEach(url => {
        const result = formValidationUtils.validateUrl(url);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Number Validation', () => {
    it('should validate correct numbers', () => {
      const validNumbers = [
        '42',
        '3.14',
        '-10',
        '0',
        '1000'
      ];

      validNumbers.forEach(number => {
        const result = formValidationUtils.validateNumber(number);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should validate numbers within range', () => {
      const result = formValidationUtils.validateNumber('50', 0, 100);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject numbers outside range', () => {
      const belowMin = formValidationUtils.validateNumber('-10', 0, 100);
      expect(belowMin.isValid).toBe(false);
      expect(belowMin.errors.some((error: string) => error.includes('не менее'))).toBe(true);

      const aboveMax = formValidationUtils.validateNumber('150', 0, 100);
      expect(aboveMax.isValid).toBe(false);
      expect(aboveMax.errors.some((error: string) => error.includes('не более'))).toBe(true);
    });

    it('should validate step values', () => {
      const validStep = formValidationUtils.validateNumber('10', 0, 100, 5);
      expect(validStep.isValid).toBe(true);

      const invalidStep = formValidationUtils.validateNumber('7', 0, 100, 5);
      expect(invalidStep.isValid).toBe(false);
      expect(invalidStep.errors.some((error: string) => error.includes('кратно'))).toBe(true);
    });

    it('should reject clearly invalid numbers', () => {
      const invalidNumbers = [
        'not-a-number',
        'abc'
      ];

      invalidNumbers.forEach(number => {
        const result = formValidationUtils.validateNumber(number);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Input Type Support Detection', () => {
    it('should correctly identify supported input types', () => {
      const supportedTypes = ['text', 'email', 'url', 'number'];
      
      supportedTypes.forEach(type => {
        const isSupported = formValidationUtils.isInputTypeSupported(type);
        expect(typeof isSupported).toBe('boolean');
      });
    });
  });

  describe('Cross-browser Compatibility', () => {
    it('should provide fallbacks for unsupported input types', () => {
      const capabilities = formValidationService.getValidationCapabilities();
      
      // Should always provide some level of validation support
      expect(capabilities.supportedInputTypes.length).toBeGreaterThan(0);
    });

    it('should handle browsers without native validation', () => {
      const capabilities = formValidationService.getValidationCapabilities();
      
      // Should still provide validation capabilities
      expect(typeof capabilities.nativeValidation).toBe('boolean');
      expect(typeof capabilities.constraintValidation).toBe('boolean');
    });
  });

  describe('Error Messages', () => {
    it('should provide localized error messages', () => {
      const result = formValidationUtils.validateEmail('invalid-email');
      
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toMatch(/email|корректный/i);
    });

    it('should provide specific error messages for different validation types', () => {
      const emailResult = formValidationUtils.validateEmail('invalid');
      const urlResult = formValidationUtils.validateUrl('invalid');
      const numberResult = formValidationUtils.validateNumber('invalid');

      expect(emailResult.errors[0]).not.toBe(urlResult.errors[0]);
      expect(urlResult.errors[0]).not.toBe(numberResult.errors[0]);
    });
  });
});