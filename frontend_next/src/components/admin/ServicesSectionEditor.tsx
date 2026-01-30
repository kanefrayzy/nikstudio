"use client"

import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { 
  getContentValue, 
  getImageUrl,
  uploadHomepageImage,
  type HomepageContent 
} from "@/lib/homepage-content";

interface ServicesSectionEditorProps {
  content: Record<string, HomepageContent[]>;
  onChange: (section: string, key: string, value: string) => void;
}

export const ServicesSectionEditor: React.FC<ServicesSectionEditorProps> = ({ 
  content, 
  onChange 
}) => {
  // Handle image upload
  const handleImageUpload = async (section: string, key: string, file: File): Promise<string> => {
    try {
      const path = await uploadHomepageImage(file);
      onChange(section, key, path);
      return path;
    } catch (error) {
      throw error;
    }
  };

  // Parse features from JSON string
  const parseFeatures = (featuresStr: string): string => {
    try {
      const parsed = JSON.parse(featuresStr);
      return Array.isArray(parsed) ? parsed.join('\n') : featuresStr;
    } catch {
      return featuresStr;
    }
  };

  // Convert features text to JSON string
  const stringifyFeatures = (featuresText: string): string => {
    const lines = featuresText.split('\n').filter(line => line.trim());
    return JSON.stringify(lines);
  };

  // Render a single service card
  const renderServiceCard = (serviceNumber: number) => {
    const section = `services_${serviceNumber}`;
    const sectionContent = content[section] || [];
    const prefix = `service_${serviceNumber}`;

    const featuresValue = getContentValue(sectionContent, `${prefix}_features`, '');
    const featuresText = parseFeatures(featuresValue);

    return (
      <Card key={section}>
        <CardHeader>
          <CardTitle>Услуга {serviceNumber}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Title */}
          <div>
            <Label htmlFor={`${prefix}_title`}>Заголовок</Label>
            <Input
              id={`${prefix}_title`}
              value={getContentValue(sectionContent, `${prefix}_title`, '')}
              onChange={(e) => onChange(section, `${prefix}_title`, e.target.value)}
              placeholder="Название услуги"
              className="mt-2"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor={`${prefix}_description`}>Описание</Label>
            <Textarea
              id={`${prefix}_description`}
              value={getContentValue(sectionContent, `${prefix}_description`, '')}
              onChange={(e) => onChange(section, `${prefix}_description`, e.target.value)}
              rows={4}
              placeholder="Подробное описание услуги"
              className="mt-2"
            />
          </div>

          {/* Subtitle */}
          <div>
            <Label htmlFor={`${prefix}_subtitle`}>Подзаголовок</Label>
            <Input
              id={`${prefix}_subtitle`}
              value={getContentValue(sectionContent, `${prefix}_subtitle`, '')}
              onChange={(e) => onChange(section, `${prefix}_subtitle`, e.target.value)}
              placeholder="Краткий подзаголовок"
              className="mt-2"
            />
          </div>

          {/* Features */}
          <div>
            <Label htmlFor={`${prefix}_features`}>Особенности</Label>
            <Textarea
              id={`${prefix}_features`}
              value={featuresText}
              onChange={(e) => {
                const jsonValue = stringifyFeatures(e.target.value);
                onChange(section, `${prefix}_features`, jsonValue);
              }}
              rows={4}
              placeholder="Каждая особенность с новой строки"
              className="mt-2"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Введите каждую особенность с новой строки
            </p>
          </div>

          {/* Image */}
          <div>
            <ImageUpload
              label="Изображение услуги"
              currentImage={getImageUrl(sectionContent, `${prefix}_image`, '')}
              onUpload={(file) => handleImageUpload(section, `${prefix}_image`, file)}
              maxSize={2 * 1024 * 1024}
            />
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Редактирование услуг</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Управление контентом для всех 7 услуг на главной странице
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {[1, 2, 3, 4, 5, 6, 7].map(serviceNumber => renderServiceCard(serviceNumber))}
      </div>
    </div>
  );
};
