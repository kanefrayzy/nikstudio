"use client"

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Upload, Video, AlertCircle, X, CheckCircle, Loader2, AlertTriangle } from "lucide-react";
import { useFileUploadCompatibility } from '@/lib/file-upload-compatibility';

interface VideoUploadFormProps {
  onUpload: (file: File, onProgress?: (progress: number) => void) => Promise<void>;
  uploading: boolean;
  uploadProgress?: number;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MIN_FILE_SIZE = 1024; // 1KB minimum to avoid empty files
const ACCEPTED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/avi',
  'video/mov',
  'video/quicktime'
];
const ACCEPTED_VIDEO_EXTENSIONS = ['.mp4', '.webm', '.ogg', '.avi', '.mov'];

// Network error retry configuration (currently unused but available for future implementation)
// const MAX_RETRY_ATTEMPTS = 3;
// const RETRY_DELAY = 2000; // 2 seconds

export const VideoUploadForm: React.FC<VideoUploadFormProps> = ({ onUpload, uploading, uploadProgress: _uploadProgress = 0 }) => {
  const { capabilities, utils } = useFileUploadCompatibility();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validationSuccess, setValidationSuccess] = useState<string | null>(null);
  const [compatibilityWarnings, setCompatibilityWarnings] = useState<string[]>([]);
  const [localProgress, setLocalProgress] = useState<number>(0);

  // Format file size for display
  const formatFileSize = useCallback((bytes: number): string => {
    return bytes < 1024 * 1024 
      ? `${(bytes / 1024).toFixed(1)} KB`
      : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }, []);

  // Comprehensive file validation with detailed feedback
  const validateFile = useCallback((file: File): string | null => {
    console.log('Validating file:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    });

    // Check if file exists and is valid
    if (!file || !file.name) {
      console.error('Invalid file object:', file);
      return 'Выбранный файл недействителен';
    }

    // Check file size - minimum
    if (file.size < MIN_FILE_SIZE) {
      console.error('File too small:', file.size);
      return `Файл слишком маленький (${formatFileSize(file.size)}). Минимальный размер: ${formatFileSize(MIN_FILE_SIZE)}`;
    }

    // Check file size - maximum
    if (file.size > MAX_FILE_SIZE) {
      const currentSize = formatFileSize(file.size);
      const maxSize = formatFileSize(MAX_FILE_SIZE);
      console.error('File too large:', file.size);
      return `Файл слишком большой (${currentSize}). Максимальный размер: ${maxSize}`;
    }

    // Check file extension
    const fileName = file.name.toLowerCase();
    const hasValidExtension = ACCEPTED_VIDEO_EXTENSIONS.some(ext => fileName.endsWith(ext));
    if (!hasValidExtension) {
      console.error('Invalid file extension:', fileName);
      return `Неподдерживаемое расширение файла. Поддерживаются: ${ACCEPTED_VIDEO_EXTENSIONS.join(', ')}`;
    }

    // Check MIME type
    if (!ACCEPTED_VIDEO_TYPES.includes(file.type)) {
      console.error('Invalid MIME type:', file.type);
      const supportedFormats = ['MP4', 'WebM', 'OGG', 'AVI', 'MOV'];
      return `Неподдерживаемый тип файла "${file.type}". Поддерживаются: ${supportedFormats.join(', ')}`;
    }

    // Check for suspicious file names
    if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
      console.error('Suspicious file name:', fileName);
      return 'Недопустимое имя файла. Имя не должно содержать специальные символы пути';
    }

    // Check file age (optional warning for very old files)
    const fileAge = Date.now() - file.lastModified;
    const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
    if (fileAge > oneYearInMs) {
      console.warn('File is very old:', new Date(file.lastModified));
      // This is just a warning, not an error
    }

    console.log('File validation passed');
    return null;
  }, [formatFileSize]);

  // Check browser compatibility on mount
  React.useEffect(() => {
    if (capabilities) {
      const warnings: string[] = [];
      
      if (!capabilities.fileApi) {
        warnings.push('Ваш браузер имеет ограниченную поддержку File API. Загрузка файлов может работать некорректно.');
      }
      
      if (!capabilities.formData) {
        warnings.push('Ваш браузер не поддерживает FormData. Будет использован альтернативный метод загрузки.');
      }
      
      if (!capabilities.dragAndDrop) {
        warnings.push('Перетаскивание файлов не поддерживается. Используйте кнопку выбора файла.');
      }
      
      setCompatibilityWarnings(warnings);
    }
  }, [capabilities]);

  // Enhanced file validation using compatibility service
  const validateFileWithCompatibility = useCallback((file: File): string | null => {
    // First run the existing validation
    const basicError = validateFile(file);
    if (basicError) {
      return basicError;
    }

    // Then use the compatibility service for additional validation
    const validationResult = utils.validateVideoFile(file);
    if (!validationResult.isValid) {
      return validationResult.errors[0] || 'Ошибка валидации файла';
    }

    // Add any warnings to the compatibility warnings
    if (validationResult.warnings.length > 0) {
      setCompatibilityWarnings(prev => [...prev, ...validationResult.warnings]);
    }

    return null;
  }, [validateFile, utils]);

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    const error = validateFileWithCompatibility(file);
    if (error) {
      setValidationError(error);
      setValidationSuccess(null);
      setSelectedFile(null);
      return;
    }
    
    setValidationError(null);
    setValidationSuccess(`Файл "${file.name}" готов к загрузке (${formatFileSize(file.size)})`);
    setSelectedFile(file);
    
    // Clear success message after 3 seconds
    setTimeout(() => setValidationSuccess(null), 3000);
  }, [validateFileWithCompatibility, formatFileSize]);

  // Dropzone configuration
  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      setValidationSuccess(null);
      if (rejection.errors.some((e: any) => e.code === 'file-too-large')) {
        setValidationError(`Файл слишком большой. Максимальный размер: ${formatFileSize(MAX_FILE_SIZE)}`);
      } else if (rejection.errors.some((e: any) => e.code === 'file-invalid-type')) {
        setValidationError('Неподдерживаемый формат файла. Поддерживаются: MP4, WebM, OGG, AVI, MOV');
      } else {
        setValidationError('Ошибка при выборе файла');
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      handleFileSelect(acceptedFiles[0]);
    }
  }, [handleFileSelect, formatFileSize]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.webm', '.ogg', '.avi', '.mov']
    },
    maxSize: MAX_FILE_SIZE,
    multiple: false,
    disabled: uploading
  });

  // Handle manual file input
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Clear previous messages
      setValidationError(null);
      setValidationSuccess(null);
      handleFileSelect(file);
    }
  };

  // Handle upload
  const handleUpload = async () => {
    if (!selectedFile) return;
    
    try {
      setLocalProgress(0);
      setValidationSuccess(null);
      await onUpload(selectedFile, (progress) => {
        setLocalProgress(progress);
      });
      setSelectedFile(null);
      setValidationError(null);
      setValidationSuccess(null);
      setLocalProgress(0);
    } catch {
      // Error handling is done in parent component
      setLocalProgress(0);
    }
  };

  // Clear selected file
  const clearSelectedFile = () => {
    setSelectedFile(null);
    setValidationError(null);
    setValidationSuccess(null);
    setLocalProgress(0);
  };

  return (
    <div className="space-y-4">
      {/* Compatibility Warnings */}
      {compatibilityWarnings.length > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <div className="space-y-1">
              <p className="font-medium">Предупреждения совместимости:</p>
              <ul className="list-disc list-inside space-y-1">
                {compatibilityWarnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Validation Messages */}
      {validationError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{validationError}</AlertDescription>
        </Alert>
      )}

      {validationSuccess && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{validationSuccess}</AlertDescription>
        </Alert>
      )}

      {/* File Selection Area */}
      {!selectedFile ? (
        <div className="space-y-4">
          {/* Drag and Drop Area */}
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
              }
              ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input {...getInputProps()} />
            <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            {isDragActive ? (
              <p className="text-blue-600">Отпустите файл здесь...</p>
            ) : (
              <div>
                <p className="text-gray-600 mb-2">
                  Перетащите видео файл сюда или нажмите для выбора
                </p>
                <p className="text-sm text-gray-500">
                  Поддерживаемые форматы: MP4, WebM, OGG, AVI, MOV
                </p>
                <p className="text-sm text-gray-500">
                  Максимальный размер: {formatFileSize(MAX_FILE_SIZE)}
                </p>
              </div>
            )}
          </div>

          {/* Manual File Input */}
          <div className="text-center">
            <span className="text-sm text-gray-500">или</span>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="video-file">Выберите видео файл</Label>
            <Input
              id="video-file"
              type="file"
              accept="video/*"
              onChange={handleInputChange}
              disabled={uploading}
            />
          </div>
        </div>
      ) : (
        /* Selected File Preview */
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Video className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {formatFileSize(selectedFile.size)} • {selectedFile.type}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelectedFile}
                disabled={uploading}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Загрузка видео...</span>
                <span className="text-gray-600">{Math.round(localProgress)}%</span>
              </div>
              <Progress value={localProgress} className="h-2" />
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Пожалуйста, не закрывайте страницу во время загрузки</span>
              </div>
            </div>
          )}

          {/* Upload Button */}
          <div className="flex gap-2">
            <Button 
              onClick={handleUpload}
              disabled={uploading}
              className="flex-1"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Загрузка...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Загрузить видео
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={clearSelectedFile}
              disabled={uploading}
            >
              Отмена
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};