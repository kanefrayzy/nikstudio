/**
 * Compatibility Monitoring Dashboard
 * Admin interface for viewing compatibility metrics and reports
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  compatibilityMonitoring,
  MonitoringReport
} from '@/lib/compatibility-monitoring';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface DashboardProps {
  className?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function CompatibilityMonitoringDashboard({ className }: DashboardProps) {
  const [report, setReport] = useState<MonitoringReport | null>(null);
  const [browserStats, setBrowserStats] = useState<Record<string, any> | null>(null);
  const [featureStats, setFeatureStats] = useState<Record<string, any> | null>(null);
  const [errorStats, setErrorStats] = useState<Record<string, any> | null>(null);
  const [performanceStats, setPerformanceStats] = useState<Record<string, any> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState("browsers");

  useEffect(() => {
    loadMonitoringData();

    // Set up periodic refresh
    const interval = setInterval(loadMonitoringData, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const loadMonitoringData = async () => {
    try {
      setIsLoading(true);

      const [
        reportData,
        browserData,
        featureData,
        errorData,
        performanceData
      ] = await Promise.all([
        Promise.resolve(compatibilityMonitoring.generateReport()),
        Promise.resolve(compatibilityMonitoring.getBrowserStats()),
        Promise.resolve(compatibilityMonitoring.getFeatureStats()),
        Promise.resolve(compatibilityMonitoring.getErrorStats()),
        Promise.resolve(compatibilityMonitoring.getPerformanceStats())
      ]);

      setReport(reportData);
      setBrowserStats(browserData);
      setFeatureStats(featureData);
      setErrorStats(errorData);
      setPerformanceStats(performanceData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load monitoring data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFlushMetrics = async () => {
    try {
      await compatibilityMonitoring.flush();
      await loadMonitoringData();
    } catch (error) {
      console.error('Failed to flush metrics:', error);
    }
  };

  const formatBrowserDistributionData = () => {
    if (!report) return [];

    return Object.entries(report.browserDistribution).map(([browser, count]) => ({
      browser,
      count,
      percentage: ((count / Object.values(report.browserDistribution).reduce((a, b) => a + b, 0)) * 100).toFixed(1)
    }));
  };

  const formatFeatureSupportData = () => {
    if (!report) return [];

    return Object.entries(report.featureSupport).map(([feature, data]) => ({
      feature,
      supported: data.supported,
      total: data.total,
      polyfillUsage: data.polyfillUsage,
      supportPercentage: ((data.supported / data.total) * 100).toFixed(1),
      polyfillPercentage: ((data.polyfillUsage / data.total) * 100).toFixed(1)
    }));
  };

  const formatErrorData = () => {
    if (!errorStats) return [];

    return Object.entries(errorStats.bySeverity).map(([severity, count]) => ({
      severity,
      count,
      percentage: (((count as number) / errorStats.total) * 100).toFixed(1)
    }));
  };



  if (isLoading && !report) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Мониторинг совместимости</h2>
          <p className="text-muted-foreground">
            Статистика браузеров, поддержки функций и производительности
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadMonitoringData} variant="outline" size="sm">
            Обновить
          </Button>
          <Button onClick={handleFlushMetrics} variant="outline" size="sm">
            Сохранить метрики
          </Button>
        </div>
      </div>

      {lastUpdated && (
        <Alert>
          <AlertDescription>
            Последнее обновление: {lastUpdated.toLocaleString('ru-RU')}
          </AlertDescription>
        </Alert>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Всего сессий</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{browserStats?.totalSessions || 0}</div>
            <p className="text-xs text-muted-foreground">
              {browserStats?.uniqueBrowsers || 0} уникальных браузеров
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Поддерживаемые браузеры</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {browserStats?.supportedBrowsers || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {browserStats?.totalSessions ?
                ((browserStats.supportedBrowsers / browserStats.totalSessions) * 100).toFixed(1) : 0}% от общего числа
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ошибки совместимости</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{errorStats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {errorStats?.withFallbacks || 0} с fallback решениями
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Среднее время полифилов</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {report?.performanceImpact.polyfillOverhead.toFixed(1) || 0}ms
            </div>
            <p className="text-xs text-muted-foreground">
              Влияние на производительность
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="browsers">Браузеры</TabsTrigger>
          <TabsTrigger value="features">Функции</TabsTrigger>
          <TabsTrigger value="errors">Ошибки</TabsTrigger>
          <TabsTrigger value="performance">Производительность</TabsTrigger>
        </TabsList>

        <TabsContent value="browsers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Распределение браузеров</CardTitle>
              <CardDescription>
                Статистика использования различных браузеров
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={formatBrowserDistributionData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="browser" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Типы устройств</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {browserStats?.deviceTypes && Object.entries(browserStats.deviceTypes).map(([type, count]) => (
                    <div key={type} className="flex justify-between items-center">
                      <span className="capitalize">{type}</span>
                      <Badge variant="outline">{count as number}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Платформы</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {browserStats?.platforms && Object.entries(browserStats.platforms).map(([platform, count]) => (
                    <div key={platform} className="flex justify-between items-center">
                      <span>{platform}</span>
                      <Badge variant="outline">{count as number}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Поддержка функций</CardTitle>
              <CardDescription>
                Статистика поддержки функций и использования полифилов
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={formatFeatureSupportData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="feature" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="supported" fill="#00C49F" name="Поддерживается" />
                    <Bar dataKey="polyfillUsage" fill="#FFBB28" name="Использует полифил" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Детальная статистика функций</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {featureStats && Object.entries(featureStats).map(([feature, stats]: [string, any]) => (
                  <div key={feature} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">{feature}</h4>
                      <div className="flex gap-2">
                        <Badge variant="outline">
                          {((stats.supported / stats.total) * 100).toFixed(1)}% поддержка
                        </Badge>
                        {stats.polyfillUsed > 0 && (
                          <Badge variant="secondary">
                            {stats.polyfillUsed} полифилов
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Всего проверок: {stats.total} |
                      Поддерживается: {stats.supported} |
                      Среднее время загрузки: {stats.avgLoadTime.toFixed(1)}ms
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Ошибки по серьезности</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={formatErrorData()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }: any) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {formatErrorData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Типы ошибок</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {errorStats?.byType && Object.entries(errorStats.byType).map(([type, count]) => (
                    <div key={type} className="flex justify-between items-center">
                      <span className="capitalize">{type}</span>
                      <Badge variant="outline">{count as number}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Влияние на пользователей</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {errorStats?.userImpact && Object.entries(errorStats.userImpact).map(([impact, count]) => (
                  <div key={impact} className="text-center">
                    <div className="text-2xl font-bold">{count as number}</div>
                    <div className="text-sm text-muted-foreground capitalize">{impact}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Полифилы</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {report?.performanceImpact.polyfillOverhead.toFixed(1)}ms
                </div>
                <p className="text-sm text-muted-foreground">
                  Среднее время загрузки
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Детекция функций</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {report?.performanceImpact.detectionTime.toFixed(1)}ms
                </div>
                <p className="text-sm text-muted-foreground">
                  Среднее время детекции
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Fallback рендеринг</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {report?.performanceImpact.fallbackRenderTime.toFixed(1)}ms
                </div>
                <p className="text-sm text-muted-foreground">
                  Среднее время рендеринга
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Детальная статистика производительности</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceStats && Object.entries(performanceStats).map(([metric, stats]: [string, any]) => (
                  <div key={metric} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">{metric}</h4>
                      <Badge variant="outline">{stats.category}</Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <div className="font-medium">Среднее</div>
                        <div>{stats.avg.toFixed(1)} {stats.unit}</div>
                      </div>
                      <div>
                        <div className="font-medium">Медиана</div>
                        <div>{stats.median.toFixed(1)} {stats.unit}</div>
                      </div>
                      <div>
                        <div className="font-medium">Минимум</div>
                        <div>{stats.min.toFixed(1)} {stats.unit}</div>
                      </div>
                      <div>
                        <div className="font-medium">Максимум</div>
                        <div>{stats.max.toFixed(1)} {stats.unit}</div>
                      </div>
                      <div>
                        <div className="font-medium">Количество</div>
                        <div>{stats.count}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
