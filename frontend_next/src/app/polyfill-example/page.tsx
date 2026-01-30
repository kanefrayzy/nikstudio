/**
 * Example page demonstrating polyfill usage
 */

'use client';

import React from 'react';
import { PolyfillProvider, PolyfillStatus } from '../../components/PolyfillProvider';
import { usePolyfills } from '../../lib/polyfill-manager';
import { useBrowserDetection } from '../../lib/browser-detection';

function PolyfillDemo() {
  const { browserInfo, supportsFeature, getRequiredPolyfills } = useBrowserDetection();
  const { polyfillResults, isLoading, error } = usePolyfills();

  if (!browserInfo) {
    return <div>Загрузка информации о браузере...</div>;
  }

  const requiredPolyfills = getRequiredPolyfills();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Демонстрация системы полифиллов</h1>
      
      {/* Browser Information */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Информация о браузере</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <strong>Браузер:</strong> {browserInfo.name} {browserInfo.version}
          </div>
          <div>
            <strong>Поддерживается:</strong> {browserInfo.isSupported ? 'Да' : 'Нет'}
          </div>
        </div>
      </div>

      {/* Feature Support */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Поддержка функций</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(browserInfo.features).map(([feature, supported]) => (
            <div key={feature} className="flex items-center">
              <span className={`w-3 h-3 rounded-full mr-2 ${supported ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span className="text-sm">
                {feature}: {supported ? 'Да' : 'Нет'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Required Polyfills */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Необходимые полифиллы</h2>
        {requiredPolyfills.length === 0 ? (
          <p className="text-green-600">Полифиллы не требуются для этого браузера!</p>
        ) : (
          <ul className="list-disc list-inside space-y-1">
            {requiredPolyfills.map(polyfill => (
              <li key={polyfill} className="text-sm">{polyfill}</li>
            ))}
          </ul>
        )}
      </div>

      {/* Polyfill Loading Status */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Статус загрузки полифиллов</h2>
        
        {isLoading && (
          <div className="flex items-center text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            Загрузка полифиллов...
          </div>
        )}
        
        {error && (
          <div className="text-red-600 mb-4">
            Ошибка загрузки полифиллов: {error.message}
          </div>
        )}
        
        {polyfillResults.length > 0 && (
          <div className="space-y-2">
            {polyfillResults.map(result => (
              <div key={result.name} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="font-medium">{result.name}</span>
                <div className="flex items-center">
                  {result.loaded ? (
                    <span className="text-green-600 text-sm">✓ Загружен</span>
                  ) : (
                    <span className="text-red-600 text-sm">✗ Ошибка</span>
                  )}
                  {result.fallbackApplied && (
                    <span className="ml-2 text-orange-600 text-xs">(fallback)</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Feature Tests */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Тесты функций</h2>
        <div className="space-y-4">
          
          {/* Fetch Test */}
          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="font-medium">Fetch API</h3>
            <p className="text-sm text-gray-600 mb-2">
              Поддержка: {supportsFeature('fetch') ? 'Да' : 'Нет'}
            </p>
            <button
              onClick={async () => {
                try {
                  const response = await fetch('/api/test');
                  console.log('Fetch test successful:', response.status);
                } catch (error) {
                  console.error('Fetch test failed:', error);
                }
              }}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            >
              Тест Fetch
            </button>
          </div>

          {/* Promise Test */}
          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="font-medium">Promise</h3>
            <p className="text-sm text-gray-600 mb-2">
              Поддержка: {supportsFeature('promises') ? 'Да' : 'Нет'}
            </p>
            <button
              onClick={() => {
                Promise.resolve('Test')
                  .then(result => console.log('Promise test successful:', result))
                  .catch(error => console.error('Promise test failed:', error));
              }}
              className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
            >
              Тест Promise
            </button>
          </div>

          {/* IntersectionObserver Test */}
          <div className="border-l-4 border-purple-500 pl-4">
            <h3 className="font-medium">Intersection Observer</h3>
            <p className="text-sm text-gray-600 mb-2">
              Поддержка: {supportsFeature('intersectionObserver') ? 'Да' : 'Нет'}
            </p>
            <button
              onClick={() => {
                try {
                  const observer = new IntersectionObserver(() => {
                    console.log('IntersectionObserver test successful');
                    observer.disconnect();
                  });
                  
                  const testElement = document.createElement('div');
                  document.body.appendChild(testElement);
                  observer.observe(testElement);
                  
                  setTimeout(() => {
                    document.body.removeChild(testElement);
                  }, 100);
                } catch (error) {
                  console.error('IntersectionObserver test failed:', error);
                }
              }}
              className="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600"
            >
              Тест Intersection Observer
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function PolyfillExamplePage() {
  return (
    <PolyfillProvider showLoadingIndicator={true}>
      <PolyfillDemo />
      <PolyfillStatus />
    </PolyfillProvider>
  );
}