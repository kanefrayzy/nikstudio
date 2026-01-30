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
            $table->enum('group_type', ['single', 'double'])->default('single')->after('group_id')->comment('Тип группы');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('project_detail_block_media', function (Blueprint $table) {
            $table->dropColumn('group_type');
        });
    }
};
