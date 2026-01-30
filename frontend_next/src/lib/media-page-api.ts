/**
 * API functions for Media Page management
 * Uses centralized API client with automatic token handling
 */

import { get, put, post, del } from '@/lib/api';

// Types
export interface MediaPageContent {
  hero_title: string;
  hero_description: string;
  testimonials_title: string;
  testimonials_subtitle: string;
  process_title: string;
  process_subtitle: string;
}

export interface MediaService {
  id: number;
  title: string;
  description: string;
  dark_background: boolean;
  order: number;
  features: ServiceFeature[];
  mediaItems?: MediaItem[];
}

export interface ServiceFeature {
  id: number;
  title: string;
  description: string[];
  order: number;
}

export interface MediaItem {
  id: number;
  group_id: number;
  media_type: 'main' | 'secondary';
  file_type: 'image' | 'video';
  file_path: string;
  poster_path?: string;
  alt_text: string;
  order: number;
}

export interface Testimonial {
  id: number;
  company: string;
  quote: string;
  description: string;
  image_path: string;
  order: number;
}

export interface ProcessStep {
  id: number;
  step_number: string;
  title: string;
  subtitle: string;
  image_path: string;
  description_left: string;
  description_right: string;
  order: number;
}

// API Response types
interface ApiResponse<T> {
  success?: boolean;
  status?: string;
  data?: T;
  message?: string;
}

// Media Page Content APIs
export const getMediaPageContent = async (): Promise<MediaPageContent | null> => {
  try {
    const response = await get<ApiResponse<MediaPageContent>>('/api/admin/media-page');
    return response.data || null;
  } catch (error) {
    console.error('Error loading media page content:', error);
    return null;
  }
};

export const updateHeroContent = async (title: string, description: string): Promise<boolean> => {
  try {
    const response = await put<ApiResponse<any>>('/api/admin/media-page/hero', {
      hero_title: title,
      hero_description: description
    });
    return response.success || response.status === 'success';
  } catch (error) {
    console.error('Error updating hero content:', error);
    throw error;
  }
};

export const updateTestimonialsHeader = async (title: string, subtitle: string): Promise<boolean> => {
  try {
    const response = await put<ApiResponse<any>>('/api/admin/media-page/testimonials-header', {
      testimonials_title: title,
      testimonials_subtitle: subtitle
    });
    return response.success || response.status === 'success';
  } catch (error) {
    console.error('Error updating testimonials header:', error);
    throw error;
  }
};

export const updateProcessHeader = async (title: string, subtitle: string): Promise<boolean> => {
  try {
    const response = await put<ApiResponse<any>>('/api/admin/media-page/process-header', {
      process_title: title,
      process_subtitle: subtitle
    });
    return response.success || response.status === 'success';
  } catch (error) {
    console.error('Error updating process header:', error);
    throw error;
  }
};

// Services APIs
export const getMediaServices = async (): Promise<MediaService[]> => {
  try {
    const response = await get<ApiResponse<MediaService[]>>('/api/media-services');
    if (response.status === 'success' && response.data) {
      return response.data.map(service => ({
        ...service,
        mediaItems: service.mediaItems || []
      }));
    }
    return [];
  } catch (error) {
    console.error('Error loading media services:', error);
    return [];
  }
};

export const deleteMediaService = async (serviceId: number): Promise<boolean> => {
  try {
    const response = await del<ApiResponse<any>>(`/api/media-services/${serviceId}`);
    return response.status === 'success';
  } catch (error) {
    console.error('Error deleting media service:', error);
    throw error;
  }
};

export const moveMediaService = async (serviceId: number, direction: 'up' | 'down'): Promise<boolean> => {
  try {
    const response = await put<ApiResponse<any>>(`/api/media-services/${serviceId}/move-${direction}`);
    return response.status === 'success';
  } catch (error) {
    console.error(`Error moving media service ${direction}:`, error);
    throw error;
  }
};

// Testimonials APIs
export const getMediaTestimonials = async (): Promise<Testimonial[]> => {
  try {
    const response = await get<ApiResponse<Testimonial[]>>('/api/admin/media-testimonials');
    return response.status === 'success' && response.data ? response.data : [];
  } catch (error) {
    console.error('Error loading testimonials:', error);
    return [];
  }
};

export const deleteMediaTestimonial = async (testimonialId: number): Promise<boolean> => {
  try {
    const response = await del<ApiResponse<any>>(`/api/admin/media-testimonials/${testimonialId}`);
    return response.status === 'success';
  } catch (error) {
    console.error('Error deleting testimonial:', error);
    throw error;
  }
};

export const reorderMediaTestimonials = async (testimonials: { id: number; order: number }[]): Promise<boolean> => {
  try {
    const response = await post<ApiResponse<any>>('/api/admin/media-testimonials/reorder', {
      testimonials
    });
    return response.status === 'success';
  } catch (error) {
    console.error('Error reordering testimonials:', error);
    throw error;
  }
};

// Process Steps APIs
export const getMediaProcessSteps = async (): Promise<ProcessStep[]> => {
  try {
    const response = await get<ApiResponse<ProcessStep[]>>('/api/admin/media-process-steps');
    return response.status === 'success' && response.data ? response.data : [];
  } catch (error) {
    console.error('Error loading process steps:', error);
    return [];
  }
};

export const deleteMediaProcessStep = async (stepId: number): Promise<boolean> => {
  try {
    const response = await del<ApiResponse<any>>(`/api/admin/media-process-steps/${stepId}`);
    return response.status === 'success';
  } catch (error) {
    console.error('Error deleting process step:', error);
    throw error;
  }
};

export const reorderMediaProcessSteps = async (steps: { id: number; order: number }[]): Promise<boolean> => {
  try {
    const response = await post<ApiResponse<any>>('/api/admin/media-process-steps/reorder', {
      steps
    });
    return response.status === 'success';
  } catch (error) {
    console.error('Error reordering process steps:', error);
    throw error;
  }
};
