'use client';

import React, { useState, useCallback } from 'react';
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import apiClient from '@/lib/api';
import { 
  Plus,
  Trash2,
  GripVertical,
  Edit,
  // Save,
  // X,
  AlertCircle,
  Image as ImageIcon,
  Video
} from "lucide-react";
import { useDrag, useDrop } from 'react-dnd';
import { MediaUploadGroup } from './MediaUploadGroup';

interface MediaItem {
  id?: number;
  group_id: number;
  media_type: 'main' | 'secondary';
  file_type: 'image' | 'video';
  file_path: string;
  poster_path?: string;
  alt_text: string;
  order: number;
}

interface MediaGroup {
  group_id: number;
  main?: MediaItem;
  secondary?: MediaItem;
  order: number;
}

interface ServiceMediaManagerProps {
  mediaItems: MediaItem[];
  onMediaChange: (mediaItems: MediaItem[]) => void;
  serviceId?: number;
}

interface DragItem {
  index: number;
  type: string;
}

const DRAG_TYPE = 'MEDIA_GROUP';

// Utility function to group media items by group_id
function groupMediaItems(mediaItems: MediaItem[]): MediaGroup[] {
  const groups: { [key: number]: MediaGroup } = {};
  
  mediaItems.forEach(item => {
    if (!groups[item.group_id]) {
      groups[item.group_id] = {
        group_id: item.group_id,
        order: item.order
      };
    }
    
    if (item.media_type === 'main') {
      groups[item.group_id].main = item;
    } else {
      groups[item.group_id].secondary = item;
    }
  });
  
  return Object.values(groups).sort((a, b) => a.order - b.order);
}

// Utility function to convert groups back to media items
function flattenMediaGroups(groups: MediaGroup[]): MediaItem[] {
  const items: MediaItem[] = [];
  
  groups.forEach((group, index) => {
    const order = index + 1;
    
    if (group.main) {
      items.push({ ...group.main, order });
    }
    if (group.secondary) {
      items.push({ ...group.secondary, order });
    }
  });
  
  return items;
}

// File validation utility
const _validateFileSize = (file: File, type: 'image' | 'video'): boolean => {
  const maxSize = type === 'image' ? 2 * 1024 * 1024 : 50 * 1024 * 1024;
  return file.size <= maxSize;
};

// Media group item component with drag-and-drop
function MediaGroupItem({ 
  group, 
  index, 
  onEdit, 
  onDelete, 
  moveGroup 
}: {
  group: MediaGroup;
  index: number;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
  moveGroup: (dragIndex: number, hoverIndex: number) => void;
}) {
  const [{ isDragging }, drag] = useDrag({
    type: DRAG_TYPE,
    item: { index, type: DRAG_TYPE },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: DRAG_TYPE,
    hover: (item: DragItem) => {
      if (item.index !== index) {
        moveGroup(item.index, index);
        item.index = index;
      }
    },
  });

  const getFileUrl = (filePath: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    return `${apiUrl}/storage/${filePath}`;
  };

  return (
    <div
      ref={(node) => {
        drag(drop(node));
      }}
      className={`border rounded-lg p-4 bg-white cursor-move ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <GripVertical className="w-5 h-5 text-gray-400" />
          <h4 className="font-medium text-sm">Медиа-группа {group.group_id}</h4>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onEdit(index)}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onDelete(index)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Main Media */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-gray-600">Основное медиа</Label>
          {group.main ? (
            <div className="border rounded-lg p-2">
              {group.main.file_type === 'image' ? (
                <div className="aspect-video bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                  <img 
                    src={getFileUrl(group.main.file_path)} 
                    alt={group.main.alt_text}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-video bg-gray-100 rounded flex items-center justify-center overflow-hidden relative">
                  {group.main.poster_path ? (
                    <>
                      <img 
                        src={getFileUrl(group.main.poster_path)} 
                        alt={`${group.main.alt_text} - постер`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <Video className="w-8 h-8 text-white drop-shadow-lg" />
                      </div>
                    </>
                  ) : (
                    <Video className="w-8 h-8 text-gray-400" />
                  )}
                </div>
              )}
              <p className="text-xs text-gray-600 mt-1 truncate">
                {group.main.alt_text || 'Без описания'}
              </p>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center">
              <ImageIcon className="w-6 h-6 text-gray-400 mx-auto mb-1" />
              <p className="text-xs text-gray-500">Не загружено</p>
            </div>
          )}
        </div>

        {/* Secondary Media */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-gray-600">Дополнительное медиа</Label>
          {group.secondary ? (
            <div className="border rounded-lg p-2">
              {group.secondary.file_type === 'image' ? (
                <div className="aspect-video bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                  <img 
                    src={getFileUrl(group.secondary.file_path)} 
                    alt={group.secondary.alt_text}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-video bg-gray-100 rounded flex items-center justify-center overflow-hidden relative">
                  {group.secondary.poster_path ? (
                    <>
                      <img 
                        src={getFileUrl(group.secondary.poster_path)} 
                        alt={`${group.secondary.alt_text} - постер`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <Video className="w-8 h-8 text-white drop-shadow-lg" />
                      </div>
                    </>
                  ) : (
                    <Video className="w-8 h-8 text-gray-400" />
                  )}
                </div>
              )}
              <p className="text-xs text-gray-600 mt-1 truncate">
                {group.secondary.alt_text || 'Без описания'}
              </p>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center">
              <ImageIcon className="w-6 h-6 text-gray-400 mx-auto mb-1" />
              <p className="text-xs text-gray-500">Не загружено</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Media group edit form component using MediaUploadGroup
function MediaGroupEditForm({ 
  group, 
  onSave, 
  onCancel,
  serviceId 
}: {
  group: MediaGroup | null;
  onSave: (group: MediaGroup) => void;
  onCancel: () => void;
  serviceId?: number;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (formData: FormData, _onProgress?: (progress: number) => void) => {
    if (!serviceId) {
      setError('ID услуги не найден. Сначала сохраните блок услуги.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Отправляем данные на сервер
      const response = await apiClient.post<{ success: boolean; message?: string; data?: any }>(`/api/media-services/${serviceId}/media`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = response.data;

      if (data.success) {
        // Обновляем локальное состояние с данными от сервера
        const savedGroup = data.data;
        
        // Преобразуем ответ сервера в формат MediaGroup
        const newGroup: MediaGroup = {
          group_id: savedGroup.group_id,
          order: savedGroup.order,
          main: savedGroup.main ? {
            id: savedGroup.main.id,
            group_id: savedGroup.group_id,
            media_type: 'main',
            file_type: savedGroup.main.file_type,
            file_path: savedGroup.main.file_path,
            poster_path: savedGroup.main.poster_path,
            alt_text: savedGroup.main.alt_text,
            order: savedGroup.order
          } : undefined,
          secondary: savedGroup.secondary ? {
            id: savedGroup.secondary.id,
            group_id: savedGroup.group_id,
            media_type: 'secondary',
            file_type: savedGroup.secondary.file_type,
            file_path: savedGroup.secondary.file_path,
            poster_path: savedGroup.secondary.poster_path,
            alt_text: savedGroup.secondary.alt_text,
            order: savedGroup.order
          } : undefined
        };

        onSave(newGroup);
      } else {
        throw new Error(data.message || 'Ошибка при загрузке медиа-файлов');
      }
    } catch (err) {
      console.error('Ошибка при сохранении медиа-группы:', err);
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
      throw err; // Re-throw to let MediaUploadGroup handle it
    } finally {
      setLoading(false);
    }
  };

  // Prepare initial data for MediaUploadGroup
  const initialData = group ? {
    mainFile: group.main ? {
      path: group.main.file_path,
      type: group.main.file_type,
      alt: group.main.alt_text,
      posterPath: group.main.poster_path
    } : undefined,
    secondaryFile: group.secondary ? {
      path: group.secondary.file_path,
      type: group.secondary.file_type,
      alt: group.secondary.alt_text,
      posterPath: group.secondary.poster_path
    } : undefined
  } : undefined;

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <MediaUploadGroup
        onUpload={handleUpload}
        uploading={loading}
        onCancel={onCancel}
        initialData={initialData}
      />
    </div>
  );
}

export function ServiceMediaManager({ 
  mediaItems, 
  onMediaChange, 
  serviceId: _serviceId 
}: ServiceMediaManagerProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaGroups = groupMediaItems(mediaItems);

  const moveGroup = useCallback((dragIndex: number, hoverIndex: number) => {
    const newGroups = [...mediaGroups];
    const draggedGroup = newGroups[dragIndex];
    
    newGroups.splice(dragIndex, 1);
    newGroups.splice(hoverIndex, 0, draggedGroup);
    
    // Update order values
    const updatedGroups = newGroups.map((group, index) => ({
      ...group,
      order: index + 1
    }));
    
    const flattenedItems = flattenMediaGroups(updatedGroups);
    onMediaChange(flattenedItems);
  }, [mediaGroups, onMediaChange]);

  const handleAddGroup = () => {
    setIsAdding(true);
    setEditingIndex(null);
  };

  const handleEditGroup = (index: number) => {
    setEditingIndex(index);
    setIsAdding(false);
  };

  const handleDeleteGroup = async (index: number) => {
    const groupToDelete = mediaGroups[index];
    
    if (!groupToDelete) {
      return;
    }

    // Если группа имеет ID (существует в базе данных), удаляем с сервера
    if (_serviceId && (groupToDelete.main?.id || groupToDelete.secondary?.id)) {
      try {
        const response = await apiClient.delete<{ status?: string; success?: boolean; message?: string }>(`/api/media-services/${_serviceId}/media/${groupToDelete.group_id}`);
        const data = response.data;
        
        if (data.status !== 'success' && !data.success) {
          throw new Error(data.message || 'Ошибка при удалении медиа-группы с сервера');
        }
      } catch (error: any) {
        console.error('Ошибка при удалении медиа-группы с сервера:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Неизвестная ошибка';
        setError(`Ошибка при удалении медиа-группы: ${errorMessage}`);
        return; // Не удаляем из локального состояния, если не удалось удалить с сервера
      }
    }

    // Удаляем из локального состояния
    const newGroups = mediaGroups.filter((_, i) => i !== index);
    // Update order values
    const updatedGroups = newGroups.map((group, i) => ({
      ...group,
      order: i + 1
    }));
    const flattenedItems = flattenMediaGroups(updatedGroups);
    onMediaChange(flattenedItems);
  };

  const handleSaveGroup = (group: MediaGroup) => {
    if (isAdding) {
      // Add new group
      const newGroup = {
        ...group,
        order: mediaGroups.length + 1
      };
      const newGroups = [...mediaGroups, newGroup];
      const flattenedItems = flattenMediaGroups(newGroups);
      onMediaChange(flattenedItems);
      setIsAdding(false);
    } else if (editingIndex !== null) {
      // Update existing group
      const newGroups = [...mediaGroups];
      newGroups[editingIndex] = group;
      const flattenedItems = flattenMediaGroups(newGroups);
      onMediaChange(flattenedItems);
      setEditingIndex(null);
    } else {
      // Handle case where group is saved but not in editing mode
      // This can happen when media is uploaded directly
      const existingGroupIndex = mediaGroups.findIndex(g => g.group_id === group.group_id);
      
      if (existingGroupIndex >= 0) {
        // Update existing group
        const newGroups = [...mediaGroups];
        newGroups[existingGroupIndex] = group;
        const flattenedItems = flattenMediaGroups(newGroups);
        onMediaChange(flattenedItems);
      } else {
        // Add as new group
        const newGroup = {
          ...group,
          order: mediaGroups.length + 1
        };
        const newGroups = [...mediaGroups, newGroup];
        const flattenedItems = flattenMediaGroups(newGroups);
        onMediaChange(flattenedItems);
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setIsAdding(false);
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Медиа-файлы блока услуги</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddGroup}
          disabled={isAdding || editingIndex !== null}
        >
          <Plus className="w-4 h-4 mr-2" />
          Добавить медиа-группу
        </Button>
      </div>

      {/* Add new group form */}
      {isAdding && (
        <MediaGroupEditForm
          group={null}
          onSave={handleSaveGroup}
          onCancel={handleCancelEdit}
          serviceId={_serviceId}
        />
      )}

      {/* Media groups list */}
      {mediaGroups.length === 0 && !isAdding ? (
        <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
          <div className="text-gray-400 mb-2">
            <ImageIcon className="w-8 h-8 mx-auto" />
          </div>
          <p className="text-gray-600 mb-2">Медиа-файлы не добавлены</p>
          <p className="text-sm text-gray-500">
            Добавьте изображения или видео для карусели этого блока услуги
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {mediaGroups.map((group, index) => (
            <div key={group.group_id}>
              {editingIndex === index ? (
                <MediaGroupEditForm
                  group={group}
                  onSave={handleSaveGroup}
                  onCancel={handleCancelEdit}
                  serviceId={_serviceId}
                />
              ) : (
                <MediaGroupItem
                  group={group}
                  index={index}
                  onEdit={handleEditGroup}
                  onDelete={handleDeleteGroup}
                  moveGroup={moveGroup}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {mediaGroups.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Перетаскивайте медиа-группы за иконку ⋮⋮ для изменения порядка
        </div>
      )}
    </div>
  );
}