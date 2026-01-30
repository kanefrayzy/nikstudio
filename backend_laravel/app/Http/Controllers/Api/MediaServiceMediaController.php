<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MediaService;
use App\Models\MediaServiceMedia;
use App\Http\Controllers\Api\MediaPageController;
use App\Http\Controllers\Api\MediaPagePublicController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Exception;

class MediaServiceMediaController extends Controller
{
    /**
     * Get all media items for a specific service
     * 
     * @param int $serviceId
     * @return \Illuminate\Http\JsonResponse
     */
    public function index($serviceId)
    {
        try {
            $service = MediaService::find($serviceId);
            
            if (!$service) {
                return response()->json([
                    'success' => false,
                    'message' => 'Медиа услуга не найдена'
                ], 404);
            }

            $mediaItems = MediaServiceMedia::where('service_id', $serviceId)
                ->ordered()
                ->get()
                ->groupBy('group_id')
                ->map(function ($group) {
                    $main = $group->where('media_type', 'main')->first();
                    $secondary = $group->where('media_type', 'secondary')->first();
                    
                    return [
                        'group_id' => $group->first()->group_id,
                        'order' => $group->first()->order,
                        'main' => $main ? [
                            'id' => $main->id,
                            'file_type' => $main->file_type,
                            'file_path' => $main->file_path,
                            'poster_path' => $main->poster_path,
                            'alt_text' => $main->alt_text,
                        ] : null,
                        'secondary' => $secondary ? [
                            'id' => $secondary->id,
                            'file_type' => $secondary->file_type,
                            'file_path' => $secondary->file_path,
                            'poster_path' => $secondary->poster_path,
                            'alt_text' => $secondary->alt_text,
                        ] : null,
                    ];
                })
                ->sortBy('order')
                ->values();

            return response()->json([
                'success' => true,
                'data' => $mediaItems
            ]);

        } catch (Exception $e) {
            $this->logError('media_index', ['service_id' => $serviceId], $e);
            
            return response()->json([
                'success' => false,
                'message' => 'Ошибка сервера при загрузке медиа файлов'
            ], 500);
        }
    }

    /**
     * Store a new media group (main + secondary)
     * 
     * @param Request $request
     * @param int $serviceId
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request, $serviceId)
    {
        try {
            $service = MediaService::find($serviceId);
            
            if (!$service) {
                return response()->json([
                    'success' => false,
                    'message' => 'Медиа услуга не найдена'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'main_file' => 'required|file',
                'main_alt_text' => 'nullable|string|max:255',
                'secondary_file' => 'required|file',
                'secondary_alt_text' => 'nullable|string|max:255',
                'main_poster' => 'nullable|file',
                'secondary_poster' => 'nullable|file',
            ], [
                'main_file.required' => 'Основной файл обязателен для загрузки',
                'main_file.file' => 'Основной файл должен быть корректным файлом',
                'secondary_file.required' => 'Дополнительный файл обязателен для загрузки',
                'secondary_file.file' => 'Дополнительный файл должен быть корректным файлом',
                'main_alt_text.max' => 'Альтернативный текст основного файла не должен превышать 255 символов',
                'secondary_alt_text.max' => 'Альтернативный текст дополнительного файла не должен превышать 255 символов',
                'main_poster.file' => 'Постер основного файла должен быть корректным файлом',
                'secondary_poster.file' => 'Постер дополнительного файла должен быть корректным файлом',
            ]);

            // Custom file validation
            $validator->after(function ($validator) use ($request) {
                $this->validateMediaFiles($validator, $request);
            });

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ошибка валидации данных',
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            try {
                // Get next group_id and order
                $maxGroupId = MediaServiceMedia::where('service_id', $serviceId)->max('group_id') ?? 0;
                $maxOrder = MediaServiceMedia::where('service_id', $serviceId)->max('order') ?? 0;
                $groupId = $maxGroupId + 1;
                $order = $maxOrder + 1;

                // Store main file
                $mainMediaData = $this->storeMediaFile(
                    $request->file('main_file'),
                    $request->file('main_poster'),
                    $serviceId,
                    $groupId,
                    'main',
                    $order,
                    $request->input('main_alt_text', '')
                );

                // Store secondary file
                $secondaryMediaData = $this->storeMediaFile(
                    $request->file('secondary_file'),
                    $request->file('secondary_poster'),
                    $serviceId,
                    $groupId,
                    'secondary',
                    $order,
                    $request->input('secondary_alt_text', '')
                );

                DB::commit();

                Log::info('Media group created successfully', [
                    'service_id' => $serviceId,
                    'group_id' => $groupId,
                    'main_media_id' => $mainMediaData['id'],
                    'secondary_media_id' => $secondaryMediaData['id']
                ]);

                // Clear public cache
                MediaPagePublicController::clearCache();

                return response()->json([
                    'success' => true,
                    'message' => 'Медиа группа успешно создана',
                    'data' => [
                        'group_id' => $groupId,
                        'order' => $order,
                        'main' => $mainMediaData,
                        'secondary' => $secondaryMediaData,
                    ]
                ], 201);

            } catch (Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (Exception $e) {
            $this->logError('media_store', [
                'service_id' => $serviceId,
                'main_file' => $request->hasFile('main_file') ? $request->file('main_file')->getClientOriginalName() : null,
                'secondary_file' => $request->hasFile('secondary_file') ? $request->file('secondary_file')->getClientOriginalName() : null,
            ], $e);
            
            return response()->json([
                'success' => false,
                'message' => 'Произошла ошибка сервера при создании медиа группы'
            ], 500);
        }
    }    /**

     * Update an existing media group
     * 
     * @param Request $request
     * @param int $serviceId
     * @param int $groupId
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, $serviceId, $groupId)
    {
        try {
            $service = MediaService::find($serviceId);
            
            if (!$service) {
                return response()->json([
                    'success' => false,
                    'message' => 'Медиа услуга не найдена'
                ], 404);
            }

            $mediaItems = MediaServiceMedia::where('service_id', $serviceId)
                ->where('group_id', $groupId)
                ->get();

            if ($mediaItems->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Медиа группа не найдена'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'main_file' => 'nullable|file',
                'main_alt_text' => 'nullable|string|max:255',
                'secondary_file' => 'nullable|file',
                'secondary_alt_text' => 'nullable|string|max:255',
                'main_poster' => 'nullable|file',
                'secondary_poster' => 'nullable|file',
            ], [
                'main_file.file' => 'Основной файл должен быть корректным файлом',
                'secondary_file.file' => 'Дополнительный файл должен быть корректным файлом',
                'main_alt_text.max' => 'Альтернативный текст основного файла не должен превышать 255 символов',
                'secondary_alt_text.max' => 'Альтернативный текст дополнительного файла не должен превышать 255 символов',
                'main_poster.file' => 'Постер основного файла должен быть корректным файлом',
                'secondary_poster.file' => 'Постер дополнительного файла должен быть корректным файлом',
            ]);

            // Custom file validation
            $validator->after(function ($validator) use ($request) {
                $this->validateMediaFiles($validator, $request, true);
            });

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ошибка валидации данных',
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            try {
                $mainMedia = $mediaItems->where('media_type', 'main')->first();
                $secondaryMedia = $mediaItems->where('media_type', 'secondary')->first();
                $order = $mainMedia ? $mainMedia->order : ($secondaryMedia ? $secondaryMedia->order : 1);

                $responseData = [
                    'group_id' => $groupId,
                    'order' => $order,
                    'main' => null,
                    'secondary' => null,
                ];

                // Update main media if file provided or alt text changed
                if ($request->hasFile('main_file') || $request->has('main_alt_text')) {
                    if ($mainMedia && $request->hasFile('main_file')) {
                        // Delete old files
                        $this->deleteMediaFiles($mainMedia);
                    }

                    if ($request->hasFile('main_file')) {
                        // Store new file
                        $mainMediaData = $this->storeMediaFile(
                            $request->file('main_file'),
                            $request->file('main_poster'),
                            $serviceId,
                            $groupId,
                            'main',
                            $order,
                            $request->input('main_alt_text', '')
                        );

                        if ($mainMedia) {
                            $mainMedia->delete();
                        }

                        $responseData['main'] = $mainMediaData;
                    } else if ($mainMedia && $request->has('main_alt_text')) {
                        // Update only alt text
                        $mainMedia->update([
                            'alt_text' => $request->input('main_alt_text', '')
                        ]);

                        $responseData['main'] = [
                            'id' => $mainMedia->id,
                            'file_type' => $mainMedia->file_type,
                            'file_path' => $mainMedia->file_path,
                            'poster_path' => $mainMedia->poster_path,
                            'alt_text' => $mainMedia->alt_text,
                        ];
                    }
                } else if ($mainMedia) {
                    $responseData['main'] = [
                        'id' => $mainMedia->id,
                        'file_type' => $mainMedia->file_type,
                        'file_path' => $mainMedia->file_path,
                        'poster_path' => $mainMedia->poster_path,
                        'alt_text' => $mainMedia->alt_text,
                    ];
                }

                // Update secondary media if file provided or alt text changed
                if ($request->hasFile('secondary_file') || $request->has('secondary_alt_text')) {
                    if ($secondaryMedia && $request->hasFile('secondary_file')) {
                        // Delete old files
                        $this->deleteMediaFiles($secondaryMedia);
                    }

                    if ($request->hasFile('secondary_file')) {
                        // Store new file
                        $secondaryMediaData = $this->storeMediaFile(
                            $request->file('secondary_file'),
                            $request->file('secondary_poster'),
                            $serviceId,
                            $groupId,
                            'secondary',
                            $order,
                            $request->input('secondary_alt_text', '')
                        );

                        if ($secondaryMedia) {
                            $secondaryMedia->delete();
                        }

                        $responseData['secondary'] = $secondaryMediaData;
                    } else if ($secondaryMedia && $request->has('secondary_alt_text')) {
                        // Update only alt text
                        $secondaryMedia->update([
                            'alt_text' => $request->input('secondary_alt_text', '')
                        ]);

                        $responseData['secondary'] = [
                            'id' => $secondaryMedia->id,
                            'file_type' => $secondaryMedia->file_type,
                            'file_path' => $secondaryMedia->file_path,
                            'poster_path' => $secondaryMedia->poster_path,
                            'alt_text' => $secondaryMedia->alt_text,
                        ];
                    }
                } else if ($secondaryMedia) {
                    $responseData['secondary'] = [
                        'id' => $secondaryMedia->id,
                        'file_type' => $secondaryMedia->file_type,
                        'file_path' => $secondaryMedia->file_path,
                        'poster_path' => $secondaryMedia->poster_path,
                        'alt_text' => $secondaryMedia->alt_text,
                    ];
                }

                DB::commit();

                Log::info('Media group updated successfully', [
                    'service_id' => $serviceId,
                    'group_id' => $groupId
                ]);

                // Clear public cache
                MediaPagePublicController::clearCache();

                return response()->json([
                    'success' => true,
                    'message' => 'Медиа группа успешно обновлена',
                    'data' => $responseData
                ]);

            } catch (Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (Exception $e) {
            $this->logError('media_update', [
                'service_id' => $serviceId,
                'group_id' => $groupId,
            ], $e);
            
            return response()->json([
                'success' => false,
                'message' => 'Произошла ошибка сервера при обновлении медиа группы'
            ], 500);
        }
    }

    /**
     * Delete a media group
     * 
     * @param int $serviceId
     * @param int $groupId
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy($serviceId, $groupId)
    {
        try {
            $service = MediaService::find($serviceId);
            
            if (!$service) {
                return response()->json([
                    'success' => false,
                    'message' => 'Медиа услуга не найдена'
                ], 404);
            }

            $mediaItems = MediaServiceMedia::where('service_id', $serviceId)
                ->where('group_id', $groupId)
                ->get();

            if ($mediaItems->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Медиа группа не найдена'
                ], 404);
            }

            DB::beginTransaction();

            try {
                // Delete all files associated with this group
                foreach ($mediaItems as $mediaItem) {
                    $this->deleteMediaFiles($mediaItem);
                    $mediaItem->delete();
                }

                DB::commit();

                Log::info('Media group deleted successfully', [
                    'service_id' => $serviceId,
                    'group_id' => $groupId,
                    'deleted_items_count' => $mediaItems->count()
                ]);

                // Clear public cache
                MediaPagePublicController::clearCache();

                return response()->json([
                    'success' => true,
                    'message' => 'Медиа группа успешно удалена'
                ]);

            } catch (Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (Exception $e) {
            $this->logError('media_destroy', [
                'service_id' => $serviceId,
                'group_id' => $groupId,
            ], $e);
            
            return response()->json([
                'success' => false,
                'message' => 'Произошла ошибка сервера при удалении медиа группы'
            ], 500);
        }
    }    /**

     * Reorder media groups
     * 
     * @param Request $request
     * @param int $serviceId
     * @return \Illuminate\Http\JsonResponse
     */
    public function reorder(Request $request, $serviceId)
    {
        try {
            $service = MediaService::find($serviceId);
            
            if (!$service) {
                return response()->json([
                    'success' => false,
                    'message' => 'Медиа услуга не найдена'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'group_orders' => 'required|array',
                'group_orders.*.group_id' => 'required|integer',
                'group_orders.*.order' => 'required|integer|min:1',
            ], [
                'group_orders.required' => 'Порядок групп обязателен для указания',
                'group_orders.array' => 'Порядок групп должен быть массивом',
                'group_orders.*.group_id.required' => 'ID группы обязателен',
                'group_orders.*.group_id.integer' => 'ID группы должен быть числом',
                'group_orders.*.order.required' => 'Порядок обязателен для указания',
                'group_orders.*.order.integer' => 'Порядок должен быть числом',
                'group_orders.*.order.min' => 'Порядок должен быть больше 0',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ошибка валидации данных',
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            try {
                foreach ($request->input('group_orders') as $groupOrder) {
                    MediaServiceMedia::where('service_id', $serviceId)
                        ->where('group_id', $groupOrder['group_id'])
                        ->update(['order' => $groupOrder['order']]);
                }

                DB::commit();

                Log::info('Media groups reordered successfully', [
                    'service_id' => $serviceId,
                    'group_orders' => $request->input('group_orders')
                ]);

                // Clear public cache
                MediaPagePublicController::clearCache();

                return response()->json([
                    'success' => true,
                    'message' => 'Порядок медиа групп успешно обновлен'
                ]);

            } catch (Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (Exception $e) {
            $this->logError('media_reorder', [
                'service_id' => $serviceId,
                'group_orders' => $request->input('group_orders', []),
            ], $e);
            
            return response()->json([
                'success' => false,
                'message' => 'Произошла ошибка сервера при изменении порядка медиа групп'
            ], 500);
        }
    }

    /**
     * Validate media files in the request
     * 
     * @param \Illuminate\Validation\Validator $validator
     * @param Request $request
     * @param bool $isUpdate Whether this is an update operation
     * @return void
     */
    private function validateMediaFiles($validator, $request, $isUpdate = false)
    {
        // Validate main file
        if ($request->hasFile('main_file')) {
            $mainFile = $request->file('main_file');
            $fileType = $this->getFileType($mainFile);
            
            if (!MediaPageController::validateUploadedFile($mainFile, $fileType, 'main_file', $validator)) {
                return;
            }

            // Check if video requires poster
            if ($fileType === 'video' && !$request->hasFile('main_poster')) {
                $validator->errors()->add('main_poster', 'Для видео файла обязательно загрузить постер');
            }
        }

        // Validate main poster if provided
        if ($request->hasFile('main_poster')) {
            $posterFile = $request->file('main_poster');
            
            if (!MediaPageController::validateUploadedFile($posterFile, 'image', 'main_poster', $validator)) {
                return;
            }
        }

        // Validate secondary file
        if ($request->hasFile('secondary_file')) {
            $secondaryFile = $request->file('secondary_file');
            $fileType = $this->getFileType($secondaryFile);
            
            if (!MediaPageController::validateUploadedFile($secondaryFile, $fileType, 'secondary_file', $validator)) {
                return;
            }

            // Check if video requires poster
            if ($fileType === 'video' && !$request->hasFile('secondary_poster')) {
                $validator->errors()->add('secondary_poster', 'Для видео файла обязательно загрузить постер');
            }
        }

        // Validate secondary poster if provided
        if ($request->hasFile('secondary_poster')) {
            $posterFile = $request->file('secondary_poster');
            
            if (!MediaPageController::validateUploadedFile($posterFile, 'image', 'secondary_poster', $validator)) {
                return;
            }
        }
    }

    /**
     * Store a media file and create database record
     * 
     * @param \Illuminate\Http\UploadedFile $file
     * @param \Illuminate\Http\UploadedFile|null $posterFile
     * @param int $serviceId
     * @param int $groupId
     * @param string $mediaType 'main' or 'secondary'
     * @param int $order
     * @param string $altText
     * @return array
     */
    private function storeMediaFile($file, $posterFile, $serviceId, $groupId, $mediaType, $order, $altText)
    {
        $fileType = $this->getFileType($file);
        
        // Generate unique filename
        $extension = $file->getClientOriginalExtension();
        $filename = 'media_service_' . $serviceId . '_' . $groupId . '_' . $mediaType . '_' . time() . '.' . $extension;
        
        // Store main file
        $filePath = $file->storeAs('media/services', $filename, 'public');
        
        // Store poster if provided
        $posterPath = null;
        if ($posterFile) {
            $posterExtension = $posterFile->getClientOriginalExtension();
            $posterFilename = 'media_service_' . $serviceId . '_' . $groupId . '_' . $mediaType . '_poster_' . time() . '.' . $posterExtension;
            $posterPath = $posterFile->storeAs('media/services', $posterFilename, 'public');
        }

        // Create database record
        $mediaRecord = MediaServiceMedia::create([
            'service_id' => $serviceId,
            'group_id' => $groupId,
            'media_type' => $mediaType,
            'file_type' => $fileType,
            'file_path' => $filePath,
            'poster_path' => $posterPath,
            'alt_text' => $altText,
            'order' => $order,
        ]);

        return [
            'id' => $mediaRecord->id,
            'file_type' => $mediaRecord->file_type,
            'file_path' => $mediaRecord->file_path,
            'poster_path' => $mediaRecord->poster_path,
            'alt_text' => $mediaRecord->alt_text,
        ];
    }

    /**
     * Delete media files from storage
     * 
     * @param MediaServiceMedia $mediaItem
     * @return void
     */
    private function deleteMediaFiles($mediaItem)
    {
        try {
            // Delete main file
            if ($mediaItem->file_path && Storage::disk('public')->exists($mediaItem->file_path)) {
                Storage::disk('public')->delete($mediaItem->file_path);
                Log::info('Deleted media file', ['file_path' => $mediaItem->file_path]);
            }

            // Delete poster file if exists
            if ($mediaItem->poster_path && Storage::disk('public')->exists($mediaItem->poster_path)) {
                Storage::disk('public')->delete($mediaItem->poster_path);
                Log::info('Deleted poster file', ['poster_path' => $mediaItem->poster_path]);
            }

        } catch (Exception $e) {
            Log::error('Error deleting media files', [
                'media_id' => $mediaItem->id,
                'file_path' => $mediaItem->file_path,
                'poster_path' => $mediaItem->poster_path,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Determine file type based on MIME type
     * 
     * @param \Illuminate\Http\UploadedFile $file
     * @return string 'image' or 'video'
     */
    private function getFileType($file)
    {
        $mimeType = $file->getMimeType();
        
        if (strpos($mimeType, 'image/') === 0) {
            return 'image';
        } elseif (strpos($mimeType, 'video/') === 0) {
            return 'video';
        }
        
        // Fallback based on extension
        $extension = strtolower($file->getClientOriginalExtension());
        $videoExtensions = ['mp4', 'webm'];
        
        return in_array($extension, $videoExtensions) ? 'video' : 'image';
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

        Log::error("Media service media {$operation} error", $logData);
    }
}