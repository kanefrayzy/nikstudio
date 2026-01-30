<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('project_detail_hero_media', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_detail_id')->constrained('project_details')->onDelete('cascade');
            $table->string('group_id')->nullable(); // ID группы для связи элементов
            $table->enum('group_type', ['single', 'double'])->default('single');
            $table->string('file_path');
            $table->enum('file_type', ['image', 'video'])->default('image');
            $table->string('alt_text')->nullable();
            $table->text('caption')->nullable();
            $table->string('poster_path')->nullable(); // для видео - путь к постеру/превью
            $table->integer('order')->default(0); // порядок внутри группы
            $table->integer('group_order')->default(0); // порядок группы в героической секции
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            // Индексы для оптимизации запросов
            $table->index(['project_detail_id', 'is_active']);
            $table->index(['project_detail_id', 'group_order', 'order']);
            $table->index(['project_detail_id', 'group_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_detail_hero_media');
    }
};