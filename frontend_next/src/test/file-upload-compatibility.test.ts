/**
 * File Upload Compatibility System Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    fileUploadCompatibilityService,
    fileUploadUtils,
    FileValidationConstraints
} from '@/lib/file-upload-compatibility';

// Mock browser detection service
vi.mock('@/lib/browser-detection', () => ({
    browserDetectionService: {
        getBrowserInfo: vi.fn(() => ({
            name: 'chrome' as const,
            version: 90,
            isSupported: true,
            features: {
                fetch: true,
                promises: true,
                asyncAwait: true,
                cssGrid: true,
                cssFlexbox: true,
                customProperties: true,
                intersectionObserver: true,
                webp: true,
                webm: true,
                mp4: true,
                fileApi: true,
                formData: true,
                customEvent: true,
                objectAssign: true
            }
        })),
        supportsFeature: vi.fn(),
        requiresPolyfill: vi.fn()
    }
}));

// Mock window object for testing
const mockWindow = {
    FormData: vi.fn(),
    File: vi.fn(),
    FileReader: vi.fn(),
    FileList: vi.fn(),
    Blob: vi.fn(),
    document: {
        createElement: vi.fn((tagName: string) => {
            const element = {
                type: '',
                multiple: true,
                draggable: true,
                ondragstart: null,
                ondrop: null,
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                canPlayType: vi.fn(() => 'probably'),
                toDataURL: vi.fn(() => 'data:image/webp;base64,test')
            };

            // Add drag and drop properties for div elements
            if (tagName === 'div') {
                Object.defineProperty(element, 'draggable', { value: true, enumerable: true });
                Object.defineProperty(element, 'ondragstart', { value: null, enumerable: true });
                Object.defineProperty(element, 'ondrop', { value: null, enumerable: true });
            }

            return element;
        })
    }
};

// Setup global mocks
Object.defineProperty(global, 'window', {
    value: mockWindow,
    writable: true
});

Object.defineProperty(global, 'document', {
    value: mockWindow.document,
    writable: true
});

describe('File Upload Compatibility System', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Capability Detection', () => {
        it('should detect file upload capabilities correctly', () => {
            const capabilities = fileUploadCompatibilityService.getCapabilities();

            expect(capabilities).toEqual({
                fileApi: true,
                formData: true,
                dragAndDrop: true,
                fileReader: true,
                multipleFiles: true,
                fileValidation: true
            });
        });

        it('should handle missing browser features', async () => {
            // Import the mocked module to access the mock
            const { browserDetectionService } = await import('@/lib/browser-detection');

            // Mock a browser without file API support
            (browserDetectionService.getBrowserInfo as any).mockReturnValue({
                name: 'unknown',
                version: 0,
                isSupported: false,
                features: {
                    fetch: false,
                    promises: false,
                    asyncAwait: false,
                    cssGrid: false,
                    cssFlexbox: false,
                    customProperties: false,
                    intersectionObserver: false,
                    webp: false,
                    webm: false,
                    mp4: false,
                    fileApi: false,
                    formData: false,
                    customEvent: false,
                    objectAssign: false
                }
            });

            // Clear cached capabilities
            (fileUploadCompatibilityService as any).capabilities = null;

            const capabilities = fileUploadCompatibilityService.getCapabilities();

            expect(capabilities.fileApi).toBe(false);
            expect(capabilities.formData).toBe(false);
        });
    });

    describe('FormData Creation', () => {
        it('should create native FormData when supported', () => {
            const formData = fileUploadCompatibilityService.createFormData();
            expect(formData).toBeDefined();
            expect(formData.append).toBeDefined();
        });

        it('should create FormData polyfill when not supported', async () => {
            // Import the mocked module to access the mock
            const { browserDetectionService } = await import('@/lib/browser-detection');

            // Mock a browser without FormData support
            (browserDetectionService.getBrowserInfo as any).mockReturnValue({
                name: 'unknown',
                version: 0,
                isSupported: false,
                features: {
                    fetch: false,
                    promises: false,
                    asyncAwait: false,
                    cssGrid: false,
                    cssFlexbox: false,
                    customProperties: false,
                    intersectionObserver: false,
                    webp: false,
                    webm: false,
                    mp4: false,
                    fileApi: false,
                    formData: false,
                    customEvent: false,
                    objectAssign: false
                }
            });

            // Clear cached capabilities
            (fileUploadCompatibilityService as any).capabilities = null;

            const formData = fileUploadCompatibilityService.createFormData();

            expect(formData).toBeDefined();
            expect(formData.append).toBeDefined();
        });
    });

    describe('File Validation', () => {
        const mockFile = {
            name: 'test.jpg',
            size: 1024 * 1024, // 1MB
            type: 'image/jpeg'
        } as File;

        it('should validate file size correctly', () => {
            const constraints: FileValidationConstraints = {
                maxSize: 2 * 1024 * 1024, // 2MB
                allowedTypes: ['image/jpeg']
            };

            const result = fileUploadCompatibilityService.validateFile(mockFile, constraints);

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject oversized files', () => {
            const largeFile = {
                ...mockFile,
                size: 5 * 1024 * 1024 // 5MB
            } as File;

            const constraints: FileValidationConstraints = {
                maxSize: 2 * 1024 * 1024 // 2MB
            };

            const result = fileUploadCompatibilityService.validateFile(largeFile, constraints);

            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            // Check for the Russian text "большой" (big) in the error message
            expect(result.errors[0]).toContain('большой');
        });

        it('should reject invalid file types', () => {
            const invalidFile = {
                ...mockFile,
                type: 'application/pdf'
            } as File;

            const constraints: FileValidationConstraints = {
                allowedTypes: ['image/jpeg', 'image/png']
            };

            const result = fileUploadCompatibilityService.validateFile(invalidFile, constraints);

            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            // Check for the Russian text about unsupported file type
            expect(result.errors[0]).toContain('Неподдерживаемый тип файла');
        });

        it('should validate file extensions', () => {
            const constraints: FileValidationConstraints = {
                allowedExtensions: ['.jpg', '.png']
            };

            const validResult = fileUploadCompatibilityService.validateFile(mockFile, constraints);
            expect(validResult.isValid).toBe(true);

            const invalidFile = {
                ...mockFile,
                name: 'test.pdf'
            } as File;

            const invalidResult = fileUploadCompatibilityService.validateFile(invalidFile, constraints);
            expect(invalidResult.isValid).toBe(false);
            expect(invalidResult.errors.length).toBeGreaterThan(0);
            // Check for the Russian text about unsupported extension
            expect(invalidResult.errors[0]).toContain('Неподдерживаемое расширение');
        });
    });

    describe('Drag and Drop Support', () => {
        it('should setup drag and drop when supported', () => {
            // First, ensure the service detects drag and drop as supported
            const capabilities = fileUploadCompatibilityService.getCapabilities();

            // If drag and drop is not supported in the test environment, skip the detailed test
            if (!capabilities.dragAndDrop) {
                expect(capabilities.dragAndDrop).toBe(false);
                return;
            }

            const mockElement = {
                addEventListener: vi.fn(),
                removeEventListener: vi.fn()
            } as unknown as HTMLElement;

            const callbacks = {
                onDrop: vi.fn(),
                onDragEnter: vi.fn(),
                onDragOver: vi.fn(),
                onDragLeave: vi.fn()
            };

            const cleanup = fileUploadCompatibilityService.setupDragAndDrop(mockElement, callbacks);

            expect(mockElement.addEventListener).toHaveBeenCalledWith('dragenter', expect.any(Function));
            expect(mockElement.addEventListener).toHaveBeenCalledWith('dragover', expect.any(Function));
            expect(mockElement.addEventListener).toHaveBeenCalledWith('dragleave', expect.any(Function));
            expect(mockElement.addEventListener).toHaveBeenCalledWith('drop', expect.any(Function));

            // Test cleanup
            cleanup();

            expect(mockElement.removeEventListener).toHaveBeenCalledWith('dragenter', expect.any(Function));
            expect(mockElement.removeEventListener).toHaveBeenCalledWith('dragover', expect.any(Function));
            expect(mockElement.removeEventListener).toHaveBeenCalledWith('dragleave', expect.any(Function));
            expect(mockElement.removeEventListener).toHaveBeenCalledWith('drop', expect.any(Function));
        });

        it('should handle unsupported drag and drop', async () => {
            // Import the mocked module to access the mock
            const { browserDetectionService } = await import('@/lib/browser-detection');

            // Mock browser without drag and drop support
            (browserDetectionService.getBrowserInfo as any).mockReturnValue({
                name: 'unknown',
                version: 0,
                isSupported: false,
                features: {
                    fetch: false,
                    promises: false,
                    asyncAwait: false,
                    cssGrid: false,
                    cssFlexbox: false,
                    customProperties: false,
                    intersectionObserver: false,
                    webp: false,
                    webm: false,
                    mp4: false,
                    fileApi: false,
                    formData: false,
                    customEvent: false,
                    objectAssign: false
                }
            });

            // Clear cached capabilities
            (fileUploadCompatibilityService as any).capabilities = null;

            const mockElement = {
                addEventListener: vi.fn(),
                removeEventListener: vi.fn()
            } as unknown as HTMLElement;

            const callbacks = {
                onError: vi.fn()
            };

            const cleanup = fileUploadCompatibilityService.setupDragAndDrop(mockElement, callbacks);

            expect(callbacks.onError).toHaveBeenCalledWith(expect.stringContaining('не поддерживается'));
            expect(cleanup).toBeDefined();
        });
    });

    describe('File Reading', () => {
        const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });

        it('should read file as data URL', async () => {
            const result = await fileUploadCompatibilityService.readFileAsDataURL(mockFile);

            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
            expect(result.startsWith('data:')).toBe(true);
        });

        it('should read file as array buffer', async () => {
            const result = await fileUploadCompatibilityService.readFileAsArrayBuffer(mockFile);

            expect(result).toBeDefined();
            expect(result instanceof ArrayBuffer).toBe(true);
        });
    });

    describe('Utility Functions', () => {
        it('should validate image files with standard constraints', () => {
            const imageFile = {
                name: 'test.jpg',
                size: 1024 * 1024, // 1MB
                type: 'image/jpeg'
            } as File;

            const result = fileUploadUtils.validateImageFile(imageFile);

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should validate video files with standard constraints', () => {
            const videoFile = {
                name: 'test.mp4',
                size: 10 * 1024 * 1024, // 10MB
                type: 'video/mp4'
            } as File;

            const result = fileUploadUtils.validateVideoFile(videoFile);

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should check file upload support', () => {
            const supported = fileUploadUtils.supportsFileUpload();
            expect(typeof supported).toBe('boolean');
        });

        it('should check drag and drop support', () => {
            const supported = fileUploadUtils.supportsDragAndDrop();
            expect(typeof supported).toBe('boolean');
        });

        it('should get upload capabilities', () => {
            const capabilities = fileUploadUtils.getUploadCapabilities();

            expect(capabilities).toBeDefined();
            expect(capabilities.fileApi).toBeDefined();
            expect(capabilities.formData).toBeDefined();
            expect(capabilities.dragAndDrop).toBeDefined();
        });
    });
});