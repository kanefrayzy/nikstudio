<?php

namespace App\Services;

use App\Models\ContactRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Отправка заявок с сайта в Telegram.
 *
 * Работает как дополнительный канал: любые сбои Telegram не должны влиять
 * ни на сохранение заявки, ни на ответ пользователю.
 */
class TelegramNotifier
{
    /**
     * Настроен ли канал (заданы токен бота и чат).
     */
    public function isConfigured(): bool
    {
        return ! empty(config('services.telegram.bot_token'))
            && ! empty(config('services.telegram.chat_id'));
    }

    /**
     * Отправить заявку в Telegram.
     *
     * @return array{sent: bool, error: ?string}
     */
    public function sendContactRequest(ContactRequest $request): array
    {
        if (! $this->isConfigured()) {
            return ['sent' => false, 'error' => 'Telegram не настроен (нет токена или chat_id)'];
        }

        try {
            $response = Http::timeout(config('services.telegram.timeout', 10))
                ->asJson()
                ->post(
                    'https://api.telegram.org/bot'.config('services.telegram.bot_token').'/sendMessage',
                    [
                        'chat_id' => config('services.telegram.chat_id'),
                        'text' => $this->formatMessage($request),
                        'parse_mode' => 'HTML',
                        'disable_web_page_preview' => true,
                    ]
                );

            if ($response->successful()) {
                return ['sent' => true, 'error' => null];
            }

            // Telegram возвращает описание ошибки в поле description
            $error = $response->json('description') ?? 'HTTP '.$response->status();

            Log::error('Telegram notification failed', [
                'contact_request_id' => $request->id,
                'status' => $response->status(),
                'error' => $error,
            ]);

            return ['sent' => false, 'error' => $error];

        } catch (Throwable $e) {
            Log::error('Telegram notification exception', [
                'contact_request_id' => $request->id,
                'error' => $e->getMessage(),
            ]);

            return ['sent' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Собрать текст сообщения. Все значения экранируются — они приходят от пользователя.
     */
    private function formatMessage(ContactRequest $request): string
    {
        $title = $request->source === 'project'
            ? '📁 Заявка по проекту'
            : '✉️ Заявка на сотрудничество';

        $lines = ['<b>'.$title.'</b>', ''];

        if ($request->source === 'project' && $request->project_title) {
            $lines[] = '<b>Проект:</b> '.$this->escape($request->project_title);
        }

        $lines[] = '<b>Имя:</b> '.$this->escape($request->name);
        $lines[] = '<b>Email:</b> '.$this->escape($request->email);

        if ($request->company) {
            $lines[] = '<b>Компания:</b> '.$this->escape($request->company);
        }

        $lines[] = '';
        $lines[] = '<b>Сообщение:</b>';
        $lines[] = $this->escape($request->message);
        $lines[] = '';
        $lines[] = '<i>'.$request->created_at->timezone('Europe/Moscow')->format('d.m.Y H:i').' МСК'
            .' · заявка #'.$request->id.'</i>';

        return implode("\n", $lines);
    }

    /**
     * Экранирование для parse_mode=HTML: Telegram требует & < > .
     */
    private function escape(string $value): string
    {
        return htmlspecialchars($value, ENT_NOQUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }
}
