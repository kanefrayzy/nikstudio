/**
 * Tests for Admin Compatibility Provider
 */

import * as React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    AdminCompatibilityProvider,
    useAdminCompatibility,
    AdminCompatibilityWarnings,
    getAdminCompatibilityInfo
} from '@/components/AdminCompatibilityProvider';

// Mock component to test the hook
const TestComponent = () => {
    const { capabilities, utils, warnings } = useAdminCompatibility();

    return (
        <div>
            <div data-testid="dialog-support">
                {capabilities.dialog.supportsNativeDialog ? 'supported' : 'not-supported'}
            </div>
            <div data-testid="select-support">
                {capabilities.select.supportsCustomSelect ? 'supported' : 'not-supported'}
            </div>
            <div data-testid="file-support">
                {capabilities.fileInput.supportsFileApi ? 'supported' : 'not-supported'}
            </div>
            <div data-testid="animation-support">
                {capabilities.animations.supportsCSSAnimations ? 'supported' : 'not-supported'}
            </div>
            <div data-testid="warnings-count">{warnings.length}</div>
            <button
                data-testid="add-warning"
                onClick={() => utils.showCompatibilityWarning('Test warning')}
            >
                Add Warning
            </button>
        </div>
    );
};

// Mock DOM APIs
const mockHTMLDialogElement = vi.fn();
const mockFormData = vi.fn();

describe('AdminCompatibilityProvider', () => {
    beforeEach(() => {
        // Reset DOM mocks
        vi.clearAllMocks();

        // Mock document.createElement to return proper elements
        const originalCreateElement = document.createElement;
        vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
            const element = originalCreateElement.call(document, tagName);
            if (tagName === 'input') {
                Object.defineProperty(element, 'type', {
                    value: '',
                    writable: true,
                    configurable: true
                });
            }
            return element;
        });

        // Mock window and document
        Object.defineProperty(window, 'HTMLDialogElement', {
            value: mockHTMLDialogElement,
            writable: true,
            configurable: true
        });

        Object.defineProperty(window, 'FormData', {
            value: mockFormData,
            writable: true,
            configurable: true
        });

        // Mock navigator
        Object.defineProperty(navigator, 'userAgent', {
            value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            writable: true,
            configurable: true
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should provide compatibility capabilities', async () => {
        render(
            <AdminCompatibilityProvider>
                <TestComponent />
            </AdminCompatibilityProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('dialog-support')).toBeInTheDocument();
            expect(screen.getByTestId('select-support')).toBeInTheDocument();
            expect(screen.getByTestId('file-support')).toBeInTheDocument();
            expect(screen.getByTestId('animation-support')).toBeInTheDocument();
        });
    });

    it('should detect modern browser capabilities', async () => {
        // Mock modern browser
        Object.defineProperty(window, 'HTMLDialogElement', {
            value: function () { },
            writable: true
        });

        render(
            <AdminCompatibilityProvider>
                <TestComponent />
            </AdminCompatibilityProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('dialog-support')).toHaveTextContent('supported');
        });
    });

    it('should detect legacy browser limitations', async () => {
        // Mock legacy browser
        Object.defineProperty(window, 'HTMLDialogElement', {
            value: undefined,
            writable: true
        });

        render(
            <AdminCompatibilityProvider>
                <TestComponent />
            </AdminCompatibilityProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('dialog-support')).toHaveTextContent('not-supported');
        });
    });

    it('should show warnings when enabled', async () => {
        // Mock IE browser
        Object.defineProperty(navigator, 'userAgent', {
            value: 'Mozilla/4.0 (compatible; MSIE 10.0; Windows NT 6.1; Trident/6.0)',
            writable: true
        });

        render(
            <AdminCompatibilityProvider showWarnings>
                <AdminCompatibilityWarnings />
                <TestComponent />
            </AdminCompatibilityProvider>
        );

        await waitFor(() => {
            expect(screen.getByText(/Internet Explorer устарел/)).toBeInTheDocument();
        });
    });

    it('should allow adding custom warnings', async () => {
        render(
            <AdminCompatibilityProvider>
                <TestComponent />
            </AdminCompatibilityProvider>
        );

        const addWarningButton = screen.getByTestId('add-warning');
        const warningsCount = screen.getByTestId('warnings-count');

        expect(warningsCount).toHaveTextContent('0');

        addWarningButton.click();

        await waitFor(() => {
            expect(warningsCount).toHaveTextContent('1');
        });
    });

    it('should provide utility functions', async () => {
        const TestUtilsComponent = () => {
            const { utils } = useAdminCompatibility();

            const testElement = document.createElement('div');

            return (
                <div>
                    <button
                        data-testid="test-utils"
                        onClick={() => {
                            utils.addCompatibilityClass(testElement, 'test-class');
                            utils.applyFallbackStyles(testElement, { color: 'red' });
                        }}
                    >
                        Test Utils
                    </button>
                </div>
            );
        };

        render(
            <AdminCompatibilityProvider>
                <TestUtilsComponent />
            </AdminCompatibilityProvider>
        );

        const testButton = screen.getByTestId('test-utils');
        expect(testButton).toBeInTheDocument();

        // Test that utils functions don't throw errors
        expect(() => testButton.click()).not.toThrow();
    });

    it('should throw error when used outside provider', () => {
        const TestComponentWithoutProvider = () => {
            try {
                useAdminCompatibility();
                return <div>Should not render</div>;
            } catch {
                return <div data-testid="error">Error caught</div>;
            }
        };

        render(<TestComponentWithoutProvider />);
        expect(screen.getByTestId('error')).toBeInTheDocument();
    });
});

describe('getAdminCompatibilityInfo', () => {
    it('should return compatibility information', () => {
        const info = getAdminCompatibilityInfo();

        expect(info).toHaveProperty('dialog');
        expect(info).toHaveProperty('select');
        expect(info).toHaveProperty('fileInput');
        expect(info).toHaveProperty('animations');
        expect(info).toHaveProperty('general');

        expect(info.dialog).toHaveProperty('supportsNativeDialog');
        expect(info.dialog).toHaveProperty('needsPolyfill');

        expect(info.general).toHaveProperty('isIE');
        expect(info.general).toHaveProperty('isChrome');
        expect(info.general).toHaveProperty('isSafari');
        expect(info.general).toHaveProperty('isFirefox');
    });

    it('should detect IE browser', () => {
        Object.defineProperty(navigator, 'userAgent', {
            value: 'Mozilla/4.0 (compatible; MSIE 11.0; Windows NT 6.1; Trident/7.0)',
            writable: true
        });

        const info = getAdminCompatibilityInfo();
        expect(info.general.isIE).toBe(true);
        expect(info.general.isChrome).toBe(false);
    });

    it('should detect Chrome browser', () => {
        Object.defineProperty(navigator, 'userAgent', {
            value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            writable: true
        });

        const info = getAdminCompatibilityInfo();
        expect(info.general.isChrome).toBe(true);
        expect(info.general.isIE).toBe(false);
    });

    it('should detect Safari browser', () => {
        Object.defineProperty(navigator, 'userAgent', {
            value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
            writable: true
        });

        const info = getAdminCompatibilityInfo();
        expect(info.general.isSafari).toBe(true);
        expect(info.general.isChrome).toBe(false);
    });
});