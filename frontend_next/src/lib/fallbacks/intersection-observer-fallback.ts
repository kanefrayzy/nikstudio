/**
 * IntersectionObserver Fallback Implementation
 * Provides scroll-based fallback for IntersectionObserver API
 */

interface IntersectionObserverEntry {
  target: Element;
  isIntersecting: boolean;
  intersectionRatio: number;
  boundingClientRect: DOMRect;
  rootBounds: DOMRect | null;
  intersectionRect: DOMRect;
  time: number;
}

interface IntersectionObserverInit {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
}

type IntersectionObserverCallback = (
  entries: IntersectionObserverEntry[],
  observer: IntersectionObserver
) => void;

/**
 * Fallback IntersectionObserver implementation using scroll events
 */
class IntersectionObserverFallback {
  private callback: IntersectionObserverCallback;
  private options: IntersectionObserverInit;
  private observedElements: Map<Element, boolean> = new Map();
  private scrollHandler: () => void;
  private resizeHandler: () => void;
  private isObserving = false;

  constructor(callback: IntersectionObserverCallback, options: IntersectionObserverInit = {}) {
    this.callback = callback;
    this.options = {
      root: options.root || null,
      rootMargin: options.rootMargin || '0px',
      threshold: options.threshold || 0
    };

    this.scrollHandler = this.throttle(this.checkIntersections.bind(this), 100);
    this.resizeHandler = this.throttle(this.checkIntersections.bind(this), 250);
  }

  observe(element: Element): void {
    if (!this.observedElements.has(element)) {
      this.observedElements.set(element, false);
      
      if (!this.isObserving) {
        this.startObserving();
      }
      
      // Check immediately
      setTimeout(() => this.checkIntersections(), 0);
    }
  }

  unobserve(element: Element): void {
    this.observedElements.delete(element);
    
    if (this.observedElements.size === 0) {
      this.stopObserving();
    }
  }

  disconnect(): void {
    this.observedElements.clear();
    this.stopObserving();
  }

  private startObserving(): void {
    if (this.isObserving) return;
    
    this.isObserving = true;
    const root = this.options.root || window;
    
    root.addEventListener('scroll', this.scrollHandler, { passive: true });
    window.addEventListener('resize', this.resizeHandler, { passive: true });
  }

  private stopObserving(): void {
    if (!this.isObserving) return;
    
    this.isObserving = false;
    const root = this.options.root || window;
    
    root.removeEventListener('scroll', this.scrollHandler);
    window.removeEventListener('resize', this.resizeHandler);
  }

  private checkIntersections(): void {
    const entries: IntersectionObserverEntry[] = [];
    const rootBounds = this.getRootBounds();

    this.observedElements.forEach((wasIntersecting, element) => {
      const elementBounds = element.getBoundingClientRect();
      const isIntersecting = this.isElementIntersecting(elementBounds, rootBounds);
      
      // Only trigger callback if intersection state changed
      if (isIntersecting !== wasIntersecting) {
        this.observedElements.set(element, isIntersecting);
        
        const intersectionRect = this.calculateIntersectionRect(elementBounds, rootBounds);
        const intersectionRatio = this.calculateIntersectionRatio(elementBounds, intersectionRect);
        
        entries.push({
          target: element,
          isIntersecting,
          intersectionRatio,
          boundingClientRect: elementBounds,
          rootBounds,
          intersectionRect,
          time: Date.now()
        });
      }
    });

    if (entries.length > 0) {
      this.callback(entries, this as any);
    }
  }

  private getRootBounds(): DOMRect {
    if (this.options.root) {
      return this.options.root.getBoundingClientRect();
    }
    
    return new DOMRect(0, 0, window.innerWidth, window.innerHeight);
  }

  private isElementIntersecting(elementBounds: DOMRect, rootBounds: DOMRect): boolean {
    const margin = this.parseRootMargin();
    
    const rootTop = rootBounds.top - margin.top;
    const rootBottom = rootBounds.bottom + margin.bottom;
    const rootLeft = rootBounds.left - margin.left;
    const rootRight = rootBounds.right + margin.right;
    
    return !(
      elementBounds.bottom < rootTop ||
      elementBounds.top > rootBottom ||
      elementBounds.right < rootLeft ||
      elementBounds.left > rootRight
    );
  }

  private calculateIntersectionRect(elementBounds: DOMRect, rootBounds: DOMRect): DOMRect {
    const margin = this.parseRootMargin();
    
    const rootTop = rootBounds.top - margin.top;
    const rootBottom = rootBounds.bottom + margin.bottom;
    const rootLeft = rootBounds.left - margin.left;
    const rootRight = rootBounds.right + margin.right;
    
    const left = Math.max(elementBounds.left, rootLeft);
    const top = Math.max(elementBounds.top, rootTop);
    const right = Math.min(elementBounds.right, rootRight);
    const bottom = Math.min(elementBounds.bottom, rootBottom);
    
    const width = Math.max(0, right - left);
    const height = Math.max(0, bottom - top);
    
    return new DOMRect(left, top, width, height);
  }

  private calculateIntersectionRatio(elementBounds: DOMRect, intersectionRect: DOMRect): number {
    const elementArea = elementBounds.width * elementBounds.height;
    const intersectionArea = intersectionRect.width * intersectionRect.height;
    
    return elementArea > 0 ? intersectionArea / elementArea : 0;
  }

  private parseRootMargin(): { top: number; right: number; bottom: number; left: number } {
    const margin = this.options.rootMargin || '0px';
    const values = margin.split(/\s+/).map(value => {
      const num = parseFloat(value);
      return isNaN(num) ? 0 : num;
    });
    
    switch (values.length) {
      case 1:
        return { top: values[0], right: values[0], bottom: values[0], left: values[0] };
      case 2:
        return { top: values[0], right: values[1], bottom: values[0], left: values[1] };
      case 3:
        return { top: values[0], right: values[1], bottom: values[2], left: values[1] };
      case 4:
        return { top: values[0], right: values[1], bottom: values[2], left: values[3] };
      default:
        return { top: 0, right: 0, bottom: 0, left: 0 };
    }
  }

  private throttle<T extends (...args: any[]) => void>(func: T, delay: number): T {
    let timeoutId: NodeJS.Timeout | null = null;
    let lastExecTime = 0;
    
    return ((...args: any[]) => {
      const currentTime = Date.now();
      
      if (currentTime - lastExecTime > delay) {
        func(...args);
        lastExecTime = currentTime;
      } else {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        
        timeoutId = setTimeout(() => {
          func(...args);
          lastExecTime = Date.now();
          timeoutId = null;
        }, delay - (currentTime - lastExecTime));
      }
    }) as T;
  }
}

/**
 * Apply IntersectionObserver fallback
 */
export function applyIntersectionObserverFallback(): void {
  if (typeof window === 'undefined' || 'IntersectionObserver' in window) {
    return;
  }

  (window as any).IntersectionObserver = IntersectionObserverFallback;
  
  console.log('IntersectionObserver fallback applied using scroll events');
}

/**
 * Check if IntersectionObserver is available
 */
export function isIntersectionObserverAvailable(): boolean {
  return typeof window !== 'undefined' && 'IntersectionObserver' in window;
}

/**
 * Create a simple visibility observer for elements
 */
export function createVisibilityObserver(
  callback: (element: Element, isVisible: boolean) => void,
  options: { threshold?: number; rootMargin?: string } = {}
): {
  observe: (element: Element) => void;
  unobserve: (element: Element) => void;
  disconnect: () => void;
} {
  const threshold = options.threshold || 0;
  const rootMargin = options.rootMargin || '0px';
  
  if (isIntersectionObserverAvailable()) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          callback(entry.target, entry.isIntersecting);
        });
      },
      { threshold, rootMargin }
    );
    
    return {
      observe: (element) => observer.observe(element),
      unobserve: (element) => observer.unobserve(element),
      disconnect: () => observer.disconnect()
    };
  } else {
    // Use fallback implementation
    const observer = new IntersectionObserverFallback(
      (entries) => {
        entries.forEach(entry => {
          callback(entry.target, entry.isIntersecting);
        });
      },
      { threshold, rootMargin }
    );
    
    return {
      observe: (element) => observer.observe(element),
      unobserve: (element) => observer.unobserve(element),
      disconnect: () => observer.disconnect()
    };
  }
}

/**
 * Simple lazy loading implementation using visibility observer
 */
export function enableLazyLoading(selector = '[data-lazy-src]'): () => void {
  const elements = document.querySelectorAll(selector);
  
  const observer = createVisibilityObserver((element, isVisible) => {
    if (isVisible) {
      const lazySrc = element.getAttribute('data-lazy-src');
      if (lazySrc) {
        if (element.tagName === 'IMG') {
          (element as HTMLImageElement).src = lazySrc;
        } else if (element.tagName === 'VIDEO') {
          (element as HTMLVideoElement).src = lazySrc;
        }
        
        element.removeAttribute('data-lazy-src');
        observer.unobserve(element);
      }
    }
  }, { threshold: 0.1 });
  
  elements.forEach(element => observer.observe(element));
  
  return () => observer.disconnect();
}