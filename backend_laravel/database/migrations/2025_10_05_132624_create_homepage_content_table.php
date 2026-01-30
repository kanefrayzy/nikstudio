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
        Schema::create('homepage_content', function (Blueprint $table) {
            $table->id();
            $table->string('section', 100);
            $table->enum('content_type', ['text', 'image']);
            $table->string('content_key', 100);
            $table->text('content_value');
            $table->integer('order_index')->default(0);
            $table->json('metadata')->nullable();
            $table->timestamps();
            
            // Unique constraint on section and content_key combination
            $table->unique(['section', 'content_key'], 'homepage_content_section_key_unique');
            
            // Indexes for query optimization
            $table->index('section', 'homepage_content_section_index');
            $table->index('content_type', 'homepage_content_type_index');
            $table->index('order_index', 'homepage_content_order_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('homepage_content');
    }
};
