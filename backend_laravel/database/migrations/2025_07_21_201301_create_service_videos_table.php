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
        Schema::create('service_videos', function (Blueprint $table) {
            $table->id();
            $table->string('service_name')->index(); // e.g., 'video_production'
            $table->string('video_path')->nullable();
            $table->string('video_original_name')->nullable();
            $table->bigInteger('video_size')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            // Ensure only one active video per service
            $table->unique(['service_name', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('service_videos');
    }
};
