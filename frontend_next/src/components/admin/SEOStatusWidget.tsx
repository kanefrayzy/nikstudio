'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, AlertCircle, CheckCircle } from "lucide-react";

interface SEOStats {
  total_projects: number;
  projects_with_seo: number;
  projects_without_seo: number;
  total_blog_posts: number;
  blog_posts_with_seo: number;
  blog_posts_without_seo: number;
}

export function SEOStatusWidget() {
  const [stats, setStats] = useState<SEOStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSEOStats();
  }, []);

  const fetchSEOStats = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/api/seo/overview`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStats(data.data.stats);
        }
      }
    } catch (error) {
      console.error('Ошибка при загрузке SEO статистики:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSEOScore = (): number => {
    if (!stats) return 0;
    const totalContent = stats.total_projects + stats.total_blog_posts;
    const contentWithSEO = stats.projects_with_seo + stats.blog_posts_with_seo;
    
    if (totalContent === 0) return 100;
    return Math.round((contentWithSEO / totalContent) * 100);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            SEO Статус
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            SEO Статус
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">Не удалось загрузить данные</p>
        </CardContent>
      </Card>
    );
  }

  const seoScore = calculateSEOScore();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          SEO Рейтинг
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* SEO Score */}
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold text-blue-600">
              {seoScore}%
            </div>
            <div className="flex-1">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    seoScore >= 80 ? 'bg-green-500' : 
                    seoScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${seoScore}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="flex items-center justify-between">
                <span>Проекты:</span>
                <Badge variant={stats.projects_without_seo > 0 ? "destructive" : "default"}>
                  {stats.projects_with_seo}/{stats.total_projects}
                </Badge>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <span>Блог:</span>
                <Badge variant={stats.blog_posts_without_seo > 0 ? "destructive" : "default"}>
                  {stats.blog_posts_with_seo}/{stats.total_blog_posts}
                </Badge>
              </div>
            </div>
          </div>

          {/* Status Message */}
          <div className="flex items-center gap-2 text-sm">
            {seoScore >= 80 ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-green-700">Отличная оптимизация</span>
              </>
            ) : seoScore >= 60 ? (
              <>
                <AlertCircle className="w-4 h-4 text-yellow-500" />
                <span className="text-yellow-700">Хорошая оптимизация</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-red-700">Требует улучшения</span>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}