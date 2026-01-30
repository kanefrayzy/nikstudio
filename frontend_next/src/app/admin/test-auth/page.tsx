"use client"

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import apiClient, { getTokenFromCookie } from '@/lib/api';

export default function TestAuthPage() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testToken = () => {
    const token = getTokenFromCookie();
    setResult(`Токен из cookie: ${token ? token.substring(0, 20) + '...' : 'НЕТ ТОКЕНА'}`);
  };

  const testGetHome = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/home');
      setResult(`GET /api/home: SUCCESS\n${JSON.stringify(response.data, null, 2)}`);
    } catch (error: any) {
      setResult(`GET /api/home: ERROR\nStatus: ${error.response?.status}\nMessage: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testDeleteVideo = async () => {
    setLoading(true);
    try {
      const response = await apiClient.delete('/api/home/hero-video');
      setResult(`DELETE /api/home/hero-video: SUCCESS\n${JSON.stringify(response.data, null, 2)}`);
    } catch (error: any) {
      setResult(`DELETE /api/home/hero-video: ERROR\nStatus: ${error.response?.status}\nMessage: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testUploadVideo = async () => {
    setLoading(true);
    try {
      // Создаем тестовый файл
      const blob = new Blob(['test'], { type: 'video/mp4' });
      const file = new File([blob], 'test.mp4', { type: 'video/mp4' });
      
      const formData = new FormData();
      formData.append('hero_video', file);

      const response = await apiClient.post('/api/home/hero-video', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setResult(`POST /api/home/hero-video: SUCCESS\n${JSON.stringify(response.data, null, 2)}`);
    } catch (error: any) {
      setResult(`POST /api/home/hero-video: ERROR\nStatus: ${error.response?.status}\nMessage: ${error.response?.data?.message || error.message}\nErrors: ${JSON.stringify(error.response?.data?.errors)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Тест аутентификации API</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button onClick={testToken} disabled={loading}>
              Проверить токен
            </Button>
            <Button onClick={testGetHome} disabled={loading}>
              GET /api/home
            </Button>
            <Button onClick={testDeleteVideo} disabled={loading} variant="destructive">
              DELETE /api/home/hero-video
            </Button>
            <Button onClick={testUploadVideo} disabled={loading} variant="secondary">
              POST /api/home/hero-video (тест)
            </Button>
          </div>

          {result && (
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
              {result}
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
