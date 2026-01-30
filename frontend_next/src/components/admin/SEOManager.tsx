'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Globe, 
  FileText, 
  Briefcase, 
  Home, 
  Settings, 
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Eye,
  Image
} from "lucide-react";
import { GlobalSEOSettings } from './GlobalSEOSettings';
import { PageSEOSettings } from './PageSEOSettings';
import { ContentSEOManager } from './ContentSEOManager';

interface SEOStats {
  total_projects: number;
  projects_with_seo: number;
  projects_without_seo: number;
  total_blog_posts: number;
  blog_posts_with_seo: number;
  blog_posts_without_seo: number;
}

interface SEOOverview {
  global_settings: any;
  page_settings: any;
  stats: SEOStats;
  page_types: Record<string, string>;
}

export default function SEOManager() {
  const [overview, setOverview] = useState<SEOOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Поддержка URL параметров для табов
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab && ['overview', 'global', 'pages', 'content'].includes(tab)) {
      setActiveTab(tab);
    }
  }, []);

  useEffect(() => {
    fetchSEOOverview();
  }, []);

  const fetchSEOOverview = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      console.log('Попытка подключения к API:', `${apiUrl}/api/seo/overview`);
      
      // Сначала проверим тестовый эндпоинт
      try {
        const testResponse = await fetch(`${apiUrl}/api/seo/test`);
        console.log('Тестовый эндпоинт ответил:', testResponse.status);
        
        if (testResponse.ok) {
          const testData = await testResponse.json();
          console.log('Тестовые данные:', testData);
        }
      } catch (testErr) {
        console.error('Тестовый эндпоинт недоступен:', testErr);
        throw new Error('Laravel сервер недоступен. Убедитесь, что сервер запущен на http://localhost:8000');
      }
      
      const response = await fetch(`${apiUrl}/api/seo/overview`);
      console.log('Ответ от overview эндпоинта:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Ошибка ответа:', errorText);
        throw new Error(`Ошибка при загрузке данных SEO: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Полученные данные:', data);
      
      if (data.success) {
        setOverview(data.data);
      } else {
        throw new Error(data.message || 'Ошибка при загрузке данных SEO');
      }
    } catch (err) {
      console.error('Ошибка при загрузке обзора SEO:', err);
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  };

  const calculateSEOScore = (stats: SEOStats): number => {
    const totalContent = stats.total_projects + stats.total_blog_posts;
    const contentWithSEO = stats.projects_with_seo + stats.blog_posts_with_seo;
    
    if (totalContent === 0) return 100;
    return Math.round((contentWithSEO / totalContent) * 100);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка данных SEO...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={fetchSEOOverview} className="mt-4">
          Попробовать снова
        </Button>
      </div>
    );
  }

  const seoScore = overview ? calculateSEOScore(overview.stats) : 0;

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Settings className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Управление SEO</h1>
          <p className="text-gray-600">Настройка SEO для всех страниц сайта</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Обзор
          </TabsTrigger>
          <TabsTrigger value="global" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Глобальные
          </TabsTrigger>
          <TabsTrigger value="pages" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Страницы
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            Контент
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* SEO Score Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                SEO Рейтинг
              </CardTitle>
              <CardDescription>
                Общий показатель SEO-оптимизации сайта
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold text-blue-600">
                  {seoScore}%
                </div>
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-300 ${
                        seoScore >= 80 ? 'bg-green-500' : 
                        seoScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${seoScore}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    {seoScore >= 80 ? 'Отличная SEO-оптимизация' : 
                     seoScore >= 60 ? 'Хорошая SEO-оптимизация' : 'Требует улучшения'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Global Settings Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Глобальные настройки
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {overview?.global_settings ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-green-700">Настроены</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 text-red-500" />
                      <span className="text-red-700">Не настроены</span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Projects SEO */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  Проекты
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Всего:</span>
                    <Badge variant="outline">{overview?.stats.total_projects || 0}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>С SEO:</span>
                    <Badge variant="default">{overview?.stats.projects_with_seo || 0}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Без SEO:</span>
                    <Badge variant="destructive">{overview?.stats.projects_without_seo || 0}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Blog SEO */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Блог
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Всего:</span>
                    <Badge variant="outline">{overview?.stats.total_blog_posts || 0}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>С SEO:</span>
                    <Badge variant="default">{overview?.stats.blog_posts_with_seo || 0}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Без SEO:</span>
                    <Badge variant="destructive">{overview?.stats.blog_posts_without_seo || 0}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Page Settings Status */}
          <Card>
            <CardHeader>
              <CardTitle>Настройки страниц</CardTitle>
              <CardDescription>
                SEO-настройки для страниц списков
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {overview?.page_types && Object.entries(overview.page_types).map(([type, name]) => (
                  <div key={type} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      {type === 'home' && <Home className="w-4 h-4" />}
                      {type === 'projects_list' && <Briefcase className="w-4 h-4" />}
                      {type === 'blog_list' && <FileText className="w-4 h-4" />}
                      {type === 'media' && <Image className="w-4 h-4" />}
                      <span>{name}</span>
                    </div>
                    {overview.page_settings[type] ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Быстрые действия</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button 
                  onClick={() => setActiveTab('global')}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Настроить глобальные SEO
                </Button>
                <Button 
                  onClick={() => setActiveTab('pages')}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Настроить страницы
                </Button>
                <Button 
                  onClick={() => setActiveTab('content')}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Управлять контентом
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="global">
          <GlobalSEOSettings 
            initialSettings={overview?.global_settings}
            onUpdate={fetchSEOOverview}
          />
        </TabsContent>

        <TabsContent value="pages">
          <PageSEOSettings 
            pageTypes={overview?.page_types || {}}
            initialSettings={overview?.page_settings || {}}
            onUpdate={fetchSEOOverview}
          />
        </TabsContent>

        <TabsContent value="content">
          <ContentSEOManager 
            stats={overview?.stats}
            onUpdate={fetchSEOOverview}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}