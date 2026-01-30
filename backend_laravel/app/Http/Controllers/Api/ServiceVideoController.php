<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ServiceVideo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Exception;

class ServiceVideoController extends Controller
{
    /**
     * Get service video by service name
     * 
     * @param string $serviceName
     * @return \Illuminate\Http\JsonResponse
     */
    public function show(string $serviceName)
    {
        Log::info('ServiceVideoController show method called', [
            'service_name' => $serviceName,
        ]);
        
        try {
            $serviceVideo = ServiceVideo::getActiveByService($serviceName);
            
            if (!$serviceVideo) {
                return response()->json([
                    'success' => true,
                    'data' => null,
                    'message' => 'No video configured for this service'
                ]);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $serviceVideo->id,
                    'service_name' => $serviceVideo->service_name,
                    'video_url' => $serviceVideo->video_url,
                    'video_original_name' => $serviceVideo->video_original_name,
                    'video_size' => $serviceVideo->video_size,
                    'formatted_video_size' => $serviceVideo->formatted_video_size,
                    'is_active' => $serviceVideo->is_active,
                    'created_at' => $serviceVideo->created_at,
                    'updated_at' => $serviceVideo->updated_at,
                ]
            ]);
        } catch (Exception $e) {
            Log::error('Error fetching service video: ' . $e->getMessage(), [
                'service_name' => $serviceName,
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Ошибка сервера при загрузке видео услуги'
            ], 500);
        }
    }

    /**
     * Upload video for a service
     * 
     * @param Request $request
     * @param string $serviceName
     * @return \Illuminate\Http\JsonResponse
     */
    public function upload(Request $request, string $serviceName)
    {
        try {
            // Add immediate logging to see if we reach the controller
            Log::info('ServiceVideoController upload method called', [
                'service_name' => $serviceName,
                'request_method' => $request->method(),
                'request_url' => $request->url(),
                'has_files' => $request->hasFile('video'),
                'all_files' => array_keys($request->allFiles()),
                'content_type' => $request->header('Content-Type'),
            ]);
            Log::info('Service video upload started', [
                'service_name' => $serviceName,
                'has_video_file' => $request->hasFile('video'),
                'content_length' => $request->header('Content-Length'),
                'content_type' => $request->header('Content-Type'),
            ]);

            // Log request details for debugging
            Log::info('Processing file upload', [
                'service_name' => $serviceName,
                'has_video_file' => $request->hasFile('video'),
                'all_files' => $request->allFiles(),
                'request_size' => $request->header('Content-Length'),
            ]);

            // Validate the uploaded file
            $validator = Validator::make($request->all(), [
                'video' => 'required|file|mimes:mp4,mov,avi,webm|max:51200', // 50MB limit
            ]);

            // Comprehensive file validation
            $validator->after(function ($validator) use ($request, $serviceName) {
                if ($request->hasFile('video')) {
                    $file = $request->file('video');
                    
                    Log::info('File details', [
                        'service_name' => $serviceName,
                        'file_name' => $file->getClientOriginalName(),
                        'file_size' => $file->getSize(),
                        'mime_type' => $file->getMimeType(),
                        'is_valid' => $file->isValid(),
                        'error' => $file->getError(),
                    ]);
                    
                    if (!$file->isValid()) {
                        $this->handleFileUploadError($validator, $file, 'video');
                        return;
                    }

                    // Check file size using model validation
                    if (!ServiceVideo::validateVideoSize($file->getSize())) {
                        $validator->errors()->add('video', 'Размер видео не должен превышать 50MB');
                        return;
                    }

                    // Check MIME type using model validation
                    if (!ServiceVideo::validateVideoFormat($file)) {
                        $validator->errors()->add('video', 'Недопустимый тип видео файла. Разрешены: MP4, MOV, AVI, WebM');
                        return;
                    }

                    Log::info('Video file validation passed', [
                        'service_name' => $serviceName,
                        'file_name' => $file->getClientOriginalName(),
                        'file_size' => $file->getSize(),
                        'mime_type' => $file->getMimeType(),
                    ]);
                } else {
                    Log::error('No video file in request', [
                        'service_name' => $serviceName,
                        'all_files' => array_keys($request->allFiles()),
                    ]);
                }
            });

            if ($validator->fails()) {
                Log::error('Service video validation failed', [
                    'service_name' => $serviceName,
                    'errors' => $validator->errors()->toArray()
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Ошибка валидации файла',
                    'errors' => $validator->errors()
                ], 422);
            }

            $file = $request->file('video');
            
            // Store the video file
            $videoPath = ServiceVideo::storeVideoFile($file);
            
            Log::info('Video file stored', [
                'service_name' => $serviceName,
                'path' => $videoPath,
                'original_name' => $file->getClientOriginalName(),
                'size' => $file->getSize()
            ]);

            // Get current service video to clean up old video
            $currentVideo = ServiceVideo::getActiveByService($serviceName);
            $oldVideoPath = $currentVideo ? $currentVideo->video_path : null;

            // Create or update service video
            $serviceVideo = ServiceVideo::updateOrCreate(
                ['service_name' => $serviceName],
                [
                    'video_path' => $videoPath,
                    'video_original_name' => $file->getClientOriginalName(),
                    'video_size' => $file->getSize(),
                    'is_active' => true,
                ]
            );

            // Clean up old video file if it exists and is different
            if ($oldVideoPath && $oldVideoPath !== $videoPath) {
                ServiceVideo::cleanupOldVideo($oldVideoPath);
                Log::info('Old service video file cleaned up', [
                    'service_name' => $serviceName,
                    'path' => $oldVideoPath
                ]);
            }

            Log::info('Service video uploaded successfully', [
                'service_name' => $serviceName,
                'service_video_id' => $serviceVideo->id,
                'video_path' => $videoPath
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Видео успешно загружено',
                'data' => [
                    'id' => $serviceVideo->id,
                    'service_name' => $serviceVideo->service_name,
                    'video_url' => $serviceVideo->video_url,
                    'video_original_name' => $serviceVideo->video_original_name,
                    'video_size' => $serviceVideo->video_size,
                    'formatted_video_size' => $serviceVideo->formatted_video_size,
                    'is_active' => $serviceVideo->is_active,
                    'created_at' => $serviceVideo->created_at,
                    'updated_at' => $serviceVideo->updated_at,
                ]
            ], 201);

        } catch (Exception $e) {
            Log::error('Service video upload error', [
                'service_name' => $serviceName ?? 'unknown',
                'file_info' => $request->hasFile('video') ? [
                    'name' => $request->file('video')->getClientOriginalName(),
                    'size' => $request->file('video')->getSize(),
                    'type' => $request->file('video')->getMimeType(),
                ] : null,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Произошла ошибка сервера при загрузке видео. Попробуйте позже'
            ], 500);
        }
    }

    /**
     * Delete service video
     * 
     * @param string $serviceName
     * @return \Illuminate\Http\JsonResponse
     */
    public function delete(string $serviceName)
    {
        try {
            $serviceVideo = ServiceVideo::getActiveByService($serviceName);
            
            if (!$serviceVideo || !$serviceVideo->video_path) {
                return response()->json([
                    'success' => false,
                    'message' => 'Видео не найдено'
                ], 404);
            }

            Log::info('Deleting service video', [
                'service_name' => $serviceName,
                'service_video_id' => $serviceVideo->id,
                'video_path' => $serviceVideo->video_path
            ]);

            // Clean up the video file
            ServiceVideo::cleanupOldVideo($serviceVideo->video_path);

            // Delete the record
            $serviceVideo->delete();

            Log::info('Service video deleted successfully', [
                'service_name' => $serviceName,
                'service_video_id' => $serviceVideo->id
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Видео успешно удалено',
                'data' => null
            ]);

        } catch (Exception $e) {
            Log::error('Service video deletion error', [
                'service_name' => $serviceName,
                'service_video_id' => isset($serviceVideo) ? $serviceVideo->id : null,
                'video_path' => isset($serviceVideo) ? $serviceVideo->video_path : null,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Произошла ошибка сервера при удалении видео. Попробуйте позже'
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
}