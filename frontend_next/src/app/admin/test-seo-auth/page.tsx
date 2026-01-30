'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { post, get } from '@/lib/api';

export default function TestSEOAuthPage() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testToken = () => {
    const token = document.cookie.split(';').find(c => c.trim().startsWith('admin-token='));
    setResult(`Token exists: ${!!token}\nToken: ${token || 'none'}`);
  };

  const testGlobalSEO = async () => {
    try {
      setLoading(true);
      setResult('Отправка запроса...');
      
      const formData = new FormData();
      formData.append('site_title', 'Test Title');
      formData.append('site_description', 'Test Description');
      formData.append('twitter_card_type', 'summary_large_image');
      formData.append('facebook_app_id', '');
      
      const data = await post<{ success: boolean; message?: string }>('/api/seo/settings', formData);
      setResult(`Success: ${JSON.stringify(data, null, 2)}`);
    } catch (err: any) {
      setResult(`Error: ${err.message}\n${JSON.stringify(err.response?.data, null, 2)}`);
    } finally {
      setLoading(false);
    }
  };

  const testOverview = async () => {
    try {
      setLoading(true);
      setResult('Отправка запроса...');
      
      const data = await get('/api/seo/overview');
      setResult(`Success: ${JSON.stringify(data, null, 2)}`);
    } catch (err: any) {
      setResult(`Error: ${err.message}\n${JSON.stringify(err.response?.data, null, 2)}`);
    } finally {
      setLoading(false);
    }
  };

  const testAuth = async () => {
    try {
      setLoading(true);
      setResult('Отправка запроса...');
      
      const data = await post<{ success: boolean; message?: string; user?: any }>('/api/seo/test-auth', {});
      setResult(`Success: ${JSON.stringify(data, null, 2)}`);
    } catch (err: any) {
      setResult(`Error: ${err.message}\n${JSON.stringify(err.response?.data, null, 2)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Тест авторизации SEO</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={testToken}>Проверить токен</Button>
            <Button onClick={testAuth} disabled={loading} variant="secondary">
              Тест AUTH /api/seo/test-auth
            </Button>
            <Button onClick={testOverview} disabled={loading}>
              Тест GET /api/seo/overview
            </Button>
            <Button onClick={testGlobalSEO} disabled={loading}>
              Тест POST /api/seo/settings
            </Button>
          </div>
          
          <div className="mt-4 p-4 bg-gray-100 rounded">
            <pre className="whitespace-pre-wrap text-sm">{result || 'Нажмите кнопку для теста'}</pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
