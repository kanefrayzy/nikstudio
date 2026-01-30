<?php

namespace Database\Factories;

use App\Models\HomeContent;
use Illuminate\Database\Eloquent\Factories\Factory;

class HomeContentFactory extends Factory
{
    protected $model = HomeContent::class;

    public function definition()
    {
        return [
            'hero_video_path' => null,
            'hero_video_original_name' => null,
            'hero_video_size' => null,
            'hero_fallback_image_path' => 'home/fallback-images/default-hero-fallback.jpg',
            'is_active' => true,
        ];
    }

    /**
     * Create a factory state with video data for testing.
     */
    public function withVideo()
    {
        return $this->state(function (array $attributes) {
            return [
                'hero_video_path' => 'home/hero-videos/sample-hero-video.mp4',
                'hero_video_original_name' => 'sample-hero-video.mp4',
                'hero_video_size' => 15 * 1024 * 1024, // 15MB
            ];
        });
    }

    /**
     * Create a factory state with large video for testing size limits.
     */
    public function withLargeVideo()
    {
        return $this->state(function (array $attributes) {
            return [
                'hero_video_path' => 'home/hero-videos/large-hero-video.mp4',
                'hero_video_original_name' => 'large-hero-video.mp4',
                'hero_video_size' => 45 * 1024 * 1024, // 45MB
            ];
        });
    }

    /**
     * Create a factory state for inactive content.
     */
    public function inactive()
    {
        return $this->state(function (array $attributes) {
            return [
                'is_active' => false,
            ];
        });
    }

    /**
     * Create a factory state with custom fallback image.
     */
    public function withCustomFallback(string $imagePath)
    {
        return $this->state(function (array $attributes) use ($imagePath) {
            return [
                'hero_fallback_image_path' => $imagePath,
            ];
        });
    }
}