'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Settings, 
  FileText, 
  Eye, 
  TrendingUp,
  Globe,
  Briefcase
} from "lucide-react";

export function SEOQuickActions() {
  const actions = [
    {
      title: "Глобальные настройки",
      description: "Настроить основные SEO параметры сайта",
      icon: Globe,
      href: "/admin/seo?tab=global",
      color: "bg-blue-50 text-blue-600 hover:bg-blue-100"
    },
    {
      title: "Настройки страниц",
      description: "SEO для главной, проектов и блога",
      icon: FileText,
      href: "/admin/seo?tab=pages",
      color: "bg-green-50 text-green-600 hover:bg-green-100"
    },
    {
      title: "Управление контентом",
      description: "SEO для отдельных проектов и постов",
      icon: Briefcase,
      href: "/admin/seo?tab=content",
      color: "bg-purple-50 text-purple-600 hover:bg-purple-100"
    },
    {
      title: "Аналитика SEO",
      description: "Статистика и рейтинг оптимизации",
      icon: TrendingUp,
      href: "/admin/seo?tab=overview",
      color: "bg-orange-50 text-orange-600 hover:bg-orange-100"
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Быстрые действия SEO
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {actions.map((action, index) => (
            <Link key={index} href={action.href}>
              <div className={`p-4 rounded-lg border transition-all hover:shadow-md ${action.color}`}>
                <div className="flex items-start gap-3">
                  <action.icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <h3 className="font-medium text-sm">{action.title}</h3>
                    <p className="text-xs opacity-75 mt-1">{action.description}</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t">
          <Link href="/admin/seo">
            <Button className="w-full" variant="outline">
              <Eye className="w-4 h-4 mr-2" />
              Открыть полную панель SEO
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}