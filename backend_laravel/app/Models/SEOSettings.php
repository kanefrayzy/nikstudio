<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SEOSettings extends Model
{
    use HasFactory;

    protected $table = 'seo_settings';

    protected $fillable = [
        'site_title',
        'site_description',
        'default_image',
        'twitter_card_type',
        'facebook_app_id'
    ];

    /**
     * Get global SEO settings (returns first record or creates default)
     */
    public static function getGlobalSettings(): array
    {
        $settings = self::first();
        
        if (!$settings) {
            $settings = self::create([
                'site_title' => 'NIK Studio',
                'site_description' => 'Портфолио и проекты NIK Studio',
                'twitter_card_type' => 'summary_large_image'
            ]);
        }

        return $settings->toArray();
    }

    /**
     * Update global SEO settings
     */
    public function updateGlobalSettings(array $data): bool
    {
        $settings = self::first();
        
        if (!$settings) {
            $settings = new self();
        }

        return $settings->fill($data)->save();
    }

    /**
     * Get settings for metadata generation
     */
    public static function getForMetadata(): self
    {
        $settings = self::first();
        
        if (!$settings) {
            $settings = self::create([
                'site_title' => 'NIK Studio',
                'site_description' => 'Портфолио и проекты NIK Studio',
                'twitter_card_type' => 'summary_large_image'
            ]);
        }

        return $settings;
    }
}
