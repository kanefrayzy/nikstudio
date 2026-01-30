<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Для PostgreSQL - исправляем последовательность ID, устанавливая значение на максимальное + 1
        if (DB::getDriverName() === 'pgsql') {
            // Получаем максимальное ID из таблицы
            $max_id = DB::table('blog_posts')->max('id') ?? 0;
            
            // Устанавливаем последовательность на максимальное значение + 1
            DB::statement("ALTER SEQUENCE blog_posts_id_seq RESTART WITH " . ($max_id + 1));
            
            // Логируем информацию в файл
            \Log::info('Последовательность blog_posts_id_seq исправлена', [
                'max_id' => $max_id,
                'new_sequence_value' => $max_id + 1
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // В down() ничего не делаем, так как это исправление
    }
};
