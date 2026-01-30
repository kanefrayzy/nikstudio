'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Briefcase, 
  FileText, 
  Save, 
  Upload, 
  X, 
  AlertCircle, 
  CheckCircle, 
  Edit,
  Search,
  Filter
} from "lucide-react";
import { get, post } from '@/lib/api';

interface ContentSEOManagerProps {
  stats?: {
    total_projects: number;
    projects_with_seo: number;
    projects_without_seo: number;
    total_blog_posts: number;
    blog_posts_with_seo: number;
    blog_posts_without_seo: number;
  };
  onUpdate?: () => void;
}

interface ContentItem {
  id: number;
  title: string;
  main_title?: string;
  slug: string;
  seo_title: string | null;
  seo_description: string | null;
  seo_image: string | null;
  main_image?: string;
  image?: string;
}

interface SEOFormData {
  seo_title: string;
  seo_description: string;
  seo_image: File | null;
}

export function ContentSEOManager({ stats, onUpdate }: ContentSEOManagerProps) {
  const [activeTab, setActiveTab] = useState('projects');
  const [projects, setProjects] = useState<ContentItem[]>([]);
  const [blogPosts, setBlogPosts] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'with_seo' | 'without_seo'>('all');
  
  // SEO Edit Dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [editingType, setEditingType] = useState<'project' | 'blog'>('project');
  const [seoFormData, setSeoFormData] = useState<SEOFormData>({
    seo_title: '',
    seo_description: '',
    seo_image: null,
  });
  const [currentImageUrl, setCurrentImageUrl] = useState<string>('');
  
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
    fetchBlogPosts();
  }, []);

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

  const fetchProjects = async () => {
    try {
      const result = await get<{ success: boolean; data: ContentItem[] }>('/api/projects');
      
      if (result?.success) {
        setProjects(result.data);
      }
    } catch (err) {
      console.error('Ошибка при загрузке проектов:', err);
    }
  };

  const fetchBlogPosts = async () => {
    try {
      const result = await get<{ status?: string; success?: boolean; data: ContentItem[] }>('/api/blog-posts');
      
      console.log('Blog posts response:', result);
      
      // API блога возвращает status вместо success
      if (result?.status === 'success' || result?.success) {
        console.log('Setting blog posts:', result.data);
        setBlogPosts(result.data);
      } else {
        console.error('Неожиданный формат ответа API блога:', result);
      }
    } catch (err) {
      console.error('Ошибка при загрузке постов блога:', err);
    }
  };

  const openEditDialog = (item: ContentItem, type: 'project' | 'blog') => {
    setEditingItem(item);
    setEditingType(type);
    setSeoFormData({
      seo_title: item.seo_title || '',
      seo_description: item.seo_description || '',
      seo_image: null,
    });
    
    if (item.seo_image) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      setCurrentImageUrl(`${apiUrl}/storage/${item.seo_image}`);
    } else {
      setCurrentImageUrl('');
    }
    
    setEditDialogOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (2MB max)
      if (file.size > 2 * 1024 * 1024) {
        setError('Размер изображения не должен превышать 2 МБ');
        return;
      }

      // Validate file type
      if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type)) {
        setError('Поддерживаются только форматы: JPG, PNG, WEBP');
        return;
      }

      setSeoFormData(prev => ({
        ...prev,
        seo_image: file
      }));

      // Preview image
      const reader = new FileReader();
      reader.onload = (e) => {
        setCurrentImageUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSeoFormData(prev => ({
      ...prev,
      seo_image: null
    }));
    setCurrentImageUrl('');
  };

  const handleSeoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingItem) return;
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Debug: проверяем наличие токена
      const token = document.cookie.split(';').find(c => c.trim().startsWith('admin-token='));
      console.log('[ContentSEOManager] Token exists:', !!token);
      if (!token) {
        throw new Error('Токен авторизации не найден. Пожалуйста, войдите в систему.');
      }

      const formData = new FormData();
      formData.append('seo_title', seoFormData.seo_title);
      formData.append('seo_description', seoFormData.seo_description);
      
      if (seoFormData.seo_image) {
        formData.append('seo_image', seoFormData.seo_image);
      }

      const endpoint = editingType === 'project' 
        ? `/api/seo/projects/${editingItem.slug}`
        : `/api/seo/blog/${editingItem.slug}`;
      
      console.log('[ContentSEOManager] Отправка запроса на:', endpoint);
      const result = await post<{ success: boolean; message?: string }>(endpoint, formData);
      console.log('[ContentSEOManager] Ответ получен:', result);

      if (result?.success) {
        setSuccess(`SEO-данные для "${editingItem.title || editingItem.main_title}" успешно сохранены`);
        setEditDialogOpen(false);
        
        // Refresh data
        if (editingType === 'project') {
          fetchProjects();
        } else {
          fetchBlogPosts();
        }
        
        if (onUpdate) {
          onUpdate();
        }
      } else {
        throw new Error(result?.message || 'Ошибка при сохранении SEO-данных');
      }
    } catch (err: any) {
      console.error('Ошибка при сохранении SEO-данных:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Неизвестная ошибка';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const filterItems = (items: ContentItem[]) => {
    let filtered = items;
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(item => 
        (item.title || item.main_title || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by SEO status
    if (filterType === 'with_seo') {
      filtered = filtered.filter(item => item.seo_title || item.seo_description);
    } else if (filterType === 'without_seo') {
      filtered = filtered.filter(item => !item.seo_title && !item.seo_description);
    }
    
    return filtered;
  };

  const renderContentList = (items: ContentItem[], type: 'project' | 'blog') => {
    console.log(`Rendering ${type} content:`, { 
      totalItems: items.length, 
      searchTerm, 
      filterType,
      items: items.slice(0, 2) // Show first 2 items for debugging
    });
    
    const filteredItems = filterItems(items);
    console.log(`Filtered ${type} items:`, filteredItems.length);
    
    return (
      <div className="space-y-4">
        {filteredItems.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-lg">
                    {item.title || item.main_title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Slug: {item.slug}
                  </p>
                  
                  <div className="flex items-center gap-2 mt-2">
                    {item.seo_title || item.seo_description ? (
                      <Badge variant="default">SEO настроено</Badge>
                    ) : (
                      <Badge variant="outline">SEO не настроено</Badge>
                    )}
                    
                    {item.seo_title && (
                      <Badge variant="secondary">Заголовок</Badge>
                    )}
                    
                    {item.seo_description && (
                      <Badge variant="secondary">Описание</Badge>
                    )}
                    
                    {item.seo_image && (
                      <Badge variant="secondary">Изображение</Badge>
                    )}
                  </div>
                  
                  {item.seo_title && (
                    <p className="text-sm text-gray-700 mt-2">
                      <strong>SEO заголовок:</strong> {item.seo_title}
                    </p>
                  )}
                  
                  {item.seo_description && (
                    <p className="text-sm text-gray-700 mt-1">
                      <strong>SEO описание:</strong> {item.seo_description.substring(0, 100)}
                      {item.seo_description.length > 100 && '...'}
                    </p>
                  )}
                </div>
                
                <Button
                  onClick={() => openEditDialog(item, type)}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Редактировать SEO
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {filteredItems.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Нет элементов для отображения
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Управление SEO контента</CardTitle>
          <CardDescription>
            Настройка SEO для отдельных проектов и постов блога
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Поиск по названию..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">Все</option>
                <option value="with_seo">С SEO</option>
                <option value="without_seo">Без SEO</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="projects" className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            Проекты ({stats?.total_projects || 0})
          </TabsTrigger>
          <TabsTrigger value="blog" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Блог ({stats?.total_blog_posts || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="mt-6">
          {renderContentList(projects, 'project')}
        </TabsContent>

        <TabsContent value="blog" className="mt-6">
          {renderContentList(blogPosts, 'blog')}
        </TabsContent>
      </Tabs>

      {/* SEO Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Редактировать SEO: {editingItem?.title || editingItem?.main_title}
            </DialogTitle>
            <DialogDescription>
              Настройте SEO-параметры для этого элемента
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSeoSubmit} className="space-y-4">
            {/* SEO Title */}
            <div className="space-y-2">
              <Label htmlFor="edit_seo_title">SEO Заголовок</Label>
              <Input
                id="edit_seo_title"
                value={seoFormData.seo_title}
                onChange={(e) => setSeoFormData(prev => ({
                  ...prev,
                  seo_title: e.target.value
                }))}
                placeholder="Уникальный заголовок для поисковых систем"
                maxLength={255}
              />
              <p className="text-sm text-muted-foreground">
                {seoFormData.seo_title.length}/255 символов
              </p>
            </div>

            {/* SEO Description */}
            <div className="space-y-2">
              <Label htmlFor="edit_seo_description">SEO Описание</Label>
              <Textarea
                id="edit_seo_description"
                value={seoFormData.seo_description}
                onChange={(e) => setSeoFormData(prev => ({
                  ...prev,
                  seo_description: e.target.value
                }))}
                placeholder="Описание для поисковых систем"
                maxLength={500}
                rows={3}
              />
              <p className="text-sm text-muted-foreground">
                {seoFormData.seo_description.length}/500 символов
              </p>
            </div>

            {/* SEO Image */}
            <div className="space-y-2">
              <Label>SEO Изображение</Label>
              
              {currentImageUrl && (
                <div className="relative inline-block">
                  <img 
                    src={currentImageUrl} 
                    alt="SEO изображение" 
                    className="w-48 h-32 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                    onClick={removeImage}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
              
              <div className="flex items-center gap-4">
                <Input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.svg"
                  onChange={handleImageChange}
                  className="hidden"
                  id="edit_seo_image"
                />
                <Label 
                  htmlFor="edit_seo_image"
                  className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  <Upload className="w-4 h-4" />
                  Выбрать изображение
                </Label>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Максимальный размер: 2 МБ. Форматы: JPG, PNG, WEBP
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setEditDialogOpen(false)}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={loading} className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                {loading ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}