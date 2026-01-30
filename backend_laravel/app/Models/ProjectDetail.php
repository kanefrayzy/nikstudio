<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProjectDetail extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'title',
        'subtitle',
        'client',
        'year',
    ];

    // Связь с основным проектом
    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    // Связь с блоками контента
    public function blocks()
    {
        return $this->hasMany(ProjectDetailBlock::class)->orderBy('order');
    }

    // Связь с медиа-файлами героической секции
    public function heroMediaItems()
    {
        return $this->hasMany(ProjectDetailHeroMedia::class)->orderBy('group_id')->orderBy('id');
    }

    // Получить медиа-элементы героической секции в формате галереи
    public function getHeroGalleryData()
    {
        return ProjectDetailHeroMedia::getHeroGalleryData($this->id);
    }
}