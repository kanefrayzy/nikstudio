<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('project_details', function (Blueprint $table) {
            $table->dropColumn(['services', 'meta_title', 'meta_description', 'is_published']);
        });
    }

    public function down()
    {
        Schema::table('project_details', function (Blueprint $table) {
            $table->json('services')->nullable();
            $table->string('meta_title')->nullable();
            $table->text('meta_description')->nullable();
            $table->boolean('is_published')->default(true);
        });
    }
};