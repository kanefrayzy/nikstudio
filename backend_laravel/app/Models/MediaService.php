<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MediaService extends Model
{
    protected $fillable = [
        'title',
        'description',
        'order',
        'dark_background'
    ];

    protected $casts = [
        'dark_background' => 'boolean'
    ];

    /**
     * Get the features for the service.
     */
    public function features(): HasMany
    {
        return $this->hasMany(MediaServiceFeature::class, 'service_id')->orderBy('order');
    }

    /**
     * Get the media items for the service.
     */
    public function mediaItems(): HasMany
    {
        return $this->hasMany(MediaServiceMedia::class, 'service_id')->orderBy('order');
    }

    /**
     * Scope to order services by their order field.
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('order');
    }
}
