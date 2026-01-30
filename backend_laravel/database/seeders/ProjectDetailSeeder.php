<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Project;
use App\Models\ProjectDetail;

class ProjectDetailSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Найдем проект с slug 'ikar' или создадим его
        $project = Project::where('slug', 'ikar')->first();
        
        if (!$project) {
            $project = Project::create([
                'main_title' => 'ИКАР',
                'projects_page_title' => 'ИКАР - Авиационные технологии',
                'year' => 2023,
                'slug' => 'ikar',
                'main_image' => '/storage/projects/main/ikar-main.jpg',
                'projects_page_image' => '/storage/projects/page/ikar-page.jpg',
                'logo' => '/storage/projects/logos/ikar-logo.png',
            ]);
        }

        // Создаем детальную информацию о проекте
        ProjectDetail::updateOrCreate(
            ['project_id' => $project->id],
            [
                'title' => 'ИКАР',
                'subtitle' => 'Полная подготовка и сопровождение нескольких отраслевых выставок',
                'client' => 'ГК «ИКАР», Корпорация «АФК Система»',
                'year' => 2023,
            ]
        );
    }
}