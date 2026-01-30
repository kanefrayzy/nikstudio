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
        Schema::create('media_service_features', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_id')->constrained('media_services')->onDelete('cascade');
            $table->text('title');
            $table->json('description'); // Array of paragraphs
            $table->integer('order')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('media_service_features');
    }
};
