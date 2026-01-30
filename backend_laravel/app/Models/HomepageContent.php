<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class HomepageContent extends Model
{
    use HasFactory;

    protected $table = 'homepage_content';

    protected $fillable = [
        'section',
        'content_type',
        'content_key',
        'content_value',
        'order_index',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
        'order_index' => 'integer',
    ];

    /**
     * Scope to filter by section
     */
    public function scopeBySection($query, string $section)
    {
        return $query->where('section', $section);
    }

    /**
     * Scope to filter by content type
     */
    public function scopeByType($query, string $type)
    {
        return $query->where('content_type', $type);
    }

    /**
     * Scope to order by order_index
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('order_index', 'asc');
    }

    /**
     * Check if content is an image
     */
    public function isImage(): bool
    {
        return $this->content_type === 'image';
    }

    /**
     * Check if content is text
     */
    public function isText(): bool
    {
        return $this->content_type === 'text';
    }

    /**
     * Get the full image URL
     */
    public function getImageUrl(): string
    {
        if (!$this->isImage()) {
            return '';
        }

        $path = $this->content_value;
        
        // If it's already a full URL, return as is
        if (str_starts_with($path, 'http')) {
            return $path;
        }
        
        // If it starts with /images/, return as is (public path)
        if (str_starts_with($path, '/images/')) {
            return $path;
        }
        
        // Otherwise, it's a storage path
        return asset('storage/' . $path);
    }
}
