<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MediaPageContent;
use App\Models\MediaService;
use App\Models\MediaTestimonial;
use App\Models\MediaProcessStep;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Exception;

class MediaPagePublicController extends Controller
{
    /**
     * Cache duration in minutes
     */
    const CACHE_DURATION = 60;
    
    /**
     * Cache tags for selective cache invalidation
     */
    const CACHE_TAGS = [
        'media_page',
        'media_services', 
        'media_testimonials',
        'media_process_steps',
        'media_page_content'
    ];

    /**
     * Get complete media page data for public consumption
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function index()
    {
        try {
            // Try to get cached data first
            $cacheKey = 'media_page_public_data';
            $mediaPageData = Cache::remember($cacheKey, self::CACHE_DURATION, function () {
                return $this->buildMediaPageData();
            });

            return response()->json([
                'success' => true,
                'data' => $mediaPageData
            ]);

        } catch (Exception $e) {
            Log::error('Error fetching public media page data: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Ошибка сервера при загрузке данных медиа страницы'
            ], 500);
        }
    }

    /**
     * Build complete media page data structure with optimized queries
     * 
     * @return array
     */
    private function buildMediaPageData()
    {
        // Get page content with caching
        $pageContent = Cache::remember('media_page_content', self::CACHE_DURATION, function () {
            return MediaPageContent::first();
        });
        
        // Get services with optimized eager loading
        $services = Cache::remember('media_services_with_relations', self::CACHE_DURATION, function () {
            return MediaService::with([
                'features' => function ($query) {
                    $query->orderBy('order');
                },
                'mediaItems' => function ($query) {
                    $query->orderBy('group_id')->orderBy('order');
                }
            ])
            ->ordered()
            ->get();
        });

        // Get testimonials with caching
        $testimonials = Cache::remember('media_testimonials', self::CACHE_DURATION, function () {
            return MediaTestimonial::ordered()->get();
        });

        // Get process steps with caching
        $processSteps = Cache::remember('media_process_steps', self::CACHE_DURATION, function () {
            return MediaProcessStep::ordered()->get();
        });

        return [
            'hero' => $this->transformHeroData($pageContent),
            'services' => $this->transformServicesData($services),
            'testimonials' => $this->transformTestimonialsData($testimonials, $pageContent),
            'process' => $this->transformProcessData($processSteps, $pageContent)
        ];
    }

    /**
     * Transform hero section data
     * 
     * @param MediaPageContent|null $pageContent
     * @return array
     */
    private function transformHeroData($pageContent)
    {
        return [
            'title' => $pageContent->hero_title ?? '',
            'description' => $pageContent->hero_description ?? ''
        ];
    }

    /**
     * Transform services data to match original mediaServices format
     * 
     * @param \Illuminate\Database\Eloquent\Collection $services
     * @return array
     */
    private function transformServicesData($services)
    {
        return $services->map(function ($service) {
            return [
                'id' => $service->id,
                'title' => $service->title,
                'description' => $service->description,
                'darkBackground' => $service->dark_background,
                'features' => $this->transformServiceFeatures($service->features),
                'media' => $this->transformServiceMedia($service->mediaItems)
            ];
        })->toArray();
    }

    /**
     * Transform service features
     * 
     * @param \Illuminate\Database\Eloquent\Collection $features
     * @return array
     */
    private function transformServiceFeatures($features)
    {
        return $features->map(function ($feature) {
            return [
                'id' => $feature->id,
                'title' => $feature->title,
                'description' => is_array($feature->description) ? $feature->description : [$feature->description]
            ];
        })->toArray();
    }

    /**
     * Transform service media to match original format
     * 
     * @param \Illuminate\Database\Eloquent\Collection $mediaItems
     * @return array
     */
    private function transformServiceMedia($mediaItems)
    {
        // Group media by group_id
        $groupedMedia = $mediaItems->groupBy('group_id');
        
        return $groupedMedia->map(function ($group, $groupId) {
            $mainMedia = $group->where('media_type', 'main')->first();
            $secondaryMedia = $group->where('media_type', 'secondary');

            $mediaGroup = [
                'id' => $groupId,
                'main' => null,
                'secondary' => []
            ];

            // Transform main media
            if ($mainMedia) {
                $mediaGroup['main'] = $this->transformMediaItem($mainMedia);
            }

            // Transform secondary media
            $mediaGroup['secondary'] = $secondaryMedia->map(function ($media) {
                return $this->transformMediaItem($media);
            })->toArray();

            return $mediaGroup;
        })->values()->toArray();
    }

    /**
     * Transform individual media item
     * 
     * @param MediaServiceMedia $media
     * @return array
     */
    private function transformMediaItem($media)
    {
        $mediaData = [
            'id' => $media->id,
            'type' => $media->file_type, // 'image' or 'video'
            'src' => $this->normalizeFilePath($media->file_path),
            'alt' => $media->alt_text ?? ''
        ];

        // Add poster for videos
        if ($media->file_type === 'video' && $media->poster_path) {
            $mediaData['poster'] = $this->normalizeFilePath($media->poster_path);
        }

        return $mediaData;
    }

    /**
     * Transform testimonials data
     * 
     * @param \Illuminate\Database\Eloquent\Collection $testimonials
     * @param MediaPageContent|null $pageContent
     * @return array
     */
    private function transformTestimonialsData($testimonials, $pageContent)
    {
        return [
            'title' => $pageContent->testimonials_title ?? '',
            'subtitle' => $pageContent->testimonials_subtitle ?? '',
            'items' => $testimonials->map(function ($testimonial) {
                return [
                    'id' => $testimonial->id,
                    'company' => $testimonial->company,
                    'quote' => $testimonial->quote,
                    'description' => $testimonial->description,
                    'image' => $testimonial->image_path ? $this->normalizeFilePath($testimonial->image_path) : null
                ];
            })->toArray()
        ];
    }

    /**
     * Transform process data
     * 
     * @param \Illuminate\Database\Eloquent\Collection $processSteps
     * @param MediaPageContent|null $pageContent
     * @return array
     */
    private function transformProcessData($processSteps, $pageContent)
    {
        return [
            'title' => $pageContent->process_title ?? '',
            'subtitle' => $pageContent->process_subtitle ?? '',
            'steps' => $processSteps->map(function ($step) {
                return [
                    'id' => $step->id,
                    'stepNumber' => $step->step_number,
                    'title' => $step->title,
                    'subtitle' => $step->subtitle,
                    'image' => $step->image_path ? $this->normalizeFilePath($step->image_path) : null,
                    'descriptionLeft' => $step->description_left,
                    'descriptionRight' => $step->description_right
                ];
            })->toArray()
        ];
    }

    /**
     * Normalize file path for public access
     * Remove /storage/ prefix and ensure proper URL format
     * 
     * @param string|null $filePath
     * @return string|null
     */
    private function normalizeFilePath($filePath)
    {
        if (!$filePath) {
            return null;
        }

        // Remove /storage/ prefix if present
        $normalizedPath = ltrim($filePath, '/');
        if (str_starts_with($normalizedPath, 'storage/')) {
            $normalizedPath = substr($normalizedPath, 8); // Remove 'storage/'
        }

        // Ensure the file exists in storage
        if (!Storage::disk('public')->exists($normalizedPath)) {
            Log::warning('File not found in storage: ' . $normalizedPath);
            return null;
        }

        // Return the normalized path without /storage/ prefix
        return $normalizedPath;
    }

    /**
     * Clear all media page related caches including admin caches
     * This method can be called when media page data is updated
     * 
     * @return bool
     */
    public static function clearCache()
    {
        try {
            // Clear main public cache
            Cache::forget('media_page_public_data');
            
            // Clear individual component caches
            Cache::forget('media_page_content');
            Cache::forget('media_services_with_relations');
            Cache::forget('media_testimonials');
            Cache::forget('media_process_steps');
            
            // Clear admin interface caches
            Cache::forget('media_services_all');
            
            // Clear paginated caches (simplified approach)
            // In production, consider using cache tags for more efficient cache management
            $cacheKeys = Cache::get('media_page_cache_keys', []);
            foreach ($cacheKeys as $key) {
                Cache::forget($key);
            }
            Cache::forget('media_page_cache_keys');
            
            Log::info('All media page caches cleared');
            return true;
        } catch (Exception $e) {
            Log::error('Error clearing media page cache: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Register a cache key for tracking
     * 
     * @param string $key
     */
    public static function registerCacheKey(string $key)
    {
        $keys = Cache::get('media_page_cache_keys', []);
        if (!in_array($key, $keys)) {
            $keys[] = $key;
            Cache::put('media_page_cache_keys', $keys, self::CACHE_DURATION * 2);
        }
    }

    /**
     * Refresh cache with new data
     * 
     * @return bool
     */
    public function refreshCache()
    {
        try {
            self::clearCache();
            
            // Rebuild cache
            $cacheKey = 'media_page_public_data';
            Cache::put($cacheKey, $this->buildMediaPageData(), self::CACHE_DURATION);
            
            return response()->json([
                'success' => true,
                'message' => 'Кэш медиа страницы обновлен'
            ]);
        } catch (Exception $e) {
            Log::error('Error refreshing media page cache: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Ошибка обновления кэша'
            ], 500);
        }
    }
}