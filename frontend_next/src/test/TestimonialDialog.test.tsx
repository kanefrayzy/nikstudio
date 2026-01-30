import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { TestimonialDialog } from '@/components/admin/TestimonialDialog';

// Mock fetch
global.fetch = vi.fn();

const mockTestimonial = {
  id: 1,
  company: 'Test Company',
  quote: 'Test quote',
  description: 'Test description',
  image_path: 'test-image.jpg',
  order: 1
};

describe('TestimonialDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders create dialog correctly', () => {
    render(
      <TestimonialDialog
        open={true}
        onOpenChange={() => {}}
        testimonial={null}
        onSave={() => {}}
      />
    );

    expect(screen.getByText('Добавить отзыв')).toBeInTheDocument();
    expect(screen.getByText('Заполните все поля для создания нового отзыва')).toBeInTheDocument();
  });

  it('renders edit dialog correctly', () => {
    render(
      <TestimonialDialog
        open={true}
        onOpenChange={() => {}}
        testimonial={mockTestimonial}
        onSave={() => {}}
      />
    );

    expect(screen.getByText('Редактировать отзыв')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Company')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test quote')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test description')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(
      <TestimonialDialog
        open={true}
        onOpenChange={() => {}}
        testimonial={null}
        onSave={() => {}}
      />
    );

    const submitButton = screen.getByText('Создать отзыв');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Название компании обязательно для заполнения')).toBeInTheDocument();
      expect(screen.getByText('Цитата обязательна для заполнения')).toBeInTheDocument();
      expect(screen.getByText('Описание обязательно для заполнения')).toBeInTheDocument();
      expect(screen.getByText('Изображение обязательно для загрузки')).toBeInTheDocument();
    });
  });

  it('handles form submission correctly', async () => {
    const mockOnSave = vi.fn();
    const mockOnOpenChange = vi.fn();

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({
        status: 'success',
        data: mockTestimonial,
        message: 'Отзыв успешно создан'
      })
    });

    render(
      <TestimonialDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        testimonial={null}
        onSave={mockOnSave}
      />
    );

    // Fill form fields
    fireEvent.change(screen.getByLabelText('Название компании *'), {
      target: { value: 'Test Company' }
    });
    fireEvent.change(screen.getByLabelText('Цитата *'), {
      target: { value: 'Test quote' }
    });
    fireEvent.change(screen.getByLabelText('Описание *'), {
      target: { value: 'Test description' }
    });

    // Mock file upload
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });
      fireEvent.change(fileInput);
    }

    const submitButton = screen.getByText('Создать отзыв');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalled();
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });
});