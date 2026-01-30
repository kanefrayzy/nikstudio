import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { ServiceBlockDialog } from '@/components/admin/ServiceBlockDialog';

// Mock the react-dnd dependencies
vi.mock('react-dnd', () => ({
  DndProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useDrag: () => [{ isDragging: false }, vi.fn()],
  useDrop: () => [{ isOver: false }, vi.fn()],
}));

vi.mock('react-dnd-html5-backend', () => ({
  HTML5Backend: {},
}));

describe('ServiceBlockDialog', () => {
  const mockProps = {
    open: true,
    onOpenChange: vi.fn(),
    service: null,
    onSave: vi.fn(),
  };

  it('renders dialog when open', () => {
    render(<ServiceBlockDialog {...mockProps} />);
    
    expect(screen.getByText('Создать блок услуги')).toBeInTheDocument();
    expect(screen.getByText('Основное')).toBeInTheDocument();
    expect(screen.getByText('Функции')).toBeInTheDocument();
    expect(screen.getByText('Медиа')).toBeInTheDocument();
  });

  it('renders edit mode when service is provided', () => {
    const service = {
      id: 1,
      title: 'Test Service',
      description: 'Test Description',
      dark_background: false,
      order: 1,
      features: [],
      mediaItems: [],
    };

    render(<ServiceBlockDialog {...mockProps} service={service} />);
    
    expect(screen.getByText('Редактировать блок услуги')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Service')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<ServiceBlockDialog {...mockProps} open={false} />);
    
    expect(screen.queryByText('Создать блок услуги')).not.toBeInTheDocument();
  });
});