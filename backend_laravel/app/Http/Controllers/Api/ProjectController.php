<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\ProjectDetail;
use App\Models\ProjectDetailHeroMedia;
use App\Models\ProjectDetailBlock;
use App\Models\ProjectDetailBlockMedia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Exception; // Добавлено для Exception

class ProjectController extends Controller
{
    // ... (существующие методы index, show, logUploadSettings, etc.)
    /**
     * Получить все проекты
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        try {
            Log::info('Запрос проектов с параметрами:', $request->all());

            $query = Project::with('categories');
            
            // Фильтрация по категории
            if ($request->has('category_id') && $request->category_id) {
                Log::info('Фильтрация по категории:', ['category_id' => $request->category_id]);
                $query->whereHas('categories', function($q) use ($request) {
                    $q->where('project_categories.id', $request->category_id);
                });
            }
            
            // Фильтрация по году
            if ($request->has('year') && $request->year) {
                $query->where('year', $request->year);
            }
            
            // Поиск по названию
            if ($request->has('search') && $request->search) {
                $query->where(function($q) use ($request) {
                    $q->where('main_title', 'like', '%' . $request->search . '%')
                    ->orWhere('projects_page_title', 'like', '%' . $request->search . '%');
                });
            }
            
            // Сортировка
            $sortField = $request->get('sort', 'year');
            $sortDirection = $request->get('direction', 'desc');
            
            $allowedSortFields = ['year', 'main_title', 'projects_page_title', 'created_at'];
            
            if (in_array($sortField, $allowedSortFields)) {
                $query->orderBy($sortField, $sortDirection);
            }
            
            // Получение всех проектов без пагинации
            $projects = $query->get();
            Log::info('Найдено проектов:', ['count' => $projects->count()]);
            
            return response()->json([
                'success' => true,
                'data' => $projects
            ]);
        } catch (\Exception $e) {
            Log::error('Ошибка при загрузке проектов: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['success' => false, 'message' => 'Ошибка сервера при загрузке проектов'], 500);
        }
    }
    
    /**
     * Получить проект по slug
     * 
     * @param string $slug
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($slug)
    {
        $project = Project::with([
        'categories', 
        'detail.blocks.mediaItems', // Уже есть в исходном коде
        'detail.heroMediaItems'
        ])
            ->where('slug', $slug)
            ->first();
        
        if (!$project) {
            return response()->json([
                'success' => false,
                'message' => 'Проект не найден'
            ], 404);
        }
        
        return response()->json([
            'success' => true,
            'data' => $project
        ]);
    }
    
    /**
     * Логирование настроек PHP для загрузки файлов
     */
    private function logUploadSettings()
    {
        $uploadMaxFilesize = ini_get('upload_max_filesize');
        $postMaxSize = ini_get('post_max_size');
        
        Log::info('PHP Upload Settings', [
            'upload_max_filesize' => $uploadMaxFilesize,
            'upload_max_filesize_bytes' => $this->parseSize($uploadMaxFilesize),
            'post_max_size' => $postMaxSize,
            'post_max_size_bytes' => $this->parseSize($postMaxSize),
            'max_file_uploads' => ini_get('max_file_uploads'),
            'memory_limit' => ini_get('memory_limit'),
            'max_execution_time' => ini_get('max_execution_time'),
            'upload_tmp_dir' => ini_get('upload_tmp_dir'),
        ]);
    }

    /**
     * Конвертирует размер из строки в байты
     */
    private function parseSize($size)
    {
        $unit = preg_replace('/[^bkmgtpezy]/i', '', $size);
        $size = preg_replace('/[^0-9\.]/', '', $size);
        
        if ($unit) {
            return round($size * pow(1024, stripos('bkmgtpezy', $unit[0])));
        }
        
        return round($size);
    }
    
    /**
     * Детальное логирование информации о файле
     */
    private function logFileDetails($file, $fieldName)
    {
        if ($file) {
            Log::info($fieldName . ' details', [
                'original_name' => $file->getClientOriginalName(),
                'size' => $file->getSize(),
                'mime_type' => $file->getMimeType(),
                'extension' => $file->getClientOriginalExtension(),
                'is_valid' => $file->isValid(),
                'error' => $file->getError(),
                'error_message' => $file->getErrorMessage(),
                'path' => $file->getPathname(),
                'real_path' => $file->getRealPath(),
            ]);
        }
    }
    
    /**
     * Создать новый проект
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        // Логирование настроек PHP
        $this->logUploadSettings();
        
        Log::info('Store method called', $request->all());
        
        // Детальное логирование файлов
        if ($request->hasFile('main_image')) {
            $this->logFileDetails($request->file('main_image'), 'Main image');
        }
        
        if ($request->hasFile('projects_page_image')) {
            $this->logFileDetails($request->file('projects_page_image'), 'Projects page image');
        }
        
        if ($request->hasFile('logo')) {
            $this->logFileDetails($request->file('logo'), 'Logo');
        }
        
        // Базовая валидация
        $validator = Validator::make($request->all(), [
            'category_ids' => 'required|array',
            'category_ids.*' => 'exists:project_categories,id',
            'main_title' => 'required|string|max:255',
            'projects_page_title' => 'nullable|string|max:255',
            'year' => 'required|integer|min:1900|max:' . (date('Y') + 10),
            'main_image' => 'nullable|file|mimes:jpeg,png,jpg,gif,webp,svg|max:2048',
            'projects_page_image' => 'nullable|file|mimes:jpeg,png,jpg,gif,webp,svg|max:2048',
            'logo' => 'nullable|file|mimes:jpeg,png,jpg,gif,webp,svg|max:2048',
        ]);
        
        // Кастомная валидация файлов
        $validator->after(function ($validator) use ($request) {
            $this->validateFileUpload($validator, $request, 'main_image');
            $this->validateFileUpload($validator, $request, 'projects_page_image');
            $this->validateFileUpload($validator, $request, 'logo');
        });
        
        if ($validator->fails()) {
            $errors = $validator->errors()->toArray();
            Log::error('Validation failed', [
                'errors' => $errors,
                'request_data' => $request->except(['main_image', 'projects_page_image', 'logo']),
                'files_info' => [
                    'main_image_present' => $request->hasFile('main_image'),
                    'projects_page_image_present' => $request->hasFile('projects_page_image'),
                    'logo_present' => $request->hasFile('logo'),
                ],
                'content_length' => $request->header('Content-Length'),
                'content_type' => $request->header('Content-Type'),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Ошибка валидации',
                'errors' => $errors
            ], 422);
        }
        
        $data = $request->except(['main_image', 'projects_page_image', 'logo']);
        
        // Загрузка изображений с добавлением префикса /storage/
        try {
            if ($request->hasFile('main_image')) {
                Log::info('Processing main_image');
                $path = $request->file('main_image')->store('projects/main', 'public');
                $data['main_image'] = '/storage/' . $path;
                Log::info('Main image uploaded: ' . $path);
            }
            
            if ($request->hasFile('projects_page_image')) {
                Log::info('Processing projects_page_image');
                $path = $request->file('projects_page_image')->store('projects/page', 'public');
                $data['projects_page_image'] = '/storage/' . $path;
                Log::info('Projects page image uploaded: ' . $path);
            }
            
            if ($request->hasFile('logo')) {
                Log::info('Processing logo');
                $path = $request->file('logo')->store('projects/logos', 'public');
                $data['logo'] = '/storage/' . $path;
                Log::info('Logo uploaded: ' . $path);
            }
        } catch (\Exception $e) {
            Log::error('File upload error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Ошибка загрузки файла: ' . $e->getMessage(),
            ], 500);
        }
        
        try {
            $project = Project::create($data);
            $project->categories()->sync($request->input('category_ids'));
            
            Log::info('Project created successfully', $project->toArray());
            
            return response()->json([
                'success' => true,
                'message' => 'Проект успешно создан',
                'data' => $project
            ], 201);
        } catch (\Exception $e) {
            Log::error('Project creation error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Ошибка создания проекта: ' . $e->getMessage(),
            ], 500);
        }
    }
    
    /**
     * Валидация загрузки файла
     */
    private function validateFileUpload($validator, $request, $fieldName)
    {
        if ($request->hasFile($fieldName)) {
            $file = $request->file($fieldName);
            
            if (!$file->isValid()) {
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
                return;
            }
            
            $mimeType = $file->getMimeType();
            $extension = strtolower($file->getClientOriginalExtension());
            
            // Определяем тип файла
            $imageExtensions = ['jpeg', 'jpg', 'png', 'gif', 'webp', 'svg'];
            $videoExtensions = ['mp4', 'mov', 'avi', 'wmv', 'flv', 'webm'];
            
            $imageMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
            $videoMimeTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv', 'video/x-flv', 'video/webm'];
            
            $isImage = in_array($extension, $imageExtensions) || in_array($mimeType, $imageMimeTypes);
            $isVideo = in_array($extension, $videoExtensions) || in_array($mimeType, $videoMimeTypes);
            
            if (!$isImage && !$isVideo) {
                $validator->errors()->add($fieldName, 'Недопустимый тип файла. Разрешены изображения: ' . implode(', ', $imageExtensions) . ' и видео: ' . implode(', ', $videoExtensions));
                return;
            }
            
            // Проверка размера в зависимости от типа файла
            $fileSize = $file->getSize();
            
            if ($isImage && $fileSize > 2097152) { // 2MB для изображений
                $validator->errors()->add($fieldName, 'Размер изображения не должен превышать 2MB');
            } elseif ($isVideo && $fileSize > 52428800) { // 50MB для видео
                $validator->errors()->add($fieldName, 'Размер видео не должен превышать 50MB');
            }
            
            Log::info($fieldName . ' file validation', [
                'file_type' => $isImage ? 'image' : 'video',
                'size' => $fileSize,
                'extension' => $extension,
                'mime_type' => $mimeType,
            ]);
        }
    }

    /**
     * Обновить проект
     * 
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, $id)
    {
        $project = Project::find($id);
        
        if (!$project) {
            return response()->json([
                'success' => false,
                'message' => 'Проект не найден'
            ], 404);
        }
        
        Log::info('Update method called for project ID: ' . $id, $request->all());
        
        // Детальное логирование файлов при обновлении
        if ($request->hasFile('main_image')) {
            $this->logFileDetails($request->file('main_image'), 'Main image (update)');
        }
        
        if ($request->hasFile('projects_page_image')) {
            $this->logFileDetails($request->file('projects_page_image'), 'Projects page image (update)');
        }
        
        if ($request->hasFile('logo')) {
            $this->logFileDetails($request->file('logo'), 'Logo (update)');
        }
        
        $validator = Validator::make($request->all(), [
            'category_ids' => 'sometimes|required|array',
            'category_ids.*' => 'exists:project_categories,id',
            'main_title' => 'sometimes|required|string|max:255',
            'projects_page_title' => 'nullable|string|max:255',
            'year' => 'sometimes|required|integer|min:1900|max:' . (date('Y') + 10),
            'main_image' => 'nullable|file|mimes:jpeg,png,jpg,gif,webp,svg|max:2048',
            'projects_page_image' => 'nullable|file|mimes:jpeg,png,jpg,gif,webp,svg|max:2048',
            'logo' => 'nullable|file|mimes:jpeg,png,jpg,gif,webp,svg|max:2048',
        ]);
        
        // Кастомная валидация файлов
        $validator->after(function ($validator) use ($request) {
            $this->validateFileUpload($validator, $request, 'main_image');
            $this->validateFileUpload($validator, $request, 'projects_page_image');
            $this->validateFileUpload($validator, $request, 'logo');
        });
        
        if ($validator->fails()) {
            $errors = $validator->errors()->toArray();
            Log::error('Update validation failed', [
                'errors' => $errors,
                'project_id' => $id,
                'request_data' => $request->except(['main_image', 'projects_page_image', 'logo']),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Ошибка валидации',
                'errors' => $errors
            ], 422);
        }
        
        $data = $request->except(['main_image', 'projects_page_image', 'logo']);
        
        // Обновление изображений с добавлением префикса /storage/
        try {
            if ($request->hasFile('main_image')) {
                // Удаляем старое изображение
                if ($project->main_image && Storage::disk('public')->exists(str_replace('/storage/', '', $project->main_image))) {
                    Storage::disk('public')->delete(str_replace('/storage/', '', $project->main_image));
                    Log::info('Old main image deleted: ' . $project->main_image);
                }
                $path = $request->file('main_image')->store('projects/main', 'public');
                $data['main_image'] = '/storage/' . $path;
                Log::info('New main image uploaded: ' . $path);
            }
            
            if ($request->hasFile('projects_page_image')) {
                // Удаляем старое изображение
                if ($project->projects_page_image && Storage::disk('public')->exists(str_replace('/storage/', '', $project->projects_page_image))) {
                    Storage::disk('public')->delete(str_replace('/storage/', '', $project->projects_page_image));
                    Log::info('Old projects page image deleted: ' . $project->projects_page_image);
                }
                $path = $request->file('projects_page_image')->store('projects/page', 'public');
                $data['projects_page_image'] = '/storage/' . $path;
                Log::info('New projects page image uploaded: ' . $path);
            }
            
            if ($request->hasFile('logo')) {
                // Удаляем старое изображение
                if ($project->logo && Storage::disk('public')->exists(str_replace('/storage/', '', $project->logo))) {
                    Storage::disk('public')->delete(str_replace('/storage/', '', $project->logo));
                    Log::info('Old logo deleted: ' . $project->logo);
                }
                $path = $request->file('logo')->store('projects/logos', 'public');
                $data['logo'] = '/storage/' . $path;
                Log::info('New logo uploaded: ' . $path);
            }
        } catch (\Exception $e) {
            Log::error('File upload error during update: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'project_id' => $id
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Ошибка загрузки файла: ' . $e->getMessage(),
            ], 500);
        }
        
        try {
            $project->update($data);
            if ($request->has('category_ids')) {
                $project->categories()->sync($request->input('category_ids'));
            }
            
            Log::info('Project updated successfully', [
                'project_id' => $id,
                'updated_data' => $data
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Проект успешно обновлен',
                'data' => $project
            ]);
        } catch (\Exception $e) {
            Log::error('Project update error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'project_id' => $id
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Ошибка обновления проекта: ' . $e->getMessage(),
            ], 500);
        }
    }
    
    /**
     * Удалить проект
     * 
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy($id)
    {
        $project = Project::find($id);
        
        if (!$project) {
            return response()->json([
                'success' => false,
                'message' => 'Проект не найден'
            ], 404);
        }
        
        Log::info('Deleting project', ['project_id' => $id, 'project_data' => $project->toArray()]);
        
        try {
            // Удаление изображений (убираем префикс /storage/ для правильного удаления)
            if ($project->main_image && Storage::disk('public')->exists(str_replace('/storage/', '', $project->main_image))) {
                Storage::disk('public')->delete(str_replace('/storage/', '', $project->main_image));
                Log::info('Main image deleted: ' . $project->main_image);
            }
            
            if ($project->projects_page_image && Storage::disk('public')->exists(str_replace('/storage/', '', $project->projects_page_image))) {
                Storage::disk('public')->delete(str_replace('/storage/', '', $project->projects_page_image));
                Log::info('Projects page image deleted: ' . $project->projects_page_image);
            }
            
            if ($project->logo && Storage::disk('public')->exists(str_replace('/storage/', '', $project->logo))) {
                Storage::disk('public')->delete(str_replace('/storage/', '', $project->logo));
                Log::info('Logo deleted: ' . $project->logo);
            }
            
            $project->delete();
            
            Log::info('Project deleted successfully', ['project_id' => $id]);
            
            return response()->json([
                'success' => true,
                'message' => 'Проект успешно удален'
            ]);
        } catch (\Exception $e) {
            Log::error('Project deletion error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'project_id' => $id
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Ошибка удаления проекта: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Создать детали проекта
     * 
     * @param Request $request
     * @param string $slug
     * @return \Illuminate\Http\JsonResponse
     */
    public function createDetail(Request $request, $slug)
    {
        $project = Project::where('slug', $slug)->first();
        
        if (!$project) {
            return response()->json([
                'success' => false,
                'message' => 'Проект не найден'
            ], 404);
        }
        
        // Проверяем, есть ли уже детали
        if ($project->detail) {
            return response()->json([
                'success' => false,
                'message' => 'Детали проекта уже существуют'
            ], 400);
        }
        
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'subtitle' => 'nullable|string|max:255',
            'client' => 'required|string|max:255',
            'year' => 'required|integer|min:1900|max:' . (date('Y') + 10),
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Ошибка валидации',
                'errors' => $validator->errors()
            ], 422);
        }
        
        try {
            $detail = $project->detail()->create($request->all());
            
            return response()->json([
                'success' => true,
                'message' => 'Детали проекта успешно созданы',
                'data' => $detail
            ], 201);
        } catch (\Exception $e) {
            Log::error('Project detail creation error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Ошибка создания деталей проекта'
            ], 500);
        }
    }

    /**
     * Обновить детали проекта (изменить для работы со slug)
     * 
     * @param Request $request
     * @param string $slug
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateDetail(Request $request, $slug)
    {
        Log::info("Update detail request for slug: {$slug}");
        try {
            $project = Project::where('slug', $slug)->firstOrFail();
            $projectDetail = $project->detail;

            if (!$projectDetail) {
                return response()->json(['success' => false, 'message' => 'Детали проекта не найдены, создайте их сначала'], 404);
            }

            // Определяем, это обновление медиа или текстовых данных
            // Фронтенд отправляет `action` в FormData для медиа
            // или обычный JSON для текста.
            if ($request->has('action') && $request->input('action') === 'update_hero_media') {
                Log::info("Action 'update_hero_media' detected.");
                return $this->updateHeroMedia($request, $projectDetail);
            }

            // Если это не обновление медиа, значит это обновление текстовых полей
            Log::info("Standard detail update detected.");
            $validator = Validator::make($request->all(), [
                'title' => 'sometimes|required|string|max:255',
                'subtitle' => 'nullable|string|max:255',
                'client' => 'sometimes|required|string|max:255',
                'year' => 'sometimes|required|integer|min:1900|max:' . (date('Y') + 10),
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ошибка валидации',
                    'errors' => $validator->errors()
                ], 422);
            }

            $projectDetail->update($validator->validated());

            return response()->json([
                'success' => true,
                'message' => 'Детали проекта успешно обновлены',
                'data' => $projectDetail->fresh() // Возвращаем обновленные данные
            ]);

        } catch (ModelNotFoundException $e) {
            return response()->json(['success' => false, 'message' => 'Проект не найден'], 404);
        } catch (Exception $e) {
            Log::error('Ошибка при обновлении деталей проекта: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json([
                'success' => false,
                'message' => 'Ошибка сервера: ' . $e->getMessage()
            ], 500);
        }
    }

    private function updateHeroMedia(Request $request, $projectDetail)
    {
        try {
            $groupId = $request->input('group_id');
            $groupType = $request->input('group_type');
            $heroMediaItems = $request->input('hero_media_items', []);
            
            \Log::info('🔍 [DEBUG] updateHeroMedia started', [
                'group_id' => $groupId,
                'group_type' => $groupType,
                'items_count' => count($heroMediaItems),
                'all_files' => array_keys($request->allFiles()),
                'request_data' => $request->except(['hero_media_items'])
            ]);
            
            // Валидация файлов перед обработкой
            foreach ($heroMediaItems as $index => $item) {
                $fileKey = "hero_media_items.{$index}.file";
                $posterKey = "hero_media_items.{$index}.poster_file";
                
                \Log::info("🔍 [DEBUG] Checking files for item {$index}", [
                    'file_key' => $fileKey,
                    'poster_key' => $posterKey,
                    'has_file' => $request->hasFile($fileKey),
                    'has_poster' => $request->hasFile($posterKey),
                    'file_type' => $item['file_type'] ?? 'unknown'
                ]);
                
                if ($request->hasFile($fileKey)) {
                    $file = $request->file($fileKey);
                    $fileType = $item['file_type'] ?? 'image';
                    
                    // Разные ограничения для изображений и видео
                    if ($fileType === 'image') {
                        $validator = Validator::make(['file' => $file], [
                            'file' => 'required|image|max:2048', // 2MB для изображений
                        ]);
                    } elseif ($fileType === 'video') {
                        $validator = Validator::make(['file' => $file], [
                            'file' => 'required|mimes:mp4,mov,avi,webm|max:51200', // 50MB для видео
                        ]);
                    }
                    
                    if (isset($validator) && $validator->fails()) {
                        \Log::error("❌ [ERROR] File validation failed for item {$index}", [
                            'errors' => $validator->errors()->toArray()
                        ]);
                        return response()->json([
                            'success' => false,
                            'message' => $fileType === 'image' 
                                ? 'Размер изображения не должен превышать 2 MB' 
                                : 'Размер видео не должен превышать 50 MB',
                            'errors' => $validator->errors()
                        ], 422);
                    }
                }
                
                // Валидация постера (всегда изображение)
                if ($request->hasFile($posterKey)) {
                    $poster = $request->file($posterKey);
                    $validator = Validator::make(['poster' => $poster], [
                        'poster' => 'required|image|max:2048', // 2MB для постеров
                    ]);
                    
                    if ($validator->fails()) {
                        \Log::error("❌ [ERROR] Poster validation failed for item {$index}", [
                            'errors' => $validator->errors()->toArray()
                        ]);
                        return response()->json([
                            'success' => false,
                            'message' => 'Размер изображения постера не должен превышать 2 MB',
                            'errors' => $validator->errors()
                        ], 422);
                    }
                }
            }
            
            // Удаляем существующие элементы этой группы
            \Log::info("🗑️ [DEBUG] Deleting existing hero media for group {$groupId}");
            ProjectDetailHeroMedia::where('project_detail_id', $projectDetail->id)
                ->where('group_id', $groupId)
                ->delete();
                
            $createdItems = [];
            
            // Создаем новые элементы
            foreach ($heroMediaItems as $index => $item) {
                $filePath = null;
                $posterPath = null;
                
                $fileKey = "hero_media_items.{$index}.file";
                $posterKey = "hero_media_items.{$index}.poster_file";
                
                // Проверяем, есть ли новый файл
                if ($request->hasFile($fileKey)) {
                    $file = $request->file($fileKey);
                    $filePath = $file->store('projects/hero', 'public');
                    \Log::info("📁 [DEBUG] Stored main file for item {$index}: {$filePath}");
                } else {
                    // Используем существующий путь
                    $filePath = $item['file_path'] ?? null;
                    \Log::info("📁 [DEBUG] Using existing file path for item {$index}: {$filePath}");
                }
                
                // Обработка постера для видео
                if ($request->hasFile($posterKey)) {
                    $poster = $request->file($posterKey);
                    $posterPath = $poster->store('projects/hero/posters', 'public');
                    \Log::info("🖼️ [DEBUG] Stored poster file for item {$index}: {$posterPath}");
                } else {
                    $posterPath = $item['poster_path'] ?? null;
                    \Log::info("🖼️ [DEBUG] Using existing poster path for item {$index}: {$posterPath}");
                }
                
                $createdItem = ProjectDetailHeroMedia::create([
                    'project_detail_id' => $projectDetail->id,
                    'group_id' => $item['group_id'] ?? $groupId,
                    'group_type' => $item['group_type'] ?? $groupType,
                    'file_type' => $item['file_type'] ?? 'image',
                    'file_path' => $filePath,
                    'alt_text' => $item['alt_text'] ?? '',
                    'poster_path' => $posterPath,
                ]);
                
                $createdItems[] = $createdItem;
                
                \Log::info("✅ [DEBUG] Created hero media item {$index}", [
                    'id' => $createdItem->id,
                    'file_path' => $createdItem->file_path,
                    'poster_path' => $createdItem->poster_path,
                    'file_type' => $createdItem->file_type
                ]);
            }
            
            \Log::info("✅ [SUCCESS] Hero media updated successfully", [
                'created_items_count' => count($createdItems)
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Hero media updated successfully',
                'data' => [
                    'hero_media_items' => collect($createdItems)->map(function($item) {
                        return [
                            'id' => $item->id,
                            'group_id' => $item->group_id,
                            'group_type' => $item->group_type,
                            'file_type' => $item->file_type,
                            'file_path' => $item->file_path,
                            'poster_path' => $item->poster_path,
                            'alt_text' => $item->alt_text,
                            'order' => $item->order ?? 0
                        ];
                    })->toArray()
                ]
            ]);
        } catch (Exception $e) {
            \Log::error('❌ [ERROR] Error updating hero media: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Error updating hero media: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Удалить группу Hero медиа
     * 
     * @param Request $request
     * @param string $slug
     * @param int $groupId
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroyHeroGroup(Request $request, $slug, $groupId)
    {
        try {
            $project = Project::where('slug', $slug)->firstOrFail();
            $projectDetail = $project->detail;

            if (!$projectDetail) {
                return response()->json(['success' => false, 'message' => 'Детали проекта не найдены'], 404);
            }

            // Находим все медиа-элементы для удаления
            $mediaItems = ProjectDetailHeroMedia::where('project_detail_id', $projectDetail->id)
                ->where('group_id', $groupId)
                ->get();

            if ($mediaItems->isEmpty()) {
                return response()->json(['success' => false, 'message' => 'Группа медиа не найдена'], 404);
            }

            // Начинаем транзакцию для обеспечения целостности данных
            DB::beginTransaction();

            foreach ($mediaItems as $item) {
                // Удаляем основной файл из хранилища
                if ($item->file_path && Storage::disk('public')->exists($item->file_path)) {
                    Storage::disk('public')->delete($item->file_path);
                    Log::info('Deleted hero file', ['path' => $item->file_path]);
                }
                
                // Удаляем постер из хранилища, если он есть
                if ($item->poster_path && Storage::disk('public')->exists($item->poster_path)) {
                    Storage::disk('public')->delete($item->poster_path);
                    Log::info('Deleted hero poster', ['path' => $item->poster_path]);
                }
            }

            // Удаляем записи из базы данных
            ProjectDetailHeroMedia::where('project_detail_id', $projectDetail->id)
                ->where('group_id', $groupId)
                ->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Группа Hero медиа успешно удалена'
            ]);

        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Ошибка при удалении группы Hero медиа: ' . $e->getMessage(), [
                'slug' => $slug,
                'groupId' => $groupId
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Ошибка при удалении группы: ' . $e->getMessage()
            ], 500);
        }
    }

/**
     * Создать новый блок (только текстовые поля).
     */
    public function storeBlock(Request $request, $slug)
    {
        $project = Project::where('slug', $slug)->firstOrFail();
        $projectDetail = $project->detail;

        if (!$projectDetail) {
            return response()->json(['success' => false, 'message' => 'Детали проекта не найдены'], 404);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'subtitle' => 'nullable|string|max:255',
            'content' => 'nullable|string',
            'gallery_layout' => 'nullable|string|in:carousel,collage',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'Ошибка валидации', 'errors' => $validator->errors()], 422);
        }

        $maxOrder = $projectDetail->blocks()->max('order') ?? 0;

        $block = $projectDetail->blocks()->create([
            'title' => $request->input('title'),
            'subtitle' => $request->input('subtitle'),
            'content' => $request->input('content'),
            'gallery_layout' => $request->input('gallery_layout', 'carousel'),
            'order' => $maxOrder + 1,
        ]);

        return response()->json(['success' => true, 'message' => 'Блок успешно создан', 'data' => $block], 201);
    }

    /**
     * Обновить текстовое содержимое блока.
     */
    public function updateBlockText(Request $request, $slug, $blockId)
    {
        $block = ProjectDetailBlock::findOrFail($blockId);

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'subtitle' => 'nullable|string|max:255',
            'content' => 'required|string',
            'order' => 'required|integer',
            'gallery_layout' => 'nullable|string|in:carousel,collage',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'Ошибка валидации', 'errors' => $validator->errors()], 422);
        }

        $block->update($request->only(['title', 'subtitle', 'content', 'order', 'gallery_layout']));

        return response()->json(['success' => true, 'message' => 'Текст блока успешно обновлен.', 'data' => $block]);
    }

    /**
     * Удалить весь блок проекта.
     */
    public function destroyBlock($slug, $blockId)
    {
        $block = ProjectDetailBlock::with('mediaItems')->findOrFail($blockId);

        DB::beginTransaction();
        try {
            foreach ($block->mediaItems as $mediaItem) {
                if ($mediaItem->file_path && Storage::disk('public')->exists($mediaItem->file_path)) {
                    Storage::disk('public')->delete($mediaItem->file_path);
                }
            }
            $block->mediaItems()->delete();
            $block->delete();
            DB::commit();

            return response()->json(['success' => true, 'message' => 'Блок успешно удален']);
        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Ошибка удаления блока проекта: ' . $e->getMessage(), ['block_id' => $blockId]);
            return response()->json(['success' => false, 'message' => 'Ошибка сервера при удалении блока'], 500);
        }
    }

    /**
     * Сохранить новую медиа-группу для указанного блока.
     */
    public function storeBlockMediaGroup(Request $request, $slug, $blockId)
    {
        Log::info('🔍 [DEBUG] storeBlockMediaGroup started', [
            'slug' => $slug,
            'blockId' => $blockId,
            'request_data' => $request->except(['_token']),
            'files' => $request->allFiles(),
            'content_type' => $request->header('Content-Type'),
            'content_length' => $request->header('Content-Length')
        ]);

        try {
            $block = ProjectDetailBlock::findOrFail($blockId);
            Log::info('✅ [DEBUG] Block found', ['block' => $block->toArray()]);
        } catch (Exception $e) {
            Log::error('❌ [ERROR] Block not found', ['blockId' => $blockId, 'error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Блок не найден.'], 404);
        }

        // Валидация
        Log::info('🔍 [DEBUG] Starting validation...');
        $validator = Validator::make($request->all(), [
            'group_type' => 'required|in:single,double',
            'media_items' => 'required|array|min:1',
            'media_items.*.file_type' => 'required|in:image,video',
            'media_items.*.alt_text' => 'nullable|string|max:255',
            'media_items.*.order' => 'nullable|integer|min:0',
            'media_items.*.group_id' => 'nullable|integer|min:1',
        ]);

        // Кастомная валидация файлов включая постеры
        $validator->after(function ($validator) use ($request) {
            $mediaItems = $request->input('media_items', []);
            foreach ($mediaItems as $index => $item) {
                // Валидация основного файла
                if ($request->hasFile("media_items.{$index}.file")) {
                    $this->validateFileUpload($validator, $request, "media_items.{$index}.file");
                }
                
                // Валидация постера для видео
                if ($request->hasFile("media_items.{$index}.poster_file")) {
                    $posterValidator = Validator::make(
                        ["poster" => $request->file("media_items.{$index}.poster_file")],
                        ["poster" => 'required|image|max:2048']
                    );
                    
                    if ($posterValidator->fails()) {
                        $validator->errors()->add("media_items.{$index}.poster_file", 'Размер изображения постера не должен превышать 2 MB');
                    }
                }
            }
        });

        if ($validator->fails()) {
            Log::error('❌ [ERROR] Validation failed', [
                'errors' => $validator->errors()->toArray(),
                'request_data' => $request->except(['_token'])
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Ошибка валидации',
                'errors' => $validator->errors()
            ], 422);
        }
        Log::info('✅ [DEBUG] Validation passed');

        DB::beginTransaction();
        try {
            // Получаем group_id из первого элемента медиа или генерируем новый
            $mediaItemsData = $request->input('media_items', []);
            $groupId = $mediaItemsData[0]['group_id'] ?? time();
            
            Log::info('📋 [DEBUG] Processing media items', [
                'mediaItemsData' => $mediaItemsData,
                'groupId' => $groupId,
                'group_type' => $request->input('group_type')
            ]);

            $createdItems = 0;
            $createdRecords = [];
            foreach ($mediaItemsData as $index => $itemData) {
                Log::info("🔍 [DEBUG] Processing item {$index}", [
                    'itemData' => $itemData,
                    'hasFile' => $request->hasFile("media_items.{$index}.file"),
                    'hasPoster' => $request->hasFile("media_items.{$index}.poster_file")
                ]);

                if ($request->hasFile("media_items.{$index}.file")) {
                    $file = $request->file("media_items.{$index}.file");
                    Log::info("📁 [DEBUG] File details for item {$index}", [
                        'name' => $file->getClientOriginalName(),
                        'size' => $file->getSize(),
                        'mime' => $file->getMimeType(),
                        'extension' => $file->getClientOriginalExtension(),
                        'isValid' => $file->isValid(),
                        'error' => $file->getError()
                    ]);

                    try {
                        $filePath = $file->store('projects/blocks', 'public');
                        Log::info("✅ [DEBUG] File stored successfully", ['filePath' => $filePath]);

                        // Обработка постера для видео
                        $posterPath = null;
                        if ($request->hasFile("media_items.{$index}.poster_file")) {
                            $posterFile = $request->file("media_items.{$index}.poster_file");
                            Log::info("📁 [DEBUG] Processing poster for item {$index}", [
                                'name' => $posterFile->getClientOriginalName(),
                                'size' => $posterFile->getSize()
                            ]);
                            
                            $posterPath = $posterFile->store('projects/blocks/posters', 'public');
                            Log::info("✅ [DEBUG] Poster stored successfully", ['posterPath' => $posterPath]);
                        }

                        $mediaData = [
                            'project_detail_block_id' => $blockId,
                            'group_id' => $itemData['group_id'] ?? $groupId,
                            'group_type' => $request->input('group_type', 'single'),
                            'file_type' => $itemData['file_type'] ?? 'image',
                            'file_path' => '/storage/' . $filePath,
                            'alt_text' => $itemData['alt_text'] ?? '',
                            'poster_path' => $posterPath ? '/storage/' . $posterPath : null,
                            'order' => $itemData['order'] ?? $index,
                        ];
                        
                        Log::info("💾 [DEBUG] Creating media record", ['mediaData' => $mediaData]);
                        $mediaRecord = ProjectDetailBlockMedia::create($mediaData);
                        Log::info("✅ [DEBUG] Media record created", ['id' => $mediaRecord->id]);
                        
                        $createdRecords[] = $mediaRecord;
                        $createdItems++;
                    } catch (Exception $e) {
                        Log::error("❌ [ERROR] Failed to store file or create record for item {$index}", [
                            'error' => $e->getMessage(),
                            'trace' => $e->getTraceAsString()
                        ]);
                        throw $e;
                    }
                } else {
                    Log::warning("⚠️ [WARNING] No file found for item {$index}");
                }
            }

            Log::info('📊 [DEBUG] Processing completed', ['createdItems' => $createdItems]);

            if ($createdItems === 0) {
                DB::rollBack();
                Log::error('❌ [ERROR] No items were created');
                return response()->json(['success' => false, 'message' => 'Не выбран ни один файл для загрузки.'], 400);
            }

            DB::commit();
            Log::info('✅ [SUCCESS] Transaction committed successfully', ['createdItems' => $createdItems]);
            
            return response()->json([
                'success' => true, 
                'message' => 'Медиа-группа создана успешно.',
                'data' => [
                    'media_items' => collect($createdRecords)->map(function($item) {
                        return [
                            'id' => $item->id,
                            'group_id' => $item->group_id,
                            'group_type' => $item->group_type,
                            'file_type' => $item->file_type,
                            'file_path' => $item->file_path,
                            'poster_path' => $item->poster_path,
                            'alt_text' => $item->alt_text,
                            'order' => $item->order
                        ];
                    })->toArray()
                ]
            ], 201);
        } catch (Exception $e) {
            DB::rollBack();
            Log::error('❌ [ERROR] Exception in storeBlockMediaGroup', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'block_id' => $blockId
            ]);
            return response()->json(['success' => false, 'message' => 'Ошибка сервера при создании медиа: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Обновить существующую медиа-группу в блоке.
     */
    public function updateBlockMediaGroup(Request $request, $slug, $blockId, $groupId)
    {
        Log::info('🔍 [DEBUG] updateBlockMediaGroup started', [
            'slug' => $slug,
            'blockId' => $blockId,
            'groupId' => $groupId,
            'method' => $request->method(),
            'all_data' => $request->all(),
            'files' => $request->allFiles()
        ]);

        // Валидация файлов включая постеры
        $validator = Validator::make($request->all(), [
            'group_type' => 'sometimes|in:single,double',
            'media_items' => 'required|array|min:1',
            'media_items.*.file_type' => 'required|in:image,video',
            'media_items.*.alt_text' => 'nullable|string|max:255',
            'media_items.*.order' => 'nullable|integer|min:0',
            'media_items.*.group_id' => 'nullable|integer|min:1',
        ]);

        // Кастомная валидация файлов включая постеры
        $validator->after(function ($validator) use ($request) {
            $mediaItems = $request->input('media_items', []);
            foreach ($mediaItems as $index => $item) {
                // Валидация основного файла
                if ($request->hasFile("media_items.{$index}.file")) {
                    $this->validateFileUpload($validator, $request, "media_items.{$index}.file");
                }
                
                // Валидация постера для видео
                if ($request->hasFile("media_items.{$index}.poster_file")) {
                    $posterValidator = Validator::make(
                        ["poster" => $request->file("media_items.{$index}.poster_file")],
                        ["poster" => 'required|image|max:2048']
                    );
                    
                    if ($posterValidator->fails()) {
                        $validator->errors()->add("media_items.{$index}.poster_file", 'Размер изображения постера не должен превышать 2 MB');
                    }
                }
            }
        });

        if ($validator->fails()) {
            Log::error('❌ [ERROR] Validation failed in updateBlockMediaGroup', [
                'errors' => $validator->errors()->toArray(),
                'request_data' => $request->except(['_token'])
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Ошибка валидации',
                'errors' => $validator->errors()
            ], 422);
        }

        DB::beginTransaction();
        try {
            // Проверяем существование блока
            $block = ProjectDetailBlock::findOrFail($blockId);
            
            // 1. Получаем старые элементы для возможного удаления файлов
            $oldItems = ProjectDetailBlockMedia::where('project_detail_block_id', $blockId)->where('group_id', $groupId)->get();
            Log::info('🔍 [DEBUG] Found old items', ['count' => $oldItems->count()]);
            
            // Создаем массив старых файлов для отслеживания
            $oldFilePaths = [];
            $oldPosterPaths = [];
            foreach($oldItems as $item) {
                if ($item->file_path) {
                    $oldFilePaths[] = $item->file_path;
                }
                if ($item->poster_path) {
                    $oldPosterPaths[] = $item->poster_path;
                }
            }
            
            // Удаляем только записи из БД, файлы удалим позже если нужно
            ProjectDetailBlockMedia::where('project_detail_block_id', $blockId)->where('group_id', $groupId)->delete();

            // 2. Создаем новые элементы
            $mediaItemsData = $request->input('media_items', []);
            Log::info('📝 [DEBUG] Processing media items', ['count' => count($mediaItemsData)]);
            
            foreach ($mediaItemsData as $index => $itemData) {
                Log::info("📝 [DEBUG] Processing item {$index}", [
                    'itemData' => $itemData,
                    'hasFile' => $request->hasFile("media_items.{$index}.file"),
                    'hasPoster' => $request->hasFile("media_items.{$index}.poster_file")
                ]);
                
                $filePath = $itemData['file_path'] ?? null;
                $posterPath = $itemData['poster_path'] ?? null;
                
                // Проверяем, есть ли новый файл для загрузки
                if ($request->hasFile("media_items.{$index}.file")) {
                    $file = $request->file("media_items.{$index}.file");
                    Log::info("📁 [DEBUG] Uploading new file for item {$index}", [
                        'name' => $file->getClientOriginalName(),
                        'size' => $file->getSize()
                    ]);
                    $filePath = $file->store('projects/blocks', 'public');
                    Log::info("✅ [DEBUG] File uploaded: {$filePath}");
                }

                // Проверяем, есть ли новый постер для загрузки
                if ($request->hasFile("media_items.{$index}.poster_file")) {
                    $posterFile = $request->file("media_items.{$index}.poster_file");
                    Log::info("📁 [DEBUG] Uploading new poster for item {$index}", [
                        'name' => $posterFile->getClientOriginalName(),
                        'size' => $posterFile->getSize()
                    ]);
                    $posterPath = $posterFile->store('projects/blocks/posters', 'public');
                    Log::info("✅ [DEBUG] Poster uploaded: {$posterPath}");
                }

                // Создаем запись, если есть путь к файлу (новый или существующий)
                if ($filePath) {
                    // Если это новый файл (не содержит /storage/), добавляем префикс
                    $fullFilePath = strpos($filePath, '/storage/') === 0 ? $filePath : '/storage/' . $filePath;
                    $fullPosterPath = null;
                    
                    if ($posterPath) {
                        $fullPosterPath = strpos($posterPath, '/storage/') === 0 ? $posterPath : '/storage/' . $posterPath;
                    }
                    
                    $mediaItem = ProjectDetailBlockMedia::create([
                        'project_detail_block_id' => $blockId,
                        'group_id' => $itemData['group_id'] ?? $groupId,
                        'group_type' => $request->input('group_type', 'single'),
                        'file_type' => $itemData['file_type'] ?? 'image',
                        'file_path' => $fullFilePath,
                        'alt_text' => $itemData['alt_text'] ?? '',
                        'poster_path' => $fullPosterPath,
                        'order' => $itemData['order'] ?? ($index + 1),
                    ]);
                    Log::info("✅ [DEBUG] Created media item {$index}", $mediaItem->toArray());
                } else {
                    Log::warning("⚠️ [WARNING] No file path for item {$index}, skipping creation");
                }
            }

            DB::commit();
            Log::info('✅ [SUCCESS] Media group updated successfully');
            return response()->json(['success' => true, 'message' => 'Медиа-группа успешно обновлена.']);
        } catch (Exception $e) {
            DB::rollBack();
            Log::error("❌ [ERROR] Exception in updateBlockMediaGroup: " . $e->getMessage(), [
                'block_id' => $blockId, 
                'group_id' => $groupId,
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['success' => false, 'message' => 'Ошибка сервера при обновлении медиа: ' . $e->getMessage()], 500);
        }
    }
    
    /**
     * Удалить медиа-группу из блока.
     */
    public function destroyBlockMediaGroup($slug, $blockId, $groupId)
    {
        $itemsToDelete = ProjectDetailBlockMedia::where('project_detail_block_id', $blockId)->where('group_id', $groupId)->get();

        if ($itemsToDelete->isEmpty()) {
            return response()->json(['success' => false, 'message' => 'Медиа-группа не найдена.'], 404);
        }
        
        DB::beginTransaction();
        try {
            foreach($itemsToDelete as $item) {
                if ($item->file_path) {
                    // Убираем префикс /storage/ для правильного удаления
                    $relativePath = str_replace('/storage/', '', $item->file_path);
                    if (Storage::disk('public')->exists($relativePath)) {
                        Storage::disk('public')->delete($relativePath);
                    }
                }
                if ($item->poster_path) {
                    // Убираем префикс /storage/ для правильного удаления
                    $relativePosterPath = str_replace('/storage/', '', $item->poster_path);
                    if (Storage::disk('public')->exists($relativePosterPath)) {
                        Storage::disk('public')->delete($relativePosterPath);
                    }
                }
                $item->delete();
            }
            DB::commit();
            return response()->json(['success' => true, 'message' => 'Медиа-группа успешно удалена.']);
        } catch (Exception $e) {
            DB::rollBack();
            Log::error("Ошибка удаления медиа-группы блока: " . $e->getMessage(), ['block_id' => $blockId, 'group_id' => $groupId]);
            return response()->json(['success' => false, 'message' => 'Ошибка сервера при удалении медиа.'], 500);
        }
    }

    /**
     * Update SEO metadata for a project
     *
     * @param Request $request
     * @param string $slug
     * @return JsonResponse
     */
    public function updateSEOMetadata(Request $request, string $slug): JsonResponse
    {
        Log::info('Запрос на обновление SEO метаданных проекта', [
            'slug' => $slug,
            'data' => $request->except(['seo_image'])
        ]);

        $project = Project::where('slug', $slug)->first();
        
        if (!$project) {
            return response()->json([
                'success' => false,
                'message' => 'Проект не найден'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'seo_title' => 'nullable|string|max:60',
            'seo_description' => 'nullable|string|max:160',
            'seo_image' => 'nullable|file|image|mimes:jpeg,png,jpg,gif,webp,svg|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Ошибка валидации',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $data = $request->only(['seo_title', 'seo_description']);

            // Handle SEO image upload
            if ($request->hasFile('seo_image')) {
                // Delete old SEO image if exists
                if ($project->seo_image) {
                    $oldImagePath = str_replace('/storage/', '', $project->seo_image);
                    if (Storage::disk('public')->exists($oldImagePath)) {
                        Storage::disk('public')->delete($oldImagePath);
                        Log::info('Старое SEO изображение проекта удалено: ' . $oldImagePath);
                    }
                }

                $path = $request->file('seo_image')->store('projects/seo', 'public');
                $data['seo_image'] = '/storage/' . $path;
                Log::info('Новое SEO изображение проекта загружено: ' . $path);
            }

            $project->update($data);

            Log::info('SEO метаданные проекта успешно обновлены', [
                'project_id' => $project->id,
                'updated_data' => $data
            ]);

            return response()->json([
                'success' => true,
                'message' => 'SEO метаданные проекта успешно обновлены',
                'data' => [
                    'seo_title' => $project->seo_title,
                    'seo_description' => $project->seo_description,
                    'seo_image' => $project->seo_image,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Ошибка при обновлении SEO метаданных проекта: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Ошибка сервера при обновлении SEO метаданных'
            ], 500);
        }
    }

    /**
     * Get SEO metadata for a project
     *
     * @param string $slug
     * @return JsonResponse
     */
    public function getSEOMetadata(string $slug): JsonResponse
    {
        $project = Project::where('slug', $slug)->first();
        
        if (!$project) {
            return response()->json([
                'success' => false,
                'message' => 'Проект не найден'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'seo_title' => $project->seo_title,
                'seo_description' => $project->seo_description,
                'seo_image' => $project->seo_image,
            ]
        ]);
    }

}
