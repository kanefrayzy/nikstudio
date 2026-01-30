'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Plus,
  Trash2,
  GripVertical,
  Edit,
  Save,
  X
} from "lucide-react";
import { useDrag, useDrop } from 'react-dnd';

interface ServiceFeature {
  id?: number;
  title: string;
  description: string[];
  order: number;
}

interface ServiceFeaturesManagerProps {
  features: ServiceFeature[];
  onFeaturesChange: (features: ServiceFeature[]) => void;
  serviceId?: number;
}

interface DragItem {
  index: number;
  type: string;
}

const DRAG_TYPE = 'FEATURE_ITEM';

// Individual feature item component with drag-and-drop
function FeatureItem({ 
  feature, 
  index, 
  onEdit, 
  onDelete, 
  moveFeature 
}: {
  feature: ServiceFeature;
  index: number;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
  moveFeature: (dragIndex: number, hoverIndex: number) => void;
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
        moveFeature(item.index, index);
        item.index = index;
      }
    },
  });

  return (
    <div
      ref={(node) => {
        drag(drop(node));
      }}
      className={`border rounded-lg p-4 bg-white cursor-move ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <GripVertical className="w-5 h-5 text-gray-400 mt-1" />
          <div className="flex-1">
            <h4 className="font-medium text-sm mb-2">{feature.title}</h4>
            <div className="text-sm text-gray-600 space-y-1">
              {feature.description.map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>
          </div>
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
    </div>
  );
}

// Feature edit form component
function FeatureEditForm({ 
  feature, 
  onSave, 
  onCancel 
}: {
  feature: ServiceFeature;
  onSave: (feature: ServiceFeature) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<ServiceFeature>(feature);
  const [descriptionText, setDescriptionText] = useState(
    feature.description.join('\n\n')
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const description = descriptionText
      .split('\n\n')
      .map(p => p.trim())
      .filter(p => p.length > 0);

    onSave({
      ...formData,
      description
    });
  };

  return (
    <Card className="border-2 border-blue-200">
      <CardHeader>
        <CardTitle className="text-lg">
          {feature.id ? 'Редактировать функцию' : 'Добавить функцию'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="feature_title">Заголовок функции *</Label>
            <Input
              id="feature_title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Введите заголовок функции"
              required
              maxLength={255}
            />
            <p className="text-sm text-muted-foreground">
              Заголовок функции ({formData.title.length}/255)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="feature_description">Описание функции *</Label>
            <Textarea
              id="feature_description"
              value={descriptionText}
              onChange={(e) => setDescriptionText(e.target.value)}
              placeholder="Введите описание функции. Разделяйте абзацы двойным переносом строки."
              rows={6}
              required
            />
            <p className="text-sm text-muted-foreground">
              Разделяйте абзацы двойным переносом строки (Enter + Enter)
            </p>
          </div>

          <div className="flex justify-end space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
            >
              <X className="w-4 h-4 mr-2" />
              Отмена
            </Button>
            <Button 
              type="submit"
              disabled={!formData.title.trim() || !descriptionText.trim()}
            >
              <Save className="w-4 h-4 mr-2" />
              {feature.id ? 'Обновить' : 'Добавить'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function ServiceFeaturesManager({ 
  features, 
  onFeaturesChange, 
  serviceId: _serviceId 
}: ServiceFeaturesManagerProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const moveFeature = useCallback((dragIndex: number, hoverIndex: number) => {
    const newFeatures = [...features];
    const draggedFeature = newFeatures[dragIndex];
    
    newFeatures.splice(dragIndex, 1);
    newFeatures.splice(hoverIndex, 0, draggedFeature);
    
    // Update order values
    const updatedFeatures = newFeatures.map((feature, index) => ({
      ...feature,
      order: index + 1
    }));
    
    onFeaturesChange(updatedFeatures);
  }, [features, onFeaturesChange]);

  const handleAddFeature = () => {
    setIsAdding(true);
    setEditingIndex(null);
  };

  const handleEditFeature = (index: number) => {
    setEditingIndex(index);
    setIsAdding(false);
  };

  const handleDeleteFeature = (index: number) => {
    const newFeatures = features.filter((_, i) => i !== index);
    // Update order values
    const updatedFeatures = newFeatures.map((feature, i) => ({
      ...feature,
      order: i + 1
    }));
    onFeaturesChange(updatedFeatures);
  };

  const handleSaveFeature = (feature: ServiceFeature) => {
    if (isAdding) {
      // Add new feature
      const newFeature = {
        ...feature,
        order: features.length + 1
      };
      onFeaturesChange([...features, newFeature]);
      setIsAdding(false);
    } else if (editingIndex !== null) {
      // Update existing feature
      const newFeatures = [...features];
      newFeatures[editingIndex] = feature;
      onFeaturesChange(newFeatures);
      setEditingIndex(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setIsAdding(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Функции блока услуги</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddFeature}
          disabled={isAdding || editingIndex !== null}
        >
          <Plus className="w-4 h-4 mr-2" />
          Добавить функцию
        </Button>
      </div>

      {/* Add new feature form */}
      {isAdding && (
        <FeatureEditForm
          feature={{
            title: '',
            description: [],
            order: features.length + 1
          }}
          onSave={handleSaveFeature}
          onCancel={handleCancelEdit}
        />
      )}

      {/* Features list */}
      {features.length === 0 && !isAdding ? (
        <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
          <div className="text-gray-400 mb-2">
            <Plus className="w-8 h-8 mx-auto" />
          </div>
          <p className="text-gray-600 mb-2">Функции не добавлены</p>
          <p className="text-sm text-gray-500">
            Добавьте функции для описания возможностей этого блока услуги
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {features.map((feature, index) => (
            <div key={index}>
              {editingIndex === index ? (
                <FeatureEditForm
                  feature={feature}
                  onSave={handleSaveFeature}
                  onCancel={handleCancelEdit}
                />
              ) : (
                <FeatureItem
                  feature={feature}
                  index={index}
                  onEdit={handleEditFeature}
                  onDelete={handleDeleteFeature}
                  moveFeature={moveFeature}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {features.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Перетаскивайте функции за иконку ⋮⋮ для изменения порядка
        </div>
      )}
    </div>
  );
}