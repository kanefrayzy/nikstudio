/**
 * Homepage Content Management
 * 
 * TypeScript interfaces and helper functions for managing homepage content
 * from the CMS API.
 */

/**
 * Core content interface representing a single content item
 */
export interface HomepageContent {
  id: number;
  section: string;
  content_type: 'text' | 'image';
  content_key: string;
  content_value: string;
  order_index: number;
  metadata?: {
    alt_text?: string;
    width?: number;
    height?: number;
    [key: string]: any;
  };
  created_at?: string;
  updated_at?: string;
}

/**
 * Content grouped by sections for the homepage
 */
export interface HomepageContentBySections {
  hero?: HomepageContent[];
  main_content?: HomepageContent[];
  services_1?: HomepageContent[];
  services_2?: HomepageContent[];
  services_3?: HomepageContent[];
  services_4?: HomepageContent[];
  services_5?: HomepageContent[];
  services_6?: HomepageContent[];
  services_7?: HomepageContent[];
  testimonials_1?: HomepageContent[];
  testimonials_2?: HomepageContent[];
  testimonials_3?: HomepageContent[];
  testimonials_4?: HomepageContent[];
  testimonials_5?: HomepageContent[];
  testimonials_6?: HomepageContent[];
  [key: string]: HomepageContent[] | undefined;
}

/**
 * Get text content value by key from a content array
 * 
 * @param content - Array of homepage content items
 * @param key - The content_key to search for
 * @param fallback - Default value if content not found
 * @returns The content value or fallback
 */
export function getContentValue(
  content: HomepageContent[] | undefined,
  key: string,
  fallback: string = ''
): string {
  if (!content || !Array.isArray(content)) {
    return fallback;
  }

  const item = content.find(c => c.content_key === key);
  return item?.content_value || fallback;
}

/**
 * Get image URL by key from a content array
 * Handles path normalization for Laravel storage URLs
 * 
 * @param content - Array of homepage content items
 * @param key - The content_key to search for
 * @param fallback - Default image path if content not found
 * @returns The normalized image URL or fallback
 */
export function getImageUrl(
  content: HomepageContent[] | undefined,
  key: string,
  fallback: string = ''
): string {
  if (!content || !Array.isArray(content)) {
    return fallback;
  }

  const item = content.find(
    c => c.content_key === key && c.content_type === 'image'
  );

  if (!item) {
    return fallback;
  }

  const path = item.content_value;

  // If it's already a full URL, return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // If it's a local path starting with /images/, return as-is
  if (path.startsWith('/images/')) {
    return path;
  }

  // Otherwise, construct the full storage URL
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
  return `${apiUrl}/storage/${path}`;
}

/**
 * API Client Functions
 */

/**
 * Fetch all homepage content from the API
 * Uses ISR with 30-minute revalidation
 * 
 * @returns Homepage content grouped by sections, or null on error
 */
export async function getHomepageContent(): Promise<HomepageContentBySections | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    
    if (!apiUrl) {
      console.error('NEXT_PUBLIC_API_URL is not defined');
      return null;
    }

    const response = await fetch(`${apiUrl}/api/homepage-content`, {
      next: { revalidate: 0 }, // Always fetch fresh data
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch homepage content: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    
    if (!data.success) {
      console.error('API returned unsuccessful response');
      return null;
    }

    return data.data as HomepageContentBySections;
  } catch (error) {
    console.error('Error fetching homepage content:', error);
    return null;
  }
}

/**
 * Get authentication token from cookies
 * 
 * @returns Token string or null if not found
 */
function getAuthToken(): string | null {
  if (typeof document === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'admin-token') {
      return value;
    }
  }
  return null;
}

/**
 * Update homepage content items (admin only)
 * Requires authentication
 * 
 * @param items - Array of content items to update
 * @returns True if successful, throws error otherwise
 * @throws Error with user-friendly message in Russian
 */
export async function updateHomepageContent(
  items: Partial<HomepageContent>[]
): Promise<boolean> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    
    console.log('[updateHomepageContent] Starting update...', { itemsCount: items.length });
    
    if (!apiUrl) {
      throw new Error('Ошибка конфигурации: API URL не определен');
    }

    const token = getAuthToken();
    console.log('[updateHomepageContent] Token:', token ? `${token.substring(0, 20)}...` : 'NOT FOUND');
    
    if (!token) {
      throw new Error('Требуется авторизация');
    }

    console.log('[updateHomepageContent] Sending request to:', `${apiUrl}/api/homepage-content`);
    console.log('[updateHomepageContent] Items:', items);

    const response = await fetch(`${apiUrl}/api/homepage-content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ items }),
      credentials: 'include',
    });

    console.log('[updateHomepageContent] Response status:', response.status);

    if (!response.ok) {
      // Handle specific HTTP error codes
      if (response.status === 413) {
        throw new Error('Размер данных превышает допустимый лимит');
      }
      
      if (response.status === 422) {
        const errorData = await response.json();
        console.error('[updateHomepageContent] Validation error:', errorData);
        const errorMessage = errorData.message || 'Ошибка валидации данных';
        throw new Error(errorMessage);
      }
      
      if (response.status === 401) {
        console.error('[updateHomepageContent] Unauthorized');
        throw new Error('Требуется авторизация');
      }
      
      if (response.status === 500) {
        const errorText = await response.text();
        console.error('[updateHomepageContent] Server error:', errorText);
        throw new Error('Ошибка сервера. Попробуйте позже');
      }
      
      const errorText = await response.text();
      console.error('[updateHomepageContent] Unknown error:', response.status, errorText);
      throw new Error('Ошибка сохранения данных');
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Ошибка сохранения данных');
    }

    // Trigger revalidation for the homepage
    try {
      await fetch('/api/revalidate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path: '/' }),
      });
    } catch (revalidateError) {
      console.warn('Failed to trigger revalidation:', revalidateError);
      // Don't throw - the content was saved successfully
    }

    return true;
  } catch (error) {
    console.error('Error updating homepage content:', error);
    throw error;
  }
}

/**
 * Upload an image for homepage content (admin only)
 * Validates file size on client side before upload
 * Requires authentication
 * 
 * @param file - Image file to upload (max 2MB)
 * @returns Normalized file path (without /storage/ prefix)
 * @throws Error with user-friendly message in Russian
 */
export async function uploadHomepageImage(file: File): Promise<string> {
  try {
    // Client-side file size validation (2MB max)
    const maxSize = 2 * 1024 * 1024; // 2MB in bytes
    if (file.size > maxSize) {
      throw new Error('Размер изображения не должен превышать 2 МБ');
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Разрешены только файлы форматов: JPG, PNG, WEBP, SVG');
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    
    if (!apiUrl) {
      throw new Error('Ошибка конфигурации: API URL не определен');
    }

    const token = getAuthToken();
    if (!token) {
      throw new Error('Требуется авторизация');
    }

    // Use FormData for file upload
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${apiUrl}/api/homepage-content/upload-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      // Handle specific HTTP error codes
      if (response.status === 413) {
        throw new Error('Размер файла превышает допустимый лимит (2 МБ)');
      }
      
      if (response.status === 422) {
        const errorData = await response.json();
        const errorMessage = errorData.message || 'Ошибка валидации файла';
        throw new Error(errorMessage);
      }
      
      if (response.status === 401) {
        throw new Error('Требуется авторизация');
      }
      
      if (response.status === 500) {
        throw new Error('Ошибка сервера. Попробуйте позже');
      }
      
      throw new Error('Ошибка загрузки изображения');
    }

    const data = await response.json();
    
    if (!data.success || !data.data?.path) {
      throw new Error(data.message || 'Ошибка загрузки изображения');
    }

    // Return the normalized path (without /storage/ prefix)
    return data.data.path;
  } catch (error) {
    console.error('Error uploading homepage image:', error);
    throw error;
  }
}
