/**
 * Responsive Design Compatibility System
 * Handles viewport, media queries, touch interactions, and responsive images
 */

export interface ViewportConfig {
  width: string;
  height: string;
  initialScale: number;
  minimumScale: number;
  maximumScale: number;
  userScalable: boolean;
  viewportFit: 'auto' | 'contain' | 'cover';
}

export interface ResponsiveBreakpoints {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

export interface TouchCapabilities {
  touchEvents: boolean;
  pointerEvents: boolean;
  hoverSupport: boolean;
  finePointer: boolean;
  coarsePointer: boolean;
}

/**
 * Responsive Design Compatibility Manager
 */
class ResponsiveCompatibilityManager {
  private isServer = typeof window === 'undefined';
  private breakpoints: ResponsiveBreakpoints = {
    xs: 0,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    xxl: 1536
  };

  /**
   * Set up viewport meta tag for consistent mobile rendering
   */
  setupViewport(config: Partial<ViewportConfig> = {}): void {
    if (this.isServer) return;

    const defaultConfig: ViewportConfig = {
      width: 'device-width',
      height: 'device-height',
      initialScale: 1.0,
      minimumScale: 1.0,
      maximumScale: 5.0,
      userScalable: true,
      viewportFit: 'cover'
    };

    const finalConfig = { ...defaultConfig, ...config };
    
    // Remove existing viewport meta tag
    const existingViewport = document.querySelector('meta[name="viewport"]');
    if (existingViewport) {
      existingViewport.remove();
    }

    // Create new viewport meta tag
    const viewportMeta = document.createElement('meta');
    viewportMeta.name = 'viewport';
    
    const contentParts = [
      `width=${finalConfig.width}`,
      `height=${finalConfig.height}`,
      `initial-scale=${finalConfig.initialScale}`,
      `minimum-scale=${finalConfig.minimumScale}`,
      `maximum-scale=${finalConfig.maximumScale}`,
      `user-scalable=${finalConfig.userScalable ? 'yes' : 'no'}`,
      `viewport-fit=${finalConfig.viewportFit}`
    ];
    
    viewportMeta.content = contentParts.join(', ');
    document.head.appendChild(viewportMeta);

    // Add iOS-specific meta tags for better mobile experience
    this.setupIOSMetaTags();
  }

  /**
   * Set up iOS-specific meta tags
   */
  private setupIOSMetaTags(): void {
    if (this.isServer) return;

    const iosTags = [
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
      { name: 'apple-touch-fullscreen', content: 'yes' },
      { name: 'format-detection', content: 'telephone=no' },
      { name: 'msapplication-tap-highlight', content: 'no' }
    ];

    iosTags.forEach(tag => {
      const existing = document.querySelector(`meta[name="${tag.name}"]`);
      if (!existing) {
        const meta = document.createElement('meta');
        meta.name = tag.name;
        meta.content = tag.content;
        document.head.appendChild(meta);
      }
    });
  }

  /**
   * Detect touch capabilities
   */
  detectTouchCapabilities(): TouchCapabilities {
    if (this.isServer || typeof window === 'undefined') {
      return {
        touchEvents: false,
        pointerEvents: false,
        hoverSupport: false,
        finePointer: false,
        coarsePointer: false
      };
    }

    try {
      return {
        touchEvents: 'ontouchstart' in window || (navigator && navigator.maxTouchPoints > 0),
        pointerEvents: 'onpointerdown' in window,
        hoverSupport: window.matchMedia ? window.matchMedia('(hover: hover)').matches : false,
        finePointer: window.matchMedia ? window.matchMedia('(pointer: fine)').matches : false,
        coarsePointer: window.matchMedia ? window.matchMedia('(pointer: coarse)').matches : false
      };
    } catch {
      return {
        touchEvents: false,
        pointerEvents: false,
        hoverSupport: false,
        finePointer: false,
        coarsePointer: false
      };
    }
  }

  /**
   * Get current breakpoint
   */
  getCurrentBreakpoint(): keyof ResponsiveBreakpoints {
    if (this.isServer || typeof window === 'undefined') return 'md';

    const width = window.innerWidth;
    
    if (width >= this.breakpoints.xxl) return 'xxl';
    if (width >= this.breakpoints.xl) return 'xl';
    if (width >= this.breakpoints.lg) return 'lg';
    if (width >= this.breakpoints.md) return 'md';
    if (width >= this.breakpoints.sm) return 'sm';
    return 'xs';
  }

  /**
   * Check if current viewport matches breakpoint
   */
  matchesBreakpoint(breakpoint: keyof ResponsiveBreakpoints): boolean {
    if (this.isServer || typeof window === 'undefined') return false;
    
    const width = window.innerWidth;
    return width >= this.breakpoints[breakpoint];
  }

  /**
   * Add responsive classes to document
   */
  addResponsiveClasses(): void {
    if (this.isServer) return;

    const html = document.documentElement;
    const currentBreakpoint = this.getCurrentBreakpoint();
    const touchCapabilities = this.detectTouchCapabilities();

    // Remove existing responsive classes
    html.classList.remove('xs', 'sm', 'md', 'lg', 'xl', 'xxl');
    html.classList.remove('touch', 'no-touch', 'hover', 'no-hover');
    html.classList.remove('fine-pointer', 'coarse-pointer');

    // Add current breakpoint class
    html.classList.add(currentBreakpoint);

    // Add touch capability classes
    html.classList.add(touchCapabilities.touchEvents ? 'touch' : 'no-touch');
    html.classList.add(touchCapabilities.hoverSupport ? 'hover' : 'no-hover');
    html.classList.add(touchCapabilities.finePointer ? 'fine-pointer' : 'coarse-pointer');
  }

  /**
   * Set up responsive event listeners
   */
  setupResponsiveListeners(): void {
    if (this.isServer) return;

    // Update classes on resize
    const handleResize = () => {
      this.addResponsiveClasses();
    };

    // Update classes on orientation change
    const handleOrientationChange = () => {
      // Delay to ensure dimensions are updated
      setTimeout(() => {
        this.addResponsiveClasses();
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    // Initial setup
    this.addResponsiveClasses();
  }

  /**
   * Create responsive image with srcset fallbacks
   */
  createResponsiveImage(config: {
    src: string;
    alt: string;
    sizes?: string;
    srcset?: string;
    loading?: 'lazy' | 'eager';
    className?: string;
  }): HTMLImageElement {
    const img = document.createElement('img');
    
    img.src = config.src;
    img.alt = config.alt;
    
    if (config.srcset) {
      img.srcset = config.srcset;
    }
    
    if (config.sizes) {
      img.sizes = config.sizes;
    }
    
    if (config.loading) {
      img.loading = config.loading;
    }
    
    if (config.className) {
      img.className = config.className;
    }

    // Add fallback for browsers that don't support srcset
    if (config.srcset && !img.srcset) {
      // Use the first image in srcset as fallback
      const firstSrc = config.srcset.split(',')[0].trim().split(' ')[0];
      img.src = firstSrc;
    }

    return img;
  }

  /**
   * Set up touch-friendly interactions
   */
  setupTouchInteractions(): void {
    if (this.isServer) return;

    const touchCapabilities = this.detectTouchCapabilities();

    if (touchCapabilities.touchEvents) {
      // Add touch-specific styles
      const style = document.createElement('style');
      style.textContent = `
        /* Touch-friendly button sizes */
        .touch button,
        .touch .btn,
        .touch input[type="button"],
        .touch input[type="submit"] {
          min-height: 44px;
          min-width: 44px;
          padding: 12px 16px;
        }

        /* Touch-friendly form inputs */
        .touch input,
        .touch textarea,
        .touch select {
          min-height: 44px;
          padding: 12px;
          font-size: 16px; /* Prevents zoom on iOS */
        }

        /* Touch-friendly links */
        .touch a {
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          padding: 8px;
        }

        /* Remove hover effects on touch devices */
        .touch *:hover {
          background-color: inherit !important;
          color: inherit !important;
        }

        /* Add active states for touch feedback */
        .touch button:active,
        .touch .btn:active {
          transform: scale(0.98);
          opacity: 0.8;
        }
      `;
      document.head.appendChild(style);
    }

    // Set up touch event handling
    this.setupTouchEventHandling();
  }

  /**
   * Set up touch event handling
   */
  private setupTouchEventHandling(): void {
    if (this.isServer) return;

    // Prevent double-tap zoom on buttons
    document.addEventListener('touchend', (e) => {
      const target = e.target as HTMLElement;
      if (target.matches('button, .btn, input[type="button"], input[type="submit"]')) {
        e.preventDefault();
        target.click();
      }
    });

    // Handle touch scrolling momentum on iOS
    document.addEventListener('touchstart', (e) => {
      const target = e.target as HTMLElement;
      const scrollableParent = this.findScrollableParent(target);
      
      if (scrollableParent) {
        const isAtTop = scrollableParent.scrollTop === 0;
        const isAtBottom = scrollableParent.scrollTop >= 
          scrollableParent.scrollHeight - scrollableParent.clientHeight;
        
        if (isAtTop) {
          scrollableParent.scrollTop = 1;
        } else if (isAtBottom) {
          scrollableParent.scrollTop = 
            scrollableParent.scrollHeight - scrollableParent.clientHeight - 1;
        }
      }
    });
  }

  /**
   * Find scrollable parent element
   */
  private findScrollableParent(element: HTMLElement): HTMLElement | null {
    if (!element || element === document.body) return null;

    const style = window.getComputedStyle(element);
    const isScrollable = /(auto|scroll)/.test(
      style.overflow + style.overflowY + style.overflowX
    );

    if (isScrollable && element.scrollHeight > element.clientHeight) {
      return element;
    }

    return this.findScrollableParent(element.parentElement!);
  }

  /**
   * Create media query with fallbacks
   */
  createMediaQuery(query: string, callback: (matches: boolean) => void): MediaQueryList | null {
    if (this.isServer || typeof window === 'undefined' || !window.matchMedia) return null;

    try {
      const mediaQuery = window.matchMedia(query);
      
      // Modern event listener
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', (e) => callback(e.matches));
      } 
      // Legacy event listener
      else if (mediaQuery.addListener) {
        mediaQuery.addListener((e) => callback(e.matches));
      }

      // Initial call
      callback(mediaQuery.matches);
      
      return mediaQuery;
    } catch {
      console.warn('Media query not supported:', query);
      return null;
    }
  }

  /**
   * Get responsive image srcset
   */
  generateSrcSet(basePath: string, sizes: number[]): string {
    return sizes
      .map(size => `${basePath}?w=${size} ${size}w`)
      .join(', ');
  }

  /**
   * Get responsive image sizes attribute
   */
  generateSizes(breakpoints: { [key: string]: string }): string {
    const entries = Object.entries(breakpoints);
    const mediaQueries = entries
      .slice(0, -1)
      .map(([breakpoint, size]) => `(min-width: ${this.breakpoints[breakpoint as keyof ResponsiveBreakpoints]}px) ${size}`)
      .join(', ');
    
    const defaultSize = entries[entries.length - 1][1];
    return mediaQueries ? `${mediaQueries}, ${defaultSize}` : defaultSize;
  }
}

// Export singleton instance
export const responsiveCompatibility = new ResponsiveCompatibilityManager();

/**
 * React hook for responsive design compatibility
 */
export function useResponsiveCompatibility() {
  const [breakpoint, setBreakpoint] = React.useState<keyof ResponsiveBreakpoints>('md');
  const [touchCapabilities, setTouchCapabilities] = React.useState<TouchCapabilities | null>(null);

  React.useEffect(() => {
    // Initial setup
    responsiveCompatibility.setupViewport();
    responsiveCompatibility.setupResponsiveListeners();
    responsiveCompatibility.setupTouchInteractions();

    // Set initial state
    setBreakpoint(responsiveCompatibility.getCurrentBreakpoint());
    setTouchCapabilities(responsiveCompatibility.detectTouchCapabilities());

    // Set up resize listener
    const handleResize = () => {
      setBreakpoint(responsiveCompatibility.getCurrentBreakpoint());
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return {
    breakpoint,
    touchCapabilities,
    matchesBreakpoint: responsiveCompatibility.matchesBreakpoint.bind(responsiveCompatibility),
    createMediaQuery: responsiveCompatibility.createMediaQuery.bind(responsiveCompatibility),
    generateSrcSet: responsiveCompatibility.generateSrcSet.bind(responsiveCompatibility),
    generateSizes: responsiveCompatibility.generateSizes.bind(responsiveCompatibility)
  };
}

/**
 * Responsive Image Component Helper
 */
export class ResponsiveImageHelper {
  static create(config: {
    src: string;
    alt: string;
    breakpoints?: { [key: string]: number };
    sizes?: { [key: string]: string };
    loading?: 'lazy' | 'eager';
    className?: string;
  }): HTMLImageElement {
    const defaultBreakpoints = [320, 640, 768, 1024, 1280, 1920];
    const breakpoints = config.breakpoints ? Object.values(config.breakpoints) : defaultBreakpoints;
    
    const srcset = responsiveCompatibility.generateSrcSet(config.src, breakpoints);
    const sizes = config.sizes ? 
      responsiveCompatibility.generateSizes(config.sizes) : 
      '100vw';

    return responsiveCompatibility.createResponsiveImage({
      src: config.src,
      alt: config.alt,
      srcset,
      sizes,
      loading: config.loading || 'lazy',
      className: config.className
    });
  }

  static createPicture(config: {
    sources: Array<{
      media: string;
      srcset: string;
      type?: string;
    }>;
    fallback: {
      src: string;
      alt: string;
    };
    className?: string;
  }): HTMLPictureElement {
    const picture = document.createElement('picture');
    
    if (config.className) {
      picture.className = config.className;
    }

    // Add source elements
    config.sources.forEach(source => {
      const sourceElement = document.createElement('source');
      sourceElement.media = source.media;
      sourceElement.srcset = source.srcset;
      
      if (source.type) {
        sourceElement.type = source.type;
      }
      
      picture.appendChild(sourceElement);
    });

    // Add fallback img
    const img = document.createElement('img');
    img.src = config.fallback.src;
    img.alt = config.fallback.alt;
    picture.appendChild(img);

    return picture;
  }
}

// Import React for the hook
import React from 'react';