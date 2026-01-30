<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\MediaPagePublicController;
use App\Models\MediaProcessStep;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Exception;

class MediaProcessStepsController extends Controller
{
    /**
     * Get all process steps ordered by their order field
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function index()
    {
        try {
            $processSteps = MediaProcessStep::ordered()->get();
            
            // Remove /storage/ prefix from image paths
            $processSteps->transform(function ($step) {
                if ($step->image_path) {
                    $step->image_path = str_replace('/storage/', '', $step->image_path);
                }
                return $step;
            });

            return response()->json([
                'success' => true,
                'data' => $processSteps,
                'message' => 'Шаги процесса успешно загружены'
            ]);
        } catch (Exception $e) {
            Log::error('Error fetching process steps: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Ошибка сервера при загрузке шагов процесса'
            ], 500);
        }
    }

    /**
     * Store a new process step
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        Log::info('=== MediaProcessStepsController::store START ===');
        Log::info('Request headers:', $request->headers->all());
        Log::info('Request method:', [$request->method()]);
        Log::info('Request all data:', $request->all());
        Log::info('Request files:', $request->allFiles());
        Log::info('Auth check:', [auth()->check()]);
        Log::info('Auth user:', [auth()->user()]);
        
        try {
            $validator = Validator::make($request->all(), [
                'step_number' => 'required|integer|min:1',
                'title' => 'required|string|max:255',
                'subtitle' => 'nullable|string|max:500',
                'description_left' => 'required|string|max:1000',
                'description_right' => 'required|string|max:1000',
                'image' => 'required|file|mimes:jpeg,jpg,png,webp,svg|max:2048',
                'order' => 'nullable|integer|min:1'
            ], [
                'step_number.required' => 'Номер шага обязателен для заполнения',
                'step_number.integer' => 'Номер шага должен быть числом',
                'step_number.min' => 'Номер шага должен быть больше 0',
                'title.required' => 'Заголовок обязателен для заполнения',
                'title.string' => 'Заголовок должен быть строкой',
                'title.max' => 'Заголовок не должен превышать 255 символов',
                'subtitle.string' => 'Подзаголовок должен быть строкой',
                'subtitle.max' => 'Подзаголовок не должен превышать 500 символов',
                'description_left.required' => 'Левое описание обязательно для заполнения',
                'description_left.string' => 'Левое описание должно быть строкой',
                'description_left.max' => 'Левое описание не должно превышать 1000 символов',
                'description_right.required' => 'Правое описание обязательно для заполнения',
                'description_right.string' => 'Правое описание должно быть строкой',
                'description_right.max' => 'Правое описание не должно превышать 1000 символов',
                'image.required' => 'Изображение обязательно для загрузки',
                'image.file' => 'Изображение должно быть файлом',
                'image.mimes' => 'Недопустимый тип изображения. Разрешены: JPEG, PNG, WebP, SVG',
                'image.max' => 'Размер изображения не должен превышать 2MB',
                'order.integer' => 'Порядок должен быть числом',
                'order.min' => 'Порядок должен быть больше 0'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ошибка валидации данных',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Validate uploaded image file
            $imageFile = $request->file('image');
            if (!$this->validateUploadedFile($imageFile, 'image', 'image', $validator)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ошибка валидации изображения',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Set order if not provided
            $order = $request->order ?? (MediaProcessStep::max('order') + 1);

            // Store the image
            $imagePath = $imageFile->store('media/process-steps', 'public');

            $processStep = MediaProcessStep::create([
                'step_number' => $request->step_number,
                'title' => $request->title,
                'subtitle' => $request->subtitle,
                'description_left' => $request->description_left,
                'description_right' => $request->description_right,
                'image_path' => $imagePath,
                'order' => $order
            ]);

            Log::info('Process step created successfully', [
                'process_step_id' => $processStep->id,
                'step_number' => $request->step_number,
                'title' => $request->title
            ]);

            // Clear public cache
            MediaPagePublicController::clearCache();

            // Remove /storage/ prefix from image path in response
            $processStep->image_path = str_replace('/storage/', '', $processStep->image_path);

            return response()->json([
                'success' => true,
                'message' => 'Шаг процесса успешно создан',
                'data' => $processStep
            ], 201);

        } catch (Exception $e) {
            $this->logError('process_step_create', [
                'step_number' => $request->step_number ?? null,
                'title' => $request->title ?? null,
            ], $e);
            
            return response()->json([
                'success' => false,
                'message' => 'Произошла ошибка сервера при создании шага процесса'
            ], 500);
        }
    }

    /**
     * Show a specific process step
     * 
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id)
    {
        try {
            $processStep = MediaProcessStep::find($id);
            
            if (!$processStep) {
                return response()->json([
                    'success' => false,
                    'message' => 'Шаг процесса не найден'
                ], 404);
            }

            // Remove /storage/ prefix from image path
            if ($processStep->image_path) {
                $processStep->image_path = str_replace('/storage/', '', $processStep->image_path);
            }

            return response()->json([
                'success' => true,
                'data' => $processStep,
                'message' => 'Шаг процесса успешно загружен'
            ]);
        } catch (Exception $e) {
            Log::error('Error fetching process step: ' . $e->getMessage(), [
                'process_step_id' => $id,
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Ошибка сервера при загрузке шага процесса'
            ], 500);
        }
    }

    /**
     * Update a process step
     * 
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, $id)
    {
        try {
            $processStep = MediaProcessStep::find($id);
            
            if (!$processStep) {
                return response()->json([
                    'success' => false,
                    'message' => 'Шаг процесса не найден'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'step_number' => 'required|integer|min:1',
                'title' => 'required|string|max:255',
                'subtitle' => 'nullable|string|max:500',
                'description_left' => 'required|string|max:1000',
                'description_right' => 'required|string|max:1000',
                'image' => 'nullable|file|mimes:jpeg,jpg,png,webp,svg|max:2048',
                'order' => 'nullable|integer|min:1'
            ], [
                'step_number.required' => 'Номер шага обязателен для заполнения',
                'step_number.integer' => 'Номер шага должен быть числом',
                'step_number.min' => 'Номер шага должен быть больше 0',
                'title.required' => 'Заголовок обязателен для заполнения',
                'title.string' => 'Заголовок должен быть строкой',
                'title.max' => 'Заголовок не должен превышать 255 символов',
                'subtitle.string' => 'Подзаголовок должен быть строкой',
                'subtitle.max' => 'Подзаголовок не должен превышать 500 символов',
                'description_left.required' => 'Левое описание обязательно для заполнения',
                'description_left.string' => 'Левое описание должно быть строкой',
                'description_left.max' => 'Левое описание не должно превышать 1000 символов',
                'description_right.required' => 'Правое описание обязательно для заполнения',
                'description_right.string' => 'Правое описание должно быть строкой',
                'description_right.max' => 'Правое описание не должно превышать 1000 символов',
                'image.file' => 'Изображение должно быть файлом',
                'image.mimes' => 'Недопустимый тип изображения. Разрешены: JPEG, PNG, WebP, SVG',
                'image.max' => 'Размер изображения не должен превышать 2MB',
                'order.integer' => 'Порядок должен быть числом',
                'order.min' => 'Порядок должен быть больше 0'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ошибка валидации данных',
                    'errors' => $validator->errors()
                ], 422);
            }

            $updateData = [
                'step_number' => $request->step_number,
                'title' => $request->title,
                'subtitle' => $request->subtitle,
                'description_left' => $request->description_left,
                'description_right' => $request->description_right,
            ];

            if ($request->order) {
                $updateData['order'] = $request->order;
            }

            // Handle image upload if provided
            if ($request->hasFile('image')) {
                $imageFile = $request->file('image');
                
                // Validate uploaded image file
                if (!$this->validateUploadedFile($imageFile, 'image', 'image', $validator)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Ошибка валидации изображения',
                        'errors' => $validator->errors()
                    ], 422);
                }

                // Delete old image if exists
                if ($processStep->image_path && Storage::disk('public')->exists($processStep->image_path)) {
                    Storage::disk('public')->delete($processStep->image_path);
                }

                // Store new image
                $imagePath = $imageFile->store('media/process-steps', 'public');
                $updateData['image_path'] = $imagePath;
            }

            $processStep->update($updateData);

            Log::info('Process step updated successfully', [
                'process_step_id' => $processStep->id,
                'step_number' => $request->step_number,
                'title' => $request->title
            ]);

            // Clear public cache
            MediaPagePublicController::clearCache();

            // Remove /storage/ prefix from image path in response
            if ($processStep->image_path) {
                $processStep->image_path = str_replace('/storage/', '', $processStep->image_path);
            }

            return response()->json([
                'success' => true,
                'message' => 'Шаг процесса успешно обновлен',
                'data' => $processStep
            ]);

        } catch (Exception $e) {
            $this->logError('process_step_update', [
                'process_step_id' => $id,
                'step_number' => $request->step_number ?? null,
                'title' => $request->title ?? null,
            ], $e);
            
            return response()->json([
                'success' => false,
                'message' => 'Произошла ошибка сервера при обновлении шага процесса'
            ], 500);
        }
    }

    /**
     * Delete a process step
     * 
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy($id)
    {
        try {
            $processStep = MediaProcessStep::find($id);
            
            if (!$processStep) {
                return response()->json([
                    'success' => false,
                    'message' => 'Шаг процесса не найден'
                ], 404);
            }

            // Delete associated image if exists
            if ($processStep->image_path && Storage::disk('public')->exists($processStep->image_path)) {
                Storage::disk('public')->delete($processStep->image_path);
            }

            $processStep->delete();

            Log::info('Process step deleted successfully', [
                'process_step_id' => $id,
                'title' => $processStep->title
            ]);

            // Clear public cache
            MediaPagePublicController::clearCache();

            return response()->json([
                'success' => true,
                'message' => 'Шаг процесса успешно удален'
            ]);

        } catch (Exception $e) {
            $this->logError('process_step_delete', [
                'process_step_id' => $id,
            ], $e);
            
            return response()->json([
                'success' => false,
                'message' => 'Произошла ошибка сервера при удалении шага процесса'
            ], 500);
        }
    }

    /**
     * Reorder process steps
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function reorder(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'steps' => 'required|array',
                'steps.*.id' => 'required|integer|exists:media_process_steps,id',
                'steps.*.order' => 'required|integer|min:1'
            ], [
                'steps.required' => 'Список шагов обязателен для заполнения',
                'steps.array' => 'Список шагов должен быть массивом',
                'steps.*.id.required' => 'ID шага обязателен',
                'steps.*.id.integer' => 'ID шага должен быть числом',
                'steps.*.id.exists' => 'Шаг с указанным ID не найден',
                'steps.*.order.required' => 'Порядок шага обязателен',
                'steps.*.order.integer' => 'Порядок шага должен быть числом',
                'steps.*.order.min' => 'Порядок шага должен быть больше 0'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ошибка валидации данных',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Update order for each step
            foreach ($request->steps as $stepData) {
                MediaProcessStep::where('id', $stepData['id'])
                    ->update(['order' => $stepData['order']]);
            }

            Log::info('Process steps reordered successfully', [
                'steps_count' => count($request->steps)
            ]);

            // Clear public cache
            MediaPagePublicController::clearCache();

            // Return updated steps
            $processSteps = MediaProcessStep::ordered()->get();
            
            // Remove /storage/ prefix from image paths
            $processSteps->transform(function ($step) {
                if ($step->image_path) {
                    $step->image_path = str_replace('/storage/', '', $step->image_path);
                }
                return $step;
            });

            return response()->json([
                'success' => true,
                'message' => 'Порядок шагов процесса успешно обновлен',
                'data' => $processSteps
            ]);

        } catch (Exception $e) {
            $this->logError('process_steps_reorder', [
                'steps_count' => count($request->steps ?? [])
            ], $e);
            
            return response()->json([
                'success' => false,
                'message' => 'Произошла ошибка сервера при изменении порядка шагов процесса'
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
    private function validateFileSize($fileSize, $type)
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
    private function validateImageFormat($file)
    {
        $allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
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

        // Check for image files
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
     * @return bool
     */
    private function validateUploadedFile($file, $type, $fieldName, $validator)
    {
        // Check storage capacity first
        $storageErrors = $this->validateStorageCapacity();
        if ($storageErrors) {
            foreach ($storageErrors as $error) {
                $validator->errors()->add($fieldName, $error);
            }
            return false;
        }
        
        if (!$file->isValid()) {
            $this->handleFileUploadError($validator, $file, $fieldName);
            return false;
        }

        // Validate file integrity and security
        $integrityErrors = $this->validateFileIntegrity($file, $fieldName);
        if ($integrityErrors) {
            foreach ($integrityErrors as $error) {
                $validator->errors()->add($fieldName, $error);
            }
            return false;
        }

        // Check file size
        if (!$this->validateFileSize($file->getSize(), $type)) {
            $maxSize = $type === 'image' ? '2MB' : '50MB';
            $validator->errors()->add($fieldName, "Размер файла не должен превышать {$maxSize}");
            return false;
        }

        // Check file format
        if ($type === 'image' && !$this->validateImageFormat($file)) {
            $validator->errors()->add($fieldName, 'Недопустимый тип изображения. Разрешены: JPEG, PNG, WebP');
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

        Log::error("Media process step {$operation} error", $logData);
    }
}