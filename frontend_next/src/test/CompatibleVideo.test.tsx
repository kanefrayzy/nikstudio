import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { CompatibleVideo } from '@/components/CompatibleVideo';

// Mock the media compatibility functions
vi.mock('@/lib/media-compatibility', () => ({
  getSupportedVideoFormats: vi.fn(),
  getOptimalVideoFormat: vi.fn(),
  handleMediaError: vi.fn()
}));

vi.mock('@/lib/media-utils', () => ({
  getMediaUrl: vi.fn((path: string) => path || '/placeholder-video.mp4')
}));

const { getSupportedVideoFormats, getOptimalVideoFormat, handleMediaError } = await import('@/lib/media-compatibility');

describe('CompatibleVideo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    (getSupportedVideoFormats as any).mockReturnValue(['mp4', 'webm']);
    (getOptimalVideoFormat as any).mockReturnValue('mp4');
  });

  it('should render video with string source', async () => {
    render(
      <CompatibleVideo
        src="/test-video.mp4"
      />
    );

    await waitFor(() => {
      const video = screen.getByRole('application') || document.querySelector('video');
      expect(video).toBeInTheDocument();
    });
  });

  it('should handle object source with multiple formats', async () => {
    const mockGetOptimalVideoFormat = getOptimalVideoFormat as any;
    mockGetOptimalVideoFormat.mockReturnValue('webm');

    const videoSources = {
      webm: '/test-video.webm',
      mp4: '/test-video.mp4',
      ogg: '/test-video.ogg'
    };

    render(
      <CompatibleVideo
        src={videoSources}
      />
    );

    await waitFor(() => {
      expect(mockGetOptimalVideoFormat).toHaveBeenCalledWith(['webm', 'mp4', 'ogg']);
    });
  });

  it('should show loading state initially', () => {
    render(
      <CompatibleVideo
        src="/test-video.mp4"
      />
    );

    expect(screen.getByText('Загрузка видео...')).toBeInTheDocument();
  });

  it('should show fallback message when no formats are supported', async () => {
    (getSupportedVideoFormats as any).mockReturnValue([]);

    render(
      <CompatibleVideo
        src="/test-video.mp4"
        fallbackMessage="Custom fallback message"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Custom fallback message')).toBeInTheDocument();
    });
  });

  it('should create multiple source elements for object source', async () => {
    const videoSources = {
      webm: '/test-video.webm',
      mp4: '/test-video.mp4'
    };

    render(
      <CompatibleVideo
        src={videoSources}
      />
    );

    await waitFor(() => {
      const sources = document.querySelectorAll('source');
      expect(sources.length).toBeGreaterThan(0);
    });
  });

  it('should set video attributes correctly', async () => {
    render(
      <CompatibleVideo
        src="/test-video.mp4"
        poster="/test-poster.jpg"
        autoPlay={true}
        loop={true}
        muted={true}
        controls={false}
        playsInline={false}
        width={800}
        height={600}
      />
    );

    await waitFor(() => {
      const video = document.querySelector('video');
      expect(video).toHaveAttribute('poster', '/test-poster.jpg');
      expect(video).toHaveAttribute('autoplay');
      expect(video).toHaveAttribute('loop');
      expect(video).toHaveAttribute('muted');
      expect(video).not.toHaveAttribute('controls');
      expect(video).not.toHaveAttribute('playsinline');
      expect(video).toHaveAttribute('width', '800');
      expect(video).toHaveAttribute('height', '600');
    });
  });

  it('should handle video load error with fallbacks', async () => {
    const mockHandleMediaError = handleMediaError as any;
    
    const videoSources = {
      webm: '/test-video.webm',
      mp4: '/test-video.mp4'
    };

    render(
      <CompatibleVideo
        src={videoSources}
      />
    );

    await waitFor(() => {
      const video = document.querySelector('video');
      expect(video).toBeInTheDocument();
      
      // Simulate error
      const errorEvent = new Event('error');
      video?.dispatchEvent(errorEvent);
    });

    await waitFor(() => {
      expect(mockHandleMediaError).toHaveBeenCalled();
    });
  });

  it('should show error message when video fails to load', async () => {
    render(
      <CompatibleVideo
        src="/nonexistent-video.mp4"
      />
    );

    await waitFor(() => {
      const video = document.querySelector('video');
      
      // Simulate error
      const errorEvent = new Event('error');
      video?.dispatchEvent(errorEvent);
    });

    await waitFor(() => {
      expect(screen.getByText('Не удалось загрузить видео')).toBeInTheDocument();
    });
  });

  it('should call onLoad callback when video loads', async () => {
    const onLoadMock = vi.fn();

    render(
      <CompatibleVideo
        src="/test-video.mp4"
        onLoad={onLoadMock}
      />
    );

    await waitFor(() => {
      const video = document.querySelector('video');
      
      const loadEvent = new Event('loadeddata');
      video?.dispatchEvent(loadEvent);
    });

    expect(onLoadMock).toHaveBeenCalled();
  });

  it('should call onCanPlay callback when video can play', async () => {
    const onCanPlayMock = vi.fn();

    render(
      <CompatibleVideo
        src="/test-video.mp4"
        onCanPlay={onCanPlayMock}
      />
    );

    await waitFor(() => {
      const video = document.querySelector('video');
      
      const canPlayEvent = new Event('canplay');
      video?.dispatchEvent(canPlayEvent);
    });

    expect(onCanPlayMock).toHaveBeenCalled();
  });

  it('should apply custom className', () => {
    render(
      <CompatibleVideo
        src="/test-video.mp4"
        className="custom-video-class"
      />
    );

    const container = document.querySelector('.custom-video-class');
    expect(container).toBeInTheDocument();
  });

  it('should use first available format when no optimal format found', async () => {
    (getOptimalVideoFormat as any).mockReturnValue(null);

    const videoSources = {
      webm: '/test-video.webm',
      mp4: '/test-video.mp4'
    };

    render(
      <CompatibleVideo
        src={videoSources}
      />
    );

    // Should not throw error and should render video
    await waitFor(() => {
      const video = document.querySelector('video');
      expect(video).toBeInTheDocument();
    });
  });
});