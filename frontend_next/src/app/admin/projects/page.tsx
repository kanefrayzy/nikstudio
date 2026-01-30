"use client"

import { useState, FormEvent, useEffect } from "react"

// Принудительно делаем страницу динамической для продакшн сборки
export const dynamic = 'force-dynamic'
import { columns as getColumns } from "./columns"
import { Button } from "@/components/ui/button"
import { useProjects, type Project } from "@/hooks/useProjects"
import { useCategories } from "@/hooks/useCategories"
import { useSEOSettings } from "@/hooks/useSEOSettings"
import { DataTable } from "./data-table"
import { PlusCircle } from "lucide-react"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
// import SEOEditor, { SEOData } from "@/components/SEOEditor"
import { SEOData } from "@/components/SEOEditor"
import apiClient from "@/lib/api"

interface CreateProjectResponse {
  success: boolean;
  message?: string;
  data?: Project;
  errors?: Record<string, string[]>;
}

export default function AdminProjectsPageWrapper() {
  // Используем SWR hooks для кэширования данных
  const { projects, mutate: mutateProjects } = useProjects();
  const { categories } = useCategories();
  const { settings: _globalSettings } = useSEOSettings();
  
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<string | null>(null);

  const [mainTitle, setMainTitle] = useState("");
  const [projectsPageTitle, setProjectsPageTitle] = useState("");
  const [year, setYear] = useState("");
  // Изменено: теперь массив для множественного выбора категорий
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [projectsPageImage, setProjectsPageImage] = useState<File | null>(null);
  const [logo, setLogo] = useState<File | null>(null);

  // SEO states
  const [seoData, setSeoData] = useState<SEOData>({});

  useEffect(() => {
    checkApiConnection();
  }, []);

  const checkApiConnection = async () => {
    try {
      setApiStatus('Проверка соединения...');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/api/projects`, { method: 'GET', headers: { 'Accept': 'application/json' } });
      if (res.ok) {
        try {
          await res.json();
          setApiStatus('API доступен и возвращает корректный JSON');
        } catch {
          setApiStatus('API доступен, но возвращает невалидный JSON');
        }
      } else {
        setApiStatus(`Ошибка API: ${res.status} - ${res.statusText}`);
      }
    } catch (error) {
      setApiStatus(`Ошибка соединения: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  };

  const resetForm = () => {
    setMainTitle("");
    setProjectsPageTitle("");
    setYear("");
    setCategoryIds([]); // Очистка массива категорий
    setMainImage(null);
    setProjectsPageImage(null);
    setLogo(null);
    setSeoData({}); // Reset SEO data

    const fileInputs = document.querySelectorAll('input[type="file"]') as NodeListOf<HTMLInputElement>;
    fileInputs.forEach(input => {
      input.value = '';
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!mainTitle.trim()) {
        throw new Error("Основной заголовок обязателен");
      }
      if (!year.trim()) {
        throw new Error("Год обязателен");
      }
      if (categoryIds.length === 0) {
        throw new Error("Выберите хотя бы одну категорию");
      }
      // Добавлена проверка обязательных изображений
      if (!mainImage) {
        throw new Error("Основное изображение обязательно");
      }
      if (!projectsPageImage) {
        throw new Error("Изображение на странице проектов обязательно");
      }

      const yearNum = parseInt(year);
      if (isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) {
        throw new Error("Пожалуйста, введите корректный год");
      }

      const formData = new FormData();
      formData.append("main_title", mainTitle.trim());
      formData.append("projects_page_title", projectsPageTitle.trim());
      formData.append("year", yearNum.toString());
      // Добавляем все выбранные категории как массив
      categoryIds.forEach(id => formData.append("category_ids[]", id));

      // Обязательные изображения
      formData.append("main_image", mainImage);
      formData.append("projects_page_image", projectsPageImage);

      // Логотип остается необязательным
      if (logo && logo.size > 0) {
        formData.append("logo", logo);
      }

      // Add SEO data
      if (seoData.seo_title) {
        formData.append("seo_title", seoData.seo_title);
      }
      if (seoData.seo_description) {
        formData.append("seo_description", seoData.seo_description);
      }
      if (seoData.seo_image) {
        formData.append("seo_image", seoData.seo_image);
      }

      const response = await apiClient.post<CreateProjectResponse>('/api/projects', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json' 
        },
      });

      const result = response.data;
      if (result && result.success === true) {
        // Обновляем кэш SWR вместо ручной загрузки
        await mutateProjects();
        setOpen(false);
        resetForm();
        toast("Проект успешно создан");
        // Автоматическое закрытие уведомления через 3 секунды
        setTimeout(() => {
          // Уведомление автоматически закроется
        }, 3000);
      } else {
        toast(`Ошибка: ${result?.message || "Не удалось создать проект - неизвестная ошибка"}`);
      }
    } catch (error: any) {
      // Обработка ошибок с сервера
      if (error.response?.status === 413) {
        toast("Размер файла превышает допустимый лимит (2 МБ для изображений)");
      } else if (error.response?.status === 422 && error.response?.data?.errors) {
        const validationErrors = Object.entries(error.response.data.errors)
          .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
          .join('; ');
        toast(`Ошибки валидации: ${validationErrors}`);
      } else {
        const errorMessage = error.response?.data?.message || error.message || 'Неизвестная ошибка';
        toast(`Произошла ошибка при отправке данных: ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Обработчик изменения выбора категорий
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
    setCategoryIds(selectedOptions);
  };

  const validateFileSize = (file: File): boolean => {
    const maxSize = 2 * 1024 * 1024; // 2MB для изображений
    return file.size <= maxSize;
  };

  // ИСПРАВЛЕНИЕ: Улучшенная функция обработки файлов
  const handleFileChange = (setter: React.Dispatch<React.SetStateAction<File | null>>, isLogo: boolean = false) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.size > 0) {
      // Проверяем размер файла
      if (!validateFileSize(file)) {
        toast("Размер файла не должен превышать 2 МБ");
        e.target.value = ''; // Очищаем input
        setter(null);
        return;
      }

      // Проверяем тип файла - для логотипа разрешаем SVG
      const allowedTypes = isLogo
        ? ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml']
        : ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

      if (!allowedTypes.includes(file.type)) {
        const formats = isLogo ? "JPG, PNG, WEBP, SVG" : "JPG, PNG, WEBP";
        toast(`Разрешены только файлы форматов: ${formats}`);
        e.target.value = ''; // Очищаем input
        setter(null);
        return;
      }

      setter(file);
      console.log(`File selected: ${file.name}, size: ${file.size} bytes`);
    } else {
      setter(null);
      console.log('No file selected or file is empty');
    }
  };

  // SEO image upload handler
  const _handleSEOImageUpload = async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await apiClient.post<{
        success: boolean;
        data?: { url: string };
        message?: string;
      }>('/seo/upload-image', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json' 
        },
      });

      const result = response.data;
      if (result.success && result.data?.url) {
        return result.data.url;
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (error: any) {
      console.error('SEO image upload error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Upload failed';
      throw new Error(errorMessage);
    }
  };

  // Handle SEO data save
  const _handleSEOSave = (newSeoData: SEOData) => {
    setSeoData(newSeoData);
    toast("SEO данные обновлены");
  };

  return (
    <div className="w-full">
      <div className="p-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Управление проектами</h1>
          <div className="flex items-center gap-2">
            <p className="mt-2 text-gray-500">Здесь вы можете создавать, редактировать и удалять проекты</p>
            <button onClick={checkApiConnection} className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded">Проверить API</button>
          </div>
          {apiStatus && (
            <p className={`mt-1 text-sm ${apiStatus.includes('Ошибка') ? 'text-red-500' : 'text-green-500'}`}>{apiStatus}</p>
          )}
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setOpen(true)} className="hover:cursor-pointer" variant="outline">
              <PlusCircle className="mr-2 h-4 w-4" />
              Создать проект
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Создать проект</DialogTitle>
              <DialogDescription>Заполните поля ниже для создания нового проекта</DialogDescription>
            </DialogHeader>
            <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
              <div>
                <Label htmlFor="main_title">Основной заголовок</Label>
                <Input id="main_title" name="main_title" value={mainTitle} onChange={(e) => setMainTitle(e.target.value)} className="mt-2" required />
              </div>
              <div>
                <Label htmlFor="projects_page_title">Заголовок на странице проектов</Label>
                <Input id="projects_page_title" name="projects_page_title" value={projectsPageTitle} onChange={(e) => setProjectsPageTitle(e.target.value)} className="mt-2" />
              </div>
              <div>
                <Label htmlFor="year">Год</Label>
                <Input id="year" name="year" type="number" value={year} onChange={(e) => setYear(e.target.value)} className="mt-2" required />
              </div>
              <div>
                <Label htmlFor="category_ids">Категории</Label>
                <select
                  id="category_ids"
                  name="category_ids"
                  multiple
                  value={categoryIds}
                  onChange={handleCategoryChange}
                  className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {categories.map(category => (
                    <option key={category.id} value={category.id.toString()}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="main_image">Основное изображение *</Label>
                <Input
                  id="main_image"
                  type="file"
                  name="main_image"
                  accept=".jpg,.jpeg,.png,.webp,.svg"
                  onChange={handleFileChange(setMainImage, false)}
                  className="mt-2"
                  required
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Максимальный размер: 2 МБ. Форматы: JPG, PNG, WEBP, SVG
                </p>
                {mainImage && (
                  <p className="text-xs text-green-600 mt-1">Выбран файл: {mainImage.name}</p>
                )}
              </div>
              <div>
                <Label htmlFor="projects_page_image">Изображение на странице проектов *</Label>
                <Input
                  id="projects_page_image"
                  type="file"
                  name="projects_page_image"
                  accept=".jpg,.jpeg,.png,.webp,.svg"
                  onChange={handleFileChange(setProjectsPageImage, false)}
                  className="mt-2"
                  required
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Максимальный размер: 2 МБ. Форматы: JPG, PNG, WEBP, SVG
                </p>
                {projectsPageImage && (
                  <p className="text-xs text-green-600 mt-1">Выбран файл: {projectsPageImage.name}</p>
                )}
              </div>
              <div>
                <Label htmlFor="logo">Логотип</Label>
                <Input
                  id="logo"
                  type="file"
                  name="logo"
                  accept=".jpg,.jpeg,.png,.webp,.svg"
                  onChange={handleFileChange(setLogo, true)}
                  className="mt-2"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Максимальный размер: 2 МБ. Форматы: JPG, PNG, WEBP, SVG
                </p>
                {logo && (
                  <p className="text-xs text-green-600 mt-1">Выбран файл: {logo.name}</p>
                )}
              </div>

              <Button type="submit" disabled={isLoading} className="hover:cursor-pointer mt-2">
                {isLoading ? "Создание..." : "Создать проект"}
              </Button>
              {apiStatus?.includes('Ошибка') && (
                <p className="text-xs text-red-500 mt-2">Предупреждение: API может быть недоступен. Проверьте, запущен ли сервер Laravel на порту 8000.</p>
              )}
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="w-full px-6 pb-6">
        {projects.length > 0 ? (
          <DataTable columns={getColumns()} data={projects as any} />
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center border rounded-md bg-gray-50">
            <h3 className="text-lg font-medium">Нет проектов</h3>
            <p className="mb-4 text-sm text-gray-500">Создайте новый проект, чтобы он появился здесь.</p>
            <Button onClick={() => setOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Создать проект
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}