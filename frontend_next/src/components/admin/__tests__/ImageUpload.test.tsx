import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ImageUpload } from '../ImageUpload';

describe('ImageUpload', () => {
  const mockOnUpload = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with label', () => {
    render(<ImageUpload onUpload={mockOnUpload} label="Загрузить изображение" />);
    expect(screen.getByText('Загрузить изображение')).toBeInTheDocument();
  });

  it('shows file size limit information', () => {
    render(<ImageUpload onUpload={mockOnUpload} />);
    expect(screen.getByText(/Максимальный размер: 2\.0 МБ/)).toBeInTheDocument();
    expect(screen.getByText(/Форматы: JPG, PNG, WEBP/)).toBeInTheDocument();
  });

  it('validates file size', async () => {
    render(<ImageUpload onUpload={mockOnUpload} />);
    
    // Create a file larger than 2MB
    const largeFile = new File(['x'.repeat(3 * 1024 * 1024)], 'large.jpg', {
      type: 'image/jpeg'
    });
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    fireEvent.change(fileInput, { target: { files: [largeFile] } });
    
    await waitFor(() => {
      expect(screen.getByText(/Размер файла не должен превышать/)).toBeInTheDocument();
    });
    
    expect(mockOnUpload).not.toHaveBeenCalled();
  });

  it('validates file type', async () => {
    render(<ImageUpload onUpload={mockOnUpload} />);
    
    // Create an invalid file type
    const invalidFile = new File(['content'], 'document.pdf', {
      type: 'application/pdf'
    });
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    fireEvent.change(fileInput, { target: { files: [invalidFile] } });
    
    await waitFor(() => {
      expect(screen.getByText(/Неподдерживаемый тип файла/)).toBeInTheDocument();
    });
    
    expect(mockOnUpload).not.toHaveBeenCalled();
  });

  it('shows loading state during upload', async () => {
    mockOnUpload.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(<ImageUpload onUpload={mockOnUpload} />);
    
    const validFile = new File(['content'], 'image.jpg', {
      type: 'image/jpeg'
    });
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    fireEvent.change(fileInput, { target: { files: [validFile] } });
    
    await waitFor(() => {
      expect(screen.getByText('Загрузка...')).toBeInTheDocument();
    });
  });

  it('shows success message after upload', async () => {
    mockOnUpload.mockResolvedValue('path/to/image.jpg');
    
    render(<ImageUpload onUpload={mockOnUpload} />);
    
    const validFile = new File(['content'], 'image.jpg', {
      type: 'image/jpeg'
    });
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    fireEvent.change(fileInput, { target: { files: [validFile] } });
    
    await waitFor(() => {
      expect(screen.getByText('Изображение успешно загружено')).toBeInTheDocument();
    });
    
    expect(mockOnUpload).toHaveBeenCalledWith(validFile);
  });

  it('disables upload when disabled prop is true', () => {
    render(<ImageUpload onUpload={mockOnUpload} disabled={true} />);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('displays current image preview', () => {
    render(<ImageUpload onUpload={mockOnUpload} currentImage="/path/to/image.jpg" />);
    
    const image = screen.getByAltText('Preview');
    expect(image).toBeInTheDocument();
  });
});
