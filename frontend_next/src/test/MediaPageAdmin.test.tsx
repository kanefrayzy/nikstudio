import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MediaPageAdmin } from '@/components/admin/MediaPageAdmin';

// Mock fetch
global.fetch = jest.fn();

describe('MediaPageAdmin', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('renders the main interface with tabs', () => {
    render(<MediaPageAdmin />);
    
    expect(screen.getByText('Управление медиа-страницей')).toBeInTheDocument();
    expect(screen.getByText('Герой')).toBeInTheDocument();
    expect(screen.getByText('Услуги')).toBeInTheDocument();
    expect(screen.getByText('Отзывы')).toBeInTheDocument();
    expect(screen.getByText('Процесс')).toBeInTheDocument();
  });

  it('loads initial data on mount', async () => {
    const mockData = {
      success: true,
      data: {
        hero_title: 'Test Title',
        hero_description: 'Test Description',
        testimonials_title: 'Test Testimonials',
        testimonials_subtitle: 'Test Subtitle',
        process_title: 'Test Process',
        process_subtitle: 'Test Process Subtitle'
      }
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    render(<MediaPageAdmin />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/media-page')
      );
    });
  });

  it('handles hero form submission', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: {} }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

    render(<MediaPageAdmin />);

    // Wait for initial load
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    // Fill hero form
    const titleInput = screen.getByLabelText('Заголовок *');
    const descriptionInput = screen.getByLabelText('Описание *');
    
    fireEvent.change(titleInput, { target: { value: 'New Title' } });
    fireEvent.change(descriptionInput, { target: { value: 'New Description' } });

    // Submit form
    const submitButton = screen.getByText('Сохранить герой');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/media-page/hero'),
        expect.objectContaining({
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: 'New Title',
            description: 'New Description'
          }),
        })
      );
    });
  });

  it('displays success message after successful save', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: {} }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

    render(<MediaPageAdmin />);

    // Wait for initial load
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    // Submit hero form
    const submitButton = screen.getByText('Сохранить герой');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Контент героя успешно сохранён')).toBeInTheDocument();
    });
  });

  it('displays error message on failed save', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: {} }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Server error' }),
      });

    render(<MediaPageAdmin />);

    // Wait for initial load
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    // Submit hero form
    const submitButton = screen.getByText('Сохранить герой');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });
  });

  it('switches between tabs correctly', () => {
    render(<MediaPageAdmin />);

    // Click testimonials tab
    const testimonialsTab = screen.getByText('Отзывы');
    fireEvent.click(testimonialsTab);

    expect(screen.getByText('Управление заголовком отзывов')).toBeInTheDocument();

    // Click process tab
    const processTab = screen.getByText('Процесс');
    fireEvent.click(processTab);

    expect(screen.getByText('Управление заголовком процесса')).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', () => {
    const mockOnBack = jest.fn();
    render(<MediaPageAdmin onBack={mockOnBack} />);

    const backButton = screen.getByText('Назад');
    fireEvent.click(backButton);

    expect(mockOnBack).toHaveBeenCalled();
  });
});