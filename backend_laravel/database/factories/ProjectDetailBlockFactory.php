<?php

namespace Database\Factories;

use App\Models\ProjectDetailBlock;
use App\Models\ProjectDetail;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProjectDetailBlockFactory extends Factory
{
    protected $model = ProjectDetailBlock::class;

    public function definition()
    {
        return [
            'project_detail_id' => ProjectDetail::factory(),
            'type' => $this->faker->randomElement(['text', 'image', 'video', 'gallery']),
            'content' => $this->faker->paragraphs(3, true),
            'order' => $this->faker->numberBetween(1, 10),
        ];
    }
}