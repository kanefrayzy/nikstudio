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
        Schema::table('project_detail_block_media', function (Blueprint $table) {
            // Проверяем, существует ли столбец group_id перед добавлением
            if (!Schema::hasColumn('project_detail_block_media', 'group_id')) {
                $table->unsignedBigInteger('group_id')->nullable()->after('project_detail_block_id')->comment('ID группы для связи элементов (например, для double типа)');
            }
            
            // Проверяем, существует ли столбец poster_path перед добавлением
            if (!Schema::hasColumn('project_detail_block_media', 'poster_path')) {
                $table->string('poster_path')->nullable()->after('alt_text')->comment('для видео - путь к постеру/превью');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('project_detail_block_media', function (Blueprint $table) {
            $table->dropColumn(['group_id', 'poster_path']);
        });
    }
};
