<?php

namespace Database\Seeders;

use App\Models\HomeContent;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\File;

class HomeContentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Ensure storage directories exist
        $this->ensureStorageDirectories();

        // Create default fallback image if it doesn't exist
        $this->createDefaultFallbackImage();

        // Create or update the default home content record
        HomeContent::updateOrCreate(
            ['is_active' => true],
            [
                'hero_video_path' => null,
                'hero_video_original_name' => null,
                'hero_video_size' => null,
                'hero_fallback_image_path' => 'home/fallback-images/default-hero-fallback.jpg',
                'is_active' => true,
            ]
        );

        $this->command->info('HomeContent seeder completed successfully.');
        $this->command->info('Default fallback image created at: storage/app/public/home/fallback-images/default-hero-fallback.jpg');
    }

    /**
     * Ensure required storage directories exist.
     */
    private function ensureStorageDirectories(): void
    {
        $directories = [
            'home/hero-videos',
            'home/fallback-images',
        ];

        foreach ($directories as $directory) {
            $fullPath = storage_path('app/public/' . $directory);
            if (!File::exists($fullPath)) {
                File::makeDirectory($fullPath, 0755, true);
                $this->command->info("Created directory: {$directory}");
            }
        }
    }

    /**
     * Create a default fallback image for development.
     */
    private function createDefaultFallbackImage(): void
    {
        $imagePath = 'home/fallback-images/default-hero-fallback.jpg';
        $fullPath = storage_path('app/public/' . $imagePath);

        // Only create if it doesn't exist
        if (!File::exists($fullPath)) {
            // Create a simple placeholder image using GD (if available) or copy from existing assets
            $this->createPlaceholderImage($fullPath);
        }
    }

    /**
     * Create a placeholder image for the hero fallback.
     */
    private function createPlaceholderImage(string $fullPath): void
    {
        // Check if GD extension is available
        if (extension_loaded('gd')) {
            $this->createGDPlaceholderImage($fullPath);
        } else {
            // Fallback: try to copy from existing project images or create a simple file
            $this->createSimplePlaceholderImage($fullPath);
        }
    }

    /**
     * Create placeholder image using GD extension.
     */
    private function createGDPlaceholderImage(string $fullPath): void
    {
        try {
            // Create a 1920x1080 image (16:9 aspect ratio)
            $width = 1920;
            $height = 1080;
            $image = imagecreatetruecolor($width, $height);

            // Set background color (dark gray)
            $backgroundColor = imagecolorallocate($image, 45, 45, 45);
            imagefill($image, 0, 0, $backgroundColor);

            // Set text color (white)
            $textColor = imagecolorallocate($image, 255, 255, 255);

            // Add text
            $text = 'Hero Video Placeholder';
            $fontSize = 5; // Built-in font size
            $textWidth = imagefontwidth($fontSize) * strlen($text);
            $textHeight = imagefontheight($fontSize);
            $x = ($width - $textWidth) / 2;
            $y = ($height - $textHeight) / 2;

            imagestring($image, $fontSize, $x, $y, $text, $textColor);

            // Add subtitle
            $subtitle = 'Upload a video to replace this image';
            $subtitleWidth = imagefontwidth(3) * strlen($subtitle);
            $subtitleX = ($width - $subtitleWidth) / 2;
            $subtitleY = $y + 40;
            imagestring($image, 3, $subtitleX, $subtitleY, $subtitle, $textColor);

            // Save as JPEG
            imagejpeg($image, $fullPath, 85);
            imagedestroy($image);

            $this->command->info('Created GD placeholder image for hero fallback.');
        } catch (Exception $e) {
            $this->command->warn('Failed to create GD placeholder image: ' . $e->getMessage());
            $this->createSimplePlaceholderImage($fullPath);
        }
    }

    /**
     * Create a simple placeholder by copying from existing assets or creating minimal file.
     */
    private function createSimplePlaceholderImage(string $fullPath): void
    {
        // Try to find an existing image to copy
        $possibleSources = [
            storage_path('app/public/projects/main'),
            storage_path('app/public/projects/page'),
            storage_path('app/public/blog'),
        ];

        $copiedImage = false;
        foreach ($possibleSources as $sourceDir) {
            if (File::exists($sourceDir)) {
                $images = File::glob($sourceDir . '/*.{jpg,jpeg,png,gif}', GLOB_BRACE);
                if (!empty($images)) {
                    File::copy($images[0], $fullPath);
                    $copiedImage = true;
                    $this->command->info('Copied existing image as hero fallback placeholder.');
                    break;
                }
            }
        }

        // If no image found, create a minimal placeholder file
        if (!$copiedImage) {
            // Create a minimal valid JPEG file (1x1 pixel)
            $minimalJpeg = base64_decode('/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A');
            File::put($fullPath, $minimalJpeg);
            $this->command->info('Created minimal placeholder image for hero fallback.');
        }
    }
}