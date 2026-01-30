<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MediaTestimonial extends Model
{
    protected $fillable = [
        'company',
        'quote',
        'description',
        'image_path',
        'order'
    ];

    /**
     * Scope to order testimonials by their order field.
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('order');
    }
}
