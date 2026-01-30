<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\MediaPagePublicController;
use App\Models\MediaPageContent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Exception;

class MediaPageController extends Controller
{
    /**
     * Get current media page content
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function index()
    {
        try {
            $mediaPageContent = MediaPageContent::first();
            
            if (!$mediaPageContent) {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'hero_title' => '',
                        'hero_description' => '',
                        'testimonials_title' => '',
                        'testimonials_subtitle' => '',
                        'process_title' => '',
                        'process_subtitle' => ''
                    ],
                    'message' => 'Контент медиа страницы не настроен'
                ]);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $mediaPageContent->id,
                    'hero_title' => $mediaPageContent->hero_title,
                    'hero_description' => $mediaPageContent->hero_description,
                    'testimonials_title' => $mediaPageContent->testimonials_title,
                    'testimonials_subtitle' => $mediaPageContent->testimonials_subtitle,
                    'process_title' => $mediaPageContent->process_title,
                    'process_subtitle' => $mediaPageContent->process_subtitle,
                    'created_at' => $mediaPageContent->created_at,
                    'updated_at' => $mediaPageContent->updated_at,
                ]
            ]);
        } catch (Exception $e) {
            Log::error('Error fetching media page content: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Ошибка сервера при загрузке контента медиа страницы'
            ], 500);
        }
    }

    /**
     * Update hero section content
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateHero(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'hero_title' => 'required|string|max:255',
                'hero_description' => 'required|string|max:1000',
            ], [
                'hero_title.required' => 'Заголовок героя обязателен для заполнения',
                'hero_title.string' => 'Заголовок героя должен быть строкой',
                'hero_title.max' => 'Заголовок героя не должен превышать 255 символов',
                'hero_description.required' => 'Описание героя обязательно для заполнения',
                'hero_description.string' => 'Описание героя должно быть строкой',
                'hero_description.max' => 'Описание героя не должно превышать 1000 символов',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ошибка валидации данных',
                    'errors' => $validator->errors()
                ], 422);
            }

            $mediaPageContent = MediaPageContent::firstOrCreate(
                [],
                [
                    'hero_title' => '',
                    'hero_description' => '',
                    'testimonials_title' => '',
                    'testimonials_subtitle' => '',
                    'process_title' => '',
                    'process_subtitle' => ''
                ]
            );

            $mediaPageContent->update([
                'hero_title' => $request->hero_title,
                'hero_description' => $request->hero_description,
            ]);

            Log::info('Hero section updated successfully', [
                'media_page_content_id' => $mediaPageContent->id,
                'hero_title' => $request->hero_title
            ]);

            // Clear public cache
            try {
                MediaPagePublicController::clearCache();
            } catch (Exception $e) {
                Log::warning('Failed to clear cache: ' . $e->getMessage());
            }

            return response()->json([
                'success' => true,
                'message' => 'Секция героя успешно обновлена',
                'data' => [
                    'id' => $mediaPageContent->id,
                    'hero_title' => $mediaPageContent->hero_title,
                    'hero_description' => $mediaPageContent->hero_description,
                    'testimonials_title' => $mediaPageContent->testimonials_title,
                    'testimonials_subtitle' => $mediaPageContent->testimonials_subtitle,
                    'process_title' => $mediaPageContent->process_title,
                    'process_subtitle' => $mediaPageContent->process_subtitle,
                    'created_at' => $mediaPageContent->created_at,
                    'updated_at' => $mediaPageContent->updated_at,
                ]
            ]);

        } catch (Exception $e) {
            $this->logError('hero_update', [
                'hero_title' => $request->hero_title ?? null,
                'hero_description' => $request->hero_description ?? null,
            ], $e);
            
            return response()->json([
                'success' => false,
                'message' => 'Произошла ошибка сервера при обновлении секции героя'
            ], 500);
        }
    }

    /**
     * Update testimonials header content
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateTestimonialsHeader(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'testimonials_title' => 'required|string|max:255',
                'testimonials_subtitle' => 'required|string|max:500',
            ], [
                'testimonials_title.required' => 'Заголовок отзывов обязателен для заполнения',
                'testimonials_title.string' => 'Заголовок отзывов должен быть строкой',
                'testimonials_title.max' => 'Заголовок отзывов не должен превышать 255 символов',
                'testimonials_subtitle.required' => 'Подзаголовок отзывов обязателен для заполнения',
                'testimonials_subtitle.string' => 'Подзаголовок отзывов должен быть строкой',
                'testimonials_subtitle.max' => 'Подзаголовок отзывов не должен превышать 500 символов',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ошибка валидации данных',
                    'errors' => $validator->errors()
                ], 422);
            }

            $mediaPageContent = MediaPageContent::firstOrCreate(
                [],
                [
                    'hero_title' => '',
                    'hero_description' => '',
                    'testimonials_title' => '',
                    'testimonials_subtitle' => '',
                    'process_title' => '',
                    'process_subtitle' => ''
                ]
            );

            $mediaPageContent->update([
                'testimonials_title' => $request->testimonials_title,
                'testimonials_subtitle' => $request->testimonials_subtitle,
            ]);

            Log::info('Testimonials header updated successfully', [
                'media_page_content_id' => $mediaPageContent->id,
                'testimonials_title' => $request->testimonials_title
            ]);

            // Clear public cache
            try {
                MediaPagePublicController::clearCache();
            } catch (Exception $e) {
                Log::warning('Failed to clear cache: ' . $e->getMessage());
            }

            return response()->json([
                'success' => true,
                'message' => 'Заголовок отзывов успешно обновлен',
                'data' => [
                    'id' => $mediaPageContent->id,
                    'hero_title' => $mediaPageContent->hero_title,
                    'hero_description' => $mediaPageContent->hero_description,
                    'testimonials_title' => $mediaPageContent->testimonials_title,
                    'testimonials_subtitle' => $mediaPageContent->testimonials_subtitle,
                    'process_title' => $mediaPageContent->process_title,
                    'process_subtitle' => $mediaPageContent->process_subtitle,
                    'created_at' => $mediaPageContent->created_at,
                    'updated_at' => $mediaPageContent->updated_at,
                ]
            ]);

        } catch (Exception $e) {
            $this->logError('testimonials_header_update', [
                'testimonials_title' => $request->testimonials_title ?? null,
                'testimonials_subtitle' => $request->testimonials_subtitle ?? null,
            ], $e);
            
            return response()->json([
                'success' => false,
                'message' => 'Произошла ошибка сервера при обновлении заголовка отзывов'
            ], 500);
        }
    }

    /**
     * Update process header content
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateProcessHeader(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'process_title' => 'required|string|max:255',
                'process_subtitle' => 'required|string|max:500',
            ], [
                'process_title.required' => 'Заголовок процесса обязателен для заполнения',
                'process_title.string' => 'Заголовок процесса должен быть строкой',
                'process_title.max' => 'Заголовок процесса не должен превышать 255 символов',
                'process_subtitle.required' => 'Подзаголовок процесса обязателен для заполнения',
                'process_subtitle.string' => 'Подзаголовок процесса должен быть строкой',
                'process_subtitle.max' => 'Подзаголовок процесса не должен превышать 500 символов',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ошибка валидации данных',
                    'errors' => $validator->errors()
                ], 422);
            }

            $mediaPageContent = MediaPageContent::firstOrCreate(
                [],
                [
                    'hero_title' => '',
                    'hero_description' => '',
                    'testimonials_title' => '',
                    'testimonials_subtitle' => '',
                    'process_title' => '',
                    'process_subtitle' => ''
                ]
            );

            $mediaPageContent->update([
                'process_title' => $request->process_title,
                'process_subtitle' => $request->process_subtitle,
            ]);

            Log::info('Process header updated successfully', [
                'media_page_content_id' => $mediaPageContent->id,
                'process_title' => $request->process_title
            ]);

            // Clear public cache
            try {
                MediaPagePublicController::clearCache();
            } catch (Exception $e) {
                Log::warning('Failed to clear cache: ' . $e->getMessage());
            }

            return response()->json([
                'success' => true,
                'message' => 'Заголовок процесса успешно обновлен',
                'data' => [
                    'id' => $mediaPageContent->id,
                    'hero_title' => $mediaPageContent->hero_title,
                    'hero_description' => $mediaPageContent->hero_description,
                    'testimonials_title' => $mediaPageContent->testimonials_title,
                    'testimonials_subtitle' => $mediaPageContent->testimonials_subtitle,
                    'process_title' => $mediaPageContent->process_title,
                    'process_subtitle' => $mediaPageContent->process_subtitle,
                    'created_at' => $mediaPageContent->created_at,
                    'updated_at' => $mediaPageContent->updated_at,
                ]
            ]);

        } catch (Exception $e) {
            $this->logError('process_header_update', [
                'process_title' => $request->process_title ?? null,
                'process_subtitle' => $request->process_subtitle ?? null,
            ], $e);
            
            return response()->json([
                'success' => false,
                'message' => 'Произошла ошибка сервера при обновлении заголовка процесса'
            ], 500);
        }
    }

    /**
     * Validate file size based on type
     * 
     * @param int $fileSize
     * @param string $type 'image' or 'video'
     * @return bool
     */
    public static function validateFileSize($fileSize, $type)
    {
        $maxSize = $type === 'image' ? 2 * 1024 * 1024 : 50 * 1024 * 1024; // 2MB for images, 50MB for videos
        return $fileSize <= $maxSize;
    }

    /**
     * Validate image format
     * 
     * @param \Illuminate\Http\UploadedFile $file
     * @return bool
     */
    public static function validateImageFormat($file)
    {
        $allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
        return in_array($file->getMimeType(), $allowedMimes);
    }

    /**
     * Validate video format
     * 
     * @param \Illuminate\Http\UploadedFile $file
     * @return bool
     */
    public static function validateVideoFormat($file)
    {
        $allowedMimes = ['video/mp4', 'video/webm'];
        return in_array($file->getMimeType(), $allowedMimes);
    }

    /**
     * Handle file upload errors with detailed error messages
     * 
     * @param \Illuminate\Validation\Validator $validator
     * @param \Illuminate\Http\UploadedFile $file
     * @param string $fieldName
     * @return void
     */
    public static function handleFileUploadError($validator, $file, $fieldName)
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
    public static function validateFileIntegrity($file, $fieldName)
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
        if (strpos($fieldName, 'video') !== false) {
            $extension = strtolower($file->getClientOriginalExtension());
            $mimeType = $file->getMimeType();
            
            $validCombinations = [
                'mp4' => ['video/mp4'],
                'webm' => ['video/webm'],
            ];

            if (isset($validCombinations[$extension])) {
                if (!in_array($mimeType, $validCombinations[$extension])) {
                    $errors[] = "Несоответствие расширения файла ({$extension}) и типа содержимого ({$mimeType})";
                }
            }
        }

        // Check for image files
        if (strpos($fieldName, 'image') !== false || strpos($fieldName, 'poster') !== false) {
            $extension = strtolower($file->getClientOriginalExtension());
            $mimeType = $file->getMimeType();
            
            $validCombinations = [
                'jpg' => ['image/jpeg'],
                'jpeg' => ['image/jpeg'],
                'png' => ['image/png'],
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
    public static function validateStorageCapacity()
    {
        $errors = [];

        try {
            // Check if storage directory exists and is writable
            $mediaDir = storage_path('app/public/media');

            if (!is_dir($mediaDir) && !mkdir($mediaDir, 0755, true)) {
                $errors[] = 'Не удалось создать директорию для медиа файлов';
            }

            if (!is_writable(dirname($mediaDir))) {
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
     * Validate uploaded file with comprehensive checks
     * 
     * @param \Illuminate\Http\UploadedFile $file
     * @param string $type 'image' or 'video'
     * @param string $fieldName
     * @param \Illuminate\Validation\Validator $validator
     * @param bool $requirePoster Whether poster is required for video
     * @return bool
     */
    public static function validateUploadedFile($file, $type, $fieldName, $validator, $requirePoster = false)
    {
        // Check storage capacity first
        $storageErrors = self::validateStorageCapacity();
        if ($storageErrors) {
            foreach ($storageErrors as $error) {
                $validator->errors()->add($fieldName, $error);
            }
            return false;
        }
        
        if (!$file->isValid()) {
            self::handleFileUploadError($validator, $file, $fieldName);
            return false;
        }

        // Validate file integrity and security
        $integrityErrors = self::validateFileIntegrity($file, $fieldName);
        if ($integrityErrors) {
            foreach ($integrityErrors as $error) {
                $validator->errors()->add($fieldName, $error);
            }
            return false;
        }

        // Check file size
        if (!self::validateFileSize($file->getSize(), $type)) {
            $maxSize = $type === 'image' ? '2MB' : '50MB';
            $validator->errors()->add($fieldName, "Размер файла не должен превышать {$maxSize}");
            return false;
        }

        // Check file format
        if ($type === 'image' && !self::validateImageFormat($file)) {
            $validator->errors()->add($fieldName, 'Недопустимый тип изображения. Разрешены: JPEG, PNG, WebP');
            return false;
        }

        if ($type === 'video' && !self::validateVideoFormat($file)) {
            $validator->errors()->add($fieldName, 'Недопустимый тип видео файла. Разрешены: MP4, WebM');
            return false;
        }

        return true;
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

        Log::error("Media page content {$operation} error", $logData);
    }
}