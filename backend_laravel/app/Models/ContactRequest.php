<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Заявка с сайта (форма сотрудничества или запрос по проекту).
 *
 * Сохраняется в БД до попытки отправки письма, чтобы заявка не терялась
 * при недоступности SMTP.
 */
class ContactRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'email',
        'company',
        'message',
        'source',
        'project_title',
        'consent_personal_data',
        'marketing_consent',
        'ip',
        'user_agent',
        'is_spam',
        'spam_reason',
        'mail_sent',
        'mail_error',
        'sent_at',
        'telegram_sent',
        'telegram_error',
    ];

    protected $casts = [
        'consent_personal_data' => 'boolean',
        'marketing_consent' => 'boolean',
        'is_spam' => 'boolean',
        'mail_sent' => 'boolean',
        'telegram_sent' => 'boolean',
        'sent_at' => 'datetime',
    ];

    // Заявки, письма по которым не ушли — их нужно обработать вручную
    public function scopeUndelivered($query)
    {
        return $query->where('mail_sent', false);
    }

    // Только настоящие заявки, без помеченных как спам
    public function scopeLegit($query)
    {
        return $query->where('is_spam', false);
    }

    // Отфильтрованный спам
    public function scopeSpam($query)
    {
        return $query->where('is_spam', true);
    }

    // Запросы по конкретному источнику: 'contact' или 'project'
    public function scopeSource($query, string $source)
    {
        return $query->where('source', $source);
    }

    // Отметить заявку как успешно отправленную на почту
    public function markMailSent(): void
    {
        $this->update([
            'mail_sent' => true,
            'mail_error' => null,
            'sent_at' => now(),
        ]);
    }

    // Зафиксировать ошибку отправки, сама заявка при этом остаётся в БД
    public function markMailFailed(string $error): void
    {
        $this->update([
            'mail_sent' => false,
            'mail_error' => mb_substr($error, 0, 2000),
        ]);
    }

    // Результат отправки в Telegram
    public function markTelegram(bool $sent, ?string $error = null): void
    {
        $this->update([
            'telegram_sent' => $sent,
            'telegram_error' => $error ? mb_substr($error, 0, 2000) : null,
        ]);
    }
}
