<?php

namespace Database\Factories;

use App\Models\Project;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class ProjectFactory extends Factory
{
    protected $model = Project::class;

    public function definition()
    {
        $title = $this->faker->sentence(3);
        
        return [
            'main_title' => $title,
            'projects_page_title' => $title,
            'slug' => Str::slug($title),
            'year' => $this->faker->numberBetween(2020, 2024),
            'main_image' => '/storage/projects/main/test-image.jpg',
            'projects_page_image' => '/storage/projects/page/test-image.jpg',
            'logo' => '/storage/projects/logos/test-logo.jpg',
        ];
    }
}