import { ColumnDef } from "@tanstack/react-table";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2, SquarePen } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
// import SEOEditor, { SEOData } from "@/components/SEOEditor"
import { SEOData } from "@/components/SEOEditor";
import { SEOSettings } from "@/lib/seo-metadata";
import apiClient from "@/lib/api";

const ClickableCell = ({ children, slug }: { children: React.ReactNode; slug: string }) => {
  const router = useRouter();
  
  const handleClick = () => {
    router.push(`/admin/projects/${slug}`);
  };
  
  return (
    <div 
      onClick={handleClick}
      className="cursor-pointer hover:text-[#DE063A] transition-colors duration-300"
    >
      {children}
    </div>
  );
};

export interface ProjectCategory {
  id: number;
  name: string;
  slug: string;
  sort_order: number;
}

export interface Project {
  id: number;
  main_title: string;
  projects_page_title?: string;
  year: number;
  categories: ProjectCategory[]; // заменено на массив категорий
  main_image?: string | null;
  projects_page_image?: string | null;
  logo?: string | null;
  slug: string;
  seo_title?: string;
  seo_description?: string;
  seo_image?: string;
}

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/api`;

const UpdateProjectCell = ({ project }: { project: Project }) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<ProjectCategory[]>([]);

  // Состояния для всех полей проекта
  const [mainTitle, setMainTitle] = useState(project.main_title);
  const [projectsPageTitle, setProjectsPageTitle] = useState(project.projects_page_title || "");
  const [year, setYear] = useState(project.year.toString());
  // Массив выбранных ID категорий в строковом формате
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    project.categories ? project.categories.map(cat => cat.id.toString()) : []
  );
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [projectsPageImage, setProjectsPageImage] = useState<File | null>(null);
  const [logo, setLogo] = useState<File | null>(null);
  
  // SEO states
  const [seoData, setSeoData] = useState<SEOData>({
    seo_title: project.seo_title,
    seo_description: project.seo_description,
    seo_image: project.seo_image
  });
  const [_globalSettings, _setGlobalSettings] = useState<SEOSettings | null>(null);

  useEffect(() => {
    if (open) {
      fetchCategories();
      fetchGlobalSEOSettings();
    }
  }, [open]);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/project-categories`, {
        cache: 'no-store',
        headers: { 'Accept': 'application/json' },
      });
      if (!res.ok) throw new Error(`Failed to fetch categories: ${res.status}`);
      const data = await res.json();
      setCategories(data.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast(`Ошибка загрузки категорий: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  };

  const fetchGlobalSEOSettings = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/seo/settings`, { 
        cache: 'no-cache', // Используем no-cache вместо no-store для админки
        headers: { 'Accept': 'application/json' } 
      });
      if (!res.ok) return;
      const data = await res.json();
      _setGlobalSettings(data.data || null);
    } catch (error) {
      console.error('Error fetching SEO settings:', error);
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

  const validateFileSize = (file: File): boolean => {
    const maxSize = 2 * 1024 * 1024; // 2MB для изображений
    return file.size <= maxSize;
  };

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

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = e.target.options;
    const selected: string[] = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selected.push(options[i].value);
      }
    }
    setSelectedCategoryIds(selected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (!mainTitle.trim()) {
        throw new Error("Основной заголовок обязателен");
      }
      if (!year.trim()) {
        throw new Error("Год обязателен");
      }
      if (selectedCategoryIds.length === 0) {
        throw new Error("Категории обязательны");
      }

      const yearNum = parseInt(year);
      if (isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) {
        throw new Error("Пожалуйста, введите корректный год");
      }

      const formData = new FormData();
      formData.append("main_title", mainTitle.trim());
      formData.append("projects_page_title", projectsPageTitle.trim());
      formData.append("year", yearNum.toString());
      // Отправляем массив ID категорий как отдельные поля с ключом category_ids[]
      selectedCategoryIds.forEach(id => {
        formData.append("category_ids[]", id);
      });
      formData.append("_method", "PUT");

      if (mainImage && mainImage.size > 0) formData.append("main_image", mainImage);
      if (projectsPageImage && projectsPageImage.size > 0) formData.append("projects_page_image", projectsPageImage);
      if (logo && logo.size > 0) formData.append("logo", logo);

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

      await apiClient.post(`/api/projects/${project.id}`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json' 
        },
      });

      toast("Проект успешно обновлен");
      setOpen(false);
      // Автоматическое закрытие уведомления через 3 секунды
      setTimeout(() => {
        window.location.reload();
      }, 3000);
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
        toast(`Ошибка: ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <SquarePen className="h-4 w-4 cursor-pointer hover:text-[#DE063A]" onClick={() => setOpen(true)} />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Редактировать проект</DialogTitle>
            <DialogDescription>Измените поля для обновления проекта</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <Label htmlFor="main_title">Основной заголовок</Label>
              <Input
                id="main_title"
                value={mainTitle}
                onChange={(e) => setMainTitle(e.target.value)}
                required
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="projects_page_title">Заголовок на странице проектов</Label>
              <Input
                id="projects_page_title"
                value={projectsPageTitle}
                onChange={(e) => setProjectsPageTitle(e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="year">Год</Label>
              <Input
                id="year"
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                required
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="category_ids">Категории</Label>
              <select
                id="category_ids"
                multiple
                value={selectedCategoryIds}
                onChange={handleCategoryChange}
                className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id.toString()}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="main_image">Основное изображение</Label>
              <Input
                id="main_image"
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.svg"
                onChange={handleFileChange(setMainImage, false)}
                className="mt-2"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Максимальный размер: 2 МБ. Форматы: JPG, PNG, WEBP, SVG
              </p>
              {mainImage && (
                <p className="text-xs text-green-600 mt-1">Выбран файл: {mainImage.name}</p>
              )}
              {project.main_image && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500">Текущее изображение:</p>
                  <Image 
                    src={project.main_image} 
                    alt="Main" 
                    width={48} 
                    height={48} 
                    className="object-cover rounded mt-1" 
                  />
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="projects_page_image">Изображение на странице проектов</Label>
              <Input
                id="projects_page_image"
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.svg"
                onChange={handleFileChange(setProjectsPageImage, false)}
                className="mt-2"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Максимальный размер: 2 МБ. Форматы: JPG, PNG, WEBP, SVG
              </p>
              {projectsPageImage && (
                <p className="text-xs text-green-600 mt-1">Выбран файл: {projectsPageImage.name}</p>
              )}
              {project.projects_page_image && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500">Текущее изображение:</p>
                  <Image 
                    src={project.projects_page_image} 
                    alt="Page" 
                    width={48} 
                    height={48} 
                    className="object-cover rounded mt-1" 
                  />
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="logo">Логотип</Label>
              <Input
                id="logo"
                type="file"
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
              {project.logo && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500">Текущий логотип:</p>
                  <Image 
                    src={project.logo} 
                    alt="Logo" 
                    width={48} 
                    height={48} 
                    className="rounded bg-[#0E1011] mt-1" 
                  />
                </div>
              )}
            </div>           
           
            
            <Button type="submit" disabled={isLoading} className="hover:cursor-pointer">
              {isLoading ? "Обновление..." : "Обновить проект"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

const DeleteProjectCell = ({ project }: { project: Project }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await apiClient.delete(`/api/projects/${project.id}`);
      toast("Проект успешно удален");
      window.location.reload();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Неизвестная ошибка';
      toast(`Ошибка: ${errorMessage}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Trash2
          className={`h-4 w-4 cursor-pointer hover:text-[#DE063A] ${isDeleting ? 'opacity-50' : ''}`}
        />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Удалить проект?</AlertDialogTitle>
          <AlertDialogDescription>
            Удалить проект &quot;{project.main_title}&quot;? Это действие нельзя отменить.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting} className="cursor-pointer">
            Отмена
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer text-white"
          >
            {isDeleting ? "Удаление..." : "Удалить"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export const columns = (): ColumnDef<Project>[] => [
  {
    accessorKey: "id",
    header: "ID",
    meta: { className: "w-[3%]" },
    cell: ({ row }) => (
      <ClickableCell slug={row.original.slug}>
        {row.getValue("id")}
      </ClickableCell>
    ),
  },
  {
    accessorKey: "main_title",
    header: "Заголовок на главной странице",
    meta: { className: "w-[15%]" },
    cell: ({ row }) => (
      <ClickableCell slug={row.original.slug}>
        {row.getValue("main_title")}
      </ClickableCell>
    ),
  },
  {
    accessorKey: "projects_page_title",
    header: 'Заголовок на странице "Проекты"',
    meta: { className: "w-[16%]" },
    cell: ({ row }) => (
      <ClickableCell slug={row.original.slug}>
        {row.getValue("projects_page_title")}
      </ClickableCell>
    ),
  },
  {
    accessorKey: "year",
    header: "Год",
    meta: { className: "w-[4%]" },
    cell: ({ row }) => (
      <ClickableCell slug={row.original.slug}>
        {row.getValue("year")}
      </ClickableCell>
    ),
  },
  {
    header: "Категории",
    meta: { className: "w-[10%]" },
    cell: ({ row }) => {
      const projectCategories = row.original.categories || [];
      return (
        <ClickableCell slug={row.original.slug}>
          {projectCategories.length > 0
            ? projectCategories.map(cat => cat.name).join(", ")
            : "Неизвестно"}
        </ClickableCell>
      );
    },
  },
  {
    accessorKey: "main_image",
    header: "Изображение на главной странице",
    meta: { className: "w-[16%]" },
    cell: ({ row }) => {
      const url = row.getValue("main_image") as string | null;
      return url ? (
        <ClickableCell slug={row.original.slug}>
          <Image 
            src={url} 
            alt="Main" 
            width={48} 
            height={48} 
            className="object-cover rounded" 
          />
        </ClickableCell>
      ) : null;
    },
  },
  {
    accessorKey: "projects_page_image",
    header: 'Изображение на странице "Проекты"',
    meta: { className: "w-[17%]" },
    cell: ({ row }) => {
      const url = row.getValue("projects_page_image") as string | null;
      return url ? (
        <ClickableCell slug={row.original.slug}>
          <Image 
            src={url} 
            alt="Page" 
            width={48} 
            height={48} 
            className="object-cover rounded" 
          />
        </ClickableCell>
      ) : null;
    },
  },
  {
    accessorKey: "logo",
    header: "Логотип",
    meta: { className: "w-[6%]" },
    cell: ({ row }) => {
      const url = row.getValue("logo") as string | null;
      return url ? (
        <ClickableCell slug={row.original.slug}>
          <Image 
            src={url} 
            alt="Logo" 
            width={48} 
            height={48} 
            className="rounded bg-[#0E1011]" 
          />
        </ClickableCell>
      ) : null;
    },
  },
  {
    accessorKey: "update",
    header: "",
    meta: { className: "w-[3%]" },
    cell: ({ row }) => <UpdateProjectCell project={row.original} />,
  },
  {
    accessorKey: "delete",
    header: "",
    meta: { className: "w-[3%]" },
    cell: ({ row }) => <DeleteProjectCell project={row.original} />,
  },
];