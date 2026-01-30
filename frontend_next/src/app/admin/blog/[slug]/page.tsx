"use client"

import { useState, useEffect, useCallback } from "react"

// Принудительно делаем страницу динамической для продакшн сборки
export const dynamic = 'force-dynamic'
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ArrowLeft, Trash2, PlusCircle, SquarePen } from "lucide-react"
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import apiClient from "@/lib/api"

interface Block {
  id: number
  title: string
  paragraph_1: string
  paragraph_2?: string
  paragraph_3?: string
}

interface BlogPost {
  id: number
  title: string
  description: string
  image: string
  position: string
  created_at: string
  updated_at: string
  slug: string
  status: boolean | number | string
  blocks?: Block[]
}

interface ApiResponse {
  status: string
  data: BlogPost
  message?: string
}

// const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/api`

// Функция для формирования корректного URL изображения
function getImageUrl(imagePath: string | null): string {
  if (!imagePath) return ''
  
  if (imagePath.startsWith('http')) {
    return imagePath
  }
  
  if (imagePath.startsWith('/storage/')) {
    return `${process.env.NEXT_PUBLIC_API_URL}${imagePath}`
  }
  
  if (imagePath.startsWith('/images/')) {
    return imagePath
  }
  
  return `${process.env.NEXT_PUBLIC_API_URL}/storage/blog/${imagePath}`
}

// Компонент для редактирования блока
const EditBlockDialog = ({ block, onUpdate }: { block: Block; onUpdate: () => void }) => {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [title, setTitle] = useState(block.title)
  const [paragraph1, setParagraph1] = useState(block.paragraph_1)
  const [paragraph2, setParagraph2] = useState(block.paragraph_2 || '')
  const [paragraph3, setParagraph3] = useState(block.paragraph_3 || '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (!title.trim() || !paragraph1.trim()) {
        throw new Error("Заголовок и первый параграф обязательны для заполнения")
      }

      const response = await apiClient.put<{ status: string; message?: string }>(`/api/blog-posts/blocks/${block.id}`, {
        title: title.trim(),
        paragraph_1: paragraph1.trim(),
        paragraph_2: paragraph2.trim() || null,
        paragraph_3: paragraph3.trim() || null,
      });

      const result = response.data;

      if (result?.status === "success") {
        setOpen(false)
        onUpdate()
        toast("Блок успешно обновлён")
      } else {
        toast(`Ошибка: ${result?.message || "Не удалось обновить блок"}`)
      }
    } catch (error) {
      console.error("Ошибка при обновлении блока:", error)
      toast(`Произошла ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
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
            <DialogTitle>Редактировать блок</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="editTitle">Заголовок блока *</Label>
              <Input
                id="editTitle"
                value={title}
                className="mt-2"
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Введите заголовок блока"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="editParagraph1">Первый параграф *</Label>
              <textarea
                id="editParagraph1"
                value={paragraph1}
                onChange={(e) => setParagraph1(e.target.value)}
                placeholder="Введите содержимое первого параграфа"
                className="w-full p-3 border border-gray-300 rounded-md resize-y min-h-[100px] mt-2"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="editParagraph2">Второй параграф (необязательно)</Label>
              <textarea
                id="editParagraph2"
                value={paragraph2}
                onChange={(e) => setParagraph2(e.target.value)}
                placeholder="Введите содержимое второго параграфа"
                className="w-full p-3 border border-gray-300 rounded-md resize-y min-h-[100px] mt-2"
              />
            </div>
            
            <div>
              <Label htmlFor="editParagraph3">Третий параграф (необязательно)</Label>
              <textarea
                id="editParagraph3"
                value={paragraph3}
                onChange={(e) => setParagraph3(e.target.value)}
                placeholder="Введите содержимое третьего параграфа"
                className="w-full p-3 border border-gray-300 rounded-md resize-y min-h-[100px] mt-2"
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
                disabled={isLoading || !title.trim() || !paragraph1.trim()}
              >
                {isLoading ? 'Обновление...' : 'Обновить блок'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Компонент для удаления блока
const DeleteBlockDialog = ({ block, onDelete }: { block: Block; onDelete: () => void }) => {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await apiClient.delete<{ status: string; message?: string }>(`/api/blog-posts/blocks/${block.id}`);
      const result = response.data;

      if (result?.status === "success") {
        onDelete()
        toast("Блок успешно удалён")
      } else {
        toast(`Ошибка: ${result?.message || "Не удалось удалить блок"}`)
      }
    } catch (error) {
      console.error("Ошибка при удалении блока:", error)
      toast(`Произошла ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
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
          <AlertDialogTitle>Удалить блок?</AlertDialogTitle>
          <AlertDialogDescription>
            Удалить блок &quot;{block.title}&quot;? Это действие нельзя отменить.
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

export default function BlogPostViewPage() {
  const params = useParams()
  const router = useRouter()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const postSlug = params.slug as string

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [blockTitle, setBlockTitle] = useState('')
  const [blockParagraph1, setBlockParagraph1] = useState('')
  const [blockParagraph2, setBlockParagraph2] = useState('')
  const [blockParagraph3, setBlockParagraph3] = useState('')
  const [isCreatingBlock, setIsCreatingBlock] = useState(false)

  const fetchPost = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await apiClient.get<ApiResponse>(`/api/blog-posts/${postSlug}`);
      const data = response.data;

      if (data.status === 'success' && data.data) {
        const postWithCorrectImage: BlogPost = {
          ...data.data,
          image: getImageUrl(data.data.image)
        }
        setPost(postWithCorrectImage)
      } else {
        throw new Error(data.message || 'Не удалось загрузить пост')
      }
    } catch (err) {
      console.error('Ошибка при загрузке поста:', err)
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
    } finally {
      setLoading(false)
    }
  }, [postSlug])

  const handleCreateBlock = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreatingBlock(true)
    
    try {
      console.log('Создание блока для поста:', post?.slug)
      console.log('Данные блока:', {
        title: blockTitle,
        paragraph_1: blockParagraph1,
        paragraph_2: blockParagraph2,
        paragraph_3: blockParagraph3
      })

      const response = await apiClient.post(`/api/blog-posts/${post?.slug}/blocks`, {
        title: blockTitle,
        paragraph_1: blockParagraph1,
        paragraph_2: blockParagraph2 || null,
        paragraph_3: blockParagraph3 || null
      });

      const result = response.data;

      console.log('Результат создания блока:', result)

      // Обновляем пост после успешного создания
      await fetchPost()
      
      // Очищаем форму
      setIsDialogOpen(false)
      setBlockTitle('')
      setBlockParagraph1('')
      setBlockParagraph2('')
      setBlockParagraph3('')
      
      toast.success('Блок успешно добавлен')
      
    } catch (error) {
      console.error('Ошибка при создании блока:', error)
      toast.error(error instanceof Error ? error.message : 'Неизвестная ошибка')
    } finally {
      setIsCreatingBlock(false)
    }
  }

  useEffect(() => {
    fetchPost()
  }, [fetchPost])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen w-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка поста...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => router.push('/admin/blog')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Вернуться к списку
          </Button>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Пост не найден</p>
          <Button onClick={() => router.push('/admin/blog')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Вернуться к списку
          </Button>
        </div>
      </div>
    )
  }

  return (
    
    <div className="w-full min-h-screen">      
      <div className="p-6">
        <h1 className="text-2xl font-bold">Управление блоками статьи</h1>
        <p className="mt-2">Здесь вы можете просматривать блоки и управлять ими - создавать, редактировать и удалять</p>
      </div>
      <div className="flex items-center justify-between mb-6 px-6">
        <Button 
          variant="outline" 
          onClick={() => router.push('/admin/blog')}
          className="hover:cursor-pointer"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Вернуться к списку
        </Button>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsDialogOpen(true)}
            className="hover:cursor-pointer"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Добавить блок
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger />
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Добавить блок</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateBlock} className="space-y-4">
                <div>
                  <Label htmlFor="blockTitle">Заголовок блока *</Label>
                  <Input
                    id="blockTitle"
                    value={blockTitle}
                    className="mt-2"
                    onChange={(e) => setBlockTitle(e.target.value)}
                    placeholder="Введите заголовок блока"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="blockParagraph1">Первый параграф *</Label>
                  <textarea
                    id="blockParagraph1"
                    value={blockParagraph1}
                    onChange={(e) => setBlockParagraph1(e.target.value)}
                    placeholder="Введите содержимое первого параграфа"
                    className="w-full p-3 border border-gray-300 rounded-md resize-y min-h-[100px] mt-2"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="blockParagraph2">Второй параграф (необязательно)</Label>
                  <textarea
                    id="blockParagraph2"
                    value={blockParagraph2}
                    onChange={(e) => setBlockParagraph2(e.target.value)}
                    placeholder="Введите содержимое второго параграфа"
                    className="w-full p-3 border border-gray-300 rounded-md resize-y min-h-[100px] mt-2"
                  />
                </div>
                
                <div>
                  <Label htmlFor="blockParagraph3">Третий параграф (необязательно)</Label>
                  <textarea
                    id="blockParagraph3"
                    value={blockParagraph3}
                    onChange={(e) => setBlockParagraph3(e.target.value)}
                    placeholder="Введите содержимое третьего параграфа"
                    className="w-full p-3 border border-gray-300 rounded-md resize-y min-h-[100px] mt-2"
                  />
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="hover:cursor-pointer"
                    onClick={() => setIsDialogOpen(false)}
                    disabled={isCreatingBlock}
                  >
                    Отмена
                  </Button>
                  <Button 
                    type="submit"
                    className="hover:cursor-pointer" 
                    disabled={isCreatingBlock || !blockTitle.trim() || !blockParagraph1.trim()}
                  >
                    {isCreatingBlock ? 'Создание...' : 'Создать блок'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          
          
        </div>
      </div>

      {/* Основной контент */}
      <div className="space-y-6 px-6">
        {/* Карточка с основной информацией */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold mb-3">Блоки</h3>            
          </CardHeader>
          <CardContent className="space-y-6">
            {post.blocks && post.blocks.length > 0 ? (
              <div>                
                <div className="space-y-6">
                  {post.blocks.map((block) => (
                    <div key={block.id} className="p-4 border rounded-lg bg-white shadow-sm space-y-2">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{block.title}</h4>
                        <div className="flex gap-2">
                          <EditBlockDialog block={block} onUpdate={fetchPost} />
                          <DeleteBlockDialog block={block} onDelete={fetchPost} />
                        </div>
                      </div>
                      {block.paragraph_1 && (
                        <p className="text-gray-800 whitespace-pre-wrap">{block.paragraph_1}</p>
                      )}
                      {block.paragraph_2 && (
                        <p className="text-gray-800 whitespace-pre-wrap">{block.paragraph_2}</p>
                      )}
                      {block.paragraph_3 && (
                        <p className="text-gray-800 whitespace-pre-wrap">{block.paragraph_3}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Блоков пока нет</p>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(true)}
                  className="mt-2 hover:cursor-pointer"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Добавить первый блок
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
    
  )
}