'use client';

import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

interface DndProviderWrapperProps {
  children: React.ReactNode;
}

/**
 * Wrapper component for react-dnd DndProvider
 * This component is dynamically imported to reduce initial bundle size
 */
export function DndProviderWrapper({ children }: DndProviderWrapperProps) {
  return (
    <DndProvider backend={HTML5Backend}>
      {children}
    </DndProvider>
  );
}
