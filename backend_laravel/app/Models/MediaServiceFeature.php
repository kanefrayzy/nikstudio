<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MediaServiceFeature extends Model
{
    protected $fillable = [
        'service_id',
        'title',
        'description',
        'order'
    ];

    protected $casts = [
        'description' => 'array'
    ];

    /**
     * Get the service that owns the feature.
     */
    public function service(): BelongsTo
    {
        return $this->belongsTo(MediaService::class, 'service_id');
    }

    /**
     * Scope to order features by their order field.
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('order');
    }
}
