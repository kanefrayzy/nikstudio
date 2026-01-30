'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { 
  Monitor, 
  Save, 
  AlertCircle, 
  CheckCircle, 
  Settings,
  Users,
  Workflow,
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  ChevronUp,
  ChevronDown,
  Loader2
} from "lucide-react";
import { get, put, post, del } from '@/lib/api';

// Lazy load admin dialog components with loading states
const ServiceBlockDialog = dynamic(
  () => import('./ServiceBlockDialog').then(mod => ({ default: mod.ServiceBlockDialog })),
  {
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    ),
    ssr: false
  }
);

const TestimonialDialog = dynamic(
  () => import('./TestimonialDialog').then(mod => ({ default: mod.TestimonialDialog })),
  {
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    ),
    ssr: false
  }
);

const ProcessStepDialog = dynamic(
  () => import('./ProcessStepDialog').then(mod => ({ default: mod.ProcessStepDialog })),
  {
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    ),
    ssr: false
  }
);

interface MediaPageAdminProps {
  onBack?: () => void;
}

interface HeroContent {
  title: string;
  description: string;
}

interface TestimonialsHeader {
  title: string;
  subtitle: string;
}

interface ProcessHeader {
  title: string;
  subtitle: string;
}

interface MediaService {
  id: number;
  title: string;
  description: string;
  dark_background: boolean;
  order: number;
  features: ServiceFeature[];
  mediaItems?: MediaItem[];
}

interface ServiceFeature {
  id: number;
  title: string;
  description: string[];
  order: number;
}

interface MediaItem {
  id: number;
  group_id: number;
  media_type: 'main' | 'secondary';
  file_type: 'image' | 'video';
  file_path: string;
  poster_path?: string;
  alt_text: string;
  order: number;
}

interface Testimonial {
  id: number;
  company: string;
  quote: string;
  description: string;
  image_path: string;
  order: number;
}

interface ProcessStep {
  id: number;
  step_number: string;
  title: string;
  subtitle: string;
  image_path: string;
  description_left: string;
  description_right: string;
  order: number;
}

export function MediaPageAdmin({ onBack }: MediaPageAdminProps) {
  const [activeTab, setActiveTab] = useState('hero');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Hero content state
  const [heroContent, setHeroContent] = useState<HeroContent>({
    title: '',
    description: ''
  });

  // Testimonials header state
  const [testimonialsHeader, setTestimonialsHeader] = useState<TestimonialsHeader>({
    title: '',
    subtitle: ''
  });

  // Process header state
  const [processHeader, setProcessHeader] = useState<ProcessHeader>({
    title: '',
    subtitle: ''
  });

  // Services state
  const [services, setServices] = useState<MediaService[]>([]);
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<MediaService | null>(null);

  // Testimonials state
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [testimonialDialogOpen, setTestimonialDialogOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);

  // Process steps state
  const [processSteps, setProcessSteps] = useState<ProcessStep[]>([]);
  const [processStepDialogOpen, setProcessStepDialogOpen] = useState(false);
  const [editingProcessStep, setEditingProcessStep] = useState<ProcessStep | null>(null);

  // Auto-clear messages
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Load initial data
  useEffect(() => {
    loadMediaPageContent();
    loadServices();
    loadTestimonials();
    loadProcessSteps();
  }, []);

  const loadMediaPageContent = async () => {
    try {
      setLoading(true);
      const data = await get<{ success: boolean; data: any }>('/api/admin/media-page');
      
      if (data.success && data.data) {
        setHeroContent({
          title: data.data.hero_title || '',
          description: data.data.hero_description || ''
        });
        
        setTestimonialsHeader({
          title: data.data.testimonials_title || '',
          subtitle: data.data.testimonials_subtitle || ''
        });
        
        setProcessHeader({
          title: data.data.process_title || '',
          subtitle: data.data.process_subtitle || ''
        });
      }
    } catch (error: any) {
      console.error('Ошибка при загрузке контента медиа-страницы:', error);
      if (error.response?.status === 404) {
        console.warn('API endpoint для медиа-страницы не найден, используем значения по умолчанию');
      }
      // Устанавливаем значения по умолчанию при любой ошибке
      setHeroContent({
        title: 'МЕДИА',
        description: 'Создаём проекты комплексно и выполняем отдельные задачи'
      });
      
      setTestimonialsHeader({
        title: 'говорят о нас',
        subtitle: 'Команда NIKstudio закрывает целый ряд задач с энтузиазмом и полной ответственностью'
      });
      
      setProcessHeader({
        title: 'процесс',
        subtitle: 'Процесс работы строится на взаимодействии всех специалистов под единым руководством'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadServices = async () => {
    try {
      const data = await get<{ status: string; data: any[] }>('/api/media-services');
      
      if (data.status === 'success' && data.data) {
        // Трансформируем данные для соответствия интерфейсу
        const transformedServices = data.data.map((service: any) => ({
          ...service,
          mediaItems: service.media_items || service.mediaItems || []
        }));
        
        setServices(transformedServices);
      } else {
        setServices([]);
      }
    } catch (err: any) {
      console.error('Ошибка при загрузке услуг:', err);
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Не удается подключиться к серверу. Убедитесь, что Laravel сервер запущен на http://localhost:8000');
      } else {
        setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
      }
      setServices([]);
    }
  };

  const handleAddService = () => {
    setEditingService(null);
    setServiceDialogOpen(true);
  };

  const handleEditService = (service: MediaService) => {
    setEditingService(service);
    setServiceDialogOpen(true);
  };

  const handleDeleteService = async (serviceId: number) => {
    try {
      setLoading(true);
      const data = await del<{ status: string; message?: string }>(`/api/media-services/${serviceId}`);

      if (data.status === 'success') {
        setSuccess('Блок услуги успешно удалён');
        loadServices();
      } else {
        throw new Error(data.message || 'Ошибка при удалении блока услуги');
      }
    } catch (err: any) {
      console.error('Ошибка при удалении блока услуги:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Неизвестная ошибка';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleMoveService = async (serviceId: number, direction: 'up' | 'down') => {
    try {
      setLoading(true);
      const data = await put<{ status: string; message?: string }>(`/api/media-services/${serviceId}/move-${direction}`);

      if (data.status === 'success') {
        loadServices();
      } else {
        throw new Error(data.message || `Ошибка при перемещении блока услуги ${direction === 'up' ? 'вверх' : 'вниз'}`);
      }
    } catch (err: any) {
      console.error(`Ошибка при перемещении блока услуги ${direction === 'up' ? 'вверх' : 'вниз'}:`, err);
      const errorMessage = err.response?.data?.message || err.message || 'Неизвестная ошибка';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceSave = () => {
    loadServices();
  };

  const loadTestimonials = async () => {
    try {
      const data = await get<{ status: string; data: any[] }>('/api/admin/media-testimonials');
      
      if (data.status === 'success' && data.data) {
        setTestimonials(data.data);
      } else {
        setTestimonials([]);
      }
    } catch (err: any) {
      console.error('Ошибка при загрузке отзывов:', err);
      if (err.response?.status === 404) {
        console.warn('API endpoint для отзывов не найден');
      }
      setTestimonials([]);
    }
  };

  const handleAddTestimonial = () => {
    setEditingTestimonial(null);
    setTestimonialDialogOpen(true);
  };

  const handleEditTestimonial = (testimonial: Testimonial) => {
    setEditingTestimonial(testimonial);
    setTestimonialDialogOpen(true);
  };

  const handleDeleteTestimonial = async (testimonialId: number) => {
    try {
      setLoading(true);
      const data = await del<{ status: string; message?: string }>(`/api/admin/media-testimonials/${testimonialId}`);

      if (data.status === 'success') {
        setSuccess('Отзыв успешно удалён');
        loadTestimonials();
      } else {
        throw new Error(data.message || 'Ошибка при удалении отзыва');
      }
    } catch (err) {
      console.error('Ошибка при удалении отзыва:', err);
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  };

  const handleMoveTestimonial = async (testimonialId: number, direction: 'up' | 'down') => {
    const currentIndex = testimonials.findIndex(t => t.id === testimonialId);
    if (currentIndex === -1) return;

    const newTestimonials = [...testimonials];
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (targetIndex < 0 || targetIndex >= newTestimonials.length) return;

    // Swap the testimonials
    [newTestimonials[currentIndex], newTestimonials[targetIndex]] = 
    [newTestimonials[targetIndex], newTestimonials[currentIndex]];

    // Update order values
    const reorderedTestimonials = newTestimonials.map((testimonial, index) => ({
      id: testimonial.id,
      order: index + 1
    }));

    try {
      setLoading(true);
      const data = await post<{ status: string; message?: string }>('/api/admin/media-testimonials/reorder', {
        testimonials: reorderedTestimonials
      });

      if (data.status === 'success') {
        loadTestimonials();
      } else {
        throw new Error(data.message || 'Ошибка при изменении порядка отзывов');
      }
    } catch (err: any) {
      console.error('Ошибка при изменении порядка отзывов:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Неизвестная ошибка';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleTestimonialSave = () => {
    loadTestimonials();
  };

  const loadProcessSteps = async () => {
    try {
      const data = await get<{ success?: boolean; status?: string; data: any[] }>('/api/admin/media-process-steps');
      
      if ((data.success || data.status === 'success') && data.data) {
        setProcessSteps(data.data);
      } else {
        setProcessSteps([]);
      }
    } catch (err: any) {
      console.error('Ошибка при загрузке шагов процесса:', err);
      if (err.response?.status === 404) {
        console.warn('API endpoint для шагов процесса не найден');
      }
      setProcessSteps([]);
    }
  };

  const handleAddProcessStep = () => {
    setEditingProcessStep(null);
    setProcessStepDialogOpen(true);
  };

  const handleEditProcessStep = (processStep: ProcessStep) => {
    setEditingProcessStep(processStep);
    setProcessStepDialogOpen(true);
  };

  const handleDeleteProcessStep = async (processStepId: number) => {
    try {
      setLoading(true);
      const data = await del<{ success: boolean; message?: string }>(`/api/admin/media-process-steps/${processStepId}`);

      if (data.success) {
        setSuccess('Шаг процесса успешно удалён');
        loadProcessSteps();
      } else {
        throw new Error(data.message || 'Ошибка при удалении шага процесса');
      }
    } catch (err) {
      console.error('Ошибка при удалении шага процесса:', err);
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  };

  const handleMoveProcessStep = async (processStepId: number, direction: 'up' | 'down') => {
    const currentIndex = processSteps.findIndex(p => p.id === processStepId);
    if (currentIndex === -1) return;

    const newProcessSteps = [...processSteps];
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (targetIndex < 0 || targetIndex >= newProcessSteps.length) return;

    // Swap the process steps
    [newProcessSteps[currentIndex], newProcessSteps[targetIndex]] = 
    [newProcessSteps[targetIndex], newProcessSteps[currentIndex]];

    // Update order values
    const reorderedProcessSteps = newProcessSteps.map((processStep, index) => ({
      id: processStep.id,
      order: index + 1
    }));

    try {
      setLoading(true);
      const data = await post<{ status: string; message?: string }>('/api/admin/media-process-steps/reorder', {
        steps: reorderedProcessSteps
      });

      if (data.status === 'success') {
        loadProcessSteps();
      } else {
        throw new Error(data.message || 'Ошибка при изменении порядка шагов процесса');
      }
    } catch (err: any) {
      console.error('Ошибка при изменении порядка шагов процесса:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Неизвестная ошибка';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessStepSave = () => {
    loadProcessSteps();
  };

  const handleHeroSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const data = await put<{ success: boolean; message?: string }>('/api/admin/media-page/hero', {
        hero_title: heroContent.title,
        hero_description: heroContent.description
      });

      console.log('[Hero Submit] Получен ответ:', data);

      if (data.success) {
        setSuccess('Контент Hero успешно сохранён');
      } else {
        throw new Error(data.message || 'Ошибка при сохранении Hero');
      }
    } catch (err: any) {
      console.error('[Hero Submit] Ошибка:', err);
      console.error('[Hero Submit] Детали ошибки:', {
        response: err.response,
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });
      
      const errorMessage = err.response?.data?.message || err.message || 'Неизвестная ошибка';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleTestimonialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const data = await put<{ success: boolean; message?: string }>('/api/admin/media-page/testimonials-header', {
        testimonials_title: testimonialsHeader.title,
        testimonials_subtitle: testimonialsHeader.subtitle
      });

      if (data.success) {
        setSuccess('Заголовок отзывов успешно сохранён');
      } else {
        throw new Error(data.message || 'Ошибка при сохранении заголовка отзывов');
      }
    } catch (err: any) {
      console.error('Ошибка при сохранении заголовка отзывов:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Неизвестная ошибка';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const data = await put<{ success: boolean; message?: string }>('/api/admin/media-page/process-header', {
        process_title: processHeader.title,
        process_subtitle: processHeader.subtitle
      });

      if (data.success) {
        setSuccess('Заголовок процесса успешно сохранён');
      } else {
        throw new Error(data.message || 'Ошибка при сохранении заголовка процесса');
      }
    } catch (err: any) {
      console.error('Ошибка при сохранении заголовка процесса:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Неизвестная ошибка';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      {/* Breadcrumb Navigation */}
      <div className="mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/admin">Админ-панель</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Управление медиа-страницей</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад
          </Button>
        )}
        <div className="flex items-center gap-4">
          <Button variant="outline" asChild>
            <Link href="/admin">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <Monitor className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold">Управление медиа-страницей</h1>
              <p className="text-gray-600">Настройка контента для страницы медиа-услуг</p>
            </div>
          </div>
        </div>
      </div>

      {/* Server status notification */}
      {services.length === 0 && testimonials.length === 0 && processSteps.length === 0 && !loading && (
        <Alert className="mb-4 border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Сервер не подключен:</strong> Для полной функциональности запустите Laravel сервер командой{' '}
            <code className="bg-orange-100 px-1 py-0.5 rounded text-sm">php artisan serve</code> в папке backend_laravel
          </AlertDescription>
        </Alert>
      )}

      {/* Auto-dismissing notifications */}
      {success && (
        <Alert className="mb-4">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="hero" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Hero
          </TabsTrigger>
          <TabsTrigger value="services" className="flex items-center gap-2">
            <Monitor className="w-4 h-4" />
            Услуги
          </TabsTrigger>
          <TabsTrigger value="testimonials" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Отзывы
          </TabsTrigger>
          <TabsTrigger value="process" className="flex items-center gap-2">
            <Workflow className="w-4 h-4" />
            Процесс
          </TabsTrigger>
        </TabsList>

        {/* Hero Content Tab */}
        <TabsContent value="hero">
          <Card>
            <CardHeader>
              <CardTitle>Управление Hero страницы</CardTitle>
              <CardDescription>
                Настройка основного заголовка и описания медиа-страницы
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleHeroSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="hero_title">Заголовок *</Label>
                  <Input
                    id="hero_title"
                    value={heroContent.title}
                    onChange={(e) => setHeroContent(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="МЕДИА"
                    required
                    maxLength={100}
                  />
                  <p className="text-sm text-muted-foreground">
                    Основной заголовок страницы ({heroContent.title.length}/100)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hero_description">Описание *</Label>
                  <Textarea
                    id="hero_description"
                    value={heroContent.description}
                    onChange={(e) => setHeroContent(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Создаём проекты комплексно и выполняем отдельные задачи"
                    required
                    maxLength={500}
                    rows={3}
                  />
                  <p className="text-sm text-muted-foreground">
                    Описание под заголовком ({heroContent.description.length}/500)
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={loading} className="flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    {loading ? 'Сохранение...' : 'Сохранить Hero'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Управление услугами
                <Button onClick={handleAddService} className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Добавить блок услуги
                </Button>
              </CardTitle>
              <CardDescription>
                Управление блоками услуг, их контентом и медиа-файлами
              </CardDescription>
            </CardHeader>
            <CardContent>
              {services.length === 0 ? (
                <div className="text-center py-12">
                  <Monitor className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Блоки услуг не созданы</p>
                  <p className="text-sm text-gray-500 mb-6">
                    Создайте первый блок услуги для отображения на медиа-странице
                  </p>
                  <Button onClick={handleAddService} className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Создать первый блок
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {services.map((service, index) => (
                    <Card key={service.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">{service.title}</h3>
                              {service.dark_background && (
                                <span className="px-2 py-1 bg-gray-800 text-white text-xs rounded">
                                  Тёмный фон
                                </span>
                              )}
                            </div>
                            {service.description && (
                              <p className="text-gray-600 mb-3 line-clamp-2">
                                {service.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>Функций: {service.features?.length || 0}</span>
                              <span>Медиа-групп: {service.mediaItems ? new Set(service.mediaItems.map(item => item.group_id)).size : 0}</span>
                              <span>Порядок: {service.order}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {/* Move buttons */}
                            <div className="flex flex-col gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMoveService(service.id, 'up')}
                                disabled={index === 0 || loading}
                                className="h-6 w-6 p-0"
                              >
                                <ChevronUp className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMoveService(service.id, 'down')}
                                disabled={index === services.length - 1 || loading}
                                className="h-6 w-6 p-0"
                              >
                                <ChevronDown className="w-3 h-3" />
                              </Button>
                            </div>
                            {/* Action buttons */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditService(service)}
                              disabled={loading}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteService(service.id)}
                              disabled={loading}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Testimonials Tab */}
        <TabsContent value="testimonials" className="space-y-6">
          {/* Header Management */}
          <Card>
            <CardHeader>
              <CardTitle>Управление заголовком отзывов</CardTitle>
              <CardDescription>
                Настройка заголовка и подзаголовка секции отзывов
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTestimonialsSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="testimonials_title">Заголовок *</Label>
                  <Input
                    id="testimonials_title"
                    value={testimonialsHeader.title}
                    onChange={(e) => setTestimonialsHeader(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="говорят о нас"
                    required
                    maxLength={100}
                  />
                  <p className="text-sm text-muted-foreground">
                    Заголовок секции отзывов ({testimonialsHeader.title.length}/100)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="testimonials_subtitle">Подзаголовок *</Label>
                  <Textarea
                    id="testimonials_subtitle"
                    value={testimonialsHeader.subtitle}
                    onChange={(e) => setTestimonialsHeader(prev => ({ ...prev, subtitle: e.target.value }))}
                    placeholder="Команда NIKstudio закрывает целый ряд задач с энтузиазмом и полной ответственностью"
                    required
                    maxLength={500}
                    rows={3}
                  />
                  <p className="text-sm text-muted-foreground">
                    Подзаголовок секции отзывов ({testimonialsHeader.subtitle.length}/500)
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={loading} className="flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    {loading ? 'Сохранение...' : 'Сохранить заголовок'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Testimonials Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Управление отзывами
                <Button onClick={handleAddTestimonial} className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Добавить отзыв
                </Button>
              </CardTitle>
              <CardDescription>
                Управление отзывами клиентов с изображениями и описаниями
              </CardDescription>
            </CardHeader>
            <CardContent>
              {testimonials.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Отзывы не созданы</p>
                  <p className="text-sm text-gray-500 mb-6">
                    Создайте первый отзыв для отображения на медиа-странице
                  </p>
                  <Button onClick={handleAddTestimonial} className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Создать первый отзыв
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {testimonials.map((testimonial, index) => (
                    <Card key={testimonial.id} className="border-l-4 border-l-green-500">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-start gap-4">
                              {/* Testimonial Image */}
                              <div className="relative w-16 h-16 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                                {testimonial.image_path && (
                                  <img
                                    src={`${process.env.NEXT_PUBLIC_API_URL}/storage/${testimonial.image_path}`}
                                    alt={testimonial.company}
                                    className="w-full h-full object-cover"
                                  />
                                )}
                              </div>
                              
                              {/* Testimonial Content */}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-semibold text-lg">{testimonial.company}</h3>
                                </div>
                                
                                <blockquote className="text-gray-700 italic mb-2 line-clamp-2">
                                  "{testimonial.quote}"
                                </blockquote>
                                
                                {testimonial.description && (
                                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                    {testimonial.description}
                                  </p>
                                )}
                                
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                  <span>Порядок: {testimonial.order}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {/* Move buttons */}
                            <div className="flex flex-col gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMoveTestimonial(testimonial.id, 'up')}
                                disabled={index === 0 || loading}
                                className="h-6 w-6 p-0"
                              >
                                <ChevronUp className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMoveTestimonial(testimonial.id, 'down')}
                                disabled={index === testimonials.length - 1 || loading}
                                className="h-6 w-6 p-0"
                              >
                                <ChevronDown className="w-3 h-3" />
                              </Button>
                            </div>
                            {/* Action buttons */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditTestimonial(testimonial)}
                              disabled={loading}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteTestimonial(testimonial.id)}
                              disabled={loading}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Process Tab */}
        <TabsContent value="process" className="space-y-6">
          {/* Header Management */}
          <Card>
            <CardHeader>
              <CardTitle>Управление заголовком процесса</CardTitle>
              <CardDescription>
                Настройка заголовка и подзаголовка секции процесса работы
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProcessSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="process_title">Заголовок *</Label>
                  <Input
                    id="process_title"
                    value={processHeader.title}
                    onChange={(e) => setProcessHeader(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="процесс"
                    required
                    maxLength={100}
                  />
                  <p className="text-sm text-muted-foreground">
                    Заголовок секции процесса ({processHeader.title.length}/100)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="process_subtitle">Подзаголовок *</Label>
                  <Textarea
                    id="process_subtitle"
                    value={processHeader.subtitle}
                    onChange={(e) => setProcessHeader(prev => ({ ...prev, subtitle: e.target.value }))}
                    placeholder="Процесс работы строится на взаимодействии всех специалистов под единым руководством"
                    required
                    maxLength={500}
                    rows={3}
                  />
                  <p className="text-sm text-muted-foreground">
                    Подзаголовок секции процесса ({processHeader.subtitle.length}/500)
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={loading} className="flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    {loading ? 'Сохранение...' : 'Сохранить заголовок'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Process Steps Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Управление шагами процесса
                <Button onClick={handleAddProcessStep} className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Добавить шаг процесса
                </Button>
              </CardTitle>
              <CardDescription>
                Управление шагами процесса работы с изображениями и описаниями
              </CardDescription>
            </CardHeader>
            <CardContent>
              {processSteps.length === 0 ? (
                <div className="text-center py-12">
                  <Workflow className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Шаги процесса не созданы</p>
                  <p className="text-sm text-gray-500 mb-6">
                    Создайте первый шаг процесса для отображения на медиа-странице
                  </p>
                  <Button onClick={handleAddProcessStep} className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Создать первый шаг
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {processSteps.map((processStep, index) => (
                    <Card key={processStep.id} className="border-l-4 border-l-purple-500">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-start gap-4">
                              {/* Process Step Image */}
                              <div className="relative w-20 h-16 bg-gray-200 overflow-hidden flex-shrink-0 rounded">
                                {processStep.image_path && (
                                  <img
                                    src={`${process.env.NEXT_PUBLIC_API_URL}/storage/${processStep.image_path}`}
                                    alt={processStep.title}
                                    className="w-full h-full object-cover"
                                  />
                                )}
                              </div>
                              
                              {/* Process Step Content */}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded font-mono">
                                    {processStep.step_number}
                                  </span>
                                  <h3 className="font-semibold text-lg">{processStep.title}</h3>
                                </div>
                                
                                <p className="text-gray-700 font-medium mb-2">
                                  {processStep.subtitle}
                                </p>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                  <div>
                                    <p className="text-xs text-gray-500 mb-1">Левое описание:</p>
                                    <p className="text-gray-600 text-sm line-clamp-2">
                                      {processStep.description_left}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500 mb-1">Правое описание:</p>
                                    <p className="text-gray-600 text-sm line-clamp-2">
                                      {processStep.description_right}
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                  <span>Порядок: {processStep.order}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {/* Move buttons */}
                            <div className="flex flex-col gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMoveProcessStep(processStep.id, 'up')}
                                disabled={index === 0 || loading}
                                className="h-6 w-6 p-0"
                              >
                                <ChevronUp className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMoveProcessStep(processStep.id, 'down')}
                                disabled={index === processSteps.length - 1 || loading}
                                className="h-6 w-6 p-0"
                              >
                                <ChevronDown className="w-3 h-3" />
                              </Button>
                            </div>
                            {/* Action buttons */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditProcessStep(processStep)}
                              disabled={loading}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteProcessStep(processStep.id)}
                              disabled={loading}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Service Block Dialog */}
      <ServiceBlockDialog
        open={serviceDialogOpen}
        onOpenChange={setServiceDialogOpen}
        service={editingService}
        onSave={handleServiceSave}
      />

      {/* Testimonial Dialog */}
      <TestimonialDialog
        open={testimonialDialogOpen}
        onOpenChange={setTestimonialDialogOpen}
        testimonial={editingTestimonial}
        onSave={handleTestimonialSave}
      />

      {/* Process Step Dialog */}
      <ProcessStepDialog
        open={processStepDialogOpen}
        onOpenChange={setProcessStepDialogOpen}
        processStep={editingProcessStep}
        onSave={handleProcessStepSave}
      />
    </div>
  );
}