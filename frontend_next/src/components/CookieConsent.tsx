'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const STORAGE_KEY = 'cookie-consent-v1';

export type CookieConsentValue = 'accepted' | 'necessary';

/**
 * Прочитать сохранённый выбор посетителя.
 * null — согласие ещё не запрашивалось либо хранилище недоступно.
 */
export function getCookieConsent(): CookieConsentValue | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    return parsed?.value === 'accepted' || parsed?.value === 'necessary'
      ? parsed.value
      : null;
  } catch {
    // Приватный режим или отключённое хранилище — считаем, что выбора нет
    return null;
  }
}

const CookieConsent = () => {
  const pathname = usePathname();
  // isMounted — плашка в DOM, isVisible — состояние анимации появления
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const hideTimer = useRef<number | null>(null);

  useEffect(() => {
    // Читаем выбор только на клиенте: на сервере localStorage недоступен,
    // иначе разметка сервера и клиента разойдётся
    if (getCookieConsent() !== null) return;

    setIsMounted(true);

    // Следующий кадр — иначе переход не сработает и плашка появится рывком
    const frame = window.requestAnimationFrame(() => setIsVisible(true));

    return () => {
      window.cancelAnimationFrame(frame);
      if (hideTimer.current !== null) {
        window.clearTimeout(hideTimer.current);
      }
    };
  }, []);

  const decide = useCallback((value: CookieConsentValue) => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ value, date: new Date().toISOString() })
      );
    } catch {
      // Не смогли сохранить — плашку всё равно закрываем, чтобы не мешала
    }

    // Сообщаем остальному приложению: аналитику можно подключать по этому событию
    window.dispatchEvent(new CustomEvent('cookie-consent', { detail: value }));

    setIsVisible(false);
    hideTimer.current = window.setTimeout(() => setIsMounted(false), 400);
  }, []);

  // В админке плашка не нужна — это внутренний интерфейс, а не публичная страница
  if (pathname?.startsWith('/admin')) return null;
  if (!isMounted) return null;

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-[100] flex justify-center p-4 sm:p-6 pointer-events-none
        transition-all duration-500 ease-out motion-reduce:transition-none
        ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}
    >
      <section
        role="region"
        aria-label="Использование файлов cookie"
        className="pointer-events-auto w-full max-w-[1120px]
          rounded-2xl border border-white/10 bg-[#181A1B]/85 backdrop-blur-xl
          shadow-[0_24px_70px_-20px_rgba(0,0,0,0.85)]
          px-5 py-5 sm:px-7 sm:py-6"
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:gap-8">
          {/* Иконка */}
          <div
            aria-hidden="true"
            className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center
              rounded-xl bg-[#DE063A]/10 border border-[#DE063A]/25"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[#DE063A]">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="9.2" cy="9" r="1.15" fill="currentColor" />
              <circle cx="15" cy="11" r="1" fill="currentColor" />
              <circle cx="10" cy="14.8" r="1.3" fill="currentColor" />
              <circle cx="14.6" cy="15.6" r="0.9" fill="currentColor" />
            </svg>
          </div>

          {/* Текст */}
          <div className="flex-1">
            <p className="font-geometria text-white text-[18px] sm:text-[20px] leading-[130%] font-bold">
              Мы используем cookie
            </p>
            <p className="mt-2 font-inter text-white/60 text-sm sm:text-[15px] leading-relaxed">
              Файлы cookie помогают сайту работать корректно и делают его удобнее. Продолжая
              пользоваться сайтом, вы соглашаетесь с их использованием — подробности в{' '}
              <Link
                href="/privacy"
                className="text-white/80 underline underline-offset-2 hover:text-[#DE063A] transition-colors"
              >
                Политике обработки персональных данных
              </Link>
              .
            </p>
          </div>

          {/* Кнопки */}
          <div className="flex flex-col sm:flex-row gap-3 lg:shrink-0">
            <button
              type="button"
              onClick={() => decide('necessary')}
              className="order-2 sm:order-1 rounded-full border border-white/20 px-6 py-3
                font-inter text-sm text-white/70 whitespace-nowrap
                hover:text-white hover:border-white/40 hover:bg-white/5
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40
                transition-colors duration-200 motion-reduce:transition-none"
            >
              Только необходимые
            </button>
            <button
              type="button"
              onClick={() => decide('accepted')}
              className="order-1 sm:order-2 rounded-full bg-[#DE063A] px-8 py-3
                font-inter text-sm font-medium text-white whitespace-nowrap
                hover:bg-[#c2052f] active:scale-[0.98]
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DE063A]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#181A1B]
                transition-all duration-200 motion-reduce:transition-none"
            >
              Принять
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CookieConsent;
