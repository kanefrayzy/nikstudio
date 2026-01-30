/**
 * Tests for form validation React hooks
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import { 
  useFormValidation, 
  useInputValidation, 
  useEmailValidation, 
  useUrlValidation, 
  useNumberValidation,
  useValidationCapabilities
} from '@/hooks/useFormValidation';

// Mock the form validation service
vi.mock('@/lib/form-validation-compatibility', () => ({
  formValidationService: {
    initializeForm: vi.fn(),
    validateForm: vi.fn().mockReturnValue(true),
    validateInput: vi.fn().mockReturnValue({
      isValid: true,
      errors: [],
      warnings: []
    }),
    setValidationRules: vi.fn(),
    clearValidation: vi.fn(),
    clearFormValidation: vi.fn(),
    getValidationCapabilities: vi.fn().mockReturnValue({
      nativeValidation: true,
      supportedInputTypes: ['text', 'email', 'url', 'number'],
      constraintValidation: true
    })
  },
  formValidationUtils: {
    validateEmail: vi.fn().mockReturnValue({
      isValid: true,
      errors: [],
      warnings: []
    }),
    validateUrl: vi.fn().mockReturnValue({
      isValid: true,
      errors: [],
      warnings: []
    }),
    validateNumber: vi.fn().mockReturnValue({
      isValid: true,
      errors: [],
      warnings: []
    }),
    isInputTypeSupported: vi.fn().mockReturnValue(true),
    getCapabilities: vi.fn().mockReturnValue({
      nativeValidation: true,
      supportedInputTypes: ['text', 'email', 'url', 'number'],
      constraintValidation: true
    })
  }
}));

describe('useFormValidation Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useFormValidation());

    expect(result.current.validationState.isValid).toBe(true);
    expect(result.current.validationState.errors).toEqual({});
    expect(result.current.validationState.warnings).toEqual({});
    expect(result.current.validationState.isValidating).toBe(false);
  });

  it('should provide form ref', () => {
    const { result } = renderHook(() => useFormValidation());

    expect(result.current.formRef).toBeDefined();
    expect(result.current.formRef.current).toBeNull(); // Initially null
  });

  it('should provide validation functions', () => {
    const { result } = renderHook(() => useFormValidation());

    expect(typeof result.current.validateForm).toBe('function');
    expect(typeof result.current.clearValidation).toBe('function');
  });

  it('should handle form validation', async () => {
    const { result } = renderHook(() => useFormValidation());

    // Validate form (should return true with mocked service)
    let isValid: boolean;
    act(() => {
      isValid = result.current.validateForm();
    });

    expect(isValid!).toBe(false); // Returns false when no form ref is set
  });
});

describe('useInputValidation Hook', () => {
  it('should initialize with valid state', () => {
    const { result } = renderHook(() => 
      useInputValidation({ required: true, type: 'text' })
    );

    expect(result.current.validationResult.isValid).toBe(true);
    expect(result.current.validationResult.errors).toEqual([]);
    expect(result.current.validationResult.warnings).toEqual([]);
  });

  it('should provide input ref and validation functions', () => {
    const { result } = renderHook(() => 
      useInputValidation({ required: true })
    );

    expect(result.current.inputRef).toBeDefined();
    expect(typeof result.current.validate).toBe('function');
    expect(typeof result.current.clearValidation).toBe('function');
  });
});

describe('useEmailValidation Hook', () => {
  it('should initialize email validation', () => {
    const { result } = renderHook(() => useEmailValidation(true));

    expect(result.current.inputRef).toBeDefined();
    expect(result.current.validationResult.isValid).toBe(true);
  });

  it('should handle optional email validation', () => {
    const { result } = renderHook(() => useEmailValidation(false));

    expect(result.current.validationResult.isValid).toBe(true);
  });
});

describe('useUrlValidation Hook', () => {
  it('should initialize URL validation', () => {
    const { result } = renderHook(() => useUrlValidation(true));

    expect(result.current.inputRef).toBeDefined();
    expect(result.current.validationResult.isValid).toBe(true);
  });

  it('should handle optional URL validation', () => {
    const { result } = renderHook(() => useUrlValidation(false));

    expect(result.current.validationResult.isValid).toBe(true);
  });
});

describe('useNumberValidation Hook', () => {
  it('should initialize number validation with constraints', () => {
    const { result } = renderHook(() => 
      useNumberValidation(0, 100, 1, true)
    );

    expect(result.current.inputRef).toBeDefined();
    expect(result.current.validationResult.isValid).toBe(true);
  });

  it('should handle number validation without constraints', () => {
    const { result } = renderHook(() => useNumberValidation());

    expect(result.current.validationResult.isValid).toBe(true);
  });
});

// Integration test component
const TestFormComponent: React.FC = () => {
  const { formRef, validationState, validateForm } = useFormValidation({
    validateOnInput: true,
    validateOnBlur: true
  });

  const { inputRef: emailRef, validationResult: emailValidation } = useEmailValidation(true);
  const { inputRef: urlRef, validationResult: urlValidation } = useUrlValidation(false);
  const { inputRef: numberRef, validationResult: numberValidation } = useNumberValidation(0, 100);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    validateForm();
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} data-testid="test-form">
      <input
        ref={emailRef}
        type="email"
        name="email"
        data-testid="email-input"
        placeholder="Email"
      />
      {emailValidation.errors.map((error, index) => (
        <div key={index} data-testid="email-error">{error}</div>
      ))}

      <input
        ref={urlRef}
        type="url"
        name="url"
        data-testid="url-input"
        placeholder="URL"
      />
      {urlValidation.errors.map((error, index) => (
        <div key={index} data-testid="url-error">{error}</div>
      ))}

      <input
        ref={numberRef}
        type="number"
        name="number"
        data-testid="number-input"
        placeholder="Number"
        min="0"
        max="100"
      />
      {numberValidation.errors.map((error, index) => (
        <div key={index} data-testid="number-error">{error}</div>
      ))}

      <button type="submit" data-testid="submit-button">
        Submit
      </button>

      <div data-testid="form-valid">
        {validationState.isValid ? 'Valid' : 'Invalid'}
      </div>
    </form>
  );
};

describe('Form Validation Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render form with validation hooks', () => {
    render(<TestFormComponent />);

    expect(screen.getByTestId('test-form')).toBeInTheDocument();
    expect(screen.getByTestId('email-input')).toBeInTheDocument();
    expect(screen.getByTestId('url-input')).toBeInTheDocument();
    expect(screen.getByTestId('number-input')).toBeInTheDocument();
    expect(screen.getByTestId('submit-button')).toBeInTheDocument();
  });

  it('should show form as valid initially', () => {
    render(<TestFormComponent />);

    expect(screen.getByTestId('form-valid')).toHaveTextContent('Valid');
  });

  it('should handle form submission', async () => {
    render(<TestFormComponent />);

    const submitButton = screen.getByTestId('submit-button');
    
    fireEvent.click(submitButton);

    // Form should still be valid since mocked validation returns true
    await waitFor(() => {
      expect(screen.getByTestId('form-valid')).toHaveTextContent('Valid');
    });
  });

  it('should handle input changes', async () => {
    render(<TestFormComponent />);

    const emailInput = screen.getByTestId('email-input');
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    // Input should be processed (no errors expected with mocked validation)
    await waitFor(() => {
      expect(emailInput).toHaveValue('test@example.com');
    });
  });
});

describe('Validation Capabilities Hook', () => {
  it('should provide validation capabilities', () => {
    const { result } = renderHook(() => useValidationCapabilities());

    expect(result.current).toHaveProperty('nativeValidation');
    expect(result.current).toHaveProperty('supportedInputTypes');
    expect(result.current).toHaveProperty('constraintValidation');
  });
});