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

interface TestimonialsSectionEditorProps {
  content: Record<string, HomepageContent[]>;
  onChange: (section: string, key: string, value: string) => void;
}

export const TestimonialsSectionEditor: React.FC<TestimonialsSectionEditorProps> = ({ 
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

  // Render a single testimonial card
  const renderTestimonialCard = (testimonialNumber: number) => {
    const section = `testimonials_${testimonialNumber}`;
    const sectionContent = content[section] || [];
    const prefix = `testimonial_${testimonialNumber}`;

    return (
      <Card key={section}>
        <CardHeader>
          <CardTitle>Отзыв {testimonialNumber}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quote */}
          <div>
            <Label htmlFor={`${prefix}_quote`}>Текст отзыва</Label>
            <Textarea
              id={`${prefix}_quote`}
              value={getContentValue(sectionContent, `${prefix}_quote`, '')}
              onChange={(e) => onChange(section, `${prefix}_quote`, e.target.value)}
              rows={4}
              placeholder="Основной текст отзыва"
              className="mt-2"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor={`${prefix}_description`}>Дополнительное описание</Label>
            <Textarea
              id={`${prefix}_description`}
              value={getContentValue(sectionContent, `${prefix}_description`, '')}
              onChange={(e) => onChange(section, `${prefix}_description`, e.target.value)}
              rows={3}
              placeholder="Дополнительная информация"
              className="mt-2"
            />
          </div>

          {/* Author Name */}
          <div>
            <Label htmlFor={`${prefix}_author_name`}>Имя автора</Label>
            <Input
              id={`${prefix}_author_name`}
              value={getContentValue(sectionContent, `${prefix}_author_name`, '')}
              onChange={(e) => onChange(section, `${prefix}_author_name`, e.target.value)}
              placeholder="Имя и фамилия"
              className="mt-2"
            />
          </div>

          {/* Author Company */}
          <div>
            <Label htmlFor={`${prefix}_author_company`}>Компания</Label>
            <Input
              id={`${prefix}_author_company`}
              value={getContentValue(sectionContent, `${prefix}_author_company`, '')}
              onChange={(e) => onChange(section, `${prefix}_author_company`, e.target.value)}
              placeholder="Название компании"
              className="mt-2"
            />
          </div>

          {/* Author Photo */}
          <div>
            <ImageUpload
              label="Фото автора"
              currentImage={getImageUrl(sectionContent, `${prefix}_author_photo`, '')}
              onUpload={(file) => handleImageUpload(section, `${prefix}_author_photo`, file)}
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
        <h3 className="text-lg font-semibold">Редактирование отзывов</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Управление контентом для всех 6 отзывов на главной странице
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {[1, 2, 3, 4, 5, 6].map(testimonialNumber => renderTestimonialCard(testimonialNumber))}
      </div>
    </div>
  );
};
