<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BlogPostBlock extends Model
{
    use HasFactory;

    protected $fillable = [
        'blog_post_id',
        'title',
        'paragraph_1',
        'paragraph_2',
        'paragraph_3',
    ];

    public function post()
    {
        return $this->belongsTo(BlogPost::class, 'blog_post_id');
    }
}
