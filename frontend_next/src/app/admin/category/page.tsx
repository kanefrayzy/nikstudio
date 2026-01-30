"use client"

import { useState, useEffect } from "react"

// Принудительно делаем страницу динамической для продакшн сборки
export const dynamic = 'force-dynamic'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { PlusCircle, SquarePen, Trash2, ChevronUp, ChevronDown } from "lucide-react"
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { post, put, del } from '@/lib/api'
import { useCategories, ProjectCategory } from '@/hooks/useCategories'

// Компонент для создания категории
const CreateCategoryDialog = ({ onUpdate }: { onUpdate: () => Promise<void> }) => {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (!name.trim()) {
        throw new Error("Название категории обязательно для заполнения")
      }

      const result = await post<{ status: string; message?: string }>('/api/project-categories', {
        name: name.trim(),
      });

      if (result?.status === "success") {
        setOpen(false)
        setName('')
        onUpdate()
        toast.success("Категория успешно создана")
      } else {
        toast.error(`Ошибка: ${result?.message || "Не удалось создать категорию"}`)
      }
    } catch (error: any) {
      console.error("Ошибка при создании категории:", error)
      const errorMessage = error.response?.data?.message || error.message || 'Неизвестная ошибка';
      toast.error(`Произошла ошибка: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="hover:cursor-pointer"
      >
        <PlusCircle className="mr-2 h-4 w-4" />
        Добавить категорию
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Создать новую категорию</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="categoryName">Название категории *</Label>
              <Input
                id="categoryName"
                value={name}
                className="mt-2"
                onChange={(e) => setName(e.target.value)}
                placeholder="Введите название категории"
                required
              />
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                className="hover:cursor-pointer"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Отмена
              </Button>
              <Button 
                type="submit"
                className="hover:cursor-pointer" 
                disabled={isLoading || !name.trim()}
              >
                {isLoading ? 'Создание...' : 'Создать категорию'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Компонент для редактирования категории
const EditCategoryDialog = ({ category, onUpdate }: { category: ProjectCategory; onUpdate: () => Promise<void> }) => {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [name, setName] = useState(category.name)
  
    // Сброс имени при изменении категории
    useEffect(() => {
      setName(category.name)
    }, [category.name])
  
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      setIsLoading(true)
  
      try {
        if (!name.trim()) {
          throw new Error("Название категории обязательно для заполнения")
        }
  
        if (!category.id) {
          throw new Error("ID категории не найден")
        }
  
        console.log('Обновление категории:', { id: category.id, name: name.trim() })
  
        const result = await put<{ status: string; message?: string }>(`/api/project-categories/${category.id}`, {
          name: name.trim(),
        });
  
        console.log('Результат обновления:', result)
  
        if (result?.status === "success") {
          setOpen(false)
          onUpdate()
          toast.success("Категория успешно обновлена")
        } else {
          const errorMessage = result?.message || "Не удалось обновить категорию"
          console.error('Ошибка API:', errorMessage)
          toast.error(`Ошибка: ${errorMessage}`)
        }
      } catch (error: any) {
        console.error("Ошибка при обновлении категории:", error)
        
        // Обработка ошибок валидации
        if (error.response?.data?.errors) {
          const validationErrors = Object.values(error.response.data.errors).flat();
          toast.error(`Ошибки валидации: ${validationErrors.join(', ')}`);
        } else {
          const errorMessage = error.response?.data?.message || error.message || 'Неизвестная ошибка';
          toast.error(`Произошла ошибка: ${errorMessage}`);
        }
      } finally {
        setIsLoading(false)
      }
    }
  
    return (
      <>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          className="hover:cursor-pointer"
        >
          <SquarePen className="h-4 w-4" />
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Редактировать категорию</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="editCategoryName">Название категории *</Label>
                <Input
                  id="editCategoryName"
                  value={name}
                  className="mt-2"
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Введите название категории"
                  required
                />
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="hover:cursor-pointer"
                  onClick={() => setOpen(false)}
                  disabled={isLoading}
                >
                  Отмена
                </Button>
                <Button 
                  type="submit"
                  className="hover:cursor-pointer" 
                  disabled={isLoading || !name.trim()}
                >
                  {isLoading ? 'Обновление...' : 'Обновить категорию'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </>
    )
  }

// Компонент для удаления категории
const DeleteCategoryDialog = ({ category, onDelete }: { category: ProjectCategory; onDelete: () => Promise<void> }) => {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      if (!category.id) {
        throw new Error("ID категории не найден")
      }

      const result = await del<{ status: string; message?: string }>(`/api/project-categories/${category.id}`);

      if (result?.status === "success") {
        onDelete()
        toast.success("Категория успешно удалена")
      } else {
        toast.error(`Ошибка: ${result?.message || "Не удалось удалить категорию"}`)
      }
    } catch (error: any) {
      console.error("Ошибка при удалении категории:", error)
      const errorMessage = error.response?.data?.message || error.message || 'Неизвестная ошибка';
      toast.error(`Произошла ошибка: ${errorMessage}`)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          size="sm"
          disabled={isDeleting}
          className="hover:cursor-pointer"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Удалить категорию?</AlertDialogTitle>
          <AlertDialogDescription>
            Удалить категорию &quot;{category.name}&quot;? Это действие нельзя отменить.
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
  )
}

export default function ProjectCategoriesPage() {
  // Используем SWR hook для кэширования категорий
  const { categories, isLoading: loading, isError, mutate } = useCategories()
  const [error, setError] = useState<string | null>(null)

  // Обновляем локальную ошибку при изменении isError
  useEffect(() => {
    if (isError) {
      setError('Ошибка при загрузке категорий')
    } else {
      setError(null)
    }
  }, [isError])

  // Функция для обновления данных после изменений
  const fetchCategories = async () => {
    await mutate()
  }

  // Функция для обновления порядка сортировки
  const updateSortOrder = async (categoryId: number, newOrder: number) => {
    try {
      const result = await put<{ status: string; message?: string }>(`/api/project-categories/${categoryId}/sort-order`, {
        sort_order: newOrder,
      });
      
      if (result?.status === "success") {
        fetchCategories() // Перезагружаем список
        toast.success("Порядок категорий обновлен")
      } else {
        toast.error(`Ошибка: ${result?.message || "Не удалось обновить порядок"}`)
      }
    } catch (error: any) {
      console.error("Ошибка при обновлении порядка:", error)
      const errorMessage = error.response?.data?.message || error.message || 'Неизвестная ошибка';
      toast.error(`Произошла ошибка: ${errorMessage}`)
    }
  }

  // Функция для перемещения категории вверх
  const moveCategoryUp = async (index: number) => {
    if (index === 0) return

    const currentCategory = categories[index]
    const previousCategory = categories[index - 1]

    // Меняем местами sort_order
    const currentOrder = currentCategory.sort_order ?? index
    const previousOrder = previousCategory.sort_order ?? (index - 1)

    await updateSortOrder(currentCategory.id, previousOrder)
    await updateSortOrder(previousCategory.id, currentOrder)
  }

  // Функция для перемещения категории вниз
  const moveCategoryDown = async (index: number) => {
    if (index === categories.length - 1) return

    const currentCategory = categories[index]
    const nextCategory = categories[index + 1]

    // Меняем местами sort_order
    const currentOrder = currentCategory.sort_order ?? index
    const nextOrder = nextCategory.sort_order ?? (index + 1)

    await updateSortOrder(currentCategory.id, nextOrder)
    await updateSortOrder(nextCategory.id, currentOrder)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen w-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка категорий...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={fetchCategories}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Повторить попытку
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full p-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Категории проектов</h1>
          <p className="mt-2">
            Управление категориями проектов - создание, редактирование и удаление категорий
          </p>
        </div>
        <CreateCategoryDialog onUpdate={fetchCategories} />
      </div>

      {/* Основной контент */}
      <div className="space-y-6">
        {categories && categories.length > 0 ? (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">
                Всего категорий: {categories.length}
              </h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categories.map((category, index) => (
                  <div key={category.id} className="flex items-center justify-between p-4 border rounded-lg bg-white shadow-sm">
                    <div className="flex items-center gap-3">
                      {/* Кнопки для перемещения */}
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveCategoryUp(index)}
                          disabled={index === 0}
                          className="h-6 w-6 p-0 hover:cursor-pointer"
                        >
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveCategoryDown(index)}
                          disabled={index === categories.length - 1}
                          className="h-6 w-6 p-0 hover:cursor-pointer"
                        >
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      {/* Номер позиции */}
                      <div className="text-sm font-mono text-gray-400 w-6 text-center">
                        {index + 1}
                      </div>
                      
                      {/* Информация о категории */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary" className="text-sm">
                            {category.name}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            slug: {category.slug}
                          </span>
                          <span className="text-sm text-gray-400">
                            ID: {category.id}
                          </span>
                          {category.sort_order && (
                            <span className="text-sm text-gray-400">
                              order: {category.sort_order}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Кнопки управления */}
                    <div className="flex gap-2">
                      <EditCategoryDialog category={category} onUpdate={fetchCategories} />
                      <DeleteCategoryDialog category={category} onDelete={fetchCategories} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">Категории не найдены</p>
            <div className="flex justify-center gap-4">
              <CreateCategoryDialog onUpdate={fetchCategories} />
              <Button 
                variant="outline"
                onClick={fetchCategories}
                className="hover:cursor-pointer"
              >
                Обновить список
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}