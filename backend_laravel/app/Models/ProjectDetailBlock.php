<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProjectDetailBlock extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_detail_id',
        'title',
        'subtitle',
        'content',
        'order',  // Добавлено поле order
    ];

    // Связь с внутренней страницей проекта
    public function projectDetail()
    {
        return $this->belongsTo(ProjectDetail::class);
    }

    // Связь с медиа-файлами карусели
    public function mediaItems()
    {
        return $this->hasMany(ProjectDetailBlockMedia::class)->orderBy('order');
    }
}