/**
 * Keyboard event normalization for consistent behavior across browsers
 * Handles key code differences and provides unified key handling
 */

import { EventCompatibility } from './event-compatibility';

export interface NormalizedKeyEvent {
  key: string;
  code: string;
  keyCode: number;
  which: number;
  altKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
  repeat: boolean;
  preventDefault: () => void;
  stopPropagation: () => void;
  originalEvent: Event;
}

/**
 * Keyboard compatibility handler
 */
export class KeyboardCompatibility {
  // Key code mappings for older browsers
  private static readonly KEY_CODES = {
    8: 'Backspace',
    9: 'Tab',
    13: 'Enter',
    16: 'Shift',
    17: 'Control',
    18: 'Alt',
    19: 'Pause',
    20: 'CapsLock',
    27: 'Escape',
    32: 'Space',
    33: 'PageUp',
    34: 'PageDown',
    35: 'End',
    36: 'Home',
    37: 'ArrowLeft',
    38: 'ArrowUp',
    39: 'ArrowRight',
    40: 'ArrowDown',
    45: 'Insert',
    46: 'Delete',
    48: '0', 49: '1', 50: '2', 51: '3', 52: '4',
    53: '5', 54: '6', 55: '7', 56: '8', 57: '9',
    65: 'a', 66: 'b', 67: 'c', 68: 'd', 69: 'e',
    70: 'f', 71: 'g', 72: 'h', 73: 'i', 74: 'j',
    75: 'k', 76: 'l', 77: 'm', 78: 'n', 79: 'o',
    80: 'p', 81: 'q', 82: 'r', 83: 's', 84: 't',
    85: 'u', 86: 'v', 87: 'w', 88: 'x', 89: 'y',
    90: 'z',
    91: 'MetaLeft',
    92: 'MetaRight',
    93: 'ContextMenu',
    96: 'Numpad0', 97: 'Numpad1', 98: 'Numpad2', 99: 'Numpad3',
    100: 'Numpad4', 101: 'Numpad5', 102: 'Numpad6', 103: 'Numpad7',
    104: 'Numpad8', 105: 'Numpad9',
    106: 'NumpadMultiply',
    107: 'NumpadAdd',
    109: 'NumpadSubtract',
    110: 'NumpadDecimal',
    111: 'NumpadDivide',
    112: 'F1', 113: 'F2', 114: 'F3', 115: 'F4',
    116: 'F5', 117: 'F6', 118: 'F7', 119: 'F8',
    120: 'F9', 121: 'F10', 122: 'F11', 123: 'F12',
    144: 'NumLock',
    145: 'ScrollLock',
    186: ';', 187: '=', 188: ',', 189: '-',
    190: '.', 191: '/', 192: '`',
    219: '[', 220: '\\', 221: ']', 222: "'"
  };

  // Common key combinations
  private static readonly KEY_COMBINATIONS = {
    'ctrl+c': { ctrlKey: true, key: 'c' },
    'ctrl+v': { ctrlKey: true, key: 'v' },
    'ctrl+x': { ctrlKey: true, key: 'x' },
    'ctrl+z': { ctrlKey: true, key: 'z' },
    'ctrl+y': { ctrlKey: true, key: 'y' },
    'ctrl+a': { ctrlKey: true, key: 'a' },
    'ctrl+s': { ctrlKey: true, key: 's' },
    'alt+tab': { altKey: true, key: 'Tab' },
    'shift+tab': { shiftKey: true, key: 'Tab' }
  };

  /**
   * Add keyboard event listener with normalization
   */
  static addKeyboardEventListener(
    element: EventTarget,
    eventType: 'keydown' | 'keyup' | 'keypress',
    handler: (event: NormalizedKeyEvent) => void,
    options?: AddEventListenerOptions
  ): void {
    EventCompatibility.addEventListener(element, eventType, (e) => {
      const normalizedEvent = this.normalizeKeyboardEvent(e);
      handler(normalizedEvent);
    }, options);
  }

  /**
   * Add key combination listener
   */
  static addKeyCombinationListener(
    element: EventTarget,
    combination: string,
    handler: (event: NormalizedKeyEvent) => void,
    options?: AddEventListenerOptions
  ): void {
    const combo = this.KEY_COMBINATIONS[combination.toLowerCase() as keyof typeof this.KEY_COMBINATIONS];
    if (!combo) {
      console.warn(`Unknown key combination: ${combination}`);
      return;
    }

    this.addKeyboardEventListener(element, 'keydown', (event) => {
      if (this.matchesKeyCombination(event, combo)) {
        event.preventDefault();
        handler(event);
      }
    }, options);
  }

  /**
   * Normalize keyboard event for cross-browser consistency
   */
  private static normalizeKeyboardEvent(event: any): NormalizedKeyEvent {
    const keyCode = event.keyCode || event.which || 0;
    const key = event.key || this.KEY_CODES[keyCode as keyof typeof this.KEY_CODES] || String.fromCharCode(keyCode);
    
    // Generate code if not available
    let code = event.code;
    if (!code) {
      code = this.generateKeyCode(key, keyCode);
    }

    return {
      key: key.toLowerCase(),
      code,
      keyCode,
      which: event.which || keyCode,
      altKey: !!event.altKey,
      ctrlKey: !!event.ctrlKey,
      shiftKey: !!event.shiftKey,
      metaKey: !!event.metaKey,
      repeat: !!event.repeat,
      preventDefault: event.preventDefault,
      stopPropagation: event.stopPropagation,
      originalEvent: event.originalEvent || event
    };
  }

  /**
   * Generate key code for older browsers
   */
  private static generateKeyCode(key: string, keyCode: number): string {
    // Handle special keys
    const specialKeys: { [key: string]: string } = {
      'backspace': 'Backspace',
      'tab': 'Tab',
      'enter': 'Enter',
      'shift': 'ShiftLeft',
      'control': 'ControlLeft',
      'alt': 'AltLeft',
      'escape': 'Escape',
      ' ': 'Space',
      'arrowleft': 'ArrowLeft',
      'arrowup': 'ArrowUp',
      'arrowright': 'ArrowRight',
      'arrowdown': 'ArrowDown'
    };

    const lowerKey = key.toLowerCase();
    if (specialKeys[lowerKey]) {
      return specialKeys[lowerKey];
    }

    // Handle letter keys
    if (key.length === 1 && key.match(/[a-z]/i)) {
      return `Key${key.toUpperCase()}`;
    }

    // Handle number keys
    if (key.length === 1 && key.match(/[0-9]/)) {
      return `Digit${key}`;
    }

    // Handle function keys
    if (key.match(/^f\d+$/i)) {
      return key.toUpperCase();
    }

    // Fallback
    return `Key${keyCode}`;
  }

  /**
   * Check if event matches key combination
   */
  private static matchesKeyCombination(event: NormalizedKeyEvent, combo: any): boolean {
    return (
      (!combo.ctrlKey || event.ctrlKey) &&
      (!combo.altKey || event.altKey) &&
      (!combo.shiftKey || event.shiftKey) &&
      (!combo.metaKey || event.metaKey) &&
      event.key.toLowerCase() === combo.key.toLowerCase()
    );
  }

  /**
   * Check if key is a modifier key
   */
  static isModifierKey(key: string): boolean {
    const modifiers = ['shift', 'control', 'alt', 'meta', 'capslock', 'numlock', 'scrolllock'];
    return modifiers.includes(key.toLowerCase());
  }

  /**
   * Check if key is a navigation key
   */
  static isNavigationKey(key: string): boolean {
    const navigationKeys = [
      'arrowleft', 'arrowup', 'arrowright', 'arrowdown',
      'home', 'end', 'pageup', 'pagedown',
      'tab', 'enter', 'escape'
    ];
    return navigationKeys.includes(key.toLowerCase());
  }

  /**
   * Check if key is a function key
   */
  static isFunctionKey(key: string): boolean {
    return /^f\d+$/i.test(key);
  }

  /**
   * Get printable character from key event
   */
  static getPrintableCharacter(event: NormalizedKeyEvent): string | null {
    // Don't return characters for modifier keys or special keys
    if (this.isModifierKey(event.key) || this.isNavigationKey(event.key) || this.isFunctionKey(event.key)) {
      return null;
    }

    // Handle special cases
    if (event.key === 'space') return ' ';
    if (event.key === 'tab') return '\t';
    if (event.key === 'enter') return '\n';

    // Return the key if it's a single printable character
    if (event.key.length === 1) {
      return event.key;
    }

    return null;
  }

  /**
   * Prevent default browser shortcuts
   */
  static preventBrowserShortcuts(element: EventTarget, shortcuts: string[]): void {
    shortcuts.forEach(shortcut => {
      this.addKeyCombinationListener(element, shortcut, (event) => {
        event.preventDefault();
      });
    });
  }

  /**
   * Enable keyboard navigation for element
   */
  static enableKeyboardNavigation(element: HTMLElement): void {
    // Make element focusable if not already
    if (!element.hasAttribute('tabindex')) {
      element.setAttribute('tabindex', '0');
    }

    // Add keyboard event listeners for common navigation
    this.addKeyboardEventListener(element, 'keydown', (event) => {
      switch (event.key) {
        case 'enter':
        case ' ':
          // Trigger click on Enter or Space
          if (element.click) {
            element.click();
            event.preventDefault();
          }
          break;
        case 'escape':
          // Remove focus on Escape
          if (element.blur) {
            element.blur();
            event.preventDefault();
          }
          break;
      }
    });
  }
}