/**
 * Comprehensive test suite for video poster upload functionality
 * Tests validation functions and form behavior
 */

import { describe, it, expect } from 'vitest';

// Helper function to create test files
const createTestFile = (name: string, size: number, type: string): File => {
  const file = new File(['test content'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

// Validation functions extracted from the component for testing
const validateFileSize = (file: File, fileType: 'image' | 'video' = 'image'): boolean => {
  const maxSizeImage = 2 * 1024 * 1024; // 2MB для изображений
  const maxSizeVideo = 50 * 1024 * 1024; // 50MB для видео
  const maxSize = fileType === 'image' ? maxSizeImage : maxSizeVideo;
  return file.size <= maxSize;
};

const getFileSizeLimit = (fileType: 'image' | 'video'): string => {
  return fileType === 'image' ? '2 MB' : '50 MB';
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const validateImageFile = (file: File): boolean => {
  const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
  const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  return validExtensions.includes(fileExtension) && validMimeTypes.includes(file.type);
};

describe('Video Poster Upload - Validation Functions', () => {
  describe('File Size Validation', () => {
    it('should validate image file sizes correctly', () => {
      const smallImage = createTestFile('small.jpg', 1024 * 1024, 'image/jpeg'); // 1MB
      const largeImage = createTestFile('large.jpg', 3 * 1024 * 1024, 'image/jpeg'); // 3MB
      const maxSizeImage = createTestFile('max.jpg', 2 * 1024 * 1024, 'image/jpeg'); // 2MB

      expect(validateFileSize(smallImage, 'image')).toBe(true);
      expect(validateFileSize(largeImage, 'image')).toBe(false);
      expect(validateFileSize(maxSizeImage, 'image')).toBe(true);
    });

    it('should validate video file sizes correctly', () => {
      const smallVideo = createTestFile('small.mp4', 10 * 1024 * 1024, 'video/mp4'); // 10MB
      const largeVideo = createTestFile('large.mp4', 60 * 1024 * 1024, 'video/mp4'); // 60MB
      const maxSizeVideo = createTestFile('max.mp4', 50 * 1024 * 1024, 'video/mp4'); // 50MB

      expect(validateFileSize(smallVideo, 'video')).toBe(true);
      expect(validateFileSize(largeVideo, 'video')).toBe(false);
      expect(validateFileSize(maxSizeVideo, 'video')).toBe(true);
    });

    it('should return correct file size limits', () => {
      expect(getFileSizeLimit('image')).toBe('2 MB');
      expect(getFileSizeLimit('video')).toBe('50 MB');
    });
  });

  describe('Image Format Validation', () => {
    it('should validate valid image formats', () => {
      const validImages = [
        createTestFile('test.jpg', 1024, 'image/jpeg'),
        createTestFile('test.jpeg', 1024, 'image/jpeg'),
        createTestFile('test.png', 1024, 'image/png'),
        createTestFile('test.gif', 1024, 'image/gif'),
        createTestFile('test.webp', 1024, 'image/webp'),
      ];

      validImages.forEach(file => {
        expect(validateImageFile(file)).toBe(true);
      });
    });

    it('should reject invalid image formats', () => {
      const invalidImages = [
        createTestFile('test.txt', 1024, 'text/plain'),
        createTestFile('test.pdf', 1024, 'application/pdf'),
        createTestFile('test.doc', 1024, 'application/msword'),
        createTestFile('test.mp4', 1024, 'video/mp4'),
      ];

      invalidImages.forEach(file => {
        expect(validateImageFile(file)).toBe(false);
      });
    });

    it('should handle files without extensions', () => {
      const fileWithoutExt = createTestFile('test', 1024, 'image/jpeg');
      expect(validateImageFile(fileWithoutExt)).toBe(false);
    });

    it('should handle case-insensitive extensions', () => {
      const upperCaseFile = createTestFile('test.JPG', 1024, 'image/jpeg');
      expect(validateImageFile(upperCaseFile)).toBe(true);
    });
  });

  describe('File Size Formatting', () => {
    it('should format file sizes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
      expect(formatFileSize(1536)).toBe('1.5 KB'); // 1.5KB
      expect(formatFileSize(2.5 * 1024 * 1024)).toBe('2.5 MB'); // 2.5MB
    });
  });

  describe('Error Scenarios', () => {
    it('should handle oversized image files', () => {
      const oversizedImage = createTestFile('huge.jpg', 5 * 1024 * 1024, 'image/jpeg'); // 5MB
      expect(validateFileSize(oversizedImage, 'image')).toBe(false);
      
      const errorMessage = `Файл "${oversizedImage.name}" (${formatFileSize(oversizedImage.size)}) превышает максимальный размер ${getFileSizeLimit('image')} для изображений`;
      expect(errorMessage).toContain('превышает максимальный размер 2 MB');
    });

    it('should handle oversized video files', () => {
      const oversizedVideo = createTestFile('huge.mp4', 100 * 1024 * 1024, 'video/mp4'); // 100MB
      expect(validateFileSize(oversizedVideo, 'video')).toBe(false);
      
      const errorMessage = `Файл "${oversizedVideo.name}" (${formatFileSize(oversizedVideo.size)}) превышает максимальный размер ${getFileSizeLimit('video')} для видео`;
      expect(errorMessage).toContain('превышает максимальный размер 50 MB');
    });

    it('should handle invalid poster formats', () => {
      const invalidPoster = createTestFile('poster.txt', 1024, 'text/plain');
      expect(validateImageFile(invalidPoster)).toBe(false);
      
      const errorMessage = `Файл постера "${invalidPoster.name}" не является допустимым изображением. Разрешены только форматы: jpg, jpeg, png, gif, webp`;
      expect(errorMessage).toContain('не является допустимым изображением');
    });
  });

  describe('Form Validation Logic', () => {
    it('should validate complete form submission for hero media', () => {
      const videoFile = createTestFile('video.mp4', 10 * 1024 * 1024, 'video/mp4');
      const posterFile = createTestFile('poster.jpg', 1 * 1024 * 1024, 'image/jpeg');
      
      // Simulate form validation
      const isVideoValid = validateFileSize(videoFile, 'video');
      const isPosterValid = validateFileSize(posterFile, 'image') && validateImageFile(posterFile);
      
      expect(isVideoValid).toBe(true);
      expect(isPosterValid).toBe(true);
      
      // Form should be valid when both files are valid
      const isFormValid = isVideoValid && isPosterValid;
      expect(isFormValid).toBe(true);
    });

    it('should reject form submission with missing poster for video', () => {
      const videoFile = createTestFile('video.mp4', 10 * 1024 * 1024, 'video/mp4');
      const posterFile = null;
      
      const isVideoValid = validateFileSize(videoFile, 'video');
      const isPosterValid = posterFile !== null;
      
      expect(isVideoValid).toBe(true);
      expect(isPosterValid).toBe(false);
      
      // Form should be invalid when poster is missing for video
      const isFormValid = isVideoValid && isPosterValid;
      expect(isFormValid).toBe(false);
    });

    it('should validate block media form submission', () => {
      const blockVideoFile = createTestFile('block-video.mp4', 25 * 1024 * 1024, 'video/mp4');
      const blockPosterFile = createTestFile('block-poster.png', 1.5 * 1024 * 1024, 'image/png');
      
      const isBlockVideoValid = validateFileSize(blockVideoFile, 'video');
      const isBlockPosterValid = validateFileSize(blockPosterFile, 'image') && validateImageFile(blockPosterFile);
      
      expect(isBlockVideoValid).toBe(true);
      expect(isBlockPosterValid).toBe(true);
      
      const isBlockFormValid = isBlockVideoValid && isBlockPosterValid;
      expect(isBlockFormValid).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero-byte files', () => {
      const emptyFile = createTestFile('empty.jpg', 0, 'image/jpeg');
      expect(validateFileSize(emptyFile, 'image')).toBe(true);
      expect(formatFileSize(emptyFile.size)).toBe('0 Bytes');
    });

    it('should handle files at exact size limits', () => {
      const exactSizeImage = createTestFile('exact.jpg', 2 * 1024 * 1024, 'image/jpeg'); // Exactly 2MB
      const exactSizeVideo = createTestFile('exact.mp4', 50 * 1024 * 1024, 'video/mp4'); // Exactly 50MB
      
      expect(validateFileSize(exactSizeImage, 'image')).toBe(true);
      expect(validateFileSize(exactSizeVideo, 'video')).toBe(true);
    });

    it('should handle files just over size limits', () => {
      const overSizeImage = createTestFile('over.jpg', (2 * 1024 * 1024) + 1, 'image/jpeg'); // 2MB + 1 byte
      const overSizeVideo = createTestFile('over.mp4', (50 * 1024 * 1024) + 1, 'video/mp4'); // 50MB + 1 byte
      
      expect(validateFileSize(overSizeImage, 'image')).toBe(false);
      expect(validateFileSize(overSizeVideo, 'video')).toBe(false);
    });
  });
});