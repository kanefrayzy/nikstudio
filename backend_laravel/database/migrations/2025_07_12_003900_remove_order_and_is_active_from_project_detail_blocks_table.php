<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('project_detail_blocks', function (Blueprint $table) {
            $table->dropColumn(['order', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::table('project_detail_blocks', function (Blueprint $table) {
            $table->integer('order')->nullable(); // Укажи тип и nullable, если раньше было
            $table->boolean('is_active')->default(true); // Или исходное значение
        });
    }
};
