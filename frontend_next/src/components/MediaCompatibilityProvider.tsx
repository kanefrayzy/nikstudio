'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { MediaFormatSupport, getMediaFormatSupport } from '@/lib/media-compatibility';

interface MediaCompatibilityContextType {
  support: MediaFormatSupport | null;
  isLoading: boolean;
  error: string | null;
}

const MediaCompatibilityContext = createContext<MediaCompatibilityContextType>({
  support: null,
  isLoading: true,
  error: null,
});

export const useMediaCompatibility = () => {
  const context = useContext(MediaCompatibilityContext);
  if (!context) {
    throw new Error('useMediaCompatibility must be used within MediaCompatibilityProvider');
  }
  return context;
};

interface MediaCompatibilityProviderProps {
  children: React.ReactNode;
}

export const MediaCompatibilityProvider: React.FC<MediaCompatibilityProviderProps> = ({ children }) => {
  const [support, setSupport] = useState<MediaFormatSupport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const detectSupport = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const formatSupport = await getMediaFormatSupport();
        setSupport(formatSupport);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to detect media format support');
        console.error('Media compatibility detection failed:', err);
      } finally {
        setIsLoading(false);
      }
    };

    detectSupport();
  }, []);

  return (
    <MediaCompatibilityContext.Provider value={{ support, isLoading, error }}>
      {children}
    </MediaCompatibilityContext.Provider>
  );
};