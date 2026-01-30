/**
 * Cross-browser event handling compatibility layer
 * Provides unified event listener attachment and event normalization
 */

// Event listener compatibility types
interface EventTarget {
  addEventListener?: (type: string, listener: EventListener, options?: boolean | AddEventListenerOptions) => void;
  removeEventListener?: (type: string, listener: EventListener, options?: boolean | EventListenerOptions) => void;
  attachEvent?: (type: string, listener: (event: any) => void) => void;
  detachEvent?: (type: string, listener: (event: any) => void) => void;
}

interface NormalizedEvent {
  type: string;
  target: EventTarget | null;
  currentTarget: EventTarget | null;
  preventDefault: () => void;
  stopPropagation: () => void;
  stopImmediatePropagation: () => void;
  which?: number;
  keyCode?: number;
  charCode?: number;
  button?: number;
  buttons?: number;
  clientX?: number;
  clientY?: number;
  pageX?: number;
  pageY?: number;
  touches?: TouchList;
  changedTouches?: TouchList;
  targetTouches?: TouchList;
  originalEvent?: Event;
}

/**
 * Unified event listener attachment that works across all browsers
 */
export class EventCompatibility {
  private static eventMap = new WeakMap<EventTarget, Map<string, Set<EventListener>>>();

  /**
   * Add event listener with cross-browser compatibility
   */
  static addEventListener(
    element: EventTarget,
    eventType: string,
    handler: (event: NormalizedEvent) => void,
    options?: boolean | AddEventListenerOptions
  ): void {
    const normalizedHandler = (event: Event) => {
      const normalizedEvent = this.normalizeEvent(event);
      handler(normalizedEvent);
    };

    // Store handler mapping for removal
    if (!this.eventMap.has(element)) {
      this.eventMap.set(element, new Map());
    }
    const elementMap = this.eventMap.get(element)!;
    if (!elementMap.has(eventType)) {
      elementMap.set(eventType, new Set());
    }
    elementMap.get(eventType)!.add(handler);

    // Modern browsers
    if (element.addEventListener) {
      element.addEventListener(eventType, normalizedHandler as EventListener, options);
    }
    // Legacy IE support
    else if (element.attachEvent) {
      element.attachEvent(`on${eventType}`, normalizedHandler);
    }
    // Fallback for very old browsers
    else {
      (element as any)[`on${eventType}`] = normalizedHandler;
    }
  }

  /**
   * Remove event listener with cross-browser compatibility
   */
  static removeEventListener(
    element: EventTarget,
    eventType: string,
    handler: (event: NormalizedEvent) => void,
    options?: boolean | EventListenerOptions
  ): void {
    const elementMap = this.eventMap.get(element);
    if (elementMap && elementMap.has(eventType)) {
      elementMap.get(eventType)!.delete(handler);
    }

    // Modern browsers
    if (element.removeEventListener) {
      element.removeEventListener(eventType, handler as EventListener, options);
    }
    // Legacy IE support
    else if (element.detachEvent) {
      element.detachEvent(`on${eventType}`, handler as any);
    }
    // Fallback for very old browsers
    else {
      (element as any)[`on${eventType}`] = null;
    }
  }

  /**
   * Normalize event object for consistent behavior across browsers
   */
  private static normalizeEvent(event: Event): NormalizedEvent {
    // Create normalized event object
    const normalized: NormalizedEvent = {
      type: event.type,
      target: event.target as EventTarget,
      currentTarget: event.currentTarget as EventTarget,
      preventDefault: () => {
        if (event.preventDefault) {
          event.preventDefault();
        } else {
          (event as any).returnValue = false;
        }
      },
      stopPropagation: () => {
        if (event.stopPropagation) {
          event.stopPropagation();
        } else {
          (event as any).cancelBubble = true;
        }
      },
      stopImmediatePropagation: () => {
        if (event.stopImmediatePropagation) {
          event.stopImmediatePropagation();
        } else {
          (event as any).cancelBubble = true;
        }
      },
      originalEvent: event
    };

    // Normalize keyboard events
    if (event.type && event.type.startsWith('key')) {
      const keyEvent = event as KeyboardEvent;
      normalized.which = keyEvent.which || keyEvent.keyCode || keyEvent.charCode;
      normalized.keyCode = keyEvent.keyCode;
      normalized.charCode = keyEvent.charCode;
    }

    // Normalize mouse events
    if (event.type && (event.type.startsWith('mouse') || event.type === 'click' || event.type === 'dblclick')) {
      const mouseEvent = event as MouseEvent;
      normalized.button = mouseEvent.button;
      normalized.buttons = mouseEvent.buttons;
      normalized.clientX = mouseEvent.clientX;
      normalized.clientY = mouseEvent.clientY;
      normalized.pageX = mouseEvent.pageX;
      normalized.pageY = mouseEvent.pageY;
    }

    // Normalize touch events
    if (event.type && event.type.startsWith('touch')) {
      const touchEvent = event as TouchEvent;
      normalized.touches = touchEvent.touches;
      normalized.changedTouches = touchEvent.changedTouches;
      normalized.targetTouches = touchEvent.targetTouches;
    }

    return normalized;
  }
}