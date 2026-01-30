<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Intervention\Image\Facades\Image;

class ImageOptimizationController extends Controller
{
    /**
     * Optimize image for social media platforms
     *
     * @param Request $request
     * @return Response
     */
    public function optimize(Request $request): Response
    {
        $validator = Validator::make($request->all(), [
            'path' => 'required|string',
            'w' => 'required|integer|min:100|max:2000',
            'h' => 'required|integer|min:100|max:2000',
            'q' => 'integer|min:10|max:100',
            'f' => 'string|in:jpg,jpeg,png,webp',
            'fit' => 'string|in:cover,contain,fill'
        ]);

        if ($validator->fails()) {
            return response('Invalid parameters', 400);
        }

        $path = $request->input('path');
        $width = (int) $request->input('w');
        $height = (int) $request->input('h');
        $quality = (int) $request->input('q', 85);
        $format = $request->input('f', 'jpg');
        $fit = $request->input('fit', 'cover');

        try {
            // Generate cache key
            $cacheKey = $this->generateCacheKey($path, $width, $height, $quality, $format, $fit);
            
            // Check if optimized image is cached
            $cachedImage = Cache::get($cacheKey);
            if ($cachedImage) {
                return $this->returnOptimizedImage($cachedImage['data'], $cachedImage['mime'], true);
            }

            // Check if original image exists
            if (!Storage::disk('public')->exists($path)) {
                Log::warning("Image not found for optimization: {$path}");
                return response('Image not found', 404);
            }

            // Get original image
            $originalPath = Storage::disk('public')->path($path);
            
            // Create optimized image
            $optimizedImage = $this->createOptimizedImage(
                $originalPath, 
                $width, 
                $height, 
                $quality, 
                $format, 
                $fit
            );

            // Cache the optimized image for 1 hour
            Cache::put($cacheKey, [
                'data' => $optimizedImage['data'],
                'mime' => $optimizedImage['mime']
            ], 3600);

            return $this->returnOptimizedImage(
                $optimizedImage['data'], 
                $optimizedImage['mime'], 
                false
            );

        } catch (\Exception $e) {
            Log::error('Image optimization failed: ' . $e->getMessage(), [
                'path' => $path,
                'width' => $width,
                'height' => $height,
                'error' => $e->getMessage()
            ]);

            // Return original image as fallback
            return $this->returnOriginalImage($path);
        }
    }

    /**
     * Clear image optimization cache
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function clearCache(Request $request): JsonResponse
    {
        try {
            $pattern = $request->input('pattern', 'img_opt_*');
            
            // Clear cache entries matching pattern
            $cleared = $this->clearCacheByPattern($pattern);
            
            return response()->json([
                'success' => true,
                'message' => 'Image optimization cache cleared',
                'cleared_entries' => $cleared
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to clear image optimization cache: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to clear cache'
            ], 500);
        }
    }

    /**
     * Get image optimization statistics
     *
     * @return JsonResponse
     */
    public function getStats(): JsonResponse
    {
        try {
            $stats = [
                'cache_size' => $this->getCacheSize(),
                'total_optimizations' => $this->getTotalOptimizations(),
                'cache_hit_rate' => $this->getCacheHitRate(),
                'supported_formats' => ['jpg', 'jpeg', 'png', 'webp'],
                'max_dimensions' => ['width' => 2000, 'height' => 2000],
                'quality_range' => ['min' => 10, 'max' => 100]
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to get image optimization stats: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to get statistics'
            ], 500);
        }
    }

    /**
     * Create optimized image
     *
     * @param string $originalPath
     * @param int $width
     * @param int $height
     * @param int $quality
     * @param string $format
     * @param string $fit
     * @return array
     */
    private function createOptimizedImage(
        string $originalPath, 
        int $width, 
        int $height, 
        int $quality, 
        string $format, 
        string $fit
    ): array {
        $image = Image::make($originalPath);

        // Apply fit strategy
        switch ($fit) {
            case 'cover':
                $image->fit($width, $height, function ($constraint) {
                    $constraint->upsize();
                });
                break;
            case 'contain':
                $image->resize($width, $height, function ($constraint) {
                    $constraint->aspectRatio();
                    $constraint->upsize();
                });
                break;
            case 'fill':
                $image->resize($width, $height);
                break;
        }

        // Determine output format and MIME type
        $outputFormat = $format === 'jpg' ? 'jpeg' : $format;
        $mimeType = "image/{$outputFormat}";

        // Encode with quality
        $encodedImage = $image->encode($outputFormat, $quality);

        return [
            'data' => $encodedImage->getEncoded(),
            'mime' => $mimeType
        ];
    }

    /**
     * Return optimized image response
     *
     * @param string $imageData
     * @param string $mimeType
     * @param bool $fromCache
     * @return Response
     */
    private function returnOptimizedImage(string $imageData, string $mimeType, bool $fromCache): Response
    {
        $headers = [
            'Content-Type' => $mimeType,
            'Content-Length' => strlen($imageData),
            'Cache-Control' => 'public, max-age=31536000', // 1 year
            'X-Optimized' => 'true',
            'X-Cache-Hit' => $fromCache ? 'true' : 'false'
        ];

        return response($imageData, 200, $headers);
    }

    /**
     * Return original image as fallback
     *
     * @param string $path
     * @return Response
     */
    private function returnOriginalImage(string $path): Response
    {
        try {
            if (!Storage::disk('public')->exists($path)) {
                return response('Image not found', 404);
            }

            $imageData = Storage::disk('public')->get($path);
            $mimeType = Storage::disk('public')->mimeType($path);

            $headers = [
                'Content-Type' => $mimeType,
                'Content-Length' => strlen($imageData),
                'Cache-Control' => 'public, max-age=3600', // 1 hour
                'X-Optimized' => 'false',
                'X-Fallback' => 'true'
            ];

            return response($imageData, 200, $headers);
        } catch (\Exception $e) {
            Log::error('Failed to return original image: ' . $e->getMessage());
            return response('Image processing failed', 500);
        }
    }

    /**
     * Generate cache key for optimized image
     *
     * @param string $path
     * @param int $width
     * @param int $height
     * @param int $quality
     * @param string $format
     * @param string $fit
     * @return string
     */
    private function generateCacheKey(
        string $path, 
        int $width, 
        int $height, 
        int $quality, 
        string $format, 
        string $fit
    ): string {
        $pathHash = md5($path);
        return "img_opt_{$pathHash}_{$width}x{$height}_{$quality}_{$format}_{$fit}";
    }

    /**
     * Clear cache entries by pattern
     *
     * @param string $pattern
     * @return int
     */
    private function clearCacheByPattern(string $pattern): int
    {
        // This is a simplified implementation
        // In production, you might want to use Redis or another cache store
        // that supports pattern-based deletion
        
        $cleared = 0;
        
        // For file-based cache, we would need to scan cache directory
        // For Redis, we could use SCAN with pattern matching
        // For now, we'll just clear all optimization cache
        
        try {
            Cache::flush(); // This clears all cache - not ideal for production
            $cleared = 1; // Placeholder
        } catch (\Exception $e) {
            Log::error('Cache clear failed: ' . $e->getMessage());
        }

        return $cleared;
    }

    /**
     * Get cache size (simplified)
     *
     * @return int
     */
    private function getCacheSize(): int
    {
        // This would need proper implementation based on cache driver
        return 0; // Placeholder
    }

    /**
     * Get total optimizations count (simplified)
     *
     * @return int
     */
    private function getTotalOptimizations(): int
    {
        // This would need proper tracking implementation
        return 0; // Placeholder
    }

    /**
     * Get cache hit rate (simplified)
     *
     * @return float
     */
    private function getCacheHitRate(): float
    {
        // This would need proper tracking implementation
        return 0.85; // Placeholder
    }
}