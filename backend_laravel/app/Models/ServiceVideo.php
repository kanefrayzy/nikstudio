<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ServiceVideo extends Model
{
    use HasFactory;

    protected $fillable = [
        'service_name',
        'video_path',
        'video_original_name',
        'video_size',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'video_size' => 'integer',
    ];

    protected $appends = [
        'video_url',
        'formatted_video_size',
    ];

    // Constants for validation
    const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
    const ALLOWED_VIDEO_EXTENSIONS = ['mp4', 'webm', 'mov', 'avi'];
    const ALLOWED_VIDEO_MIME_TYPES = [
        'video/mp4',
        'video/webm',
        'video/quicktime',
        'video/x-msvideo',
        'video/avi'
    ];

    /**
     * Get the video URL attribute
     */
    public function getVideoUrlAttribute(): ?string
    {
        if (!$this->video_path) {
            return null;
        }

        // Remove /storage/ prefix if present to avoid double prefix
        $cleanPath = ltrim($this->video_path, '/');
        $cleanPath = preg_replace('/^storage\//', '', $cleanPath);
        
        return Storage::disk('public')->url($cleanPath);
    }

    /**
     * Get formatted video size
     */
    public function getFormattedVideoSizeAttribute(): ?string
    {
        if (!$this->video_size) {
            return null;
        }

        return $this->formatFileSize($this->video_size);
    }

    /**
     * Format file size in human readable format
     */
    private function formatFileSize(int $bytes): string
    {
        if ($bytes >= 1024 * 1024) {
            return round($bytes / (1024 * 1024), 1) . ' MB';
        } elseif ($bytes >= 1024) {
            return round($bytes / 1024, 1) . ' KB';
        } else {
            return $bytes . ' B';
        }
    }

    /**
     * Get active service video by service name
     */
    public static function getActiveByService(string $serviceName): ?self
    {
        return static::where('service_name', $serviceName)->first();
    }

    /**
     * Store video file
     */
    public static function storeVideoFile(UploadedFile $file): string
    {
        $directory = 'services/videos';
        $filename = 'service-video-' . Str::random(10) . '.' . $file->getClientOriginalExtension();
        
        return $file->storeAs($directory, $filename, 'public');
    }

    /**
     * Validate video file size
     */
    public static function validateVideoSize(int $size): bool
    {
        return $size <= self::MAX_VIDEO_SIZE;
    }

    /**
     * Validate video file format
     */
    public static function validateVideoFormat(UploadedFile $file): bool
    {
        $extension = strtolower($file->getClientOriginalExtension());
        $mimeType = $file->getMimeType();
        
        return in_array($extension, self::ALLOWED_VIDEO_EXTENSIONS) &&
               in_array($mimeType, self::ALLOWED_VIDEO_MIME_TYPES);
    }

    /**
     * Clean up old video file
     */
    public static function cleanupOldVideo(?string $videoPath): void
    {
        if ($videoPath && Storage::disk('public')->exists($videoPath)) {
            Storage::disk('public')->delete($videoPath);
        }
    }

    /**
     * Get video size limit
     */
    public static function getVideoSizeLimit(): int
    {
        return self::MAX_VIDEO_SIZE;
    }

    /**
     * Get allowed video MIME types
     */
    public static function getAllowedVideoMimeTypes(): array
    {
        return self::ALLOWED_VIDEO_MIME_TYPES;
    }

    /**
     * Get video storage directory
     */
    public static function getVideoStorageDirectory(): string
    {
        return 'services/videos';
    }
}