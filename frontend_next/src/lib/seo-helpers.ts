import { Metadata } from 'next';
import { SEOMetadataGenerator, ContentWithSEO, SEOSettings } from './seo-metadata';

/**
 * Helper functions for generating metadata in Next.js pages
 */

/**
 * Generate metadata for project pages
 */
export async function generateProjectMetadata(slug: string): Promise<Metadata> {
  try {
    // Fetch project data
    const project = await fetchProjectData(slug);

    // Fetch global SEO settings
    const globalSettings = await SEOMetadataGenerator.fetchGlobalSettings();

    // Generate metadata
    return SEOMetadataGenerator.generateMetadata({
      content: project,
      globalSettings,
      pageType: 'project',
      slug
    });
  } catch (error) {
    console.error('Error generating project metadata:', error);

    // Return fallback metadata
    return {
      title: 'Проект | NIK Studio',
      description: 'Проект от NIK Studio - комплексные решения для промышленных компаний',
    };
  }
}

/**
 * Generate metadata for blog post pages
 */
export async function generateBlogMetadata(slug: string): Promise<Metadata> {
  try {
    // Fetch blog post data
    const blogPost = await fetchBlogPostData(slug);

    // Fetch global SEO settings
    const globalSettings = await SEOMetadataGenerator.fetchGlobalSettings();

    // Generate metadata
    return SEOMetadataGenerator.generateMetadata({
      content: blogPost,
      globalSettings,
      pageType: 'blog',
      slug
    });
  } catch (error) {
    console.error('Error generating blog metadata:', error);

    // Return fallback metadata
    return {
      title: 'Блог | NIK Studio',
      description: 'Статья блога NIK Studio - дизайн и визуализация для промышленных компаний',
    };
  }
}

/**
 * Generate metadata for homepage
 */
export async function generateHomeMetadata(): Promise<Metadata> {
  try {
    // Fetch global SEO settings
    const globalSettings = await SEOMetadataGenerator.fetchGlobalSettings();

    // Generate metadata
    return SEOMetadataGenerator.generateMetadata({
      content: null,
      globalSettings,
      pageType: 'home'
    });
  } catch (error) {
    console.error('Error generating home metadata:', error);

    // Return fallback metadata
    return {
      title: 'NIK Studio',
      description: 'Комплексные решения для промышленных компаний. Превращаем сложные технологии в понятный визуал.',
    };
  }
}

/**
 * Fetch project data from API
 */
async function fetchProjectData(slug: string): Promise<ContentWithSEO | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const response = await fetch(`${apiUrl}/api/projects/${slug}`, {
      next: { revalidate: 1800 } // Cache for 30 minutes
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch project: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Project not found');
    }

    // Transform project data to ContentWithSEO format
    const project = data.data;
    return {
      seo_title: project.seo_title,
      seo_description: project.seo_description,
      seo_image: project.seo_image,
      title: project.detail?.title,
      main_title: project.main_title,
      description: project.detail?.subtitle || project.projects_page_title,
      main_image: project.main_image,
      created_at: project.created_at,
      updated_at: project.updated_at,
      slug: project.slug
    };
  } catch (error) {
    console.error('Error fetching project data:', error);
    return null;
  }
}

/**
 * Fetch blog post data from API
 */
async function fetchBlogPostData(slug: string): Promise<ContentWithSEO | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const response = await fetch(`${apiUrl}/api/blog-posts/${slug}`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch blog post: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Blog post not found');
    }

    // Transform blog post data to ContentWithSEO format
    const blogPost = data.data;
    return {
      seo_title: blogPost.seo_title,
      seo_description: blogPost.seo_description,
      seo_image: blogPost.seo_image,
      title: blogPost.title,
      main_title: blogPost.title,
      description: blogPost.description,
      main_image: blogPost.image,
      created_at: blogPost.created_at,
      updated_at: blogPost.updated_at,
      slug: blogPost.slug
    };
  } catch (error) {
    console.error('Error fetching blog post data:', error);
    return null;
  }
}

/**
 * Validate SEO field lengths
 */
export function validateSEOFields(data: {
  seo_title?: string;
  seo_description?: string;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (data.seo_title && data.seo_title.length > 60) {
    errors.push('SEO заголовок не должен превышать 60 символов');
  }

  if (data.seo_description && data.seo_description.length > 160) {
    errors.push('SEO описание не должно превышать 160 символов');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Generate preview data for SEO fields
 */
export function generateSEOPreview(data: {
  seo_title?: string;
  seo_description?: string;
  title?: string;
  description?: string;
  globalSettings?: SEOSettings | null;
}): {
  title: string;
  description: string;
  titleLength: number;
  descriptionLength: number;
  titleWarning: boolean;
  descriptionWarning: boolean;
} {
  const { seo_title, seo_description, title, description, globalSettings } = data;

  // Generate effective title and description
  const effectiveTitle = seo_title ||
    (title ? `${title} | ${globalSettings?.site_title || 'NIK Studio'}` : globalSettings?.site_title || 'NIK Studio');

  const effectiveDescription = seo_description ||
    description ||
    globalSettings?.site_description ||
    'Комплексные решения для промышленных компаний';

  return {
    title: effectiveTitle,
    description: effectiveDescription,
    titleLength: effectiveTitle.length,
    descriptionLength: effectiveDescription.length,
    titleWarning: effectiveTitle.length > 60,
    descriptionWarning: effectiveDescription.length > 160
  };
}
