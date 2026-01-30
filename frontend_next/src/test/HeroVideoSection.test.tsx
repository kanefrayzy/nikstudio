import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import HeroVideoSection from '@/components/HeroVideoSection';

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} {...props} />
  ),
}));

describe('HeroVideoSection', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
  });

  it('renders fallback image when no video URL is provided', () => {
    render(<HeroVideoSection />);
    
    const image = screen.getByAltText('Hero Image');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/images/home/hero-image.png');
  });

  it('renders fallback image with custom fallback URL', () => {
    const customFallback = '/custom-fallback.jpg';
    render(<HeroVideoSection fallbackImage={customFallback} />);
    
    const image = screen.getByAltText('Hero Image');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', customFallback);
  });

  it('renders video element when video URL is provided', () => {
    const videoUrl = 'https://example.com/video.mp4';
    render(<HeroVideoSection videoUrl={videoUrl} />);
    
    const video = screen.getByRole('video', { hidden: true });
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute('autoplay');
    expect(video).toHaveAttribute('muted');
    expect(video).toHaveAttribute('loop');
    expect(video).toHaveAttribute('playsinline');
  });

  it('shows loading fallback image while video is loading', () => {
    const videoUrl = 'https://example.com/video.mp4';
    render(<HeroVideoSection videoUrl={videoUrl} />);
    
    // Should show loading fallback image initially
    const loadingImage = screen.getByAltText('Hero Image Loading');
    expect(loadingImage).toBeInTheDocument();
  });

  it('falls back to image when video fails to load', async () => {
    const videoUrl = 'https://example.com/broken-video.mp4';
    render(<HeroVideoSection videoUrl={videoUrl} />);
    
    const video = screen.getByRole('video', { hidden: true });
    
    // Simulate video error
    fireEvent.error(video);
    
    await waitFor(() => {
      const fallbackImage = screen.getByAltText('Hero Image');
      expect(fallbackImage).toBeInTheDocument();
    });
  });

  it('applies custom className', () => {
    const customClass = 'custom-hero-class';
    render(<HeroVideoSection className={customClass} />);
    
    const container = screen.getByAltText('Hero Image').closest('div');
    expect(container).toHaveClass(customClass);
  });

  it('includes multiple video source formats', () => {
    const videoUrl = 'https://example.com/video.mp4';
    render(<HeroVideoSection videoUrl={videoUrl} />);
    
    const sources = screen.getAllByRole('video', { hidden: true })[0].querySelectorAll('source');
    expect(sources).toHaveLength(3);
    expect(sources[0]).toHaveAttribute('type', 'video/mp4');
    expect(sources[1]).toHaveAttribute('type', 'video/webm');
    expect(sources[2]).toHaveAttribute('type', 'video/ogg');
  });
});