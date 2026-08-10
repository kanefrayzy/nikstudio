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
        Schema::table('contact_requests', function (Blueprint $table) {
            // Пометка спама: заявка сохраняется, но уведомления по ней не шлём
            $table->boolean('is_spam')->default(false)->after('user_agent');
            $table->string('spam_reason')->nullable()->after('is_spam');
            // Статус доставки в Telegram — по аналогии с почтой
            $table->boolean('telegram_sent')->default(false)->after('sent_at');
            $table->text('telegram_error')->nullable()->after('telegram_sent');

            $table->index('is_spam');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('contact_requests', function (Blueprint $table) {
            $table->dropIndex(['is_spam']);
            $table->dropColumn(['is_spam', 'spam_reason', 'telegram_sent', 'telegram_error']);
        });
    }
};
