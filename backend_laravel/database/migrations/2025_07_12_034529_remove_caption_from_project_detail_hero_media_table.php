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
        Schema::table('project_detail_hero_media', function (Blueprint $table) {
            $table->dropColumn('caption');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('project_detail_hero_media', function (Blueprint $table) {
            $table->text('caption')->nullable()->after('alt_text');
        });
    }
};