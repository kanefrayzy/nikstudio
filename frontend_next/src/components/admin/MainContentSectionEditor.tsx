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

interface MainContentSectionEditorProps {
  content: HomepageContent[];
  onChange: (key: string, value: string) => void;
}

export const MainContentSectionEditor: React.FC<MainContentSectionEditorProps> = ({ 
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
    <div className="space-y-8">
      {/* Text Content Section */}
      <Card>
        <CardHeader>
          <CardTitle>Текстовый контент</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Content Heading */}
          <div>
            <Label htmlFor="main_content_heading">Заголовок секции</Label>
            <Input
              id="main_content_heading"
              value={getContentValue(content, 'main_content_heading', '')}
              onChange={(e) => onChange('main_content_heading', e.target.value)}
              placeholder="дизайн-бюро NIKstudio"
              className="mt-2"
            />
          </div>

          {/* Main Content Title */}
          <div>
            <Label htmlFor="main_content_title">Основной заголовок</Label>
            <Input
              id="main_content_title"
              value={getContentValue(content, 'main_content_title', '')}
              onChange={(e) => onChange('main_content_title', e.target.value)}
              placeholder="комплексные решения, мощный визуал"
              className="mt-2"
            />
          </div>

          {/* Main Content Paragraph 1 */}
          <div>
            <Label htmlFor="main_content_paragraph_1">Первый абзац</Label>
            <Textarea
              id="main_content_paragraph_1"
              value={getContentValue(content, 'main_content_paragraph_1', '')}
              onChange={(e) => onChange('main_content_paragraph_1', e.target.value)}
              rows={4}
              placeholder="Описание компании и услуг..."
              className="mt-2"
            />
          </div>

          {/* Main Content Paragraph 2 */}
          <div>
            <Label htmlFor="main_content_paragraph_2">Второй абзац</Label>
            <Textarea
              id="main_content_paragraph_2"
              value={getContentValue(content, 'main_content_paragraph_2', '')}
              onChange={(e) => onChange('main_content_paragraph_2', e.target.value)}
              rows={4}
              placeholder="Дополнительное описание..."
              className="mt-2"
            />
          </div>

          {/* Clients Heading */}
          <div>
            <Label htmlFor="main_content_clients_heading">Заголовок секции клиентов</Label>
            <Input
              id="main_content_clients_heading"
              value={getContentValue(content, 'main_content_clients_heading', '')}
              onChange={(e) => onChange('main_content_clients_heading', e.target.value)}
              placeholder="Работали с компаниями -"
              className="mt-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Client Logos Section */}
      <Card>
        <CardHeader>
          <CardTitle>Логотипы клиентов</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Client Logo 1 */}
            <div>
              <ImageUpload
                label="Логотип клиента 1"
                currentImage={getImageUrl(content, 'client_logo_1', '')}
                onUpload={(file) => handleImageUpload('client_logo_1', file)}
                maxSize={2 * 1024 * 1024}
              />
            </div>

            {/* Client Logo 2 */}
            <div>
              <ImageUpload
                label="Логотип клиента 2"
                currentImage={getImageUrl(content, 'client_logo_2', '')}
                onUpload={(file) => handleImageUpload('client_logo_2', file)}
                maxSize={2 * 1024 * 1024}
              />
            </div>

            {/* Client Logo 3 */}
            <div>
              <ImageUpload
                label="Логотип клиента 3"
                currentImage={getImageUrl(content, 'client_logo_3', '')}
                onUpload={(file) => handleImageUpload('client_logo_3', file)}
                maxSize={2 * 1024 * 1024}
              />
            </div>

            {/* Client Logo 4 */}
            <div>
              <ImageUpload
                label="Логотип клиента 4"
                currentImage={getImageUrl(content, 'client_logo_4', '')}
                onUpload={(file) => handleImageUpload('client_logo_4', file)}
                maxSize={2 * 1024 * 1024}
              />
            </div>

            {/* Client Logo 5 */}
            <div>
              <ImageUpload
                label="Логотип клиента 5"
                currentImage={getImageUrl(content, 'client_logo_5', '')}
                onUpload={(file) => handleImageUpload('client_logo_5', file)}
                maxSize={2 * 1024 * 1024}
              />
            </div>

            {/* Client Logo 6 */}
            <div>
              <ImageUpload
                label="Логотип клиента 6"
                currentImage={getImageUrl(content, 'client_logo_6', '')}
                onUpload={(file) => handleImageUpload('client_logo_6', file)}
                maxSize={2 * 1024 * 1024}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
