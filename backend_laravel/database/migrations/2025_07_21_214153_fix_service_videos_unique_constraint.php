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
        Schema::table('service_videos', function (Blueprint $table) {
            // Drop the problematic unique constraint
            $table->dropUnique(['service_name', 'is_active']);
            
            // Add a simple unique constraint on service_name since we only want one video per service
            $table->unique('service_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('service_videos', function (Blueprint $table) {
            $table->dropUnique(['service_name']);
            $table->unique(['service_name', 'is_active']);
        });
    }
};
