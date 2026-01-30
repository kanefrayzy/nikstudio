"use client"

import { ColumnDef } from "@tanstack/react-table"
import Image from "next/image"
import { SquarePen, Trash2 } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
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
} from "@/components/ui/alert-dialog"
// import SEOEditor, { SEOData } from "@/components/SEOEditor"
import { SEOData } from "@/components/SEOEditor"
import { SEOSettings } from "@/lib/seo-metadata"
import apiClient from "@/lib/api"

// const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/api`;

export type BlogPost = {
  id: number
  title: string
  description: string
  image: string
  position: string
  sort_order: number
  created_at: string
  updated_at: string
  slug: string
  status: boolean | number | string // Добавляем поле status
  seo_title?: string
  seo_description?: string
  seo_image?: string
}

interface UpdatePostResponse {
  status: string;
  message?: string;
  data?: BlogPost;
  errors?: Record<string, string[]>;
}

// Компонент для кликабельных элементов
const ClickableCell = ({ children, post }: { children: React.ReactNode; post: BlogPost }) => {
  const router = useRouter();
  
  const handleClick = () => {
    router.push(`/admin/blog/${post.slug}`);
  };

  return (
    <div 
      onClick={handleClick}
      className="cursor-pointer hover:bg-gray-50 transition-colors duration-300 p-1 rounded"
    >
      {children}
    </div>
  );
};

const UpdateBlogPostCell = ({ post }: { post: BlogPost }) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState(post.title);
  const [position, setPosition] = useState(post.position);
  const [description, setDescription] = useState(post.description);
  const [sortOrder, setSortOrder] = useState(post.sort_order.toString());
  const [image, setImage] = useState<File | null>(null);
  
  // SEO states
  const [seoData, setSeoData] = useState<SEOData>({
    seo_title: post.seo_title,
    seo_description: post.seo_description,
    seo_image: post.seo_image
  });
  const [_globalSettings, _setGlobalSettings] = useState<SEOSettings | null>(null);

  useEffect(() => {
    if (open) {
      fetchGlobalSEOSettings();
    }
  }, [open]);

  const fetchGlobalSEOSettings = async () => {
    try {
      const response = await apiClient.get<{ success: boolean; data: any }>('/api/seo/settings');
      _setGlobalSettings(response.data?.data || null);
    } catch (error) {
      console.error('Error fetching SEO settings:', error);
    }
  };

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!title || !position || !description) {
        throw new Error("Пожалуйста, заполните все обязательные поля");
      }

      const formData = new FormData();
      formData.append("id", post.id.toString());
      formData.append("title", title);
      formData.append("position", position);
      formData.append("description", description);
      formData.append("sort_order", sortOrder);
      if (image) formData.append("image", image);

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

      const response = await apiClient.post<UpdatePostResponse>('/api/blog-posts/update', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const result = response.data;

      if (result?.status === "success") {
        setOpen(false);
        window.location.reload();        
        toast("Статья успешно обновлена");
      } else {
        toast(`Ошибка: ${result?.message || "Не удалось обновить статью"}`);
      }
    } catch (error) {
      console.error("Ошибка при отправке данных:", error);
      toast(`Произошла ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-center">
        <SquarePen className="h-4 w-4 cursor-pointer hover:text-[#DE063A] transition-colors duration-300" onClick={() => setOpen(true)} />
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Редактировать статью</DialogTitle>
            <DialogDescription>Измените поля для обновления статьи</DialogDescription>
          </DialogHeader>
          <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="title">Заголовок</Label>
              <Input id="title" name="title" className="mt-2" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="position">Должность</Label>
              <Input id="position" name="position" className="mt-2" value={position} onChange={(e) => setPosition(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="sort_order">Порядковый номер</Label>
              <Input 
                id="sort_order" 
                name="sort_order" 
                type="number" 
                min="0" 
                className="mt-2" 
                value={sortOrder} 
                onChange={(e) => setSortOrder(e.target.value)} 
                placeholder="0"
              />
              <p className="text-xs text-gray-500 mt-1">Меньшие числа отображаются первыми</p>
            </div>
            <div>
              <Label htmlFor="description">Описание</Label>
              <Textarea id="description" name="description" className="mt-2" value={description} onChange={(e) => setDescription(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="image">Изображение</Label>
              {post.image && (
                <div className="mb-2">
                  <p className="text-xs text-gray-500">Текущее изображение:</p>
                  <div className="relative h-20 w-20 overflow-hidden rounded mt-2">
                    <Image src={post.image} alt="Blog thumbnail" fill className="object-cover" />
                  </div>
                </div>
              )}
              <Input id="image" type="file" name="image" onChange={handleImageChange} />
              <p className="text-xs text-gray-500 mt-1">Оставьте пустым, чтобы сохранить текущее изображение</p>
            </div>
          
            <Button type="submit" disabled={isLoading} className="mt-2 cursor-pointer">
              {isLoading ? "Обновление..." : "Обновить статью"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

const DeleteBlogPostCell = ({ post }: { post: BlogPost }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await apiClient.delete<{ status: string; message?: string }>(`/api/blog-posts/${post.id}`);
      const result = response.data;

      if (result?.status === "success") {
        window.location.reload();
        toast("Статья успешно удалена");
      } else {
        toast(`Ошибка: ${result?.message || "Не удалось удалить статью"}`);
      }
    } catch (error) {
      console.error("Ошибка при удалении поста:", error);
      toast(`Произошла ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-center justify-center">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Trash2 
            className={`h-4 w-4 cursor-pointer ${isDeleting ? 'opacity-50' : ''} hover:text-[#DE063A] transition-colors duration-300`} 
          />
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить статью?</AlertDialogTitle>
            <AlertDialogDescription>
              Удалить статью `{post.title}`? Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="cursor-pointer">
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground text-white hover:bg-destructive/90 cursor-pointer transition-colors duration-300"
            >
              {isDeleting ? "Удаление..." : "Удалить"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const SortOrderCell = ({ post }: { post: BlogPost }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [sortOrder, setSortOrder] = useState(post.sort_order.toString());
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSave = async () => {
    if (sortOrder === post.sort_order.toString()) {
      setIsEditing(false);
      return;
    }

    setIsUpdating(true);
    
    try {
      const response = await apiClient.patch<{ status: string; message?: string }>(`/api/blog-posts/${post.id}/sort-order`, {
        sort_order: parseInt(sortOrder)
      });

      const result = response.data;

      if (result?.status === "success") {
        setIsEditing(false);
        window.location.reload();
        toast("Порядок поста обновлен");
      } else {
        toast(`Ошибка: ${result?.message || "Не удалось обновить порядок"}`);
      }
    } catch (error) {
      console.error("Ошибка при обновлении порядка:", error);
      toast(`Произошла ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
      setSortOrder(post.sort_order.toString()); // Возвращаем исходное значение
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setSortOrder(post.sort_order.toString());
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          type="number"
          min="0"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-16 h-8 text-sm"
          disabled={isUpdating}
          autoFocus
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSave}
          disabled={isUpdating}
          className="h-6 w-6 p-0"
        >
          ✓
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCancel}
          disabled={isUpdating}
          className="h-6 w-6 p-0"
        >
          ✕
        </Button>
      </div>
    );
  }

  return (
    <div 
      className="font-medium hover:text-[#DE063A] transition-colors duration-300 cursor-pointer px-2 py-1 rounded hover:bg-gray-100"
      onClick={() => setIsEditing(true)}
      title="Нажмите для редактирования"
    >
      {post.sort_order}
    </div>
  );
};

const StatusSwitchCell = ({ post }: { post: BlogPost }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(() => {
    // Преобразуем различные форматы статуса в boolean
    return post.status === true || post.status === 1 || post.status === "1" || post.status === "active";
  });

  const handleStatusChange = async (checked: boolean) => {
    setIsUpdating(true);
    
    try {
      const response = await apiClient.patch<{ status: string; message?: string }>(`/api/blog-posts/${post.id}/status`, {
        status: checked
      });

      const result = response.data;

      if (result?.status === "success") {
        setCurrentStatus(checked);
        toast(checked ? "Статья активирована" : "Статья деактивирована");
      } else {
        toast(`Ошибка: ${result?.message || "Не удалось изменить статус"}`);
      }
    } catch (error) {
      console.error("Ошибка при изменении статуса:", error);
      toast(`Произошла ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Switch 
      className={`hover:cursor-pointer ${isUpdating ? 'opacity-50' : ''}`}
      checked={currentStatus}
      onCheckedChange={handleStatusChange}
      disabled={isUpdating}
    />
  );
};

export const columns: ColumnDef<BlogPost>[] = [
  {
    accessorKey: "id",
    header: "ID",
    meta: { className: "w-[3%]" },
    cell: ({ row }) => (
      <ClickableCell post={row.original}>
        <div className="font-medium hover:text-[#DE063A] transition-colors duration-300">
          {row.getValue("id")}
        </div>
      </ClickableCell>
    ),
  },
  {
    accessorKey: "sort_order",
    header: "Порядок",
    meta: { className: "w-[5%]" },
    cell: ({ row }) => <SortOrderCell post={row.original} />,
  },
  {
    accessorKey: "image",
    header: "Изображение",
    meta: { className: "w-[7%]" },
    cell: ({ row }) => {
      const imageUrl = row.getValue("image") as string;
      return (
        <ClickableCell post={row.original}>
          {imageUrl ? (
            <div className="relative h-10 w-10 overflow-hidden rounded">
              <Image src={imageUrl} alt="Blog thumbnail" fill className="object-cover" />
            </div>
          ) : (
            <span className="text-gray-400">Нет изображения</span>
          )}
        </ClickableCell>
      );
    },
  },
  {
    accessorKey: "position",
    header: "Должность",
    meta: { className: "w-[10%]" },
    cell: ({ row }) => (
      <ClickableCell post={row.original}>
        <div className="hover:text-[#DE063A] transition-colors duration-300">
          {row.getValue("position")}
        </div>
      </ClickableCell>
    ),
  },
  {
    accessorKey: "title",
    header: "Заголовок",
    meta: { className: "w-[18%]" },
    cell: ({ row }) => (
      <ClickableCell post={row.original}>
        <div className="font-medium hover:text-[#DE063A] transition-colors duration-300">
          {row.getValue("title")}
        </div>
      </ClickableCell>
    ),
  },
  {
    accessorKey: "description",
    header: "Описание",
    meta: { className: "w-[19%]" },
    cell: ({ row }) => {
      const description = row.getValue("description") as string;
      return (
        <ClickableCell post={row.original}>
          <div className="max-w-xs truncate hover:text-[#DE063A] transition-colors duration-300" title={description}>
            {description}
          </div>
        </ClickableCell>
      );
    },
  },
  {
    accessorKey: "slug",
    header: "Slug",
    meta: { className: "w-[14%]" },
    cell: ({ row }) => (
      <ClickableCell post={row.original}>
        <div className="hover:text-[#DE063A] transition-colors duration-300">
          {row.getValue("slug")}
        </div>
      </ClickableCell>
    ),
  },
  {
    accessorKey: "status",
    header: "Статус",
    meta: { className: "w-[4%]" },
    cell: ({ row }) => <StatusSwitchCell post={row.original} />,
  },
  {
    accessorKey: "update",
    header: "",
    meta: { className: "w-[3%]" },
    cell: ({ row }) => <UpdateBlogPostCell post={row.original} />,
  },
  {
    accessorKey: "delete",
    header: "",
    meta: { className: "w-[3%]" },
    cell: ({ row }) => <DeleteBlogPostCell post={row.original} />,
  },
];