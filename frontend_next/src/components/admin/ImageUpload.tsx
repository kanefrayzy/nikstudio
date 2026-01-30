"use client"

import React, { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Image as ImageIcon, AlertCircle, X, CheckCircle, Loader2 } from "lucide-react";

interface ImageUploadProps {
  currentImage?: string;
  onUpload: (file: File) => Promise<string>;
  label?: string;
  maxSize?: number;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
const ACCEPTED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.svg'];

export const ImageUpload: React.FC<ImageUploadProps> = ({
  currentImage,
  onUpload,
  label,
  maxSize = MAX_FILE_SIZE,
  disabled = false
}) => {
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [isUploading, setIsUploading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validationSuccess, setValidationSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Format file size for display
  const formatFileSize = useCallback((bytes: number): string => {
    return bytes < 1024 * 1024 
      ? `${(bytes / 1024).toFixed(1)} КБ`
      : `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
  }, []);

  // Validate file
  const validateFile = useCallback((file: File): string | null => {
    // Check if file exists
    if (!file || !file.name) {
      return 'Выбранный файл недействителен';
    }

    // Check file size
    if (file.size > maxSize) {
      const currentSize = formatFileSize(file.size);
      const maxSizeFormatted = formatFileSize(maxSize);
      return `Размер файла не должен превышать ${maxSizeFormatted} (текущий размер: ${currentSize})`;
    }

    // Check file extension
    const fileName = file.name.toLowerCase();
    const hasValidExtension = ACCEPTED_IMAGE_EXTENSIONS.some(ext => fileName.endsWith(ext));
    if (!hasValidExtension) {
      return `Неподдерживаемое расширение файла. Разрешены только: JPG, PNG, WEBP, SVG`;
    }

    // Check MIME type
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      return `Неподдерживаемый тип файла. Разрешены только: JPG, PNG, WEBP, SVG`;
    }

    return null;
  }, [maxSize, formatFileSize]);

  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Clear previous messages
    setValidationError(null);
    setValidationSuccess(null);

    // Validate file
    const error = validateFile(file);
    if (error) {
      setValidationError(error);
      setPreview(currentImage || null);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    setIsUploading(true);
    try {
      await onUpload(file);
      setValidationSuccess('Изображение успешно загружено');
      
      // Auto-dismiss success message after 3 seconds
      setTimeout(() => {
        setValidationSuccess(null);
      }, 3000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка загрузки изображения';
      setValidationError(errorMessage);
      setPreview(currentImage || null);
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle button click
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  // Clear preview
  const handleClear = () => {
    setPreview(null);
    setValidationError(null);
    setValidationSuccess(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      {label && <Label>{label}</Label>}

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

      {/* Image Preview */}
      {preview && (
        <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden border">
          <Image
            src={preview}
            alt="Preview"
            fill
            className="object-contain"
            unoptimized={preview.startsWith('data:')}
          />
          {!isUploading && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={disabled}
              className="absolute top-2 right-2 bg-white/80 hover:bg-white"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}

      {/* Upload Button */}
      <div className="space-y-2">
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_IMAGE_EXTENSIONS.join(',')}
          onChange={handleFileChange}
          disabled={disabled || isUploading}
          className="hidden"
        />
        
        <Button
          type="button"
          variant="outline"
          onClick={handleButtonClick}
          disabled={disabled || isUploading}
          className="w-full"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Загрузка...
            </>
          ) : (
            <>
              {preview ? (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Загрузить новое изображение
                </>
              ) : (
                <>
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Выбрать изображение
                </>
              )}
            </>
          )}
        </Button>

        <p className="text-sm text-muted-foreground text-center">
          Максимальный размер: {formatFileSize(maxSize)}. Форматы: JPG, PNG, WEBP, SVG
        </p>
      </div>
    </div>
  );
};
