<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class BlogPost extends Model
{
    use HasFactory;

    protected $fillable = [
        'image',
        'position',
        'title',
        'description',
        'slug', // Добавили slug в fillable
        'sort_order', // Добавили sort_order в fillable
        'seo_title',
        'seo_description',
        'seo_image',
    ];

    public function blocks()
    {
        return $this->hasMany(BlogPostBlock::class);
    }

    // Автоматическая генерация slug при создании и обновлении
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($post) {
            $post->slug = Str::slug(self::transliterate($post->title));
        });

        static::updating(function ($post) {
            $post->slug = Str::slug(self::transliterate($post->title));
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
