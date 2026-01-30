'use client';

import { SWRConfig } from 'swr';
import { ReactNode } from 'react';

/**
 * Глобальная конфигурация SWR для кэширования API запросов
 * 
 * Настройки по умолчанию:
 * - Дедупликация запросов в течение 2 секунд
 * - Не обновлять при фокусе окна (для админки)
 * - Обновлять при переподключении
 * - Показывать устаревшие данные во время обновления
 * - Повторять запрос при ошибке (максимум 3 раза)
 */
export function SWRProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        // Дедупликация запросов в течение 2 секунд
        dedupingInterval: 2000,
        
        // Не обновлять при фокусе окна (для админки это не нужно)
        revalidateOnFocus: false,
        
        // Обновлять при переподключении к сети
        revalidateOnReconnect: true,
        
        // Показывать устаревшие данные во время обновления
        keepPreviousData: true,
        
        // Повторять запрос при ошибке
        shouldRetryOnError: true,
        
        // Максимум 3 попытки при ошибке
        errorRetryCount: 3,
        
        // Интервал между попытками (1 секунда)
        errorRetryInterval: 1000,
        
        // Функция обработки ошибок
        onError: (error, key) => {
          console.error(`SWR Error for key "${key}":`, error);
        },
        
        // Функция обработки успешной загрузки
        onSuccess: (data, key) => {
          console.log(`SWR Success for key "${key}"`);
        },
      }}
    >
      {children}
    </SWRConfig>
  );
}
