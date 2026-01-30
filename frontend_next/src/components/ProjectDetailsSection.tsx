"use client"

import React, { useState } from 'react';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { SquarePen, Save, X, AlertCircle, PlusCircle } from "lucide-react"

interface EditFormData {
  title: string;
  subtitle: string;
  client: string;
  year: number;
}

interface ProjectDetail {
  id: number;
  project_id?: number;
  title: string;
  subtitle: string;
  client: string;
  year: number;
}

interface ProjectDetailsSectionProps {
  projectDetail: ProjectDetail | null;
  loading: boolean;
  onSave: (formData: EditFormData) => Promise<void>;
  onCreate: (formData: EditFormData) => Promise<void>;
  saving: boolean;
}

const ProjectDetailsSection: React.FC<ProjectDetailsSectionProps> = ({
  projectDetail,
  loading,
  onSave,
  onCreate,
  saving
}) => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<EditFormData>({
    title: projectDetail?.title || '',
    subtitle: projectDetail?.subtitle || '',
    client: projectDetail?.client || '',
    year: projectDetail?.year || new Date().getFullYear()
  });

  // Обновляем форму при изменении projectDetail
  React.useEffect(() => {
    if (projectDetail) {
      setEditFormData({
        title: projectDetail.title || '',
        subtitle: projectDetail.subtitle || '',
        client: projectDetail.client || '',
        year: projectDetail.year || new Date().getFullYear()
      });
    }
  }, [projectDetail]);

  const handleSave = async () => {
    await onSave(editFormData);
    setEditDialogOpen(false);
  };

  const handleCreate = async () => {
  // Проверяем, что все обязательные поля заполнены
    if (!editFormData.title.trim()) {
        alert('Заголовок обязателен для заполнения');
        return;
    }

    if (!editFormData.client.trim()) {
        alert('Клиент обязателен для заполнения');
        return;
    }

    await onCreate(editFormData);
    setCreateDialogOpen(false);
    };

  if (loading) {
    return (
      <div className="px-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div>Загрузка...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (projectDetail) {
    return (
      <div className="px-6 mb-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Информация о проекте</CardTitle>
                <CardDescription>Основные данные и метаинформация проекта</CardDescription>
              </div>
              <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className='hover:cursor-pointer'>
                    <SquarePen className="mr-2 h-4 w-4" />
                    Редактировать
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Редактирование проекта</DialogTitle>
                    <DialogDescription>
                      Измените основную информацию о проекте
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="title" className="text-right">
                        Заголовок
                      </Label>
                      <Input
                        id="title"
                        value={editFormData.title}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, title: e.target.value }))}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="subtitle" className="text-right">
                        Подзаголовок
                      </Label>
                      <Input
                        id="subtitle"
                        value={editFormData.subtitle}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="client" className="text-right">
                        Клиент
                      </Label>
                      <Input
                        id="client"
                        value={editFormData.client}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, client: e.target.value }))}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="year" className="text-right">
                        Год
                      </Label>
                      <Input
                        id="year"
                        type="number"
                        value={editFormData.year}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, year: parseInt(e.target.value) || new Date().getFullYear() }))}
                        className="col-span-3"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setEditDialogOpen(false)}
                      disabled={saving}
                      className='hover:cursor-pointer'
                    >
                      <X className="mr-2 h-4 w-4" />
                      Отмена
                    </Button>
                    <Button 
                      onClick={handleSave}
                      disabled={saving}
                      className='hover:cursor-pointer'
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
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Заголовок:</span>
                <span>{projectDetail.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Подзаголовок:</span>
                <span>{projectDetail.subtitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Клиент:</span>
                <span>{projectDetail.client}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Год:</span>
                <span>{projectDetail.year}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-6 mb-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Информация о проекте</CardTitle>
              <CardDescription>Основные данные и метаинформация проекта</CardDescription>
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className='hover:cursor-pointer'>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Создать детали
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Создание деталей проекта</DialogTitle>
                  <DialogDescription>
                    Добавьте основную информацию о проекте
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="create-title" className="text-right">
                      Заголовок
                    </Label>
                    <Input
                      id="create-title"
                      value={editFormData.title}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="col-span-3"
                      placeholder="Введите заголовок"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="create-subtitle" className="text-right">
                      Подзаголовок
                    </Label>
                    <Input
                      id="create-subtitle"
                      value={editFormData.subtitle}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                      className="col-span-3"
                      placeholder="Введите подзаголовок"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="create-client" className="text-right">
                      Клиент
                    </Label>
                    <Input
                      id="create-client"
                      value={editFormData.client}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, client: e.target.value }))}
                      className="col-span-3"
                      placeholder="Введите имя клиента"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="create-year" className="text-right">
                      Год
                    </Label>
                    <Input
                      id="create-year"
                      type="number"
                      value={editFormData.year}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, year: parseInt(e.target.value) || new Date().getFullYear() }))}
                      className="col-span-3"
                      min="1900"
                      max={new Date().getFullYear() + 10}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setCreateDialogOpen(false)}
                    disabled={saving}
                    className='hover:cursor-pointer'
                  >
                    <X className="mr-2 h-4 w-4" />
                    Отмена
                  </Button>
                  <Button 
                    onClick={handleCreate}
                    disabled={saving}
                    className='hover:cursor-pointer'
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Создание...
                      </>
                    ) : (
                      <>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Создать
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Детали проекта не найдены</p>
            <p className="text-sm mt-2">Нажмите кнопку &quot;Создать детали&quot; для добавления информации о проекте</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectDetailsSection;