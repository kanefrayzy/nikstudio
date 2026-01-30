'use client';

import React, { useState } from 'react';

// Принудительно делаем страницу динамической для продакшн сборки
export const dynamic = 'force-dynamic'

export default function SEOTestPage() {
  const [testResult, setTestResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testAPI = async () => {
    setLoading(true);
    setTestResult('');
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      console.log('Testing API URL:', apiUrl);
      
      // Test basic connection
      const testResponse = await fetch(`${apiUrl}/api/seo/test`);
      console.log('Test response status:', testResponse.status);
      
      if (testResponse.ok) {
        const testData = await testResponse.json();
        setTestResult(`✅ API Connection: OK\n${JSON.stringify(testData, null, 2)}\n\n`);
        
        // Test overview endpoint
        const overviewResponse = await fetch(`${apiUrl}/api/seo/overview`);
        console.log('Overview response status:', overviewResponse.status);
        
        if (overviewResponse.ok) {
          const overviewData = await overviewResponse.json();
          setTestResult(prev => prev + `✅ Overview Endpoint: OK\n${JSON.stringify(overviewData, null, 2)}`);
        } else {
          const errorText = await overviewResponse.text();
          setTestResult(prev => prev + `❌ Overview Endpoint Error: ${overviewResponse.status}\n${errorText}`);
        }
      } else {
        const errorText = await testResponse.text();
        setTestResult(`❌ API Connection Failed: ${testResponse.status}\n${errorText}`);
      }
    } catch (error) {
      console.error('Test error:', error);
      setTestResult(`❌ Connection Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">SEO API Test</h1>
      
      <div className="space-y-4">
        <button
          onClick={testAPI}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test API Connection'}
        </button>
        
        {testResult && (
          <div className="bg-gray-100 p-4 rounded">
            <h3 className="font-bold mb-2">Test Results:</h3>
            <pre className="whitespace-pre-wrap text-sm">{testResult}</pre>
          </div>
        )}
        
        <div className="bg-blue-50 p-4 rounded">
          <h3 className="font-bold mb-2">Debug Info:</h3>
          <p><strong>API URL:</strong> {process.env.NEXT_PUBLIC_API_URL}</p>
          <p><strong>Test Endpoint:</strong> {process.env.NEXT_PUBLIC_API_URL}/api/seo/test</p>
          <p><strong>Overview Endpoint:</strong> {process.env.NEXT_PUBLIC_API_URL}/api/seo/overview</p>
        </div>
        
        <div className="bg-yellow-50 p-4 rounded">
          <h3 className="font-bold mb-2">Troubleshooting:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Убедитесь, что Laravel сервер запущен: <code>php artisan serve</code></li>
            <li>Проверьте, что сервер доступен на http://localhost:8000</li>
            <li>Убедитесь, что база данных подключена</li>
            <li>Проверьте логи Laravel: <code>tail -f storage/logs/laravel.log</code></li>
          </ul>
        </div>
      </div>
    </div>
  );
}