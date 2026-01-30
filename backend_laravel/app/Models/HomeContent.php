<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class HomeContent extends Model
{
    use HasFactory;
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'hero_video_path',
        'hero_video_original_name',
        'hero_video_size',
        'hero_fallback_image_path',
        'is_active',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'hero_video_size' => 'integer',
        'is_active' => 'boolean',
    ];

    /**
     * Get the full URL for the hero video.
     *
     * @return string|null
     */
    public function getHeroVideoUrlAttribute(): ?string
    {
        if (!$this->hero_video_path) {
            return null;
        }

        return Storage::url($this->hero_video_path);
    }

    /**
     * Get the full URL for the hero fallback image.
     *
     * @return string|null
     */
    public function getHeroFallbackImageUrlAttribute(): ?string
    {
        if (!$this->hero_fallback_image_path) {
            return null;
        }

        return Storage::url($this->hero_fallback_image_path);
    }

    /**
     * Get formatted file size for the hero video.
     *
     * @return string|null
     */
    public function getFormattedVideoSizeAttribute(): ?string
    {
        if (!$this->hero_video_size) {
            return null;
        }

        $bytes = $this->hero_video_size;
        
        if ($bytes < 1024) {
            return $bytes . ' B';
        } elseif ($bytes < 1024 * 1024) {
            return round($bytes / 1024, 1) . ' KB';
        } else {
            return round($bytes / (1024 * 1024), 1) . ' MB';
        }
    }

    /**
     * Validate video file size (50MB limit).
     *
     * @param int $fileSize
     * @return bool
     */
    public static function validateVideoSize(int $fileSize): bool
    {
        return $fileSize <= 50 * 1024 * 1024; // 50MB in bytes
    }

    /**
     * Validate image file size (2MB limit).
     *
     * @param int $fileSize
     * @return bool
     */
    public static function validateImageSize(int $fileSize): bool
    {
        return $fileSize <= 2 * 1024 * 1024; // 2MB in bytes
    }

    /**
     * Get allowed video MIME types.
     *
     * @return array
     */
    public static function getAllowedVideoMimeTypes(): array
    {
        return [
            'video/mp4',
            'video/mpeg',
            'video/quicktime',
            'video/x-msvideo', // AVI
            'video/webm',
        ];
    }

    /**
     * Get allowed image MIME types.
     *
     * @return array
     */
    public static function getAllowedImageMimeTypes(): array
    {
        return [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'image/svg+xml',
            'text/xml', // Some SVG files
            'application/xml', // Some SVG files
        ];
    }

    /**
     * Clean up old video file when updating.
     *
     * @param string|null $oldVideoPath
     * @return void
     */
    public static function cleanupOldVideo(?string $oldVideoPath): void
    {
        if ($oldVideoPath && Storage::disk('public')->exists($oldVideoPath)) {
            Storage::disk('public')->delete($oldVideoPath);
        }
    }

    /**
     * Clean up old fallback image when updating.
     *
     * @param string|null $oldImagePath
     * @return void
     */
    public static function cleanupOldImage(?string $oldImagePath): void
    {
        if ($oldImagePath && Storage::disk('public')->exists($oldImagePath)) {
            Storage::disk('public')->delete($oldImagePath);
        }
    }

    /**
     * Get the active home content record.
     *
     * @return HomeContent|null
     */
    public static function getActive(): ?HomeContent
    {
        return static::where('is_active', true)->first();
    }

    /**
     * Set this record as the active one and deactivate others.
     *
     * @return void
     */
    public function setAsActive(): void
    {
        // Deactivate all other records
        static::where('id', '!=', $this->id)->update(['is_active' => false]);
        
        // Activate this record
        $this->update(['is_active' => true]);
    }

    /**
     * Store video file with proper naming and directory structure.
     *
     * @param \Illuminate\Http\UploadedFile $file
     * @return string The stored file path
     */
    public static function storeVideoFile($file): string
    {
        $timestamp = now()->format('Y-m-d_H-i-s');
        $extension = $file->getClientOriginalExtension();
        $filename = "hero-video-{$timestamp}.{$extension}";
        
        return $file->storeAs('home/hero-videos', $filename, 'public');
    }

    /**
     * Store fallback image file with proper naming and directory structure.
     *
     * @param \Illuminate\Http\UploadedFile $file
     * @return string The stored file path
     */
    public static function storeFallbackImage($file): string
    {
        $timestamp = now()->format('Y-m-d_H-i-s');
        $extension = $file->getClientOriginalExtension();
        $filename = "hero-fallback-{$timestamp}.{$extension}";
        
        return $file->storeAs('home/fallback-images', $filename, 'public');
    }

    /**
     * Check if video file exists in storage.
     *
     * @return bool
     */
    public function videoFileExists(): bool
    {
        return $this->hero_video_path && Storage::exists($this->hero_video_path);
    }

    /**
     * Check if fallback image file exists in storage.
     *
     * @return bool
     */
    public function fallbackImageExists(): bool
    {
        return $this->hero_fallback_image_path && Storage::exists($this->hero_fallback_image_path);
    }

    /**
     * Get video file metadata.
     *
     * @return array|null
     */
    public function getVideoMetadata(): ?array
    {
        if (!$this->videoFileExists()) {
            return null;
        }

        return [
            'path' => $this->hero_video_path,
            'url' => $this->hero_video_url,
            'original_name' => $this->hero_video_original_name,
            'size' => $this->hero_video_size,
            'formatted_size' => $this->formatted_video_size,
            'last_modified' => Storage::lastModified($this->hero_video_path),
            'mime_type' => Storage::mimeType($this->hero_video_path),
        ];
    }

    /**
     * Validate video file format by checking MIME type.
     *
     * @param \Illuminate\Http\UploadedFile $file
     * @return bool
     */
    public static function validateVideoFormat($file): bool
    {
        $mimeType = $file->getMimeType();
        return in_array($mimeType, static::getAllowedVideoMimeTypes());
    }

    /**
     * Validate image file format by checking MIME type.
     *
     * @param \Illuminate\Http\UploadedFile $file
     * @return bool
     */
    public static function validateImageFormat($file): bool
    {
        $mimeType = $file->getMimeType();
        return in_array($mimeType, static::getAllowedImageMimeTypes());
    }

    /**
     * Get file size limit for video files in bytes.
     *
     * @return int
     */
    public static function getVideoSizeLimit(): int
    {
        return 50 * 1024 * 1024; // 50MB
    }

    /**
     * Get file size limit for image files in bytes.
     *
     * @return int
     */
    public static function getImageSizeLimit(): int
    {
        return 2 * 1024 * 1024; // 2MB
    }

    /**
     * Clean up all files associated with this home content record.
     *
     * @return void
     */
    public function cleanupAllFiles(): void
    {
        static::cleanupOldVideo($this->hero_video_path);
        static::cleanupOldImage($this->hero_fallback_image_path);
    }

    /**
     * Get storage directory for hero videos.
     *
     * @return string
     */
    public static function getVideoStorageDirectory(): string
    {
        return 'home/hero-videos';
    }

    /**
     * Get storage directory for fallback images.
     *
     * @return string
     */
    public static function getFallbackImageStorageDirectory(): string
    {
        return 'home/fallback-images';
    }

    /**
     * Validate file name for security issues.
     *
     * @param string $filename
     * @return bool
     */
    public static function validateFileName(string $filename): bool
    {
        // Check for empty or too long filename
        if (empty($filename) || strlen($filename) > 255) {
            return false;
        }

        // Check for path traversal attempts
        if (strpos($filename, '..') !== false || 
            strpos($filename, '/') !== false || 
            strpos($filename, '\\') !== false) {
            return false;
        }

        // Check for null bytes
        if (strpos($filename, "\0") !== false) {
            return false;
        }

        // Check for control characters
        if (preg_match('/[\x00-\x1F\x7F]/', $filename)) {
            return false;
        }

        return true;
    }

    /**
     * Validate file extension matches expected type.
     *
     * @param \Illuminate\Http\UploadedFile $file
     * @param string $expectedType 'video' or 'image'
     * @return bool
     */
    public static function validateFileExtension($file, string $expectedType): bool
    {
        $extension = strtolower($file->getClientOriginalExtension());
        
        if ($expectedType === 'video') {
            $validExtensions = ['mp4', 'mov', 'avi', 'webm', 'ogg'];
            return in_array($extension, $validExtensions);
        }
        
        if ($expectedType === 'image') {
            $validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
            return in_array($extension, $validExtensions);
        }
        
        return false;
    }

    /**
     * Check if file appears to be corrupted or suspicious.
     *
     * @param \Illuminate\Http\UploadedFile $file
     * @return array|null Array of issues or null if file seems valid
     */
    public static function validateFileIntegrity($file): ?array
    {
        $issues = [];

        // Check if file size is reasonable (not 0 and not suspiciously small)
        $fileSize = $file->getSize();
        if ($fileSize === 0) {
            $issues[] = 'File is empty';
        } elseif ($fileSize < 1024) { // Less than 1KB
            $issues[] = 'File is suspiciously small';
        }

        // Check if MIME type matches file extension
        $mimeType = $file->getMimeType();
        $extension = strtolower($file->getClientOriginalExtension());
        
        $mimeExtensionMap = [
            'video/mp4' => ['mp4'],
            'video/quicktime' => ['mov'],
            'video/x-msvideo' => ['avi'],
            'video/webm' => ['webm'],
            'video/ogg' => ['ogg'],
            'image/jpeg' => ['jpg', 'jpeg'],
            'image/png' => ['png'],
            'image/gif' => ['gif'],
            'image/webp' => ['webp'],
            'image/svg+xml' => ['svg'],
            'text/xml' => ['svg'], // Some SVG files
            'application/xml' => ['svg'], // Some SVG files
        ];

        if (isset($mimeExtensionMap[$mimeType])) {
            if (!in_array($extension, $mimeExtensionMap[$mimeType])) {
                $issues[] = "MIME type ({$mimeType}) doesn't match file extension ({$extension})";
            }
        } else {
            // Don't report error for SVG with XML MIME types
            if ($extension !== 'svg') {
                $issues[] = "Unknown or unsupported MIME type: {$mimeType}";
            }
        }

        return empty($issues) ? null : $issues;
    }

    /**
     * Get comprehensive file validation errors.
     *
     * @param \Illuminate\Http\UploadedFile $file
     * @param string $type 'video' or 'image'
     * @return array Array of validation errors
     */
    public static function getFileValidationErrors($file, string $type): array
    {
        $errors = [];

        // Basic file validation
        if (!$file || !$file->isValid()) {
            $errors[] = 'Invalid file upload';
            return $errors;
        }

        // File name validation
        $filename = $file->getClientOriginalName();
        if (!static::validateFileName($filename)) {
            $errors[] = 'Invalid file name';
        }

        // File extension validation
        if (!static::validateFileExtension($file, $type)) {
            $validExtensions = $type === 'video' 
                ? ['MP4', 'MOV', 'AVI', 'WebM', 'OGG']
                : ['JPG', 'JPEG', 'PNG', 'GIF', 'WebP', 'SVG'];
            $errors[] = "Invalid file extension. Allowed: " . implode(', ', $validExtensions);
        }

        // File size validation
        if ($type === 'video' && !static::validateVideoSize($file->getSize())) {
            $errors[] = 'Video file size exceeds 50MB limit';
        } elseif ($type === 'image' && !static::validateImageSize($file->getSize())) {
            $errors[] = 'Image file size exceeds 2MB limit';
        }

        // MIME type validation
        if ($type === 'video' && !static::validateVideoFormat($file)) {
            $errors[] = 'Invalid video file format';
        } elseif ($type === 'image' && !static::validateImageFormat($file)) {
            $errors[] = 'Invalid image file format';
        }

        // File integrity validation
        $integrityIssues = static::validateFileIntegrity($file);
        if ($integrityIssues) {
            $errors = array_merge($errors, $integrityIssues);
        }

        return $errors;
    }

    /**
     * Check storage health and capacity.
     *
     * @return array Status information
     */
    public static function checkStorageHealth(): array
    {
        $status = [
            'healthy' => true,
            'issues' => [],
            'info' => []
        ];

        try {
            // Check video storage directory
            $videoDir = storage_path('app/public/' . static::getVideoStorageDirectory());
            if (!is_dir($videoDir)) {
                if (!mkdir($videoDir, 0755, true)) {
                    $status['healthy'] = false;
                    $status['issues'][] = 'Cannot create video storage directory';
                } else {
                    $status['info'][] = 'Created video storage directory';
                }
            }

            // Check image storage directory
            $imageDir = storage_path('app/public/' . static::getFallbackImageStorageDirectory());
            if (!is_dir($imageDir)) {
                if (!mkdir($imageDir, 0755, true)) {
                    $status['healthy'] = false;
                    $status['issues'][] = 'Cannot create image storage directory';
                } else {
                    $status['info'][] = 'Created image storage directory';
                }
            }

            // Check write permissions
            if (!is_writable($videoDir)) {
                $status['healthy'] = false;
                $status['issues'][] = 'Video storage directory is not writable';
            }

            if (!is_writable($imageDir)) {
                $status['healthy'] = false;
                $status['issues'][] = 'Image storage directory is not writable';
            }

            // Check disk space
            $freeBytes = disk_free_space(storage_path('app/public'));
            if ($freeBytes !== false) {
                $freeMB = round($freeBytes / (1024 * 1024));
                $status['info'][] = "Free disk space: {$freeMB} MB";
                
                if ($freeMB < 100) {
                    $status['healthy'] = false;
                    $status['issues'][] = 'Low disk space (less than 100MB available)';
                }
            }

        } catch (Exception $e) {
            $status['healthy'] = false;
            $status['issues'][] = 'Storage health check failed: ' . $e->getMessage();
        }

        return $status;
    }
}
