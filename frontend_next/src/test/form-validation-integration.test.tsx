/**
 * Integration tests for form validation compatibility
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FormValidationDemo } from '@/components/FormValidationDemo';

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

describe('Form Validation Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render form validation demo', () => {
    render(<FormValidationDemo />);
    
    expect(screen.getByText('Совместимость валидации форм')).toBeInTheDocument();
    expect(screen.getByText('Возможности браузера')).toBeInTheDocument();
    expect(screen.getByText('Демо форма')).toBeInTheDocument();
  });

  it('should show browser capabilities', () => {
    render(<FormValidationDemo />);
    
    expect(screen.getByText('Нативная валидация:')).toBeInTheDocument();
    expect(screen.getByText('Constraint Validation API:')).toBeInTheDocument();
    expect(screen.getByText('Поддерживаемые типы input:')).toBeInTheDocument();
  });

  it('should render form fields with validation', () => {
    render(<FormValidationDemo />);
    
    // Check for form fields
    expect(screen.getByPlaceholderText('Введите ваше имя')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('example@domain.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('https://example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Введите ваш возраст')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('+7 (999) 123-45-67')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Введите ваше сообщение')).toBeInTheDocument();
  });

  it('should handle form submission', async () => {
    render(<FormValidationDemo />);
    
    const nameInput = screen.getByPlaceholderText('Введите ваше имя');
    const emailInput = screen.getByPlaceholderText('example@domain.com');
    const submitButton = screen.getByText('Отправить форму');
    
    // Fill required fields
    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    
    // Submit form
    fireEvent.click(submitButton);
    
    // Should show success message
    await waitFor(() => {
      expect(screen.getByText(/успешно отправлена/)).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('should show validation features', () => {
    render(<FormValidationDemo />);
    
    expect(screen.getByText('HTML5 Полифиллы')).toBeInTheDocument();
    expect(screen.getByText('Фолбэки типов input')).toBeInTheDocument();
    expect(screen.getByText('Кастомные сообщения')).toBeInTheDocument();
  });

  it('should show technical details', () => {
    render(<FormValidationDemo />);
    
    expect(screen.getByText('Поддерживаемые браузеры:')).toBeInTheDocument();
    expect(screen.getByText('Стратегия совместимости:')).toBeInTheDocument();
    expect(screen.getByText('Chrome 80+')).toBeInTheDocument();
    expect(screen.getByText('Firefox 78+')).toBeInTheDocument();
    expect(screen.getByText('Safari 12+')).toBeInTheDocument();
    expect(screen.getByText('Edge 79+')).toBeInTheDocument();
  });

  it('should handle validation utils test button', () => {
    render(<FormValidationDemo />);
    
    const testButton = screen.getByText('Тест утилит валидации');
    
    // Mock console.log to verify the test runs
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    fireEvent.click(testButton);
    
    expect(consoleSpy).toHaveBeenCalledWith(
      'Validation utils test:',
      expect.objectContaining({
        emailTest: expect.any(Object),
        urlTest: expect.any(Object),
        numberTest: expect.any(Object)
      })
    );
    
    consoleSpy.mockRestore();
  });
});