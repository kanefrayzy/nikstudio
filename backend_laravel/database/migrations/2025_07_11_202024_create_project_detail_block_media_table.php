<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('project_detail_block_media', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_detail_block_id')->constrained()->onDelete('cascade');
            $table->string('file_path');
            $table->enum('file_type', ['image', 'video'])->default('image');
            $table->string('alt_text')->nullable();
            $table->text('caption')->nullable();
            $table->integer('order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('project_detail_block_media');
    }
};
