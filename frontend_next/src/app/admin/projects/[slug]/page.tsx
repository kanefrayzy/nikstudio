"use client"

import { useRouter } from 'next/navigation';

// Принудительно делаем страницу динамической для продакшн сборки
export const dynamic = 'force-dynamic'
import React, { useEffect, useState, use, useCallback } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, PlusCircle, PlayCircle, ImageIcon, AlertCircle, Trash2 } from "lucide-react"
import ProjectDetailsSection from '@/components/ProjectDetailsSection';
import EnhancedFileUpload from '@/components/ui/enhanced-file-upload';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save, X, SquarePen } from "lucide-react"
import {
  validateFileSize,
  getFileSizeLimit,
  formatFileSize,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES
} from "@/lib/utils"
import apiClient from "@/lib/api"

interface ProjectDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

interface HeroMediaFormData {
  id?: number;
  group_id: number;
  group_type: 'single' | 'double';
  file_type: 'image' | 'video';
  file_path: string;
  alt_text: string;
  poster_path?: string;
}

interface HeroMediaItem {
  type: 'image' | 'video';
  src: string;
  alt: string;
  poster?: string;
}

interface HeroGalleryGroup {
  id: number;
  type: 'single' | 'double';
  items: HeroMediaItem[];
}

interface ProjectBlockMediaItem {
  id: number;
  type: 'image' | 'video';
  src: string;
  alt: string;
  poster?: string;
  order: number;
  group_id: number;
  group_type: 'single' | 'double';
}

interface ProjectBlock {
  id: number;
  title: string;
  subtitle?: string;
  content: string;
  order: number;
  mediaItems: ProjectBlockMediaItem[];
}

interface ProjectDetail {
  id: number;
  project_id?: number;
  title: string;
  subtitle: string;
  client: string;
  year: number;
  heroMediaItems?: HeroGalleryGroup[];
  blocks?: ProjectBlock[];
}

interface EditFormData {
  title: string;
  subtitle: string;
  client: string;
  year: number;
}

interface BlockMediaFormData {
  id?: number;
  group_id: number;
  group_type: 'single' | 'double';
  file_type: 'image' | 'video';
  file_path: string;
  alt_text: string;
  poster_path?: string;
  order: number;
}

// This interface is used for block form data
interface _BlockFormData {
  id: number | null;
  title: string;
  subtitle: string;
  content: string;
  order: number;
  mediaItems: BlockMediaFormData[];
}

interface BlockTextFormData {
  title: string;
  subtitle: string;
  content: string;
  order: number;
}

interface MediaFormData {
  id?: number;
  group_id: number;
  group_type: 'single' | 'double';
  file_type: 'image' | 'video';
  file_path: string;
  alt_text: string;
  poster_path?: string;
  order: number;
}

const ProjectDetailPage: React.FC<ProjectDetailPageProps> = ({ params }) => {
  // Unwrap the params Promise
  const resolvedParams = use(params);

  const [projectDetail, setProjectDetail] = useState<ProjectDetail | null>(null)
  const [loading, setLoading] = useState(true)
  // These states are used for editing project details
  const [_editDialogOpen, _setEditDialogOpen] = useState(false)
  const [_editFormData, setEditFormData] = useState<EditFormData>({
    title: '',
    subtitle: '',
    client: '',
    year: new Date().getFullYear()
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const apiUrl = process.env.NEXT_PUBLIC_API_URL
  const router = useRouter();
  const [_createDialogOpen, _setCreateDialogOpen] = useState(false)
  const [heroEditDialogOpen, setHeroEditDialogOpen] = useState(false)
  const [selectedHeroGroup, setSelectedHeroGroup] = useState<HeroGalleryGroup | null>(null)
  const [heroFormData, setHeroFormData] = useState<HeroMediaFormData[]>([])
  const [selectedFiles, setSelectedFiles] = useState<{ [key: string]: File | null }>({})

  // State for creating a new hero group
  const [createHeroDialogOpen, setCreateHeroDialogOpen] = useState(false)
  const [newHeroFormData, setNewHeroFormData] = useState<HeroMediaFormData[]>([])
  const [newSelectedFiles, setNewSelectedFiles] = useState<{ [key: string]: File | null }>({})

  // State for deleting a hero group
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<HeroGalleryGroup | null>(null);

  // State for Project Blocks
  const [createBlockDialogOpen, setCreateBlockDialogOpen] = useState(false);
  const [newBlockFormData, setNewBlockFormData] = useState({ title: '', subtitle: '', content: '', order: 0 });
  const [blockDeleteDialogOpen, setBlockDeleteDialogOpen] = useState(false);
  const [blockToDelete, setBlockToDelete] = useState<ProjectBlock | null>(null);
  // Состояние для текстового контента блока
  const [blockTextDialogOpen, setBlockTextDialogOpen] = useState(false);
  const [blockToEditText, setBlockToEditText] = useState<ProjectBlock | null>(null);
  const [blockTextFormData, setBlockTextFormData] = useState<BlockTextFormData>({ title: '', subtitle: '', content: '', order: 0 });

  // Состояние для медиа контента блока
  const [blockMediaCreateOpen, setBlockMediaCreateOpen] = useState(false);
  const [blockMediaEditOpen, setBlockMediaEditOpen] = useState(false);
  const [blockMediaDeleteOpen, setBlockMediaDeleteOpen] = useState(false);
  const [parentBlockId, setParentBlockId] = useState<number | null>(null); // ID родительского блока
  const [selectedBlockMediaGroup, setSelectedBlockMediaGroup] = useState<any | null>(null);
  const [blockMediaGroupToDelete, setBlockMediaGroupToDelete] = useState<any | null>(null);
  const [blockMediaFormData, setBlockMediaFormData] = useState<MediaFormData[]>([]);
  const [newBlockMediaFormData, setNewBlockMediaFormData] = useState<MediaFormData[]>([]);
  const [selectedBlockMediaFiles, setSelectedBlockMediaFiles] = useState<{ [key: number]: File | null }>({});
  const [newSelectedBlockMediaFiles, setNewSelectedBlockMediaFiles] = useState<{ [key: number]: File | null }>({});

  // State for upload progress and file previews
  const [_uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [_filePreviews, setFilePreviews] = useState<{ [key: string]: string }>({});

  // Helper functions for file upload optimization
  const handleUploadProgress = (key: string, progress: number) => {
    setUploadProgress(prev => ({ ...prev, [key]: progress }));
  };

  const createFilePreview = (file: File, key: string) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreviews(prev => ({ ...prev, [key]: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const clearFilePreview = (key: string) => {
    setFilePreviews(prev => {
      const newPreviews = { ...prev };
      delete newPreviews[key];
      return newPreviews;
    });
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[key];
      return newProgress;
    });
  };

  // Enhanced file change handlers with optimization
  const handleEnhancedFileChange = (index: number, file: File | null, isHero: boolean = true) => {
    const key = `${isHero ? 'hero' : 'block'}_${index}`;

    console.log('📁 [DEBUG] handleEnhancedFileChange called:', {
      index,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      isHero,
      key
    });

    if (file) {
      createFilePreview(file, key);
      handleUploadProgress(key, 0);
    } else {
      clearFilePreview(key);
    }

    if (isHero) {
      setSelectedFiles(prev => {
        const newFiles = { ...prev, [index]: file };
        console.log('📁 [DEBUG] Updated selectedFiles (Hero):', newFiles);
        return newFiles;
      });
    } else {
      setSelectedBlockMediaFiles(prev => {
        const newFiles = { ...prev, [index]: file };
        console.log('📁 [DEBUG] Updated selectedBlockMediaFiles:', newFiles);
        return newFiles;
      });
    }
  };

  const handleEnhancedNewFileChange = (index: number, file: File | null, isHero: boolean = true) => {
    const key = `new_${isHero ? 'hero' : 'block'}_${index}`;

    console.log('📁 [DEBUG] handleEnhancedNewFileChange called:', {
      index,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      isHero,
      key
    });

    if (file) {
      createFilePreview(file, key);
      handleUploadProgress(key, 0);
    } else {
      clearFilePreview(key);
    }

    if (isHero) {
      setNewSelectedFiles(prev => {
        const newFiles = { ...prev, [index]: file };
        console.log('📁 [DEBUG] Updated newSelectedFiles (Hero):', newFiles);
        return newFiles;
      });
    } else {
      setNewSelectedBlockMediaFiles(prev => {
        const newFiles = { ...prev, [index]: file };
        console.log('📁 [DEBUG] Updated newSelectedBlockMediaFiles:', newFiles);
        return newFiles;
      });
    }
  };

  // Reset form functions
  const resetHeroEditForm = () => {
    setSelectedFiles({});
    setHeroFormData([]);
    setFilePreviews({});
    setUploadProgress({});
  };

  const resetHeroCreateForm = () => {
    setNewSelectedFiles({});
    setNewHeroFormData([]);
    setFilePreviews({});
    setUploadProgress({});
  };

  const resetBlockCreateForm = () => {
    setNewBlockFormData({ title: '', subtitle: '', content: '', order: 0 });
  };

  // Reset form functions for block text editing
  const resetBlockTextEditForm = () => {
    setBlockTextFormData({ title: '', subtitle: '', content: '', order: 0 });
    setBlockToEditText(null);
    setError(null);
  };

  // Reset form functions for block media
  const resetBlockMediaCreateForm = () => {
    setNewBlockMediaFormData([]);
    setNewSelectedBlockMediaFiles({});
    setParentBlockId(null);
    setError(null);
  };

  const resetBlockMediaEditForm = () => {
    setBlockMediaFormData([]);
    setSelectedBlockMediaFiles({});
    setSelectedBlockMediaGroup(null);
    setError(null);
  };


  // Утилитарная функция для нормализации путей к медиа файлам
  const normalizePath = useCallback((path: string, _isVideo: boolean = false): string => {
    if (!path) return '';

    // Если путь уже начинается с http, возвращаем как есть
    if (path.startsWith('http')) return path;

    // Если путь начинается с /storage/, добавляем apiUrl
    if (path.startsWith('/storage/')) return `${apiUrl}${path}`;

    // Если путь начинается с /, добавляем apiUrl/storage
    if (path.startsWith('/')) return `${apiUrl}/storage${path}`;

    // В остальных случаях добавляем apiUrl/storage/ префикс
    return `${apiUrl}/storage/${path}`;
  }, [apiUrl])

  /**
   * Validates if a file is a valid image file based on its type and MIME type
   * @param file - The file to validate
   * @returns boolean - True if the file is a valid image, false otherwise
   */
  const validateImageFile = (file: File): boolean => {
    // Check file extension
    const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';

    // Check MIME type
    const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    return validExtensions.includes(fileExtension) && validMimeTypes.includes(file.type);
  };

  // Функция для преобразования данных heroMediaItems
  const transformHeroMediaItems = useCallback((mediaItems: any[]): HeroGalleryGroup[] => {
    if (!mediaItems || mediaItems.length === 0) return []

    const groupedItems = mediaItems.reduce((acc: any, item: any) => {
      const groupId = item.group_id || 1
      if (!acc[groupId]) {
        acc[groupId] = []
      }
      acc[groupId].push(item)
      return acc
    }, {})

    return Object.entries(groupedItems).map(([groupId, items]: [string, any]) => ({
      id: parseInt(groupId),
      type: items[0]?.group_type || 'single',
      items: items.map((item: any) => ({
        type: item.file_type,
        src: normalizePath(item.file_path, item.file_type === 'video'),
        alt: item.alt_text || '',
        poster: item.poster_path ? normalizePath(item.poster_path) : undefined
      }))
    }))
  }, [normalizePath])

  // Функция для преобразования блоков проекта
  const transformBlocks = useCallback((blocks: any[]): ProjectBlock[] => {
    if (!blocks || blocks.length === 0) return []

    return blocks.map(block => {
      const mediaItems = block.media_items ? block.media_items.map((item: any) => {
        console.log('🔍 [DEBUG] transformBlocks - processing media item:', {
          id: item.id,
          file_path: item.file_path,
          file_type: item.file_type,
          group_id: item.group_id,
          group_type: item.group_type
        });

        const transformedSrc = normalizePath(item.file_path, item.file_type === 'video');

        console.log('🔍 [DEBUG] transformBlocks - transformed src:', transformedSrc);

        return {
          id: item.id,
          type: item.file_type,
          src: transformedSrc,
          alt: item.alt_text || '',
          poster: item.poster_path ? normalizePath(item.poster_path) : undefined,
          order: item.order || 0,
          group_id: item.group_id || 1,
          group_type: item.group_type || 'single'
        };
      }).sort((a: any, b: any) => a.order - b.order) : []

      return {
        id: block.id,
        title: block.title,
        subtitle: block.subtitle,
        content: block.content,
        order: block.order,
        mediaItems: mediaItems
      }
    }).sort((a, b) => a.order - b.order)
  }, [normalizePath])

  // Функция для группировки медиа-элементов блока
  const groupBlockMediaItems = (mediaItems: ProjectBlockMediaItem[]) => {
    const groupedItems = mediaItems.reduce((acc: any, item: any) => {
      const groupId = item.group_id || 1
      if (!acc[groupId]) {
        acc[groupId] = []
      }
      acc[groupId].push(item)
      return acc
    }, {})

    return Object.entries(groupedItems).map(([groupId, items]: [string, any]) => ({
      id: parseInt(groupId),
      type: items[0]?.group_type || 'single',
      items: items
    }))
  }

  // Функция для загрузки данных проекта
  const fetchProjectDetail = useCallback(async () => {
    try {
      setLoading(true)
      const response = await apiClient.get<{ success: boolean; data: any }>(`/api/projects/${resolvedParams.slug}`)
      const data = response.data

      if (data.success && data.data.detail) {
        const detail = data.data.detail
        const project = data.data

        const transformedDetail = {
          ...detail,
          project_id: project.id,
          heroMediaItems: detail.hero_media_items ? transformHeroMediaItems(detail.hero_media_items) : [],
          blocks: detail.blocks ? transformBlocks(detail.blocks) : []
        }

        setProjectDetail(transformedDetail)

        setEditFormData({
          title: detail.title || '',
          subtitle: detail.subtitle || '',
          client: detail.client || '',
          year: detail.year || new Date().getFullYear()
        })
      }
    } catch (error) {
      console.error('Ошибка загрузки деталей проекта:', error)
      setError('Ошибка загрузки деталей проекта')
    } finally {
      setLoading(false)
    }
  }, [apiUrl, resolvedParams.slug, transformBlocks, transformHeroMediaItems])

  // Функция для сохранения изменений
  const handleSave = async (formData: EditFormData) => {
    if (!projectDetail) return

    try {
      setSaving(true)
      setError(null)

      // Project ID is available but not used in this request
      // const projectId = projectDetail.project_id || projectDetail.id

      const response = await apiClient.put<{ success: boolean; message?: string; data?: any }>(`/api/projects/${resolvedParams.slug}/detail`, formData)

      const data = response.data

      if (data.success) {
        setSuccess(SUCCESS_MESSAGES.PROJECT_UPDATED)
        setProjectDetail(prev => prev ? {
          ...prev,
          ...formData
        } : null)

        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(data.message || 'Ошибка при сохранении')
      }
    } catch (error) {
      console.error('Ошибка при сохранении:', error)
      setError('Ошибка при сохранении проекта')
    } finally {
      setSaving(false)
    }
  }

  // Функция для возврата к списку проектов
  const handleBackToProjects = () => {
    router.push('/admin/projects');
  }

  // Функция для создания деталей проекта
  const handleCreateDetail = async (formData: EditFormData) => {
    if (!resolvedParams.slug) return

    try {
      setSaving(true)
      setError(null)

      const response = await apiClient.post<{ success: boolean; message?: string; data?: any }>(`/api/projects/${resolvedParams.slug}/detail`, formData)

      const data = response.data

      if (data.success) {
        setSuccess(SUCCESS_MESSAGES.PROJECT_CREATED)
        await fetchProjectDetail()

        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(data.message || 'Ошибка при создании деталей')
      }
    } catch (error) {
      console.error('Ошибка при создании деталей:', error)
      setError('Ошибка при создании деталей проекта')
    } finally {
      setSaving(false)
    }
  }

  // Функция для обработки изменения постера
  const _handlePosterChange = (index: number, file: File | null) => {
    if (file) {
      // Validate file size
      if (!validateFileSize(file, 'image')) {
        setError(ERROR_MESSAGES.FILE_TOO_LARGE('2 MB'));
        return;
      }

      // Validate image file format
      if (!validateImageFile(file)) {
        setError(ERROR_MESSAGES.INVALID_IMAGE_FORMAT(file.name));
        return;
      }

      setError(null);
    }

    const posterKey = `poster_${index}`;
    setSelectedFiles(prev => ({ ...prev, [posterKey]: file }));
  };

  // Функция для обработки изменения постера в новых блок медиа
  const _handleNewBlockPosterChange = (index: number, file: File | null) => {
    if (file) {
      // Validate file size
      if (!validateFileSize(file, 'image')) {
        setError(ERROR_MESSAGES.FILE_TOO_LARGE('2 MB'));
        return;
      }

      // Validate image file format
      if (!validateImageFile(file)) {
        setError(ERROR_MESSAGES.INVALID_IMAGE_FORMAT(file.name));
        return;
      }

      setError(null);
    }

    const posterKey = `poster_${index}`;
    setNewSelectedBlockMediaFiles(prev => ({ ...prev, [posterKey]: file }));
  };

  // Функция для обработки изменения типа файла в блок медиа редактировании
  const handleBlockMediaFileTypeChange = (index: number, fileType: 'image' | 'video') => {
    const updatedFormData = [...blockMediaFormData];
    updatedFormData[index].file_type = fileType;

    // Clear poster path if changing to image
    if (fileType === 'image') {
      updatedFormData[index].poster_path = '';
      // Clear any selected poster file
      const posterKey = `poster_${index}`;
      setSelectedBlockMediaFiles(prev => {
        const newFiles = { ...prev };
        delete (newFiles as any)[posterKey];
        return newFiles;
      });
    }

    setBlockMediaFormData(updatedFormData);
  };

  // Функция для обработки изменения постера в блок медиа редактировании
  const handleBlockPosterChange = (index: number, file: File | null) => {
    if (file) {
      // Validate file size
      if (!validateFileSize(file, 'image')) {
        setError(ERROR_MESSAGES.FILE_TOO_LARGE('2 MB'));
        return;
      }

      // Validate image file format
      if (!validateImageFile(file)) {
        setError(ERROR_MESSAGES.INVALID_IMAGE_FORMAT(file.name));
        return;
      }

      setError(null);
    }

    const posterKey = `poster_${index}`;
    setSelectedBlockMediaFiles(prev => ({ ...prev, [posterKey]: file }));
  };

  // Функция для открытия диалога редактирования
  const handleEditHeroGroup = (group: HeroGalleryGroup) => {
    setSelectedHeroGroup(group)
    setSelectedFiles({})

    const formData = group.items.map((item, index) => ({
      id: index,
      group_id: group.id,
      group_type: group.type,
      file_type: item.type,
      file_path: item.src.replace(`${apiUrl}/storage/`, '').replace(`${apiUrl}/storage`, '').replace(`${apiUrl}`, ''),
      alt_text: item.alt || '',
      poster_path: item.poster ? item.poster.replace(`${apiUrl}/storage/`, '').replace(`${apiUrl}/storage`, '').replace(`${apiUrl}`, '') : ''
    }))

    setHeroFormData(formData)
    setHeroEditDialogOpen(true)
  }

  // Функция для сохранения изменений
  const handleSaveHeroGroup = async () => {
    console.log('🔍 [DEBUG] handleSaveHeroGroup started', {
      selectedHeroGroup,
      heroFormData,
      selectedFiles
    });

    if (!selectedHeroGroup || !projectDetail) return

    try {
      setSaving(true)
      setError(null)

      const oversizedFiles: string[] = []
      Object.entries(selectedFiles).forEach(([key, file]) => {
        if (file) {
          let fileType: 'image' | 'video' = 'image';
          let itemIndex = 0;

          // Определяем тип файла и индекс
          if (key.startsWith('poster_')) {
            // Это постер, всегда изображение
            fileType = 'image';
            itemIndex = parseInt(key.replace('poster_', ''));
          } else {
            // Это основной файл
            itemIndex = parseInt(key);
            if (!isNaN(itemIndex) && heroFormData[itemIndex]) {
              fileType = heroFormData[itemIndex].file_type;
            }
          }

          if (!validateFileSize(file, fileType)) {
            const limit = getFileSizeLimit(fileType);
            const fileDescription = key.startsWith('poster_') ? `Постер для элемента #${itemIndex + 1}` : `Элемент #${itemIndex + 1}`;
            oversizedFiles.push(`${fileDescription}: ${file.name} (${formatFileSize(file.size)}) превышает лимит ${limit}`)
          }
        }
      })

      if (oversizedFiles.length > 0) {
        setError(`Следующие файлы превышают максимальный размер:\n${oversizedFiles.join('\n')}`)
        return
      }

      const formData = new FormData()
      formData.append('action', 'update_hero_media')
      formData.append('group_id', selectedHeroGroup.id.toString())
      formData.append('group_type', selectedHeroGroup.type)

      console.log('📋 [DEBUG] Building FormData for Hero media');

      heroFormData.forEach((item, index) => {
        console.log(`📝 [DEBUG] Processing Hero item ${index}:`, {
          item,
          hasFile: !!selectedFiles[index],
          hasPoster: !!selectedFiles[`poster_${index}`]
        });

        formData.append(`hero_media_items[${index}][group_id]`, item.group_id.toString())
        formData.append(`hero_media_items[${index}][group_type]`, item.group_type)
        formData.append(`hero_media_items[${index}][file_type]`, item.file_type)
        formData.append(`hero_media_items[${index}][alt_text]`, item.alt_text)

        if (selectedFiles[index]) {
          formData.append(`hero_media_items[${index}][file]`, selectedFiles[index] as File)
          console.log(`📁 [DEBUG] Added file for Hero item ${index}:`, selectedFiles[index]?.name);
        } else {
          formData.append(`hero_media_items[${index}][file_path]`, item.file_path)
          console.log(`📁 [DEBUG] Using existing file path for Hero item ${index}:`, item.file_path);
        }

        // Handle poster file upload for videos
        if (item.file_type === 'video') {
          const posterKey = `poster_${index}`;
          if (selectedFiles[posterKey]) {
            formData.append(`hero_media_items[${index}][poster_file]`, selectedFiles[posterKey] as File);
            console.log(`🖼️ [DEBUG] Added poster file for Hero item ${index}:`, selectedFiles[posterKey]?.name);
          } else if (item.poster_path) {
            formData.append(`hero_media_items[${index}][poster_path]`, item.poster_path);
            console.log(`🖼️ [DEBUG] Using existing poster path for Hero item ${index}:`, item.poster_path);
          } else {
            console.warn(`⚠️ [WARNING] No poster found for video Hero item ${index}`);
          }
        }
      })

      console.log('🚀 [DEBUG] Sending FormData to API:', `/api/projects/${resolvedParams.slug}/detail/update-media`);

      const response = await apiClient.post<{ success: boolean; message?: string; data?: any }>(`/api/projects/${resolvedParams.slug}/detail/update-media`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      console.log('📥 [DEBUG] Hero API Response received:', {
        status: response.status,
        statusText: response.statusText
      });

      const data = response.data;
      console.log('📥 [DEBUG] Hero API Response data:', data);

      if (data.success) {
        console.log('✅ [SUCCESS] Hero media updated successfully');
        setSuccess(SUCCESS_MESSAGES.HERO_MEDIA_UPDATED)

        if (data.data && data.data.hero_media_items) {
          console.log('📋 [DEBUG] Processing updated Hero media items:', data.data.hero_media_items);
          const updatedFormData = heroFormData.map((item, index) => {
            const updatedItem = data.data.hero_media_items.find((apiItem: any) => apiItem.order === index) || data.data.hero_media_items[index]
            if (updatedItem) {
              console.log(`📝 [DEBUG] Updated Hero item ${index}:`, {
                old_file_path: item.file_path,
                new_file_path: updatedItem.file_path,
                old_poster_path: item.poster_path,
                new_poster_path: updatedItem.poster_path
              });
              return {
                ...item,
                file_path: updatedItem.file_path || item.file_path,
                poster_path: updatedItem.poster_path || item.poster_path
              }
            }
            return item
          })
          setHeroFormData(updatedFormData)
        }

        await fetchProjectDetail()
        setHeroEditDialogOpen(false)
        resetHeroEditForm()
        setTimeout(() => setSuccess(null), 3000)
      } else {
        console.error('❌ [ERROR] Hero API request failed:', {
          status: response.status,
          data
        });
        setError(data.message || `Ошибка при сохранении: ${response.status}`)
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('413')) {
        setError('Размер файла превышает максимально допустимый лимит. Для изображений: 2 MB, для видео: 50 MB.')
      } else {
        setError(error instanceof Error ? error.message : 'Ошибка при сохранении Hero медиа')
      }
    } finally {
      setSaving(false)
    }
  }

  // Функция для открытия диалога создания Hero Group
  const handleOpenCreateHeroDialog = () => {
    if (!projectDetail) return;
    const nextGroupId = projectDetail.heroMediaItems && projectDetail.heroMediaItems.length > 0
      ? Math.max(...projectDetail.heroMediaItems.map(g => g.id)) + 1
      : 1;

    setNewHeroFormData([{
      group_id: nextGroupId,
      group_type: 'single',
      file_type: 'image',
      file_path: '',
      alt_text: '',
      poster_path: '',
    }]);
    setNewSelectedFiles({});
    setCreateHeroDialogOpen(true);
  };

  // Функция для создания новой Hero Group
  const handleCreateHeroGroup = async () => {
    console.log('🔍 [DEBUG] handleCreateHeroGroup started', {
      newHeroFormData,
      newSelectedFiles
    });

    if (!projectDetail) return;

    try {
      setSaving(true);
      setError(null);

      if (Object.values(newSelectedFiles).every(file => file === null)) {
        console.error('❌ [ERROR] No files selected for new Hero group');
        setError('Пожалуйста, выберите хотя бы один файл для новой группы.');
        setSaving(false);
        return;
      }

      // Check if poster is missing for video files
      const missingPosters = newHeroFormData.filter((item, index) => {
        return item.file_type === 'video' && !newSelectedFiles[`poster_${index}`];
      });

      if (missingPosters.length > 0) {
        console.error('❌ [ERROR] Missing poster files for video items:', missingPosters);
        setError('Пожалуйста, выберите постер для каждого видео файла.');
        setSaving(false);
        return;
      }

      // Check for invalid image files
      const invalidImageFiles: string[] = [];
      Object.entries(newSelectedFiles).forEach(([key, file]) => {
        if (file) {
          if (key.startsWith('poster_') && !validateImageFile(file)) {
            invalidImageFiles.push(`Постер: ${file.name} не является допустимым изображением. Разрешены только форматы: jpg, jpeg, png, gif, webp`);
          }
        }
      });

      if (invalidImageFiles.length > 0) {
        console.error('❌ [ERROR] Invalid image files:', invalidImageFiles);
        setError(`Следующие файлы имеют недопустимый формат:\n${invalidImageFiles.join('\n')}`);
        setSaving(false);
        return;
      }

      // Check for oversized files
      const oversizedFiles: string[] = [];
      Object.entries(newSelectedFiles).forEach(([key, file]) => {
        if (file) {
          // Check if this is a poster file
          if (key.startsWith('poster_')) {
            if (!validateFileSize(file, 'image')) {
              oversizedFiles.push(`Постер: ${file.name} (${formatFileSize(file.size)}) превышает лимит 2 MB`);
            }
          } else {
            const index = parseInt(key);
            const fileType = newHeroFormData[index].file_type;
            if (!validateFileSize(file, fileType)) {
              const limit = getFileSizeLimit(fileType);
              oversizedFiles.push(`Элемент #${index + 1}: ${file.name} (${formatFileSize(file.size)}) превышает лимит ${limit}`);
            }
          }
        }
      });

      if (oversizedFiles.length > 0) {
        console.error('❌ [ERROR] Oversized files:', oversizedFiles);
        setError(`Следующие файлы превышают максимальный размер:\n${oversizedFiles.join('\n')}`);
        setSaving(false);
        return;
      }

      const formData = new FormData();
      formData.append('action', 'update_hero_media');
      formData.append('group_id', newHeroFormData[0].group_id.toString());
      formData.append('group_type', newHeroFormData[0].group_type);

      console.log('📋 [DEBUG] Building FormData for new Hero media');

      newHeroFormData.forEach((item, index) => {
        console.log(`📝 [DEBUG] Processing new Hero item ${index}:`, {
          item,
          hasFile: !!newSelectedFiles[index],
          hasPoster: !!newSelectedFiles[`poster_${index}`]
        });

        formData.append(`hero_media_items[${index}][group_id]`, item.group_id.toString());
        formData.append(`hero_media_items[${index}][group_type]`, item.group_type);
        formData.append(`hero_media_items[${index}][file_type]`, item.file_type);
        formData.append(`hero_media_items[${index}][alt_text]`, item.alt_text);

        if (newSelectedFiles[index]) {
          formData.append(`hero_media_items[${index}][file]`, newSelectedFiles[index] as File);
          console.log(`📁 [DEBUG] Added file for new Hero item ${index}:`, newSelectedFiles[index]?.name);
        }

        // Handle poster file upload for videos
        if (item.file_type === 'video') {
          const posterKey = `poster_${index}`;
          if (newSelectedFiles[posterKey]) {
            formData.append(`hero_media_items[${index}][poster_file]`, newSelectedFiles[posterKey] as File);
            console.log(`🖼️ [DEBUG] Added poster file for new Hero item ${index}:`, newSelectedFiles[posterKey]?.name);
          } else if (item.poster_path) {
            formData.append(`hero_media_items[${index}][poster_path]`, item.poster_path);
            console.log(`🖼️ [DEBUG] Using existing poster path for new Hero item ${index}:`, item.poster_path);
          } else {
            console.warn(`⚠️ [WARNING] No poster found for video new Hero item ${index}`);
          }
        }
      });

      console.log('🚀 [DEBUG] Sending FormData to API for new Hero group:', `/api/projects/${resolvedParams.slug}/detail/update-media`);

      const response = await apiClient.post<{ success: boolean; message?: string; data?: any }>(`/api/projects/${resolvedParams.slug}/detail/update-media`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      console.log('📥 [DEBUG] New Hero API Response received:', {
        status: response.status,
        statusText: response.statusText
      });

      const data = response.data;
      console.log('📥 [DEBUG] New Hero API Response data:', data);

      if (data.success) {
        console.log('✅ [SUCCESS] New Hero group created successfully');
        if (data.data && data.data.hero_media_items) {
          console.log('📋 [DEBUG] Created Hero media items:', data.data.hero_media_items);
        }
        setSuccess(SUCCESS_MESSAGES.HERO_MEDIA_CREATED);
        await fetchProjectDetail();
        setCreateHeroDialogOpen(false);
        resetHeroCreateForm();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        console.error('❌ [ERROR] New Hero API request failed:', data);
        setError(data.message || 'Ошибка при создании группы');
      }

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Ошибка при создании группы Hero медиа');
    } finally {
      setSaving(false);
    }
  };

  // Функция для открытия диалога подтверждения удаления
  const handleOpenDeleteDialog = (group: HeroGalleryGroup) => {
    setGroupToDelete(group);
    setDeleteDialogOpen(true);
  };

  // Функция для удаления группы Hero
  const handleDeleteHeroGroup = async () => {
    if (!groupToDelete) return;

    setSaving(true);
    setError(null);
    try {
      const response = await apiClient.delete<{ success: boolean; message?: string }>(`/api/projects/${resolvedParams.slug}/detail/hero-media/${groupToDelete.id}`);

      const data = response.data;

      if (data.success) {
        setSuccess(SUCCESS_MESSAGES.HERO_MEDIA_DELETED);
        await fetchProjectDetail(); // Обновляем список
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.message || 'Ошибка при удалении группы');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при удалении группы Hero медиа');
    } finally {
      setSaving(false);
      setDeleteDialogOpen(false);
      setGroupToDelete(null);
    }
  };

  const handleNewGroupTypeChange = (value: 'single' | 'double') => {
    const currentItems = [...newHeroFormData];
    const groupId = currentItems[0]?.group_id || 1;

    currentItems.forEach(item => item.group_type = value);

    if (value === 'single' && currentItems.length > 1) {
      setNewHeroFormData([currentItems[0]]);
    } else if (value === 'double' && currentItems.length === 1) {
      currentItems.push({
        group_id: groupId,
        group_type: 'double',
        file_type: 'image',
        file_path: '',
        alt_text: '',
        poster_path: '',
      });
      setNewHeroFormData(currentItems);
    } else {
      setNewHeroFormData(currentItems);
    }
  };

  // --- Handlers for Project Blocks ---
  const handleOpenCreateBlockDialog = () => {
    const nextOrder = projectDetail?.blocks && projectDetail.blocks.length > 0
      ? Math.max(...projectDetail.blocks.map(b => b.order)) + 1
      : 1;
    setNewBlockFormData({ title: '', subtitle: '', content: '', order: nextOrder });
    setCreateBlockDialogOpen(true);
  };

  const handleCreateBlock = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await apiClient.post<{ success: boolean; message?: string; data?: any }>(`/api/projects/${resolvedParams.slug}/blocks`, newBlockFormData);
      const data = response.data;
      if (!data.success) throw new Error(data.message || 'Не удалось создать блок.');
      setSuccess(SUCCESS_MESSAGES.BLOCK_CREATED);
      await fetchProjectDetail();
      setCreateBlockDialogOpen(false);
      resetBlockCreateForm();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка при создании блока.');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenDeleteBlockDialog = (block: ProjectBlock) => {
    setBlockToDelete(block);
    setBlockDeleteDialogOpen(true);
  };

  const handleOpenEditBlockTextDialog = (block: ProjectBlock) => {
    setBlockToEditText(block);
    setBlockTextFormData({ title: block.title, subtitle: block.subtitle || '', content: block.content, order: block.order });
    setBlockTextDialogOpen(true);
  };

  // Функция для удаления блока
  const handleDeleteBlock = async () => {
    if (!blockToDelete) return;

    setSaving(true);
    setError(null);

    try {
      const response = await apiClient.delete<{ success: boolean; message?: string }>(`/api/projects/${resolvedParams.slug}/blocks/${blockToDelete.id}`);

      const data = response.data;

      if (data.success) {
        setSuccess(SUCCESS_MESSAGES.BLOCK_DELETED);
        await fetchProjectDetail();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.message || `Ошибка при удалении блока: ${response.status}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при удалении блока');
    } finally {
      setSaving(false);
      setBlockDeleteDialogOpen(false);
      setBlockToDelete(null);
    }
  };

  const handleSaveBlockText = async () => {
    if (!blockToEditText || !blockTextFormData) return;
    setSaving(true);
    setError(null);
    try {
      const response = await apiClient.put<{ success: boolean; message?: string; data?: any }>(`/api/projects/${resolvedParams.slug}/blocks/${blockToEditText.id}`, blockTextFormData);
      const data = response.data;
      if (!data.success) throw new Error(data.message || 'Не удалось сохранить блок.');
      setSuccess(SUCCESS_MESSAGES.BLOCK_UPDATED);
      await fetchProjectDetail();
      setBlockTextDialogOpen(false);
      resetBlockTextEditForm();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла неизвестная ошибка.');
    } finally {
      setSaving(false);
    }
  };

  // --- ОБРАБОТЧИКИ МЕДИА БЛОКА ---
  const handleOpenCreateBlockMediaDialog = (blockId: number) => {
    const nextGroupId = Date.now();
    setParentBlockId(blockId);
    setNewBlockMediaFormData([{ group_id: nextGroupId, group_type: 'single', file_type: 'image', file_path: '', alt_text: '', poster_path: '', order: 1 }]);
    setNewSelectedBlockMediaFiles({});
    setBlockMediaCreateOpen(true);
  };

  const handleOpenEditBlockMediaDialog = (group: any, blockId: number) => {
    setParentBlockId(blockId);
    setSelectedBlockMediaGroup(group);
    setBlockMediaFormData(group.items.map((item: any): MediaFormData => ({
      id: item.id,
      group_id: item.group_id,
      group_type: item.group_type,
      file_path: item.src.startsWith(`${apiUrl}/storage/`)
        ? item.src.replace(`${apiUrl}/storage/`, '')
        : item.src.startsWith(`${apiUrl}`)
          ? item.src.replace(`${apiUrl}`, '')
          : item.src,
      file_type: item.type,
      alt_text: item.alt,
      poster_path: item.poster
        ? (item.poster.startsWith(`${apiUrl}/storage/`)
          ? item.poster.replace(`${apiUrl}/storage/`, '')
          : item.poster.startsWith(`${apiUrl}`)
            ? item.poster.replace(`${apiUrl}`, '')
            : item.poster)
        : '',
      order: item.order,
    })));
    setSelectedBlockMediaFiles({});
    setBlockMediaEditOpen(true);
  };

  const handleOpenDeleteBlockMediaDialog = (group: any, blockId: number) => {
    setParentBlockId(blockId);
    setBlockMediaGroupToDelete(group);
    setBlockMediaDeleteOpen(true);
  };

  const handleSaveBlockMedia = async (isCreating: boolean) => {
    console.log('🔍 [DEBUG] handleSaveBlockMedia started', {
      isCreating,
      parentBlockId,
      currentFormData: isCreating ? newBlockMediaFormData : blockMediaFormData,
      selectedFiles: isCreating ? newSelectedBlockMediaFiles : selectedBlockMediaFiles
    });

    if (!parentBlockId) {
      console.error('❌ [ERROR] parentBlockId is null');
      return;
    }

    const currentFormData = isCreating ? newBlockMediaFormData : blockMediaFormData;
    if (currentFormData.length === 0) {
      console.error('❌ [ERROR] No form data to save');
      setError("Нет данных для сохранения.");
      return;
    }

    const selectedFiles = isCreating ? newSelectedBlockMediaFiles : selectedBlockMediaFiles;
    const groupId = isCreating ? currentFormData[0].group_id : selectedBlockMediaGroup.id;

    console.log('📋 [DEBUG] Form validation data', {
      currentFormData,
      selectedFiles,
      groupId,
      hasFiles: Object.values(selectedFiles).some(file => file !== null)
    });

    // Валидация: проверяем, что выбран хотя бы один файл при создании
    if (isCreating) {
      const hasFiles = Object.values(selectedFiles).some(file => file !== null);
      if (!hasFiles) {
        console.error('❌ [ERROR] No files selected for creation');
        setError("Пожалуйста, выберите хотя бы один файл для загрузки.");
        return;
      }

      // Check if poster is missing for video files
      const missingPosters = currentFormData.filter((item, index) => {
        return item.file_type === 'video' && !(selectedFiles as any)[`poster_${index}`];
      });

      if (missingPosters.length > 0) {
        console.error('❌ [ERROR] Missing poster files for video items');
        setError('Пожалуйста, выберите постер для каждого видео файла.');
        return;
      }

      // Check for invalid image files (posters)
      const invalidImageFiles: string[] = [];
      Object.entries(selectedFiles).forEach(([key, file]) => {
        if (file && key.startsWith('poster_') && !validateImageFile(file)) {
          invalidImageFiles.push(`Постер: ${file.name} не является допустимым изображением. Разрешены только форматы: jpg, jpeg, png, gif, webp`);
        }
      });

      if (invalidImageFiles.length > 0) {
        console.error('❌ [ERROR] Invalid image files:', invalidImageFiles);
        setError(`Следующие файлы имеют недопустимый формат:\n${invalidImageFiles.join('\n')}`);
        return;
      }

      // Check for oversized files
      const oversizedFiles: string[] = [];
      Object.entries(selectedFiles).forEach(([key, file]) => {
        if (file) {
          // Check if this is a poster file
          if (key.startsWith('poster_')) {
            if (!validateFileSize(file, 'image')) {
              oversizedFiles.push(`Постер: ${file.name} (${formatFileSize(file.size)}) превышает лимит 2 MB`);
            }
          } else {
            const index = parseInt(key);
            const fileType = currentFormData[index].file_type;
            if (!validateFileSize(file, fileType)) {
              const limit = getFileSizeLimit(fileType);
              oversizedFiles.push(`Элемент #${index + 1}: ${file.name} (${formatFileSize(file.size)}) превышает лимит ${limit}`);
            }
          }
        }
      });

      if (oversizedFiles.length > 0) {
        console.error('❌ [ERROR] Oversized files:', oversizedFiles);
        setError(`Следующие файлы превышают максимальный размер:\n${oversizedFiles.join('\n')}`);
        return;
      }
    } else {
      // Validation for editing mode
      // Check if poster is missing for video files when editing
      const missingPosters = currentFormData.filter((item, index) => {
        return item.file_type === 'video' && !item.poster_path && !(selectedFiles as any)[`poster_${index}`];
      });

      if (missingPosters.length > 0) {
        console.error('❌ [ERROR] Missing poster files for video items in edit mode');
        setError('Пожалуйста, выберите постер для каждого видео файла.');
        return;
      }

      // Check for invalid image files (posters) in editing mode
      const invalidImageFiles: string[] = [];
      Object.entries(selectedFiles).forEach(([key, file]) => {
        if (file && key.startsWith('poster_') && !validateImageFile(file)) {
          invalidImageFiles.push(`Постер: ${file.name} не является допустимым изображением. Разрешены только форматы: jpg, jpeg, png, gif, webp`);
        }
      });

      if (invalidImageFiles.length > 0) {
        console.error('❌ [ERROR] Invalid image files in edit mode:', invalidImageFiles);
        setError(`Следующие файлы имеют недопустимый формат:\n${invalidImageFiles.join('\n')}`);
        return;
      }

      // Check for oversized files in editing mode
      const oversizedFiles: string[] = [];
      Object.entries(selectedFiles).forEach(([key, file]) => {
        if (file) {
          // Check if this is a poster file
          if (key.startsWith('poster_')) {
            if (!validateFileSize(file, 'image')) {
              oversizedFiles.push(`Постер: ${file.name} (${formatFileSize(file.size)}) превышает лимит 2 MB`);
            }
          } else {
            const index = parseInt(key);
            const fileType = currentFormData[index].file_type;
            if (!validateFileSize(file, fileType)) {
              const limit = getFileSizeLimit(fileType);
              oversizedFiles.push(`Элемент #${index + 1}: ${file.name} (${formatFileSize(file.size)}) превышает лимит ${limit}`);
            }
          }
        }
      });

      if (oversizedFiles.length > 0) {
        console.error('❌ [ERROR] Oversized files in edit mode:', oversizedFiles);
        setError(`Следующие файлы превышают максимальный размер:\n${oversizedFiles.join('\n')}`);
        return;
      }
    }

    // Валидация номера группы
    if (!currentFormData[0].group_id || currentFormData[0].group_id < 1) {
      console.error('❌ [ERROR] Invalid group_id', currentFormData[0].group_id);
      setError("Пожалуйста, укажите корректный номер группы (больше 0).");
      return;
    }

    setSaving(true);
    setError(null);

    const formData = new FormData();
    formData.append('group_type', currentFormData[0].group_type);

    console.log('📤 [DEBUG] Building FormData...');
    currentFormData.forEach((item, index) => {
      console.log(`📤 [DEBUG] Processing item ${index}:`, item);
      formData.append(`media_items[${index}][group_id]`, item.group_id.toString());
      formData.append(`media_items[${index}][alt_text]`, item.alt_text);
      formData.append(`media_items[${index}][file_type]`, item.file_type);
      formData.append(`media_items[${index}][order]`, item.order.toString());

      // Handle main file upload
      if (selectedFiles[index]) {
        console.log(`📤 [DEBUG] Adding file for item ${index}:`, selectedFiles[index]?.name, selectedFiles[index]?.size);
        formData.append(`media_items[${index}][file]`, selectedFiles[index] as File);
      } else if (item.file_path) {
        console.log(`📤 [DEBUG] Using existing file path for item ${index}:`, item.file_path);
        formData.append(`media_items[${index}][file_path]`, item.file_path);
      }

      // Handle poster file upload for videos
      if (item.file_type === 'video') {
        const posterKey = `poster_${index}`;
        if ((selectedFiles as any)[posterKey]) {
          console.log(`📤 [DEBUG] Adding poster file for item ${index}:`, (selectedFiles as any)[posterKey]?.name, (selectedFiles as any)[posterKey]?.size);
          formData.append(`media_items[${index}][poster_file]`, (selectedFiles as any)[posterKey] as File);
        } else if (item.poster_path) {
          console.log(`📤 [DEBUG] Using existing poster path for item ${index}:`, item.poster_path);
          formData.append(`media_items[${index}][poster_path]`, item.poster_path);
        }
      }
    });

    // Логируем все данные FormData
    console.log('📤 [DEBUG] FormData contents:');
    for (const [key, value] of formData.entries()) {
      console.log(`  ${key}:`, value instanceof File ? `File(${value.name}, ${value.size} bytes)` : value);
    }

    try {
      const url = isCreating
        ? `/api/projects/${resolvedParams.slug}/blocks/${parentBlockId}/media`
        : `/api/projects/${resolvedParams.slug}/blocks/${parentBlockId}/media/${groupId}`;

      console.log('🌐 [DEBUG] Request URL:', url);

      if (!isCreating) {
        formData.append('_method', 'PUT');
        console.log('🌐 [DEBUG] Added _method=PUT for update');
      }

      console.log('🌐 [DEBUG] Sending request...');
      const response = await apiClient.post<{ success: boolean; message?: string; data?: any }>(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      console.log('📥 [DEBUG] Response received:', {
        status: response.status,
        statusText: response.statusText
      });

      const data = response.data;
      console.log('📥 [DEBUG] Response data:', data);

      if (!data.success) {
        console.error('❌ [ERROR] Request failed:', data);
        throw new Error(data.message || 'Не удалось сохранить медиа.');
      }

      console.log('✅ [SUCCESS] Media saved successfully');
      setSuccess(isCreating ? SUCCESS_MESSAGES.BLOCK_MEDIA_CREATED : SUCCESS_MESSAGES.BLOCK_MEDIA_UPDATED);
      await fetchProjectDetail();
      if (isCreating) {
        setBlockMediaCreateOpen(false);
        resetBlockMediaCreateForm();
      } else {
        setBlockMediaEditOpen(false);
        resetBlockMediaEditForm();
      }
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('❌ [ERROR] Exception in handleSaveBlockMedia:', err);
      setError(err instanceof Error ? err.message : 'Произошла неизвестная ошибка.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBlockMedia = async () => {
    if (!blockMediaGroupToDelete || !parentBlockId) return;
    setSaving(true);
    setError(null);
    try {
      const response = await apiClient.delete<{ success: boolean; message?: string }>(`/api/projects/${resolvedParams.slug}/blocks/${parentBlockId}/media/${blockMediaGroupToDelete.id}`);
      const data = response.data;
      if (!data.success) throw new Error(data.message || 'Не удалось удалить медиа-группу.');
      setSuccess('Медиа группа успешно удалена.');
      await fetchProjectDetail();
      setBlockMediaDeleteOpen(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла неизвестная ошибка.');
    } finally {
      setSaving(false);
    }
  };

  const handleNewBlockMediaTypeChange = (value: 'single' | 'double') => {
    const currentItems = [...newBlockMediaFormData];
    const groupId = currentItems[0]?.group_id || Date.now();
    currentItems.forEach(item => item.group_type = value);
    if (value === 'single' && currentItems.length > 1) {
      setNewBlockMediaFormData([currentItems[0]]);
    } else if (value === 'double' && currentItems.length === 1) {
      currentItems.push({ group_id: groupId, group_type: 'double', file_type: 'image', file_path: '', alt_text: '', poster_path: '', order: 2 });
      setNewBlockMediaFormData(currentItems);
    } else {
      setNewBlockMediaFormData(currentItems);
    }
  };





  // Функция для проверки валидности файла с детальной обратной связью
  const _validateFileWithFeedback = (file: File, fileType: 'image' | 'video', fieldName: string = 'файл') => {
    const errors: string[] = [];

    // Check file size
    if (!validateFileSize(file, fileType)) {
      const limit = getFileSizeLimit(fileType);
      errors.push(`${fieldName} "${file.name}" превышает максимальный размер ${limit}`);
    }

    // Check image format for images and posters
    if (fileType === 'image' && !validateImageFile(file)) {
      errors.push(`${fieldName} "${file.name}" имеет недопустимый формат. Разрешены: jpg, jpeg, png, gif, webp`);
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  };

  // Функция для получения статуса выбранных файлов
  const _getFileSelectionStatus = (selectedFiles: { [key: string]: File | null }, formData: any[], prefix: string = '') => {
    const totalFiles = formData.length;
    const selectedCount = Object.values(selectedFiles).filter(file => file !== null).length;
    const requiredPosters = formData.filter(item => item.file_type === 'video').length;
    const selectedPosters = Object.keys(selectedFiles).filter(key => key.startsWith(`${prefix}poster_`)).length;

    return {
      totalFiles,
      selectedCount,
      requiredPosters,
      selectedPosters,
      isComplete: selectedCount >= totalFiles && selectedPosters >= requiredPosters
    };
  };

  // Функция для отображения индикатора загрузки с прогрессом
  const _getLoadingMessage = (operation: string) => {
    switch (operation) {
      case 'hero_create': return 'Создание Hero медиа...';
      case 'hero_update': return 'Обновление Hero медиа...';
      case 'hero_delete': return 'Удаление Hero медиа...';
      case 'block_create': return 'Создание блока...';
      case 'block_update': return 'Обновление блока...';
      case 'block_delete': return 'Удаление блока...';
      case 'block_media_create': return 'Создание медиа блока...';
      case 'block_media_update': return 'Обновление медиа блока...';
      case 'block_media_delete': return 'Удаление медиа блока...';
      default: return 'Загрузка...';
    }
  };



  useEffect(() => {
    fetchProjectDetail()
  }, [resolvedParams.slug, fetchProjectDetail])

  return (
    <div className="w-full min-h-screen">
      <div className="p-6">
        <h1 className="text-2xl font-bold">Управление блоками проекта</h1>
        <p className="mt-2">Здесь вы можете просматривать блоки и управлять ими - создавать, редактировать и удалять</p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="px-6 mb-4">
          <Alert className="border-green-200 bg-green-50">
            <AlertCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {success}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {error && (
        <div className="px-6 mb-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        </div>
      )}

      <div className="flex items-center justify-between mb-6 px-6">
        <Button
          variant="outline"
          onClick={handleBackToProjects}
          className="hover:cursor-pointer"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Вернуться к списку
        </Button>

      </div>

      {/* Project details */}
      <ProjectDetailsSection
        projectDetail={projectDetail}
        loading={loading}
        onSave={handleSave}
        onCreate={handleCreateDetail}
        saving={saving}
      />

      {/* Hero carousel */}
      <div className="px-6 mb-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Hero Карусель</CardTitle>
                <CardDescription>Медиа-элементы для главной секции проекта</CardDescription>
              </div>
              <Button className='hover:cursor-pointer' variant="outline" onClick={handleOpenCreateHeroDialog} disabled={!projectDetail}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Добавить группу
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {projectDetail?.heroMediaItems && projectDetail.heroMediaItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projectDetail.heroMediaItems.map((group) => (
                  <div key={group.id} className="border rounded-lg p-4 flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant={group.type === 'single' ? 'default' : 'secondary'}>
                          {group.type === 'single' ? 'Одиночный' : 'Двойной'}
                        </Badge>
                        <span className="text-sm text-gray-500">Группа #{group.id}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditHeroGroup(group)}
                          className="hover:cursor-pointer"
                        >
                          <SquarePen className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleOpenDeleteDialog(group)}
                          className="hover:cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className={`grid gap-3 ${group.type === 'double' ? 'grid-cols-2' : 'grid-cols-1'} flex-grow`}>
                      {group.items.map((item, index) => (
                        <div key={index} className="relative bg-gray-50 rounded-lg overflow-hidden">
                          {item.type === 'image' ? (
                            <div className="aspect-video relative">
                              <Image
                                src={item.src}
                                alt={item.alt || 'Hero image'}
                                fill
                                className="object-cover"
                              />
                              <div className="absolute top-2 right-2">
                                <Badge variant="outline" className="bg-white/80">
                                  <ImageIcon className="w-3 h-3 mr-1" />
                                  Изображение
                                </Badge>
                              </div>
                            </div>
                          ) : (
                            <div className="aspect-video relative">
                              <video
                                src={item.src}
                                poster={item.poster}
                                className="w-full h-full object-cover"
                                controls={false}
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                <PlayCircle className="w-12 h-12 text-white" />
                              </div>
                              <div className="absolute top-2 right-2">
                                <Badge variant="outline" className="bg-white/80">
                                  <PlayCircle className="w-3 h-3 mr-1" />
                                  Видео
                                </Badge>
                              </div>
                            </div>
                          )}

                          {item.alt && (
                            <div className="p-2">
                              <p className="text-sm text-gray-600">{item.alt}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Медиа-элементы для Hero секции не найдены</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog для ПОДТВЕРЖДЕНИЯ УДАЛЕНИЯ Hero медиа */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы собираетесь удалить группу медиа #{groupToDelete?.id}. Это действие необратимо и все связанные файлы будут удалены навсегда.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className='hover:cursor-pointer' disabled={saving}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteHeroGroup}
              disabled={saving}
              className="bg-red-600 hover:bg-red-700 hover:cursor-pointer"
            >
              {saving ? 'Удаление...' : 'Удалить'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog для ДОБАВЛЕНИЯ Hero медиа */}
      <Dialog open={createHeroDialogOpen} onOpenChange={setCreateHeroDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Добавление новой Hero группы</DialogTitle>
            <DialogDescription>
              Создайте новую группу медиа-элементов. ID группы: #{newHeroFormData[0]?.group_id}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Тип группы:</Label>
              <Select
                value={newHeroFormData[0]?.group_type || 'single'}
                onValueChange={(value) => handleNewGroupTypeChange(value as 'single' | 'double')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Одиночный</SelectItem>
                  <SelectItem value="double">Двойной</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newHeroFormData.map((item, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Элемент #{index + 1}</h4>
                </div>

                <EnhancedFileUpload
                  id={`file-${index}`}
                  label={item.file_type === 'video' ? 'Видео файл' : 'Изображение'}
                  accept={item.file_type === 'image' ? 'image/*' : 'video/*'}
                  fileType={item.file_type}
                  value={newSelectedFiles[index]}
                  onChange={(file) => handleEnhancedNewFileChange(index, file, true)}
                  onUploadProgress={(progress) => handleUploadProgress(`new_hero_${index}`, progress)}
                  required={true}
                  showPreview={true}
                />

                <div className="space-y-2">
                  <Label>Тип файла:</Label>
                  <Select
                    value={item.file_type}
                    onValueChange={(value) => {
                      const newFormData = [...newHeroFormData];
                      newFormData[index].file_type = value as 'image' | 'video';
                      setNewHeroFormData(newFormData);
                    }}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="image">Изображение</SelectItem>
                      <SelectItem value="video">Видео</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Alt текст:</Label>
                  <Input
                    value={item.alt_text}
                    onChange={(e) => {
                      const newFormData = [...newHeroFormData];
                      newFormData[index].alt_text = e.target.value;
                      setNewHeroFormData(newFormData);
                    }}
                    placeholder="Описание медиа-элемента"
                  />
                </div>

                {/* Only show poster upload for video type */}
                {item.file_type === 'video' && (
                  <div className="border-l-2 border-amber-300 pl-3 mt-4">
                    <EnhancedFileUpload
                      id={`poster-${index}`}
                      label="Постер для видео *"
                      accept="image/*"
                      fileType="image"
                      value={newSelectedFiles[`poster_${index}`]}
                      onChange={(file) => {
                        const posterKey = `poster_${index}`;
                        setNewSelectedFiles(prev => ({ ...prev, [posterKey]: file }));
                      }}
                      onUploadProgress={(progress) => handleUploadProgress(`new_hero_poster_${index}`, progress)}
                      required={true}
                      showPreview={true}
                      className="border-amber-200"
                    />
                    <div className="text-sm text-amber-600 mt-2">
                      <span className="font-medium">Важно:</span> Загрузите изображение-постер для предпросмотра видео
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateHeroDialogOpen(false)}
              disabled={saving}
              className="hover:cursor-pointer"
            >
              <X className="mr-2 h-4 w-4" />
              Отмена
            </Button>
            <Button
              onClick={handleCreateHeroGroup}
              disabled={saving}
              className="hover:cursor-pointer"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Создание...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Создать группу
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog для редактирования Hero медиа */}
      <Dialog open={heroEditDialogOpen} onOpenChange={setHeroEditDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Редактирование Hero медиа</DialogTitle>
            <DialogDescription>
              Редактируйте медиа-элементы для группы #{selectedHeroGroup?.id}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {heroFormData.map((item, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Элемент #{index + 1}</h4>
                  <Badge variant="outline">
                    {item.file_type === 'image' ? 'Изображение' : 'Видео'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Номер группы:</Label>
                    <Input
                      type="number"
                      value={item.group_id}
                      onChange={(e) => {
                        const newFormData = [...heroFormData]
                        newFormData[index].group_id = parseInt(e.target.value) || 1
                        setHeroFormData(newFormData)
                      }}
                      min="1"
                      placeholder="1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Тип группы:</Label>
                    <Select
                      value={item.group_type}
                      onValueChange={(value) => {
                        const newFormData = [...heroFormData]
                        newFormData[index].group_type = value as 'single' | 'double'
                        setHeroFormData(newFormData)
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Одиночный</SelectItem>
                        <SelectItem value="double">Двойной</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <EnhancedFileUpload
                  id={`hero-edit-file-${index}`}
                  label={item.file_type === 'video' ? 'Видео файл' : 'Изображение'}
                  accept={item.file_type === 'image' ? 'image/*' : 'video/*'}
                  fileType={item.file_type}
                  value={selectedFiles[index]}
                  onChange={(file) => handleEnhancedFileChange(index, file, true)}
                  onUploadProgress={(progress) => handleUploadProgress(`hero_edit_${index}`, progress)}
                  showPreview={true}
                />

                {/* Show current file info if exists and no new file selected */}
                {item.file_path && !selectedFiles[index] && (
                  <div className="text-sm text-gray-600 mt-2">
                    <span className="font-medium">Текущий файл:</span> {item.file_path}
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Тип файла:</Label>
                  <Select
                    value={item.file_type}
                    onValueChange={(value) => {
                      const newFormData = [...heroFormData]
                      newFormData[index].file_type = value as 'image' | 'video'
                      setHeroFormData(newFormData)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="image">Изображение</SelectItem>
                      <SelectItem value="video">Видео</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Alt текст:</Label>
                  <Input
                    value={item.alt_text}
                    onChange={(e) => {
                      const newFormData = [...heroFormData]
                      newFormData[index].alt_text = e.target.value
                      setHeroFormData(newFormData)
                    }}
                    placeholder="Описание изображения"
                  />
                </div>

                {item.file_type === 'video' && (
                  <div className="border-l-2 border-amber-300 pl-3 mt-4">
                    <EnhancedFileUpload
                      id={`hero-edit-poster-${index}`}
                      label="Постер для видео *"
                      accept="image/*"
                      fileType="image"
                      value={selectedFiles[`poster_${index}`]}
                      onChange={(file) => {
                        const posterKey = `poster_${index}`;
                        setSelectedFiles(prev => ({ ...prev, [posterKey]: file }));
                      }}
                      onUploadProgress={(progress) => handleUploadProgress(`hero_edit_poster_${index}`, progress)}
                      required={true}
                      showPreview={true}
                      className="border-amber-200"
                    />

                    {/* Show current poster image preview if exists and no new file selected */}
                    {item.poster_path && !selectedFiles[`poster_${index}`] && (
                      <div className="space-y-2 mt-3">
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Текущий постер:</span>
                        </div>
                        <div className="relative w-32 h-20 bg-gray-100 rounded-lg overflow-hidden">
                          <Image
                            src={normalizePath(item.poster_path)}
                            alt="Текущий постер"
                            fill
                            className="object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = `<div class="flex items-center justify-center w-full h-full text-xs text-gray-500">Превью недоступно</div>`;
                              }
                            }}
                          />
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.poster_path}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setHeroEditDialogOpen(false)
                setSelectedFiles({})
              }}
              disabled={saving}
              className="hover:cursor-pointer"
            >
              <X className="mr-2 h-4 w-4" />
              Отмена
            </Button>
            <Button
              onClick={handleSaveHeroGroup}
              disabled={saving}
              className="hover:cursor-pointer"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Сохранение...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Сохранить
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- ДИАЛОГИ ДЛЯ БЛОКОВ ---*/}
      <Dialog open={createBlockDialogOpen} onOpenChange={setCreateBlockDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Создание нового блока</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="block-title" className="text-right">Заголовок</Label><Input id="block-title" value={newBlockFormData.title} onChange={(e) => setNewBlockFormData(p => ({ ...p, title: e.target.value }))} className="col-span-3" /></div>
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="block-subtitle" className="text-right">Подзаголовок</Label><Input id="block-subtitle" value={newBlockFormData.subtitle} onChange={(e) => setNewBlockFormData(p => ({ ...p, subtitle: e.target.value }))} className="col-span-3" /></div>
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="block-content" className="text-right">Контент</Label><Textarea id="block-content" value={newBlockFormData.content} onChange={(e) => setNewBlockFormData(p => ({ ...p, content: e.target.value }))} className="col-span-3" /></div>
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="block-order" className="text-right">Порядок</Label><Input id="block-order" type="number" value={newBlockFormData.order} onChange={(e) => setNewBlockFormData(p => ({ ...p, order: parseInt(e.target.value) || 0 }))} className="col-span-3" /></div>
          </div>
          <DialogFooter>
            <Button className='hover:cursor-pointer' variant="outline" onClick={() => setCreateBlockDialogOpen(false)} disabled={saving}><X className="mr-2 h-4 w-4" />Отмена</Button>
            <Button className='hover:cursor-pointer' onClick={handleCreateBlock} disabled={saving}>{saving ? 'Создание...' : <><Save className="mr-2 h-4 w-4" />Создать</>}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={blockTextDialogOpen} onOpenChange={setBlockTextDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Редактирование блока #{blockToEditText?.order}</DialogTitle><DialogDescription>Измените текстовое содержимое блока.</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="block-title" className="text-right">Заголовок</Label><Input id="block-title" value={blockTextFormData.title} onChange={(e) => setBlockTextFormData(p => ({ ...p, title: e.target.value }))} className="col-span-3" /></div>
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="block-subtitle" className="text-right">Подзаголовок</Label><Input id="block-subtitle" value={blockTextFormData.subtitle} onChange={(e) => setBlockTextFormData(p => ({ ...p, subtitle: e.target.value }))} className="col-span-3" /></div>
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="block-content" className="text-right">Контент</Label><Textarea id="block-content" value={blockTextFormData.content} onChange={(e) => setBlockTextFormData(p => ({ ...p, content: e.target.value }))} className="col-span-3" /></div>
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="block-order" className="text-right">Порядок</Label><Input id="block-order" type="number" value={blockTextFormData.order} onChange={(e) => setBlockTextFormData(p => ({ ...p, order: parseInt(e.target.value) || 0 }))} className="col-span-3" /></div>
          </div>
          <DialogFooter>
            <Button className='hover:cursor-pointer' variant="outline" onClick={() => setBlockTextDialogOpen(false)} disabled={saving}><X className="mr-2 h-4 w-4" />Отмена</Button>
            <Button className='hover:cursor-pointer' onClick={handleSaveBlockText} disabled={saving}>{saving ? 'Сохранение...' : <><Save className="mr-2 h-4 w-4" />Сохранить</>}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* --- ДИАЛОГИ ДЛЯ МЕДИА БЛОКА ---*/}
      <Dialog open={blockMediaCreateOpen} onOpenChange={setBlockMediaCreateOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Добавление новой медиа-группы в блок</DialogTitle></DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Номер группы:</Label>
                <Input
                  type="number"
                  value={newBlockMediaFormData[0]?.group_id || ''}
                  onChange={(e) => {
                    const groupId = parseInt(e.target.value) || Date.now();
                    const updatedFormData = newBlockMediaFormData.map(item => ({
                      ...item,
                      group_id: groupId
                    }));
                    setNewBlockMediaFormData(updatedFormData);
                  }}
                  min="1"
                  placeholder="Номер группы"
                />
              </div>
              <div className="space-y-2">
                <Label>Тип группы:</Label>
                <Select value={newBlockMediaFormData[0]?.group_type || 'single'} onValueChange={(value) => handleNewBlockMediaTypeChange(value as 'single' | 'double')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Одиночный</SelectItem>
                    <SelectItem value="double">Двойной</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {newBlockMediaFormData.map((item, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <h4 className="font-medium">Элемент #{index + 1}</h4>
                <EnhancedFileUpload
                  id={`block-media-file-${index}`}
                  label={item.file_type === 'video' ? 'Видео файл' : 'Изображение'}
                  accept={item.file_type === 'image' ? 'image/*' : 'video/*'}
                  fileType={item.file_type}
                  value={newSelectedBlockMediaFiles[index]}
                  onChange={(file) => handleEnhancedNewFileChange(index, file, false)}
                  onUploadProgress={(progress) => handleUploadProgress(`new_block_${index}`, progress)}
                  required={true}
                  showPreview={true}
                />
                <div className="space-y-2"><Label>Тип файла:</Label><Select value={item.file_type} onValueChange={(value) => { const n = [...newBlockMediaFormData]; n[index].file_type = value as 'image' | 'video'; setNewBlockMediaFormData(n); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="image">Изображение</SelectItem><SelectItem value="video">Видео</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label>Alt текст:</Label><Input value={item.alt_text} onChange={(e) => { const n = [...newBlockMediaFormData]; n[index].alt_text = e.target.value; setNewBlockMediaFormData(n); }} placeholder="Описание медиа" /></div>
                {/* Only show poster upload for video type */}
                {item.file_type === 'video' && (
                  <div className="border-l-2 border-amber-300 pl-3 mt-4">
                    <EnhancedFileUpload
                      id={`block-media-poster-${index}`}
                      label="Постер для видео *"
                      accept="image/*"
                      fileType="image"
                      value={(newSelectedBlockMediaFiles as any)[`poster_${index}`]}
                      onChange={(file) => {
                        const posterKey = `poster_${index}`;
                        setNewSelectedBlockMediaFiles(prev => ({ ...prev, [posterKey]: file }));
                      }}
                      onUploadProgress={(progress) => handleUploadProgress(`new_block_poster_${index}`, progress)}
                      required={true}
                      showPreview={true}
                      className="border-amber-200"
                    />
                    <div className="text-sm text-amber-600 mt-2">
                      <span className="font-medium">Важно:</span> Загрузите изображение-постер для предпросмотра видео
                    </div>
                  </div>
                )}
                <div className="space-y-2"><Label>Порядок:</Label><Input type="number" value={item.order} onChange={(e) => { const n = [...newBlockMediaFormData]; n[index].order = parseInt(e.target.value) || 0; setNewBlockMediaFormData(n); }} /></div>
              </div>
            ))}
          </div>
          <DialogFooter><Button className='hover:cursor-pointer' variant="outline" onClick={() => setBlockMediaCreateOpen(false)} disabled={saving}>Отмена</Button><Button className='hover:cursor-pointer' onClick={() => handleSaveBlockMedia(true)} disabled={saving}>{saving ? 'Создание...' : 'Создать группу'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={blockMediaEditOpen} onOpenChange={setBlockMediaEditOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Редактирование медиа-группы</DialogTitle><DialogDescription>Группа #{selectedBlockMediaGroup?.id}</DialogDescription></DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Номер группы:</Label>
                <Input
                  type="number"
                  value={blockMediaFormData[0]?.group_id || ''}
                  onChange={(e) => {
                    const groupId = parseInt(e.target.value) || 1;
                    const updatedFormData = blockMediaFormData.map(item => ({
                      ...item,
                      group_id: groupId
                    }));
                    setBlockMediaFormData(updatedFormData);
                  }}
                  min="1"
                  placeholder="Номер группы"
                />
              </div>
              <div className="space-y-2">
                <Label>Тип группы:</Label>
                <Select
                  value={blockMediaFormData[0]?.group_type || 'single'}
                  onValueChange={(value) => {
                    const currentItems = [...blockMediaFormData];
                    const groupId = currentItems[0]?.group_id || 1;

                    // Обновляем тип группы для всех элементов
                    currentItems.forEach(item => item.group_type = value as 'single' | 'double');

                    if (value === 'single' && currentItems.length > 1) {
                      // Если меняем на одиночный и есть больше одного элемента, оставляем только первый
                      setBlockMediaFormData([currentItems[0]]);
                    } else if (value === 'double' && currentItems.length === 1) {
                      // Если меняем на двойной и есть только один элемент, добавляем второй
                      const secondItem: MediaFormData = {
                        group_id: groupId,
                        group_type: 'double',
                        file_type: 'image',
                        file_path: '',
                        alt_text: '',
                        poster_path: '',
                        order: currentItems[0].order + 1,
                      };
                      setBlockMediaFormData([...currentItems, secondItem]);
                    } else {
                      setBlockMediaFormData(currentItems);
                    }
                  }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Одиночный</SelectItem>
                    <SelectItem value="double">Двойной</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {blockMediaFormData.map((item, index) => (
              <div key={item.id || index} className="border rounded-lg p-4 space-y-4">
                <h4 className="font-medium">Элемент #{index + 1}</h4>

                {/* File Type Selection */}
                <div className="space-y-2">
                  <Label>Тип файла:</Label>
                  <Select
                    value={item.file_type}
                    onValueChange={(value) => handleBlockMediaFileTypeChange(index, value as 'image' | 'video')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="image">Изображение</SelectItem>
                      <SelectItem value="video">Видео</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* File Upload */}
                <div className="space-y-2">
                  <Label>Файл:</Label>
                  <Input
                    type="file"
                    accept={item.file_type === 'image' ? 'image/jpeg,image/png,image/gif,image/webp' : 'video/mp4,video/webm,video/ogg'}
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      if (file) {
                        // Enhanced real-time validation with detailed feedback
                        if (!validateFileSize(file, item.file_type)) {
                          const currentSize = formatFileSize(file.size);
                          const limit = getFileSizeLimit(item.file_type);
                          setError(`Файл "${file.name}" (${currentSize}) превышает максимальный размер ${limit} для ${item.file_type === 'image' ? 'изображений' : 'видео'}`);
                          e.target.value = '';
                          return;
                        }
                        if (item.file_type === 'image' && !validateImageFile(file)) {
                          setError(`Файл "${file.name}" не является допустимым изображением. Разрешены только форматы: jpg, jpeg, png, gif, webp`);
                          e.target.value = '';
                          return;
                        }
                        // Clear any previous errors on successful validation
                        setError(null);
                      }
                      setSelectedBlockMediaFiles(p => ({ ...p, [index]: file }));
                    }}
                    className="cursor-pointer"
                  />
                  <div className="text-xs text-gray-500">
                    Текущий: {item.file_path}
                  </div>
                  <div className="text-xs text-gray-500">
                    Максимальный размер: {getFileSizeLimit(item.file_type)}
                  </div>
                  {selectedBlockMediaFiles[index] && (
                    <div className="text-sm text-green-600">
                      <span className="font-medium">Выбран новый файл:</span> {selectedBlockMediaFiles[index]?.name} ({formatFileSize(selectedBlockMediaFiles[index]?.size || 0)})
                    </div>
                  )}
                </div>

                {/* Poster Upload for Videos */}
                {item.file_type === 'video' && (
                  <div className="space-y-2 border-l-2 border-amber-300 pl-3">
                    <Label className="flex items-center">
                      <span className="text-amber-600 mr-1">*</span>
                      Постер для видео:
                    </Label>
                    <Input
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        handleBlockPosterChange(index, file);
                        if (!file) {
                          e.target.value = '';
                        }
                      }}
                      className="cursor-pointer"
                    />
                    <div className="text-xs text-gray-500">
                      Максимальный размер: 2 MB. Разрешенные форматы: jpg, jpeg, png, gif, webp
                    </div>
                    {/* Show current poster if exists */}
                    {item.poster_path && !(selectedBlockMediaFiles as any)[`poster_${index}`] && (
                      <div className="text-sm text-blue-600">
                        <span className="font-medium">Текущий постер:</span> {item.poster_path}
                      </div>
                    )}
                    {/* Show preview of selected poster file */}
                    {(selectedBlockMediaFiles as any)[`poster_${index}`] && (
                      <div className="text-sm text-green-600">
                        <span className="font-medium">Выбран новый постер:</span> {(selectedBlockMediaFiles as any)[`poster_${index}`]?.name} ({formatFileSize((selectedBlockMediaFiles as any)[`poster_${index}`]?.size || 0)})
                      </div>
                    )}
                    {/* Show current poster image preview */}
                    {item.poster_path && (
                      <div className="mt-2 relative w-32 h-20">
                        <Image
                          src={normalizePath(item.poster_path)}
                          alt="Текущий постер"
                          fill
                          className="object-cover rounded border"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Alt текст:</Label>
                  <Input
                    value={item.alt_text}
                    onChange={(e) => {
                      const n = [...blockMediaFormData];
                      n[index].alt_text = e.target.value;
                      setBlockMediaFormData(n);
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Порядок:</Label>
                  <Input
                    type="number"
                    value={item.order}
                    onChange={(e) => {
                      const n = [...blockMediaFormData];
                      n[index].order = parseInt(e.target.value) || 0;
                      setBlockMediaFormData(n);
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <DialogFooter><Button className='hover:cursor-pointer' variant="outline" onClick={() => setBlockMediaEditOpen(false)} disabled={saving}>Отмена</Button><Button className='hover:cursor-pointer' onClick={() => handleSaveBlockMedia(false)} disabled={saving}>{saving ? 'Сохранение...' : 'Сохранить'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={blockMediaDeleteOpen} onOpenChange={setBlockMediaDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Вы уверены?</AlertDialogTitle><AlertDialogDescription>Это действие необратимо удалит медиа-группу из блока.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel disabled={saving}>Отмена</AlertDialogCancel><AlertDialogAction onClick={handleDeleteBlockMedia} disabled={saving} className="bg-red-600 hover:bg-red-700">{saving ? 'Удаление...' : 'Удалить'}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog для подтверждения удаления блока */}
      <AlertDialog open={blockDeleteDialogOpen} onOpenChange={setBlockDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие необратимо удалит блок и все связанные с ним медиа-файлы.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBlock}
              disabled={saving}
              className="bg-red-600 hover:bg-red-700"
            >
              {saving ? 'Удаление...' : 'Удалить'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Блоки проекта */}
      <div className="px-6 mb-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div><CardTitle>Блоки проекта</CardTitle><CardDescription>Контентные блоки для страницы проекта</CardDescription></div>
              <Button className='hover:cursor-pointer' variant="outline" onClick={handleOpenCreateBlockDialog} disabled={!projectDetail}><PlusCircle className="mr-2 h-4 w-4" /> Добавить Блок</Button>
            </div>
          </CardHeader>
          <CardContent>
            {projectDetail?.blocks && projectDetail.blocks.length > 0 ? (
              <div className="space-y-6">
                {projectDetail.blocks.map((block) => (
                  <Card key={block.id} className="p-4 bg-slate-50">
                    <CardHeader>
                      <div className="flex justify-between items-start gap-4">
                        <div><CardTitle>Блок #{block.order}: {block.title}</CardTitle>{block.subtitle && <CardDescription>{block.subtitle}</CardDescription>}<p className="text-sm mt-2 text-gray-600 max-w-prose">{block.content.length > 150 ? `${block.content.substring(0, 150)}...` : block.content}</p></div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleOpenEditBlockTextDialog(block)} className="flex-shrink-0 hover:cursor-pointer"><SquarePen className="mr-2 h-4 w-4" /> Редактировать текст</Button>
                          <Button variant="destructive" size="sm" onClick={() => handleOpenDeleteBlockDialog(block)} className="flex-shrink-0 hover:cursor-pointer"><Trash2 className="mr-2 h-4 w-4" /> Удалить</Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center mt-4 border-t pt-4"><h4 className="font-semibold">Медиа-элементы</h4><Button className='hover:cursor-pointer' variant="outline" onClick={() => handleOpenCreateBlockMediaDialog(block.id)}><PlusCircle className="mr-2 h-4 w-4" /> Добавить медиа-группу</Button></div>
                      {groupBlockMediaItems(block.mediaItems)?.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                          {groupBlockMediaItems(block.mediaItems).map((group: any) => (
                            <div key={group.id} className="border rounded-lg p-4 flex flex-col bg-white">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2"><Badge variant={group.type === 'single' ? 'default' : 'secondary'}>{group.type === 'single' ? 'Одиночный' : 'Двойной'}</Badge></div>
                                <div className="flex items-center gap-2">
                                  <Button className='hover:cursor-pointer' variant="outline" size="sm" onClick={() => handleOpenEditBlockMediaDialog(group, block.id)}><SquarePen className="h-4 w-4" /></Button>
                                  <Button className='hover:cursor-pointer' variant="destructive" size="sm" onClick={() => handleOpenDeleteBlockMediaDialog(group, block.id)}><Trash2 className="h-4 w-4" /></Button>
                                </div>
                              </div>
                              <div className={`grid gap-3 ${group.type === 'double' ? 'grid-cols-2' : 'grid-cols-1'} flex-grow`}>
                                {group.items && group.items.length > 0 ? group.items.map((item: any, index: number) => (
                                  <div key={index} className="relative bg-gray-100 rounded-lg overflow-hidden aspect-video">
                                    {item.type === 'image' ? (
                                      <Image
                                        src={item.src}
                                        alt={item.alt || ''}
                                        fill
                                        className="object-cover"
                                        onError={(e) => {
                                          console.error('Ошибка загрузки изображения:', item.src);
                                          e.currentTarget.style.display = 'none';
                                        }}
                                      />
                                    ) : (
                                      <video
                                        src={item.src}
                                        poster={item.poster}
                                        className="w-full h-full object-cover"
                                        controls={false}
                                        onError={(_e) => {
                                          console.error('Ошибка загрузки видео:', item.src);
                                        }}
                                      />
                                    )}
                                    {item.alt && <p className="text-xs p-2 bg-black/50 text-white absolute bottom-0 w-full">{item.alt}</p>}
                                  </div>
                                )) : (
                                  <div className="col-span-full text-center py-4 text-gray-500">
                                    <p>Медиа-элементы не найдены в группе #{group.id} (тип: {group.type})</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (<div className="text-center py-8 text-gray-500 mt-4"><ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" /><p>Медиа-элементы не добавлены в этот блок.</p></div>)}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (<div className="text-center py-8 text-gray-500"><ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" /><p>Блоки проекта не найдены</p><Button variant="outline" className="mt-4" onClick={handleOpenCreateBlockDialog}>Создать первый блок</Button></div>)}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProjectDetailPage;