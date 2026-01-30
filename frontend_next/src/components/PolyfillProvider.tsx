/**
 * Polyfill Provider Component
 * Initializes polyfills for cross-browser compatibility
 */

'use client';

import React from 'react';
import { initializePolyfills, PolyfillConfig, PolyfillLoadResult } from '../lib/polyfill-manager';

interface PolyfillProviderProps {
  children: React.ReactNode;
  config?: Partial<PolyfillConfig>;
  onPolyfillsLoaded?: (results: PolyfillLoadResult[]) => void;
  onError?: (error: Error) => void;
  showLoadingIndicator?: boolean;
  loadingComponent?: React.ReactNode;
}

interface PolyfillProviderState {
  isLoading: boolean;
  error: Error | null;
  polyfillResults: PolyfillLoadResult[];
}

/**
 * Provider component that initializes polyfills before rendering children
 */
export function PolyfillProvider({
  children,
  config,
  onPolyfillsLoaded,
  onError,
  showLoadingIndicator = false,
  loadingComponent
}: PolyfillProviderProps) {
  const [state, setState] = React.useState<PolyfillProviderState>({
    isLoading: true,
    error: null,
    polyfillResults: []
  });

  React.useEffect(() => {
    let mounted = true;

    const loadPolyfills = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        
        const results = await initializePolyfills(config);
        
        if (mounted) {
          setState(prev => ({
            ...prev,
            isLoading: false,
            polyfillResults: results
          }));
          
          onPolyfillsLoaded?.(results);
        }
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        
        if (mounted) {
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: errorObj
          }));
          
          onError?.(errorObj);
        }
      }
    };

    loadPolyfills();

    return () => {
      mounted = false;
    };
  }, [config, onPolyfillsLoaded, onError]);

  // Show loading indicator if requested and still loading
  if (state.isLoading && showLoadingIndicator) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }
    
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка совместимости браузера...</p>
        </div>
      </div>
    );
  }

  // Always render children, even if polyfills failed to load
  // This ensures the app doesn't break completely
  return <>{children}</>;
}

/**
 * Hook to access polyfill loading state and results
 */
export function usePolyfillProvider() {
  const [polyfillResults, setPolyfillResults] = React.useState<PolyfillLoadResult[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const loadPolyfills = React.useCallback(async (config?: Partial<PolyfillConfig>) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const results = await initializePolyfills(config);
      setPolyfillResults(results);
      
      return results;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    polyfillResults,
    isLoading,
    error,
    loadPolyfills
  };
}

/**
 * Higher-order component that wraps a component with polyfill initialization
 */
export function withPolyfills<P extends object>(
  Component: React.ComponentType<P>,
  polyfillConfig?: Partial<PolyfillConfig>
) {
  const WrappedComponent = (props: P) => {
    return (
      <PolyfillProvider config={polyfillConfig}>
        <Component {...props} />
      </PolyfillProvider>
    );
  };

  WrappedComponent.displayName = `withPolyfills(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

/**
 * Component that displays polyfill loading status for debugging
 */
export function PolyfillStatus() {
  const [polyfillResults, setPolyfillResults] = React.useState<PolyfillLoadResult[]>([]);
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const loadPolyfills = async () => {
      try {
        const results = await initializePolyfills();
        setPolyfillResults(results);
      } catch (error) {
        console.error('Failed to load polyfills for status display:', error);
      }
    };

    loadPolyfills();
  }, []);

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const loadedPolyfills = polyfillResults.filter(r => r.loaded);
  const failedPolyfills = polyfillResults.filter(r => !r.loaded);
  const fallbackPolyfills = polyfillResults.filter(r => r.fallbackApplied);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
        title="Показать статус полифиллов"
      >
        Polyfills ({loadedPolyfills.length})
      </button>
      
      {isVisible && (
        <div className="absolute bottom-12 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-80 max-h-96 overflow-y-auto">
          <div className="mb-3">
            <h3 className="font-semibold text-gray-900 mb-2">Статус полифиллов</h3>
            
            {polyfillResults.length === 0 && (
              <p className="text-gray-600 text-sm">Полифиллы не требуются</p>
            )}
          </div>

          {loadedPolyfills.length > 0 && (
            <div className="mb-3">
              <h4 className="font-medium text-green-700 text-sm mb-1">
                Загружено ({loadedPolyfills.length})
              </h4>
              <ul className="text-xs text-gray-600 space-y-1">
                {loadedPolyfills.map(result => (
                  <li key={result.name} className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    {result.name}
                    {result.fallbackApplied && (
                      <span className="ml-2 text-orange-600">(fallback)</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {failedPolyfills.length > 0 && (
            <div className="mb-3">
              <h4 className="font-medium text-red-700 text-sm mb-1">
                Ошибки ({failedPolyfills.length})
              </h4>
              <ul className="text-xs text-gray-600 space-y-1">
                {failedPolyfills.map(result => (
                  <li key={result.name} className="flex items-center">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                    {result.name}
                    {result.error && (
                      <span className="ml-2 text-red-600 truncate" title={result.error.message}>
                        ({result.error.message.substring(0, 20)}...)
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {fallbackPolyfills.length > 0 && (
            <div className="mb-3">
              <h4 className="font-medium text-orange-700 text-sm mb-1">
                Fallback использован ({fallbackPolyfills.length})
              </h4>
              <ul className="text-xs text-gray-600 space-y-1">
                {fallbackPolyfills.map(result => (
                  <li key={result.name} className="flex items-center">
                    <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                    {result.name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={() => setIsVisible(false)}
            className="text-xs text-gray-500 hover:text-gray-700 mt-2"
          >
            Закрыть
          </button>
        </div>
      )}
    </div>
  );
}