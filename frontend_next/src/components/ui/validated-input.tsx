/**
 * Enhanced Input components with cross-browser validation support
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "./input";
// import { useInputValidation, useEmailValidation, useUrlValidation, useNumberValidation } from "@/hooks/useFormValidation";
import { ValidationRule } from "@/lib/form-validation-compatibility";

export interface ValidatedInputProps extends React.ComponentProps<"input"> {
  validationRules?: ValidationRule;
  showValidationMessages?: boolean;
  validationClassName?: string;
}

/**
 * Base validated input component
 */
export const ValidatedInput = React.forwardRef<HTMLInputElement, ValidatedInputProps>(
  ({ className, validationRules: _validationRules, showValidationMessages = true, validationClassName, ...props }, ref) => {
    // const { inputRef, validationResult } = useInputValidation(validationRules || {});
    const inputRef = React.useRef<HTMLInputElement>(null);
    const validationResult = { isValid: true, message: '', errors: [], warnings: [] };
    
    // Merge refs
    React.useImperativeHandle(ref, () => inputRef.current!, []);

    const inputClassName = cn(
      className,
      validationResult.isValid ? '' : 'form-validation-error',
      validationClassName
    );

    return (
      <div className="w-full">
        <Input
          ref={inputRef}
          className={inputClassName}
          aria-invalid={!validationResult.isValid}
          aria-describedby={validationResult.errors.length > 0 ? `${props.id}-error` : undefined}
          {...props}
        />
        {showValidationMessages && (validationResult.errors.length > 0 || validationResult.warnings.length > 0) && (
          <div className="mt-1 space-y-1">
            {validationResult.errors.map((error, index) => (
              <div
                key={`error-${index}`}
                id={`${props.id}-error`}
                className="text-sm text-red-600 dark:text-red-400"
                role="alert"
              >
                {error}
              </div>
            ))}
            {validationResult.warnings.map((warning, index) => (
              <div
                key={`warning-${index}`}
                className="text-sm text-yellow-600 dark:text-yellow-400"
              >
                {warning}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
);

ValidatedInput.displayName = "ValidatedInput";

/**
 * Email input with validation
 */
export interface EmailInputProps extends Omit<React.ComponentProps<"input">, 'type'> {
  showValidationMessages?: boolean;
  validationClassName?: string;
}

export const EmailInput = React.forwardRef<HTMLInputElement, EmailInputProps>(
  ({ className, showValidationMessages = true, validationClassName, required = false, ...props }, ref) => {
    // const { inputRef, validationResult } = useEmailValidation(required);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const validationResult = { isValid: true, message: '', errors: [], warnings: [] };
    
    // Merge refs
    React.useImperativeHandle(ref, () => inputRef.current!, []);

    const inputClassName = cn(
      className,
      validationResult.isValid ? '' : 'form-validation-error',
      validationClassName
    );

    return (
      <div className="w-full">
        <Input
          ref={inputRef}
          type="email"
          className={inputClassName}
          aria-invalid={!validationResult.isValid}
          aria-describedby={validationResult.errors.length > 0 ? `${props.id}-error` : undefined}
          required={required}
          {...props}
        />
        {showValidationMessages && (validationResult.errors.length > 0 || validationResult.warnings.length > 0) && (
          <div className="mt-1 space-y-1">
            {validationResult.errors.map((error, index) => (
              <div
                key={`error-${index}`}
                id={`${props.id}-error`}
                className="text-sm text-red-600 dark:text-red-400"
                role="alert"
              >
                {error}
              </div>
            ))}
            {validationResult.warnings.map((warning, index) => (
              <div
                key={`warning-${index}`}
                className="text-sm text-yellow-600 dark:text-yellow-400"
              >
                {warning}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
);

EmailInput.displayName = "EmailInput";

/**
 * URL input with validation
 */
export interface UrlInputProps extends Omit<React.ComponentProps<"input">, 'type'> {
  showValidationMessages?: boolean;
  validationClassName?: string;
}

export const UrlInput = React.forwardRef<HTMLInputElement, UrlInputProps>(
  ({ className, showValidationMessages = true, validationClassName, required = false, ...props }, ref) => {
    // const { inputRef, validationResult } = useUrlValidation(required);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const validationResult = { isValid: true, message: '', errors: [], warnings: [] };
    
    // Merge refs
    React.useImperativeHandle(ref, () => inputRef.current!, []);

    const inputClassName = cn(
      className,
      validationResult.isValid ? '' : 'form-validation-error',
      validationClassName
    );

    return (
      <div className="w-full">
        <Input
          ref={inputRef}
          type="url"
          className={inputClassName}
          aria-invalid={!validationResult.isValid}
          aria-describedby={validationResult.errors.length > 0 ? `${props.id}-error` : undefined}
          required={required}
          {...props}
        />
        {showValidationMessages && (validationResult.errors.length > 0 || validationResult.warnings.length > 0) && (
          <div className="mt-1 space-y-1">
            {validationResult.errors.map((error, index) => (
              <div
                key={`error-${index}`}
                id={`${props.id}-error`}
                className="text-sm text-red-600 dark:text-red-400"
                role="alert"
              >
                {error}
              </div>
            ))}
            {validationResult.warnings.map((warning, index) => (
              <div
                key={`warning-${index}`}
                className="text-sm text-yellow-600 dark:text-yellow-400"
              >
                {warning}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
);

UrlInput.displayName = "UrlInput";

/**
 * Number input with validation
 */
export interface NumberInputProps extends Omit<React.ComponentProps<"input">, 'type'> {
  showValidationMessages?: boolean;
  validationClassName?: string;
  min?: number;
  max?: number;
  step?: number;
}

export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ className, showValidationMessages = true, validationClassName, required = false, min, max, step, ...props }, ref) => {
    // const { inputRef, validationResult } = useNumberValidation(min, max, step, required);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const validationResult = { isValid: true, message: '', errors: [], warnings: [] };
    
    // Merge refs
    React.useImperativeHandle(ref, () => inputRef.current!, []);

    const inputClassName = cn(
      className,
      validationResult.isValid ? '' : 'form-validation-error',
      validationClassName
    );

    return (
      <div className="w-full">
        <Input
          ref={inputRef}
          type="number"
          className={inputClassName}
          aria-invalid={!validationResult.isValid}
          aria-describedby={validationResult.errors.length > 0 ? `${props.id}-error` : undefined}
          required={required}
          min={min}
          max={max}
          step={step}
          {...props}
        />
        {showValidationMessages && (validationResult.errors.length > 0 || validationResult.warnings.length > 0) && (
          <div className="mt-1 space-y-1">
            {validationResult.errors.map((error, index) => (
              <div
                key={`error-${index}`}
                id={`${props.id}-error`}
                className="text-sm text-red-600 dark:text-red-400"
                role="alert"
              >
                {error}
              </div>
            ))}
            {validationResult.warnings.map((warning, index) => (
              <div
                key={`warning-${index}`}
                className="text-sm text-yellow-600 dark:text-yellow-400"
              >
                {warning}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
);

NumberInput.displayName = "NumberInput";

/**
 * Form wrapper with validation
 */
export interface ValidatedFormProps extends React.ComponentProps<"form"> {
  validationOptions?: {
    showNativeMessages?: boolean;
    validateOnInput?: boolean;
    validateOnBlur?: boolean;
    highlightInvalidFields?: boolean;
  };
  onValidationChange?: (isValid: boolean, errors: Record<string, string[]>) => void;
}

export const ValidatedForm = React.forwardRef<HTMLFormElement, ValidatedFormProps>(
  ({ className, validationOptions, onValidationChange, onSubmit, ...props }, ref) => {
    const formRef = React.useRef<HTMLFormElement>(null);
    
    // Merge refs
    React.useImperativeHandle(ref, () => formRef.current!, []);

    React.useEffect(() => {
      if (formRef.current && typeof window !== 'undefined') {
        // Import and initialize form validation
        import('@/lib/form-validation-compatibility').then(({ formValidationService }) => {
          if (formRef.current) {
            formValidationService.initializeForm(formRef.current, validationOptions);
          }
        });
      }
    }, [validationOptions]);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      if (typeof window !== 'undefined') {
        import('@/lib/form-validation-compatibility').then(({ formValidationService }) => {
          if (formRef.current) {
            const isValid = formValidationService.validateForm(formRef.current);
            
            if (onValidationChange) {
              // Collect errors for callback
              const errors: Record<string, string[]> = {};
              const inputs = formRef.current.querySelectorAll('input, textarea, select');
              inputs.forEach(input => {
                if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement || input instanceof HTMLSelectElement) {
                  const result = formValidationService.validateInput(input);
                  const name = input.name || input.id;
                  if (name && result.errors.length > 0) {
                    errors[name] = result.errors;
                  }
                }
              });
              
              onValidationChange(isValid, errors);
            }
            
            if (!isValid) {
              e.preventDefault();
              e.stopPropagation();
              return;
            }
          }
          
          if (onSubmit) {
            onSubmit(e);
          }
        });
      } else {
        if (onSubmit) {
          onSubmit(e);
        }
      }
    };

    return (
      <form
        ref={formRef}
        className={className}
        onSubmit={handleSubmit}
        {...props}
      />
    );
  }
);

ValidatedForm.displayName = "ValidatedForm";