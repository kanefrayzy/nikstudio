'use client';

import React from 'react';
import { fileUtils, browserUtils } from '../../lib/cross-browser-utils';

export default function DemoPage() {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [filePreview, setFilePreview] = React.useState<string>('');
  const [browserInfo, setBrowserInfo] = React.useState<any>(null);

  React.useEffect(() => {
    setBrowserInfo(browserUtils.getBrowserInfo());
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (!fileUtils.validateFileSize(file, 5)) {
      alert('Файл слишком большой! Максимальный размер: 5MB');
      return;
    }

    // Validate file type
    if (!fileUtils.validateFileType(file, ['image', 'video'])) {
      alert('Неподдерживаемый тип файла! Разрешены только изображения и видео.');
      return;
    }

    setSelectedFile(file);

    // Create preview
    const url = fileUtils.createObjectURL(file);
    setFilePreview(url);

    // Cleanup previous URL
    return () => {
      if (url) fileUtils.revokeObjectURL(url);
    };
  };

  const features = [
    { name: 'Fetch API', supported: browserUtils.supportsFeature('fetch') },
    { name: 'Promises', supported: browserUtils.supportsFeature('promises') },
    { name: 'CSS Grid', supported: browserUtils.supportsFeature('cssGrid') },
    { name: 'CSS Variables', supported: browserUtils.supportsFeature('cssCustomProperties') },
    { name: 'WebP Images', supported: browserUtils.supportsFeature('webp') },
    { name: 'IntersectionObserver', supported: browserUtils.supportsFeature('intersectionObserver') }
  ];

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Демонстрация кроссбраузерности</h1>

      {/* Browser Info */}
      {browserInfo && (
        <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Информация о браузере</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <strong>Браузер:</strong> {browserInfo.name}
            </div>
            <div>
              <strong>Версия:</strong> {browserInfo.version}
            </div>
            <div>
              <strong>Статус:</strong> 
              <span className={`ml-2 px-2 py-1 rounded text-sm ${
                browserInfo.isModern 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {browserInfo.isModern ? 'Современный' : 'Устаревший'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Feature Support */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Поддержка функций</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, index) => (
            <div 
              key={index}
              className={`p-4 border rounded-lg ${
                feature.supported 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{feature.name}</span>
                <span className={`text-sm px-2 py-1 rounded ${
                  feature.supported 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {feature.supported ? '✓' : '✗'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* File Upload Demo */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Демо загрузки файлов</h2>
        <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg">
          <input
            type="file"
            accept="image/*,video/*"
            onChange={handleFileSelect}
            className="mb-4 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          
          {selectedFile && (
            <div className="mt-4">
              <div className="mb-2">
                <strong>Выбранный файл:</strong> {selectedFile.name}
              </div>
              <div className="mb-2">
                <strong>Размер:</strong> {fileUtils.formatFileSize(selectedFile.size)}
              </div>
              <div className="mb-4">
                <strong>Тип:</strong> {selectedFile.type}
              </div>
              
              {filePreview && (
                <div className="mt-4">
                  {selectedFile.type.startsWith('image/') ? (
                    <img 
                      src={filePreview} 
                      alt="Preview" 
                      className="max-w-xs max-h-48 object-cover rounded border"
                    />
                  ) : selectedFile.type.startsWith('video/') ? (
                    <video 
                      src={filePreview} 
                      controls 
                      className="max-w-xs max-h-48 rounded border"
                    />
                  ) : null}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CSS Grid Demo */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Демо CSS Grid (с Flexbox fallback)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(num => (
            <div key={num} className="bg-gradient-to-br from-blue-400 to-purple-500 text-white p-6 rounded-lg text-center">
              <div className="text-2xl font-bold">Блок {num}</div>
              <div className="text-sm opacity-80">CSS Grid с fallback</div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Properties Demo */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Демо CSS переменных</h2>
        <div 
          className="p-6 rounded-lg text-white"
          style={{ 
            backgroundColor: 'var(--primary, #3b82f6)',
            border: '2px solid var(--border, #e2e8f0)'
          }}
        >
          <div className="text-lg font-semibold">
            Этот блок использует CSS переменные
          </div>
          <div className="text-sm opacity-90">
            С fallback значениями для старых браузеров
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Дополнительные тесты:</h3>
        <div className="space-x-4">
          <a 
            href="/compatibility-test" 
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Полный тест совместимости
          </a>
        </div>
      </div>
    </div>
  );
}

