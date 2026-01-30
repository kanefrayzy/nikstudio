/**
 * Graceful Degradation System
 * Provides systematic fallbacks for unsupported features
 */

import { browserDetectionService, BrowserInfo } from './browser-detection';
import { compatibilityErrorHandler, CompatibilityError } from './compatibility-error-handler';

export interface DegradationStrategy {
  name: string;
  feature: string;
  condition: (browser: BrowserInfo) => boolean;
  apply: () => Promise<boolean>;
  fallbackDescription: string;
  userImpact: 'none' | 'minimal' | 'moderate' | 'significant';
}

export interface DegradationConfig {
  enableAutoDetection: boolean;
  enableUserNotifications: boolean;
  strategies: DegradationStrategy[];
}

/**
 * Default degradation strategies
 */
const DEFAULT_STRATEGIES: DegradationStrategy[] = [
  {
    name: 'css-grid-to-flexbox',
    feature: 'cssGrid',
    condition: (browser) => !browser.features.cssGrid,
    apply: async () => {
      document.documentElement.classList.add('no-css-grid');
      document.documentElement.classList.add('use-flexbox-fallback');
      return true;
    },
    fallbackDescription: 'Использует Flexbox вместо CSS Grid для макета',
    userImpact: 'minimal'
  },
  {
    name: 'custom-properties-to-static',
    feature: 'customProperties',
    condition: (browser) => !browser.features.customProperties,
    apply: async () => {
      document.documentElement.classList.add('no-custom-properties');
      // Apply static CSS values
      const style = document.createElement('style');
      style.textContent = `
        .no-custom-properties {
          --primary-color: #3b82f6;
          --secondary-color: #64748b;
          --success-color: #10b981;
          --warning-color: #f59e0b;
          --error-color: #ef4444;
          --text-color: #1f2937;
          --bg-color: #ffffff;
          --border-color: #e5e7eb;
        }
        .no-custom-properties .text-primary { color: #3b82f6; }
        .no-custom-properties .text-secondary { color: #64748b; }
        .no-custom-properties .bg-primary { background-color: #3b82f6; }
        .no-custom-properties .border-primary { border-color: #3b82f6; }
      `;
      document.head.appendChild(style);
      return true;
    },
    fallbackDescription: 'Использует статические CSS значения вместо CSS переменных',
    userImpact: 'none'
  },
  {
    name: 'intersection-observer-to-scroll',
    feature: 'intersectionObserver',
    condition: (browser) => !browser.features.intersectionObserver,
    apply: async () => {
      const { applyIntersectionObserverFallback } = await import('./fallbacks/intersection-observer-fallback');
      applyIntersectionObserverFallback();
      return 'IntersectionObserver' in window;
    },
    fallbackDescription: 'Использует события прокрутки для отслеживания видимости элементов',
    userImpact: 'minimal'
  },
  {
    name: 'fetch-to-xhr',
    feature: 'fetch',
    condition: (browser) => !browser.features.fetch,
    apply: async () => {
      const { applyFetchFallback } = await import('./fallbacks/fetch-fallback');
      applyFetchFallback();
      return typeof window.fetch === 'function';
    },
    fallbackDescription: 'Использует XMLHttpRequest вместо Fetch API',
    userImpact: 'none'
  },
  {
    name: 'webp-to-jpeg',
    feature: 'webp',
    condition: (browser) => !browser.features.webp,
    apply: async () => {
      // Replace WebP images with JPEG fallbacks
      const images = document.querySelectorAll('img[src*=".webp"], img[data-src*=".webp"]');
      images.forEach(img => {
        const currentSrc = img.getAttribute('src') || img.getAttribute('data-src');
        if (currentSrc && currentSrc.includes('.webp')) {
          const fallbackSrc = currentSrc.replace('.webp', '.jpg');
          if (img.getAttribute('src')) {
            img.setAttribute('src', fallbackSrc);
          }
          if (img.getAttribute('data-src')) {
            img.setAttribute('data-src', fallbackSrc);
          }
        }
      });
      
      // Add CSS to handle background images
      const style = document.createElement('style');
      style.textContent = `
        .no-webp .webp-bg { 
          background-image: none !important; 
        }
        .no-webp .webp-bg.jpg-fallback { 
          background-image: var(--jpg-fallback) !important; 
        }
      `;
      document.head.appendChild(style);
      document.documentElement.classList.add('no-webp');
      
      return true;
    },
    fallbackDescription: 'Использует JPEG изображения вместо WebP',
    userImpact: 'minimal'
  },
  {
    name: 'webm-to-mp4',
    feature: 'webm',
    condition: (browser) => !browser.features.webm,
    apply: async () => {
      // Replace WebM videos with MP4 fallbacks
      const videos = document.querySelectorAll('video source[src*=".webm"], video[src*=".webm"]');
      videos.forEach(element => {
        const currentSrc = element.getAttribute('src');
        if (currentSrc && currentSrc.includes('.webm')) {
          const fallbackSrc = currentSrc.replace('.webm', '.mp4');
          element.setAttribute('src', fallbackSrc);
        }
      });
      
      return true;
    },
    fallbackDescription: 'Использует MP4 видео вместо WebM',
    userImpact: 'minimal'
  },
  {
    name: 'form-validation-fallback',
    feature: 'formValidation',
    condition: (_browser) => {
      // Check if HTML5 form validation is supported
      try {
        const input = document.createElement('input');
        return !(typeof input.checkValidity === 'function' && 'validity' in input);
      } catch {
        return true;
      }
    },
    apply: async () => {
      const { enableCustomFormValidation } = await import('./fallbacks/form-validation-fallback');
      enableCustomFormValidation();
      return true;
    },
    fallbackDescription: 'Использует кастомную валидацию форм',
    userImpact: 'none'
  },
  {
    name: 'object-assign-polyfill',
    feature: 'objectAssign',
    condition: (browser) => !browser.features.objectAssign,
    apply: async () => {
      if (!Object.assign) {
        Object.assign = function(target: any, ...sources: any[]) {
          if (target == null) {
            throw new TypeError('Cannot convert undefined or null to object');
          }
          
          const to = Object(target);
          
          for (let index = 0; index < sources.length; index++) {
            const nextSource = sources[index];
            
            if (nextSource != null) {
              for (const nextKey in nextSource) {
                if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                  to[nextKey] = nextSource[nextKey];
                }
              }
            }
          }
          
          return to;
        };
      }
      return typeof Object.assign === 'function';
    },
    fallbackDescription: 'Добавляет поддержку Object.assign',
    userImpact: 'none'
  },
  {
    name: 'custom-event-polyfill',
    feature: 'customEvent',
    condition: (browser) => !browser.features.customEvent,
    apply: async () => {
      if (!window.CustomEvent) {
        window.CustomEvent = function CustomEvent(event: string, params: CustomEventInit = {}) {
          const evt = document.createEvent('CustomEvent');
          evt.initCustomEvent(event, params.bubbles || false, params.cancelable || false, params.detail);
          return evt;
        } as any;
      }
      return 'CustomEvent' in window;
    },
    fallbackDescription: 'Добавляет поддержку CustomEvent',
    userImpact: 'none'
  },
  {
    name: 'file-api-basic-fallback',
    feature: 'fileApi',
    condition: (browser) => !browser.features.fileApi,
    apply: async () => {
      // Add warning for file upload forms
      const fileInputs = document.querySelectorAll('input[type="file"]');
      fileInputs.forEach(input => {
        const warning = document.createElement('div');
        warning.className = 'file-api-warning';
        warning.style.cssText = `
          color: #f59e0b;
          font-size: 0.875rem;
          margin-top: 0.25rem;
        `;
        warning.textContent = 'Загрузка файлов может работать ограниченно в вашем браузере';
        input.parentNode?.insertBefore(warning, input.nextSibling);
      });
      
      return true;
    },
    fallbackDescription: 'Показывает предупреждения для загрузки файлов',
    userImpact: 'moderate'
  }
];

/**
 * Graceful Degradation Manager
 */
export class GracefulDegradationManager {
  private config: DegradationConfig;
  private appliedStrategies: Set<string> = new Set();
  private browser: BrowserInfo;

  constructor(config?: Partial<DegradationConfig>) {
    this.config = {
      enableAutoDetection: true,
      enableUserNotifications: true,
      strategies: DEFAULT_STRATEGIES,
      ...config
    };
    
    this.browser = browserDetectionService.getBrowserInfo();
  }

  /**
   * Initialize graceful degradation
   */
  async initialize(): Promise<void> {
    if (!this.config.enableAutoDetection) return;

    console.log('Initializing graceful degradation...');
    
    const applicableStrategies = this.getApplicableStrategies();
    
    if (applicableStrategies.length === 0) {
      console.log('No degradation strategies needed');
      return;
    }

    console.log(`Applying ${applicableStrategies.length} degradation strategies:`, 
      applicableStrategies.map(s => s.name));

    const results = await Promise.allSettled(
      applicableStrategies.map(strategy => this.applyStrategy(strategy))
    );

    // Process results
    let successCount = 0;
    let failureCount = 0;

    results.forEach((result, index) => {
      const strategy = applicableStrategies[index];
      
      if (result.status === 'fulfilled' && result.value) {
        successCount++;
        this.appliedStrategies.add(strategy.name);
        console.log(`✓ Applied degradation strategy: ${strategy.name}`);
      } else {
        failureCount++;
        console.warn(`✗ Failed to apply degradation strategy: ${strategy.name}`, 
          result.status === 'rejected' ? result.reason : 'Unknown error');
      }
    });

    // Show user notification if enabled
    if (this.config.enableUserNotifications && successCount > 0) {
      this.showDegradationNotification(successCount, failureCount);
    }

    console.log(`Graceful degradation complete: ${successCount} applied, ${failureCount} failed`);
  }

  /**
   * Get strategies that should be applied for current browser
   */
  private getApplicableStrategies(): DegradationStrategy[] {
    return this.config.strategies.filter(strategy => 
      strategy.condition(this.browser) && !this.appliedStrategies.has(strategy.name)
    );
  }

  /**
   * Apply a single degradation strategy
   */
  private async applyStrategy(strategy: DegradationStrategy): Promise<boolean> {
    try {
      const success = await strategy.apply();
      
      if (success) {
        // Create compatibility error for logging
        const error = compatibilityErrorHandler.createError(
          'feature',
          strategy.feature,
          `Applied degradation strategy: ${strategy.name}`,
          undefined,
          strategy.userImpact === 'significant' ? 'high' : 'low'
        );
        
        error.fallbackApplied = true;
        await compatibilityErrorHandler.handleError(error);
      }
      
      return success;
    } catch (error) {
      console.error(`Error applying degradation strategy ${strategy.name}:`, error);
      return false;
    }
  }

  /**
   * Show user notification about applied degradations
   */
  private showDegradationNotification(successCount: number, _failureCount: number): void {
    const appliedStrategiesList = Array.from(this.appliedStrategies)
      .map(name => this.config.strategies.find(s => s.name === name))
      .filter(Boolean) as DegradationStrategy[];

    const significantImpact = appliedStrategiesList.some(s => s.userImpact === 'significant');
    const moderateImpact = appliedStrategiesList.some(s => s.userImpact === 'moderate');

    let message: string;
    let severity: CompatibilityError['severity'];

    if (significantImpact) {
      message = `Применены альтернативные решения для совместимости (${successCount}). Некоторые функции могут работать по-другому.`;
      severity = 'high';
    } else if (moderateImpact) {
      message = `Применены альтернативные решения для совместимости (${successCount}). Функциональность сохранена.`;
      severity = 'medium';
    } else {
      message = `Применены оптимизации для совместимости (${successCount}). Все функции работают нормально.`;
      severity = 'low';
    }

    // Create mock error for notification
    const mockError: CompatibilityError = {
      type: 'feature',
      feature: 'degradation',
      browser: this.browser,
      fallbackApplied: true,
      message,
      timestamp: Date.now(),
      severity,
      userMessage: message
    };

    // Dispatch notification event
    try {
      const event = new CustomEvent('compatibility-error', {
        detail: {
          errors: [mockError],
          message,
          severity
        }
      });

      window.dispatchEvent(event);
    } catch (error) {
      // Fallback for environments where CustomEvent is not properly supported
      console.warn('Failed to dispatch degradation notification event:', error);
    }
  }

  /**
   * Get applied strategies
   */
  getAppliedStrategies(): string[] {
    return Array.from(this.appliedStrategies);
  }

  /**
   * Get degradation summary
   */
  getDegradationSummary() {
    const appliedStrategiesList = Array.from(this.appliedStrategies)
      .map(name => this.config.strategies.find(s => s.name === name))
      .filter(Boolean) as DegradationStrategy[];

    return {
      totalApplied: this.appliedStrategies.size,
      strategies: appliedStrategiesList.map(strategy => ({
        name: strategy.name,
        feature: strategy.feature,
        description: strategy.fallbackDescription,
        userImpact: strategy.userImpact
      })),
      impactLevel: this.calculateOverallImpact(appliedStrategiesList)
    };
  }

  private calculateOverallImpact(strategies: DegradationStrategy[]): 'none' | 'minimal' | 'moderate' | 'significant' {
    if (strategies.some(s => s.userImpact === 'significant')) return 'significant';
    if (strategies.some(s => s.userImpact === 'moderate')) return 'moderate';
    if (strategies.some(s => s.userImpact === 'minimal')) return 'minimal';
    return 'none';
  }

  /**
   * Manually apply a specific strategy
   */
  async applySpecificStrategy(strategyName: string): Promise<boolean> {
    const strategy = this.config.strategies.find(s => s.name === strategyName);
    
    if (!strategy) {
      console.warn(`Strategy not found: ${strategyName}`);
      return false;
    }

    if (this.appliedStrategies.has(strategyName)) {
      console.log(`Strategy already applied: ${strategyName}`);
      return true;
    }

    const success = await this.applyStrategy(strategy);
    
    if (success) {
      this.appliedStrategies.add(strategyName);
    }

    return success;
  }

  /**
   * Check if a specific strategy is needed
   */
  isStrategyNeeded(strategyName: string): boolean {
    const strategy = this.config.strategies.find(s => s.name === strategyName);
    return strategy ? strategy.condition(this.browser) : false;
  }
}

// Export singleton instance
export const gracefulDegradationManager = new GracefulDegradationManager();

/**
 * Initialize graceful degradation on page load
 */
export async function initializeGracefulDegradation(config?: Partial<DegradationConfig>): Promise<void> {
  if (typeof window === 'undefined') return;

  const manager = config ? new GracefulDegradationManager(config) : gracefulDegradationManager;
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => manager.initialize());
  } else {
    await manager.initialize();
  }
}

/**
 * React hook for graceful degradation
 * Note: This should be imported from React in the component that uses it
 */
export function useGracefulDegradation() {
  // This hook should be used in React components where React is already imported
  // const [summary, setSummary] = React.useState(gracefulDegradationManager.getDegradationSummary());
  // const [isInitialized, setIsInitialized] = React.useState(false);

  // React.useEffect(() => {
  //   const initialize = async () => {
  //     await gracefulDegradationManager.initialize();
  //     setSummary(gracefulDegradationManager.getDegradationSummary());
  //     setIsInitialized(true);
  //   };

  //   initialize();
  // }, []);

  return {
    summary: gracefulDegradationManager.getDegradationSummary(),
    isInitialized: true,
    applyStrategy: gracefulDegradationManager.applySpecificStrategy.bind(gracefulDegradationManager),
    isStrategyNeeded: gracefulDegradationManager.isStrategyNeeded.bind(gracefulDegradationManager)
  };
}