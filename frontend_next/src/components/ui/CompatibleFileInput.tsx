/**
 * Cross-Browser Compatible File Input Component
 * Provides consistent file input styling and behavior across browsers
 */

"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { Upload, File as FileIcon, X, AlertCircle } from "lucide-react"

// Browser detection for file input capabilities
const detectFileInputCapabilities = () => {
  if (typeof window === 'undefined') {
    return {
      supportsFileApi: false,
      supportsMultiple: false,
      supportsDragDrop: false,
      supportsCustomStyling: false,
      needsPolyfill: true
    };
  }

  const testInput = document.createElement('input');
  testInput.type = 'file';

  return {
    supportsFileApi: 'files' in testInput,
    supportsMultiple: 'multiple' in testInput,
    supportsDragDrop: 'ondrop' in testInput,
    supportsCustomStyling: 'webkitAppearance' in testInput.style || 'appearance' in testInput.style,
    needsPolyfill: !('files' in testInput)
  };
};

// Hook for file input capabilities
const useFileInputCompatibility = () => {
  const [capabilities, setCapabilities] = React.useState({
    supportsFileApi: false,
    supportsMultiple: false,
    supportsDragDrop: false,
    supportsCustomStyling: false,
    needsPolyfill: true
  });

  React.useEffect(() => {
    setCapabilities(detectFileInputCapabilities());
  }, []);

  return capabilities;
};

// File validation utilities
const validateFile = (file: File, constraints: {
  maxSize?: number;
  allowedTypes?: string[];
  allowedExtensions?: string[];
}) => {
  const errors: string[] = [];
  
  if (constraints.maxSize && file.size > constraints.maxSize) {
    const maxSizeMB = (constraints.maxSize / (1024 * 1024)).toFixed(1);
    errors.push(`Файл слишком большой. Максимальный размер: ${maxSizeMB} MB`);
  }

  if (constraints.allowedTypes && !constraints.allowedTypes.includes(file.type)) {
    errors.push(`Неподдерживаемый тип файла: ${file.type}`);
  }

  if (constraints.allowedExtensions) {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !constraints.allowedExtensions.includes(extension)) {
      errors.push(`Неподдерживаемое расширение файла: .${extension}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Format file size for display
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Props interface
interface CompatibleFileInputProps {
  id?: string;
  name?: string;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  required?: boolean;
  maxSize?: number;
  allowedTypes?: string[];
  allowedExtensions?: string[];
  placeholder?: string;
  buttonText?: string;
  dragText?: string;
  className?: string;
  value?: FileList | File[] | null;
  onChange?: (files: FileList | File[] | null) => void;
  onError?: (error: string) => void;
  showPreview?: boolean;
  showFileInfo?: boolean;
  variant?: "default" | "button" | "drag";
}

export const CompatibleFileInput: React.FC<CompatibleFileInputProps> = ({
  id,
  name,
  accept = "*/*",
  multiple = false,
  disabled = false,
  required = false,
  maxSize,
  allowedTypes,
  allowedExtensions,
  placeholder = "Выберите файл...",
  buttonText = "Выбрать файл",
  dragText = "Перетащите файлы сюда или нажмите для выбора",
  className,
  value: _value,
  onChange,
  onError,
  showPreview = true,
  showFileInfo = true,
  variant = "default"
}) => {
  const capabilities = useFileInputCompatibility();
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const [isDragActive, setIsDragActive] = React.useState(false);
  const [validationErrors, setValidationErrors] = React.useState<string[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const dropZoneRef = React.useRef<HTMLDivElement>(null);

  // Handle file selection
  const handleFileSelection = React.useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const errors: string[] = [];

    fileArray.forEach(file => {
      const validation = validateFile(file, {
        maxSize,
        allowedTypes,
        allowedExtensions
      });

      if (validation.isValid) {
        validFiles.push(file);
      } else {
        errors.push(...validation.errors);
      }
    });

    if (errors.length > 0) {
      setValidationErrors(errors);
      if (onError) {
        onError(errors[0]);
      }
    } else {
      setValidationErrors([]);
    }

    setSelectedFiles(validFiles);
    if (onChange) {
      onChange(validFiles.length > 0 ? validFiles : null);
    }
  }, [maxSize, allowedTypes, allowedExtensions, onChange, onError]);

  // Handle input change
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      handleFileSelection(files);
    }
  };

  // Handle drag and drop
  const handleDragOver = React.useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!disabled) {
      setIsDragActive(true);
    }
  }, [disabled]);

  const handleDragLeave = React.useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDrop = React.useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(false);

    if (disabled) return;

    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      if (!multiple && files.length > 1) {
        if (onError) {
          onError('Можно выбрать только один файл');
        }
        return;
      }
      handleFileSelection(files);
    }
  }, [disabled, multiple, handleFileSelection, onError]);

  // Handle button click
  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Remove file
  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    if (onChange) {
      onChange(newFiles.length > 0 ? newFiles : null);
    }
    
    // Clear input value
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Clear all files
  const clearFiles = () => {
    setSelectedFiles([]);
    setValidationErrors([]);
    if (onChange) {
      onChange(null);
    }
    
    // Clear input value
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Default file input variant
  if (variant === "default") {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="relative">
          <Input
            ref={fileInputRef}
            id={id}
            name={name}
            type="file"
            accept={accept}
            multiple={multiple && capabilities.supportsMultiple}
            disabled={disabled}
            required={required}
            onChange={handleInputChange}
            className={cn(
              // Base styling
              "file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0",
              "file:text-sm file:font-medium file:cursor-pointer",
              // File button styling
              "file:bg-primary file:text-primary-foreground",
              "hover:file:bg-primary/90",
              // Cross-browser file input styling
              capabilities.supportsCustomStyling ? [
                "file:transition-colors"
              ] : [
                // Fallback styling for older browsers
                "file:background-color: #000",
                "file:color: #fff"
              ],
              // Disabled state
              disabled && "file:opacity-50 file:cursor-not-allowed",
              // Hide default styling in older browsers
              !capabilities.supportsCustomStyling && [
                "text-transparent",
                "file:text-white"
              ]
            )}
            style={{
              // Fallback styles for very old browsers
              ...((!capabilities.supportsCustomStyling) && {
                color: 'transparent'
              })
            }}
          />
          
          {/* Custom placeholder for older browsers */}
          {!capabilities.supportsCustomStyling && selectedFiles.length === 0 && (
            <div className="absolute inset-0 flex items-center px-3 pointer-events-none text-muted-foreground">
              {placeholder}
            </div>
          )}
        </div>

        {/* Multiple files warning for unsupported browsers */}
        {multiple && !capabilities.supportsMultiple && (
          <p className="text-sm text-yellow-600">
            Ваш браузер не поддерживает выбор нескольких файлов
          </p>
        )}

        {/* Validation errors */}
        {validationErrors.length > 0 && (
          <div className="space-y-1">
            {validationErrors.map((error, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            ))}
          </div>
        )}

        {/* File preview */}
        {showPreview && selectedFiles.length > 0 && (
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                <div className="flex items-center gap-2">
                  <FileIcon className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    {showFileInfo && (
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)} • {file.type || 'Unknown type'}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  disabled={disabled}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearFiles}
              disabled={disabled}
            >
              Очистить все
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Button variant
  if (variant === "button") {
    return (
      <div className={cn("space-y-2", className)}>
        <input
          ref={fileInputRef}
          id={id}
          name={name}
          type="file"
          accept={accept}
          multiple={multiple && capabilities.supportsMultiple}
          disabled={disabled}
          required={required}
          onChange={handleInputChange}
          className="sr-only"
        />
        
        <Button
          type="button"
          variant="outline"
          onClick={handleButtonClick}
          disabled={disabled}
          className="w-full"
        >
          <Upload className="w-4 h-4 mr-2" />
          {buttonText}
        </Button>

        {/* File info and preview same as default variant */}
        {/* ... (same as above) */}
      </div>
    );
  }

  // Drag and drop variant
  if (variant === "drag") {
    return (
      <div className={cn("space-y-4", className)}>
        <input
          ref={fileInputRef}
          id={id}
          name={name}
          type="file"
          accept={accept}
          multiple={multiple && capabilities.supportsMultiple}
          disabled={disabled}
          required={required}
          onChange={handleInputChange}
          className="sr-only"
        />

        <div
          ref={dropZoneRef}
          onDragOver={capabilities.supportsDragDrop ? handleDragOver : undefined}
          onDragLeave={capabilities.supportsDragDrop ? handleDragLeave : undefined}
          onDrop={capabilities.supportsDragDrop ? handleDrop : undefined}
          onClick={handleButtonClick}
          className={cn(
            // Base styles
            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
            // State styles
            isDragActive ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400",
            disabled && "opacity-50 cursor-not-allowed",
            // Focus styles
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          )}
          tabIndex={disabled ? -1 : 0}
          role="button"
          aria-label={buttonText}
        >
          <FileIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          {isDragActive ? (
            <p className="text-blue-600">Отпустите файлы здесь...</p>
          ) : (
            <div>
              <p className="text-gray-600 mb-2">
                {capabilities.supportsDragDrop ? dragText : "Нажмите для выбора файлов"}
              </p>
              {maxSize && (
                <p className="text-sm text-gray-500">
                  Максимальный размер: {(maxSize / (1024 * 1024)).toFixed(1)} MB
                </p>
              )}
              {!capabilities.supportsDragDrop && (
                <p className="text-sm text-yellow-600">
                  Перетаскивание не поддерживается в вашем браузере
                </p>
              )}
            </div>
          )}
        </div>

        {/* File info and preview same as default variant */}
        {/* ... (same as above) */}
      </div>
    );
  }

  return null;
};

// Export compatibility info for debugging
export const FileInputCompatibilityInfo = () => {
  const capabilities = useFileInputCompatibility();
  return capabilities;
};