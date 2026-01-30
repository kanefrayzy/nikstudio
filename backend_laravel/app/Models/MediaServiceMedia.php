<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MediaServiceMedia extends Model
{
    protected $table = 'media_service_media';

    protected $fillable = [
        'service_id',
        'group_id',
        'media_type',
        'file_type',
        'file_path',
        'poster_path',
        'alt_text',
        'order'
    ];

    /**
     * Get the service that owns the media.
     */
    public function service(): BelongsTo
    {
        return $this->belongsTo(MediaService::class, 'service_id');
    }

    /**
     * Scope to order media by their order field.
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('order');
    }

    /**
     * Scope to get media by group.
     */
    public function scopeByGroup($query, $groupId)
    {
        return $query->where('group_id', $groupId);
    }

    /**
     * Scope to get main media items.
     */
    public function scopeMain($query)
    {
        return $query->where('media_type', 'main');
    }

    /**
     * Scope to get secondary media items.
     */
    public function scopeSecondary($query)
    {
        return $query->where('media_type', 'secondary');
    }
}
