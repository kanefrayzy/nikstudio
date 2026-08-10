<?php

namespace App\Services;

use Illuminate\Http\Request;

/**
 * Определение спама в заявках с сайта.
 *
 * Принцип: пропустить спам менее болезненно, чем отбросить реального клиента,
 * поэтому эвристики сознательно консервативные. Признанные спамом заявки
 * не удаляются, а сохраняются с пометкой is_spam — их видно и можно пересмотреть.
 */
class SpamGuard
{
    /** Скрытое поле-приманка: люди его не видят, боты заполняют. */
    public const HONEYPOT_FIELD = 'website';

    /** Поле с меткой времени открытия формы (мс). */
    public const TIMESTAMP_FIELD = 'form_loaded_at';

    /** Быстрее этого человек форму не заполнит, секунд. */
    private const MIN_FILL_SECONDS = 3;

    /** Порог суммы баллов эвристик, при котором заявка считается спамом. */
    private const SCORE_THRESHOLD = 3;

    /**
     * Проверить заявку. Возвращает причину, если это спам, иначе null.
     */
    public function detect(Request $request, array $data): ?string
    {
        // 1. Приманка: заполнено скрытое поле
        $honeypot = $request->input(self::HONEYPOT_FIELD);
        if (is_string($honeypot) && trim($honeypot) !== '') {
            return 'honeypot: заполнено скрытое поле';
        }

        // 2. Форма отправлена подозрительно быстро после открытия
        $loadedAt = $request->input(self::TIMESTAMP_FIELD);
        if (is_numeric($loadedAt) && $loadedAt > 0) {
            $seconds = (int) round((now()->getTimestampMs() - (int) $loadedAt) / 1000);
            if ($seconds >= 0 && $seconds < self::MIN_FILL_SECONDS) {
                return "слишком быстрая отправка: {$seconds}s";
            }
        }

        // 3. Эвристики по содержимому — суммируем баллы
        $score = 0;
        $signals = [];

        if ($this->looksLikeGibberish($data['name'] ?? '')) {
            $score += 2;
            $signals[] = 'бессмысленное имя';
        }

        if ($this->looksLikeGibberish($data['company'] ?? '')) {
            $score += 1;
            $signals[] = 'бессмысленная компания';
        }

        $links = $this->countLinks($data['message'] ?? '');
        if ($links >= 2) {
            $score += 2;
            $signals[] = "ссылок в тексте: {$links}";
        }

        if ($this->hasBbCode($data['message'] ?? '')) {
            $score += 2;
            $signals[] = 'BBCode-разметка';
        }

        if ($score >= self::SCORE_THRESHOLD) {
            return 'эвристики ('.$score.' б.): '.implode(', ', $signals);
        }

        return null;
    }

    /**
     * Строка похожа на случайный набор символов вида "BDkaOKwtsoxPNPRf".
     *
     * Признаки: только латиница, без пробелов, длинная и с частыми
     * переключениями регистра внутри слова.
     */
    private function looksLikeGibberish(?string $value): bool
    {
        $value = trim((string) $value);

        if (mb_strlen($value) < 8 || preg_match('/\s/u', $value)) {
            return false;
        }

        if (! preg_match('/^[A-Za-z]+$/', $value)) {
            return false;
        }

        // Считаем переходы строчная <-> заглавная внутри строки
        $switches = 0;
        $chars = str_split($value);
        for ($i = 1; $i < count($chars); $i++) {
            $prevUpper = ctype_upper($chars[$i - 1]);
            $currUpper = ctype_upper($chars[$i]);
            if ($prevUpper !== $currUpper) {
                $switches++;
            }
        }

        return $switches >= 4;
    }

    /**
     * Количество ссылок в тексте.
     */
    private function countLinks(?string $value): int
    {
        return preg_match_all('#(https?://|www\.)#i', (string) $value);
    }

    /**
     * BBCode вида [url=...] — характерная примета спам-ботов на форумах.
     */
    private function hasBbCode(?string $value): bool
    {
        return (bool) preg_match('/\[(url|link|img)[=\]]/i', (string) $value);
    }
}
