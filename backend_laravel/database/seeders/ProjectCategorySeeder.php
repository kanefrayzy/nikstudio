<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ProjectCategory;
use Illuminate\Support\Str;

class ProjectCategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            'Веб-разработка',
            'Мобильные приложения', 
            'Дизайн интерфейсов',
            'Брендинг',
            'Маркетинг'
        ];

        foreach ($categories as $index => $categoryName) {
            ProjectCategory::firstOrCreate(
                ['name' => $categoryName],
                [
                    'slug' => Str::slug($categoryName),
                    'sort_order' => $index + 1
                ]
            );
        }
    }
}