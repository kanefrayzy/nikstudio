import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { VideoUploadForm } from '@/components/admin/VideoUploadForm';

// Mock XMLHttpRequest for upload progress testing
class MockXMLHttpRequest {
  upload = {
    addEventListener: vi.fn(),
  };
  addEventListener = vi.fn();
  open = vi.fn();
  setRequestHeader = vi.fn();
  send = vi.fn();
  status = 200;
  responseText = '';
  timeout = 0;
  withCredentials = false;
}

global.XMLHttpRequest = MockXMLHttpRequest as any;

describe('VideoUploadForm', () => {
  const mockOnFileSelect = vi.fn();
  const mockOnUpload = vi.fn();
  const mockOnSuccess = vi.fn();
  const mockOnError = vi.fn();

  const defaultProps = {
    onFileSelect: mockOnFileSelect,
    onUpload: mockOnUpload,
    onSuccess: mockOnSuccess,
    onError: mockOnError,
    maxSize: 50 * 1024 * 1024, // 50MB
    acceptedFormats: ['video/mp4', 'video/webm', 'video/ogg'],
    loading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders file input with correct attributes', () => {
    render(<VideoUploadForm {...defaultProps} />);

    const fileInput = screen.getByLabelText(/выберите видео файл/i);
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveAttribute('type', 'file');
    expect(fileInput).toHaveAttribute('accept', 'video/*');
  });

  it('shows file size limit information', () => {
    render(<VideoUploadForm {...defaultProps} />);

    expect(screen.getByText(/максимальный размер: 50 mb/i)).toBeInTheDocument();
  });

  it('shows accepted formats information', () => {
    render(<VideoUploadForm {...defaultProps} />);

    expect(screen.getByText(/поддерживаемые форматы: mp4, webm, ogg/i)).toBeInTheDocument();
  });

  it('calls onFileSelect when file is selected', () => {
    render(<VideoUploadForm {...defaultProps} />);

    const file = new File(['video content'], 'test-video.mp4', { type: 'video/mp4' });
    const fileInput = screen.getByLabelText(/выберите видео файл/i);

    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(mockOnFileSelect).toHaveBeenCalledWith(file);
  });

  it('validates file size before calling onFileSelect', () => {
    render(<VideoUploadForm {...defaultProps} />);

    // Create a file that's too large (51MB)
    const largeFile = new File(['x'.repeat(51 * 1024 * 1024)], 'large-video.mp4', { type: 'video/mp4' });
    const fileInput = screen.getByLabelText(/выберите видео файл/i);

    fireEvent.change(fileInput, { target: { files: [largeFile] } });

    expect(mockOnFileSelect).not.toHaveBeenCalled();
    expect(mockOnError).toHaveBeenCalledWith('Размер файла превышает максимально допустимый (50 MB)');
  });

  it('validates file format before calling onFileSelect', () => {
    render(<VideoUploadForm {...defaultProps} />);

    const invalidFile = new File(['content'], 'document.txt', { type: 'text/plain' });
    const fileInput = screen.getByLabelText(/выберите видео файл/i);

    fireEvent.change(fileInput, { target: { files: [invalidFile] } });

    expect(mockOnFileSelect).not.toHaveBeenCalled();
    expect(mockOnError).toHaveBeenCalledWith('Неподдерживаемый формат файла. Разрешены: MP4, WebM, OGG');
  });

  it('shows upload button when file is selected', () => {
    const { rerender } = render(<VideoUploadForm {...defaultProps} />);

    // Initially no upload button
    expect(screen.queryByText(/загрузить видео/i)).not.toBeInTheDocument();

    // Select a file
    const file = new File(['video content'], 'test-video.mp4', { type: 'video/mp4' });
    const fileInput = screen.getByLabelText(/выберите видео файл/i);
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Re-render with selected file
    rerender(<VideoUploadForm {...defaultProps} selectedFile={file} />);

    expect(screen.getByText(/загрузить видео/i)).toBeInTheDocument();
  });

  it('disables upload button when loading', () => {
    const file = new File(['video content'], 'test-video.mp4', { type: 'video/mp4' });
    render(<VideoUploadForm {...defaultProps} loading={true} selectedFile={file} />);

    const uploadButton = screen.getByText(/загрузка.../i);
    expect(uploadButton).toBeInTheDocument();
    expect(uploadButton).toBeDisabled();
  });

  it('calls onUpload when upload button is clicked', () => {
    const file = new File(['video content'], 'test-video.mp4', { type: 'video/mp4' });
    render(<VideoUploadForm {...defaultProps} selectedFile={file} />);

    const uploadButton = screen.getByText(/загрузить видео/i);
    fireEvent.click(uploadButton);

    expect(mockOnUpload).toHaveBeenCalledWith(file);
  });

  it('supports drag and drop functionality', () => {
    render(<VideoUploadForm {...defaultProps} />);

    const dropZone = screen.getByText(/перетащите видео файл сюда/i).closest('div');
    expect(dropZone).toBeInTheDocument();

    const file = new File(['video content'], 'test-video.mp4', { type: 'video/mp4' });
    const dropEvent = new Event('drop', { bubbles: true });
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: {
        files: [file],
      },
    });

    fireEvent(dropZone!, dropEvent);

    expect(mockOnFileSelect).toHaveBeenCalledWith(file);
  });

  it('prevents default drag over behavior', () => {
    render(<VideoUploadForm {...defaultProps} />);

    const dropZone = screen.getByText(/перетащите видео файл сюда/i).closest('div');
    const dragOverEvent = new Event('dragover', { bubbles: true });
    const preventDefaultSpy = vi.spyOn(dragOverEvent, 'preventDefault');

    fireEvent(dropZone!, dragOverEvent);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('shows visual feedback during drag over', () => {
    render(<VideoUploadForm {...defaultProps} />);

    const dropZone = screen.getByText(/перетащите видео файл сюда/i).closest('div');

    // Simulate drag enter
    fireEvent.dragEnter(dropZone!);
    expect(dropZone).toHaveClass('border-primary');

    // Simulate drag leave
    fireEvent.dragLeave(dropZone!);
    expect(dropZone).not.toHaveClass('border-primary');
  });

  it('shows upload progress when provided', () => {
    const file = new File(['video content'], 'test-video.mp4', { type: 'video/mp4' });
    render(<VideoUploadForm {...defaultProps} selectedFile={file} uploadProgress={45} />);

    expect(screen.getByText('45%')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('formats file size correctly', () => {
    const file = new File(['x'.repeat(1024 * 1024)], 'test-video.mp4', { type: 'video/mp4' }); // 1MB
    render(<VideoUploadForm {...defaultProps} selectedFile={file} />);

    expect(screen.getByText(/1\.0 mb/i)).toBeInTheDocument();
  });

  it('handles empty file selection', () => {
    render(<VideoUploadForm {...defaultProps} />);

    const fileInput = screen.getByLabelText(/выберите видео файл/i);
    fireEvent.change(fileInput, { target: { files: [] } });

    expect(mockOnFileSelect).not.toHaveBeenCalled();
  });

  it('handles null file selection', () => {
    render(<VideoUploadForm {...defaultProps} />);

    const fileInput = screen.getByLabelText(/выберите видео файл/i);
    fireEvent.change(fileInput, { target: { files: null } });

    expect(mockOnFileSelect).not.toHaveBeenCalled();
  });

  it('clears file selection when clear button is clicked', () => {
    const file = new File(['video content'], 'test-video.mp4', { type: 'video/mp4' });
    const mockOnClear = vi.fn();
    render(<VideoUploadForm {...defaultProps} selectedFile={file} onClear={mockOnClear} />);

    const clearButton = screen.getByText(/очистить/i);
    fireEvent.click(clearButton);

    expect(mockOnClear).toHaveBeenCalled();
  });

  it('shows file information when file is selected', () => {
    const file = new File(['video content'], 'test-video.mp4', { type: 'video/mp4' });
    render(<VideoUploadForm {...defaultProps} selectedFile={file} />);

    expect(screen.getByText('test-video.mp4')).toBeInTheDocument();
    expect(screen.getByText(/размер:/i)).toBeInTheDocument();
  });

  it('handles multiple file selection by taking only the first file', () => {
    render(<VideoUploadForm {...defaultProps} />);

    const file1 = new File(['video content 1'], 'video1.mp4', { type: 'video/mp4' });
    const file2 = new File(['video content 2'], 'video2.mp4', { type: 'video/mp4' });
    const fileInput = screen.getByLabelText(/выберите видео файл/i);

    fireEvent.change(fileInput, { target: { files: [file1, file2] } });

    expect(mockOnFileSelect).toHaveBeenCalledWith(file1);
    expect(mockOnFileSelect).toHaveBeenCalledTimes(1);
  });

  it('validates file extension correctly', () => {
    render(<VideoUploadForm {...defaultProps} />);

    const fileWithWrongExtension = new File(['content'], 'video.mp4.txt', { type: 'video/mp4' });
    const fileInput = screen.getByLabelText(/выберите видео файл/i);

    fireEvent.change(fileInput, { target: { files: [fileWithWrongExtension] } });

    expect(mockOnFileSelect).not.toHaveBeenCalled();
    expect(mockOnError).toHaveBeenCalledWith('Неподдерживаемый формат файла. Разрешены: MP4, WebM, OGG');
  });

  it('handles drag and drop with invalid files', () => {
    render(<VideoUploadForm {...defaultProps} />);

    const dropZone = screen.getByText(/перетащите видео файл сюда/i).closest('div');
    const invalidFile = new File(['content'], 'document.txt', { type: 'text/plain' });
    
    const dropEvent = new Event('drop', { bubbles: true });
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: {
        files: [invalidFile],
      },
    });

    fireEvent(dropZone!, dropEvent);

    expect(mockOnFileSelect).not.toHaveBeenCalled();
    expect(mockOnError).toHaveBeenCalledWith('Неподдерживаемый формат файла. Разрешены: MP4, WebM, OGG');
  });

  it('shows error message when provided', () => {
    render(<VideoUploadForm {...defaultProps} error="Ошибка загрузки файла" />);

    expect(screen.getByText('Ошибка загрузки файла')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('shows success message when provided', () => {
    render(<VideoUploadForm {...defaultProps} success="Файл успешно загружен" />);

    expect(screen.getByText('Файл успешно загружен')).toBeInTheDocument();
  });

  it('handles keyboard navigation for file input', () => {
    render(<VideoUploadForm {...defaultProps} />);

    const fileInput = screen.getByLabelText(/выберите видео файл/i);
    
    // Test that file input is focusable
    fileInput.focus();
    expect(fileInput).toHaveFocus();

    // Test Enter key triggers file selection
    fireEvent.keyDown(fileInput, { key: 'Enter', code: 'Enter' });
    // Note: We can't easily test the actual file dialog opening in jsdom
  });

  it('handles accessibility attributes correctly', () => {
    render(<VideoUploadForm {...defaultProps} />);

    const fileInput = screen.getByLabelText(/выберите видео файл/i);
    expect(fileInput).toHaveAttribute('aria-describedby');

    const dropZone = screen.getByText(/перетащите видео файл сюда/i).closest('div');
    expect(dropZone).toHaveAttribute('role', 'button');
    expect(dropZone).toHaveAttribute('tabIndex', '0');
  });

  it('formats different file sizes correctly', () => {
    const testCases = [
      { size: 1024, expected: '1.0 KB' },
      { size: 1024 * 1024, expected: '1.0 MB' },
      { size: 1024 * 1024 * 1024, expected: '1.0 GB' },
      { size: 500, expected: '500 B' },
    ];

    testCases.forEach(({ size, expected }) => {
      const file = new File(['x'.repeat(size)], 'test.mp4', { type: 'video/mp4' });
      const { unmount } = render(<VideoUploadForm {...defaultProps} selectedFile={file} />);
      
      expect(screen.getByText(new RegExp(expected.replace('.', '\\.'), 'i'))).toBeInTheDocument();
      
      unmount();
    });
  });

  it('prevents form submission when Enter is pressed on upload button', () => {
    const file = new File(['video content'], 'test-video.mp4', { type: 'video/mp4' });
    render(<VideoUploadForm {...defaultProps} selectedFile={file} />);

    const uploadButton = screen.getByText(/загрузить видео/i);
    const keyDownEvent = new KeyboardEvent('keydown', { key: 'Enter' });
    const preventDefaultSpy = vi.spyOn(keyDownEvent, 'preventDefault');

    fireEvent(uploadButton, keyDownEvent);

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(mockOnUpload).toHaveBeenCalledWith(file);
  });
});