/**
 * Cross-Browser Compatibility Test Component
 * Tests and displays browser compatibility status
 */

'use client';

import React from 'react';
import { browserUtils, mediaUtils } from '../lib/cross-browser-utils';

interface CompatibilityTestResult {
  feature: string;
  supported: boolean;
  fallbackAvailable: boolean;
  description: string;
}

export function CrossBrowserTest() {
  const [testResults, setTestResults] = React.useState<CompatibilityTestResult[]>([]);
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
    runCompatibilityTests();
  }, []);

  const runCompatibilityTests = () => {
    const tests: CompatibilityTestResult[] = [
      {
        feature: 'Fetch API',
        supported: browserUtils.supportsFeature('fetch'),
        fallbackAvailable: true,
        description: 'Современный API для HTTP запросов'
      },
      {
        feature: 'Promises',
        supported: browserUtils.supportsFeature('promises'),
        fallbackAvailable: true,
        description: 'Асинхронное программирование'
      },
      {
        feature: 'CSS Grid',
        supported: browserUtils.supportsFeature('cssGrid'),
        fallbackAvailable: true,
        description: 'Современная система макетов'
      },
      {
        feature: 'CSS Custom Properties',
        supported: browserUtils.supportsFeature('cssCustomProperties'),
        fallbackAvailable: true,
        description: 'CSS переменные'
      },
      {
        feature: 'WebP Images',
        supported: browserUtils.supportsFeature('webp'),
        fallbackAvailable: true,
        description: 'Современный формат изображений'
      },
      {
        feature: 'IntersectionObserver',
        supported: browserUtils.supportsFeature('intersectionObserver'),
        fallbackAvailable: true,
        description: 'Отслеживание видимости элементов'
      },
      {
        feature: 'File API',
        supported: typeof File !== 'undefined' && typeof FileReader !== 'undefined',
        fallbackAvailable: false,
        description: 'Работа с файлами'
      },
      {
        feature: 'FormData',
        supported: typeof FormData !== 'undefined',
        fallbackAvailable: false,
        description: 'Отправка форм с файлами'
      },
      {
        feature: 'Local Storage',
        supported: typeof Storage !== 'undefined' && !!localStorage,
        fallbackAvailable: true,
        description: 'Локальное хранение данных'
      },
      {
        feature: 'Video MP4',
        supported: mediaUtils.supportsVideoFormat('video/mp4'),
        fallbackAvailable: false,
        description: 'Воспроизведение MP4 видео'
      }
    ];

    setTestResults(tests);
  };

  if (!isClient) {
    return null;
  }

  const browserInfo = browserUtils.getBrowserInfo();
  const supportedCount = testResults.filter(test => test.supported).length;
  const totalCount = testResults.length;
  const compatibilityScore = Math.round((supportedCount / totalCount) * 100);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 90) return 'bg-green-50 border-green-200';
    if (score >= 70) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Тест кроссбраузерной совместимости
        </h1>
        
        <div className={`rounded-lg border p-6 ${getScoreBackground(compatibilityScore)}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {browserInfo.name} {browserInfo.version}
              </h2>
              <p className="text-gray-600">
                {browserInfo.isModern ? 'Современный браузер' : 'Устаревший браузер'}
              </p>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold ${getScoreColor(compatibilityScore)}`}>
                {compatibilityScore}%
              </div>
              <p className="text-sm text-gray-600">
                {supportedCount} из {totalCount} функций
              </p>
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${
                compatibilityScore >= 90 ? 'bg-green-600' :
                compatibilityScore >= 70 ? 'bg-yellow-600' : 'bg-red-600'
              }`}
              style={{ width: `${compatibilityScore}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {testResults.map((test, index) => (
          <div 
            key={index}
            className={`border rounded-lg p-4 ${
              test.supported 
                ? 'bg-green-50 border-green-200' 
                : test.fallbackAvailable 
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-red-50 border-red-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900">{test.feature}</h3>
              <div className="flex items-center space-x-2">
                {test.supported ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    ✓ Поддерживается
                  </span>
                ) : test.fallbackAvailable ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    ⚠ Fallback
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    ✗ Не поддерживается
                  </span>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-600">{test.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          Рекомендации по совместимости
        </h3>
        <div className="space-y-2 text-sm text-blue-800">
          {compatibilityScore >= 90 && (
            <p>✅ Отличная совместимость! Все основные функции поддерживаются.</p>
          )}
          {compatibilityScore >= 70 && compatibilityScore < 90 && (
            <p>⚠️ Хорошая совместимость с некоторыми ограничениями. Используются fallback решения.</p>
          )}
          {compatibilityScore < 70 && (
            <p>❌ Ограниченная совместимость. Рекомендуется обновить браузер для лучшего опыта.</p>
          )}
          
          {!browserInfo.isModern && (
            <p className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded">
              <strong>Внимание:</strong> Ваш браузер устарел. Для полной функциональности сайта 
              рекомендуется обновить до последней версии.
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={runCompatibilityTests}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Повторить тест
        </button>
      </div>
    </div>
  );
}

export default CrossBrowserTest;