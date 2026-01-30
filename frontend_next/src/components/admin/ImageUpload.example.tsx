/**
 * ImageUpload Component - Usage Examples
 * 
 * This file demonstrates how to use the ImageUpload component
 * in different scenarios for the homepage CMS editor.
 */

"use client"

import { ImageUpload } from './ImageUpload';
import { useState } from 'react';

// Example 1: Basic usage with hero logo upload
export function HeroLogoUploadExample() {
  const [logoPath, setLogoPath] = useState<string>('/images/logo.png');

  const handleUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/homepage-content/upload-image`, {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });

    if (!response.ok) {
      if (response.status === 413) {
        throw new Error('Размер файла превышает допустимый лимит (2 МБ)');
      }
      throw new Error('Ошибка загрузки изображения');
    }

    const data = await response.json();
    const newPath = data.data.path;
    setLogoPath(newPath);
    return newPath;
  };

  return (
    <ImageUpload
      currentImage={logoPath}
      onUpload={handleUpload}
      label="Логотип Hero секции"
    />
  );
}

// Example 2: Service image upload with custom max size
export function ServiceImageUploadExample() {
  const handleUpload = async (_file: File): Promise<string> => {
    // Upload logic here
    return '/path/to/uploaded/image.jpg';
  };

  return (
    <ImageUpload
      onUpload={handleUpload}
      label="Изображение услуги"
      maxSize={2 * 1024 * 1024} // 2MB
    />
  );
}

// Example 3: Client logo upload (no current image)
export function ClientLogoUploadExample() {
  const handleUpload = async (_file: File): Promise<string> => {
    // Upload logic here
    return '/path/to/uploaded/logo.jpg';
  };

  return (
    <ImageUpload
      onUpload={handleUpload}
      label="Логотип клиента"
    />
  );
}

// Example 4: Testimonial author photo upload
export function TestimonialPhotoUploadExample() {
  const [photoPath, setPhotoPath] = useState<string>('/images/testimonials/author.jpg');
  const [isDisabled, setIsDisabled] = useState(false);

  const handleUpload = async (_file: File): Promise<string> => {
    setIsDisabled(true);
    try {
      // Upload logic here
      const newPath = '/path/to/uploaded/photo.jpg';
      setPhotoPath(newPath);
      return newPath;
    } finally {
      setIsDisabled(false);
    }
  };

  return (
    <ImageUpload
      currentImage={photoPath}
      onUpload={handleUpload}
      label="Фото автора отзыва"
      disabled={isDisabled}
    />
  );
}

// Example 5: Multiple image uploads in a form
export function MultipleImageUploadsExample() {
  const [images, setImages] = useState({
    hero_logo: '/images/logo.png',
    client_logo_1: '/images/clients/client1.png',
    client_logo_2: '/images/clients/client2.png',
  });

  const createUploadHandler = (key: string) => async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/homepage-content/upload-image`, {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });

    if (!response.ok) {
      if (response.status === 413) {
        throw new Error('Размер файла превышает допустимый лимит (2 МБ)');
      }
      throw new Error('Ошибка загрузки изображения');
    }

    const data = await response.json();
    const newPath = data.data.path;
    
    setImages(prev => ({
      ...prev,
      [key]: newPath
    }));

    return newPath;
  };

  return (
    <div className="space-y-6">
      <ImageUpload
        currentImage={images.hero_logo}
        onUpload={createUploadHandler('hero_logo')}
        label="Логотип Hero"
      />
      
      <ImageUpload
        currentImage={images.client_logo_1}
        onUpload={createUploadHandler('client_logo_1')}
        label="Логотип клиента 1"
      />
      
      <ImageUpload
        currentImage={images.client_logo_2}
        onUpload={createUploadHandler('client_logo_2')}
        label="Логотип клиента 2"
      />
    </div>
  );
}
