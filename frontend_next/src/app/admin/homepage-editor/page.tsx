"use client"

import { useState, useEffect, useCallback } from "react"
import dynamicImport from 'next/dynamic'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { Video, Loader2 } from "lucide-react"
import { 
  getHomepageContent, 
  updateHomepageContent,
  type HomepageContent,
  type HomepageContentBySections 
} from "@/lib/homepage-content"
import { HeroSectionEditor } from "@/components/admin/HeroSectionEditor"
import { MainContentSectionEditor } from "@/components/admin/MainContentSectionEditor"
import { ServicesSectionEditor } from "@/components/admin/ServicesSectionEditor"
import { TestimonialsSectionEditor } from "@/components/admin/TestimonialsSectionEditor"

// Принудительно делаем страницу динамической для продакшн сборки
export const dynamic = 'force-dynamic'

// Lazy load video management components
const AdminHeroVideoManager = dynamicImport(
  () => import("@/components/admin/AdminHeroVideoManager").then(mod => ({ default: mod.AdminHeroVideoManager })),
  {
    loading: () => (
      <div className="flex items-center justify-center p-8 border rounded-lg">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    ),
    ssr: false
  }
);

const ServiceVideoManager = dynamicImport(
  () => import("@/components/admin/ServiceVideoManager").then(mod => ({ default: mod.ServiceVideoManager })),
  {
    loading: () => (
      <div className="flex items-center justify-center p-8 border rounded-lg">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    ),
    ssr: false
  }
);

export default function HomepageEditorPage() {
  const [activeTab, setActiveTab] = useState<string>("hero")
  const [content, setContent] = useState<HomepageContentBySections | null>(null)
  const [originalContent, setOriginalContent] = useState<HomepageContentBySections | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Загрузка контента при монтировании компонента
  const fetchContent = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await getHomepageContent()
      
      if (data) {
        setContent(data)
        setOriginalContent(JSON.parse(JSON.stringify(data))) // Deep clone
      } else {
        toast.error("Не удалось загрузить контент")
      }
    } catch (error) {
      console.error("Ошибка при загрузке контента:", error)
      toast.error("Произошла ошибка при загрузке контента")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchContent()
  }, [fetchContent])

  // Проверка наличия изменений
  useEffect(() => {
    if (!content || !originalContent) {
      setHasChanges(false)
      return
    }

    const hasChanged = JSON.stringify(content) !== JSON.stringify(originalContent)
    setHasChanges(hasChanged)
  }, [content, originalContent])

  // Обработчик сохранения изменений
  const handleSave = async () => {
    if (!content || !hasChanges) return

    setIsSaving(true)

    try {
      // Собираем все измененные элементы
      const changedItems: Partial<HomepageContent>[] = []

      Object.keys(content).forEach((section) => {
        const sectionContent = content[section]
        const originalSectionContent = originalContent?.[section]

        if (sectionContent && Array.isArray(sectionContent)) {
          sectionContent.forEach((item) => {
            const originalItem = originalSectionContent?.find(
              (orig) => orig.id === item.id
            )

            // Если элемент изменился, добавляем его в список
            if (
              !originalItem ||
              originalItem.content_value !== item.content_value
            ) {
              changedItems.push({
                id: item.id,
                section: item.section,
                content_key: item.content_key,
                content_value: item.content_value,
                content_type: item.content_type,
              })
            }
          })
        }
      })

      if (changedItems.length === 0) {
        toast.info("Нет изменений для сохранения")
        return
      }

      // Отправляем изменения на сервер
      await updateHomepageContent(changedItems)

      // Обновляем оригинальный контент
      setOriginalContent(JSON.parse(JSON.stringify(content)))
      setHasChanges(false)

      toast.success("Изменения успешно сохранены")

      // Автоматически скрыть уведомление через 3 секунды
      setTimeout(() => {
        // Toast автоматически исчезнет
      }, 3000)
    } catch (error) {
      console.error("Ошибка при сохранении:", error)
      const errorMessage =
        error instanceof Error ? error.message : "Произошла неизвестная ошибка"
      toast.error(`Ошибка сохранения: ${errorMessage}`)
    } finally {
      setIsSaving(false)
    }
  }

  // Обработчик отмены изменений
  const handleCancel = () => {
    if (!originalContent) return

    setContent(JSON.parse(JSON.stringify(originalContent)))
    setHasChanges(false)
    toast.info("Изменения отменены")
  }

  // Обработчик изменения контента
  const handleContentChange = (section: string, key: string, value: string) => {
    if (!content) return

    setContent((prevContent) => {
      if (!prevContent) return prevContent

      const sectionContent = prevContent[section] || []
      const updatedSectionContent = [...sectionContent]

      // Найти элемент с данным ключом
      const itemIndex = updatedSectionContent.findIndex(
        (item) => item.content_key === key
      )

      if (itemIndex !== -1) {
        // Обновить существующий элемент
        updatedSectionContent[itemIndex] = {
          ...updatedSectionContent[itemIndex],
          content_value: value,
        }
      } else {
        // Создать новый элемент (если его еще нет)
        updatedSectionContent.push({
          id: 0, // Временный ID, будет присвоен сервером
          section,
          content_key: key,
          content_value: value,
          content_type: key.includes('image') || key.includes('logo') || key.includes('photo') ? 'image' : 'text',
          order_index: updatedSectionContent.length,
        })
      }

      return {
        ...prevContent,
        [section]: updatedSectionContent,
      }
    })
  }

  if (isLoading) {
    return (
      <div className="w-full p-6">
        {/* Заголовок */}
        <div className="mb-6">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>

        {/* Основной контент с табами */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            {/* Tabs skeleton */}
            <div className="mb-6">
              <div className="grid w-full grid-cols-4 gap-2 mb-6">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>

            {/* Content skeleton */}
            <div className="space-y-6">
              <div className="space-y-4">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-24 w-full" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-24 w-full" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-32 w-full" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-5 w-32" />
                <div className="flex gap-4">
                  <Skeleton className="h-48 w-48" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Кнопки действий skeleton */}
        <div className="mt-6 flex gap-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    )
  }

  if (!content) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">Не удалось загрузить контент</p>
          <Button onClick={fetchContent} className="hover:cursor-pointer">
            Повторить попытку
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full p-6">
      {/* Заголовок */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Редактор главной страницы</h1>
        <p className="mt-2 text-gray-600">
          Управление контентом главной страницы - текст, изображения и медиа
        </p>
      </div>

      {/* Управление видео */}
      <div className="space-y-8 mb-8">
        {/* Hero Video Management */}
        <div className="border-t pt-8">
          <div className="flex items-center gap-3 mb-6">
            <Video className="w-6 h-6 text-red-600" />
            <div>
              <h2 className="text-2xl font-semibold">Управление главным видео</h2>
              <p className="text-gray-600">Настройка видео для главной страницы сайта</p>
            </div>
          </div>
          
          <AdminHeroVideoManager />
        </div>

        {/* Service Video Management */}
        <div className="border-t pt-8">
          <div className="flex items-center gap-3 mb-6">
            <Video className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-2xl font-semibold">Управление видео услуг</h2>
              <p className="text-gray-600">Настройка видео для секции услуг</p>
            </div>
          </div>
          
          <ServiceVideoManager />
        </div>
      </div>

      {/* Индикатор несохраненных изменений */}
      {hasChanges && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm font-medium">
            ⚠️ У вас есть несохраненные изменения
          </p>
        </div>
      )}

      {/* Основной контент с табами */}
      <Card>
        <CardHeader>
          <CardTitle>Редактирование секций</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="hero">Hero</TabsTrigger>
              <TabsTrigger value="main_content">Контент</TabsTrigger>
              <TabsTrigger value="services">Услуги</TabsTrigger>
              <TabsTrigger value="testimonials">Отзывы</TabsTrigger>
            </TabsList>

            <TabsContent value="hero" className="mt-6">
              <HeroSectionEditor
                content={content.hero || []}
                onChange={(key, value) => handleContentChange('hero', key, value)}
              />
            </TabsContent>

            <TabsContent value="main_content" className="mt-6">
              <MainContentSectionEditor
                content={content.main_content || []}
                onChange={(key, value) => handleContentChange('main_content', key, value)}
              />
            </TabsContent>

            <TabsContent value="services" className="mt-6">
              <ServicesSectionEditor
                content={{
                  services_1: content.services_1 || [],
                  services_2: content.services_2 || [],
                  services_3: content.services_3 || [],
                  services_4: content.services_4 || [],
                  services_5: content.services_5 || [],
                  services_6: content.services_6 || [],
                  services_7: content.services_7 || [],
                }}
                onChange={(section, key, value) => handleContentChange(section, key, value)}
              />
            </TabsContent>

            <TabsContent value="testimonials" className="mt-6">
              <TestimonialsSectionEditor
                content={{
                  testimonials_1: content.testimonials_1 || [],
                  testimonials_2: content.testimonials_2 || [],
                  testimonials_3: content.testimonials_3 || [],
                  testimonials_4: content.testimonials_4 || [],
                  testimonials_5: content.testimonials_5 || [],
                  testimonials_6: content.testimonials_6 || [],
                }}
                onChange={(section, key, value) => handleContentChange(section, key, value)}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Кнопки действий */}
      <div className="mt-6 flex gap-4">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="hover:cursor-pointer"
        >
          {isSaving ? "Сохранение..." : "Сохранить изменения"}
        </Button>
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={!hasChanges || isSaving}
          className="hover:cursor-pointer"
        >
          Отменить
        </Button>
      </div>
    </div>
  )
}
