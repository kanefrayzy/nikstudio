<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HomepageContent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Str;
use Illuminate\Support\Facades\Http;
use Exception;

class HomepageContentController extends Controller
{
    /**
     * Get all homepage content grouped by sections
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function index()
    {
        try {
            // Cache for 30 minutes (1800 seconds)
            $content = Cache::remember('homepage_content_all', 1800, function() {
                return HomepageContent::ordered()->get()->groupBy('section');
            });
            
            return response()->json([
                'success' => true,
                'data' => $content
            ], 200);
            
        } catch (Exception $e) {
            Log::error('Error fetching homepage content: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Ошибка сервера при загрузке контента главной страницы'
            ], 500);
        }
    }
    
    /**
     * Get homepage content for a specific section
     * 
     * @param string $section
     * @return \Illuminate\Http\JsonResponse
     */
    public function getBySection(string $section)
    {
        try {
            // Cache for 30 minutes (1800 seconds) per section
            $content = Cache::remember("homepage_content_{$section}", 1800, function() use ($section) {
                return HomepageContent::bySection($section)->ordered()->get();
            });
            
            return response()->json([
                'success' => true,
                'data' => $content
            ], 200);
            
        } catch (Exception $e) {
            Log::error("Error fetching homepage content for section {$section}: " . $e->getMessage(), [
                'section' => $section,
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Ошибка сервера при загрузке контента секции'
            ], 500);
        }
    }
    
    /**
     * Bulk update or create homepage content items
     * 
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function bulkUpdate(Request $request)
    {
        try {
            // Validate the items array
            $validator = Validator::make($request->all(), [
                'items' => 'required|array|max:100', // Limit to 100 items per request
                'items.*.section' => 'required|string|max:100',
                'items.*.content_type' => 'required|in:text,image',
                'items.*.content_key' => 'required|string|max:100',
                'items.*.content_value' => 'required|string|max:10000', // Limit content length
                'items.*.order_index' => 'nullable|integer|min:0|max:9999',
                'items.*.metadata' => 'nullable|array'
            ]);
            
            if ($validator->fails()) {
                Log::warning('Homepage content bulk update validation failed', [
                    'errors' => $validator->errors(),
                    'user_id' => $request->user()?->id,
                    'ip' => $request->ip()
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Ошибка валидации',
                    'errors' => $validator->errors()
                ], 422);
            }
            
            $items = $request->input('items');
            $updatedItems = [];
            $affectedSections = [];
            
            foreach ($items as $itemData) {
                // Sanitize input data - remove HTML tags and trim whitespace
                $sanitizedValue = $this->sanitizeContent($itemData['content_value'], $itemData['content_type']);
                $sanitizedSection = $this->sanitizeString($itemData['section']);
                $sanitizedKey = $this->sanitizeString($itemData['content_key']);
                
                // Update or create the content item
                $content = HomepageContent::updateOrCreate(
                    [
                        'section' => $sanitizedSection,
                        'content_key' => $sanitizedKey
                    ],
                    [
                        'content_type' => $itemData['content_type'],
                        'content_value' => $sanitizedValue,
                        'order_index' => $itemData['order_index'] ?? 0,
                        'metadata' => $itemData['metadata'] ?? null
                    ]
                );
                
                $updatedItems[] = $content;
                $affectedSections[] = $sanitizedSection;
            }
            
            // Clear cache for all affected sections
            $affectedSections = array_unique($affectedSections);
            foreach ($affectedSections as $section) {
                Cache::forget("homepage_content_{$section}");
            }
            Cache::forget('homepage_content_all');
            
            // Trigger Next.js revalidation
            $this->revalidateNextJs('/');
            
            Log::info('Homepage content bulk updated successfully', [
                'items_count' => count($updatedItems),
                'sections' => $affectedSections,
                'user_id' => $request->user()?->id
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Контент успешно обновлен',
                'data' => $updatedItems
            ], 200);
            
        } catch (Exception $e) {
            Log::error('Error bulk updating homepage content: ' . $e->getMessage(), [
                'user_id' => $request->user()?->id,
                'ip' => $request->ip(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Ошибка сервера при обновлении контента'
            ], 500);
        }
    }
    
    /**
     * Update a single homepage content item
     * 
     * @param \Illuminate\Http\Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, int $id)
    {
        try {
            // Find the content item
            $content = HomepageContent::find($id);
            
            if (!$content) {
                Log::warning('Homepage content item not found', [
                    'id' => $id,
                    'user_id' => $request->user()?->id
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Элемент контента не найден'
                ], 404);
            }
            
            // Validate the request
            $validator = Validator::make($request->all(), [
                'section' => 'required|string|max:100',
                'content_type' => 'required|in:text,image',
                'content_key' => 'required|string|max:100',
                'content_value' => 'required|string|max:10000',
                'order_index' => 'nullable|integer|min:0|max:9999',
                'metadata' => 'nullable|array'
            ]);
            
            if ($validator->fails()) {
                Log::warning('Homepage content update validation failed', [
                    'id' => $id,
                    'errors' => $validator->errors(),
                    'user_id' => $request->user()?->id
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Ошибка валидации',
                    'errors' => $validator->errors()
                ], 422);
            }
            
            // Sanitize input data
            $contentValue = $this->sanitizeContent(
                $request->input('content_value'),
                $request->input('content_type')
            );
            $section = $this->sanitizeString($request->input('section'));
            $contentKey = $this->sanitizeString($request->input('content_key'));
            
            // Update the content item
            $content->update([
                'section' => $section,
                'content_type' => $request->input('content_type'),
                'content_key' => $contentKey,
                'content_value' => $contentValue,
                'order_index' => $request->input('order_index', 0),
                'metadata' => $request->input('metadata')
            ]);
            
            // Clear cache for the section
            Cache::forget("homepage_content_{$content->section}");
            Cache::forget('homepage_content_all');
            
            // Trigger Next.js revalidation
            $this->revalidateNextJs('/');
            
            Log::info('Homepage content item updated successfully', [
                'id' => $id,
                'section' => $section,
                'user_id' => $request->user()?->id
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Контент успешно обновлен',
                'data' => $content
            ], 200);
            
        } catch (Exception $e) {
            Log::error("Error updating homepage content item {$id}: " . $e->getMessage(), [
                'id' => $id,
                'user_id' => $request->user()?->id,
                'ip' => $request->ip(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Ошибка сервера при обновлении контента'
            ], 500);
        }
    }
    
    /**
     * Upload an image for homepage content
     * 
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function uploadImage(Request $request)
    {
        try {
            // Check file size before validation (2MB = 2097152 bytes)
            if ($request->hasFile('image')) {
                $file = $request->file('image');
                if ($file->getSize() > 2097152) {
                    Log::warning('Homepage image upload failed: file too large', [
                        'size' => $file->getSize(),
                        'user_id' => $request->user()?->id,
                        'ip' => $request->ip()
                    ]);
                    
                    return response()->json([
                        'success' => false,
                        'message' => 'Размер изображения не должен превышать 2 МБ'
                    ], 413);
                }
            }
            
            // Validate the request
            // Note: 'image' rule doesn't support SVG, so we use 'file' with mimes
            $validator = Validator::make($request->all(), [
                'image' => 'required|file|mimes:jpeg,jpg,png,webp,svg|max:2048'
            ]);
            
            // Additional validation for SVG and other image types
            $validator->after(function ($validator) use ($request) {
                if ($request->hasFile('image')) {
                    $file = $request->file('image');
                    $mimeType = $file->getMimeType();
                    $extension = strtolower($file->getClientOriginalExtension());
                    
                    // Allowed MIME types
                    $allowedMimes = [
                        'image/jpeg',
                        'image/jpg', 
                        'image/png',
                        'image/webp',
                        'image/svg+xml',
                        'text/xml', // Some SVG files have this MIME type
                        'application/xml' // Some SVG files have this MIME type
                    ];
                    
                    // For SVG files, check extension if MIME type is XML-based
                    if (in_array($mimeType, ['text/xml', 'application/xml'])) {
                        if ($extension !== 'svg') {
                            $validator->errors()->add('image', 'Недопустимый тип файла. Разрешены: JPG, PNG, WEBP, SVG');
                        }
                    } elseif (!in_array($mimeType, $allowedMimes)) {
                        $validator->errors()->add('image', 'Недопустимый тип файла. Разрешены: JPG, PNG, WEBP, SVG');
                    }
                }
            });
            
            if ($validator->fails()) {
                Log::warning('Homepage image upload validation failed', [
                    'errors' => $validator->errors(),
                    'user_id' => $request->user()?->id,
                    'ip' => $request->ip()
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Ошибка валидации',
                    'errors' => $validator->errors()
                ], 422);
            }
            
            $file = $request->file('image');
            
            // Sanitize filename to prevent directory traversal
            $originalName = $file->getClientOriginalName();
            $fileNameWithoutExt = pathinfo($originalName, PATHINFO_FILENAME);
            // Sanitize: remove special characters, replace spaces with hyphens
            $sanitizedName = preg_replace('/[^a-zA-Z0-9_-]/', '', str_replace(' ', '-', $fileNameWithoutExt));
            $extension = strtolower($file->getClientOriginalExtension());
            
            // Generate a unique filename
            $filename = time() . '_' . uniqid() . '_' . $sanitizedName . '.' . $extension;
            
            // Store the file in storage/app/public/homepage/
            $path = $file->storeAs('homepage', $filename, 'public');
            
            Log::info('Homepage image uploaded successfully', [
                'filename' => $filename,
                'size' => $file->getSize(),
                'user_id' => $request->user()?->id
            ]);
            
            // Return normalized path without /storage/ prefix
            // The path will be like: homepage/1234567890_abc123.jpg
            return response()->json([
                'success' => true,
                'message' => 'Изображение успешно загружено',
                'data' => [
                    'path' => $path,
                    'url' => Storage::url($path),
                    'filename' => $filename,
                    'size' => $file->getSize(),
                    'mime_type' => $file->getMimeType()
                ]
            ], 201);
            
        } catch (Exception $e) {
            Log::error('Error uploading homepage image: ' . $e->getMessage(), [
                'user_id' => $request->user()?->id,
                'ip' => $request->ip(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Ошибка сервера при загрузке изображения'
            ], 500);
        }
    }
    
    /**
     * Sanitize content value based on content type
     * 
     * @param string $value
     * @param string $type
     * @return string
     */
    private function sanitizeContent(string $value, string $type): string
    {
        if ($type === 'text') {
            // For text content, allow basic HTML tags but strip dangerous ones
            $value = strip_tags($value, '<br><p><strong><em><ul><li><ol>');
            // Remove any script or style content
            $value = preg_replace('/<script\b[^>]*>(.*?)<\/script>/is', '', $value);
            $value = preg_replace('/<style\b[^>]*>(.*?)<\/style>/is', '', $value);
        } else {
            // For image paths, just strip all tags
            $value = strip_tags($value);
        }
        
        // Trim whitespace
        $value = trim($value);
        
        return $value;
    }
    
    /**
     * Sanitize string input (section, content_key)
     * 
     * @param string $value
     * @return string
     */
    private function sanitizeString(string $value): string
    {
        // Remove all HTML tags
        $value = strip_tags($value);
        // Remove special characters except underscore and hyphen
        $value = preg_replace('/[^a-zA-Z0-9_\-]/', '', $value);
        // Trim whitespace
        $value = trim($value);
        
        return $value;
    }
    
    /**
     * Trigger Next.js revalidation for a specific path
     * 
     * @param string $path
     * @return void
     */
    private function revalidateNextJs(string $path): void
    {
        try {
            $frontendUrl = env('FRONTEND_URL', 'http://localhost:3000');
            
            Http::timeout(5)->post("{$frontendUrl}/api/revalidate", [
                'path' => $path
            ]);
            
            Log::info('Next.js revalidation triggered', [
                'path' => $path,
                'frontend_url' => $frontendUrl
            ]);
        } catch (Exception $e) {
            // Don't fail the main operation if revalidation fails
            Log::warning('Failed to trigger Next.js revalidation', [
                'path' => $path,
                'error' => $e->getMessage()
            ]);
        }
    }
}
