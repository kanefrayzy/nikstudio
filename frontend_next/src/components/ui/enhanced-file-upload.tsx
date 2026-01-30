"use client"

import React, { useCallback, useState, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { X, Image, Video, FileIcon, AlertCircle, CheckCircle } from "lucide-react";
import { validateFileSize, validateImageFile, validateVideoFile, formatFileSize, getFileSizeLimit, ERROR_MESSAGES } from "@/lib/utils";

interface FilePreview {
  file: File;
  preview: string;
  type: 'image' | 'video' | 'other';
  error?: string;
}

interface EnhancedFileUploadProps {
  id: string;
  label: string;
  accept: string;
  fileType: 'image' | 'video';
  value?: File | null;
  onChange: (file: File | null) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  showPreview?: boolean;
  maxFiles?: number;
  className?: string;
  onUploadProgress?: (progress: number) => void;
}

export const EnhancedFileUpload: React.FC<EnhancedFileUploadProps> = ({
  id,
  label,
  accept,
  fileType,
  value: _value,
  onChange,
  error,
  disabled = false,
  required = false,
  showPreview = true,
  maxFiles = 1,
  className = "",
  onUploadProgress
}) => {
  const [preview, setPreview] = useState<FilePreview | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate file function
  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    if (!validateFileSize(file, fileType)) {
      return ERROR_MESSAGES.FILE_TOO_LARGE(getFileSizeLimit(fileType));
    }

    // Check file format
    if (fileType === 'image' && !validateImageFile(file)) {
      return ERROR_MESSAGES.INVALID_IMAGE_FORMAT(file.name);
    }

    if (fileType === 'video' && !validateVideoFile(file)) {
      return ERROR_MESSAGES.INVALID_VIDEO_FORMAT(file.name);
    }

    return null;
  }, [fileType]);

  // Create file preview
  const createPreview = useCallback((file: File) => {
    const validationError = validateFile(file);

    if (validationError) {
      setValidationError(validationError);
      return;
    }

    setValidationError(null);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview({
          file,
          preview: e.target?.result as string,
          type: 'image'
        });
      };
      reader.readAsDataURL(file);
    } else if (file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      setPreview({
        file,
        preview: url,
        type: 'video'
      });
    } else {
      setPreview({
        file,
        preview: '',
        type: 'other'
      });
    }
  }, [validateFile]);

  // Handle file selection
  const handleFileSelect = useCallback((files: File[]) => {
    if (files.length === 0) return;

    const file = files[0];
    createPreview(file);
    onChange(file);

    // Simulate upload progress for demo
    if (onUploadProgress) {
      setIsUploading(true);
      setUploadProgress(0);

      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsUploading(false);
            return 100;
          }
          return prev + 10;
        });
      }, 100);
    }
  }, [onChange, createPreview, onUploadProgress]);

  // Dropzone configuration
  const onDrop = useCallback((acceptedFiles: File[]) => {
    handleFileSelect(acceptedFiles);
    setIsDragActive(false);
  }, [handleFileSelect]);

  const onDragEnter = useCallback(() => {
    setIsDragActive(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setIsDragActive(false);
  }, []);

  const { getRootProps, isDragActive: dropzoneActive } = useDropzone({
    onDrop,
    onDragEnter,
    onDragLeave,
    accept: {
      [accept]: []
    },
    maxFiles,
    disabled,
    multiple: maxFiles > 1
  });

  // Handle manual file input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFileSelect(files);
  };

  // Remove file
  const handleRemoveFile = () => {
    setPreview(null);
    setValidationError(null);
    setUploadProgress(0);
    setIsUploading(false);
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  // Cleanup preview URLs
  useEffect(() => {
    return () => {
      if (preview?.type === 'video' && preview.preview) {
        URL.revokeObjectURL(preview.preview);
      }
    };
  }, [preview]);

  const displayError = validationError || error;

  return (
    <div className={`space-y-3 ${className}`}>
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>

      {/* Drag and Drop Area */}
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-lg p-6 transition-all duration-200 cursor-pointer
          ${isDragActive || dropzoneActive
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${displayError ? 'border-red-500 bg-red-50 dark:bg-red-950/20' : ''}
        `}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={handleKeyDown}
        onClick={() => {
          if (!disabled) {
            fileInputRef.current?.click();
          }
        }}
        role="button"
        aria-label={`Upload ${fileType} file`}
      >
        <input
          ref={fileInputRef}
          id={id}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          disabled={disabled}
          className="sr-only"
          multiple={maxFiles > 1}
        />

        {!preview ? (
          <div className="text-center">
            <div className="mx-auto w-12 h-12 mb-4 text-gray-400">
              {fileType === 'image' ? <Image className="w-full h-full" /> : <Video className="w-full h-full" />}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {isDragActive || dropzoneActive
                  ? `Отпустите файл здесь`
                  : `Перетащите ${fileType === 'image' ? 'изображение' : 'видео'} сюда`
                }
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                или нажмите для выбора файла
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Максимальный размер: {getFileSizeLimit(fileType)}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* File Preview */}
            {showPreview && (
              <div className="relative">
                {preview.type === 'image' && (
                  <div className="relative w-full max-w-xs mx-auto">
                    <img
                      src={preview.preview}
                      alt={`Preview of ${preview.file.name}`}
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile();
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                )}

                {preview.type === 'video' && (
                  <div className="relative w-full max-w-xs mx-auto">
                    <video
                      src={preview.preview}
                      className="w-full h-32 object-cover rounded-lg border"
                      controls={false}
                      muted
                      aria-label={`Preview of ${preview.file.name}`}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile();
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                )}

                {preview.type === 'other' && (
                  <div className="flex items-center justify-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <FileIcon className="w-6 h-6 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-300 truncate">
                      {preview.file.name}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="w-6 h-6 rounded-full p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile();
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* File Info */}
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {preview.file.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatFileSize(preview.file.size)}
              </p>
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-2">
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-xs text-center text-gray-500">
                  Загрузка... {uploadProgress}%
                </p>
              </div>
            )}

            {/* Success Indicator */}
            {!isUploading && uploadProgress === 100 && (
              <div className="flex items-center justify-center space-x-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-xs">Файл готов к загрузке</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {displayError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {displayError}
          </AlertDescription>
        </Alert>
      )}

      {/* File Size Limit Info */}
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Поддерживаемые форматы: {fileType === 'image' ? 'JPG, PNG, GIF, WebP, SVG' : 'MP4, WebM, OGG, MOV, AVI'}
      </p>
    </div>
  );
};

export default EnhancedFileUpload;