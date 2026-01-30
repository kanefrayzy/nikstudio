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
            // Собираем массив столбцов для удаления, которые действительно существуют
            $columnsToDrop = [];
            
            if (Schema::hasColumn('project_detail_block_media', 'order')) {
                $columnsToDrop[] = 'order';
            }
            
            if (Schema::hasColumn('project_detail_block_media', 'group_order')) {
                $columnsToDrop[] = 'group_order';
            }
            
            if (Schema::hasColumn('project_detail_block_media', 'is_active')) {
                $columnsToDrop[] = 'is_active';
            }
            
            // Удаляем столбцы только если они существуют
            if (!empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('project_detail_block_media', function (Blueprint $table) {
            // При откате добавляем обратно только те столбцы, которые реально были удалены
            // Исходя из структуры таблицы, в ней были только 'order' и 'is_active'
            
            if (!Schema::hasColumn('project_detail_block_media', 'order')) {
                $table->integer('order')->default(0);
            }
            
            if (!Schema::hasColumn('project_detail_block_media', 'is_active')) {
                $table->boolean('is_active')->default(true);
            }
            
            // Убрали добавление 'group_order' поскольку изначально этой колонки не было
        });
    }
};