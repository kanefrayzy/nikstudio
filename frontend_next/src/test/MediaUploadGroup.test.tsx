import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MediaUploadGroup } from '@/components/admin/MediaUploadGroup';

// Mock the file upload compatibility hook
vi.mock('@/lib/file-upload-compatibility', () => ({
  useFileUploadCompatibility: () => ({
    capabilities: {
      fileApi: true,
      formData: true,
      dragAndDrop: true,
      fileReader: true,
      multipleFiles: true,
      fileValidation: true
    },
    utils: {
      createFormData: () => new FormData(),
      service: {
        readFileAsDataURL: vi.fn().mockResolvedValue('data:image/jpeg;base64,test')
      }
    }
  }),
  fileUploadUtils: {
    createFormData: () => new FormData(),
    validateImageFile: vi.fn().mockReturnValue({ isValid: true, errors: [], warnings: [] }),
    validateVideoFile: vi.fn().mockReturnValue({ isValid: true, errors: [], warnings: [] })
  }
}));

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  Upload: () => <div data-testid="upload-icon" />,
  Image: () => <div data-testid="image-icon" />,
  Video: () => <div data-testid="video-icon" />,
  X: () => <div data-testid="x-icon" />,
  AlertCircle: () => <div data-testid="alert-circle-icon" />,
  CheckCircle: () => <div data-testid="check-circle-icon" />,
  Loader2: () => <div data-testid="loader-icon" />,
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  FileImage: () => <div data-testid="file-image-icon" />,
  FileVideo: () => <div data-testid="file-video-icon" />
}));

describe('MediaUploadGroup', () => {
  const mockOnUpload = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultProps = {
    onUpload: mockOnUpload,
    uploading: false,
    uploadProgress: 0
  };

  it('renders the component with initial state', () => {
    render(<MediaUploadGroup {...defaultProps} />);
    
    expect(screen.getByText('Загрузка медиа-группы')).toBeInTheDocument();
    expect(screen.getByText('Основное медиа *')).toBeInTheDocument();
    expect(screen.getByText('Дополнительное медиа')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /загрузить/i })).toBeDisabled();
  });

  it('shows file input fields when no files are selected', () => {
    render(<MediaUploadGroup {...defaultProps} />);
    
    expect(screen.getByLabelText('Выберите файл')).toBeInTheDocument();
    expect(screen.getByText('Изображения: до 2МБ (JPG, PNG, WebP)')).toBeInTheDocument();
    expect(screen.getByText('Видео: до 50МБ (MP4, WebM)')).toBeInTheDocument();
  });

  it('enables upload button when main file is selected', async () => {
    render(<MediaUploadGroup {...defaultProps} />);
    
    const mainFileInput = screen.getAllByLabelText('Выберите файл')[0];
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    fireEvent.change(mainFileInput, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /загрузить/i })).not.toBeDisabled();
    });
  });

  it('shows validation error for invalid file size', async () => {
    render(<MediaUploadGroup {...defaultProps} />);
    
    const mainFileInput = screen.getAllByLabelText('Выберите файл')[0];
    // Create a file larger than 2MB for images
    const largeFile = new File(['x'.repeat(3 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
    
    fireEvent.change(mainFileInput, { target: { files: [largeFile] } });
    
    await waitFor(() => {
      expect(screen.getByText(/файл слишком большой/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for unsupported file type', async () => {
    render(<MediaUploadGroup {...defaultProps} />);
    
    const mainFileInput = screen.getAllByLabelText('Выберите файл')[0];
    const unsupportedFile = new File(['test'], 'test.txt', { type: 'text/plain' });
    
    fireEvent.change(mainFileInput, { target: { files: [unsupportedFile] } });
    
    await waitFor(() => {
      expect(screen.getByText(/поддерживаются только изображения и видео файлы/i)).toBeInTheDocument();
    });
  });

  it('requires poster for video files', async () => {
    render(<MediaUploadGroup {...defaultProps} />);
    
    const mainFileInput = screen.getAllByLabelText('Выберите файл')[0];
    const videoFile = new File(['test'], 'test.mp4', { type: 'video/mp4' });
    
    fireEvent.change(mainFileInput, { target: { files: [videoFile] } });
    
    await waitFor(() => {
      expect(screen.getByText('Постер для видео *')).toBeInTheDocument();
    });

    // Try to upload without poster
    const uploadButton = screen.getByRole('button', { name: /загрузить/i });
    fireEvent.click(uploadButton);
    
    await waitFor(() => {
      expect(screen.getByText(/для видео файлов обязательно загрузить постер/i)).toBeInTheDocument();
    });
  });

  it('shows upload progress when uploading', () => {
    render(<MediaUploadGroup {...defaultProps} uploading={true} uploadProgress={50} />);
    
    expect(screen.getByText('Загрузка медиа-группы...')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText(/не закрывайте страницу/i)).toBeInTheDocument();
  });

  it('disables all inputs when uploading', () => {
    render(<MediaUploadGroup {...defaultProps} uploading={true} />);
    
    const fileInputs = screen.getAllByRole('textbox');
    fileInputs.forEach(input => {
      expect(input).toBeDisabled();
    });
    
    expect(screen.getByRole('button', { name: /загрузка/i })).toBeDisabled();
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(<MediaUploadGroup {...defaultProps} onCancel={mockOnCancel} />);
    
    const cancelButton = screen.getByRole('button', { name: /отмена/i });
    fireEvent.click(cancelButton);
    
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('shows alt text inputs when files are selected', async () => {
    render(<MediaUploadGroup {...defaultProps} />);
    
    const mainFileInput = screen.getAllByLabelText('Выберите файл')[0];
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    fireEvent.change(mainFileInput, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Описание для основного медиа')).toBeInTheDocument();
    });
  });

  it('clears file when X button is clicked', async () => {
    render(<MediaUploadGroup {...defaultProps} />);
    
    const mainFileInput = screen.getAllByLabelText('Выберите файл')[0];
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    fireEvent.change(mainFileInput, { target: { files: [file] } });
    
    await waitFor(() => {
      const clearButton = screen.getAllByTestId('x-icon')[0].closest('button');
      expect(clearButton).toBeInTheDocument();
      
      if (clearButton) {
        fireEvent.click(clearButton);
      }
    });
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /загрузить/i })).toBeDisabled();
    });
  });

  it('shows help text at the bottom', () => {
    render(<MediaUploadGroup {...defaultProps} />);
    
    expect(screen.getByText(/основное медиа обязательно/i)).toBeInTheDocument();
    expect(screen.getByText(/дополнительное медиа необязательно/i)).toBeInTheDocument();
    expect(screen.getByText(/для видео файлов обязательно загрузить постер/i)).toBeInTheDocument();
    expect(screen.getByText(/максимальный размер: изображения 2мб, видео 50мб/i)).toBeInTheDocument();
  });

  it('calls onUpload with FormData when upload button is clicked', async () => {
    render(<MediaUploadGroup {...defaultProps} />);
    
    const mainFileInput = screen.getAllByLabelText('Выберите файл')[0];
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    fireEvent.change(mainFileInput, { target: { files: [file] } });
    
    await waitFor(() => {
      const uploadButton = screen.getByRole('button', { name: /загрузить/i });
      expect(uploadButton).not.toBeDisabled();
      
      fireEvent.click(uploadButton);
    });
    
    await waitFor(() => {
      expect(mockOnUpload).toHaveBeenCalledTimes(1);
      expect(mockOnUpload).toHaveBeenCalledWith(
        expect.any(FormData),
        expect.any(Function)
      );
    });
  });

  it('shows initial data when provided', () => {
    const initialData = {
      mainFile: { path: '/test/main.jpg', type: 'image' as const, alt: 'Main image' },
      secondaryFile: { path: '/test/secondary.jpg', type: 'image' as const, alt: 'Secondary image' }
    };
    
    render(<MediaUploadGroup {...defaultProps} initialData={initialData} />);
    
    // Alt text inputs should be pre-filled
    expect(screen.getByDisplayValue('Main image')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Secondary image')).toBeInTheDocument();
  });
});