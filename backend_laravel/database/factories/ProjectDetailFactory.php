<?php

namespace Database\Factories;

use App\Models\ProjectDetail;
use App\Models\Project;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProjectDetailFactory extends Factory
{
    protected $model = ProjectDetail::class;

    public function definition()
    {
        return [
            'project_id' => Project::factory(),
            'title' => $this->faker->sentence(4),
            'subtitle' => $this->faker->sentence(6),
            'client' => $this->faker->company(),
            'year' => $this->faker->numberBetween(2020, 2024),
        ];
    }
}