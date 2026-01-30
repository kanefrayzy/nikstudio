"use client"

import { useState, FormEvent, useEffect } from "react"

// Принудительно делаем страницу динамической для продакшн сборки
export const dynamic = 'force-dynamic'
import { columns, BlogPost } from "./columns"
import { Button } from "@/components/ui/button"
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
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
// import SEOEditor, { SEOData } from "@/components/SEOEditor"
import { SEOData } from "@/components/SEOEditor"
import { SEOSettings } from "@/lib/seo-metadata"
import apiClient from "@/lib/api"

// Интерфейс для ответа API
interface ApiResponse {
  status: string;
  data: BlogPost[];
}

// Интерфейс для ответа создания поста
interface CreatePostResponse {
  status: string;
  message?: string;
  data?: BlogPost;
  errors?: Record<string, string[]>;
}

// API URL
// const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/api`;

// Функция для формирования корректного URL изображения
function getImageUrl(imagePath: string | null): string {
  console.log('getImageUrl input:', imagePath);
  
  if (!imagePath) return '';
  
  // Проверяем, начинается ли путь с http/https (абсолютный URL)
  if (imagePath.startsWith('http')) {
    console.log('getImageUrl output (http):', imagePath);
    return imagePath;
  }
  
  // Для изображений из public/images (статические изображения Next.js)
  if (imagePath.startsWith('/images/')) {
    console.log('getImageUrl output (images):', imagePath);
    return imagePath;
  }
  
  // Определяем окружение
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  
  // Для всех storage файлов всегда используем полный URL
  // Это нужно для корректной работы Next.js Image Optimization
  let result: string;
  
  if (imagePath.startsWith('/storage/')) {
    // Путь уже начинается с /storage/
    result = `${apiUrl}${imagePath}`;
  } else {
    // Относительный путь
    result = `${apiUrl}/storage/blog/${imagePath}`;
  }
  
  console.log('getImageUrl output (full URL):', result);
  return result;
}

// Функция для загрузки постов с API
async function getData(): Promise<BlogPost[]> {
  try {
    const response = await apiClient.get<ApiResponse>('/api/blog-posts');
    
    // apiClient возвращает axios response, данные в response.data
    const apiResponse = response.data;
    const posts: BlogPost[] = apiResponse.data || [];
    
    // Обрабатываем URL изображений перед отображением
    const postsWithCorrectImageUrls = posts.map(post => ({
      ...post,
      image: getImageUrl(post.image),
      // Убедимся, что status существует, если нет - устанавливаем по умолчанию
      status: post.status !== undefined ? post.status : true,
      // Убедимся, что sort_order существует, если нет - устанавливаем по умолчанию
      sort_order: post.sort_order !== undefined ? post.sort_order : 0
    }));
    
    return postsWithCorrectImageUrls;
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return [];
  }
}

async function getGlobalSEOSettings(): Promise<SEOSettings | null> {
  try {
    const response = await apiClient.get<{ success: boolean; data: SEOSettings }>('/api/seo/settings');
    return response.data?.data || null;
  } catch (error) {
    console.error('Error fetching SEO settings:', error);
    return null;
  }
}

export default function AdminBlogPageWrapper() {
  const [open, setOpen] = useState(false)
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [apiStatus, setApiStatus] = useState<string | null>(null)
  
  // Состояния для полей формы
  const [title, setTitle] = useState("")
  const [position, setPosition] = useState("")
  const [description, setDescription] = useState("")
  const [sortOrder, setSortOrder] = useState("0")
  const [image, setImage] = useState<File | null>(null)
  
  // SEO states
  const [seoData, setSeoData] = useState<SEOData>({})
  const [_globalSettings, _setGlobalSettings] = useState<SEOSettings | null>(null)

  // Загрузка данных и проверка API
  useEffect(() => {
    getData().then(setPosts)
    getGlobalSEOSettings().then(_setGlobalSettings)
    
    // Проверка API соединения
    checkApiConnection()
  }, [])
  
  // Функция для проверки соединения с API
  const checkApiConnection = async () => {
    try {
      setApiStatus('Проверка соединения...');
      await apiClient.get('/api/blog-posts');
      setApiStatus('API доступен и возвращает корректный JSON');
    } catch (error) {
      setApiStatus(`Ошибка соединения: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
      console.error('Ошибка соединения с API:', error);
    }
  };

  // Функция для сброса формы
  const resetForm = () => {
    setTitle("")
    setPosition("")
    setDescription("")
    setSortOrder("0")
    setImage(null)
    setSeoData({}) // Reset SEO data
  }

  // SEO image upload handler
  const _handleSEOImageUpload = async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await apiClient.post<{ success: boolean; data?: { url: string }; message?: string }>('/api/seo/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const result = response.data;

      if (result.success && result.data?.url) {
        return result.data.url;
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (error) {
      console.error('SEO image upload error:', error);
      throw error;
    }
  };

  // Handle SEO data save
  const _handleSEOSave = (newSeoData: SEOData) => {
    setSeoData(newSeoData);
    toast("SEO данные обновлены");
  };

  // Обработчик отправки формы
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      // Проверка обязательных полей
      if (!title || !position || !description) {
        throw new Error("Пожалуйста, заполните все обязательные поля");
      }
      
      // Создаем объект FormData для отправки файлов
      const formData = new FormData()
      formData.append("title", title)
      formData.append("position", position)
      formData.append("description", description)
      formData.append("sort_order", sortOrder)
      
      // Добавляем файл изображения, если он выбран
      if (image) {
        formData.append("image", image)
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

      // Выводим отладочную информацию
      console.log("Отправка данных:", {
        title,
        position,
        description,
        sortOrder,
        imageFileName: image?.name || "нет"
      });
      
      const response = await apiClient.post<CreatePostResponse>('/api/blog-posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const result = response.data;
      
      console.log("Результат запроса:", result);
      
      if (result && result.status === "success") {
        // Обновляем список постов
        const updatedPosts = await getData();
        setPosts(updatedPosts);
        
        // Закрываем диалоговое окно и сбрасываем форму
        setOpen(false);
        resetForm();
        
        // Показываем уведомление об успехе
        toast("Статья успешно создана");
      } else {
        // Показываем ошибку
        toast(`Ошибка: ${result?.message || "Не удалось создать статью - неизвестная ошибка"}`);
        console.error(result?.errors || "Нет дополнительной информации об ошибке");
      }
    } catch (error) {
      console.error("Ошибка при отправке данных:", error);
      toast(`Произошла ошибка при отправке данных: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    } finally {
      setIsLoading(false);
    }
  }

  // Обработчик изменения файла изображения
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0])
    }
  }

  return (
    <div className="w-full">
      <div className="p-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Управление блогом</h1>
          <div className="flex items-center gap-2">
            <p className="mt-2 text-gray-500">Здесь вы можете создавать, редактировать и удалять статьи блога</p>
            <button 
              onClick={checkApiConnection} 
              className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded"
            >
              Проверить API
            </button>
          </div>
          {apiStatus && (
            <p className={`mt-1 text-sm ${apiStatus.includes('Ошибка') ? 'text-red-500' : 'text-green-500'}`}>
              {apiStatus}
            </p>
          )}
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setOpen(true)} className="hover:cursor-pointer" variant="outline">
              <PlusCircle className="mr-2 h-4 w-4" />
              Создать статью
            </Button>           
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Создать статью</DialogTitle>
              <DialogDescription>
                Заполните поля ниже для публикации новой статьи
              </DialogDescription>
            </DialogHeader>
            <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
              <div>
                <Label htmlFor="title">Заголовок</Label>
                <Input 
                  id="title" 
                  name="title" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-2" 
                  required
                />
              </div>
              <div>
                <Label htmlFor="position">Должность</Label>
                <Input 
                  id="position" 
                  name="position" 
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="mt-2" 
                  required
                />
              </div>
              <div>
                <Label htmlFor="sort_order">Порядковый номер</Label>
                <Input 
                  id="sort_order" 
                  name="sort_order" 
                  type="number"
                  min="0"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="mt-2" 
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">Меньшие числа отображаются первыми</p>
              </div>
              <div>
                <Label htmlFor="description">Описание</Label>
                <Textarea 
                  id="description" 
                  name="description" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-2" 
                  required
                />
              </div>
              <div>
                <Label htmlFor="image">Изображение</Label>
                <Input 
                  id="image" 
                  type="file" 
                  name="image" 
                  onChange={handleImageChange}
                  className="mt-2" 
                />
              </div>
             
              <Button 
                type="submit" 
                disabled={isLoading}
                className="hover:cursor-pointer mt-2"
              >
                {isLoading ? "Создание..." : "Создать статью"}
              </Button>
              {apiStatus?.includes('Ошибка') && (
                <p className="text-xs text-red-500 mt-2">
                  Предупреждение: API может быть недоступен. Проверьте, запущен ли сервер Laravel на порту 8000.
                </p>
              )}
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="w-full px-6 pb-6">
        {posts.length > 0 ? (
          <DataTable columns={columns} data={posts} />
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center border rounded-md bg-gray-50">
            <h3 className="text-lg font-medium">Нет статей</h3>
            <p className="mb-4 text-sm text-gray-500">Создайте новую статью, чтобы она появилась здесь.</p>
            <Button onClick={() => setOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Создать статью
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
