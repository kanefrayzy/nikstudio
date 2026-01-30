<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Project extends Model
{
    use HasFactory;

    protected $fillable = [
        'main_image',
        'projects_page_image',
        'logo',
        'main_title',
        'projects_page_title',
        'year',
        'slug',
        'seo_title',
        'seo_description',
        'seo_image',
    ];

    // Связь многие ко многим с категориями
    public function categories()
    {
        return $this->belongsToMany(ProjectCategory::class, 'project_project_category');
    }

    // Для обратной совместимости - возвращает первую категорию
    public function category()
    {
        return $this->categories()->first();
    }

    // Связь с внутренней страницей проекта
    public function detail()
    {
        return $this->hasOne(ProjectDetail::class);
    }

    // Проверка наличия внутренней страницы
    public function hasDetail()
    {
        return $this->detail()->exists();
    }

    // Автоматическая генерация slug при создании и обновлении
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($project) {
            $project->slug = Str::slug(self::transliterate($project->main_title));
        });

        static::updating(function ($project) {
            $project->slug = Str::slug(self::transliterate($project->main_title));
        });
    }

    // Кастомная транслитерация русского текста в латиницу
    protected static function transliterate($text)
    {
        $map = [
            'а'=>'a','б'=>'b','в'=>'v','г'=>'g','д'=>'d',
            'е'=>'e','ё'=>'e','ж'=>'zh','з'=>'z','и'=>'i',
            'й'=>'y','к'=>'k','л'=>'l','м'=>'m','н'=>'n',
            'о'=>'o','п'=>'p','р'=>'r','с'=>'s','т'=>'t',
            'у'=>'u','ф'=>'f','х'=>'h','ц'=>'ts','ч'=>'ch',
            'ш'=>'sh','щ'=>'sch','ъ'=>'','ы'=>'y','ь'=>'',
            'э'=>'e','ю'=>'yu','я'=>'ya',
            ' '=>'-'
        ];

        return mb_strtolower(strtr($text, $map));
    }
}