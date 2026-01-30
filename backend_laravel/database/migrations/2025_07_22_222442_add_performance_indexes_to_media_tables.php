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
        // Add indexes to media_services table
        Schema::table('media_services', function (Blueprint $table) {
            $table->index('order', 'idx_media_services_order');
            $table->index(['order', 'created_at'], 'idx_media_services_order_created');
        });

        // Add indexes to media_service_features table
        Schema::table('media_service_features', function (Blueprint $table) {
            $table->index(['service_id', 'order'], 'idx_media_service_features_service_order');
        });

        // Add indexes to media_service_media table
        Schema::table('media_service_media', function (Blueprint $table) {
            $table->index(['service_id', 'group_id'], 'idx_media_service_media_service_group');
            $table->index(['service_id', 'order'], 'idx_media_service_media_service_order');
            $table->index(['group_id', 'media_type'], 'idx_media_service_media_group_type');
        });

        // Add indexes to media_testimonials table
        Schema::table('media_testimonials', function (Blueprint $table) {
            $table->index('order', 'idx_media_testimonials_order');
            $table->index(['order', 'created_at'], 'idx_media_testimonials_order_created');
        });

        // Add indexes to media_process_steps table
        Schema::table('media_process_steps', function (Blueprint $table) {
            $table->index('order', 'idx_media_process_steps_order');
            $table->index(['order', 'created_at'], 'idx_media_process_steps_order_created');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove indexes from media_services table
        Schema::table('media_services', function (Blueprint $table) {
            $table->dropIndex('idx_media_services_order');
            $table->dropIndex('idx_media_services_order_created');
        });

        // Remove indexes from media_service_features table
        Schema::table('media_service_features', function (Blueprint $table) {
            $table->dropIndex('idx_media_service_features_service_order');
        });

        // Remove indexes from media_service_media table
        Schema::table('media_service_media', function (Blueprint $table) {
            $table->dropIndex('idx_media_service_media_service_group');
            $table->dropIndex('idx_media_service_media_service_order');
            $table->dropIndex('idx_media_service_media_group_type');
        });

        // Remove indexes from media_testimonials table
        Schema::table('media_testimonials', function (Blueprint $table) {
            $table->dropIndex('idx_media_testimonials_order');
            $table->dropIndex('idx_media_testimonials_order_created');
        });

        // Remove indexes from media_process_steps table
        Schema::table('media_process_steps', function (Blueprint $table) {
            $table->dropIndex('idx_media_process_steps_order');
            $table->dropIndex('idx_media_process_steps_order_created');
        });
    }
};