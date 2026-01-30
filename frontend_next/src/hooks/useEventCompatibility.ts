/**
 * React hook for cross-browser event handling compatibility
 */

import { useRef, useCallback } from 'react';
import { EventCompatibility } from '../lib/event-compatibility';

/**
 * Hook for unified event handling with cross-browser compatibility
 */
export function useEventCompatibility<T extends HTMLElement = HTMLElement>() {
    const elementRef = useRef<T>(null);

    const addEventListener = useCallback((
        eventType: string,
        handler: (event: any) => void,
        options?: boolean | AddEventListenerOptions
    ) => {
        if (elementRef.current) {
            EventCompatibility.addEventListener(elementRef.current, eventType, handler, options);
        }
    }, []);

    const removeEventListener = useCallback((
        eventType: string,
        handler: (event: any) => void,
        options?: boolean | EventListenerOptions
    ) => {
        if (elementRef.current) {
            EventCompatibility.removeEventListener(elementRef.current, eventType, handler, options);
        }
    }, []);

    return {
        ref: elementRef,
        addEventListener,
        removeEventListener
    };
}

// Commented out functions that depend on non-existent classes
/*
export function useTouchCompatibility<T extends HTMLElement = HTMLElement>() {
    // Implementation commented out due to missing TouchCompatibility class
}

export function useKeyboardCompatibility<T extends HTMLElement = HTMLElement>() {
    // Implementation commented out due to missing KeyboardCompatibility class
}

export function useMouseCompatibility<T extends HTMLElement = HTMLElement>() {
    // Implementation commented out due to missing MouseCompatibility class
}

export function useAllEventCompatibility<T extends HTMLElement = HTMLElement>() {
    // Implementation commented out due to missing compatibility classes
}
*/