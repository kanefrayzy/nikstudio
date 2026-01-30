import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// File validation utilities
export const validateFileSize = (file: File, fileType: 'image' | 'video'): boolean => {
  const maxSize = fileType === 'image' ? 2 * 1024 * 1024 : 50 * 1024 * 1024; // 2MB for images, 50MB for videos
  return file.size <= maxSize;
};

export const getFileSizeLimit = (fileType: 'image' | 'video'): string => {
  return fileType === 'image' ? '2 MB' : '50 MB';
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const validateImageFile = (file: File): boolean => {
  const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
  const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
  const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  return validExtensions.includes(fileExtension) && validMimeTypes.includes(file.type);
};

export const validateVideoFile = (file: File): boolean => {
  const validExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi'];
  const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
  const validMimeTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'];
  return validExtensions.includes(fileExtension) && validMimeTypes.includes(file.type);
};

// Constants for messages
export const SUCCESS_MESSAGES = {
  PROJECT_UPDATED: 'Проект успешно обновлен',
  PROJECT_CREATED: 'Детали проекта успешно созданы',
  HERO_MEDIA_UPDATED: 'Hero медиа успешно обновлено',
  HERO_MEDIA_CREATED: 'Hero медиа успешно создано',
  HERO_MEDIA_DELETED: 'Hero медиа успешно удалено',
  BLOCK_CREATED: 'Блок успешно создан',
  BLOCK_UPDATED: 'Блок успешно обновлен',
  BLOCK_DELETED: 'Блок успешно удален',
  BLOCK_MEDIA_CREATED: 'Медиа блока успешно создано',
  BLOCK_MEDIA_UPDATED: 'Медиа блока успешно обновлено',
  BLOCK_MEDIA_DELETED: 'Медиа блока успешно удалено'
};

export const ERROR_MESSAGES = {
  FILE_TOO_LARGE: (limit: string) => `Размер файла превышает максимально допустимый лимит ${limit}`,
  INVALID_IMAGE_FORMAT: (filename: string) => `${filename} не является допустимым изображением. Разрешены только форматы: jpg, jpeg, png, gif, webp, svg`,
  INVALID_VIDEO_FORMAT: (filename: string) => `${filename} не является допустимым видео. Разрешены только форматы: mp4, webm, ogg, mov, avi`,
  POSTER_REQUIRED: 'Пожалуйста, выберите постер для каждого видео файла',
  FILE_REQUIRED: 'Пожалуйста, выберите хотя бы один файл',
  UPLOAD_FAILED: 'Ошибка при загрузке файла'
};
