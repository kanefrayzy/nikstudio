/**
 * Mouse event compatibility layer for older browsers
 * Normalizes mouse events and provides consistent behavior
 */

import { EventCompatibility } from './event-compatibility';

export interface NormalizedMouseEvent {
  type: string;
  button: number;
  buttons: number;
  clientX: number;
  clientY: number;
  pageX: number;
  pageY: number;
  screenX: number;
  screenY: number;
  offsetX: number;
  offsetY: number;
  altKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
  detail: number;
  relatedTarget: EventTarget | null;
  preventDefault: () => void;
  stopPropagation: () => void;
  originalEvent: Event;
}

/**
 * Mouse compatibility handler
 */
export class MouseCompatibility {
  // Mouse button constants for cross-browser compatibility
  static readonly BUTTON = {
    LEFT: 0,
    MIDDLE: 1,
    RIGHT: 2
  };

  // Button state flags for older browsers
  static readonly BUTTONS = {
    NONE: 0,
    LEFT: 1,
    RIGHT: 2,
    MIDDLE: 4
  };

  private static clickTimeout: number | null = null;
  private static clickCount = 0;
  private static lastClickTime = 0;
  private static lastClickPosition = { x: 0, y: 0 };
  private static doubleClickThreshold = 300; // milliseconds
  private static doubleClickDistance = 5; // pixels

  /**
   * Add mouse event listener with normalization
   */
  static addMouseEventListener(
    element: EventTarget,
    eventType: 'click' | 'dblclick' | 'mousedown' | 'mouseup' | 'mousemove' | 'mouseover' | 'mouseout' | 'mouseenter' | 'mouseleave',
    handler: (event: NormalizedMouseEvent) => void,
    options?: AddEventListenerOptions
  ): void {
    EventCompatibility.addEventListener(element, eventType, (e) => {
      const normalizedEvent = this.normalizeMouseEvent(e);
      handler(normalizedEvent);
    }, options);
  }

  /**
   * Add double-click listener with fallback for older browsers
   */
  static addDoubleClickListener(
    element: EventTarget,
    handler: (event: NormalizedMouseEvent) => void,
    options?: AddEventListenerOptions
  ): void {
    // Try native double-click first
    this.addMouseEventListener(element, 'dblclick', handler, options);

    // Fallback for browsers with poor double-click support
    this.addMouseEventListener(element, 'click', (event) => {
      const currentTime = Date.now();
      const timeDiff = currentTime - this.lastClickTime;
      const distance = Math.sqrt(
        Math.pow(event.clientX - this.lastClickPosition.x, 2) +
        Math.pow(event.clientY - this.lastClickPosition.y, 2)
      );

      if (timeDiff < this.doubleClickThreshold && distance < this.doubleClickDistance) {
        this.clickCount++;
        if (this.clickCount === 2) {
          // Create double-click event
          const dblClickEvent = { ...event, type: 'dblclick', detail: 2 };
          handler(dblClickEvent);
          this.clickCount = 0;
        }
      } else {
        this.clickCount = 1;
      }

      this.lastClickTime = currentTime;
      this.lastClickPosition = { x: event.clientX, y: event.clientY };

      // Reset click count after threshold
      if (this.clickTimeout) {
        clearTimeout(this.clickTimeout);
      }
      this.clickTimeout = window.setTimeout(() => {
        this.clickCount = 0;
      }, this.doubleClickThreshold);
    }, options);
  }

  /**
   * Add right-click (context menu) listener
   */
  static addRightClickListener(
    element: EventTarget,
    handler: (event: NormalizedMouseEvent) => void,
    options?: AddEventListenerOptions
  ): void {
    EventCompatibility.addEventListener(element, 'contextmenu', (e) => {
      const normalizedEvent = this.normalizeMouseEvent(e);
      handler(normalizedEvent);
    }, options);
  }

  /**
   * Add mouse wheel listener with cross-browser support
   */
  static addWheelListener(
    element: EventTarget,
    handler: (event: NormalizedMouseEvent & { deltaX: number; deltaY: number; deltaZ: number }) => void,
    options?: AddEventListenerOptions
  ): void {
    // Modern browsers
    EventCompatibility.addEventListener(element, 'wheel', (e) => {
      const wheelEvent = e.originalEvent as WheelEvent;
      const normalizedEvent = this.normalizeMouseEvent(e);
      handler({
        ...normalizedEvent,
        deltaX: wheelEvent.deltaX || 0,
        deltaY: wheelEvent.deltaY || 0,
        deltaZ: wheelEvent.deltaZ || 0
      });
    }, options);

    // Firefox legacy
    EventCompatibility.addEventListener(element, 'DOMMouseScroll', (e) => {
      const wheelEvent = e.originalEvent as any;
      const normalizedEvent = this.normalizeMouseEvent(e);
      handler({
        ...normalizedEvent,
        deltaX: 0,
        deltaY: (wheelEvent.detail || 0) * 40, // Convert to pixel units
        deltaZ: 0
      });
    }, options);

    // IE/Safari legacy
    EventCompatibility.addEventListener(element, 'mousewheel', (e) => {
      const wheelEvent = e.originalEvent as any;
      const normalizedEvent = this.normalizeMouseEvent(e);
      handler({
        ...normalizedEvent,
        deltaX: wheelEvent.wheelDeltaX ? -wheelEvent.wheelDeltaX / 3 : 0,
        deltaY: wheelEvent.wheelDelta ? -wheelEvent.wheelDelta / 3 : 0,
        deltaZ: 0
      });
    }, options);
  }

  /**
   * Normalize mouse event for cross-browser consistency
   */
  private static normalizeMouseEvent(event: any): NormalizedMouseEvent {
    const originalEvent = event.originalEvent || event;
    
    // Calculate page coordinates if not available
    let pageX = originalEvent.pageX;
    let pageY = originalEvent.pageY;
    
    if (pageX === undefined || pageY === undefined) {
      const doc = document.documentElement;
      const body = document.body;
      pageX = originalEvent.clientX + (doc.scrollLeft || body.scrollLeft || 0) - (doc.clientLeft || 0);
      pageY = originalEvent.clientY + (doc.scrollTop || body.scrollTop || 0) - (doc.clientTop || 0);
    }

    // Calculate offset coordinates
    let offsetX = originalEvent.offsetX;
    let offsetY = originalEvent.offsetY;
    
    if (offsetX === undefined || offsetY === undefined) {
      const target = originalEvent.target || originalEvent.srcElement;
      if (target && target.getBoundingClientRect) {
        const rect = target.getBoundingClientRect();
        offsetX = originalEvent.clientX - rect.left;
        offsetY = originalEvent.clientY - rect.top;
      } else {
        offsetX = originalEvent.clientX;
        offsetY = originalEvent.clientY;
      }
    }

    // Normalize button property
    let button = originalEvent.button;
    if (button === undefined) {
      // IE uses different button values
      if (originalEvent.which !== undefined) {
        button = originalEvent.which - 1;
      } else {
        button = 0;
      }
    }

    // Normalize buttons property (bitmask)
    let buttons = originalEvent.buttons;
    if (buttons === undefined) {
      // Calculate buttons from button property
      switch (button) {
        case 0: buttons = this.BUTTONS.LEFT; break;
        case 1: buttons = this.BUTTONS.MIDDLE; break;
        case 2: buttons = this.BUTTONS.RIGHT; break;
        default: buttons = this.BUTTONS.NONE; break;
      }
    }

    return {
      type: originalEvent.type,
      button,
      buttons,
      clientX: originalEvent.clientX || 0,
      clientY: originalEvent.clientY || 0,
      pageX,
      pageY,
      screenX: originalEvent.screenX || 0,
      screenY: originalEvent.screenY || 0,
      offsetX,
      offsetY,
      altKey: !!originalEvent.altKey,
      ctrlKey: !!originalEvent.ctrlKey,
      shiftKey: !!originalEvent.shiftKey,
      metaKey: !!originalEvent.metaKey,
      detail: originalEvent.detail || 0,
      relatedTarget: originalEvent.relatedTarget || null,
      preventDefault: event.preventDefault,
      stopPropagation: event.stopPropagation,
      originalEvent
    };
  }

  /**
   * Check if event is left mouse button
   */
  static isLeftButton(event: NormalizedMouseEvent): boolean {
    return event.button === this.BUTTON.LEFT;
  }

  /**
   * Check if event is right mouse button
   */
  static isRightButton(event: NormalizedMouseEvent): boolean {
    return event.button === this.BUTTON.RIGHT;
  }

  /**
   * Check if event is middle mouse button
   */
  static isMiddleButton(event: NormalizedMouseEvent): boolean {
    return event.button === this.BUTTON.MIDDLE;
  }

  /**
   * Get mouse position relative to element
   */
  static getRelativePosition(event: NormalizedMouseEvent, element: HTMLElement): { x: number; y: number } {
    const rect = element.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  /**
   * Prevent context menu on element
   */
  static preventContextMenu(element: EventTarget): void {
    EventCompatibility.addEventListener(element, 'contextmenu', (e) => {
      e.preventDefault();
    });
  }

  /**
   * Prevent text selection on element
   */
  static preventTextSelection(element: HTMLElement): void {
    element.style.userSelect = 'none';
    (element.style as any).webkitUserSelect = 'none';
    (element.style as any).mozUserSelect = 'none';
    (element.style as any).msUserSelect = 'none';

    // IE fallback
    EventCompatibility.addEventListener(element, 'selectstart', (e) => {
      e.preventDefault();
    });
  }

  /**
   * Enable drag functionality with cross-browser support
   */
  static enableDrag(
    element: EventTarget,
    onDragStart?: (event: NormalizedMouseEvent) => void,
    onDrag?: (event: NormalizedMouseEvent) => void,
    onDragEnd?: (event: NormalizedMouseEvent) => void
  ): void {
    let isDragging = false;

    this.addMouseEventListener(element, 'mousedown', (event) => {
      if (this.isLeftButton(event)) {
        isDragging = true;
        if (onDragStart) {
          onDragStart(event);
        }
        event.preventDefault();
      }
    });

    this.addMouseEventListener(document as any, 'mousemove', (event) => {
      if (isDragging && onDrag) {
        onDrag(event);
        event.preventDefault();
      }
    });

    this.addMouseEventListener(document as any, 'mouseup', (event) => {
      if (isDragging) {
        isDragging = false;
        if (onDragEnd) {
          onDragEnd(event);
        }
        event.preventDefault();
      }
    });
  }

  /**
   * Add hover effect with mouse enter/leave support
   */
  static addHoverEffect(
    element: EventTarget,
    onHoverStart: (event: NormalizedMouseEvent) => void,
    onHoverEnd: (event: NormalizedMouseEvent) => void,
    options?: AddEventListenerOptions
  ): void {
    // Use mouseenter/mouseleave if available (doesn't bubble)
    this.addMouseEventListener(element, 'mouseenter', onHoverStart, options);
    this.addMouseEventListener(element, 'mouseleave', onHoverEnd, options);

    // Fallback to mouseover/mouseout for older browsers
    this.addMouseEventListener(element, 'mouseover', (event) => {
      if (event.relatedTarget && (event.originalEvent.target as Node).contains(event.relatedTarget as Node)) {
        return; // Ignore if coming from child element
      }
      onHoverStart(event);
    }, options);

    this.addMouseEventListener(element, 'mouseout', (event) => {
      if (event.relatedTarget && (event.originalEvent.target as Node).contains(event.relatedTarget as Node)) {
        return; // Ignore if going to child element
      }
      onHoverEnd(event);
    }, options);
  }
}