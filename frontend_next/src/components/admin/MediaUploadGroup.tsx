'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Upload,
  // Image as ImageIcon,
  Video,
  X,
  AlertCircle,
  CheckCircle,
  Loader2,
  AlertTriangle,
  FileImage,
  FileVideo
} from "lucide-react";
import { useFileUploadCompatibility } from '@/lib/file-upload-compatibility';

interface MediaFile {
  file: File;
  preview?: string;
  type: 'image' | 'video';
  posterFile?: File;
  posterPreview?: string;
}

interface MediaUploadGroupProps {
  onUpload: (formData: FormData, _onProgress?: (progress: number) => void) => Promise<void>;
  uploading: boolean;
  uploadProgress?: number;
  onCancel?: () => void;
  initialData?: {
    mainFile?: { path: string; type: 'image' | 'video'; alt: string; posterPath?: string };
    secondaryFile?: { path: string; type: 'image' | 'video'; alt: string; posterPath?: string };
  };
}

// File size constants
const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
const MIN_FILE_SIZE = 1024; // 1KB

// Accepted file types
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/webm'];
const ACCEPTED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.svg'];
const ACCEPTED_VIDEO_EXTENSIONS = ['.mp4', '.webm'];

export function MediaUploadGroup({ 
  onUpload, 
  uploading, 
  uploadProgress: _uploadProgress = 0, 
  onCancel,
  initialData 
}: MediaUploadGroupProps) {
  const { capabilities, service, utils: _utils } = useFileUploadCompatibility();
  
  // State for files
  const [mainFile, setMainFile] = useState<MediaFile | null>(null);
  const [secondaryFile, setSecondaryFile] = useState<MediaFile | null>(null);
  
  // State for alt text
  const [mainAltText, setMainAltText] = useState(initialData?.mainFile?.alt || '');
  const [secondaryAltText, setSecondaryAltText] = useState(initialData?.secondaryFile?.alt || '');
  
  // State for existing posters
  const [existingMainPoster, _setExistingMainPoster] = useState(initialData?.mainFile?.posterPath || null);
  const [existingSecondaryPoster, _setExistingSecondaryPoster] = useState(initialData?.secondaryFile?.posterPath || null);
  
  // State for validation and messages
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validationSuccess, setValidationSuccess] = useState<string | null>(null);
  const [compatibilityWarnings, setCompatibilityWarnings] = useState<string[]>([]);
  const [localProgress, setLocalProgress] = useState<number>(0);
  
  // File input refs
  const mainFileInputRef = useRef<HTMLInputElement>(null);
  const secondaryFileInputRef = useRef<HTMLInputElement>(null);
  const mainPosterInputRef = useRef<HTMLInputElement>(null);
  const secondaryPosterInputRef = useRef<HTMLInputElement>(null);

  // Get file URL for existing files
  const getFileUrl = useCallback((filePath: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    return `${apiUrl}/storage/${filePath}`;
  }, []);

  // Format file size for display
  const formatFileSize = useCallback((bytes: number): string => {
    return bytes < 1024 * 1024 
      ? `${(bytes / 1024).toFixed(1)} КБ`
      : `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
  }, []);

  // Comprehensive file validation
  const validateFile = useCallback((file: File, _type: 'main' | 'secondary'): string | null => {
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

    // Determine if it's image or video
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (!isImage && !isVideo) {
      return 'Поддерживаются только изображения и видео файлы';
    }

    // Check file size - maximum
    const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
    if (file.size > maxSize) {
      const currentSize = formatFileSize(file.size);
      const maxSizeFormatted = formatFileSize(maxSize);
      console.error('File too large:', file.size);
      return `Файл слишком большой (${currentSize}). Максимальный размер для ${isImage ? 'изображений' : 'видео'}: ${maxSizeFormatted}`;
    }

    // Check file type
    if (isImage && !ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      console.error('Invalid image type:', file.type);
      return `Неподдерживаемый тип изображения "${file.type}". Поддерживаются: JPG, PNG, WebP, SVG`;
    }

    if (isVideo && !ACCEPTED_VIDEO_TYPES.includes(file.type)) {
      console.error('Invalid video type:', file.type);
      return `Неподдерживаемый тип видео "${file.type}". Поддерживаются: MP4, WebM`;
    }

    // Check file extension
    const fileName = file.name.toLowerCase();
    const validExtensions = isImage ? ACCEPTED_IMAGE_EXTENSIONS : ACCEPTED_VIDEO_EXTENSIONS;
    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
    
    if (!hasValidExtension) {
      console.error('Invalid file extension:', fileName);
      return `Неподдерживаемое расширение файла. Поддерживаются: ${validExtensions.join(', ')}`;
    }

    // Check for suspicious file names
    if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
      console.error('Suspicious file name:', fileName);
      return 'Недопустимое имя файла. Имя не должно содержать специальные символы пути';
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
      
      setCompatibilityWarnings(warnings);
    }
  }, [capabilities]);

  // Create file preview
  const createFilePreview = useCallback(async (file: File): Promise<string> => {
    try {
      return await service.readFileAsDataURL(file);
    } catch (error) {
      console.error('Error creating file preview:', error);
      return '';
    }
  }, [service]);

  // Handle file selection
  const handleFileSelect = useCallback(async (
    file: File, 
    type: 'main' | 'secondary'
  ) => {
    const error = validateFile(file, type);
    if (error) {
      setValidationError(error);
      setValidationSuccess(null);
      return;
    }

    const fileType = file.type.startsWith('image/') ? 'image' : 'video';
    const preview = await createFilePreview(file);
    
    const mediaFile: MediaFile = {
      file,
      preview,
      type: fileType
    };

    if (type === 'main') {
      setMainFile(mediaFile);
    } else {
      setSecondaryFile(mediaFile);
    }
    
    setValidationError(null);
    setValidationSuccess(`Файл "${file.name}" готов к загрузке (${formatFileSize(file.size)})`);
    
    // Clear success message after 3 seconds
    setTimeout(() => setValidationSuccess(null), 3000);
  }, [validateFile, createFilePreview, formatFileSize]);

  // Handle poster file selection
  const handlePosterSelect = useCallback(async (
    file: File,
    type: 'main' | 'secondary'
  ) => {
    const error = validateFile(file, type);
    if (error) {
      setValidationError(error);
      return;
    }

    if (!file.type.startsWith('image/')) {
      setValidationError('Постер должен быть изображением');
      return;
    }

    const preview = await createFilePreview(file);
    
    if (type === 'main' && mainFile) {
      setMainFile({
        ...mainFile,
        posterFile: file,
        posterPreview: preview
      });
    } else if (type === 'secondary' && secondaryFile) {
      setSecondaryFile({
        ...secondaryFile,
        posterFile: file,
        posterPreview: preview
      });
    }

    setValidationError(null);
    setValidationSuccess(`Постер "${file.name}" добавлен`);
    
    // Clear success message after 3 seconds
    setTimeout(() => setValidationSuccess(null), 3000);
  }, [validateFile, createFilePreview, mainFile, secondaryFile]);

  // Handle main file input change
  const handleMainFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setValidationError(null);
      setValidationSuccess(null);
      handleFileSelect(file, 'main');
    }
  };

  // Handle secondary file input change
  const handleSecondaryFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setValidationError(null);
      setValidationSuccess(null);
      handleFileSelect(file, 'secondary');
    }
  };

  // Handle poster file input changes
  const handleMainPosterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handlePosterSelect(file, 'main');
    }
  };

  const handleSecondaryPosterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handlePosterSelect(file, 'secondary');
    }
  };

  // Clear file
  const clearFile = (type: 'main' | 'secondary') => {
    if (type === 'main') {
      setMainFile(null);
      if (mainFileInputRef.current) {
        mainFileInputRef.current.value = '';
      }
      if (mainPosterInputRef.current) {
        mainPosterInputRef.current.value = '';
      }
    } else {
      setSecondaryFile(null);
      if (secondaryFileInputRef.current) {
        secondaryFileInputRef.current.value = '';
      }
      if (secondaryPosterInputRef.current) {
        secondaryPosterInputRef.current.value = '';
      }
    }
    setValidationError(null);
    setValidationSuccess(null);
  };

  // Handle upload
  const handleUpload = async () => {
    if (!mainFile) {
      setValidationError('Основное медиа обязательно для загрузки');
      return;
    }

    if (!secondaryFile) {
      setValidationError('Дополнительное медиа обязательно для загрузки (для отображения двух файлов рядом)');
      return;
    }

    // Check if video files have posters
    if (mainFile.type === 'video' && !mainFile.posterFile && !existingMainPoster) {
      setValidationError('Для видео файлов обязательно загрузить постер');
      return;
    }

    if (secondaryFile && secondaryFile.type === 'video' && !secondaryFile.posterFile && !existingSecondaryPoster) {
      setValidationError('Для видео файлов обязательно загрузить постер');
      return;
    }

    try {
      setLocalProgress(0);
      setValidationSuccess(null);
      setValidationError(null);

      // Create FormData
      const formData = new FormData();
      
      // Add main file
      formData.append('main_file', mainFile.file);
      formData.append('main_alt_text', mainAltText);
      
      if (mainFile.posterFile) {
        formData.append('main_poster', mainFile.posterFile);
      }

      // Add secondary file if present
      if (secondaryFile) {
        formData.append('secondary_file', secondaryFile.file);
        formData.append('secondary_alt_text', secondaryAltText);
        
        if (secondaryFile.posterFile) {
          formData.append('secondary_poster', secondaryFile.posterFile);
        }
      }

      await onUpload(formData, (progress) => {
        setLocalProgress(progress);
      });

      // Reset form on successful upload
      setMainFile(null);
      setSecondaryFile(null);
      setMainAltText('');
      setSecondaryAltText('');
      setValidationError(null);
      setValidationSuccess(null);
      setLocalProgress(0);
      
      // Clear file inputs
      if (mainFileInputRef.current) mainFileInputRef.current.value = '';
      if (secondaryFileInputRef.current) secondaryFileInputRef.current.value = '';
      if (mainPosterInputRef.current) mainPosterInputRef.current.value = '';
      if (secondaryPosterInputRef.current) secondaryPosterInputRef.current.value = '';

    } catch (error) {
      console.error('Upload error:', error);
      setLocalProgress(0);
      // Error handling is done in parent component
    }
  };

  // Check if form is valid for submission
  // Both main and secondary files are required for a media group
  const isFormValid = mainFile && 
    secondaryFile &&
    (mainFile.type !== 'video' || mainFile.posterFile || existingMainPoster) &&
    (secondaryFile.type !== 'video' || secondaryFile.posterFile || existingSecondaryPoster);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Загрузка медиа-группы
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Main Media */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Основное медиа *</Label>
              {mainFile && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => clearFile('main')}
                  disabled={uploading}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {!mainFile ? (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="main_file">Выберите файл</Label>
                  <Input
                    id="main_file"
                    ref={mainFileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleMainFileChange}
                    disabled={uploading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Изображения: до 2МБ (JPG, PNG, WebP, SVG)<br/>
                    Видео: до 50МБ (MP4, WebM)
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* File Preview */}
                <div className="border rounded-lg p-3">
                  <div className="flex items-start gap-3">
                    {mainFile.type === 'image' ? (
                      <FileImage className="w-8 h-8 text-blue-600 flex-shrink-0" />
                    ) : (
                      <FileVideo className="w-8 h-8 text-purple-600 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{mainFile.file.name}</p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(mainFile.file.size)} • {mainFile.file.type}
                      </p>
                      {mainFile.preview && (
                        <div className="mt-2">
                          {mainFile.type === 'image' ? (
                            <img 
                              src={mainFile.preview} 
                              alt="Preview" 
                              className="w-20 h-20 object-cover rounded border"
                            />
                          ) : (
                            <div className="w-20 h-20 bg-gray-100 rounded border flex items-center justify-center">
                              <Video className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Poster upload for video */}
                {mainFile.type === 'video' && (
                  <div className="space-y-2">
                    <Label htmlFor="main_poster">Постер для видео *</Label>
                    <Input
                      id="main_poster"
                      ref={mainPosterInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleMainPosterChange}
                      disabled={uploading}
                    />
                    {(mainFile.posterPreview || existingMainPoster) && (
                      <div className="mt-2">
                        <img 
                          src={mainFile.posterPreview || getFileUrl(existingMainPoster!)} 
                          alt="Poster preview" 
                          className="w-20 h-20 object-cover rounded border"
                        />
                        {existingMainPoster && !mainFile.posterPreview && (
                          <p className="text-xs text-gray-500 mt-1">Текущий постер</p>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Обязательно для видео файлов
                    </p>
                  </div>
                )}

                {/* Alt text */}
                <div className="space-y-2">
                  <Label htmlFor="main_alt">Описание</Label>
                  <Input
                    id="main_alt"
                    value={mainAltText}
                    onChange={(e) => setMainAltText(e.target.value)}
                    placeholder="Описание для основного медиа"
                    maxLength={255}
                    disabled={uploading}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Secondary Media */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Дополнительное медиа *</Label>
              {secondaryFile && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => clearFile('secondary')}
                  disabled={uploading}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {!secondaryFile ? (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="secondary_file">Выберите файл</Label>
                  <Input
                    id="secondary_file"
                    ref={secondaryFileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleSecondaryFileChange}
                    disabled={uploading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Необязательно. Изображения: до 2МБ (JPG, PNG, WebP, SVG), Видео: до 50МБ
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* File Preview */}
                <div className="border rounded-lg p-3">
                  <div className="flex items-start gap-3">
                    {secondaryFile.type === 'image' ? (
                      <FileImage className="w-8 h-8 text-blue-600 flex-shrink-0" />
                    ) : (
                      <FileVideo className="w-8 h-8 text-purple-600 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{secondaryFile.file.name}</p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(secondaryFile.file.size)} • {secondaryFile.file.type}
                      </p>
                      {secondaryFile.preview && (
                        <div className="mt-2">
                          {secondaryFile.type === 'image' ? (
                            <img 
                              src={secondaryFile.preview} 
                              alt="Preview" 
                              className="w-20 h-20 object-cover rounded border"
                            />
                          ) : (
                            <div className="w-20 h-20 bg-gray-100 rounded border flex items-center justify-center">
                              <Video className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Poster upload for video */}
                {secondaryFile.type === 'video' && (
                  <div className="space-y-2">
                    <Label htmlFor="secondary_poster">Постер для видео *</Label>
                    <Input
                      id="secondary_poster"
                      ref={secondaryPosterInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleSecondaryPosterChange}
                      disabled={uploading}
                    />
                    {(secondaryFile.posterPreview || existingSecondaryPoster) && (
                      <div className="mt-2">
                        <img 
                          src={secondaryFile.posterPreview || getFileUrl(existingSecondaryPoster!)} 
                          alt="Poster preview" 
                          className="w-20 h-20 object-cover rounded border"
                        />
                        {existingSecondaryPoster && !secondaryFile.posterPreview && (
                          <p className="text-xs text-gray-500 mt-1">Текущий постер</p>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Обязательно для видео файлов
                    </p>
                  </div>
                )}

                {/* Alt text */}
                <div className="space-y-2">
                  <Label htmlFor="secondary_alt">Описание</Label>
                  <Input
                    id="secondary_alt"
                    value={secondaryAltText}
                    onChange={(e) => setSecondaryAltText(e.target.value)}
                    placeholder="Описание для дополнительного медиа"
                    maxLength={255}
                    disabled={uploading}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Загрузка медиа-группы...</span>
              <span className="text-gray-600">{Math.round(localProgress)}%</span>
            </div>
            <Progress value={localProgress} className="h-2" />
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Пожалуйста, не закрывайте страницу во время загрузки</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          {onCancel && (
            <Button 
              type="button"
              variant="outline" 
              onClick={onCancel}
              disabled={uploading}
            >
              Отмена
            </Button>
          )}
          <Button 
            onClick={handleUpload}
            disabled={uploading || !isFormValid}
            className="min-w-[120px]"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Загрузка...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Загрузить
              </>
            )}
          </Button>
        </div>

        {/* Help Text */}
        <div className="text-sm text-muted-foreground space-y-1">
          <p>• Оба медиа (основное и дополнительное) обязательны для загрузки</p>
          <p>• Они будут отображаться рядом на одном слайде</p>
          <p>• Для видео файлов обязательно загрузить постер-изображение</p>
          <p>• Максимальный размер: изображения 2МБ, видео 50МБ</p>
        </div>
      </CardContent>
    </Card>
  );
}