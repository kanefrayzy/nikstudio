import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import MediaPageAdmin from '../admin/MediaPageAdmin';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock data
const mockMediaPageData = {
  hero: {
    title: 'Test Hero Title',
    description: 'Test Hero Description'
  },
  testimonials: {
    title: 'Test Testimonials Title',
    subtitle: 'Test Testimonials Subtitle'
  },
  process: {
    title: 'Test Process Title',
    subtitle: 'Test Process Subtitle'
  }
};

const mockServices = [
  {
    id: 1,
    title: 'Test Service 1',
    description: 'Test Description 1',
    order: 1,
    features: [
      {
        id: 1,
        title: 'Feature 1',
        description: ['Paragraph 1', 'Paragraph 2'],
        order: 1
      }
    ],
    media_items: [
      {
        id: 1,
        group_id: 1,
        media_type: 'main',
        file_type: 'image',
        file_path: 'test-main.jpg',
        alt_text: 'Test Main',
        order: 1
      }
    ]
  }
];

describe('MediaPageAdmin', () => {
  beforeEach(() => {
    mockedAxios.get.mockClear();
    mockedAxios.put.mockClear();
    mockedAxios.post.mockClear();
    mockedAxios.delete.mockClear();
  });

  it('renders admin interface with tabs', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { success: true, data: mockMediaPageData }
    });
    mockedAxios.get.mockResolvedValueOnce({
      data: { success: true, data: mockServices }
    });

    render(<MediaPageAdmin />);

    expect(screen.getByText('Управление медиа страницей')).toBeInTheDocument();
    expect(screen.getByText('Герой')).toBeInTheDocument();
    expect(screen.getByText('Услуги')).toBeInTheDocument();
    expect(screen.getByText('Отзывы')).toBeInTheDocument();
    expect(screen.getByText('Процесс')).toBeInTheDocument();
  });

  it('loads and displays hero content', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { success: true, data: mockMediaPageData }
    });
    mockedAxios.get.mockResolvedValueOnce({
      data: { success: true, data: mockServices }
    });

    render(<MediaPageAdmin />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Hero Title')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Hero Description')).toBeInTheDocument();
    });
  });

  it('updates hero content successfully', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { success: true, data: mockMediaPageData }
    });
    mockedAxios.get.mockResolvedValueOnce({
      data: { success: true, data: mockServices }
    });
    mockedAxios.put.mockResolvedValueOnce({
      data: { success: true, message: 'Контент героя обновлен' }
    });

    render(<MediaPageAdmin />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Hero Title')).toBeInTheDocument();
    });

    const titleInput = screen.getByDisplayValue('Test Hero Title');
    fireEvent.change(titleInput, { target: { value: 'Updated Hero Title' } });

    const saveButton = screen.getByText('Сохранить герой');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockedAxios.put).toHaveBeenCalledWith('/api/admin/media-page/hero', {
        title: 'Updated Hero Title',
        description: 'Test Hero Description'
      });
    });
  });

  it('displays services list', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { success: true, data: mockMediaPageData }
    });
    mockedAxios.get.mockResolvedValueOnce({
      data: { success: true, data: mockServices }
    });

    render(<MediaPageAdmin />);

    // Click on services tab
    const servicesTab = screen.getByText('Услуги');
    fireEvent.click(servicesTab);

    await waitFor(() => {
      expect(screen.getByText('Test Service 1')).toBeInTheDocument();
      expect(screen.getByText('Test Description 1')).toBeInTheDocument();
    });
  });

  it('opens service creation dialog', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { success: true, data: mockMediaPageData }
    });
    mockedAxios.get.mockResolvedValueOnce({
      data: { success: true, data: mockServices }
    });

    render(<MediaPageAdmin />);

    // Click on services tab
    const servicesTab = screen.getByText('Услуги');
    fireEvent.click(servicesTab);

    await waitFor(() => {
      const addButton = screen.getByText('Добавить услугу');
      fireEvent.click(addButton);
    });

    expect(screen.getByText('Создать услугу')).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('API Error'));

    render(<MediaPageAdmin />);

    await waitFor(() => {
      expect(screen.getByText('Ошибка загрузки данных')).toBeInTheDocument();
    });
  });

  it('shows loading state during data fetch', () => {
    mockedAxios.get.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<MediaPageAdmin />);

    expect(screen.getByText('Загрузка...')).toBeInTheDocument();
  });

  it('validates required fields in hero form', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { success: true, data: mockMediaPageData }
    });
    mockedAxios.get.mockResolvedValueOnce({
      data: { success: true, data: mockServices }
    });

    render(<MediaPageAdmin />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Hero Title')).toBeInTheDocument();
    });

    const titleInput = screen.getByDisplayValue('Test Hero Title');
    fireEvent.change(titleInput, { target: { value: '' } });

    const saveButton = screen.getByText('Сохранить герой');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Заголовок обязателен')).toBeInTheDocument();
    });
  });

  it('displays success message after successful update', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { success: true, data: mockMediaPageData }
    });
    mockedAxios.get.mockResolvedValueOnce({
      data: { success: true, data: mockServices }
    });
    mockedAxios.put.mockResolvedValueOnce({
      data: { success: true, message: 'Контент героя обновлен' }
    });

    render(<MediaPageAdmin />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Hero Title')).toBeInTheDocument();
    });

    const saveButton = screen.getByText('Сохранить герой');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Контент героя обновлен')).toBeInTheDocument();
    });

    // Message should auto-dismiss after 3 seconds
    setTimeout(() => {
      expect(screen.queryByText('Контент героя обновлен')).not.toBeInTheDocument();
    }, 3100);
  });

  it('disables submit button during API call', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { success: true, data: mockMediaPageData }
    });
    mockedAxios.get.mockResolvedValueOnce({
      data: { success: true, data: mockServices }
    });
    mockedAxios.put.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<MediaPageAdmin />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Hero Title')).toBeInTheDocument();
    });

    const saveButton = screen.getByText('Сохранить герой');
    fireEvent.click(saveButton);

    expect(saveButton).toBeDisabled();
    expect(screen.getByText('Сохранение...')).toBeInTheDocument();
  });
});