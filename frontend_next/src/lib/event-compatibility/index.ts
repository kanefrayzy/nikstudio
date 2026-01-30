/**
 * Cross-browser event handling compatibility
 * Main export file for all event compatibility utilities
 */

import { EventCompatibility } from '../event-compatibility';
export { EventCompatibility };
export { TouchCompatibility, type TouchEventData, type TouchPoint } from '../touch-compatibility';
export { KeyboardCompatibility, type NormalizedKeyEvent } from '../keyboard-compatibility';
export { MouseCompatibility, type NormalizedMouseEvent } from '../mouse-compatibility';

/**
 * Initialize all event compatibility features
 */
export function initializeEventCompatibility(): void {
  // Add global event compatibility styles
  const style = document.createElement('style');
  style.textContent = `
    /* Touch-friendly interactions */
    .touch-friendly {
      touch-action: manipulation;
      user-select: none;
      -webkit-user-select: none;
      -webkit-touch-callout: none;
      -webkit-tap-highlight-color: transparent;
    }
    
    /* Prevent text selection during drag operations */
    .no-select {
      user-select: none;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
    }
    
    /* Focus styles for keyboard navigation */
    .keyboard-focusable:focus {
      outline: 2px solid #007acc;
      outline-offset: 2px;
    }
    
    /* Hide focus outline for mouse users */
    .mouse-user .keyboard-focusable:focus {
      outline: none;
    }
  `;
  document.head.appendChild(style);

  // Detect input method to optimize focus styles
  let _isMouseUser = false;
  
  document.addEventListener('mousedown', () => {
    _isMouseUser = true;
    document.body.classList.add('mouse-user');
  });
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      _isMouseUser = false;
      document.body.classList.remove('mouse-user');
    }
  });
}

/**
 * Utility function to make an element compatible with all input methods
 */
export function makeElementAccessible(element: HTMLElement): void {
  // Add touch-friendly class
  element.classList.add('touch-friendly');
  
  // Make keyboard accessible
  if (!element.hasAttribute('tabindex')) {
    element.setAttribute('tabindex', '0');
  }
  element.classList.add('keyboard-focusable');
  
  // Add ARIA attributes if not present
  if (!element.hasAttribute('role') && element.tagName !== 'BUTTON' && element.tagName !== 'A') {
    element.setAttribute('role', 'button');
  }
}

/**
 * Cross-browser event delegation utility
 */
export function delegateEvent(
  container: EventTarget,
  selector: string,
  eventType: string,
  handler: (event: Event, target: Element) => void
): void {
  EventCompatibility.addEventListener(container, eventType, (e) => {
    const target = e.target as Element;
    const delegateTarget = target.closest(selector);
    
    if (delegateTarget) {
      const originalEvent = e.originalEvent || (e as any);
      handler(originalEvent, delegateTarget);
    }
  });
}

/**
 * Debounce utility for event handlers
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    
    timeout = window.setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Throttle utility for event handlers
 */
export function throttle<T extends (...args: any[]) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}