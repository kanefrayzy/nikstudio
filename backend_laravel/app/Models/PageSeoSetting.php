<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PageSeoSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'page_type',
        'seo_title',
        'seo_description',
        'seo_image',
        'seo_keywords',
        'canonical_url',
        'is_active',
    ];

    protected $casts = [
        'seo_keywords' => 'array',
        'is_active' => 'boolean',
    ];

    // Константы для типов страниц
    const PAGE_TYPES = [
        'home' => 'Главная страница',
        'projects_list' => 'Список проектов',
        'blog_list' => 'Список блога',
        'media' => 'Медиа',
    ];

    /**
     * Получить SEO-настройки для конкретного типа страницы
     */
    public static function getForPageType(string $pageType): ?self
    {
        return self::where('page_type', $pageType)
                   ->where('is_active', true)
                   ->first();
    }

    /**
     * Создать или обновить SEO-настройки для типа страницы
     */
    public static function updateForPageType(string $pageType, array $data): self
    {
        return self::updateOrCreate(
            ['page_type' => $pageType],
            $data
        );
    }
}