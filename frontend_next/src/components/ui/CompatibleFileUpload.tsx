/**
 * Compatible File Upload Component
 * Provides cross-browser file upload with fallbacks and polyfills
 */

"use client"

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Upload, File as FileIcon, AlertCircle, X, CheckCircle, Loader2, AlertTriangle } from "lucide-react";
import { 
  useFileUploadCompatibility, 
  FileValidationConstraints, 
  FileValidationResult,
  DragDropCallbacks 
} from '@/lib/file-upload-compatibility';

interface CompatibleFileUploadProps {
  onFileSelect: (file: File) => void;
  onUpload?: (file: File, formData: FormData | any) => Promise<void>;
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  minSize?: number;
  allowedTypes?: string[];
  allowedExtensions?: string[];
  disabled?: boolean;
  uploading?: boolean;
  uploadProgress?: number;
  className?: string;
  dragDropText?: string;
  buttonText?: string;
  showCapabilities?: boolean;
}

export const CompatibleFileUpload: React.FC<CompatibleFileUploadProps> = ({
  onFileSelect,
  onUpload,
  accept = "*/*",
  multiple = false,
  maxSize,
  minSize,
  allowedTypes,
  allowedExtensions,
  disabled = false,
  uploading = false,
  uploadProgress = 0,
  className = "",
  dragDropText = "Перетащите файлы сюда или нажмите для выбора",
  buttonText = "Выберите файл",
  showCapabilities = false
}) => {
  const { capabilities, service, utils } = useFileUploadCompatibility();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [validationResults, setValidationResults] = useState<Map<string, FileValidationResult>>(new Map());
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const dragCleanupRef = useRef<(() => void) | null>(null);

  // Clear messages after timeout
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Validate file using compatibility service
  const validateFile = useCallback((file: File): FileValidationResult => {
    const constraints: FileValidationConstraints = {
      maxSize,
      minSize,
      allowedTypes,
      allowedExtensions
    };

    return service.validateFile(file, constraints);
  }, [service, maxSize, minSize, allowedTypes, allowedExtensions]);

  // Handle file selection
  const handleFileSelection = useCallback((files: File[]) => {
    const newValidationResults = new Map<string, FileValidationResult>();
    const validFiles: File[] = [];
    const allWarnings: string[] = [];

    files.forEach(file => {
      const validation = validateFile(file);
      newValidationResults.set(file.name, validation);

      if (validation.isValid) {
        validFiles.push(file);
      }

      // Collect warnings
      allWarnings.push(...validation.warnings);
    });

    setValidationResults(newValidationResults);
    setWarnings([...new Set(allWarnings)]); // Remove duplicates

    if (validFiles.length > 0) {
      if (multiple) {
        setSelectedFiles(validFiles);
        validFiles.forEach(file => onFileSelect(file));
      } else {
        setSelectedFiles([validFiles[0]]);
        onFileSelect(validFiles[0]);
      }

      if (validFiles.length === files.length) {
        setSuccess(`Выбрано файлов: ${validFiles.length}`);
      }
    }

    // Show validation errors
    const errors = Array.from(newValidationResults.values())
      .flatMap(result => result.errors)
      .filter(error => error);

    if (errors.length > 0) {
      setError(errors[0]); // Show first error
    }
  }, [validateFile, multiple, onFileSelect]);

  // Handle manual file input
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      setError(null);
      setSuccess(null);
      handleFileSelection(files);
    }
  };

  // Setup drag and drop
  useEffect(() => {
    if (!dropZoneRef.current || !capabilities?.dragAndDrop) {
      return;
    }

    const callbacks: DragDropCallbacks = {
      onDragEnter: () => {
        setIsDragActive(true);
      },
      onDragLeave: () => {
        setIsDragActive(false);
      },
      onDrop: (files) => {
        setIsDragActive(false);
        if (files.length > 0) {
          setError(null);
          setSuccess(null);
          handleFileSelection(files);
        }
      },
      onError: (errorMessage) => {
        setError(errorMessage);
        setIsDragActive(false);
      }
    };

    dragCleanupRef.current = service.setupDragAndDrop(dropZoneRef.current, callbacks);

    return () => {
      if (dragCleanupRef.current) {
        dragCleanupRef.current();
      }
    };
  }, [capabilities, service, handleFileSelection]);

  // Handle upload
  const handleUpload = async () => {
    if (!onUpload || selectedFiles.length === 0) return;

    try {
      const formData = utils.createFormData();
      
      selectedFiles.forEach((file, index) => {
        if (multiple) {
          formData.append(`files[${index}]`, file);
        } else {
          formData.append('file', file);
        }
      });

      await onUpload(selectedFiles[0], formData);
      setSelectedFiles([]);
      setValidationResults(new Map());
      setSuccess('Файлы успешно загружены!');
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError('Ошибка при загрузке файлов');
    }
  };

  // Clear selected files
  const clearFiles = () => {
    setSelectedFiles([]);
    setValidationResults(new Map());
    setError(null);
    setSuccess(null);
    setWarnings([]);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove specific file
  const removeFile = (fileName: string) => {
    const newFiles = selectedFiles.filter(file => file.name !== fileName);
    const newValidationResults = new Map(validationResults);
    newValidationResults.delete(fileName);
    
    setSelectedFiles(newFiles);
    setValidationResults(newValidationResults);
  };

  if (!capabilities) {
    return (
      <div className="text-center py-4">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
        <p className="text-sm text-gray-600">Проверка возможностей браузера...</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Capability warnings */}
      {showCapabilities && warnings.length > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <ul className="list-disc list-inside space-y-1">
              {warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Error messages */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Success messages */}
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* File selection area */}
      {selectedFiles.length === 0 ? (
        <div className="space-y-4">
          {/* Drag and Drop Area */}
          {capabilities.dragAndDrop ? (
            <div
              ref={dropZoneRef}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                ${isDragActive 
                  ? 'border-blue-400 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
                }
                ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <FileIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              {isDragActive ? (
                <p className="text-blue-600">Отпустите файлы здесь...</p>
              ) : (
                <div>
                  <p className="text-gray-600 mb-2">{dragDropText}</p>
                  {maxSize && (
                    <p className="text-sm text-gray-500">
                      Максимальный размер: {(maxSize / (1024 * 1024)).toFixed(1)} MB
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <FileIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Выберите файлы для загрузки</p>
              <p className="text-sm text-gray-500">
                Перетаскивание не поддерживается в вашем браузере
              </p>
            </div>
          )}

          {/* Manual File Input */}
          <div className="text-center">
            <span className="text-sm text-gray-500">или</span>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="file-input">{buttonText}</Label>
            <Input
              ref={fileInputRef}
              id="file-input"
              type="file"
              accept={accept}
              multiple={multiple && capabilities.multipleFiles}
              onChange={handleInputChange}
              disabled={disabled || uploading}
            />
            {multiple && !capabilities.multipleFiles && (
              <p className="text-sm text-yellow-600">
                Ваш браузер не поддерживает выбор нескольких файлов
              </p>
            )}
          </div>
        </div>
      ) : (
        /* Selected Files Preview */
        <div className="space-y-4">
          <div className="space-y-2">
            {selectedFiles.map((file) => {
              const validation = validationResults.get(file.name);
              return (
                <div key={file.name} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <FileIcon className="w-8 h-8 text-blue-600" />
                      <div className="flex-1">
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-gray-500">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.type || 'Unknown type'}
                        </p>
                        {validation && !validation.isValid && (
                          <div className="mt-2">
                            {validation.errors.map((error, index) => (
                              <p key={index} className="text-sm text-red-600">{error}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.name)}
                      disabled={uploading}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Загрузка файлов...</span>
                <span className="text-gray-600">{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Пожалуйста, не закрывайте страницу во время загрузки</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {onUpload && (
              <Button 
                onClick={handleUpload}
                disabled={uploading || selectedFiles.length === 0}
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
                    Загрузить файлы
                  </>
                )}
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={clearFiles}
              disabled={uploading}
            >
              Очистить
            </Button>
          </div>
        </div>
      )}

      {/* Capabilities info (for debugging) */}
      {showCapabilities && (
        <div className="text-xs text-gray-500 space-y-1">
          <p>Возможности браузера:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>File API: {capabilities.fileApi ? '✓' : '✗'}</li>
            <li>FormData: {capabilities.formData ? '✓' : '✗'}</li>
            <li>Drag & Drop: {capabilities.dragAndDrop ? '✓' : '✗'}</li>
            <li>FileReader: {capabilities.fileReader ? '✓' : '✗'}</li>
            <li>Multiple Files: {capabilities.multipleFiles ? '✓' : '✗'}</li>
          </ul>
        </div>
      )}
    </div>
  );
};