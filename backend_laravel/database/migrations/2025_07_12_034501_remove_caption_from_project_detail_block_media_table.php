<?php

// Миграция 1: remove_caption_from_project_detail_block_media_table.php
// Создать командой: php artisan make:migration remove_caption_from_project_detail_block_media_table --table=project_detail_block_media

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
        Schema::table('project_detail_block_media', function (Blueprint $table) {
            $table->dropColumn('caption');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('project_detail_block_media', function (Blueprint $table) {
            $table->text('caption')->nullable()->after('alt_text');
        });
    }
};