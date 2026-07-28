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
        Schema::create('contact_requests', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email');
            $table->string('company')->nullable();
            $table->text('message');
            $table->string('source')->default('contact'); // 'contact' или 'project'
            $table->string('project_title')->nullable();
            $table->boolean('consent_personal_data')->default(false);
            $table->boolean('marketing_consent')->default(false);
            $table->string('ip')->nullable();
            $table->text('user_agent')->nullable();
            // Статус доставки письма: заявка сохраняется даже если почта не отправилась
            $table->boolean('mail_sent')->default(false);
            $table->text('mail_error')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();

            $table->index('created_at');
            $table->index('mail_sent');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contact_requests');
    }
};
