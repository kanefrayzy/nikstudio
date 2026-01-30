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
        Schema::create('media_service_media', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_id')->constrained('media_services')->onDelete('cascade');
            $table->integer('group_id'); // For pairing main/secondary images
            $table->enum('media_type', ['main', 'secondary']);
            $table->enum('file_type', ['image', 'video']);
            $table->text('file_path');
            $table->text('poster_path')->nullable(); // For videos
            $table->text('alt_text')->nullable();
            $table->integer('order')->default(0);
            $table->timestamps();
            
            // Index for efficient querying
            $table->index(['service_id', 'group_id', 'order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('media_service_media');
    }
};
