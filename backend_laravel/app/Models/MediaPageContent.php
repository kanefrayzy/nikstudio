<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MediaPageContent extends Model
{
    protected $table = 'media_page_content';

    protected $fillable = [
        'hero_title',
        'hero_description',
        'testimonials_title',
        'testimonials_subtitle',
        'process_title',
        'process_subtitle'
    ];
}
