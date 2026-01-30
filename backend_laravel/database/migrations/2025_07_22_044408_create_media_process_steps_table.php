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
        Schema::create('media_process_steps', function (Blueprint $table) {
            $table->id();
            $table->string('step_number'); // e.g., "01", "02"
            $table->text('title');
            $table->text('subtitle');
            $table->text('image_path');
            $table->text('description_left');
            $table->text('description_right');
            $table->integer('order')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('media_process_steps');
    }
};
