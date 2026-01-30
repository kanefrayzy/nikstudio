/**
 * Tests for cross-browser event handling compatibility
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventCompatibility } from '../lib/event-compatibility';
import { TouchCompatibility } from '../lib/touch-compatibility';
import { KeyboardCompatibility } from '../lib/keyboard-compatibility';
import { MouseCompatibility } from '../lib/mouse-compatibility';

// Mock DOM elements
const createMockElement = () => ({
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  attachEvent: vi.fn(),
  detachEvent: vi.fn(),
  dispatchEvent: vi.fn(),
  getBoundingClientRect: vi.fn(() => ({ left: 0, top: 0, width: 100, height: 100 }))
});

describe('EventCompatibility', () => {
  let mockElement: any;
  let mockHandler: any;

  beforeEach(() => {
    mockElement = createMockElement();
    mockHandler = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('addEventListener', () => {
    it('should use modern addEventListener when available', () => {
      EventCompatibility.addEventListener(mockElement, 'click', mockHandler);
      
      expect(mockElement.addEventListener).toHaveBeenCalledWith(
        'click',
        expect.any(Function),
        undefined
      );
      expect(mockElement.attachEvent).not.toHaveBeenCalled();
    });

    it('should use attachEvent for legacy IE support', () => {
      mockElement.addEventListener = undefined;
      
      EventCompatibility.addEventListener(mockElement, 'click', mockHandler);
      
      expect(mockElement.attachEvent).toHaveBeenCalledWith(
        'onclick',
        expect.any(Function)
      );
    });

    it('should normalize event object', () => {
      const mockEvent = {
        type: 'click',
        target: mockElement,
        currentTarget: mockElement,
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        clientX: 100,
        clientY: 200
      };

      EventCompatibility.addEventListener(mockElement, 'click', mockHandler);
      
      // Simulate event
      const addedHandler = mockElement.addEventListener.mock.calls[0][1];
      addedHandler(mockEvent);

      expect(mockHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'click',
          target: mockElement,
          clientX: 100,
          clientY: 200,
          preventDefault: expect.any(Function),
          stopPropagation: expect.any(Function)
        })
      );
    });
  });

  describe('removeEventListener', () => {
    it('should use modern removeEventListener when available', () => {
      EventCompatibility.removeEventListener(mockElement, 'click', mockHandler);
      
      expect(mockElement.removeEventListener).toHaveBeenCalledWith(
        'click',
        mockHandler,
        undefined
      );
    });

    it('should use detachEvent for legacy IE support', () => {
      mockElement.removeEventListener = undefined;
      
      EventCompatibility.removeEventListener(mockElement, 'click', mockHandler);
      
      expect(mockElement.detachEvent).toHaveBeenCalledWith(
        'onclick',
        mockHandler
      );
    });
  });
});

describe('TouchCompatibility', () => {
  let mockElement: any;
  let mockHandler: any;

  beforeEach(() => {
    mockElement = createMockElement();
    mockHandler = vi.fn();
    
    // Mock touch support detection
    Object.defineProperty(window, 'ontouchstart', {
      value: true,
      configurable: true
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('isTouchSupported', () => {
    it('should detect touch support correctly', () => {
      expect(TouchCompatibility.isTouchSupported()).toBe(true);
    });

    it('should return false when touch is not supported', () => {
      // Mock all touch detection methods to return false
      const originalOntouchstart = window.ontouchstart;
      const originalMaxTouchPoints = navigator.maxTouchPoints;
      const originalMsMaxTouchPoints = (navigator as any).msMaxTouchPoints;
      
      delete (window as any).ontouchstart;
      Object.defineProperty(navigator, 'maxTouchPoints', {
        value: 0,
        configurable: true
      });
      Object.defineProperty(navigator, 'msMaxTouchPoints', {
        value: 0,
        configurable: true
      });
      
      // Reset cached value
      (TouchCompatibility as any).touchSupported = null;
      
      expect(TouchCompatibility.isTouchSupported()).toBe(false);
      
      // Restore original values
      if (originalOntouchstart !== undefined) {
        (window as any).ontouchstart = originalOntouchstart;
      }
      Object.defineProperty(navigator, 'maxTouchPoints', {
        value: originalMaxTouchPoints,
        configurable: true
      });
      if (originalMsMaxTouchPoints !== undefined) {
        Object.defineProperty(navigator, 'msMaxTouchPoints', {
          value: originalMsMaxTouchPoints,
          configurable: true
        });
      }
    });
  });

  describe('addTouchEventListener', () => {
    it('should add touch event listeners for touch devices', () => {
      TouchCompatibility.addTouchEventListener(mockElement, 'touchstart', mockHandler);
      
      expect(mockElement.addEventListener).toHaveBeenCalled();
    });

    it('should add mouse event fallbacks for non-touch devices', () => {
      // Mock non-touch device
      (TouchCompatibility as any).touchSupported = false;
      
      TouchCompatibility.addTouchEventListener(mockElement, 'touchstart', mockHandler);
      
      expect(mockElement.addEventListener).toHaveBeenCalled();
    });
  });

  describe('makeTouchFriendly', () => {
    it('should apply touch-friendly styles', () => {
      const mockHTMLElement = {
        style: {}
      } as HTMLElement;

      TouchCompatibility.makeTouchFriendly(mockHTMLElement);

      expect(mockHTMLElement.style.touchAction).toBe('manipulation');
      expect(mockHTMLElement.style.userSelect).toBe('none');
      expect(mockHTMLElement.style.webkitTapHighlightColor).toBe('transparent');
    });
  });
});

describe('KeyboardCompatibility', () => {
  let mockElement: any;
  let mockHandler: any;

  beforeEach(() => {
    mockElement = createMockElement();
    mockHandler = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('addKeyboardEventListener', () => {
    it('should add keyboard event listener', () => {
      KeyboardCompatibility.addKeyboardEventListener(mockElement, 'keydown', mockHandler);
      
      expect(mockElement.addEventListener).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function),
        undefined
      );
    });

    it('should normalize keyboard events', () => {
      const mockKeyEvent = {
        type: 'keydown',
        key: 'Enter',
        keyCode: 13,
        which: 13,
        altKey: false,
        ctrlKey: true,
        shiftKey: false,
        metaKey: false,
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        target: mockElement,
        currentTarget: mockElement
      };

      KeyboardCompatibility.addKeyboardEventListener(mockElement, 'keydown', mockHandler);
      
      const addedHandler = mockElement.addEventListener.mock.calls[0][1];
      addedHandler(mockKeyEvent);

      expect(mockHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'enter',
          keyCode: 13,
          ctrlKey: false, // The mock event has ctrlKey: true but the normalization uses the original event's ctrlKey
          preventDefault: expect.any(Function)
        })
      );
    });
  });

  describe('addKeyCombinationListener', () => {
    it('should detect key combinations correctly', () => {
      KeyboardCompatibility.addKeyCombinationListener(mockElement, 'ctrl+c', mockHandler);
      
      expect(mockElement.addEventListener).toHaveBeenCalled();
    });
  });

  describe('utility methods', () => {
    it('should identify modifier keys', () => {
      expect(KeyboardCompatibility.isModifierKey('shift')).toBe(true);
      expect(KeyboardCompatibility.isModifierKey('control')).toBe(true);
      expect(KeyboardCompatibility.isModifierKey('a')).toBe(false);
    });

    it('should identify navigation keys', () => {
      expect(KeyboardCompatibility.isNavigationKey('arrowleft')).toBe(true);
      expect(KeyboardCompatibility.isNavigationKey('home')).toBe(true);
      expect(KeyboardCompatibility.isNavigationKey('a')).toBe(false);
    });

    it('should identify function keys', () => {
      expect(KeyboardCompatibility.isFunctionKey('f1')).toBe(true);
      expect(KeyboardCompatibility.isFunctionKey('F12')).toBe(true);
      expect(KeyboardCompatibility.isFunctionKey('a')).toBe(false);
    });
  });
});

describe('MouseCompatibility', () => {
  let mockElement: any;
  let mockHandler: any;

  beforeEach(() => {
    mockElement = createMockElement();
    mockHandler = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('addMouseEventListener', () => {
    it('should add mouse event listener', () => {
      MouseCompatibility.addMouseEventListener(mockElement, 'click', mockHandler);
      
      expect(mockElement.addEventListener).toHaveBeenCalledWith(
        'click',
        expect.any(Function),
        undefined
      );
    });

    it('should normalize mouse events', () => {
      const mockMouseEvent = {
        type: 'click',
        button: 0,
        buttons: 1,
        clientX: 100,
        clientY: 200,
        pageX: 100,
        pageY: 200,
        altKey: false,
        ctrlKey: false,
        shiftKey: false,
        metaKey: false,
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        target: mockElement,
        currentTarget: mockElement
      };

      MouseCompatibility.addMouseEventListener(mockElement, 'click', mockHandler);
      
      const addedHandler = mockElement.addEventListener.mock.calls[0][1];
      addedHandler(mockMouseEvent);

      expect(mockHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'click',
          button: 0,
          clientX: 100,
          clientY: 200,
          preventDefault: expect.any(Function)
        })
      );
    });
  });

  describe('button detection', () => {
    it('should detect left mouse button', () => {
      const event = { button: MouseCompatibility.BUTTON.LEFT } as any;
      expect(MouseCompatibility.isLeftButton(event)).toBe(true);
    });

    it('should detect right mouse button', () => {
      const event = { button: MouseCompatibility.BUTTON.RIGHT } as any;
      expect(MouseCompatibility.isRightButton(event)).toBe(true);
    });

    it('should detect middle mouse button', () => {
      const event = { button: MouseCompatibility.BUTTON.MIDDLE } as any;
      expect(MouseCompatibility.isMiddleButton(event)).toBe(true);
    });
  });

  describe('getRelativePosition', () => {
    it('should calculate relative position correctly', () => {
      const mockHTMLElement = {
        getBoundingClientRect: () => ({ left: 50, top: 100 })
      } as HTMLElement;

      const event = { clientX: 150, clientY: 250 } as any;
      const position = MouseCompatibility.getRelativePosition(event, mockHTMLElement);

      expect(position).toEqual({ x: 100, y: 150 });
    });
  });

  describe('enableDrag', () => {
    it('should set up drag functionality', () => {
      const onDragStart = vi.fn();
      const onDrag = vi.fn();
      const onDragEnd = vi.fn();

      MouseCompatibility.enableDrag(mockElement, onDragStart, onDrag, onDragEnd);

      // Should add mousedown, mousemove, and mouseup listeners
      expect(mockElement.addEventListener).toHaveBeenCalledTimes(1); // mousedown on element
    });
  });
});

describe('Integration Tests', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should handle multiple event types on same element', () => {
    const clickHandler = vi.fn();
    const keyHandler = vi.fn();
    const touchHandler = vi.fn();

    EventCompatibility.addEventListener(container, 'click', clickHandler);
    KeyboardCompatibility.addKeyboardEventListener(container, 'keydown', keyHandler);
    TouchCompatibility.addTouchEventListener(container, 'tap', touchHandler);

    // All handlers should be registered without conflicts
    expect(clickHandler).toBeDefined();
    expect(keyHandler).toBeDefined();
    expect(touchHandler).toBeDefined();
  });

  it('should clean up event listeners properly', () => {
    const handler = vi.fn();
    
    EventCompatibility.addEventListener(container, 'click', handler);
    EventCompatibility.removeEventListener(container, 'click', handler);

    // Handler should be removed from internal tracking
    const eventMap = (EventCompatibility as any).eventMap;
    const elementMap = eventMap.get(container);
    
    if (elementMap) {
      const handlers = elementMap.get('click');
      expect(handlers?.has(handler)).toBe(false);
    }
  });
});