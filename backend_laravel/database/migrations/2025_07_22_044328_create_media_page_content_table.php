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
        Schema::create('media_page_content', function (Blueprint $table) {
            $table->id();
            $table->text('hero_title')->nullable();
            $table->text('hero_description')->nullable();
            $table->text('testimonials_title')->nullable();
            $table->text('testimonials_subtitle')->nullable();
            $table->text('process_title')->nullable();
            $table->text('process_subtitle')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('media_page_content');
    }
};
