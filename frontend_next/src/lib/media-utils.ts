/**
 * Utility functions for handling media URLs from Laravel backend
 */

/**
 * Convert Laravel storage path to full URL
 * @param mediaPath - Path from Laravel storage (e.g., "/storage/home/hero-videos/video.mp4")
 * @param fallback - Fallback URL if mediaPath is empty
 * @returns Full URL to the media file on Laravel server
 */
export const getMediaUrl = (mediaPath: string, fallback: string = '/placeholder.jpg'): string => {
  if (!mediaPath) return fallback;
  
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  
  // If path already contains full URL, use it
  if (mediaPath.startsWith('http')) {
    return mediaPath;
  }
  
  // Clean up path prefixes and get clean path
  let cleanPath = mediaPath;
  
  // Remove /storage/app/public/ if present
  if (cleanPath.includes('/storage/app/public/')) {
    cleanPath = cleanPath.substring(cleanPath.indexOf('/storage/app/public/') + '/storage/app/public/'.length);
  }
  // Remove storage/app/public/ if present
  else if (cleanPath.includes('storage/app/public/')) {
    cleanPath = cleanPath.substring(cleanPath.indexOf('storage/app/public/') + 'storage/app/public/'.length);
  }
  // Remove /storage/ if present
  else if (cleanPath.startsWith('/storage/')) {
    cleanPath = cleanPath.substring('/storage/'.length);
  }
  // Remove storage/ if present
  else if (cleanPath.startsWith('storage/')) {
    cleanPath = cleanPath.substring('storage/'.length);
  }
  
  // Return full URL to Laravel server
  return `${apiUrl}/storage/${cleanPath}`;
};

/**
 * Get image URL (for backward compatibility)
 * @param imagePath - Path to image file
 * @returns Full URL to the image file
 */
export const getImageUrl = (imagePath: string): string => {
  return getMediaUrl(imagePath, '/placeholder.jpg');
};

/**
 * Get video URL
 * @param videoPath - Path to video file
 * @returns Full URL to the video file or undefined if no path
 */
export const getVideoUrl = (videoPath?: string): string | undefined => {
  if (!videoPath) return undefined;
  return getMediaUrl(videoPath);
};

/**
 * Format file size for display
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
};

/**
 * Get video format from filename
 * @param filename - Original filename
 * @returns Video format (extension) in uppercase
 */
export const getVideoFormat = (filename?: string): string => {
  if (!filename) return 'Неизвестно';
  const extension = filename.split('.').pop()?.toUpperCase();
  return extension || 'Неизвестно';
};