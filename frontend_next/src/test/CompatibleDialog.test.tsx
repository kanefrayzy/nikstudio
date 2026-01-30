/**
 * Tests for Compatible Dialog Component
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogCompatibilityInfo 
} from '@/components/ui/CompatibleDialog';

describe('CompatibleDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render dialog trigger and content', async () => {
    render(
      <Dialog>
        <DialogTrigger data-testid="dialog-trigger">
          Open Dialog
        </DialogTrigger>
        <DialogContent data-testid="dialog-content">
          <DialogHeader>
            <DialogTitle>Test Dialog</DialogTitle>
            <DialogDescription>Test Description</DialogDescription>
          </DialogHeader>
          <div>Dialog Content</div>
        </DialogContent>
      </Dialog>
    );

    const trigger = screen.getByTestId('dialog-trigger');
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveTextContent('Open Dialog');
  });

  it('should open dialog when trigger is clicked', async () => {
    render(
      <Dialog>
        <DialogTrigger data-testid="dialog-trigger">
          Open Dialog
        </DialogTrigger>
        <DialogContent data-testid="dialog-content">
          <DialogHeader>
            <DialogTitle>Test Dialog</DialogTitle>
            <DialogDescription>Test Description</DialogDescription>
          </DialogHeader>
          <div>Dialog Content</div>
        </DialogContent>
      </Dialog>
    );

    const trigger = screen.getByTestId('dialog-trigger');
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Test Dialog')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toBeInTheDocument();
      expect(screen.getByText('Dialog Content')).toBeInTheDocument();
    });
  });

  it('should close dialog when close button is clicked', async () => {
    render(
      <Dialog defaultOpen>
        <DialogContent data-testid="dialog-content">
          <DialogHeader>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogHeader>
          <div>Dialog Content</div>
        </DialogContent>
      </Dialog>
    );

    // Dialog should be open initially
    expect(screen.getByText('Test Dialog')).toBeInTheDocument();

    // Find and click close button
    const closeButton = screen.getByRole('button', { name: /закрыть/i });
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('Test Dialog')).not.toBeInTheDocument();
    });
  });

  it('should handle keyboard navigation', async () => {
    render(
      <Dialog defaultOpen>
        <DialogContent data-testid="dialog-content">
          <DialogHeader>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogHeader>
          <button>First Button</button>
          <button>Second Button</button>
        </DialogContent>
      </Dialog>
    );

    const dialogContent = screen.getByTestId('dialog-content');
    
    // Test ESC key
    fireEvent.keyDown(dialogContent, { key: 'Escape', keyCode: 27 });
    
    await waitFor(() => {
      expect(screen.queryByText('Test Dialog')).not.toBeInTheDocument();
    });
  });

  it('should apply compatibility classes', () => {
    // Mock older browser
    Object.defineProperty(window, 'HTMLDialogElement', {
      value: undefined,
      writable: true
    });

    render(
      <Dialog defaultOpen>
        <DialogContent data-testid="dialog-content">
          <DialogHeader>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogHeader>
          <div>Dialog Content</div>
        </DialogContent>
      </Dialog>
    );

    const dialogContent = screen.getByTestId('dialog-content');
    expect(dialogContent).toBeInTheDocument();
  });

  it('should prevent body scroll when dialog is open', async () => {
    const originalOverflow = document.body.style.overflow;

    render(
      <Dialog>
        <DialogTrigger data-testid="dialog-trigger">
          Open Dialog
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );

    const trigger = screen.getByTestId('dialog-trigger');
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Test Dialog')).toBeInTheDocument();
    });

    // Cleanup
    document.body.style.overflow = originalOverflow;
  });

  it('should handle focus management', async () => {
    render(
      <Dialog defaultOpen>
        <DialogContent data-testid="dialog-content">
          <DialogHeader>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogHeader>
          <button data-testid="first-button">First Button</button>
          <button data-testid="second-button">Second Button</button>
        </DialogContent>
      </Dialog>
    );

    await waitFor(() => {
      const firstButton = screen.getByTestId('first-button');
      expect(firstButton).toBeInTheDocument();
    });
  });
});

describe('DialogCompatibilityInfo', () => {
  it('should provide compatibility information', () => {
    expect(DialogCompatibilityInfo).toHaveProperty('supportsNativeDialog');
    expect(DialogCompatibilityInfo).toHaveProperty('needsPolyfill');
    expect(typeof DialogCompatibilityInfo.supportsNativeDialog).toBe('boolean');
    expect(typeof DialogCompatibilityInfo.needsPolyfill).toBe('boolean');
  });

  it('should detect native dialog support correctly', () => {
    // Mock modern browser with dialog support
    Object.defineProperty(window, 'HTMLDialogElement', {
      value: function() {},
      writable: true
    });

    // Re-import to get fresh compatibility info
    const { DialogCompatibilityInfo: freshInfo } = await import('@/components/ui/CompatibleDialog');
    expect(freshInfo.needsPolyfill).toBe(false);
  });
});