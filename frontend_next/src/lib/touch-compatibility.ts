/**
 * Touch event compatibility for mobile browsers
 * Handles touch events and provides mouse event fallbacks
 */

import { EventCompatibility } from './event-compatibility';

export interface TouchPoint {
  x: number;
  y: number;
  identifier: number;
}

export interface TouchEventData {
  touches: TouchPoint[];
  changedTouches: TouchPoint[];
  targetTouches: TouchPoint[];
  preventDefault: () => void;
  stopPropagation: () => void;
}

/**
 * Touch event compatibility handler
 */
export class TouchCompatibility {
  private static touchSupported: boolean | null = null;
  private static touchStartTime = 0;
  private static touchStartPosition = { x: 0, y: 0 };
  private static tapThreshold = 10; // pixels
  private static tapTimeThreshold = 300; // milliseconds

  /**
   * Check if touch events are supported
   */
  static isTouchSupported(): boolean {
    if (this.touchSupported === null) {
      this.touchSupported = 'ontouchstart' in window || 
                           navigator.maxTouchPoints > 0 || 
                           (navigator as any).msMaxTouchPoints > 0;
    }
    return this.touchSupported;
  }

  /**
   * Add touch-compatible event listener
   * Automatically handles both touch and mouse events
   */
  static addTouchEventListener(
    element: EventTarget,
    eventType: 'tap' | 'touchstart' | 'touchmove' | 'touchend' | 'swipe',
    handler: (data: TouchEventData) => void,
    options?: AddEventListenerOptions
  ): void {
    switch (eventType) {
      case 'tap':
        this.addTapListener(element, handler, options);
        break;
      case 'touchstart':
        this.addTouchStartListener(element, handler, options);
        break;
      case 'touchmove':
        this.addTouchMoveListener(element, handler, options);
        break;
      case 'touchend':
        this.addTouchEndListener(element, handler, options);
        break;
      case 'swipe':
        this.addSwipeListener(element, handler, options);
        break;
    }
  }

  /**
   * Add tap event listener (works on both touch and mouse)
   */
  private static addTapListener(
    element: EventTarget,
    handler: (data: TouchEventData) => void,
    options?: AddEventListenerOptions
  ): void {
    if (this.isTouchSupported()) {
      // Touch devices
      EventCompatibility.addEventListener(element, 'touchstart', (e) => {
        this.touchStartTime = Date.now();
        if (e.touches && e.touches.length > 0) {
          this.touchStartPosition = {
            x: e.touches[0].clientX || 0,
            y: e.touches[0].clientY || 0
          };
        }
      }, options);

      EventCompatibility.addEventListener(element, 'touchend', (e) => {
        const touchEndTime = Date.now();
        const touchDuration = touchEndTime - this.touchStartTime;

        if (touchDuration < this.tapTimeThreshold && e.changedTouches && e.changedTouches.length > 0) {
          const endPosition = {
            x: e.changedTouches[0].clientX || 0,
            y: e.changedTouches[0].clientY || 0
          };

          const distance = Math.sqrt(
            Math.pow(endPosition.x - this.touchStartPosition.x, 2) +
            Math.pow(endPosition.y - this.touchStartPosition.y, 2)
          );

          if (distance < this.tapThreshold) {
            const touchData = this.createTouchEventData(e);
            handler(touchData);
          }
        }
      }, options);
    } else {
      // Mouse fallback
      EventCompatibility.addEventListener(element, 'click', (e) => {
        const touchData: TouchEventData = {
          touches: [],
          changedTouches: [{
            x: e.clientX || 0,
            y: e.clientY || 0,
            identifier: 0
          }],
          targetTouches: [],
          preventDefault: e.preventDefault,
          stopPropagation: e.stopPropagation
        };
        handler(touchData);
      }, options);
    }
  }

  /**
   * Add touch start listener
   */
  private static addTouchStartListener(
    element: EventTarget,
    handler: (data: TouchEventData) => void,
    options?: AddEventListenerOptions
  ): void {
    if (this.isTouchSupported()) {
      EventCompatibility.addEventListener(element, 'touchstart', (e) => {
        const touchData = this.createTouchEventData(e);
        handler(touchData);
      }, options);
    } else {
      EventCompatibility.addEventListener(element, 'mousedown', (e) => {
        const touchData: TouchEventData = {
          touches: [{
            x: e.clientX || 0,
            y: e.clientY || 0,
            identifier: 0
          }],
          changedTouches: [{
            x: e.clientX || 0,
            y: e.clientY || 0,
            identifier: 0
          }],
          targetTouches: [{
            x: e.clientX || 0,
            y: e.clientY || 0,
            identifier: 0
          }],
          preventDefault: e.preventDefault,
          stopPropagation: e.stopPropagation
        };
        handler(touchData);
      }, options);
    }
  }

  /**
   * Add touch move listener
   */
  private static addTouchMoveListener(
    element: EventTarget,
    handler: (data: TouchEventData) => void,
    options?: AddEventListenerOptions
  ): void {
    if (this.isTouchSupported()) {
      EventCompatibility.addEventListener(element, 'touchmove', (e) => {
        const touchData = this.createTouchEventData(e);
        handler(touchData);
      }, options);
    } else {
      EventCompatibility.addEventListener(element, 'mousemove', (e) => {
        const touchData: TouchEventData = {
          touches: [{
            x: e.clientX || 0,
            y: e.clientY || 0,
            identifier: 0
          }],
          changedTouches: [{
            x: e.clientX || 0,
            y: e.clientY || 0,
            identifier: 0
          }],
          targetTouches: [{
            x: e.clientX || 0,
            y: e.clientY || 0,
            identifier: 0
          }],
          preventDefault: e.preventDefault,
          stopPropagation: e.stopPropagation
        };
        handler(touchData);
      }, options);
    }
  }

  /**
   * Add touch end listener
   */
  private static addTouchEndListener(
    element: EventTarget,
    handler: (data: TouchEventData) => void,
    options?: AddEventListenerOptions
  ): void {
    if (this.isTouchSupported()) {
      EventCompatibility.addEventListener(element, 'touchend', (e) => {
        const touchData = this.createTouchEventData(e);
        handler(touchData);
      }, options);
    } else {
      EventCompatibility.addEventListener(element, 'mouseup', (e) => {
        const touchData: TouchEventData = {
          touches: [],
          changedTouches: [{
            x: e.clientX || 0,
            y: e.clientY || 0,
            identifier: 0
          }],
          targetTouches: [],
          preventDefault: e.preventDefault,
          stopPropagation: e.stopPropagation
        };
        handler(touchData);
      }, options);
    }
  }

  /**
   * Add swipe listener
   */
  private static addSwipeListener(
    element: EventTarget,
    handler: (data: TouchEventData & { direction: 'left' | 'right' | 'up' | 'down' }) => void,
    options?: AddEventListenerOptions
  ): void {
    let startX = 0;
    let startY = 0;
    let startTime = 0;

    const handleStart = (data: TouchEventData) => {
      if (data.touches.length > 0) {
        startX = data.touches[0].x;
        startY = data.touches[0].y;
        startTime = Date.now();
      }
    };

    const handleEnd = (data: TouchEventData) => {
      if (data.changedTouches.length > 0) {
        const endX = data.changedTouches[0].x;
        const endY = data.changedTouches[0].y;
        const endTime = Date.now();

        const deltaX = endX - startX;
        const deltaY = endY - startY;
        const deltaTime = endTime - startTime;

        // Minimum swipe distance and maximum time
        const minSwipeDistance = 50;
        const maxSwipeTime = 1000;

        if (Math.abs(deltaX) > minSwipeDistance || Math.abs(deltaY) > minSwipeDistance) {
          if (deltaTime < maxSwipeTime) {
            let direction: 'left' | 'right' | 'up' | 'down';

            if (Math.abs(deltaX) > Math.abs(deltaY)) {
              direction = deltaX > 0 ? 'right' : 'left';
            } else {
              direction = deltaY > 0 ? 'down' : 'up';
            }

            handler({ ...data, direction });
          }
        }
      }
    };

    this.addTouchEventListener(element, 'touchstart', handleStart, options);
    this.addTouchEventListener(element, 'touchend', handleEnd, options);
  }

  /**
   * Create normalized touch event data
   */
  private static createTouchEventData(event: any): TouchEventData {
    const convertTouchList = (touchList: TouchList | undefined): TouchPoint[] => {
      if (!touchList) return [];
      const points: TouchPoint[] = [];
      for (let i = 0; i < touchList.length; i++) {
        const touch = touchList[i];
        points.push({
          x: touch.clientX,
          y: touch.clientY,
          identifier: touch.identifier
        });
      }
      return points;
    };

    return {
      touches: convertTouchList(event.touches),
      changedTouches: convertTouchList(event.changedTouches),
      targetTouches: convertTouchList(event.targetTouches),
      preventDefault: event.preventDefault,
      stopPropagation: event.stopPropagation
    };
  }

  /**
   * Prevent default touch behaviors (like scrolling) when needed
   */
  static preventTouchDefaults(element: EventTarget): void {
    EventCompatibility.addEventListener(element, 'touchstart', (e) => {
      e.preventDefault();
    }, { passive: false });

    EventCompatibility.addEventListener(element, 'touchmove', (e) => {
      e.preventDefault();
    }, { passive: false });
  }

  /**
   * Enable touch-friendly interactions
   */
  static makeTouchFriendly(element: HTMLElement): void {
    // Add touch-friendly CSS
    element.style.touchAction = 'manipulation';
    element.style.userSelect = 'none';
    (element.style as any).webkitUserSelect = 'none';
    (element.style as any).webkitTouchCallout = 'none';
    (element.style as any).webkitTapHighlightColor = 'transparent';
  }
}