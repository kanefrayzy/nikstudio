<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProjectCategory extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'sort_order'
    ];

    protected $casts = [
        'sort_order' => 'integer'
    ];

    // Связь многие ко многим с проектами
    public function projects()
    {
        return $this->belongsToMany(Project::class, 'project_project_category');
    }

    // Scope для сортировки
    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order', 'asc');
    }
}