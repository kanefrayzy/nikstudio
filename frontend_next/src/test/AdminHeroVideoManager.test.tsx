import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AdminHeroVideoManager } from '@/components/admin/AdminHeroVideoManager';

// Mock fetch globally
global.fetch = vi.fn();

// Mock environment variable
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:8000';

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

describe('AdminHeroVideoManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders video preview with hover controls when video exists', async () => {
    const mockVideoData = {
      success: true,
      data: {
        id: 1,
        hero_video_url: 'http://localhost:8000/storage/home/hero-videos/test-video.mp4',
        hero_video_original_name: 'test-video.mp4',
        hero_video_size: 10485760, // 10MB
        formatted_video_size: '10.0 MB',
        is_active: true,
        created_at: '2025-01-18T10:00:00.000000Z',
        updated_at: '2025-01-18T10:00:00.000000Z'
      }
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockVideoData
    });

    render(<AdminHeroVideoManager />);

    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText('Текущее героическое видео')).toBeInTheDocument();
    });

    // Check that video element is rendered
    const videoElement = screen.getByRole('application'); // video elements have application role
    expect(videoElement).toBeInTheDocument();

    // Check metadata display
    expect(screen.getByText('test-video.mp4')).toBeInTheDocument();
    expect(screen.getByText('10.0 MB')).toBeInTheDocument();
    expect(screen.getByText('MP4')).toBeInTheDocument();
    expect(screen.getByText('Активно')).toBeInTheDocument();
  });

  it('shows placeholder when no video is configured', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: null })
    });

    render(<AdminHeroVideoManager />);

    await waitFor(() => {
      expect(screen.getByText('Героическое видео не загружено')).toBeInTheDocument();
    });

    expect(screen.getByText('Загрузите видео, чтобы оно отображалось на главной странице')).toBeInTheDocument();
  });

  it('shows delete confirmation dialog when delete button is clicked', async () => {
    const mockVideoData = {
      success: true,
      data: {
        id: 1,
        hero_video_url: 'http://localhost:8000/storage/home/hero-videos/test-video.mp4',
        hero_video_original_name: 'test-video.mp4',
        hero_video_size: 10485760,
        formatted_video_size: '10.0 MB',
        is_active: true,
        created_at: '2025-01-18T10:00:00.000000Z',
        updated_at: '2025-01-18T10:00:00.000000Z'
      }
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockVideoData
    });

    render(<AdminHeroVideoManager />);

    await waitFor(() => {
      expect(screen.getByText('Удалить')).toBeInTheDocument();
    });

    // Click delete button
    fireEvent.click(screen.getByText('Удалить'));

    // Check that confirmation dialog appears
    expect(screen.getByText('Подтвердите удаление')).toBeInTheDocument();
    expect(screen.getByText('Это действие нельзя отменить. Героическое видео будет удалено навсегда.')).toBeInTheDocument();
  });

  it('formats video format correctly from filename', async () => {
    const mockVideoData = {
      success: true,
      data: {
        id: 1,
        hero_video_url: 'http://localhost:8000/storage/home/hero-videos/test-video.webm',
        hero_video_original_name: 'test-video.webm',
        hero_video_size: 5242880,
        formatted_video_size: '5.0 MB',
        is_active: true,
        created_at: '2025-01-18T10:00:00.000000Z',
        updated_at: '2025-01-18T10:00:00.000000Z'
      }
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockVideoData
    });

    render(<AdminHeroVideoManager />);

    await waitFor(() => {
      expect(screen.getByText('WEBM')).toBeInTheDocument();
    });
  });

  it('handles network errors gracefully', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    render(<AdminHeroVideoManager />);

    await waitFor(() => {
      expect(screen.getByText('Ошибка сети. Проверьте подключение к интернету')).toBeInTheDocument();
    });
  });

  it('handles 404 responses correctly', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found'
    });

    render(<AdminHeroVideoManager />);

    await waitFor(() => {
      expect(screen.getByText('Героическое видео не загружено')).toBeInTheDocument();
    });
  });

  it('retries failed requests up to maximum attempts', async () => {
    // Mock fetch to fail twice, then succeed
    (global.fetch as any)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: null })
      });

    render(<AdminHeroVideoManager />);

    // Should eventually show the no video message after retries
    await waitFor(() => {
      expect(screen.getByText('Героическое видео не загружено')).toBeInTheDocument();
    }, { timeout: 10000 });

    // Verify fetch was called multiple times
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it('handles successful video deletion', async () => {
    const mockVideoData = {
      success: true,
      data: {
        id: 1,
        hero_video_url: 'http://localhost:8000/storage/home/hero-videos/test-video.mp4',
        hero_video_original_name: 'test-video.mp4',
        hero_video_size: 10485760,
        formatted_video_size: '10.0 MB',
        is_active: true,
        created_at: '2025-01-18T10:00:00.000000Z',
        updated_at: '2025-01-18T10:00:00.000000Z'
      }
    };

    // Mock initial fetch and delete response
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockVideoData
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Видео успешно удалено!' })
      });

    render(<AdminHeroVideoManager />);

    // Wait for video to load
    await waitFor(() => {
      expect(screen.getByText('Удалить')).toBeInTheDocument();
    });

    // Click delete button
    fireEvent.click(screen.getByText('Удалить'));

    // Confirm deletion
    await waitFor(() => {
      expect(screen.getByText('Подтвердите удаление')).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole('button', { name: /удалить/i });
    fireEvent.click(confirmButton);

    // Should show success message
    await waitFor(() => {
      expect(screen.getByText('Видео успешно удалено!')).toBeInTheDocument();
    });
  });

  it('handles video deletion errors', async () => {
    const mockVideoData = {
      success: true,
      data: {
        id: 1,
        hero_video_url: 'http://localhost:8000/storage/home/hero-videos/test-video.mp4',
        hero_video_original_name: 'test-video.mp4',
        hero_video_size: 10485760,
        formatted_video_size: '10.0 MB',
        is_active: true,
        created_at: '2025-01-18T10:00:00.000000Z',
        updated_at: '2025-01-18T10:00:00.000000Z'
      }
    };

    // Mock initial fetch and failed delete response
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockVideoData
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ success: false, message: 'Ошибка при удалении видео' })
      });

    render(<AdminHeroVideoManager />);

    // Wait for video to load
    await waitFor(() => {
      expect(screen.getByText('Удалить')).toBeInTheDocument();
    });

    // Click delete button
    fireEvent.click(screen.getByText('Удалить'));

    // Confirm deletion
    await waitFor(() => {
      expect(screen.getByText('Подтвердите удаление')).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole('button', { name: /удалить/i });
    fireEvent.click(confirmButton);

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText('Ошибка при удалении видео')).toBeInTheDocument();
    });
  });

  it('formats file sizes correctly', async () => {
    const testCases = [
      { size: 1024, expected: '1.0 KB' },
      { size: 1048576, expected: '1.0 MB' },
      { size: 2621440, expected: '2.5 MB' },
      { size: 52428800, expected: '50.0 MB' }
    ];

    for (const { size, expected } of testCases) {
      const mockVideoData = {
        success: true,
        data: {
          id: 1,
          hero_video_url: 'http://localhost:8000/storage/home/hero-videos/test-video.mp4',
          hero_video_original_name: 'test-video.mp4',
          hero_video_size: size,
          formatted_video_size: expected,
          is_active: true,
          created_at: '2025-01-18T10:00:00.000000Z',
          updated_at: '2025-01-18T10:00:00.000000Z'
        }
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockVideoData
      });

      const { unmount } = render(<AdminHeroVideoManager />);

      await waitFor(() => {
        expect(screen.getByText(expected)).toBeInTheDocument();
      });

      unmount();
      vi.clearAllMocks();
    }
  });

  it('displays formatted dates correctly', async () => {
    const mockVideoData = {
      success: true,
      data: {
        id: 1,
        hero_video_url: 'http://localhost:8000/storage/home/hero-videos/test-video.mp4',
        hero_video_original_name: 'test-video.mp4',
        hero_video_size: 10485760,
        formatted_video_size: '10.0 MB',
        is_active: true,
        created_at: '2025-01-18T10:00:00.000000Z',
        updated_at: '2025-01-18T15:30:00.000000Z'
      }
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockVideoData
    });

    render(<AdminHeroVideoManager />);

    await waitFor(() => {
      // Check that dates are formatted (exact format may vary by locale)
      expect(screen.getByText(/18 января 2025/)).toBeInTheDocument();
    });
  });

  it('handles video hover controls', async () => {
    const mockVideoData = {
      success: true,
      data: {
        id: 1,
        hero_video_url: 'http://localhost:8000/storage/home/hero-videos/test-video.mp4',
        hero_video_original_name: 'test-video.mp4',
        hero_video_size: 10485760,
        formatted_video_size: '10.0 MB',
        is_active: true,
        created_at: '2025-01-18T10:00:00.000000Z',
        updated_at: '2025-01-18T10:00:00.000000Z'
      }
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockVideoData
    });

    render(<AdminHeroVideoManager />);

    await waitFor(() => {
      expect(screen.getByText('test-video.mp4')).toBeInTheDocument();
    });

    const videoContainer = screen.getByText('Наведите курсор для управления воспроизведением').closest('div');
    expect(videoContainer).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    // Mock fetch to never resolve to test loading state
    (global.fetch as any).mockImplementation(() => new Promise(() => {}));

    render(<AdminHeroVideoManager />);

    expect(screen.getByText('Загрузка...')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument(); // Loading spinner
  });

  it('clears success messages after timeout', async () => {
    vi.useFakeTimers();

    const mockVideoData = {
      success: true,
      data: {
        id: 1,
        hero_video_url: 'http://localhost:8000/storage/home/hero-videos/test-video.mp4',
        hero_video_original_name: 'test-video.mp4',
        hero_video_size: 10485760,
        formatted_video_size: '10.0 MB',
        is_active: true,
        created_at: '2025-01-18T10:00:00.000000Z',
        updated_at: '2025-01-18T10:00:00.000000Z'
      }
    };

    // Mock successful deletion
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockVideoData
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Видео успешно удалено!' })
      });

    render(<AdminHeroVideoManager />);

    // Wait for video to load and perform deletion
    await waitFor(() => {
      expect(screen.getByText('Удалить')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Удалить'));

    await waitFor(() => {
      expect(screen.getByText('Подтвердите удаление')).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole('button', { name: /удалить/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText('Видео успешно удалено!')).toBeInTheDocument();
    });

    // Fast-forward time by 3 seconds
    vi.advanceTimersByTime(3000);

    await waitFor(() => {
      expect(screen.queryByText('Видео успешно удалено!')).not.toBeInTheDocument();
    });

    vi.useRealTimers();
  });

  it('handles unknown video formats gracefully', async () => {
    const mockVideoData = {
      success: true,
      data: {
        id: 1,
        hero_video_url: 'http://localhost:8000/storage/home/hero-videos/test-video.unknown',
        hero_video_original_name: 'test-video.unknown',
        hero_video_size: 10485760,
        formatted_video_size: '10.0 MB',
        is_active: true,
        created_at: '2025-01-18T10:00:00.000000Z',
        updated_at: '2025-01-18T10:00:00.000000Z'
      }
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockVideoData
    });

    render(<AdminHeroVideoManager />);

    await waitFor(() => {
      expect(screen.getByText('Неизвестно')).toBeInTheDocument();
    });
  });

  it('handles missing video metadata gracefully', async () => {
    const mockVideoData = {
      success: true,
      data: {
        id: 1,
        hero_video_url: 'http://localhost:8000/storage/home/hero-videos/test-video.mp4',
        hero_video_original_name: null,
        hero_video_size: null,
        formatted_video_size: null,
        is_active: true,
        created_at: '2025-01-18T10:00:00.000000Z',
        updated_at: '2025-01-18T10:00:00.000000Z'
      }
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockVideoData
    });

    render(<AdminHeroVideoManager />);

    await waitFor(() => {
      expect(screen.getByText('Неизвестно')).toBeInTheDocument(); // For filename
      expect(screen.getByText('Неизвестно')).toBeInTheDocument(); // For size
      expect(screen.getByText('Неизвестно')).toBeInTheDocument(); // For format
    });
  });
});