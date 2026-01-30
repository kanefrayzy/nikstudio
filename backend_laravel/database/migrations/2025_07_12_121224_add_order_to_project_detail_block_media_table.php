<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('project_detail_block_media', function (Blueprint $table) {
            $table->integer('order')->default(0)->after('poster_path');
        });
    }

    public function down()
    {
        Schema::table('project_detail_block_media', function (Blueprint $table) {
            $table->dropColumn('order');
        });
    }
};