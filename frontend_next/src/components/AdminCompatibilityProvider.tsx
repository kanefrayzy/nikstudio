/**
 * Admin Interface Compatibility Provider
 * Provides cross-browser compatibility context and utilities for admin components
 */

"use client"

import * as React from "react"

// Browser capability detection
interface AdminCompatibilityCapabilities {
  dialog: {
    supportsNativeDialog: boolean;
    needsPolyfill: boolean;
  };
  select: {
    supportsCustomSelect: boolean;
    supportsMultiple: boolean;
    needsPolyfill: boolean;
  };
  fileInput: {
    supportsFileApi: boolean;
    supportsMultiple: boolean;
    supportsDragDrop: boolean;
    supportsCustomStyling: boolean;
    needsPolyfill: boolean;
  };
  animations: {
    supportsCSSAnimations: boolean;
    supportsTransforms: boolean;
    supportsKeyframes: boolean;
    needsFallback: boolean;
  };
  general: {
    isIE: boolean;
    isEdgeLegacy: boolean;
    isSafari: boolean;
    isFirefox: boolean;
    isChrome: boolean;
    version: number;
    isMobile: boolean;
  };
}

// Detect all browser capabilities
const detectAdminCompatibilityCapabilities = (): AdminCompatibilityCapabilities => {
  if (typeof window === 'undefined') {
    return {
      dialog: { supportsNativeDialog: false, needsPolyfill: true },
      select: { supportsCustomSelect: false, supportsMultiple: false, needsPolyfill: true },
      fileInput: { supportsFileApi: false, supportsMultiple: false, supportsDragDrop: false, supportsCustomStyling: false, needsPolyfill: true },
      animations: { supportsCSSAnimations: false, supportsTransforms: false, supportsKeyframes: false, needsFallback: true },
      general: { isIE: false, isEdgeLegacy: false, isSafari: false, isFirefox: false, isChrome: false, version: 0, isMobile: false }
    };
  }

  const userAgent = navigator.userAgent;
  const testElement = document.createElement('div');
  const testInput = document.createElement('input');
  const testSelect = document.createElement('select');
  
  testInput.type = 'file';

  // Browser detection
  const isIE = /MSIE|Trident/.test(userAgent);
  const isEdgeLegacy = /Edge\//.test(userAgent);
  const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
  const isFirefox = /Firefox/.test(userAgent);
  const isChrome = /Chrome/.test(userAgent) && !/Edge/.test(userAgent);
  const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);

  // Version detection (simplified)
  let version = 0;
  if (isIE) {
    const match = userAgent.match(/(?:MSIE |Trident\/.*; rv:)(\d+)/);
    version = match ? parseInt(match[1]) : 0;
  } else if (isEdgeLegacy) {
    const match = userAgent.match(/Edge\/(\d+)/);
    version = match ? parseInt(match[1]) : 0;
  } else if (isSafari) {
    const match = userAgent.match(/Version\/(\d+)/);
    version = match ? parseInt(match[1]) : 0;
  } else if (isFirefox) {
    const match = userAgent.match(/Firefox\/(\d+)/);
    version = match ? parseInt(match[1]) : 0;
  } else if (isChrome) {
    const match = userAgent.match(/Chrome\/(\d+)/);
    version = match ? parseInt(match[1]) : 0;
  }

  return {
    dialog: {
      supportsNativeDialog: typeof HTMLDialogElement !== 'undefined',
      needsPolyfill: typeof HTMLDialogElement === 'undefined'
    },
    select: {
      supportsCustomSelect: 'appearance' in testSelect.style || 'webkitAppearance' in testSelect.style,
      supportsMultiple: 'multiple' in testSelect,
      needsPolyfill: !('appearance' in testSelect.style) && !('webkitAppearance' in testSelect.style)
    },
    fileInput: {
      supportsFileApi: 'files' in testInput,
      supportsMultiple: 'multiple' in testInput,
      supportsDragDrop: 'ondrop' in testInput,
      supportsCustomStyling: 'webkitAppearance' in testInput.style || 'appearance' in testInput.style,
      needsPolyfill: !('files' in testInput)
    },
    animations: {
      supportsCSSAnimations: 'animation' in testElement.style || 'webkitAnimation' in testElement.style,
      supportsTransforms: 'transform' in testElement.style || 'webkitTransform' in testElement.style,
      supportsKeyframes: CSS.supports && CSS.supports('animation', 'spin 1s linear infinite'),
      needsFallback: !('animation' in testElement.style) && !('webkitAnimation' in testElement.style)
    },
    general: {
      isIE,
      isEdgeLegacy,
      isSafari,
      isFirefox,
      isChrome,
      version,
      isMobile
    }
  };
};

// Context for admin compatibility
interface AdminCompatibilityContextValue {
  capabilities: AdminCompatibilityCapabilities;
  utils: {
    addCompatibilityClass: (element: HTMLElement, className: string) => void;
    removeCompatibilityClass: (element: HTMLElement, className: string) => void;
    applyFallbackStyles: (element: HTMLElement, styles: Record<string, string>) => void;
    setupKeyboardNavigation: (container: HTMLElement, selector: string) => () => void;
    createFallbackFormData: () => FormData | any;
    showCompatibilityWarning: (message: string) => void;
  };
  warnings: string[];
  setWarnings: React.Dispatch<React.SetStateAction<string[]>>;
}

const AdminCompatibilityContext = React.createContext<AdminCompatibilityContextValue | null>(null);

// Provider component
interface AdminCompatibilityProviderProps {
  children: React.ReactNode;
  showWarnings?: boolean;
}

export const AdminCompatibilityProvider: React.FC<AdminCompatibilityProviderProps> = ({
  children,
  showWarnings = false
}) => {
  const [capabilities, setCapabilities] = React.useState<AdminCompatibilityCapabilities>(() => 
    detectAdminCompatibilityCapabilities()
  );
  const [warnings, setWarnings] = React.useState<string[]>([]);

  // Update capabilities on mount
  React.useEffect(() => {
    setCapabilities(detectAdminCompatibilityCapabilities());
  }, []);

  // Generate compatibility warnings
  React.useEffect(() => {
    if (!showWarnings) return;

    const newWarnings: string[] = [];

    if (capabilities.general.isIE && capabilities.general.version < 11) {
      newWarnings.push('Ваш браузер Internet Explorer устарел. Некоторые функции могут работать некорректно.');
    }

    if (capabilities.dialog.needsPolyfill) {
      newWarnings.push('Ваш браузер не поддерживает современные диалоги. Используется совместимая версия.');
    }

    if (capabilities.fileInput.needsPolyfill) {
      newWarnings.push('Ваш браузер имеет ограниченную поддержку загрузки файлов.');
    }

    if (!capabilities.fileInput.supportsDragDrop) {
      newWarnings.push('Перетаскивание файлов не поддерживается в вашем браузере.');
    }

    if (capabilities.animations.needsFallback) {
      newWarnings.push('CSS анимации не поддерживаются. Используются упрощенные эффекты.');
    }

    setWarnings(newWarnings);
  }, [capabilities, showWarnings]);

  // Utility functions
  const utils = React.useMemo(() => ({
    addCompatibilityClass: (element: HTMLElement, className: string) => {
      if (element && !element.classList.contains(className)) {
        element.classList.add(className);
      }
    },

    removeCompatibilityClass: (element: HTMLElement, className: string) => {
      if (element && element.classList.contains(className)) {
        element.classList.remove(className);
      }
    },

    applyFallbackStyles: (element: HTMLElement, styles: Record<string, string>) => {
      if (!element) return;
      
      Object.entries(styles).forEach(([property, value]) => {
        try {
          (element.style as any)[property] = value;
        } catch (error) {
          console.warn(`Failed to apply style ${property}: ${value}`, error);
        }
      });
    },

    setupKeyboardNavigation: (container: HTMLElement, selector: string) => {
      if (!container) return () => {};

      const handleKeyDown = (event: KeyboardEvent) => {
        const { key, keyCode } = event;
        const items = container.querySelectorAll(selector);
        const currentIndex = Array.from(items).indexOf(document.activeElement as Element);

        if (key === 'ArrowDown' || keyCode === 40) {
          event.preventDefault();
          const nextIndex = Math.min(currentIndex + 1, items.length - 1);
          (items[nextIndex] as HTMLElement)?.focus();
        } else if (key === 'ArrowUp' || keyCode === 38) {
          event.preventDefault();
          const prevIndex = Math.max(currentIndex - 1, 0);
          (items[prevIndex] as HTMLElement)?.focus();
        } else if (key === 'Home' || keyCode === 36) {
          event.preventDefault();
          (items[0] as HTMLElement)?.focus();
        } else if (key === 'End' || keyCode === 35) {
          event.preventDefault();
          (items[items.length - 1] as HTMLElement)?.focus();
        }
      };

      container.addEventListener('keydown', handleKeyDown);
      return () => container.removeEventListener('keydown', handleKeyDown);
    },

    createFallbackFormData: () => {
      if (typeof FormData !== 'undefined') {
        return new FormData();
      }

      // Fallback for very old browsers
      return {
        append: (name: string, value: string | File) => {
          console.warn('FormData polyfill: append called', name, value);
        },
        delete: (name: string) => {
          console.warn('FormData polyfill: delete called', name);
        },
        get: (name: string): FormDataEntryValue | null => {
          console.warn('FormData polyfill: get called', name);
          return null;
        },
        getAll: (name: string) => {
          console.warn('FormData polyfill: getAll called', name);
          return [];
        },
        has: (name: string): boolean => {
          console.warn('FormData polyfill: has called', name);
          return false;
        },
        set: (name: string, value: string | File) => {
          console.warn('FormData polyfill: set called', name, value);
        }
      };
    },

    showCompatibilityWarning: (message: string) => {
      setWarnings(prev => [...prev, message]);
      
      // Auto-remove warning after 5 seconds
      setTimeout(() => {
        setWarnings(prev => prev.filter(w => w !== message));
      }, 5000);
    }
  }), []);

  // Load compatibility CSS
  React.useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/styles/admin-compatibility.css';
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  // Add browser classes to body
  React.useEffect(() => {
    const body = document.body;
    const classes: string[] = [];

    if (capabilities.general.isIE) classes.push('browser-ie');
    if (capabilities.general.isEdgeLegacy) classes.push('browser-edge-legacy');
    if (capabilities.general.isSafari) classes.push('browser-safari');
    if (capabilities.general.isFirefox) classes.push('browser-firefox');
    if (capabilities.general.isChrome) classes.push('browser-chrome');
    if (capabilities.general.isMobile) classes.push('browser-mobile');

    if (capabilities.dialog.needsPolyfill) classes.push('dialog-polyfill-needed');
    if (capabilities.select.needsPolyfill) classes.push('select-polyfill-needed');
    if (capabilities.fileInput.needsPolyfill) classes.push('file-input-polyfill-needed');
    if (capabilities.animations.needsFallback) classes.push('animations-fallback-needed');

    classes.forEach(className => body.classList.add(className));

    return () => {
      classes.forEach(className => body.classList.remove(className));
    };
  }, [capabilities]);

  const contextValue: AdminCompatibilityContextValue = {
    capabilities,
    utils,
    warnings,
    setWarnings
  };

  return (
    <AdminCompatibilityContext.Provider value={contextValue}>
      {children}
    </AdminCompatibilityContext.Provider>
  );
};

// Hook to use admin compatibility context
export const useAdminCompatibility = () => {
  const context = React.useContext(AdminCompatibilityContext);
  if (!context) {
    throw new Error('useAdminCompatibility must be used within AdminCompatibilityProvider');
  }
  return context;
};

// Component to display compatibility warnings
export const AdminCompatibilityWarnings: React.FC = () => {
  const { warnings } = useAdminCompatibility();

  if (warnings.length === 0) return null;

  return (
    <div className="space-y-2 mb-4">
      {warnings.map((warning, index) => (
        <div
          key={index}
          className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800 text-sm"
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{warning}</span>
        </div>
      ))}
    </div>
  );
};

// Export compatibility info for debugging
export const getAdminCompatibilityInfo = () => {
  return detectAdminCompatibilityCapabilities();
};