<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HomeContent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Exception;

class HomeController extends Controller
{
    /**
     * Get current home content
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function index()
    {
        try {
            $homeContent = HomeContent::getActive();
            
            if (!$homeContent) {
                return response()->json([
                    'success' => true,
                    'data' => null,
                    'message' => 'No home content configured'
                ]);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $homeContent->id,
                    'hero_video_url' => $homeContent->hero_video_url,
                    'hero_video_original_name' => $homeContent->hero_video_original_name,
                    'hero_video_size' => $homeContent->hero_video_size,
                    'formatted_video_size' => $homeContent->formatted_video_size,
                    'hero_fallback_image_url' => $homeContent->hero_fallback_image_url,
                    'is_active' => $homeContent->is_active,
                    'created_at' => $homeContent->created_at,
                    'updated_at' => $homeContent->updated_at,
                ]
            ]);
        } catch (Exception $e) {
            Log::error('Error fetching home content: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Ошибка сервера при загрузке контента главной страницы'
            ], 500);
        }
    }

    /**
     * Upload new hero video
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function uploadHeroVideo(Request $request)
    {
        try {
            Log::info('Hero video upload started', [
                'has_video_file' => $request->hasFile('hero_video'),
                'content_length' => $request->header('Content-Length'),
                'content_type' => $request->header('Content-Type'),
            ]);

            // Validate the uploaded file
            $validator = Validator::make($request->all(), [
                'hero_video' => 'required|file|mimes:mp4,mov,avi,webm|max:51200', // 50MB limit
            ]);

            // Comprehensive file validation
            $validator->after(function ($validator) use ($request) {
                if ($request->hasFile('hero_video')) {
                    $file = $request->file('hero_video');
                    
                    // Check storage capacity first
                    $storageErrors = $this->validateStorageCapacity();
                    if ($storageErrors) {
                        foreach ($storageErrors as $error) {
                            $validator->errors()->add('hero_video', $error);
                        }
                        return;
                    }
                    
                    if (!$file->isValid()) {
                        $this->handleFileUploadError($validator, $file, 'hero_video');
                        return;
                    }

                    // Validate file integrity and security
                    $integrityErrors = $this->validateFileIntegrity($file, 'hero_video');
                    if ($integrityErrors) {
                        foreach ($integrityErrors as $error) {
                            $validator->errors()->add('hero_video', $error);
                        }
                        return;
                    }

                    // Check file size using model validation
                    if (!HomeContent::validateVideoSize($file->getSize())) {
                        $validator->errors()->add('hero_video', 'Размер видео не должен превышать 50MB');
                        return;
                    }

                    // Check MIME type using model validation
                    if (!HomeContent::validateVideoFormat($file)) {
                        $validator->errors()->add('hero_video', 'Недопустимый тип видео файла. Разрешены: MP4, MOV, AVI, WebM');
                        return;
                    }

                    Log::info('Video file validation passed', [
                        'file_name' => $file->getClientOriginalName(),
                        'file_size' => $file->getSize(),
                        'mime_type' => $file->getMimeType(),
                    ]);
                }
            });

            if ($validator->fails()) {
                Log::error('Hero video validation failed', [
                    'errors' => $validator->errors()->toArray()
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Ошибка валидации файла',
                    'errors' => $validator->errors()
                ], 422);
            }

            $file = $request->file('hero_video');
            
            // Store the video file using the model's storage method
            $videoPath = HomeContent::storeVideoFile($file);
            
            Log::info('Video file stored', [
                'path' => $videoPath,
                'original_name' => $file->getClientOriginalName(),
                'size' => $file->getSize()
            ]);

            // Get current active home content to clean up old video
            $currentContent = HomeContent::getActive();
            $oldVideoPath = $currentContent ? $currentContent->hero_video_path : null;

            // Create or update home content
            $homeContent = HomeContent::updateOrCreate(
                ['is_active' => true],
                [
                    'hero_video_path' => $videoPath,
                    'hero_video_original_name' => $file->getClientOriginalName(),
                    'hero_video_size' => $file->getSize(),
                    'is_active' => true,
                ]
            );

            // Clean up old video file if it exists and is different
            if ($oldVideoPath && $oldVideoPath !== $videoPath) {
                HomeContent::cleanupOldVideo($oldVideoPath);
                Log::info('Old video file cleaned up', ['path' => $oldVideoPath]);
            }

            Log::info('Hero video uploaded successfully', [
                'home_content_id' => $homeContent->id,
                'video_path' => $videoPath
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Видео успешно загружено',
                'data' => [
                    'id' => $homeContent->id,
                    'hero_video_url' => $homeContent->hero_video_url,
                    'hero_video_original_name' => $homeContent->hero_video_original_name,
                    'hero_video_size' => $homeContent->hero_video_size,
                    'formatted_video_size' => $homeContent->formatted_video_size,
                    'hero_fallback_image_url' => $homeContent->hero_fallback_image_url,
                    'is_active' => $homeContent->is_active,
                    'created_at' => $homeContent->created_at,
                    'updated_at' => $homeContent->updated_at,
                ]
            ], 201);

        } catch (Exception $e) {
            $this->logError('video_upload', [
                'file_info' => $request->hasFile('hero_video') ? [
                    'name' => $request->file('hero_video')->getClientOriginalName(),
                    'size' => $request->file('hero_video')->getSize(),
                    'type' => $request->file('hero_video')->getMimeType(),
                ] : null,
            ], $e);
            
            // Return user-friendly error message without exposing internal details
            return response()->json([
                'success' => false,
                'message' => 'Произошла ошибка сервера при загрузке видео. Попробуйте позже или обратитесь к администратору'
            ], 500);
        }
    }

    /**
     * Delete hero video
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function deleteHeroVideo()
    {
        try {
            $homeContent = HomeContent::getActive();
            
            if (!$homeContent || !$homeContent->hero_video_path) {
                return response()->json([
                    'success' => false,
                    'message' => 'Видео не найдено'
                ], 404);
            }

            Log::info('Deleting hero video', [
                'home_content_id' => $homeContent->id,
                'video_path' => $homeContent->hero_video_path
            ]);

            // Clean up the video file
            HomeContent::cleanupOldVideo($homeContent->hero_video_path);

            // Update the record to remove video data
            $homeContent->update([
                'hero_video_path' => null,
                'hero_video_original_name' => null,
                'hero_video_size' => null,
            ]);

            Log::info('Hero video deleted successfully', [
                'home_content_id' => $homeContent->id
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Видео успешно удалено',
                'data' => [
                    'id' => $homeContent->id,
                    'hero_video_url' => null,
                    'hero_video_original_name' => null,
                    'hero_video_size' => null,
                    'formatted_video_size' => null,
                    'hero_fallback_image_url' => $homeContent->hero_fallback_image_url,
                    'is_active' => $homeContent->is_active,
                    'created_at' => $homeContent->created_at,
                    'updated_at' => $homeContent->updated_at,
                ]
            ]);

        } catch (Exception $e) {
            $this->logError('video_deletion', [
                'home_content_id' => isset($homeContent) ? $homeContent->id : null,
                'video_path' => isset($homeContent) ? $homeContent->hero_video_path : null,
            ], $e);
            
            return response()->json([
                'success' => false,
                'message' => 'Произошла ошибка сервера при удалении видео. Попробуйте позже или обратитесь к администратору'
            ], 500);
        }
    }

    /**
     * Upload fallback image for hero section
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function uploadFallbackImage(Request $request)
    {
        try {
            Log::info('Fallback image upload started', [
                'has_image_file' => $request->hasFile('fallback_image'),
                'content_length' => $request->header('Content-Length'),
                'content_type' => $request->header('Content-Type'),
            ]);

            // Validate the uploaded file
            $validator = Validator::make($request->all(), [
                'fallback_image' => 'required|file|mimes:jpeg,jpg,png,gif,webp,svg|max:2048', // 2MB limit
            ]);

            // Comprehensive file validation
            $validator->after(function ($validator) use ($request) {
                if ($request->hasFile('fallback_image')) {
                    $file = $request->file('fallback_image');
                    
                    // Check storage capacity first
                    $storageErrors = $this->validateStorageCapacity();
                    if ($storageErrors) {
                        foreach ($storageErrors as $error) {
                            $validator->errors()->add('fallback_image', $error);
                        }
                        return;
                    }
                    
                    if (!$file->isValid()) {
                        $this->handleFileUploadError($validator, $file, 'fallback_image');
                        return;
                    }

                    // Validate file integrity and security
                    $integrityErrors = $this->validateFileIntegrity($file, 'fallback_image');
                    if ($integrityErrors) {
                        foreach ($integrityErrors as $error) {
                            $validator->errors()->add('fallback_image', $error);
                        }
                        return;
                    }

                    // Check file size using model validation
                    if (!HomeContent::validateImageSize($file->getSize())) {
                        $validator->errors()->add('fallback_image', 'Размер изображения не должен превышать 2MB');
                        return;
                    }

                    // Check MIME type using model validation
                    if (!HomeContent::validateImageFormat($file)) {
                        $validator->errors()->add('fallback_image', 'Недопустимый тип изображения. Разрешены: JPEG, PNG, GIF, WebP');
                        return;
                    }

                    Log::info('Image file validation passed', [
                        'file_name' => $file->getClientOriginalName(),
                        'file_size' => $file->getSize(),
                        'mime_type' => $file->getMimeType(),
                    ]);
                }
            });

            if ($validator->fails()) {
                Log::error('Fallback image validation failed', [
                    'errors' => $validator->errors()->toArray()
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Ошибка валидации файла',
                    'errors' => $validator->errors()
                ], 422);
            }

            $file = $request->file('fallback_image');
            
            // Store the image file using the model's storage method
            $imagePath = HomeContent::storeFallbackImage($file);
            
            Log::info('Image file stored', [
                'path' => $imagePath,
                'original_name' => $file->getClientOriginalName(),
                'size' => $file->getSize()
            ]);

            // Get current active home content to clean up old image
            $currentContent = HomeContent::getActive();
            $oldImagePath = $currentContent ? $currentContent->hero_fallback_image_path : null;

            // Create or update home content
            $homeContent = HomeContent::updateOrCreate(
                ['is_active' => true],
                [
                    'hero_fallback_image_path' => $imagePath,
                    'is_active' => true,
                ]
            );

            // Clean up old image file if it exists and is different
            if ($oldImagePath && $oldImagePath !== $imagePath) {
                HomeContent::cleanupOldImage($oldImagePath);
                Log::info('Old image file cleaned up', ['path' => $oldImagePath]);
            }

            Log::info('Fallback image uploaded successfully', [
                'home_content_id' => $homeContent->id,
                'image_path' => $imagePath
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Изображение успешно загружено',
                'data' => [
                    'id' => $homeContent->id,
                    'hero_video_url' => $homeContent->hero_video_url,
                    'hero_video_original_name' => $homeContent->hero_video_original_name,
                    'hero_video_size' => $homeContent->hero_video_size,
                    'formatted_video_size' => $homeContent->formatted_video_size,
                    'hero_fallback_image_url' => $homeContent->hero_fallback_image_url,
                    'is_active' => $homeContent->is_active,
                    'created_at' => $homeContent->created_at,
                    'updated_at' => $homeContent->updated_at,
                ]
            ], 201);

        } catch (Exception $e) {
            $this->logError('image_upload', [
                'file_info' => $request->hasFile('fallback_image') ? [
                    'name' => $request->file('fallback_image')->getClientOriginalName(),
                    'size' => $request->file('fallback_image')->getSize(),
                    'type' => $request->file('fallback_image')->getMimeType(),
                ] : null,
            ], $e);
            
            return response()->json([
                'success' => false,
                'message' => 'Произошла ошибка сервера при загрузке изображения. Попробуйте позже или обратитесь к администратору'
            ], 500);
        }
    }

    /**
     * Handle file upload errors with detailed error messages
     * 
     * @param \Illuminate\Validation\Validator $validator
     * @param \Illuminate\Http\UploadedFile $file
     * @param string $fieldName
     * @return void
     */
    private function handleFileUploadError($validator, $file, $fieldName)
    {
        $error = $file->getError();
        $errorMessages = [
            UPLOAD_ERR_INI_SIZE => 'Файл превышает размер, указанный в php.ini (upload_max_filesize)',
            UPLOAD_ERR_FORM_SIZE => 'Файл превышает размер, указанный в HTML форме (MAX_FILE_SIZE)',
            UPLOAD_ERR_PARTIAL => 'Файл был загружен частично',
            UPLOAD_ERR_NO_FILE => 'Файл не был загружен',
            UPLOAD_ERR_NO_TMP_DIR => 'Отсутствует временная папка',
            UPLOAD_ERR_CANT_WRITE => 'Не удалось записать файл на диск',
            UPLOAD_ERR_EXTENSION => 'PHP расширение остановило загрузку файла',
        ];
        
        $message = $errorMessages[$error] ?? 'Неизвестная ошибка загрузки файла (код: ' . $error . ')';
        
        Log::error($fieldName . ' upload error', [
            'error_code' => $error,
            'error_message' => $message,
            'file_size' => $file->getSize(),
            'file_name' => $file->getClientOriginalName(),
            'temp_name' => $file->getPathname(),
            'mime_type' => $file->getMimeType(),
        ]);
        
        $validator->errors()->add($fieldName, $message);
    }

    /**
     * Validate file integrity and security
     * 
     * @param \Illuminate\Http\UploadedFile $file
     * @param string $fieldName
     * @return array|null Array of errors or null if valid
     */
    private function validateFileIntegrity($file, $fieldName)
    {
        $errors = [];

        // Check if file is actually uploaded
        if (!$file->isValid()) {
            $errors[] = 'Файл поврежден или не был корректно загружен';
            return $errors;
        }

        // Check file size is not zero
        if ($file->getSize() === 0) {
            $errors[] = 'Файл пуст или поврежден';
        }

        // Check file has a valid name
        $originalName = $file->getClientOriginalName();
        if (empty($originalName) || strlen($originalName) > 255) {
            $errors[] = 'Недопустимое имя файла';
        }

        // Check for suspicious file names
        if (preg_match('/[\/\\\\]/', $originalName) || strpos($originalName, '..') !== false) {
            $errors[] = 'Имя файла содержит недопустимые символы';
        }

        // Check file extension matches MIME type for videos
        if ($fieldName === 'hero_video') {
            $extension = strtolower($file->getClientOriginalExtension());
            $mimeType = $file->getMimeType();
            
            $validCombinations = [
                'mp4' => ['video/mp4'],
                'mov' => ['video/quicktime'],
                'avi' => ['video/x-msvideo', 'video/avi'],
                'webm' => ['video/webm'],
                'ogg' => ['video/ogg'],
            ];

            if (isset($validCombinations[$extension])) {
                if (!in_array($mimeType, $validCombinations[$extension])) {
                    $errors[] = "Несоответствие расширения файла ({$extension}) и типа содержимого ({$mimeType})";
                }
            }
        }

        // Check for image files
        if ($fieldName === 'fallback_image') {
            $extension = strtolower($file->getClientOriginalExtension());
            $mimeType = $file->getMimeType();
            
            $validCombinations = [
                'jpg' => ['image/jpeg'],
                'jpeg' => ['image/jpeg'],
                'png' => ['image/png'],
                'gif' => ['image/gif'],
                'webp' => ['image/webp'],
            ];

            if (isset($validCombinations[$extension])) {
                if (!in_array($mimeType, $validCombinations[$extension])) {
                    $errors[] = "Несоответствие расширения файла ({$extension}) и типа содержимого ({$mimeType})";
                }
            }
        }

        return empty($errors) ? null : $errors;
    }

    /**
     * Check server storage capacity and permissions
     * 
     * @return array|null Array of errors or null if valid
     */
    private function validateStorageCapacity()
    {
        $errors = [];

        try {
            // Check if storage directory exists and is writable
            $videoDir = storage_path('app/public/' . HomeContent::getVideoStorageDirectory());
            $imageDir = storage_path('app/public/' . HomeContent::getFallbackImageStorageDirectory());

            if (!is_dir($videoDir) && !mkdir($videoDir, 0755, true)) {
                $errors[] = 'Не удалось создать директорию для видео файлов';
            }

            if (!is_dir($imageDir) && !mkdir($imageDir, 0755, true)) {
                $errors[] = 'Не удалось создать директорию для изображений';
            }

            if (!is_writable(dirname($videoDir))) {
                $errors[] = 'Нет прав на запись в директорию хранения';
            }

            // Check available disk space (require at least 100MB free)
            $freeBytes = disk_free_space(storage_path('app/public'));
            $requiredBytes = 100 * 1024 * 1024; // 100MB

            if ($freeBytes !== false && $freeBytes < $requiredBytes) {
                $errors[] = 'Недостаточно свободного места на диске';
            }

        } catch (Exception $e) {
            Log::error('Storage validation error: ' . $e->getMessage());
            $errors[] = 'Ошибка проверки хранилища файлов';
        }

        return empty($errors) ? null : $errors;
    }

    /**
     * Log comprehensive error information for debugging
     * 
     * @param string $operation
     * @param array $context
     * @param Exception|null $exception
     * @return void
     */
    private function logError($operation, $context = [], $exception = null)
    {
        $logData = [
            'operation' => $operation,
            'timestamp' => now()->toISOString(),
            'user_agent' => request()->header('User-Agent'),
            'ip_address' => request()->ip(),
            'context' => $context,
        ];

        if ($exception) {
            $logData['exception'] = [
                'message' => $exception->getMessage(),
                'file' => $exception->getFile(),
                'line' => $exception->getLine(),
                'trace' => $exception->getTraceAsString(),
            ];
        }

        Log::error("Home content {$operation} error", $logData);
    }
}