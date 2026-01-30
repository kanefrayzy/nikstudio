"use client"

import React from 'react';
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { 
  getContentValue, 
  getImageUrl,
  uploadHomepageImage,
  type HomepageContent 
} from "@/lib/homepage-content";

interface HeroSectionEditorProps {
  content: HomepageContent[];
  onChange: (key: string, value: string) => void;
}

export const HeroSectionEditor: React.FC<HeroSectionEditorProps> = ({ 
  content, 
  onChange 
}) => {
  // Handle image upload
  const handleImageUpload = async (key: string, file: File): Promise<string> => {
    try {
      const path = await uploadHomepageImage(file);
      onChange(key, path);
      return path;
    } catch (error) {
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Title */}
      <div>
        <Label htmlFor="hero_title">Заголовок</Label>
        <Textarea
          id="hero_title"
          value={getContentValue(content, 'hero_title', '')}
          onChange={(e) => onChange('hero_title', e.target.value)}
          rows={3}
          placeholder="Основной заголовок Hero секции"
          className="mt-2"
        />
      </div>

      {/* Hero Subtitle */}
      <div>
        <Label htmlFor="hero_subtitle">Подзаголовок</Label>
        <Textarea
          id="hero_subtitle"
          value={getContentValue(content, 'hero_subtitle', '')}
          onChange={(e) => onChange('hero_subtitle', e.target.value)}
          rows={2}
          placeholder="Подзаголовок Hero секции"
          className="mt-2"
        />
      </div>

      {/* Hero Description */}
      <div>
        <Label htmlFor="hero_description">Описание</Label>
        <Textarea
          id="hero_description"
          value={getContentValue(content, 'hero_description', '')}
          onChange={(e) => onChange('hero_description', e.target.value)}
          rows={5}
          placeholder="Описание услуг (можно использовать <br/> для переноса строк)"
          className="mt-2"
        />
        <p className="text-sm text-muted-foreground mt-1">
          Используйте &lt;br/&gt; для переноса строк
        </p>
      </div>

      {/* Hero Logo */}
      <div>
        <ImageUpload
          label="Логотип"
          currentImage={getImageUrl(content, 'hero_logo', '')}
          onUpload={(file) => handleImageUpload('hero_logo', file)}
          maxSize={2 * 1024 * 1024}
        />
      </div>
    </div>
  );
};
