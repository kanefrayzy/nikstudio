import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { CompatibleImage } from '@/components/CompatibleImage';

// Mock the media compatibility functions
vi.mock('@/lib/media-compatibility', () => ({
  getOptimalImageFormat: vi.fn(),
  handleMediaError: vi.fn()
}));

vi.mock('@/lib/media-utils', () => ({
  getMediaUrl: vi.fn((path: string, fallback?: string) => path || fallback || '/placeholder.jpg')
}));

const { getOptimalImageFormat, handleMediaError } = await import('@/lib/media-compatibility');

describe('CompatibleImage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render image with string source', async () => {
    render(
      <CompatibleImage
        src="/test-image.jpg"
        alt="Test image"
      />
    );

    await waitFor(() => {
      const img = screen.getByAltText('Test image');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', '/test-image.jpg');
    });
  });

  it('should handle object source with multiple formats', async () => {
    const mockGetOptimalImageFormat = getOptimalImageFormat as any;
    mockGetOptimalImageFormat.mockResolvedValue('webp');

    const imageSources = {
      webp: '/test-image.webp',
      jpeg: '/test-image.jpg',
      png: '/test-image.png'
    };

    render(
      <CompatibleImage
        src={imageSources}
        alt="Test image"
      />
    );

    await waitFor(() => {
      expect(mockGetOptimalImageFormat).toHaveBeenCalledWith(['webp', 'jpeg', 'png']);
    });

    await waitFor(() => {
      const img = screen.getByAltText('Test image');
      expect(img).toHaveAttribute('src', '/test-image.webp');
    });
  });

  it('should show loading state initially', () => {
    render(
      <CompatibleImage
        src="/test-image.jpg"
        alt="Test image"
      />
    );

    const loadingElement = document.querySelector('.animate-pulse');
    expect(loadingElement).toBeInTheDocument();
  });

  it('should handle image load error with fallbacks', async () => {
    const mockHandleMediaError = handleMediaError as any;
    
    const imageSources = {
      webp: '/test-image.webp',
      jpeg: '/test-image.jpg'
    };

    render(
      <CompatibleImage
        src={imageSources}
        alt="Test image"
      />
    );

    const img = await screen.findByAltText('Test image');
    
    // Simulate error
    const errorEvent = new Event('error');
    img.dispatchEvent(errorEvent);

    await waitFor(() => {
      expect(mockHandleMediaError).toHaveBeenCalled();
    });
  });

  it('should show error message when all fallbacks fail', async () => {
    render(
      <CompatibleImage
        src="/nonexistent-image.jpg"
        alt="Test image"
        fallbackSrc="/placeholder.jpg"
      />
    );

    const img = await screen.findByAltText('Test image');
    
    // Simulate error on fallback
    Object.defineProperty(img, 'src', {
      value: '/placeholder.jpg',
      writable: true
    });
    
    const errorEvent = new Event('error');
    img.dispatchEvent(errorEvent);

    await waitFor(() => {
      expect(screen.getByText('Изображение недоступно')).toBeInTheDocument();
    });
  });

  it('should apply custom className', () => {
    render(
      <CompatibleImage
        src="/test-image.jpg"
        alt="Test image"
        className="custom-class"
      />
    );

    const container = document.querySelector('.custom-class');
    expect(container).toBeInTheDocument();
  });

  it('should set loading attribute based on priority', () => {
    const { rerender } = render(
      <CompatibleImage
        src="/test-image.jpg"
        alt="Test image"
        priority={true}
      />
    );

    let img = screen.getByAltText('Test image');
    expect(img).toHaveAttribute('loading', 'eager');

    rerender(
      <CompatibleImage
        src="/test-image.jpg"
        alt="Test image"
        priority={false}
      />
    );

    img = screen.getByAltText('Test image');
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('should call onLoad callback when image loads', async () => {
    const onLoadMock = vi.fn();

    render(
      <CompatibleImage
        src="/test-image.jpg"
        alt="Test image"
        onLoad={onLoadMock}
      />
    );

    const img = await screen.findByAltText('Test image');
    
    const loadEvent = new Event('load');
    img.dispatchEvent(loadEvent);

    expect(onLoadMock).toHaveBeenCalled();
  });

  it('should call onError callback when image fails to load', async () => {
    const onErrorMock = vi.fn();

    render(
      <CompatibleImage
        src="/nonexistent-image.jpg"
        alt="Test image"
        onError={onErrorMock}
        fallbackSrc="/placeholder.jpg"
      />
    );

    const img = await screen.findByAltText('Test image');
    
    // Set src to fallback to simulate final fallback failure
    Object.defineProperty(img, 'src', {
      value: '/placeholder.jpg',
      writable: true
    });
    
    const errorEvent = new Event('error');
    img.dispatchEvent(errorEvent);

    await waitFor(() => {
      expect(onErrorMock).toHaveBeenCalled();
    });
  });
});