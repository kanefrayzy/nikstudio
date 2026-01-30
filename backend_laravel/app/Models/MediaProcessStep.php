<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MediaProcessStep extends Model
{
    protected $fillable = [
        'step_number',
        'title',
        'subtitle',
        'image_path',
        'description_left',
        'description_right',
        'order'
    ];

    /**
     * Scope to order process steps by their order field.
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('order');
    }
}
