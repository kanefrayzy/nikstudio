<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProjectDetailHeroMedia extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_detail_id',
        'group_id', // ID группы для связи элементов (например, для double типа)
        'group_type', // 'single' или 'double'
        'file_path',
        'file_type', // 'image' или 'video'
        'alt_text',
        'poster_path', // для видео - путь к постеру/превью
    ];

    // Связь с детальной информацией проекта
    public function projectDetail()
    {
        return $this->belongsTo(ProjectDetail::class);
    }

    // Scope для изображений
    public function scopeImages($query)
    {
        return $query->where('file_type', 'image');
    }

    // Scope для видео
    public function scopeVideos($query)
    {
        return $query->where('file_type', 'video');
    }

    // Scope для одиночных элементов
    public function scopeSingle($query)
    {
        return $query->where('group_type', 'single');
    }

    // Scope для двойных элементов
    public function scopeDouble($query)
    {
        return $query->where('group_type', 'double');
    }

    // Scope для конкретной группы
    public function scopeByGroup($query, $groupId)
    {
        return $query->where('group_id', $groupId);
    }

    // Получить полный URL файла
    public function getFileUrlAttribute()
    {
        return asset('storage/' . $this->file_path);
    }

    // Получить полный URL постера
    public function getPosterUrlAttribute()
    {
        return $this->poster_path ? asset('storage/' . $this->poster_path) : null;
    }

    // Получить структуру данных в формате фронтенда
    public function toFrontendFormat()
    {
        return [
            'type' => $this->file_type,
            'src' => $this->file_url,
            'alt' => $this->alt_text,
            'poster' => $this->poster_url,
        ];
    }

    // Статический метод для получения данных в формате галереи для героической секции
    public static function getHeroGalleryData($projectDetailId)
    {
        $mediaItems = static::where('project_detail_id', $projectDetailId)
            ->get()
            ->groupBy('group_id');

        $galleryData = [];
        
        foreach ($mediaItems as $groupId => $groupItems) {
            $firstItem = $groupItems->first();
            
            $galleryData[] = [
                'id' => $groupId,
                'type' => $firstItem->group_type,
                'items' => $groupItems->map(function ($item) {
                    return $item->toFrontendFormat();
                })->toArray(),
            ];
        }

        return $galleryData;
    }
}