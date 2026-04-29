<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('project_detail_blocks', function (Blueprint $table) {
            // 'carousel' (default, swipe gallery) | 'collage' (cube preview + expandable rest)
            $table->string('gallery_layout', 32)->default('carousel')->after('content');
        });
    }

    public function down(): void
    {
        Schema::table('project_detail_blocks', function (Blueprint $table) {
            $table->dropColumn('gallery_layout');
        });
    }
};
